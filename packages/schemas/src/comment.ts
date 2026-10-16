/**
 * Contratos de comentarios de tarea compartidos por API y web.
 * El cuerpo se normaliza con trim y se limita a 2000 caracteres.
 */
import { z } from "zod";

export const commentSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
  projectId: z.string().min(1),
  authorId: z.string().min(1),
  authorName: z.string(),
  body: z.string(),
  createdAt: z.iso.datetime(),
});

export const commentListResponseSchema = z.array(commentSchema);

export const createCommentBodySchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export type Comment = z.infer<typeof commentSchema>;
export type CommentListResponse = z.infer<typeof commentListResponseSchema>;
export type CreateCommentBody = z.infer<typeof createCommentBodySchema>;
