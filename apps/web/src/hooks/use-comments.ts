/**
 * Hilo de comentarios de una tarea: listar y crear.
 *
 * La queryKey lleva el `taskId` y el `userId` (misma convención que el board),
 * así que al cambiar de usuario nunca se reutiliza la caché del anterior. Crear
 * un comentario no es una mutation del tablero: no lleva `mutationKey` de board.
 */
import {
  commentListResponseSchema,
  commentSchema,
  type Comment,
  type CommentListResponse,
  type CreateCommentBody,
} from "@agentic-kanban/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { assertOk, sendJson } from "./use-task-mutations.ts";

/** Clave de caché del hilo: siempre lleva el id de la tarea y del usuario. */
export const commentsQueryKey = (taskId: string, userId: string) =>
  ["comments", taskId, userId] as const;

/** Pide el hilo con la cookie de sesión y valida el cuerpo con Zod. */
async function fetchComments(taskId: string): Promise<CommentListResponse> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/comments`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`La petición de comentarios falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return commentListResponseSchema.parse(json);
}

/** Hook del hilo de comentarios de una tarea. */
export function useComments(taskId: string, userId: string) {
  return useQuery({
    queryKey: commentsQueryKey(taskId, userId),
    queryFn: () => fetchComments(taskId),
  });
}

/** Hook para añadir un comentario al hilo de una tarea. */
export function useCreateComment(taskId: string, userId: string) {
  const queryClient = useQueryClient();
  const key = commentsQueryKey(taskId, userId);

  return useMutation({
    mutationFn: async (variables: CreateCommentBody): Promise<Comment> => {
      const response = await sendJson(
        `/api/tasks/${encodeURIComponent(taskId)}/comments`,
        "POST",
        variables,
      );
      await assertOk(response, "Crear el comentario");
      const json: unknown = await response.json();
      return commentSchema.parse(json);
    },
    onSuccess: async (comment) => {
      // El comentario nuevo va al final del hilo; luego se relee el estado real.
      queryClient.setQueryData<CommentListResponse>(key, (comments) =>
        comments === undefined ? comments : [...comments, comment],
      );
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
