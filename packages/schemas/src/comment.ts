/**
 * Contratos Zod de los comentarios de una tarea.
 *
 * Las fechas viajan como string ISO. El cliente solo manda `body`: el
 * `workspaceId`, el `projectId` y el autor salen de la fila y de la sesión.
 * `authorName` sale de un join con `user.name`. `:taskId` reutiliza
 * `taskIdParamSchema` de `board.ts`.
 */
import { z } from "zod";

/** Comentario tal como lo devuelve la API. */
export const commentSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});

export type Comment = z.infer<typeof commentSchema>;

/** Cuerpo de `GET /api/tasks/:taskId/comments`, por `created_at` ascendente. */
export const commentListResponseSchema = z.array(commentSchema);

export type CommentListResponse = z.infer<typeof commentListResponseSchema>;

/** Body de `POST /api/tasks/:taskId/comments`. */
export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
