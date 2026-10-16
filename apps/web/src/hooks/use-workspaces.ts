/**
 * Query de los workspaces del usuario (con sus projects).
 *
 * Convención para toda query de datos del usuario: la queryKey incluye el
 * `userId`, así que al cambiar de usuario en la misma pestaña nunca se
 * reutiliza la caché del anterior. Además, al cerrar sesión se llama a
 * `queryClient.clear()` (ver `App.tsx`).
 */
import { workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

/** Clave de caché de los workspaces: siempre lleva el id del usuario. */
export const workspacesQueryKey = (userId: string) => ["workspaces", userId] as const;

/** Pide `/api/workspaces` con la cookie de sesión y valida el cuerpo con Zod. */
async function fetchWorkspaces() {
  const response = await fetch("/api/workspaces", { credentials: "include" });

  if (!response.ok) {
    throw new Error(`La petición de workspaces falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return workspaceListResponseSchema.parse(json);
}

/** Hook de la lista de workspaces del usuario autenticado. */
export function useWorkspaces(userId: string) {
  return useQuery({
    queryKey: workspacesQueryKey(userId),
    queryFn: fetchWorkspaces,
  });
}
