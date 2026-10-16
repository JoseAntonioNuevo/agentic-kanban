/**
 * `GET /api/projects/:projectId/events`: stream SSE con los eventos del
 * tablero de un project. Autorización: sesión → membresía (no miembro o
 * inexistente → 404, nunca 403). Los eventos llegan del hub en memoria
 * (`../realtime/index.ts`).
 */
import { getProjectForMember } from "@agentic-kanban/db";
import {
  errorResponseSchema,
  projectIdParamSchema,
  type BoardEvent,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

import { requireSession, type SessionEnv } from "../middleware/session.ts";
import { subscribe } from "../realtime/index.ts";

const KEEPALIVE_INTERVAL_MS = 15_000;

export const eventRoutes = new Hono<SessionEnv>();

eventRoutes.get(
  "/api/projects/:projectId/events",
  requireSession,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const project = await getProjectForMember(projectId, c.get("userId"));

    if (!project) {
      return c.json(errorResponseSchema.parse({ error: "No encontrado" }), 404);
    }

    c.header("X-Accel-Buffering", "no");

    const response = streamSSE(c, async (stream) => {
      // Solo este bucle escribe en el stream. Los listeners del hub y el timer
      // únicamente encolan o marcan y despiertan el bucle: en Bun, escribir
      // desde el contexto de otra petición (la que publica) no llegaba al
      // cliente de forma fiable.
      const queue: BoardEvent[] = [];
      let keepaliveDue = false;
      let wake: (() => void) | null = null;

      const wakeUp = () => {
        wake?.();
        wake = null;
      };

      const unsubscribe = subscribe(project.id, (event) => {
        queue.push(event);
        wakeUp();
      });
      const timer = setInterval(() => {
        keepaliveDue = true;
        wakeUp();
      }, KEEPALIVE_INTERVAL_MS);

      const cleanup = () => {
        unsubscribe();
        clearInterval(timer);
      };

      // Al desconectarse el cliente: baja del hub, parar el keepalive y
      // despertar el bucle para que termine.
      stream.onAbort(() => {
        cleanup();
        wakeUp();
      });

      try {
        // `EventSource` pasa a OPEN al recibir el primer byte.
        await stream.write(": connected\n\n");

        while (!stream.aborted && !stream.closed) {
          if (queue.length === 0 && !keepaliveDue) {
            await new Promise<void>((resolve) => {
              wake = resolve;
            });
          }

          // Un frame solo con `data` (sin `event:`) para que `onmessage` reciba todo.
          for (let event = queue.shift(); event; event = queue.shift()) {
            await stream.writeSSE({ data: JSON.stringify(event) });
          }

          if (keepaliveDue) {
            keepaliveDue = false;
            await stream.write(": keepalive\n\n");
          }
        }
      } finally {
        cleanup();
      }
    });

    // `streamSSE` sobrescribe un `Cache-Control` previo: se fija después.
    response.headers.set("Cache-Control", "no-cache, no-transform");
    return response;
  },
);
