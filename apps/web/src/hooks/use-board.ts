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

  // #region agent log
  fetch("http://127.0.0.1:7647/ingest/ba5bd8d3-f312-4898-9461-0e2daa745a39", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "81244b" },
    body: JSON.stringify({
      sessionId: "81244b",
      hypothesisId: "A",
      location: "use-board.ts:fetchBoard",
      message: "board fetch result",
      data: { projectId, status: response.status, ok: response.ok },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!response.ok) {
    throw new Error(`La petición del tablero falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  const parsed = boardResponseSchema.safeParse(json);
  // #region agent log
  fetch("http://127.0.0.1:7647/ingest/ba5bd8d3-f312-4898-9461-0e2daa745a39", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "81244b" },
    body: JSON.stringify({
      sessionId: "81244b",
      hypothesisId: "A",
      location: "use-board.ts:parse",
      message: "board parse",
      data: {
        projectId,
        success: parsed.success,
        issues: parsed.success ? undefined : parsed.error.issues.slice(0, 5),
        columnCount: parsed.success ? parsed.data.columns.length : undefined,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
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
