/**
 * Comentarios de una tarea: lectura y creación autorizadas.
 *
 * Como en el tablero, la tarea se busca por membresía del `workspace_id` de
 * su fila: el id del cliente solo identifica. `workspace_id` y `project_id`
 * del comentario salen de esa fila y `author_id` es el usuario de la sesión.
 * Sin membresía, o si la tarea no existe, `undefined`. Crear el comentario
 * también crea, en la misma transacción, las notificaciones de sus menciones.
 */
import { randomUUID } from "node:crypto";

import { and, asc, eq, ne } from "drizzle-orm";

import { db } from "../client.ts";
import { user } from "../schema/auth.ts";
import { task } from "../schema/board.ts";
import { comment } from "../schema/comment.ts";
import { notification } from "../schema/notification.ts";
import { workspaceMember } from "../schema/workspace.ts";

/** Comentario devuelto por las consultas. `createdAt` sigue siendo `Date`. */
export type MemberComment = {
  id: string;
  taskId: string;
  projectId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

const commentColumns = {
  id: comment.id,
  taskId: comment.taskId,
  projectId: comment.projectId,
  authorId: comment.authorId,
  authorName: user.name,
  body: comment.body,
  createdAt: comment.createdAt,
};

/**
 * Clave con la que se compara una mención con `user.name`: NFC (una tilde o
 * la ñ cuentan igual escritas precompuestas o con carácter combinado) y
 * `toLowerCase()`, que pliega `Ñ`/`Á` y no depende del locale del proceso.
 */
function mentionKey(value: string): string {
  return value.normalize("NFC").toLowerCase();
}

async function findTaskForMember(taskId: string, userId: string) {
  const rows = await db
    .select({ id: task.id, workspaceId: task.workspaceId, projectId: task.projectId })
    .from(task)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, task.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(task.id, taskId))
    .limit(1);

  return rows[0];
}

/** Comentarios de la tarea por `created_at` e `id` ascendentes. */
export async function listCommentsForMember(
  taskId: string,
  userId: string,
): Promise<MemberComment[] | undefined> {
  const found = await findTaskForMember(taskId, userId);
  if (found === undefined) {
    return undefined;
  }

  return await db
    .select(commentColumns)
    .from(comment)
    .innerJoin(user, eq(user.id, comment.authorId))
    .where(and(eq(comment.taskId, found.id), eq(comment.workspaceId, found.workspaceId)))
    .orderBy(asc(comment.createdAt), asc(comment.id));
}

/** Datos con los que la API redacta el correo de una mención. */
export type MentionEmailInput = {
  actorName: string;
  recipientName: string;
  taskTitle: string;
  projectId: string;
  commentBody: string;
};

/** Correo ya redactado de una mención. */
export type MentionEmail = { subject: string; text: string };

/** Notificación creada con el comentario, pendiente de entregar su correo. */
export type PendingNotificationEmail = {
  id: string;
  workspaceId: string;
  emailTo: string;
  emailSubject: string;
  emailBody: string;
};

export type CreatedComment = {
  comment: MemberComment;
  notifications: PendingNotificationEmail[];
};

/**
 * Crea el comentario de `userId` y, en la misma transacción, una
 * notificación `mention` por cada token que coincida (sin distinguir
 * mayúsculas) con el `user.name` de un miembro del workspace de la tarea.
 * Los miembros se leen en una sola consulta; los desconocidos y la
 * automención se ignoran. `emailed_at` queda nulo: el correo se entrega
 * fuera, después del commit. Devuelve el comentario con `authorName` y las
 * notificaciones creadas.
 */
export async function createCommentForMember(
  taskId: string,
  userId: string,
  body: string,
  mentions: {
    tokens: string[];
    composeEmail: (input: MentionEmailInput) => MentionEmail;
  },
): Promise<CreatedComment | undefined> {
  return await db.transaction(async (tx) => {
    const found = (
      await tx
        .select({
          id: task.id,
          workspaceId: task.workspaceId,
          projectId: task.projectId,
          title: task.title,
        })
        .from(task)
        .innerJoin(
          workspaceMember,
          and(
            eq(workspaceMember.workspaceId, task.workspaceId),
            eq(workspaceMember.userId, userId),
          ),
        )
        .where(eq(task.id, taskId))
        .limit(1)
    )[0];
    if (found === undefined) {
      return undefined;
    }

    const id = `comment_${randomUUID()}`;
    await tx.insert(comment).values({
      id,
      workspaceId: found.workspaceId,
      projectId: found.projectId,
      taskId: found.id,
      authorId: userId,
      body,
    });

    const created = (
      await tx
        .select(commentColumns)
        .from(comment)
        .innerJoin(user, eq(user.id, comment.authorId))
        .where(and(eq(comment.id, id), eq(comment.workspaceId, found.workspaceId)))
        .limit(1)
    )[0];
    if (created === undefined) {
      throw new Error("El comentario recién insertado no se encontró");
    }

    const wanted = new Set(mentions.tokens.map(mentionKey));
    if (wanted.size === 0) {
      return { comment: created, notifications: [] };
    }

    // SQLite `lower()` solo baja ASCII: la comparación se hace aquí, sobre
    // los miembros de este workspace leídos en una sola consulta.
    const members = await tx
      .select({ id: user.id, name: user.name, email: user.email })
      .from(workspaceMember)
      .innerJoin(user, eq(user.id, workspaceMember.userId))
      .where(and(eq(workspaceMember.workspaceId, found.workspaceId), ne(user.id, userId)));
    const recipients = members.filter((member) => wanted.has(mentionKey(member.name)));
    if (recipients.length === 0) {
      return { comment: created, notifications: [] };
    }

    const notifications = recipients.map((recipient) => {
      const email = mentions.composeEmail({
        actorName: created.authorName,
        recipientName: recipient.name,
        taskTitle: found.title,
        projectId: found.projectId,
        commentBody: created.body,
      });
      return {
        id: `notification_${randomUUID()}`,
        workspaceId: found.workspaceId,
        recipientUserId: recipient.id,
        actorUserId: userId,
        taskId: found.id,
        commentId: id,
        kind: "mention",
        emailTo: recipient.email,
        emailSubject: email.subject,
        emailBody: email.text,
        emailedAt: null,
      };
    });
    await tx.insert(notification).values(notifications);

    return {
      comment: created,
      notifications: notifications.map((row) => ({
        id: row.id,
        workspaceId: row.workspaceId,
        emailTo: row.emailTo,
        emailSubject: row.emailSubject,
        emailBody: row.emailBody,
      })),
    };
  });
}
