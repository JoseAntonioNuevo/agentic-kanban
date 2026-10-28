/**
 * `GET /api/projects/:projectId/events`: el canal WebSocket del tablero.
 *
 * Nada se abre antes de autorizar: sesión (401), param y membresía (404,
 * el `workspace_id` sale de la fila del project), cabecera
 * `Upgrade: websocket` (426) y solo entonces `upgradeWebSocket`. El canal
 * solo anuncia: cada mensaje es `JSON.stringify(event)` sin envoltorio, y
 * lo que mande el cliente se ignora (no hay `onMessage`).
 */
import { getProjectForMember } from "@agentic-kanban/db";
import { projectIdParamSchema } from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import type { WSEvents } from "hono/ws";

import { requireSession, type SessionEnv } from "../middleware/session.ts";
import { subscribe } from "../realtime/index.ts";

/** Manejadores del socket: alta en el hub al abrir, baja al cerrar. */
export function boardSocketEvents(projectId: string): WSEvents {
  let unsubscribe: (() => void) | undefined;

  return {
    onOpen(_event, ws) {
      unsubscribe = subscribe(projectId, (event) => {
        ws.send(JSON.stringify(event));
      });
    },
    onClose() {
      unsubscribe?.();
      unsubscribe = undefined;
    },
  };
}

export const eventRoutes = new Hono<SessionEnv>();

eventRoutes.get(
  "/api/projects/:projectId/events",
  requireSession,
  zValidator("param", projectIdParamSchema),
  async (c, next) => {
    const { projectId } = c.req.valid("param");
    const project = await getProjectForMember(projectId, c.get("userId"));

    if (project === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    if (c.req.header("upgrade")?.toLowerCase() !== "websocket") {
      return c.json({ error: "Upgrade Required" }, 426);
    }

    await next();
  },
  upgradeWebSocket((c) => boardSocketEvents(c.req.param("projectId") ?? "")),
  // Si `server.upgrade` falla, `upgradeWebSocket` llama a `next()`: sin
  // este manejador la petición acabaría en un 404 engañoso.
  (c) => c.json({ error: "Upgrade Required" }, 426),
);
