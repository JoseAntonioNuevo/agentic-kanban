/**
 * Workspaces del usuario autenticado.
 *
 * Convención: toda query de datos del usuario lleva el userId como segundo
 * elemento de la queryKey: `[scope, userId, ...]`. Así un cambio de identidad
 * puede tirar solo las entradas de quien salió, sin mezclarlas con las del
 * siguiente ni con `["health"]`.
 */
import { workspaceListResponseSchema, type WorkspaceListResponse } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

/** Clave de caché de la lista de workspaces de un usuario. */
export function workspacesQueryKey(userId: string) {
  return ["workspaces", userId] as const;
}

/**
 * Pide GET /api/workspaces y valida el cuerpo en runtime.
 * La cookie de sesión viaja con `credentials: "include"`.
 * Un cuerpo que no cumple el schema lanza `ZodError`; un HTTP no ok lanza `Error`.
 */
export async function fetchWorkspaces(signal?: AbortSignal): Promise<WorkspaceListResponse> {
  const response = await fetch("/api/workspaces", {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    throw new Error(`La petición de espacios de trabajo falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return workspaceListResponseSchema.parse(json);
}

/**
 * Lista de workspaces del usuario con sesión.
 * Solo se llama dentro de la rama con sesión (`userId` no vacío).
 */
export function useWorkspaces(userId: string) {
  return useQuery({
    queryKey: workspacesQueryKey(userId),
    queryFn: ({ signal }) => fetchWorkspaces(signal),
  });
}
