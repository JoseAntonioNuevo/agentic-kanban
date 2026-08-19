/**
 * Contrato Zod de `GET /api/health`.
 *
 * TypeScript tipa en compile-time; Zod valida en runtime (API y web
 * llaman a `.parse()` sobre el mismo schema). `z.infer` deriva el tipo
 * para no duplicar la forma a mano.
 */
import { z } from "zod";

/** Estado de un servicio concreto (API o base de datos). */
export const serviceStatusSchema = z.enum(["ok", "error"]);

/**
 * Cuerpo de health:
 * - `status`: resumen (`degraded` = API viva, DB caída).
 * - `api` / `database`: detalle por capa.
 */
export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  api: serviceStatusSchema,
  database: serviceStatusSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
