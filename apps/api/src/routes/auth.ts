/**
 * Rutas de Better Auth bajo `/api/auth/*`.
 *
 * Better Auth valida el cuerpo en el servidor. No envuelvas estas rutas
 * con `@hono/zod-validator`. El handler recibe el `Request` original.
 */
import { Hono } from "hono";

import { auth } from "../auth/index.ts";

export const authRoutes = new Hono();

authRoutes.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));
