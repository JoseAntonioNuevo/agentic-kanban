/**
 * `GET /api/projects/:projectId` — el project si el usuario es miembro
 * del workspace de esa fila.
 *
 * 1. Sesión Better Auth. Sin sesión → 401.
 * 2. Membership / inexistente → 404 (nunca 403).
 * 3. `workspace_id` sale de la fila (join en `getProjectForMember`), no
 *    del cliente.
 */
import { getProjectForMember } from "@agentic-kanban/db";
import { projectIdParamSchema, projectSchema } from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const projectRoutes = new Hono<SessionEnv>();

projectRoutes.get(
  "/api/projects/:projectId",
  requireSession,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const row = await getProjectForMember(projectId, c.get("userId"));

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(
      projectSchema.parse({
        id: row.id,
        workspaceId: row.workspaceId,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
      }),
    );
  },
);
