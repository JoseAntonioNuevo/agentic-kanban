/**
 * Movimiento de tarea: snapshot de cache → update optimista → POST →
 * reconciliar o rollback.
 */
import {
  applyBoardMove,
  moveTaskBodySchema,
  taskSchema,
  type Board,
} from "@agentic-kanban/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { boardQueryKey } from "@/hooks/use-board.ts";

type MoveTaskInput = {
  taskId: string;
  columnId: string;
  position: number;
};

async function postMoveTask({ taskId, columnId, position }: MoveTaskInput) {
  const response = await fetch(`/api/tasks/${taskId}/move`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(moveTaskBodySchema.parse({ columnId, position })),
  });

  if (!response.ok) {
    throw new Error(`El movimiento falló: ${response.status}`);
  }

  return taskSchema.parse(await response.json());
}

export function useMoveTask(projectId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = boardQueryKey(projectId, userId);

  return useMutation({
    mutationFn: postMoveTask,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Board>(queryKey);
      const next = previous
        ? applyBoardMove(previous, input.taskId, input.columnId, input.position)
        : undefined;

      if (next) {
        queryClient.setQueryData(queryKey, next);
      }

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error("No se pudo mover la tarea. Se restauró el tablero.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
