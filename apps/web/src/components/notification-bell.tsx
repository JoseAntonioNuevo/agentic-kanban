/**
 * Campana in-app: badge de no leídas y popover (quién, tarea, extracto).
 * La lista pinta las filas de GET. Si hay ≥1, no muestra vacío.
 */
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover.tsx";
import { useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications.ts";
import { cn } from "@/lib/utils.ts";
import type { Notification } from "@agentic-kanban/schemas";
import { Bell } from "lucide-react";

export function NotificationBell({ userId }: { userId: string | undefined }) {
  const notifications = useNotifications(userId);
  const markRead = useMarkNotificationRead(userId);
  const rows = notifications.data;
  const unread = rows?.filter((item) => item.readAt === null).length ?? 0;
  const label = unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones";

  if (!userId) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon-sm" className="relative" aria-label={label}>
          <Bell />
          {unread > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1.5 -right-1.5 min-w-4 px-1"
              aria-hidden
            >
              {unread > 99 ? "99+" : unread}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <PopoverHeader className="px-1.5 pb-1">
          <PopoverTitle>Notificaciones</PopoverTitle>
          <PopoverDescription>
            {notifications.isError
              ? "Error al cargar"
              : unread > 0
                ? `${unread} sin leer`
                : "Nada pendiente"}
          </PopoverDescription>
        </PopoverHeader>
        {Array.isArray(rows) && rows.length > 0 ? (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {rows.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={() => {
                  if (item.readAt === null && !markRead.isPending) {
                    markRead.mutate(item.id);
                  }
                }}
              />
            ))}
          </ul>
        ) : notifications.isPending ? (
          <p className="px-1.5 py-2 text-sm text-muted-foreground">Cargando…</p>
        ) : notifications.isError ? (
          <p className="px-1.5 py-2 text-sm text-destructive">No se pudieron cargar las menciones.</p>
        ) : (
          <p className="px-1.5 py-2 text-sm text-muted-foreground">No hay menciones.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({ item, onRead }: { item: Notification; onRead: () => void }) {
  const unread = item.readAt === null;

  return (
    <li>
      <button
        type="button"
        onClick={onRead}
        className={cn(
          "w-full rounded-md px-1.5 py-1.5 text-left hover:bg-muted",
          unread ? "bg-muted/60" : "opacity-80",
        )}
      >
        <p className={cn("text-sm", unread && "font-medium")}>{item.actorName} te mencionó</p>
        <p className="text-xs text-muted-foreground">{item.taskTitle}</p>
        <p className="line-clamp-2 text-xs text-muted-foreground">{item.bodyPreview}</p>
      </button>
    </li>
  );
}
