/**
 * Mover una tarea (drag-and-drop) con actualización optimista.
 *
 * Flujo: `onMutate` cancela las lecturas del board, guarda la instantánea y
 * aplica `applyBoardMove` a la caché; `onError` restaura la instantánea y
 * avisa con un toast; `onSettled` invalida el board para releer la verdad del
 * servidor. El board vive solo en la caché de TanStack Query.
 */
import {
  applyBoardMove,
  taskSchema,
  type BoardMove,
  type BoardResponse,
  type Task,
} from "@agentic-kanban/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { boardQueryKey } from "./use-board.ts";
import { assertOk, boardMutationKey, sendJson } from "./use-task-mutations.ts";

/** Mutation de mover una tarea dentro de su columna o a otra del mismo project. */
export function useMoveTask(projectId: string, userId: string) {
  const queryClient = useQueryClient();
  const key = boardQueryKey(projectId, userId);

  return useMutation({
    mutationKey: [...boardMutationKey(projectId), "move"],
    mutationFn: async (move: BoardMove): Promise<Task> => {
      const response = await sendJson(
        `/api/tasks/${encodeURIComponent(move.taskId)}/move`,
        "POST",
        { columnId: move.columnId, position: move.position },
      );
      await assertOk(response, "Mover la tarea");
      const json: unknown = await response.json();
      return taskSchema.parse(json);
    },
    onMutate: async (move) => {
      // Una lectura en vuelo pisaría el cambio optimista al terminar.
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<BoardResponse>(key);

      if (previous !== undefined) {
        queryClient.setQueryData<BoardResponse>(key, applyBoardMove(previous, move));
      }

      return { previous };
    },
    onError: (_error, _move, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData<BoardResponse>(key, context.previous);
      }

      toast.error("No se pudo mover la tarea");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
