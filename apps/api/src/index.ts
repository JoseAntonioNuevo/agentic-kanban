/**
 * Servidor HTTP de la API: Hono sobre Bun (no Node).
 *
 * Monta health, Better Auth y los GET de lectura de workspace/project.
 * Bun usa este `export default` (`port`, `hostname`, `fetch`) para escuchar.
 */
import { Hono } from "hono";

import { authRoutes } from "./routes/auth.ts";
import { healthRoutes } from "./routes/health.ts";
import { projectRoutes } from "./routes/projects.ts";
import { workspaceRoutes } from "./routes/workspaces.ts";

export const app = new Hono();

// Cada módulo de rutas es un Hono pequeño; se cuelga en la raíz.
// Auth se monta antes para que el rate limiter y el handler de Better Auth
// gestionen `/api/auth/*` antes de cualquier catch-all.
app.route("/", authRoutes);
app.route("/", healthRoutes);
app.route("/", workspaceRoutes);
app.route("/", projectRoutes);

const port = Number(process.env.API_PORT ?? 3000);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
