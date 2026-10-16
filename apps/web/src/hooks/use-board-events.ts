/**
 * Cliente realtime del tablero: un único `EventSource` por project.
 *
 * Los eventos del servidor parchean la caché de TanStack Query con
 * `applyBoardEvent`; el board nunca se copia a `useState`. La Sesión 4
 * ampliará este hook en vez de abrir otra conexión.
 */
import { applyBoardEvent, boardEventSchema, type BoardResponse } from "@agentic-kanban/schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { boardQueryKey } from "./use-board.ts";
import { boardMutationKey } from "./use-task-mutations.ts";

/** Escucha `/api/projects/:projectId/events` mientras el tablero está montado. */
export function useBoardEvents(projectId: string, userId: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    // URL relativa: mismo origen, la cookie de sesión viaja sola.
    const source = new EventSource(`/api/projects/${encodeURIComponent(projectId)}/events`);
    let hadError = false;

    source.onerror = () => {
      hadError = true;
    };

    // El hub vive en memoria y no repite lo perdido durante el corte:
    // al reconectar se relee el board.
    source.onopen = () => {
      if (hadError) {
        hadError = false;
        void queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId, userId) });
      }
    };

    source.onmessage = (message) => {
      let json: unknown;

      try {
        json = JSON.parse(message.data);
      } catch {
        return;
      }

      const parsed = boardEventSchema.safeParse(json);

      if (!parsed.success) {
        return;
      }

      const event = parsed.data;

      // Eco propio: se ignora solo si hay una mutation del tablero en curso en
      // esta pestaña (su `onSettled` ya reconcilia). Si no, se aplica: es
      // idempotente y sincroniza otra pestaña del mismo usuario.
      if (
        event.actorUserId === userId &&
        queryClient.isMutating({ mutationKey: boardMutationKey(projectId) }) > 0
      ) {
        return;
      }

      queryClient.setQueryData<BoardResponse>(
        boardQueryKey(projectId, userId),
        (board) => board && applyBoardEvent(board, event),
      );
    };

    return () => {
      source.close();
    };
  }, [projectId, userId, queryClient]);
}
