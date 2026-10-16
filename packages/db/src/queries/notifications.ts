/**
 * Notificaciones: lectura y marca de leída para el destinatario, y marca de
 * envío del email de aula.
 *
 * Las filas nacen dentro de la transacción del comentario
 * (`createCommentForMember`). La campana (`listNotificationsForUser`,
 * `markNotificationReadForUser`) solo ve filas cuyo `recipient_user_id` es el
 * usuario de la sesión y de cuyo workspace sigue siendo miembro; el
 * `workspace_id` sale de la fila, nunca del cliente. Sin autorización devuelven
 * `null` (el llamador responde 404). `markNotificationsEmailed` solo actualiza
 * `emailed_at` cuando el llamador ya confirmó la escritura del outbox.
 */
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { getDb } from "../client.ts";
import { comment, notification, task, user, workspaceMember } from "../schema/index.ts";

/** Notificación lista para serializar: actor, tarea y cuerpo del comentario ya resueltos. */
export type NotificationView = {
  id: string;
  kind: "mention";
  actorName: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  commentBody: string;
  createdAt: Date;
  readAt: Date | null;
};

/** Máximo de filas que devuelve la campana. */
const NOTIFICATION_LIMIT = 50;

/** Selección común de la vista (join con actor, tarea y comentario). */
const notificationViewColumns = {
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

/** Consulta base: destinatario = usuario y membresía vigente en el workspace de la fila. */
function selectNotificationViews(userId: string, notificationId?: string) {
  return getDb()
    .select(notificationViewColumns)
    .from(notification)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, notification.workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .innerJoin(user, eq(user.id, notification.actorUserId))
    .innerJoin(task, eq(task.id, notification.taskId))
    .innerJoin(comment, eq(comment.id, notification.commentId))
    .where(
      and(
        eq(notification.recipientUserId, userId),
        notificationId === undefined ? undefined : eq(notification.id, notificationId),
      ),
    );
}

/** Las 50 notificaciones más recientes del usuario (createdAt DESC, id DESC). */
export async function listNotificationsForUser(userId: string): Promise<NotificationView[]> {
  return selectNotificationViews(userId)
    .orderBy(desc(notification.createdAt), desc(notification.id))
    .limit(NOTIFICATION_LIMIT);
}

/**
 * Marca como leída la notificación del usuario y devuelve la vista releída.
 * Idempotente: si ya estaba leída no cambia `read_at`. `null` si no existe,
 * es de otro usuario o ya no es miembro del workspace.
 */
export async function markNotificationReadForUser(
  notificationId: string,
  userId: string,
): Promise<NotificationView | null> {
  const current = await selectNotificationViews(userId, notificationId).limit(1);
  const row = current[0];

  if (!row) {
    return null;
  }

  if (row.readAt !== null) {
    return row;
  }

  await getDb()
    .update(notification)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notification.id, notificationId),
        eq(notification.recipientUserId, userId),
        isNull(notification.readAt),
      ),
    );

  const reread = await selectNotificationViews(userId, notificationId).limit(1);

  return reread[0] ?? null;
}

/** Marca `emailed_at = at` en las notificaciones con esos ids (no hace nada si no hay ids). */
export async function markNotificationsEmailed(ids: string[], at: Date): Promise<void> {
  if (ids.length === 0) {
    return;
  }

  await getDb().update(notification).set({ emailedAt: at }).where(inArray(notification.id, ids));
}
