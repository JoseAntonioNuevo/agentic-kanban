import {
  getProjectForWorkspace,
  getProjectInWorkspace,
  getWorkspace,
  listWorkspacesForUser,
} from "@agentic-kanban/db";
import {
  projectResponseSchema,
  workspaceDetailResponseSchema,
  workspaceIdParamSchema,
  workspaceListResponseSchema,
  workspaceProjectParamsSchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../auth/session.ts";
import { requireWorkspaceMember } from "../auth/workspace.ts";

export const workspaceRoutes = new Hono<SessionEnv>();

workspaceRoutes.get("/api/workspaces", requireSession, async (c) => {
  const rows = await listWorkspacesForUser(c.get("user").id);

  return c.json(
    workspaceListResponseSchema.parse({
      workspaces: rows.map((row) => ({
        id: row.id,
        name: row.name,
        project:
          row.projectId && row.projectName && row.projectWorkspaceId
            ? {
                id: row.projectId,
                workspaceId: row.projectWorkspaceId,
                name: row.projectName,
              }
            : null,
      })),
    }),
  );
});

workspaceRoutes.get(
  "/api/workspaces/:workspaceId",
  zValidator("param", workspaceIdParamSchema),
  requireSession,
  requireWorkspaceMember,
  async (c) => {
    const workspaceId = c.get("authorizedWorkspaceId");
    const [workspace, project] = await Promise.all([
      getWorkspace(workspaceId),
      getProjectForWorkspace(workspaceId),
    ]);

    if (!workspace) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(
      workspaceDetailResponseSchema.parse({
        id: workspace.id,
        name: workspace.name,
        project: project
          ? {
              id: project.id,
              workspaceId: project.workspaceId,
              name: project.name,
            }
          : null,
      }),
    );
  },
);

workspaceRoutes.get(
  "/api/workspaces/:workspaceId/projects/:projectId",
  zValidator("param", workspaceProjectParamsSchema),
  requireSession,
  requireWorkspaceMember,
  async (c) => {
    const project = await getProjectInWorkspace(
      c.req.valid("param").projectId,
      c.get("authorizedWorkspaceId"),
    );

    if (!project) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(
      projectResponseSchema.parse({
        id: project.id,
        workspaceId: project.workspaceId,
        name: project.name,
      }),
    );
  },
);
