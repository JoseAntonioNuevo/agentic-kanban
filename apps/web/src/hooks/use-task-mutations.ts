/**
 * Mutations del tablero: crear, editar y borrar tareas.
 *
 * Tras cada cambio se actualiza la caché del board con la respuesta del API
 * (cuando la hay) y se invalida la query para releer el estado real del
 * servidor. El board nunca se copia a `useState`.
 */
import {
  errorResponseSchema,
  taskSchema,
  type BoardResponse,
  type CreateTaskBody,
  type Task,
  type UpdateTaskBody,
} from "@agentic-kanban/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { boardQueryKey } from "./use-board.ts";

/**
 * Prefijo de la `mutationKey` de todo cambio del tablero. La Sesión 3 lo usa
 * con `useIsMutating` para saber si hay un cambio propio en curso.
 */
export const boardMutationKey = (projectId: string) => ["board", projectId] as const;

/** Lanza un `Error` con el mensaje del API si el cuerpo es válido, o con el status. */
export async function assertOk(response: Response, action: string): Promise<void> {
  if (response.ok) {
    return;
  }

  let message = `${action} falló: ${response.status}`;

  try {
    const json: unknown = await response.json();
    const parsed = errorResponseSchema.safeParse(json);

    if (parsed.success) {
      message = parsed.data.error;
    }
  } catch {
    // Cuerpo vacío o no JSON: se queda el mensaje con el status.
  }

  throw new Error(message);
}

/** Envía una petición JSON con la cookie de sesión. */
export function sendJson(url: string, method: string, body?: unknown): Promise<Response> {
  return fetch(url, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/** Hooks de crear, editar y borrar tareas del tablero de un project. */
export function useTaskMutations(projectId: string, userId: string) {
  const queryClient = useQueryClient();
  const key = boardQueryKey(projectId, userId);

  const invalidateBoard = () => queryClient.invalidateQueries({ queryKey: key });

  const createTask = useMutation({
    mutationKey: [...boardMutationKey(projectId), "create"],
    mutationFn: async (variables: CreateTaskBody): Promise<Task> => {
      const response = await sendJson(
        `/api/projects/${encodeURIComponent(projectId)}/tasks`,
        "POST",
        variables,
      );
      await assertOk(response, "Crear la tarea");
      const json: unknown = await response.json();
      return taskSchema.parse(json);
    },
    onSuccess: async (task) => {
      // La tarea nueva va al final de su columna.
      queryClient.setQueryData<BoardResponse>(key, (board) =>
        board === undefined
          ? board
          : {
              ...board,
              columns: board.columns.map((column) =>
                column.id === task.columnId
                  ? { ...column, tasks: [...column.tasks, task] }
                  : column,
              ),
            },
      );
      await invalidateBoard();
    },
  });

  const updateTask = useMutation({
    mutationKey: [...boardMutationKey(projectId), "update"],
    mutationFn: async (variables: { taskId: string; patch: UpdateTaskBody }): Promise<Task> => {
      const response = await sendJson(
        `/api/tasks/${encodeURIComponent(variables.taskId)}`,
        "PATCH",
        variables.patch,
      );
      await assertOk(response, "Editar la tarea");
      const json: unknown = await response.json();
      return taskSchema.parse(json);
    },
    onSuccess: async (task) => {
      // Se reemplaza la tarea en su columna con la respuesta del API.
      queryClient.setQueryData<BoardResponse>(key, (board) =>
        board === undefined
          ? board
          : {
              ...board,
              columns: board.columns.map((column) => ({
                ...column,
                tasks: column.tasks.map((current) => (current.id === task.id ? task : current)),
              })),
            },
      );
      await invalidateBoard();
    },
  });

  const deleteTask = useMutation({
    mutationKey: [...boardMutationKey(projectId), "delete"],
    mutationFn: async (variables: { taskId: string }): Promise<void> => {
      const response = await sendJson(
        `/api/tasks/${encodeURIComponent(variables.taskId)}`,
        "DELETE",
      );
      await assertOk(response, "Borrar la tarea");
    },
    // El servidor compacta las posiciones de la columna: se relee el board.
    onSuccess: invalidateBoard,
  });

  return { createTask, updateTask, deleteTask };
}
