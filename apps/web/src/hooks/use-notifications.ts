/**
 * Campana del usuario: el contador de no leídas, la bandeja paginada y el
 * marcado como leída (una o todas).
 *
 * Todas las claves empiezan por `notificationsQueryKey(userId)`
 * (`["notifications", userId]`): el reset de identidad de `App` tira la
 * campana de quien sale y el evento `comment.created` del canal invalida
 * contador y bandeja con una sola llamada. El contador se refresca al volver
 * a la ventana y cada `NOTIFICATIONS_REFETCH_MS`, también fuera del tablero;
 * es una consulta `COUNT`, así que el badge no depende de las filas
 * cargadas. La bandeja (`useInfiniteQuery`, cursor `before`) solo se pide
 * mientras el popover está abierto. Las respuestas se validan con los
 * schemas compartidos.
 */
import {
  NOTIFICATION_PAGE_SIZE,
  notificationCursor,
  notificationListResponseSchema,
  notificationReadAllResponseSchema,
  notificationSchema,
  notificationUnreadCountResponseSchema,
  type Notification,
  type NotificationListResponse,
  type NotificationReadAllResponse,
} from "@agentic-kanban/schemas";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

/** Intervalo de refresco del contador y de la bandeja abierta. */
export const NOTIFICATIONS_REFETCH_MS = 5_000;

/** Prefijo de todas las claves de la campana de un usuario. */
export function notificationsQueryKey(userId: string) {
  return ["notifications", userId] as const;
}

/** Clave de la bandeja paginada. */
export function notificationListQueryKey(userId: string) {
  return [...notificationsQueryKey(userId), "list"] as const;
}

/** Clave del contador de no leídas. */
export function unreadCountQueryKey(userId: string) {
  return [...notificationsQueryKey(userId), "unread-count"] as const;
}

/**
 * GET /api/notifications, con `?before=` si hay cursor. Un HTTP no ok lanza
 * `Error`; un cuerpo inválido, `ZodError`.
 */
export async function fetchNotifications({
  before,
  signal,
}: { before?: string; signal?: AbortSignal } = {}): Promise<NotificationListResponse> {
  const url =
    before === undefined
      ? "/api/notifications"
      : `/api/notifications?before=${encodeURIComponent(before)}`;
  const response = await fetch(url, { credentials: "include", signal });

  if (!response.ok) {
    throw new Error(`No se pudieron cargar las menciones: ${response.status}`);
  }

  const json: unknown = await response.json();
  return notificationListResponseSchema.parse(json);
}

/** Cursor de la página siguiente, o `undefined` si la última vino incompleta. */
export function nextNotificationCursor(lastPage: NotificationListResponse): string | undefined {
  const last = lastPage.at(-1);
  if (last === undefined || lastPage.length < NOTIFICATION_PAGE_SIZE) return undefined;
  return notificationCursor(last);
}

/** GET /api/notifications/unread-count. Devuelve el número. */
export async function fetchUnreadNotificationCount(signal?: AbortSignal): Promise<number> {
  const response = await fetch("/api/notifications/unread-count", {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`No se pudo contar las menciones: ${response.status}`);
  }

  const json: unknown = await response.json();
  return notificationUnreadCountResponseSchema.parse(json).count;
}

/** POST /api/notifications/:notificationId/read. Devuelve la notificación actualizada. */
export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`No se pudo marcar como leída: ${response.status}`);
  }

  const json: unknown = await response.json();
  return notificationSchema.parse(json);
}

/** POST /api/notifications/read-all. Devuelve cuántas cambiaron. */
export async function markAllNotificationsRead(): Promise<NotificationReadAllResponse> {
  const response = await fetch("/api/notifications/read-all", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`No se pudieron marcar como leídas: ${response.status}`);
  }

  const json: unknown = await response.json();
  return notificationReadAllResponseSchema.parse(json);
}

type NotificationPages = InfiniteData<NotificationListResponse, string | undefined>;

/** Sustituye la fila con el mismo id en todas las páginas. Pura; no muta `data`. */
export function replaceNotification(
  data: NotificationPages | undefined,
  updated: Notification,
): NotificationPages | undefined {
  if (data === undefined) return undefined;
  if (!data.pages.some((page) => page.some((item) => item.id === updated.id))) return data;
  return {
    ...data,
    pages: data.pages.map((page) => page.map((item) => (item.id === updated.id ? updated : item))),
  };
}

/** Número de menciones sin leer de `userId`; alimenta el badge. */
export function useUnreadNotificationCount(userId: string) {
  return useQuery({
    queryKey: unreadCountQueryKey(userId),
    queryFn: ({ signal }) => fetchUnreadNotificationCount(signal),
    refetchOnWindowFocus: true,
    refetchInterval: NOTIFICATIONS_REFETCH_MS,
  });
}

/**
 * Menciones de `userId`, de la más nueva a la más antigua, por páginas de
 * `NOTIFICATION_PAGE_SIZE`. Se monta dentro del popover: cerrado no pide nada.
 */
export function useNotifications(userId: string) {
  return useInfiniteQuery({
    queryKey: notificationListQueryKey(userId),
    queryFn: ({ pageParam, signal }) => fetchNotifications({ before: pageParam, signal }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: nextNotificationCursor,
    refetchOnWindowFocus: true,
    refetchInterval: NOTIFICATIONS_REFETCH_MS,
  });
}

/**
 * Marca una mención como leída. Al éxito sustituye la fila en caché y, bien
 * o mal, invalida contador y bandeja.
 */
export function useMarkNotificationRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["notifications", userId, "read"],
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: (updated) => {
      queryClient.setQueryData<NotificationPages>(notificationListQueryKey(userId), (data) =>
        replaceNotification(data, updated),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) }),
  });
}

/** Marca todas como leídas y, bien o mal, invalida contador y bandeja. */
export function useMarkAllNotificationsRead(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["notifications", userId, "read-all"],
    mutationFn: () => markAllNotificationsRead(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsQueryKey(userId) }),
  });
}
