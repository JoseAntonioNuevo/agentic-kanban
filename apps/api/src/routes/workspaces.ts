/**
 * `GET /api/workspaces` — workspaces del usuario de la sesión.
 *
 * 1. Sesión Better Auth. Sin sesión → 401.
 * 2. Membership: `listWorkspacesForUser` (join con workspace_member).
 * 3. El query string no autoriza (no hay workspaceId de permiso).
 */
import { listWorkspacesForUser } from "@agentic-kanban/db";
import { workspaceListResponseSchema, workspacesQuerySchema } from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const workspaceRoutes = new Hono<SessionEnv>();

workspaceRoutes.get(
  "/api/workspaces",
  requireSession,
  zValidator("query", workspacesQuerySchema),
  async (c) => {
    const rows = await listWorkspacesForUser(c.get("userId"));

    return c.json(
      workspaceListResponseSchema.parse(
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          createdAt: row.createdAt.toISOString(),
        })),
      ),
    );
  },
);
