/**
 * Comentarios de un task. Sesión → 401; no miembro / no existe → 404.
 * `workspace_id` sale de la fila del task, nunca del body.
 * POST resuelve `@Nombre` (miembros, no uno mismo) e inserta
 * notifications + outbox. Tras persistir (y el outbox) publica
 * `comment.created` en el hub del project. Un POST fallido no publica.
 */
import {
  createCommentForMember,
  listCommentsForMember,
  type CommentRow,
} from "@agentic-kanban/db";
import {
  commentListResponseSchema,
  commentSchema,
  createCommentBodySchema,
  extractMentionNames,
  taskIdParamSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { writeMentionOutbox } from "../mail/outbox.ts";
import { requireSession, type SessionEnv } from "../middleware/session.ts";
import { publish } from "../realtime/index.ts";

export const commentRoutes = new Hono<SessionEnv>();

function toCommentJson(row: CommentRow) {
  return commentSchema.parse({
    id: row.id,
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    taskId: row.taskId,
    authorId: row.authorId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  });
}

commentRoutes.get(
  "/api/tasks/:taskId/comments",
  requireSession,
  zValidator("param", taskIdParamSchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const rows = await listCommentsForMember(taskId, c.get("userId"));

    if (!rows) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(commentListResponseSchema.parse(rows.map(toCommentJson)));
  },
);

commentRoutes.post(
  "/api/tasks/:taskId/comments",
  requireSession,
  zValidator("param", taskIdParamSchema),
  zValidator("json", createCommentBodySchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    const created = await createCommentForMember({
      id: `comment_${crypto.randomUUID()}`,
      taskId,
      userId: c.get("userId"),
      body: body.body,
      mentionNames: extractMentionNames(body.body),
    });

    if (!created) {
      return c.json({ error: "Not found" }, 404);
    }

    await writeMentionOutbox(created.notifications);

    const comment = toCommentJson(created.comment);
    publish({
      type: "comment.created",
      projectId: comment.projectId,
      actorUserId: comment.authorId,
      comment,
    });

    return c.json(comment, 201);
  },
);
