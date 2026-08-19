import { workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

async function fetchWorkspaces() {
  const response = await fetch("/api/workspaces");

  if (!response.ok) {
    throw new Error(`Workspace request failed: ${response.status}`);
  }

  const json: unknown = await response.json();
  return workspaceListResponseSchema.parse(json);
}

export function useWorkspaces(enabled: boolean) {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: fetchWorkspaces,
    enabled,
  });
}
