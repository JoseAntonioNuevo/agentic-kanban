/**
 * Mover una tarea con la caché del board como única copia.
 *
 * `onMutate` cancela el refetch, guarda la instantánea y aplica
 * `applyBoardMove`. Si el POST falla, `onError` restaura esa instantánea y
 * avisa. `onSettled` invalida: el servidor sigue siendo la autoridad.
 * La mutationKey empieza por `["board", projectId]` para que la Sesión 3
 * distinga un cambio propio.
 */
import {
  applyBoardMove,
  taskSchema,
  type BoardMove,
  type BoardResponse,
  type Task,
} from "@agentic-kanban/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";

import { boardQueryKey } from "./use-board.ts";

export function moveTaskMutationKey(projectId: string) {
  return ["board", projectId, "move"] as const;
}

/** POST /api/tasks/:taskId/move. Devuelve la tarea ya movida (200). */
export async function moveTask(
  taskId: string,
  body: { columnId: string; position: number },
): Promise<Task> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/move`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`No se pudo mover la tarea: ${response.status}`);
  }

  const json: unknown = await response.json();
  return taskSchema.parse(json);
}

/**
 * Mutation optimista del movimiento. `projectId` y `userId` salen de la
 * pantalla con sesión; el body no lleva `workspaceId`.
 */
export function useMoveTask(
  projectId: string,
  userId: string,
): UseMutationResult<Task, Error, BoardMove> {
  const queryClient = useQueryClient();
  const queryKey = boardQueryKey(projectId, userId);

  return useMutation({
    mutationKey: moveTaskMutationKey(projectId),
    mutationFn: (move: BoardMove) =>
      moveTask(move.taskId, { columnId: move.columnId, position: move.position }),
    onMutate: async (move) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardResponse>(queryKey);
      if (previous !== undefined) {
        queryClient.setQueryData(queryKey, applyBoardMove(previous, move));
      }
      return { previous };
    },
    onError: (_error, _move, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("No se pudo mover la tarea");
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
