/**
 * Servidor HTTP de la API: Hono sobre Bun (no Node).
 *
 * Monta `GET /api/health`, Better Auth en `/api/auth/*`, las lecturas
 * autenticadas de workspaces y projects, y el tablero con el CRUD de
 * tareas, y el canal WebSocket `/api/projects/:projectId/events`. Bun usa
 * este `export default` (`port`, `hostname`, `fetch`, `websocket`) para
 * escuchar; pasa el server como segundo argumento de `fetch` y Hono lo
 * recibe como env para el upgrade. Los pings y el `idleTimeout` del
 * WebSocket son los de Bun. Los tests importan `app`. Sin CORS: mismo
 * origen vía el proxy.
 */
import { Hono } from "hono";
import { websocket } from "hono/bun";

import { authRoutes } from "./routes/auth.ts";
import { boardRoutes } from "./routes/board.ts";
import { eventRoutes } from "./routes/events.ts";
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
app.route("/", eventRoutes);

const port = Number(process.env.API_PORT ?? 3000);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  websocket,
};
