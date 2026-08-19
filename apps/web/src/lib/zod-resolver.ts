/**
 * Convierte un `ZodError` en un mapa de `campo -> mensaje` para los formularios.
 * Es un helper simple, no React Hook Form.
 */
import type { ZodError } from "zod";

export function zodResolver(error: ZodError): Record<string, string> {
  const map: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !map[key]) {
      map[key] = issue.message;
    }
  }
  return map;
}
