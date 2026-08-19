import { applyMigrations } from "@agentic-kanban/db";
import { Hono } from "hono";

import { auth } from "./auth/index.ts";
import { healthRoutes } from "./routes/health.ts";
import { workspaceRoutes } from "./routes/workspaces.ts";
import { seedDemoData } from "./seed.ts";

export const app = new Hono();

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.route("/", healthRoutes);
app.route("/", workspaceRoutes);

export async function prepareDatabase(): Promise<void> {
  await applyMigrations();
  await seedDemoData();
}

const port = Number(process.env.API_PORT ?? 3000);

if (import.meta.main) {
  await prepareDatabase();
}

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
