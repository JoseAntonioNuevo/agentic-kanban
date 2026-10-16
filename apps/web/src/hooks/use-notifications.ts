/**
 * Menciones del usuario (campana): listar y marcar como leída.
 *
 * La queryKey lleva el `userId` (misma convención que el resto de queries) y
 * la lista se relee al volver a la ventana y cada 5 s: así Luis ve la mención
 * de Ana sin tener el tablero abierto.
 */
import {
  notificationListResponseSchema,
  notificationSchema,
  type Notification,
  type NotificationListResponse,
} from "@agentic-kanban/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assertOk, sendJson } from "./use-task-mutations.ts";

/** Clave de caché de la bandeja: siempre lleva el id del usuario. */
export const notificationsQueryKey = (userId: string) => ["notifications", userId] as const;

/** Pide la bandeja con la cookie de sesión y valida el cuerpo con Zod. */
async function fetchNotifications(): Promise<NotificationListResponse> {
  const response = await fetch("/api/notifications", { credentials: "include" });

  if (!response.ok) {
    throw new Error(`La petición de menciones falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return notificationListResponseSchema.parse(json);
}

/** Hook de la bandeja de menciones del usuario conectado. */
export function useNotifications(userId: string) {
  return useQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: fetchNotifications,
    refetchOnWindowFocus: true,
    refetchInterval: 5_000,
  });
}

/** Hook para marcar una mención como leída. */
export function useMarkNotificationRead(userId: string) {
  const queryClient = useQueryClient();
  const key = notificationsQueryKey(userId);

  return useMutation({
    mutationFn: async (notificationId: string): Promise<Notification> => {
      const response = await sendJson(
        `/api/notifications/${encodeURIComponent(notificationId)}/read`,
        "POST",
      );
      await assertOk(response, "Marcar la mención como leída");
      const json: unknown = await response.json();
      return notificationSchema.parse(json);
    },
    onSuccess: async (notification) => {
      // Se reemplaza la fila por id con la respuesta; luego se relee el estado real.
      queryClient.setQueryData<NotificationListResponse>(key, (rows) =>
        rows === undefined
          ? rows
          : rows.map((row) => (row.id === notification.id ? notification : row)),
      );
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
