/**
 * Tablero de un proyecto para el usuario con sesión.
 *
 * La queryKey es `[scope, userId, projectId]`: el userId en segunda posición
 * permite que un cambio de identidad tire solo las entradas de quien salió.
 * El cuerpo se valida con `boardResponseSchema`. Un 404 es
 * `BoardNotFoundError` y no se reintenta: el proyecto no existe o no hay
 * membresía, y la pantalla lo distingue del error de red.
 */
import { boardResponseSchema, type BoardResponse } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

/** Clave de caché del tablero de un usuario en un proyecto. */
export function boardQueryKey(projectId: string, userId: string) {
  return ["board", userId, projectId] as const;
}

/** El proyecto no existe para esta sesión (404). No es un fallo transitorio. */
export class BoardNotFoundError extends Error {
  constructor() {
    super("Proyecto no encontrado");
    this.name = "BoardNotFoundError";
  }
}

/**
 * Pide GET /api/projects/:projectId/board y valida el cuerpo en runtime.
 * La cookie de sesión viaja con `credentials: "include"`.
 * Un 404 lanza `BoardNotFoundError`. Otro HTTP no ok lanza `Error`.
 * Un cuerpo que no cumple el schema lanza `ZodError`.
 */
export async function fetchBoard(projectId: string, signal?: AbortSignal): Promise<BoardResponse> {
  const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/board`, {
    credentials: "include",
    signal,
  });

  if (response.status === 404) {
    throw new BoardNotFoundError();
  }

  if (!response.ok) {
    throw new Error(`La petición del tablero falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return boardResponseSchema.parse(json);
}

/**
 * Tablero del proyecto para el usuario con sesión.
 * Solo se llama dentro de la rama con sesión (`userId` no vacío).
 */
export function useBoard(projectId: string, userId: string) {
  return useQuery({
    queryKey: boardQueryKey(projectId, userId),
    queryFn: ({ signal }) => fetchBoard(projectId, signal),
    retry: (failureCount, error) => !(error instanceof BoardNotFoundError) && failureCount < 1,
  });
}
