/**
 * Workspaces del usuario en sesión. El JSON se parsea con el mismo Zod
 * que la API. La cookie httpOnly va en `credentials: "include"`.
 */
import { workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

async function fetchWorkspaces() {
  const response = await fetch("/api/workspaces", {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`La petición de workspaces falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return workspaceListResponseSchema.parse(json);
}

/** Lista tenant-scoped. `userId` en la queryKey evita mostrar la lista de otro login. */
export function useWorkspaces(userId: string | undefined) {
  return useQuery({
    queryKey: ["workspaces", userId],
    queryFn: fetchWorkspaces,
    enabled: Boolean(userId),
  });
}
