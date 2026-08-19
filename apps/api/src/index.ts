/**
 * Servidor HTTP de la API: Hono sobre Bun (no Node).
 *
 * Hoy solo monta `GET /api/health`. Better Auth y las rutas de workspace
 * se añaden en la Sesión 1. Bun usa este `export default` (`port`,
 * `hostname`, `fetch`) para escuchar.
 */
import { Hono } from "hono";

import { healthRoutes } from "./routes/health.ts";

const app = new Hono();

// Cada módulo de rutas es un Hono pequeño; se cuelga en la raíz.
app.route("/", healthRoutes);

const port = Number(process.env.API_PORT ?? 3000);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
