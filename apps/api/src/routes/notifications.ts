/**
 * Campana in-app. Sesión → 401; solo filas del recipient actual.
 * Membership en el `workspace_id` de la fila. Nunca 403.
 * Sin publish SSE.
 */
import {
  listNotificationsForUser,
  markNotificationReadForUser,
  type NotificationInboxRow,
} from "@agentic-kanban/db";
import {
  notificationIdParamSchema,
  notificationListResponseSchema,
  notificationSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const notificationRoutes = new Hono<SessionEnv>();

function toNotificationJson(row: NotificationInboxRow) {
  if (row.kind !== "mention") {
    throw new Error(`notification kind no soportado: ${row.kind}`);
  }

  return notificationSchema.parse({
    id: row.id,
    workspaceId: row.workspaceId,
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    taskId: row.taskId,
    taskTitle: row.taskTitle,
    commentId: row.commentId,
    kind: row.kind,
    bodyPreview: row.bodyPreview,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  });
}

notificationRoutes.get("/api/notifications", requireSession, async (c) => {
  const rows = await listNotificationsForUser(c.get("userId"));
  return c.json(notificationListResponseSchema.parse(rows.map(toNotificationJson)));
});

notificationRoutes.post(
  "/api/notifications/:notificationId/read",
  requireSession,
  zValidator("param", notificationIdParamSchema),
  async (c) => {
    const { notificationId } = c.req.valid("param");
    const row = await markNotificationReadForUser(notificationId, c.get("userId"));

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(toNotificationJson(row));
  },
);
