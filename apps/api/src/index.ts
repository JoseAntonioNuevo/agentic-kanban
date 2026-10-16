/**
 * Servidor HTTP de la API: Hono sobre Bun (no Node).
 *
 * Monta `GET /api/health`, `/api/auth/*` (Better Auth), las lecturas
 * autorizadas de workspaces y projects, las rutas del tablero (leer el
 * board y crear, editar y borrar tareas) y el stream SSE de eventos. `app` se exporta para los tests; Bun
 * usa el `export default` (`port`, `hostname`, `fetch`) para escuchar.
 */
import type { Server } from "bun";
import { Hono } from "hono";

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
  // Bun cierra las conexiones inactivas a los 10 s. Se desactiva en global y,
  // además, por petición en `/events` (`server.timeout`), que es lo que de
  // verdad necesita el SSE.
  idleTimeout: 0,
  fetch(request: Request, server: Server<undefined>) {
    // `server.timeout(request, 0)` quita el límite de inactividad de esta petición.
    if (new URL(request.url).pathname.endsWith("/events")) server.timeout(request, 0);
    // El 2.º argumento de `app.fetch` es `env`, no el `server` de Bun.
    return app.fetch(request);
  },
};
