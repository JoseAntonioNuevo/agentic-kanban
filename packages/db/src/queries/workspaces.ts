import { and, eq } from "drizzle-orm";

import { getDb } from "../client.ts";
import { project, user, workspace, workspaceMember } from "../schema/index.ts";

export async function getUserByEmail(email: string) {
  const rows = await getDb()
    .select()
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);

  return rows[0] ?? null;
}

export async function findMembership(userId: string, workspaceId: string) {
  const rows = await getDb()
    .select()
    .from(workspaceMember)
    .where(and(eq(workspaceMember.userId, userId), eq(workspaceMember.workspaceId, workspaceId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getWorkspace(workspaceId: string) {
  const rows = await getDb().select().from(workspace).where(eq(workspace.id, workspaceId)).limit(1);

  return rows[0] ?? null;
}

export async function getProjectInWorkspace(projectId: string, authorizedWorkspaceId: string) {
  const rows = await getDb()
    .select()
    .from(project)
    .where(and(eq(project.id, projectId), eq(project.workspaceId, authorizedWorkspaceId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getProjectForWorkspace(authorizedWorkspaceId: string) {
  const rows = await getDb()
    .select()
    .from(project)
    .where(eq(project.workspaceId, authorizedWorkspaceId))
    .limit(1);

  return rows[0] ?? null;
}

export async function listWorkspacesForUser(userId: string) {
  return getDb()
    .select({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      projectId: project.id,
      projectName: project.name,
      projectWorkspaceId: project.workspaceId,
    })
    .from(workspaceMember)
    .innerJoin(workspace, eq(workspace.id, workspaceMember.workspaceId))
    .leftJoin(project, eq(project.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId));
}

export async function upsertWorkspace(input: { id: string; name: string }) {
  const now = new Date();
  await getDb()
    .insert(workspace)
    .values({
      id: input.id,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: workspace.id,
      set: { name: input.name, updatedAt: now },
    });
}

export async function upsertProject(input: { id: string; workspaceId: string; name: string }) {
  const now = new Date();
  await getDb()
    .insert(project)
    .values({
      id: input.id,
      workspaceId: input.workspaceId,
      name: input.name,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: project.id,
      set: { name: input.name, workspaceId: input.workspaceId, updatedAt: now },
    });
}

export async function addMembership(input: { workspaceId: string; userId: string }) {
  await getDb()
    .insert(workspaceMember)
    .values({
      workspaceId: input.workspaceId,
      userId: input.userId,
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}
