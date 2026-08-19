import { z } from "zod";

export const serviceStatusSchema = z.enum(["ok", "error"]);

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  api: serviceStatusSchema,
  database: serviceStatusSchema,
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
