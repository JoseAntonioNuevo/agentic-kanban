/**
 * Campana: lista del usuario en sesión y marcar leída.
 * Refetch al foco y cada 4s (Luis puede no tener el tablero abierto).
 */
import {
  notificationListResponseSchema,
  notificationSchema,
  type Notification,
} from "@agentic-kanban/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function notificationsQueryKey(userId: string | undefined) {
  return ["notifications", userId] as const;
}

async function fetchNotifications() {
  const response = await fetch("/api/notifications", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`La petición de notificaciones falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return notificationListResponseSchema.parse(json);
}

/** Server state de la campana. `userId` en la queryKey evita filtrar cache entre logins. */
export function useNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: notificationsQueryKey(userId),
    queryFn: fetchNotifications,
    enabled: Boolean(userId),
    retry: 3,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead(userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = notificationsQueryKey(userId);

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`No se pudo marcar la notificación: ${response.status}`);
      }
      return notificationSchema.parse(await response.json());
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Notification[]>(queryKey, (current) => {
        if (!current) {
          return current;
        }
        return current.map((item) => (item.id === updated.id ? updated : item));
      });
    },
    onError: () => {
      toast.error("No se pudo marcar la notificación");
    },
  });
}
