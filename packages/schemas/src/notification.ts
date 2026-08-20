/**
 * Contratos de la campana: lista y marcar leída.
 *
 * IDs en JSON son datos, no permiso. La API autoriza con sesión +
 * `recipient_user_id` del usuario actual + membership en el
 * `workspace_id` de la fila.
 */
import { z } from "zod";

export const notificationIdParamSchema = z.object({
  notificationId: z.string().min(1),
});

export const notificationSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  actorUserId: z.string().min(1),
  actorName: z.string().min(1),
  taskId: z.string().min(1),
  taskTitle: z.string().min(1),
  commentId: z.string().min(1),
  kind: z.literal("mention"),
  bodyPreview: z.string().min(1),
  readAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
});

export const notificationListResponseSchema = z.array(notificationSchema);

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
