/**
 * Servidor HTTP de la API: Hono sobre Bun (no Node).
 *
 * Monta `GET /api/health`, Better Auth en `/api/auth/*`, las lecturas
 * autenticadas de workspaces y projects, y el tablero con el CRUD de
 * tareas. Bun usa este `export default` (`port`, `hostname`, `fetch`) para
 * escuchar. Los tests importan `app`. Sin CORS: mismo origen vía el proxy.
 */
import { Hono } from "hono";

import { authRoutes } from "./routes/auth.ts";
import { boardRoutes } from "./routes/board.ts";
import { healthRoutes } from "./routes/health.ts";
import { projectRoutes } from "./routes/projects.ts";
import { workspaceRoutes } from "./routes/workspaces.ts";

export const app = new Hono();

// Cada módulo de rutas es un Hono pequeño; se cuelga en la raíz.
app.route("/", healthRoutes);
app.route("/", authRoutes);
app.route("/", workspaceRoutes);
app.route("/", projectRoutes);
app.route("/", boardRoutes);

const port = Number(process.env.API_PORT ?? 3000);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
