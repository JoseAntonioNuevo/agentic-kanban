/**
 * `GET /api/projects/:projectId`: el project si el usuario es miembro de su
 * workspace. Si no existe o no es miembro responde 404 (nunca 403) para no
 * revelar que el recurso existe.
 */
import { getProjectForMember } from "@agentic-kanban/db";
import { errorResponseSchema, projectIdParamSchema, projectSchema } from "@agentic-kanban/schemas";
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
      return c.json(errorResponseSchema.parse({ error: "No encontrado" }), 404);
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
