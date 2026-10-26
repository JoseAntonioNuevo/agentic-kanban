/**
 * Lecturas y escrituras del workspace y de su membresía.
 *
 * `listWorkspacesForUser` devuelve solo workspaces donde el usuario es
 * miembro, y los projects de esos workspaces. El conflicto de id en el
 * upsert actualiza el nombre y deja `created_at` quieto. La membresía,
 * si el par ya existe, no hace nada: no reescribe `created_at` y no borra
 * filas.
 */
import { asc, eq, inArray } from "drizzle-orm";

import { db } from "../client.ts";
import { project } from "../schema/project.ts";
import { workspace, workspaceMember } from "../schema/workspace.ts";

export async function upsertWorkspace({ id, name }: { id: string; name: string }): Promise<void> {
  await db.insert(workspace).values({ id, name }).onConflictDoUpdate({
    target: workspace.id,
    set: { name },
  });
}

export async function addWorkspaceMember({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  await db
    .insert(workspaceMember)
    .values({ workspaceId, userId })
    .onConflictDoNothing({
      target: [workspaceMember.workspaceId, workspaceMember.userId],
    });
}

/**
 * Workspaces del usuario, con los projects de cada uno.
 *
 * El `workspace_id` autorizado sale de la membresía. El segundo select
 * solo corre si hay ids; un project de otro workspace no entra en la lista.
 */
export async function listWorkspacesForUser(userId: string): Promise<
  Array<{
    id: string;
    name: string;
    createdAt: Date;
    projects: Array<{ id: string; name: string }>;
  }>
> {
  const workspaceRows = await db
    .select({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
    })
    .from(workspace)
    .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId))
    .orderBy(asc(workspace.createdAt), asc(workspace.id));

  const workspaceIds = workspaceRows.map((row) => row.id);
  const projectsByWorkspaceId = new Map<string, Array<{ id: string; name: string }>>(
    workspaceIds.map((id) => [id, []]),
  );

  if (workspaceIds.length > 0) {
    const projectRows = await db
      .select({
        id: project.id,
        name: project.name,
        workspaceId: project.workspaceId,
      })
      .from(project)
      .where(inArray(project.workspaceId, workspaceIds))
      .orderBy(asc(project.createdAt), asc(project.id));

    for (const row of projectRows) {
      const projects = projectsByWorkspaceId.get(row.workspaceId);
      if (projects) {
        projects.push({ id: row.id, name: row.name });
      }
    }
  }

  return workspaceRows.map((row) => ({
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    projects: projectsByWorkspaceId.get(row.id) ?? [],
  }));
}
