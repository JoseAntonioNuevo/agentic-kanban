/**
 * Canal en vivo del tablero abierto: un WebSocket por proyecto que parchea
 * la caché del board con `applyBoardEvent`.
 *
 * El canal solo anuncia; las escrituras siguen por HTTP y el cliente no
 * envía nada. Al abrir se invalida el board, porque el hub no guarda
 * historial. Un evento propio con una mutation del tablero en curso se
 * ignora: su `onSettled` ya reconcilia. Si el socket se cierra sin que lo
 * pida el cleanup, se reabre con `reconnectDelay`; el `onopen` siguiente
 * invalida el board y recupera lo perdido. Un evento de otro usuario además
 * lanza un toast (verde crea, amarillo edita, rojo borra, info mueve).
 */
import {
  applyBoardEvent,
  boardEventSchema,
  type BoardEvent,
  type BoardResponse,
} from "@agentic-kanban/schemas";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { boardEventToastMessage } from "../lib/board-event-toast.ts";
import { reconnectDelay } from "../lib/reconnect-delay.ts";

import { boardQueryKey } from "./use-board.ts";

/** URL del canal en el mismo origen: el proxy de Vite+ lo reenvía a la API. */
export function boardEventsUrl(projectId: string): string {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/api/projects/${encodeURIComponent(projectId)}/events`;
}

/** Un mensaje del socket como `BoardEvent`, o `undefined` si no parsea. */
export function parseBoardEvent(data: unknown): BoardEvent | undefined {
  if (typeof data !== "string") return undefined;

  let json: unknown;
  try {
    json = JSON.parse(data);
  } catch {
    return undefined;
  }

  const result = boardEventSchema.safeParse(json);
  return result.success ? result.data : undefined;
}

/** Título de la tarea afectada según la caché, o `undefined` si no está. */
function cachedTaskTitle(
  queryClient: QueryClient,
  queryKey: ReturnType<typeof boardQueryKey>,
  event: BoardEvent,
): string | undefined {
  if (event.type !== "task.deleted" && event.type !== "task.moved") return undefined;
  const board = queryClient.getQueryData<BoardResponse>(queryKey);
  for (const column of board?.columns ?? []) {
    const found = column.tasks.find((item) => item.id === event.taskId);
    if (found) return found.title;
  }
  return undefined;
}

/** Color del aviso según el tipo: verde crea, amarillo edita, rojo borra. */
const BOARD_EVENT_TOAST: Record<BoardEvent["type"], (message: string) => unknown> = {
  "task.created": (message) => toast.success(message),
  "task.updated": (message) => toast.warning(message),
  "task.deleted": (message) => toast.error(message),
  "task.moved": (message) => toast.info(message),
};

type BoardChannel = { queryClient: QueryClient; projectId: string; userId: string };

/** Aplica un evento ya parseado a la caché del board de `userId`. */
export function handleBoardEvent(
  { queryClient, projectId, userId }: BoardChannel,
  event: BoardEvent,
): void {
  if (event.projectId !== projectId) return;

  // La mutationKey del tablero empieza por ["board", projectId]; la queryKey
  // es ["board", userId, projectId].
  if (
    event.actorUserId === userId &&
    queryClient.isMutating({ mutationKey: ["board", projectId] }) > 0
  ) {
    return;
  }

  const queryKey = boardQueryKey(projectId, userId);

  // Fuera del updater, que debe seguir puro. El título de deleted y moved
  // se lee antes de aplicar el evento: después la tarea ya no está o cambió.
  if (event.actorUserId !== userId) {
    const message = boardEventToastMessage(event, cachedTaskTitle(queryClient, queryKey, event));
    BOARD_EVENT_TOAST[event.type](message);
  }

  const refetching = queryClient.isFetching({ queryKey }) > 0;
  queryClient.setQueryData<BoardResponse>(
    queryKey,
    (board) => board && applyBoardEvent(board, event),
  );

  // Esa respuesta pudo salir antes de la escritura y pisaría el evento.
  if (refetching) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * Abre el canal del proyecto y lo reabre solo si se corta. Devuelve el
 * cleanup: marca el cierre como intencionado, cancela el reintento pendiente
 * y cierra el socket. `closedByCleanup`, `attempt` y `timer` son locales a
 * cada llamada, así el cierre del primer socket de StrictMode no afecta al
 * segundo.
 */
export function connectBoardEvents(channel: BoardChannel): () => void {
  const queryKey = boardQueryKey(channel.projectId, channel.userId);
  let closedByCleanup = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let socket: WebSocket;

  const open = () => {
    timer = undefined;
    socket = new WebSocket(boardEventsUrl(channel.projectId));
    socket.onopen = () => {
      attempt = 0;
      void channel.queryClient.invalidateQueries({ queryKey });
    };
    socket.onmessage = (message: MessageEvent) => {
      const event = parseBoardEvent(message.data);
      if (event !== undefined) handleBoardEvent(channel, event);
    };
    socket.onclose = () => {
      if (closedByCleanup) return;
      timer = setTimeout(open, reconnectDelay(attempt));
      attempt += 1;
    };
  };

  open();

  return () => {
    closedByCleanup = true;
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
    socket.onopen = null;
    socket.onmessage = null;
    socket.onclose = null;
    socket.close();
  };
}

/**
 * Mantiene abierto el canal mientras `BoardScreen` pinta el tablero
 * (`enabled`). Cambiar de proyecto, desmontar o desactivarlo cierra el socket.
 */
export function useBoardEvents(projectId: string, userId: string, enabled: boolean): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    return connectBoardEvents({ queryClient, projectId, userId });
  }, [enabled, projectId, queryClient, userId]);
}
