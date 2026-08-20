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

    // El proxy de Vite no debe bufferizar el stream.
    c.header("Cache-Control", "no-cache, no-transform");
    c.header("X-Accel-Buffering", "no");

    return streamSSE(c, async (stream) => {
      const pending: string[] = [];
      let wake: (() => void) | undefined;

      const poke = () => {
        const resolve = wake;
        wake = undefined;
        resolve?.();
      };

      const enqueue = (data: string) => {
        pending.push(data);
        poke();
      };

      // Escribe solo dentro de este loop: un writeSSE desde el POST de
      // otro request no flushes de forma fiable en Bun.
      const unsubscribe = subscribe(projectId, (event) => {
        enqueue(JSON.stringify(event));
      });

      stream.onAbort(poke);

      // Primer byte para que EventSource pase a OPEN. `keepalive` no es
      // un boardEvent: el cliente lo ignora en el safeParse.
      enqueue("keepalive");

      const heartbeat = setInterval(() => {
        enqueue("keepalive");
      }, 15_000);
      heartbeat.unref();

      try {
        while (!stream.aborted) {
          const data = pending.shift();
          if (data === undefined) {
            await new Promise<void>((resolve) => {
              wake = resolve;
              if (stream.aborted) {
                poke();
              }
            });
            continue;
          }
          await stream.writeSSE({ data });
        }
      } catch {
        // El cliente cerró a mitad de un write.
      } finally {
        clearInterval(heartbeat);
        unsubscribe();
      }
    });
  },
);
