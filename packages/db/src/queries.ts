/**
 * Acceso a tenant. La API no importa drizzle-orm: lecturas
 * (`listWorkspacesForUser`, `getProjectForMember`) y upserts del seed.
 * Toda query de project/workspace pasa por membership
 * (`workspace_member.user_id`) y el `workspace_id` de la fila, nunca de
 * un argumento que el cliente haya elegido como permiso. Nunca DELETE masivo.
 */
import { and, eq } from "drizzle-orm";

import { getDb } from "./client.ts";
import { user } from "./schema/auth.ts";
import { project } from "./schema/project.ts";
import { workspace, workspaceMember } from "./schema/workspace.ts";

export type WorkspaceRow = {
  id: string;
  name: string;
  createdAt: Date;
};

export type ProjectRow = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
};

/** Workspaces donde `userId` aparece en `workspace_member`. */
export async function listWorkspacesForUser(userId: string): Promise<WorkspaceRow[]> {
  return getDb()
    .select({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
    })
    .from(workspace)
    .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId));
}

/**
 * Project si el usuario es miembro del `workspace_id` de esa fila.
 * El join usa el workspace de la fila, no un workspaceId de argumento.
 */
export async function getProjectForMember(
  projectId: string,
  userId: string,
): Promise<ProjectRow | undefined> {
  const rows = await getDb()
    .select({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      createdAt: project.createdAt,
    })
    .from(project)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, project.workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .where(eq(project.id, projectId))
    .limit(1);

  return rows[0];
}

/** `user.id` de Better Auth por email (normalizado a minúsculas). No inserta. */
export async function findUserIdByEmail(email: string): Promise<string | undefined> {
  const rows = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);

  return rows[0]?.id;
}

/** Inserción usada por tests. No es un endpoint. */
export async function insertWorkspace(values: { id: string; name: string }): Promise<void> {
  await getDb().insert(workspace).values(values);
}

export async function insertWorkspaceMember(values: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  await getDb().insert(workspaceMember).values(values);
}

export async function insertProject(values: {
  id: string;
  workspaceId: string;
  name: string;
}): Promise<void> {
  await getDb().insert(project).values(values);
}

/** Upsert por `id`. El seed lo usa; no borra filas. */
export async function upsertWorkspace(values: { id: string; name: string }): Promise<void> {
  await getDb()
    .insert(workspace)
    .values(values)
    .onConflictDoUpdate({
      target: workspace.id,
      set: { name: values.name },
    });
}

export async function upsertProject(values: {
  id: string;
  workspaceId: string;
  name: string;
}): Promise<void> {
  await getDb()
    .insert(project)
    .values(values)
    .onConflictDoUpdate({
      target: project.id,
      set: { name: values.name, workspaceId: values.workspaceId },
    });
}

export async function upsertWorkspaceMember(values: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  await getDb()
    .insert(workspaceMember)
    .values(values)
    .onConflictDoNothing({
      target: [workspaceMember.workspaceId, workspaceMember.userId],
    });
}
