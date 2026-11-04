/**
 * Comentarios de una tarea: lista y alta.
 *
 * Primero la sesión, después el validador y al final la consulta
 * `ForMember`. Sin membresía, o si la tarea no existe, 404: el `taskId` del
 * cliente solo identifica. `workspace_id` y `project_id` salen de la fila de
 * la tarea y `author_id` de la sesión.
 *
 * El alta crea en la misma transacción una notificación por cada `@Nombre`
 * que sea miembro del workspace. Tras el commit se entrega un correo por
 * notificación con `deliverEmail`; `emailed_at` solo se marca si fue bien.
 * Un fallo de entrega se registra y el comentario responde 201 igualmente.
 * Después de intentar la entrega publica `comment.created` en el canal del
 * project, con el comentario de la respuesta y el actor de la sesión. Un 4xx
 * no publica.
 */
import {
  createCommentForMember,
  listCommentsForMember,
  markNotificationEmailed,
  type MemberComment,
  type PendingNotificationEmail,
} from "@agentic-kanban/db";
import {
  commentListResponseSchema,
  commentSchema,
  createCommentBodySchema,
  extractMentionTokens,
  taskIdParamSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { deliverEmail } from "../mail/index.ts";
import { composeMentionEmail } from "../mail/mention.ts";

import { requireSession, type SessionEnv } from "../middleware/session.ts";
import { publish } from "../realtime/index.ts";

export const commentRoutes = new Hono<SessionEnv>();

function toComment(row: MemberComment) {
  return {
    id: row.id,
    taskId: row.taskId,
    projectId: row.projectId,
    authorId: row.authorId,
    authorName: row.authorName,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

/** Entrega cada correo ya confirmado en la base y marca los que salieron. */
async function deliverNotificationEmails(notifications: PendingNotificationEmail[]) {
  for (const pending of notifications) {
    const delivered = await deliverEmail({
      notificationId: pending.id,
      to: pending.emailTo,
      subject: pending.emailSubject,
      text: pending.emailBody,
    });
    if (!delivered) {
      continue;
    }

    try {
      await markNotificationEmailed(pending.id, pending.workspaceId);
    } catch (error) {
      console.error(`No se pudo marcar emailed_at de ${pending.id}`, error);
    }
  }
}

commentRoutes.get(
  "/api/tasks/:taskId/comments",
  requireSession,
  zValidator("param", taskIdParamSchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const rows = await listCommentsForMember(taskId, c.get("userId"));

    if (rows === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(commentListResponseSchema.parse(rows.map(toComment)), 200);
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
    const created = await createCommentForMember(taskId, c.get("userId"), body, {
      tokens: extractMentionTokens(body),
      composeEmail: composeMentionEmail,
    });

    if (created === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    const response = commentSchema.parse(toComment(created.comment));
    await deliverNotificationEmails(created.notifications);
    publish({
      type: "comment.created",
      projectId: response.projectId,
      actorUserId: c.get("userId"),
      comment: response,
    });
    return c.json(response, 201);
  },
);
