/**
 * Cliente realtime del tablero: un único `EventSource` por project (amplía este
 * hook en vez de abrir otra conexión).
 *
 * Los eventos del servidor parchean la caché de TanStack Query con
 * `applyBoardEvent`; el board nunca se copia a `useState`. Durante un arrastre
 * los eventos se guardan y se aplican al soltar: cambiar el orden de la caché
 * remonta el `DragDropProvider` y cortaría el arrastre en curso.
 */
import {
  applyBoardEvent,
  boardEventSchema,
  type BoardEvent,
  type BoardResponse,
} from "@agentic-kanban/schemas";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

import { boardEventToastMessage } from "../lib/board-event-toast.ts";
import { boardQueryKey } from "./use-board.ts";
import { boardMutationKey } from "./use-task-mutations.ts";

/**
 * Escucha `/api/projects/:projectId/events` mientras el tablero está montado.
 * `setDragging` lo llama el tablero al empezar y al terminar un arrastre.
 */
export function useBoardEvents(
  projectId: string,
  userId: string,
): { setDragging: (active: boolean) => void } {
  const queryClient = useQueryClient();
  const draggingRef = useRef(false);
  const pendingRef = useRef<BoardEvent[]>([]);

  const applyEvent = useCallback(
    (event: BoardEvent) => {
      const queryKey = boardQueryKey(projectId, userId);

      queryClient.setQueryData<BoardResponse>(
        queryKey,
        (board) => board && applyBoardEvent(board, event),
      );

      // Una lectura en vuelo traería un board anterior al evento y lo pisaría:
      // se relanza para que la respuesta ya lo incluya.
      if (queryClient.isFetching({ queryKey }) > 0) {
        void queryClient.invalidateQueries({ queryKey });
      }
    },
    [projectId, userId, queryClient],
  );

  const setDragging = useCallback(
    (active: boolean) => {
      draggingRef.current = active;

      if (!active) {
        const pending = pendingRef.current;
        pendingRef.current = [];
        pending.forEach(applyEvent);
      }
    },
    [applyEvent],
  );

  useEffect(() => {
    // URL relativa: mismo origen, la cookie de sesión viaja sola.
    const source = new EventSource(`/api/projects/${encodeURIComponent(projectId)}/events`);

    // El hub vive en memoria y no repite lo que pasó sin conexión (antes de la
    // primera apertura o durante un corte): en cada apertura se relee el board.
    source.onopen = () => {
      void queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId, userId) });
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

      // Aviso solo de cambios ajenos, nunca de los propios. Se decide antes de
      // parchear la caché: `deleted` y `moved` solo traen `taskId`, y el título
      // sale del board todavía sin el evento.
      if (event.actorUserId !== userId) {
        let title: string | undefined;

        if (event.type === "task.deleted" || event.type === "task.moved") {
          const board = queryClient.getQueryData<BoardResponse>(boardQueryKey(projectId, userId));

          title = board?.columns
            .flatMap((column) => column.tasks)
            .find((task) => task.id === event.taskId)?.title;
        }

        toast.info(boardEventToastMessage(event, title));
      }

      if (draggingRef.current) {
        pendingRef.current.push(event);
        return;
      }

      applyEvent(event);
    };

    return () => {
      source.close();
      pendingRef.current = [];
    };
  }, [projectId, userId, queryClient, applyEvent]);

  return { setDragging };
}
