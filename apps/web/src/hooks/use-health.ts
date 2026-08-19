import { healthResponseSchema } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

async function fetchHealth() {
  const response = await fetch("/api/health");

  if (!response.ok && response.status !== 503) {
    throw new Error(`Health request failed: ${response.status}`);
  }

  const json: unknown = await response.json();
  return healthResponseSchema.parse(json);
}

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });
}
