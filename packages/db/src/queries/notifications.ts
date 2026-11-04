/**
 * Notificaciones: la bandeja del destinatario, el marcado como leída y el
 * marcado del correo entregado.
 *
 * Las filas nacen en `createCommentForMember`, dentro de la transacción del
 * comentario. Solo el destinatario (`recipient_user_id`) las lee y las marca;
 * cualquier otro id, o uno de otro usuario, da `undefined`. Cada update filtra
 * además por el `workspace_id` de la propia fila. `emailed_at` se rellena
 * después del commit, solo si `deliverEmail` fue bien.
 *
 * La bandeja, el contador y «marcar todas» se limitan además a los
 * workspaces de los que el destinatario sigue siendo miembro. La bandeja se
 * pagina por keyset sobre `(created_at, id)`, que recorre el índice
 * `(recipient_user_id, created_at)` sin `OFFSET`.
 */
import { and, count, desc, eq, inArray, isNull, lt, or } from "drizzle-orm";

import { db } from "../client.ts";
import { user } from "../schema/auth.ts";
import { task } from "../schema/board.ts";
import { comment } from "../schema/comment.ts";
import { notification } from "../schema/notification.ts";
import { workspaceMember } from "../schema/workspace.ts";

/** Máximo de filas por página de la bandeja. */
export const NOTIFICATION_LIST_LIMIT = 50;

/** Notificación de la bandeja. Las fechas siguen siendo `Date`. */
export type RecipientNotification = {
  id: string;
  kind: string;
  actorName: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  commentBody: string;
  createdAt: Date;
  readAt: Date | null;
};

const notificationColumns = {
  id: notification.id,
  kind: notification.kind,
  actorName: user.name,
  taskId: notification.taskId,
  taskTitle: task.title,
  projectId: task.projectId,
  commentBody: comment.body,
  createdAt: notification.createdAt,
  readAt: notification.readAt,
};

function selectNotifications() {
  return db
    .select(notificationColumns)
    .from(notification)
    .innerJoin(user, eq(user.id, notification.actorUserId))
    .innerJoin(
      task,
      and(eq(task.id, notification.taskId), eq(task.workspaceId, notification.workspaceId)),
    )
    .innerJoin(
      comment,
      and(
        eq(comment.id, notification.commentId),
        eq(comment.workspaceId, notification.workspaceId),
      ),
    );
}

/** Posición de la última fila recibida; la página siguiente empieza detrás. */
export type NotificationCursor = { createdAt: Date; id: string };

/** Filas de `userId` en workspaces de los que sigue siendo miembro. */
function recipientInMemberWorkspaces(userId: string) {
  return and(
    eq(notification.recipientUserId, userId),
    inArray(
      notification.workspaceId,
      db
        .select({ workspaceId: workspaceMember.workspaceId })
        .from(workspaceMember)
        .where(eq(workspaceMember.userId, userId)),
    ),
  );
}

/**
 * Una página de notificaciones de `userId`, de la más nueva a la más
 * antigua, 50 como máximo. Con `before`, solo las estrictamente anteriores a
 * ese `(createdAt, id)`: sin huecos ni repetidas aunque compartan `createdAt`.
 */
export async function listNotificationsForRecipient(
  userId: string,
  before?: NotificationCursor,
): Promise<RecipientNotification[]> {
  const older =
    before === undefined
      ? undefined
      : or(
          lt(notification.createdAt, before.createdAt),
          and(eq(notification.createdAt, before.createdAt), lt(notification.id, before.id)),
        );

  return await selectNotifications()
    .where(and(recipientInMemberWorkspaces(userId), older))
    .orderBy(desc(notification.createdAt), desc(notification.id))
    .limit(NOTIFICATION_LIST_LIMIT);
}

/** Cuántas notificaciones de `userId` siguen sin leer, sin límite de página. */
export async function countUnreadNotificationsForRecipient(userId: string): Promise<number> {
  const [row] = await db
    .select({ unread: count() })
    .from(notification)
    .where(and(recipientInMemberWorkspaces(userId), isNull(notification.readAt)));
  return row?.unread ?? 0;
}

/**
 * Marca como leídas todas las no leídas de `userId` con la misma hora y
 * devuelve cuántas cambió. Las ya leídas conservan su `read_at`.
 */
export async function markAllNotificationsReadForRecipient(userId: string): Promise<number> {
  const result = await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(recipientInMemberWorkspaces(userId), isNull(notification.readAt)));
  return result.rowsAffected;
}

/**
 * Marca como leída la notificación si es de `userId`. Conserva el primer
 * `read_at`: marcarla otra vez no lo cambia. Devuelve la fila o `undefined`.
 */
export async function markNotificationReadForRecipient(
  notificationId: string,
  userId: string,
): Promise<RecipientNotification | undefined> {
  const found = (
    await db
      .select({ workspaceId: notification.workspaceId })
      .from(notification)
      .where(and(eq(notification.id, notificationId), eq(notification.recipientUserId, userId)))
      .limit(1)
  )[0];
  if (found === undefined) {
    return undefined;
  }

  const owned = and(
    eq(notification.id, notificationId),
    eq(notification.recipientUserId, userId),
    eq(notification.workspaceId, found.workspaceId),
  );
  await db
    .update(notification)
    .set({ readAt: new Date() })
    .where(and(owned, isNull(notification.readAt)));

  return (await selectNotifications().where(owned).limit(1))[0];
}

/** Marca `emailed_at` de la notificación con la hora actual. */
export async function markNotificationEmailed(
  notificationId: string,
  workspaceId: string,
): Promise<void> {
  await db
    .update(notification)
    .set({ emailedAt: new Date() })
    .where(and(eq(notification.id, notificationId), eq(notification.workspaceId, workspaceId)));
}
