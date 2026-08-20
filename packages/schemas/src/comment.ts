/**
 * Contratos de comentarios: lista y creación.
 *
 * IDs en JSON son datos, no permiso. La API autoriza con sesión +
 * membership + el `workspace_id` de la fila del task.
 */
import { z } from "zod";

export const commentSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  taskId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.iso.datetime(),
});

export const commentListResponseSchema = z.array(commentSchema);

export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1),
});

export type Comment = z.infer<typeof commentSchema>;
export type CommentListResponse = z.infer<typeof commentListResponseSchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
