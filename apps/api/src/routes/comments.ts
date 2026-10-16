/**
 * Comentarios de una tarea.
 *
 * - `GET /api/tasks/:taskId/comments`: lista por `created_at` ascendente.
 * - `POST /api/tasks/:taskId/comments`: crea un comentario del usuario de la sesión.
 *
 * Sin sesión → 401; tarea inexistente o sin membresía → 404 (nunca 403); input
 * inválido → 400. El `workspace_id` sale de la fila de la tarea, no del cliente.
 *
 * Menciones: el `POST` extrae los `@nombre` del texto y `createCommentForMember`
 * crea comentario y notificaciones en una sola transacción. Solo después del
 * commit se añade el email al outbox y se marca `emailed_at`; si eso falla se
 * registra el error y la respuesta sigue siendo 201. Por último se publica
 * `comment.created` en el hub del project (`announce`), con el mismo body que
 * responde el `POST`; con 404 o 400 no se publica nada.
 */
import {
  createCommentForMember,
  listCommentsForMember,
  markNotificationsEmailed,
  type CommentWithAuthor,
  type NotificationRow,
} from "@agentic-kanban/db";
import {
  commentListResponseSchema,
  commentSchema,
  createCommentBodySchema,
  errorResponseSchema,
  extractMentionTokens,
  taskIdParamSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { appendToOutbox } from "../mail/outbox.ts";
import { requireSession, type SessionEnv } from "../middleware/session.ts";
import { announce } from "../realtime/index.ts";

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

/**
 * Envío de aula tras el commit: una línea por notificación en el outbox y luego
 * `emailed_at`. Si falla, `emailed_at` queda vacío y el error solo se registra:
 * el comentario ya está guardado y la respuesta no cambia.
 */
async function deliverMentionEmails(notifications: NotificationRow[]): Promise<void> {
  if (notifications.length === 0) {
    return;
  }

  try {
    await appendToOutbox(
      notifications.map((n) => ({
        to: n.emailTo,
        subject: n.emailSubject,
        body: n.emailBody,
        notificationId: n.id,
        createdAt: n.createdAt.toISOString(),
      })),
    );
    await markNotificationsEmailed(
      notifications.map((n) => n.id),
      new Date(),
    );
  } catch (error) {
    console.error("No se pudo entregar el email de mención", error);
  }
}

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
    const result = await createCommentForMember({
      taskId,
      userId: c.get("userId"),
      body,
      mentionTokens: extractMentionTokens(body),
    });

    if (!result) {
      return c.json(notFoundBody(), 404);
    }

    await deliverMentionEmails(result.notifications);

    // Publica tras persistir comentario, notificaciones y outbox; el evento lleva el body de la respuesta.
    const comment = toCommentResponse(result.comment);
    announce({
      type: "comment.created",
      projectId: result.comment.projectId,
      actorUserId: c.get("userId"),
      comment,
    });

    return c.json(comment, 201);
  },
);
