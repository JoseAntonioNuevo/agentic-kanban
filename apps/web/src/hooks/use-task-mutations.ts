/**
 * Crear, editar y borrar tareas. Invalidan `["board", projectId, userId]`.
 */
import { boardQueryKey } from "@/hooks/use-board.ts";
import {
  createTaskBodySchema,
  taskSchema,
  updateTaskBodySchema,
  type CreateTaskBody,
  type UpdateTaskBody,
} from "@agentic-kanban/schemas";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateTask(projectId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = boardQueryKey(projectId, userId);

  return useMutation({
    mutationFn: async (body: CreateTaskBody) => {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(createTaskBodySchema.parse(body)),
      });
      if (!response.ok) {
        throw new Error(`No se pudo crear la tarea: ${response.status}`);
      }
      return taskSchema.parse(await response.json());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("No se pudo crear la tarea");
    },
  });
}

export function useUpdateTask(projectId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = boardQueryKey(projectId, userId);

  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: string; body: UpdateTaskBody }) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(updateTaskBodySchema.parse(body)),
      });
      if (!response.ok) {
        throw new Error(`No se pudo editar la tarea: ${response.status}`);
      }
      return taskSchema.parse(await response.json());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("No se pudo editar la tarea");
    },
  });
}

export function useDeleteTask(projectId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = boardQueryKey(projectId, userId);

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`No se pudo eliminar la tarea: ${response.status}`);
      }
      return taskSchema.parse(await response.json());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("No se pudo eliminar la tarea");
    },
  });
}
