/**
 * Servidor HTTP de la API: Hono sobre Bun (no Node).
 *
 * Monta `GET /api/health` y `/api/auth/*` (Better Auth). Las rutas de
 * workspace llegarán más adelante. Bun usa este `export default` (`port`,
 * `hostname`, `fetch`) para escuchar.
 */
import { Hono } from "hono";

import { authRoutes } from "./routes/auth.ts";
import { healthRoutes } from "./routes/health.ts";

const app = new Hono();

// Cada módulo de rutas es un Hono pequeño; se cuelga en la raíz.
app.route("/", healthRoutes);
app.route("/", authRoutes);

const port = Number(process.env.API_PORT ?? 3000);

export default {
  port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};
