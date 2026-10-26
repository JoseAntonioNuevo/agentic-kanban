/**
 * `GET /api/workspaces`: workspaces del usuario, con sus projects.
 *
 * La sesión va en la ruta, no en `app.use("*")`. La membresía la filtra
 * `listWorkspacesForUser`. Una lista vacía es válida.
 */
import { listWorkspacesForUser } from "@agentic-kanban/db";
import { workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const workspaceRoutes = new Hono<SessionEnv>();

workspaceRoutes.get("/api/workspaces", requireSession, async (c) => {
  const workspaces = await listWorkspacesForUser(c.get("userId"));

  return c.json(
    workspaceListResponseSchema.parse(
      workspaces.map((workspace) => ({
        id: workspace.id,
        name: workspace.name,
        createdAt: workspace.createdAt.toISOString(),
        projects: workspace.projects,
      })),
    ),
    200,
  );
});
