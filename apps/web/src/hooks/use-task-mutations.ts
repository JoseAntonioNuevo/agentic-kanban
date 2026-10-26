/**
 * Crear, editar y borrar tareas del tablero abierto.
 * Mover vive en `useMoveTask`, con la misma familia de claves.
 *
 * Cada mutationKey empieza por `["board", projectId]`. La Sesión 3 usa ese
 * prefijo para saber si hay un cambio propio en curso. Al terminar, bien o
 * mal, se invalida la query del board: la caché sigue siendo la única copia.
 */
import {
  taskSchema,
  type CreateTaskBody,
  type Task,
  type UpdateTaskBody,
} from "@agentic-kanban/schemas";
import { useMutation, useQueryClient, type UseMutationResult } from "@tanstack/react-query";

import { boardQueryKey } from "./use-board.ts";

type TaskAction = "create" | "update" | "delete";

/** Variables de la mutation de edición: el id va en la URL, el resto en el body. */
export type UpdateTaskVariables = { taskId: string } & UpdateTaskBody;

/** Clave de una mutation del tablero. El prefijo es `["board", projectId]`. */
export function taskMutationKey(projectId: string, action: TaskAction) {
  return ["board", projectId, action] as const;
}

function taskRequestError(action: string, status: number): Error {
  return new Error(`No se pudo ${action} la tarea: ${status}`);
}

async function parseTaskResponse(response: Response, action: string): Promise<Task> {
  if (!response.ok) {
    throw taskRequestError(action, response.status);
  }

  const json: unknown = await response.json();
  return taskSchema.parse(json);
}

/** POST /api/projects/:projectId/tasks. Devuelve la tarea creada (201). */
export async function createTask(projectId: string, body: CreateTaskBody): Promise<Task> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/tasks`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseTaskResponse(response, "crear");
}

/** PATCH /api/tasks/:taskId. Devuelve la tarea actualizada (200). */
export async function updateTask(taskId: string, body: UpdateTaskBody): Promise<Task> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseTaskResponse(response, "editar");
}

/** DELETE /api/tasks/:taskId. 204 no tiene cuerpo y no se parsea. */
export async function deleteTask(taskId: string): Promise<void> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw taskRequestError("borrar", response.status);
  }
}

/**
 * Mutations de tareas del proyecto abierto.
 * `onSettled` invalida el board de este usuario y espera al refetch.
 */
export function useTaskMutations(
  projectId: string,
  userId: string,
): {
  createTask: UseMutationResult<Task, Error, CreateTaskBody>;
  updateTask: UseMutationResult<Task, Error, UpdateTaskVariables>;
  deleteTask: UseMutationResult<void, Error, string>;
} {
  const queryClient = useQueryClient();

  function settleBoard() {
    return queryClient.invalidateQueries({ queryKey: boardQueryKey(projectId, userId) });
  }

  const createTaskMutation = useMutation({
    mutationKey: taskMutationKey(projectId, "create"),
    mutationFn: (body: CreateTaskBody) => createTask(projectId, body),
    onSettled: settleBoard,
  });

  const updateTaskMutation = useMutation({
    mutationKey: taskMutationKey(projectId, "update"),
    mutationFn: ({ taskId, ...body }: UpdateTaskVariables) => updateTask(taskId, body),
    onSettled: settleBoard,
  });

  const deleteTaskMutation = useMutation({
    mutationKey: taskMutationKey(projectId, "delete"),
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSettled: settleBoard,
  });

  return {
    createTask: createTaskMutation,
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation,
  };
}
