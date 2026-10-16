/**
 * Middleware `requireSession`: primer paso de toda ruta de producto.
 *
 * Lee la sesión de Better Auth desde la cookie. Sin sesión responde 401 con
 * `{ error }`; con sesión deja `userId` en el contexto para las consultas.
 */
import { errorResponseSchema } from "@agentic-kanban/schemas";
import { createMiddleware } from "hono/factory";

import { auth } from "../auth/index.ts";

export type SessionEnv = { Variables: { userId: string } };

export const requireSession = createMiddleware<SessionEnv>(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    return c.json(errorResponseSchema.parse({ error: "No autenticado" }), 401);
  }

  c.set("userId", session.user.id);
  await next();
});
