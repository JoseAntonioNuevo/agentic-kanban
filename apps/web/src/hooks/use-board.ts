/**
 * Query del tablero de un project.
 *
 * Misma convención que `useWorkspaces`: la queryKey lleva el `userId`, así que
 * al cambiar de usuario nunca se reutiliza la caché del anterior. TanStack
 * Query es la única fuente del board: los componentes lo leen de aquí y nunca
 * lo copian a `useState`.
 */
import { boardResponseSchema } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

/** Clave de caché del tablero: siempre lleva el id del project y del usuario. */
export const boardQueryKey = (projectId: string, userId: string) =>
  ["board", projectId, userId] as const;

/** El API respondió 404: el project no existe o el usuario no es miembro. */
export class BoardNotFoundError extends Error {}

/** Pide el tablero con la cookie de sesión y valida el cuerpo con Zod. */
async function fetchBoard(projectId: string) {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/board`, {
    credentials: "include",
  });

  if (response.status === 404) {
    throw new BoardNotFoundError("Project no encontrado");
  }

  if (!response.ok) {
    throw new Error(`La petición del tablero falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return boardResponseSchema.parse(json);
}

/** Hook del tablero; un 404 no se reintenta, otros errores una sola vez. */
export function useBoard(projectId: string, userId: string) {
  return useQuery({
    queryKey: boardQueryKey(projectId, userId),
    queryFn: () => fetchBoard(projectId),
    retry: (failureCount, error) => !(error instanceof BoardNotFoundError) && failureCount < 1,
  });
}
