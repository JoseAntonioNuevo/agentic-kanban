/**
 * Notificaciones in-app (la campana).
 *
 * - `GET /api/notifications`: las 50 más recientes del usuario de la sesión.
 * - `POST /api/notifications/:notificationId/read`: la marca como leída (idempotente).
 *
 * Sin sesión → 401. El destinatario sale siempre de la sesión y la consulta
 * exige además membresía en el workspace de la fila; si la notificación no
 * existe, es de otro usuario o ya no es miembro → 404 (nunca 403).
 */
import { listNotificationsForUser, markNotificationReadForUser } from "@agentic-kanban/db";
import type { NotificationView } from "@agentic-kanban/db";
import {
  errorResponseSchema,
  notificationIdParamSchema,
  notificationListResponseSchema,
  notificationSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const notificationRoutes = new Hono<SessionEnv>();

/** Longitud máxima del extracto del comentario. */
const PREVIEW_MAX_LENGTH = 120;

/** Recorta el cuerpo a 120 caracteres y añade «…» solo si se corta. */
function toPreview(body: string): string {
  // `Array.from` cuenta puntos de código: no parte un emoji por la mitad.
  const chars = Array.from(body);

  return chars.length > PREVIEW_MAX_LENGTH
    ? `${chars.slice(0, PREVIEW_MAX_LENGTH).join("")}…`
    : body;
}

/** Serializa una notificación al contrato público (fechas ISO, `.parse()`). */
function toNotificationResponse(row: NotificationView) {
  return notificationSchema.parse({
    id: row.id,
    kind: row.kind,
    actorName: row.actorName,
    taskId: row.taskId,
    taskTitle: row.taskTitle,
    projectId: row.projectId,
    commentPreview: toPreview(row.commentBody),
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt ? row.readAt.toISOString() : null,
  });
}

/** 404 uniforme: no revela si la notificación existe para otro usuario. */
const notFoundBody = () => errorResponseSchema.parse({ error: "No encontrado" });

notificationRoutes.get("/api/notifications", requireSession, async (c) => {
  const rows = await listNotificationsForUser(c.get("userId"));

  return c.json(notificationListResponseSchema.parse(rows.map(toNotificationResponse)));
});

notificationRoutes.post(
  "/api/notifications/:notificationId/read",
  requireSession,
  zValidator("param", notificationIdParamSchema),
  async (c) => {
    const { notificationId } = c.req.valid("param");
    const row = await markNotificationReadForUser(notificationId, c.get("userId"));

    if (!row) {
      return c.json(notFoundBody(), 404);
    }

    return c.json(toNotificationResponse(row));
  },
);
