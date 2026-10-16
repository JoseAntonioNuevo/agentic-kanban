/**
 * Rutas de autenticación: `/api/auth/*`.
 *
 * Better Auth valida y responde por sí mismo, así que no se envuelve con
 * `@hono/zod-validator`. Solo se antepone el rate limit de registro/login.
 */
import { Hono } from "hono";

import { auth } from "../auth/index.ts";
import { authRateLimit } from "../auth/rate-limit.ts";

export const authRoutes = new Hono();

authRoutes.use("/api/auth/*", authRateLimit);

authRoutes.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
