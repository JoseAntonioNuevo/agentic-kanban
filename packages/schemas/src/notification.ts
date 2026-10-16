/**
 * Contratos de notificaciones in-app compartidos por API y web.
 * Hoy solo existe el tipo "mention"; `commentPreview` puede venir vacío.
 */
import { z } from "zod";

export const notificationSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("mention"),
  actorName: z.string(),
  taskId: z.string().min(1),
  taskTitle: z.string(),
  projectId: z.string().min(1),
  commentPreview: z.string(),
  createdAt: z.iso.datetime(),
  readAt: z.iso.datetime().nullable(),
});

export const notificationListResponseSchema = z.array(notificationSchema);

export const notificationIdParamSchema = z.object({
  notificationId: z.string().min(1),
});

export type Notification = z.infer<typeof notificationSchema>;
export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;
export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;
