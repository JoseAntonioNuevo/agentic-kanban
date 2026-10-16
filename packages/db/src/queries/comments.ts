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
import { comment, task, user, workspaceMember } from "../schema/index.ts";

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
 * Crea un comentario del usuario en la tarea. `workspaceId` y `projectId` salen
 * de la fila de la tarea autorizada, `authorId` de la sesión. `null` si la
 * tarea no existe o el usuario no es miembro.
 */
export async function createCommentForMember(input: {
  taskId: string;
  userId: string;
  body: string;
}): Promise<CommentWithAuthor | null> {
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

    return { ...row, authorName: authors[0]?.name ?? "" };
  });
}
