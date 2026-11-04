/**
 * Contratos Zod de la campana: las menciones del usuario de la sesión.
 *
 * Las fechas viajan como string ISO (`Date.toISOString()` en la API);
 * `readAt` es nulo mientras no se marque como leída. `commentPreview` es un
 * extracto del comentario y puede quedar vacío. Solo existe `kind: "mention"`.
 *
 * La bandeja se pagina por cursor: cada página trae como mucho
 * `NOTIFICATION_PAGE_SIZE` filas y la siguiente se pide con
 * `?before=<createdAt>|<id>` de la última recibida (`notificationCursor`).
 * El badge no cuenta filas cargadas: usa `GET /api/notifications/unread-count`.
 */
import { z } from "zod";

/** Notificación tal como la devuelve la API. */
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

export type Notification = z.infer<typeof notificationSchema>;

/** Filas por página de `GET /api/notifications`. */
export const NOTIFICATION_PAGE_SIZE = 50;

/** Cuerpo de `GET /api/notifications`: de la más nueva a la más antigua, 50 como máximo. */
export const notificationListResponseSchema = z.array(notificationSchema);

export type NotificationListResponse = z.infer<typeof notificationListResponseSchema>;

/** `:notificationId` de `POST /api/notifications/:notificationId/read`. */
export const notificationIdParamSchema = z.object({
  notificationId: z.string().min(1),
});

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;

/** Cursor de la página siguiente: `createdAt|id` de la última fila recibida. */
export function notificationCursor(item: Pick<Notification, "createdAt" | "id">): string {
  return `${item.createdAt}|${item.id}`;
}

/**
 * Query de `GET /api/notifications`. Sin `before`, la primera página. Con
 * `before`, las filas estrictamente más antiguas que ese cursor; un cursor
 * mal formado es 400.
 */
export const notificationListQuerySchema = z.object({
  before: z
    .string()
    .transform((value) => {
      const separator = value.indexOf("|");
      return separator === -1
        ? { createdAt: "", id: "" }
        : { createdAt: value.slice(0, separator), id: value.slice(separator + 1) };
    })
    .pipe(z.object({ createdAt: z.iso.datetime(), id: z.string().min(1) }))
    .optional(),
});

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;

/** Cuerpo de `GET /api/notifications/unread-count`. */
export const notificationUnreadCountResponseSchema = z.object({
  count: z.number().int().nonnegative(),
});

export type NotificationUnreadCountResponse = z.infer<typeof notificationUnreadCountResponseSchema>;

/** Cuerpo de `POST /api/notifications/read-all`: cuántas filas pasaron a leídas. */
export const notificationReadAllResponseSchema = z.object({
  updated: z.number().int().nonnegative(),
});

export type NotificationReadAllResponse = z.infer<typeof notificationReadAllResponseSchema>;
