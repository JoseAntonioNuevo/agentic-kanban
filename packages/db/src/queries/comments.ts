/**
 * Comentarios de una tarea acotados por membresía (sufijo `ForMember`).
 *
 * El `taskId` que llega del cliente solo identifica la fila: la membresía se
 * comprueba con el `workspace_id` de la tarea guardada, y ese mismo valor (más
 * el `project_id` de la tarea) se copia a cada comentario nuevo y filtra las
 * lecturas. Sin membresía o sin tarea devuelven `null` (el llamador responde 404).
 */
import { and, asc, eq } from "drizzle-orm";

import { getDb } from "../client.ts";
import type { TaskRow } from "../schema/board.ts";
import type { CommentRow } from "../schema/comment.ts";
import type { NotificationRow } from "../schema/notification.ts";
import { comment, notification, task, user, workspaceMember } from "../schema/index.ts";

/** Comentario con el nombre de su autor (join con `user.name`). */
export type CommentWithAuthor = CommentRow & { authorName: string };

/** Tipo de la transacción de Drizzle (`getDb().transaction(async (tx) => …)`). */
type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** Ejecutor de consultas: la conexión normal o una transacción. */
type Executor = ReturnType<typeof getDb> | Transaction;

/** Tarea por id solo si el usuario es miembro del workspace de la fila. */
async function getAuthorizedTask(
  executor: Executor,
  taskId: string,
  userId: string,
): Promise<TaskRow | null> {
  const rows = await executor
    .select({ task })
    .from(task)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, task.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(task.id, taskId))
    .limit(1);

  return rows[0]?.task ?? null;
}

/** Selección común: la fila del comentario más `authorName`. */
const commentWithAuthorColumns = {
  id: comment.id,
  workspaceId: comment.workspaceId,
  projectId: comment.projectId,
  taskId: comment.taskId,
  authorId: comment.authorId,
  body: comment.body,
  createdAt: comment.createdAt,
  authorName: user.name,
};

/**
 * Comentarios de la tarea por `created_at` ascendente (desempate por `id`).
 * `null` si la tarea no existe o el usuario no es miembro de su workspace.
 */
export async function listCommentsForMember(
  taskId: string,
  userId: string,
): Promise<CommentWithAuthor[] | null> {
  const db = getDb();
  const current = await getAuthorizedTask(db, taskId, userId);

  if (!current) {
    return null;
  }

  return db
    .select(commentWithAuthorColumns)
    .from(comment)
    .innerJoin(user, eq(user.id, comment.authorId))
    .where(and(eq(comment.taskId, current.id), eq(comment.workspaceId, current.workspaceId)))
    .orderBy(asc(comment.createdAt), asc(comment.id));
}

/**
 * Crea un comentario del usuario en la tarea y, en la MISMA transacción, una
 * notificación `mention` por cada miembro mencionado. `workspaceId` y
 * `projectId` salen de la fila de la tarea autorizada, `authorId` de la sesión.
 * `null` si la tarea no existe o el usuario no es miembro.
 *
 * `mentionTokens` son los nombres que extrajo el parser. Se resuelven con UNA
 * consulta contra los miembros del workspace de la tarea (sin distinguir
 * mayúsculas); se descartan desconocidos, la automención y duplicados. El
 * email no se envía aquí: las filas vuelven con `emailedAt` nulo y el llamador
 * escribe el outbox después del commit.
 */
export async function createCommentForMember(input: {
  taskId: string;
  userId: string;
  body: string;
  mentionTokens: string[];
}): Promise<{ comment: CommentWithAuthor; notifications: NotificationRow[] } | null> {
  return getDb().transaction(async (tx) => {
    const current = await getAuthorizedTask(tx, input.taskId, input.userId);

    if (!current) {
      return null;
    }

    const inserted = await tx
      .insert(comment)
      .values({
        id: crypto.randomUUID(),
        workspaceId: current.workspaceId,
        projectId: current.projectId,
        taskId: current.id,
        authorId: input.userId,
        body: input.body,
      })
      .returning();

    const row = inserted[0];

    if (!row) {
      return null;
    }

    const authors = await tx
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1);
    const authorName = authors[0]?.name ?? "";
    const created: CommentWithAuthor = { ...row, authorName };

    if (input.mentionTokens.length === 0) {
      return { comment: created, notifications: [] };
    }

    // Una sola consulta: los miembros del workspace de la tarea. El nombre se
    // compara en JS (NFC + minúsculas con tildes): `lower()` de SQLite solo
    // cambia el ASCII y `@álvaro` no encontraría a «Álvaro».
    const normalize = (name: string) => name.normalize("NFC").toLocaleLowerCase("es");
    const wanted = new Set(input.mentionTokens.map(normalize));
    const members = await tx
      .select({ id: user.id, email: user.email, name: user.name })
      .from(user)
      .innerJoin(workspaceMember, eq(workspaceMember.userId, user.id))
      .where(eq(workspaceMember.workspaceId, current.workspaceId));

    const mentioned = new Map<string, { id: string; email: string }>();

    for (const member of members) {
      if (member.id !== input.userId && wanted.has(normalize(member.name))) {
        mentioned.set(member.id, { id: member.id, email: member.email });
      }
    }

    if (mentioned.size === 0) {
      return { comment: created, notifications: [] };
    }

    const subject = `${authorName} te mencionó en "${current.title}"`;
    const emailBody = `${authorName} te mencionó en "${current.title}":\n\n${input.body}\n`;
    const notifications = await tx
      .insert(notification)
      .values(
        [...mentioned.values()].map((recipient) => ({
          id: crypto.randomUUID(),
          workspaceId: current.workspaceId,
          recipientUserId: recipient.id,
          actorUserId: input.userId,
          taskId: current.id,
          commentId: row.id,
          kind: "mention" as const,
          emailTo: recipient.email,
          emailSubject: subject,
          emailBody,
          emailedAt: null,
        })),
      )
      .returning();

    return { comment: created, notifications };
  });
}
