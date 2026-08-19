/**
 * Ruta de infraestructura: `GET /api/health`.
 *
 * Sirve para Docker (healthcheck) y para la pantalla starter.
 * Flujo: ping a libSQL → armar el objeto → validarlo con Zod (el mismo
 * schema que parsea el frontend) → JSON. Si `SELECT 1` falla, la API
 * sigue viva y responde 503 con `database: "error"`.
 */
import { pingDatabase } from "@agentic-kanban/db";
import { healthResponseSchema } from "@agentic-kanban/schemas";
import { Hono } from "hono";

export const healthRoutes = new Hono();

healthRoutes.get("/api/health", async (c) => {
  try {
    await pingDatabase();

    return c.json(
      healthResponseSchema.parse({
        status: "ok",
        api: "ok",
        database: "ok",
      }),
    );
  } catch (error) {
    console.error("Falló el chequeo de la base de datos", error);

    return c.json(
      healthResponseSchema.parse({
        status: "degraded",
        api: "ok",
        database: "error",
      }),
      503,
    );
  }
});
