/**
 * Lista y alta de comentarios de un task. Misma Zod que la API.
 * No copia el board. Sin menciones ni realtime.
 */
import {
  commentListResponseSchema,
  commentSchema,
  createCommentBodySchema,
} from "@agentic-kanban/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function commentsQueryKey(taskId: string, userId: string | undefined) {
  return ["comments", taskId, userId] as const;
}

async function fetchComments(taskId: string) {
  const response = await fetch(`/api/tasks/${taskId}/comments`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`La petición de comentarios falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return commentListResponseSchema.parse(json);
}

/** Server state del hilo. Solo dispara con diálogo de editar abierto. */
export function useComments(
  taskId: string | undefined,
  userId: string | undefined,
  open: boolean,
) {
  return useQuery({
    queryKey: commentsQueryKey(taskId ?? "", userId),
    queryFn: () => fetchComments(taskId!),
    enabled: Boolean(taskId && userId && open),
  });
}

export function useCreateComment(taskId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();
  const queryKey = commentsQueryKey(taskId ?? "", userId);

  return useMutation({
    mutationFn: async (body: string) => {
      if (!taskId) {
        throw new Error("Falta el task para comentar");
      }
      const payload = createCommentBodySchema.parse({ body });
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`No se pudo crear el comentario: ${response.status}`);
      }
      return commentSchema.parse(await response.json());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast.error("No se pudo publicar el comentario");
    },
  });
}
