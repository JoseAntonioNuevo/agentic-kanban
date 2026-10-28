/**
 * Canal en vivo del tablero abierto: un WebSocket por proyecto que parchea
 * la caché del board con `applyBoardEvent`.
 *
 * El canal solo anuncia; las escrituras siguen por HTTP y el cliente no
 * envía nada. Al abrir se invalida el board, porque el hub no guarda
 * historial. Un evento propio con una mutation del tablero en curso se
 * ignora: su `onSettled` ya reconcilia. Sin reconexión ni avisos todavía.
 */
import {
  applyBoardEvent,
  boardEventSchema,
  type BoardEvent,
  type BoardResponse,
} from "@agentic-kanban/schemas";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

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

/** Abre el canal del proyecto. Devuelve el cleanup, que cierra el socket. */
export function connectBoardEvents(channel: BoardChannel): () => void {
  const queryKey = boardQueryKey(channel.projectId, channel.userId);
  const socket = new WebSocket(boardEventsUrl(channel.projectId));

  socket.onopen = () => {
    void channel.queryClient.invalidateQueries({ queryKey });
  };
  socket.onmessage = (message: MessageEvent) => {
    const event = parseBoardEvent(message.data);
    if (event !== undefined) handleBoardEvent(channel, event);
  };

  return () => {
    socket.onopen = null;
    socket.onmessage = null;
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
