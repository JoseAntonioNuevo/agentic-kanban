/**
 * `GET /api/workspaces`: workspaces de los que el usuario es miembro, cada
 * uno con sus projects. Lista vacía si no pertenece a ninguno.
 */
import { listWorkspacesForUser } from "@agentic-kanban/db";
import { workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const workspaceRoutes = new Hono<SessionEnv>();

workspaceRoutes.get("/api/workspaces", requireSession, async (c) => {
  const rows = await listWorkspacesForUser(c.get("userId"));

  return c.json(
    workspaceListResponseSchema.parse(
      rows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.createdAt.toISOString(),
        projects: row.projects,
      })),
    ),
  );
});
