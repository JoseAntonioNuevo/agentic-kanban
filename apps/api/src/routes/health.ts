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
    console.error("Health database check failed", error);

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
