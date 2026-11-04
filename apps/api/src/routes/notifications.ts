/**
 * Campana: las menciones del usuario de la sesión.
 *
 * Primero la sesión (401), después el validador. Solo se leen y marcan filas
 * cuyo `recipient_user_id` es el de la sesión; las de otro usuario, o un id
 * que no existe, son 404, nunca 403. Las fechas salen con `toISOString()` y
 * la respuesta pasa por el schema compartido antes de enviarse.
 *
 * `GET /api/notifications` se pagina con `?before=<createdAt>|<id>` (un
 * cursor mal formado es 400). El badge usa `GET /unread-count`, que cuenta
 * todas las no leídas, y `POST /read-all` marca todas de una vez.
 */
import {
  countUnreadNotificationsForRecipient,
  listNotificationsForRecipient,
  markAllNotificationsReadForRecipient,
  markNotificationReadForRecipient,
  type RecipientNotification,
} from "@agentic-kanban/db";
import {
  notificationIdParamSchema,
  notificationListQuerySchema,
  notificationListResponseSchema,
  notificationReadAllResponseSchema,
  notificationSchema,
  notificationUnreadCountResponseSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const notificationRoutes = new Hono<SessionEnv>();

/** Longitud máxima del extracto del comentario en la campana. */
const PREVIEW_LENGTH = 140;

function preview(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…` : flat;
}

function toNotification(row: RecipientNotification) {
  return {
    id: row.id,
    kind: row.kind,
    actorName: row.actorName,
    taskId: row.taskId,
    taskTitle: row.taskTitle,
    projectId: row.projectId,
    commentPreview: preview(row.commentBody),
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}

notificationRoutes.get(
  "/api/notifications",
  requireSession,
  zValidator("query", notificationListQuerySchema),
  async (c) => {
    const { before } = c.req.valid("query");
    const rows = await listNotificationsForRecipient(
      c.get("userId"),
      before === undefined ? undefined : { createdAt: new Date(before.createdAt), id: before.id },
    );
    return c.json(notificationListResponseSchema.parse(rows.map(toNotification)), 200);
  },
);

notificationRoutes.get("/api/notifications/unread-count", requireSession, async (c) => {
  const count = await countUnreadNotificationsForRecipient(c.get("userId"));
  return c.json(notificationUnreadCountResponseSchema.parse({ count }), 200);
});

notificationRoutes.post("/api/notifications/read-all", requireSession, async (c) => {
  const updated = await markAllNotificationsReadForRecipient(c.get("userId"));
  return c.json(notificationReadAllResponseSchema.parse({ updated }), 200);
});

notificationRoutes.post(
  "/api/notifications/:notificationId/read",
  requireSession,
  zValidator("param", notificationIdParamSchema),
  async (c) => {
    const { notificationId } = c.req.valid("param");
    const row = await markNotificationReadForRecipient(notificationId, c.get("userId"));

    if (row === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(notificationSchema.parse(toNotification(row)), 200);
  },
);
