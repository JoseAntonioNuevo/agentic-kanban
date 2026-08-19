/**
 * Rutas de Better Auth montadas en `/api/auth/*`.
 *
 * Better Auth maneja `POST /api/auth/sign-up/email`,
 * `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`,
 * `GET /api/auth/get-session`, etc.
 *
 * El rate limiter in-memory solo protege sign-up y sign-in. `get-session`
 * pasa sin límite. No envolvemos los endpoints con `@hono/zod-validator`:
 * Better Auth valida el servidor.
 */
import { Hono } from "hono";

import { auth } from "../auth/index.ts";
import { rateLimitByIp } from "../middleware/rate-limit.ts";

export const authRoutes = new Hono();

// Rate limit selectivo antes de delegar al handler de Better Auth.
authRoutes.use("/api/auth/*", rateLimitByIp());

/**
 * Delega TODO `/api/auth/*` al handler de Better Auth.
 * `auth.handler` recibe el `Request` crudo y devuelve la `Response`.
 */
authRoutes.on(["GET", "POST"], "/api/auth/*", (c) => {
  return auth.handler(c.req.raw);
});
