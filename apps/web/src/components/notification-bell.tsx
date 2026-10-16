/**
 * Campana de menciones: popover con las notificaciones persistidas del usuario.
 *
 * Los datos salen de `useNotifications` (GET parseado con Zod) y `bellState`
 * decide qué pintar: un error de carga nunca se muestra como bandeja vacía.
 * El extracto se pinta como texto plano.
 */
import { Bell } from "lucide-react";

import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications.ts";
import { bellState } from "@/lib/notification-bell-state.ts";

/** Campana con badge de no leídas y lista de menciones en un popover. */
export function NotificationBell({ userId }: { userId: string }) {
  const notifications = useNotifications(userId);
  const markRead = useMarkNotificationRead(userId);
  const state = bellState({ status: notifications.status, data: notifications.data });
  const rows = notifications.data ?? [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Menciones" className="relative">
          <Bell />
          {state.kind === "list" && state.unread > 0 ? (
            <Badge className="absolute -top-2 -right-2 h-4 min-w-4 px-1 text-[10px]">
              {state.unread}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        {state.kind === "loading" ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : null}
        {state.kind === "error" ? (
          <p role="alert" className="text-destructive">
            No se pudieron cargar las menciones.
          </p>
        ) : null}
        {state.kind === "empty" ? <p className="text-muted-foreground">No hay menciones.</p> : null}
        {state.kind === "list" ? (
          <>
            {state.stale ? (
              <p role="alert" className="text-destructive">
                No se pudieron actualizar las menciones.
              </p>
            ) : null}
            {state.unread === 0 && !state.stale ? (
              <p className="text-muted-foreground">Nada pendiente</p>
            ) : null}
            <ul className="flex max-h-96 flex-col gap-2 overflow-y-auto">
              {rows.map((row) => (
                <li key={row.id} className="flex flex-col gap-1 rounded-lg border p-2">
                  <p className="font-medium">{row.actorName} te mencionó</p>
                  <p className="text-xs">{row.taskTitle}</p>
                  <p className="text-xs whitespace-pre-wrap text-muted-foreground">
                    {row.commentPreview}
                  </p>
                  {row.readAt === null ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start"
                      disabled={markRead.isPending && markRead.variables === row.id}
                      onClick={() => markRead.mutate(row.id)}
                    >
                      Marcar como leída
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
