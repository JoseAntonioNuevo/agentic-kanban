/**
 * Hilo de comentarios de una tarea: lista y alta.
 *
 * La queryKey es `["comments", userId, taskId]`: el userId en segunda
 * posición deja que el reset de identidad de `App` tire los comentarios de
 * quien sale. Las respuestas se validan con los schemas compartidos. Crear
 * un comentario no usa el prefijo `["board", projectId]`, así que no cuenta
 * como cambio propio del tablero.
 */
import {
  commentListResponseSchema,
  commentSchema,
  type Comment,
  type CommentListResponse,
  type CreateCommentBody,
} from "@agentic-kanban/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Clave de caché de los comentarios de una tarea para un usuario. */
export function commentsQueryKey(taskId: string, userId: string) {
  return ["comments", userId, taskId] as const;
}

function commentsUrl(taskId: string): string {
  return `/api/tasks/${encodeURIComponent(taskId)}/comments`;
}

/** GET /api/tasks/:taskId/comments. Un HTTP no ok lanza `Error`; un cuerpo inválido, `ZodError`. */
export async function fetchComments(
  taskId: string,
  signal?: AbortSignal,
): Promise<CommentListResponse> {
  const response = await fetch(commentsUrl(taskId), { credentials: "include", signal });

  if (!response.ok) {
    throw new Error(`No se pudieron cargar los comentarios: ${response.status}`);
  }

  const json: unknown = await response.json();
  return commentListResponseSchema.parse(json);
}

/** POST /api/tasks/:taskId/comments con `{ body }`. Devuelve el comentario creado (201). */
export async function createComment(taskId: string, body: CreateCommentBody): Promise<Comment> {
  const response = await fetch(commentsUrl(taskId), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`No se pudo publicar el comentario: ${response.status}`);
  }

  const json: unknown = await response.json();
  return commentSchema.parse(json);
}

/** Añade `comment` al final de la lista si aún no está. Pura; no muta `list`. */
export function appendComment(
  list: CommentListResponse | undefined,
  comment: Comment,
): CommentListResponse | undefined {
  if (list === undefined) return undefined;
  if (list.some((existing) => existing.id === comment.id)) return list;
  return [...list, comment];
}

/** Comentarios de la tarea, por `createdAt` ascendente como los devuelve la API. */
export function useComments(taskId: string, userId: string) {
  return useQuery({
    queryKey: commentsQueryKey(taskId, userId),
    queryFn: ({ signal }) => fetchComments(taskId, signal),
  });
}

/**
 * Publica un comentario en la tarea. Al éxito lo añade a la lista en caché
 * y, bien o mal, invalida `commentsQueryKey(taskId, userId)`.
 */
export function useCreateComment(taskId: string, userId: string) {
  const queryClient = useQueryClient();
  const queryKey = commentsQueryKey(taskId, userId);

  return useMutation({
    mutationKey: ["comments", taskId, "create"],
    mutationFn: (body: CreateCommentBody) => createComment(taskId, body),
    onSuccess: (comment) => {
      queryClient.setQueryData<CommentListResponse>(queryKey, (list) =>
        appendComment(list, comment),
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
