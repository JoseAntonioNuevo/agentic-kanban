/**
 * Servidor HTTP de la API: Hono sobre Bun (no Node).
 *
 * Monta `GET /api/health`, `/api/auth/*` (Better Auth) y las lecturas
 * autorizadas de workspaces y projects. `app` se exporta para los tests; Bun
 * usa el `export default` (`port`, `hostname`, `fetch`) para escuchar.
 */
import { Hono } from "hono";

import { authRoutes } from "./routes/auth.ts";
import { healthRoutes } from "./routes/health.ts";
import { projectRoutes } from "./routes/projects.ts";
import { workspaceRoutes } from "./routes/workspaces.ts";

export const app = new Hono();

// Cada módulo de rutas es un Hono pequeño; se cuelga en la raíz.
app.route("/", healthRoutes);
app.route("/", authRoutes);
app.route("/", workspaceRoutes);
app.route("/", projectRoutes);

const port = Number(process.env.API_PORT ?? 3000);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
