/**
 * Query de TanStack Query que demuestra el contrato compartido de health.
 *
 * El navegador llama a `/api/health` (URL relativa: el proxy de Vite+ la
 * reenvía a Hono). El JSON se trata como `unknown` y se parsea con Zod
 * (`healthResponseSchema`), no con un cast de TypeScript.
 */
import { healthResponseSchema } from "@agentic-kanban/schemas";
import { useQuery } from "@tanstack/react-query";

/**
 * Pide el health al API y valida el cuerpo en runtime.
 * Un 503 es válido: la API está viva pero la base de datos falló (status degraded).
 */
async function fetchHealth() {
  const response = await fetch("/api/health");

  if (!response.ok && response.status !== 503) {
    throw new Error(`La petición de health falló: ${response.status}`);
  }

  const json: unknown = await response.json();
  return healthResponseSchema.parse(json);
}

/** Hook de la pantalla starter. Cachea el resultado bajo la clave `["health"]`. */
export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
  });
}
