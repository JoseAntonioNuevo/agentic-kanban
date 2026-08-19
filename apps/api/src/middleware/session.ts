/**
 * Sesión Better Auth → `userId` en el contexto, o 401.
 *
 * Orden de authz (siempre): sesión aquí; membership en la query de db.
 * Nunca 403.
 */
import { createMiddleware } from "hono/factory";

import { auth } from "../auth/index.ts";

export type SessionEnv = {
  Variables: {
    userId: string;
  };
};

export const requireSession = createMiddleware<SessionEnv>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  c.set("userId", session.user.id);
  await next();
});
