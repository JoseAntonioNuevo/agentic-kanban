/**
 * `GET /api/projects/:projectId/events` — SSE de anuncios de tablero.
 *
 * 1. Sesión Better Auth. Sin sesión → 401.
 * 2. Membership / inexistente → 404 (nunca 403).
 * 3. `workspace_id` sale de la fila (`getProjectForMember`), no del cliente.
 * 4. El cliente aborta → `onAbort` desuscribe (sin fugas).
 *
 * HTTP sigue siendo la escritura. Este GET no publica.
 * Cada frame SSE es solo `data`: el JSON de `boardEventSchema` (sin `event:`).
 */
import { getProjectForMember } from "@agentic-kanban/db";
import { projectIdParamSchema } from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import { requireSession, type SessionEnv } from "../middleware/session.ts";
import { subscribe } from "../realtime/index.ts";

export const eventRoutes = new Hono<SessionEnv>();

eventRoutes.get(
  "/api/projects/:projectId/events",
  requireSession,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const row = await getProjectForMember(projectId, c.get("userId"));

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    return streamSSE(c, async (stream) => {
      const unsubscribe = subscribe(projectId, (event) => {
        void stream.writeSSE({ data: JSON.stringify(event) });
      });

      await new Promise<void>((resolve) => {
        const done = () => {
          unsubscribe();
          resolve();
        };
        stream.onAbort(done);
        if (stream.aborted) {
          done();
        }
      });
    });
  },
);
