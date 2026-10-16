/**
 * Comentarios de una tarea.
 *
 * - `GET /api/tasks/:taskId/comments`: lista por `created_at` ascendente.
 * - `POST /api/tasks/:taskId/comments`: crea un comentario del usuario de la sesión.
 *
 * Sin sesión → 401; tarea inexistente o sin membresía → 404 (nunca 403); input
 * inválido → 400. El `workspace_id` sale de la fila de la tarea, no del cliente.
 * Las menciones, el email y la publicación por SSE llegan en los prompts siguientes.
 */
import {
  createCommentForMember,
  listCommentsForMember,
  type CommentWithAuthor,
} from "@agentic-kanban/db";
import {
  commentListResponseSchema,
  commentSchema,
  createCommentBodySchema,
  errorResponseSchema,
  taskIdParamSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const commentRoutes = new Hono<SessionEnv>();

/** Serializa un comentario con su autor al contrato público (fecha ISO, `.parse()`). */
function toCommentResponse(row: CommentWithAuthor) {
  return commentSchema.parse({
    id: row.id,
    taskId: row.taskId,
    projectId: row.projectId,
    authorId: row.authorId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  });
}

/** 404 uniforme: no revela si la tarea existe en otro tenant. */
const notFoundBody = () => errorResponseSchema.parse({ error: "No encontrado" });

commentRoutes.get(
  "/api/tasks/:taskId/comments",
  requireSession,
  zValidator("param", taskIdParamSchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const rows = await listCommentsForMember(taskId, c.get("userId"));

    if (!rows) {
      return c.json(notFoundBody(), 404);
    }

    return c.json(commentListResponseSchema.parse(rows.map(toCommentResponse)));
  },
);

commentRoutes.post(
  "/api/tasks/:taskId/comments",
  requireSession,
  zValidator("param", taskIdParamSchema),
  zValidator("json", createCommentBodySchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const { body } = c.req.valid("json");
    const row = await createCommentForMember({ taskId, userId: c.get("userId"), body });

    if (!row) {
      return c.json(notFoundBody(), 404);
    }

    return c.json(toCommentResponse(row), 201);
  },
);
