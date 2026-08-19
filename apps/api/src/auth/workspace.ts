import { findMembership } from "@agentic-kanban/db";
import { createMiddleware } from "hono/factory";

import type { SessionEnv } from "./session.ts";

export const requireWorkspaceMember = createMiddleware<SessionEnv>(async (c, next) => {
  const workspaceId = c.req.param("workspaceId");
  const user = c.get("user");

  if (!workspaceId || !user) {
    return c.json({ error: "Forbidden" }, 403);
  }

  const membership = await findMembership(user.id, workspaceId);

  if (!membership) {
    return c.json({ error: "Forbidden" }, 403);
  }

  c.set("authorizedWorkspaceId", workspaceId);
  await next();
});
