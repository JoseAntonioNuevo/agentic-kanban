/**
 * Campana de menciones en la cabecera de `SignedIn`, en el dashboard y en el
 * tablero (una sola instancia).
 *
 * El badge y el «N sin leer» salen de `useUnreadNotificationCount` (un
 * `COUNT` del servidor), así que siguen siendo exactos con miles de
 * menciones. La bandeja vive en `NotificationInbox`, dentro del popover:
 * Radix lo desmonta al cerrarse y la infinite query solo pide páginas
 * mientras está abierto, de 50 en 50 con **Cargar más**. Los estados vienen
 * de `notification-bell-state.ts`: un error nunca se pinta como bandeja
 * vacía. Solo muestra menciones persistidas; no es el toast del canal.
 */
import type { Notification } from "@agentic-kanban/schemas";
import { BellIcon } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton.tsx";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/hooks/use-notifications.ts";
import {
  notificationListState,
  unreadBadgeLabel,
  unreadState,
} from "@/lib/notification-bell-state.ts";

const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "short" });

/** Botón con badge de no leídas y popover con las menciones de `userId`. */
export function NotificationBell({ userId }: { userId: string }) {
  const count = useUnreadNotificationCount(userId);
  const unread = unreadState(count);
  const badge = unreadBadgeLabel(unread);
  const markAll = useMarkAllNotificationsRead(userId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative"
          aria-label={
            unread.kind === "known" && unread.count > 0
              ? `Menciones: ${unread.count} sin leer`
              : "Menciones"
          }
        >
          <BellIcon />
          {badge !== undefined ? (
            <Badge className="absolute -top-2 -right-2 min-w-5 px-1 tabular-nums">{badge}</Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <div className="flex items-center justify-between gap-2">
            <PopoverTitle>Menciones</PopoverTitle>
            {unread.kind === "known" && unread.count > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                disabled={markAll.isPending}
                aria-busy={markAll.isPending}
                onClick={() => {
                  markAll.mutate();
                }}
              >
                Marcar todas como leídas
              </Button>
            ) : null}
          </div>
          {unread.kind === "known" ? (
            <PopoverDescription>
              {unread.count === 0
                ? "Nada pendiente"
                : unread.count === 1
                  ? "1 sin leer"
                  : `${unread.count} sin leer`}
            </PopoverDescription>
          ) : null}
          {markAll.isError ? (
            <p className="text-xs text-destructive" role="alert">
              No se pudieron marcar como leídas.
            </p>
          ) : null}
        </PopoverHeader>
        <NotificationInbox userId={userId} />
      </PopoverContent>
    </Popover>
  );
}

/** Bandeja paginada; solo existe mientras el popover está abierto. */
function NotificationInbox({ userId }: { userId: string }) {
  const notifications = useNotifications(userId);
  // Si falla solo «Cargar más», se conserva lo ya cargado y el aviso va abajo.
  const state = notificationListState({
    status: notifications.isFetchNextPageError ? "success" : notifications.status,
    pages: notifications.data?.pages,
    hasNextPage: notifications.hasNextPage,
  });

  if (state.kind === "loading") {
    return (
      <div className="flex flex-col gap-2" aria-busy="true">
        <p className="sr-only">Cargando menciones…</p>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="flex flex-col items-start gap-2" role="alert">
        <p className="text-sm text-destructive">No se pudieron cargar las menciones.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void notifications.refetch();
          }}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  if (state.kind === "empty") {
    return <p className="text-sm text-muted-foreground">No hay menciones.</p>;
  }

  return (
    <div className="-mx-1 flex max-h-96 flex-col gap-1 overflow-y-auto px-1">
      <ol className="flex flex-col gap-1">
        {state.items.map((item) => (
          <NotificationRow key={item.id} notification={item} userId={userId} />
        ))}
      </ol>
      {state.hasMore ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={notifications.isFetchingNextPage}
          aria-busy={notifications.isFetchingNextPage}
          onClick={() => {
            void notifications.fetchNextPage();
          }}
        >
          {notifications.isFetchingNextPage ? "Cargando…" : "Cargar más"}
        </Button>
      ) : null}
      {notifications.isFetchNextPageError ? (
        <p className="text-xs text-destructive" role="alert">
          No se pudieron cargar más menciones.
        </p>
      ) : null}
    </div>
  );
}

function NotificationRow({ notification, userId }: { notification: Notification; userId: string }) {
  const markRead = useMarkNotificationRead(userId);
  const unread = notification.readAt === null;

  return (
    <li
      className={
        unread
          ? "flex flex-col gap-1 rounded-md bg-muted p-2"
          : "flex flex-col gap-1 rounded-md p-2 text-muted-foreground"
      }
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm font-medium">{notification.actorName} te mencionó</p>
        <time dateTime={notification.createdAt} className="shrink-0 text-xs text-muted-foreground">
          {dateFormat.format(new Date(notification.createdAt))}
        </time>
      </div>
      <p className="truncate text-sm">{notification.taskTitle}</p>
      {notification.commentPreview !== "" ? (
        <p className="line-clamp-2 text-xs break-words text-muted-foreground">
          {notification.commentPreview}
        </p>
      ) : null}
      {unread ? (
        <div className="flex flex-col items-start gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={markRead.isPending}
            aria-busy={markRead.isPending}
            onClick={() => {
              markRead.mutate(notification.id);
            }}
          >
            Marcar como leída
          </Button>
          {markRead.isError ? (
            <p className="text-xs text-destructive" role="alert">
              No se pudo marcar como leída.
            </p>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
