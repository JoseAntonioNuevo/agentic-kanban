/**
 * Lectura autorizada y escritura idempotente del proyecto.
 *
 * `getProjectForMember` solo devuelve el project si el usuario es miembro
 * de su workspace. El `workspace_id` sale de la fila. Si el id ya existe,
 * el upsert actualiza nombre y workspace y no toca `created_at`.
 */
import { and, eq } from "drizzle-orm";

import { db } from "../client.ts";
import { project } from "../schema/project.ts";
import { workspaceMember } from "../schema/workspace.ts";

export async function upsertProject({
  id,
  workspaceId,
  name,
}: {
  id: string;
  workspaceId: string;
  name: string;
}): Promise<void> {
  await db.insert(project).values({ id, workspaceId, name }).onConflictDoUpdate({
    target: project.id,
    set: { name, workspaceId },
  });
}

/**
 * Project visible para un miembro de su workspace.
 *
 * Sin membresía, o si el project no existe, el join no devuelve fila.
 */
export async function getProjectForMember(
  projectId: string,
  userId: string,
): Promise<{ id: string; workspaceId: string; name: string; createdAt: Date } | undefined> {
  const rows = await db
    .select({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      createdAt: project.createdAt,
    })
    .from(project)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, project.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(project.id, projectId))
    .limit(1);

  return rows[0];
}
