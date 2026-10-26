/**
 * Exige una sesión de Better Auth y deja `userId` en el contexto.
 *
 * Sin sesión, o si el refresh falla con `APIError` de estado
 * `UNAUTHORIZED`, responde 401. Cualquier otro error se relanza.
 * La membresía se comprueba después, en la consulta.
 */
import { APIError } from "better-auth/api";
import { createMiddleware } from "hono/factory";

import { auth } from "../auth/index.ts";

export type SessionEnv = {
  Variables: {
    userId: string;
  };
};

export const requireSession = createMiddleware<SessionEnv>(async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (session === null) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("userId", session.user.id);
    await next();
  } catch (error) {
    if (error instanceof APIError && error.status === "UNAUTHORIZED") {
      return c.json({ error: "Unauthorized" }, 401);
    }

    throw error;
  }
});
