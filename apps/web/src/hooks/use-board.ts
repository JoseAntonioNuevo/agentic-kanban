/**
 * Tablero de un project. El JSON se parsea con el mismo Zod que la API.
 */
import { boardResponseSchema } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

export function boardQueryKey(projectId: string, userId: string | undefined) {
  return ["board", projectId, userId] as const;
}

async function fetchBoard(projectId: string) {
  const response = await fetch(`/api/projects/${projectId}/board`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`La petición del tablero falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  const parsed = boardResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw parsed.error;
  }
  return parsed.data;
}

/** Server state del board. `userId` en la queryKey evita filtrar cache entre logins. */
export function useBoard(projectId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: boardQueryKey(projectId ?? "", userId),
    queryFn: () => fetchBoard(projectId!),
    enabled: Boolean(projectId && userId),
  });
}
