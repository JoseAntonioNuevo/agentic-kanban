/**
 * `GET /api/projects/:projectId`.
 *
 * Primero la sesión, después el param. Si el usuario no es miembro del
 * workspace del project, o el project no existe, 404: no revelamos cuál
 * de los dos fue. El `workspace_id` sale de la fila, no de la URL.
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
    const project = await getProjectForMember(projectId, c.get("userId"));

    if (project === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(
      projectSchema.parse({
        id: project.id,
        workspaceId: project.workspaceId,
        name: project.name,
        createdAt: project.createdAt.toISOString(),
      }),
      200,
    );
  },
);
