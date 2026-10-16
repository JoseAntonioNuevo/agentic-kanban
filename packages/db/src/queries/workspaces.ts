/**
 * Lecturas de workspaces y proyectos acotadas por membresía.
 *
 * Toda consulta parte de `workspace_member`: sin fila para ese usuario no hay
 * datos. El `workspace_id` sale siempre de la fila de la base, nunca de la
 * petición.
 */
import { and, asc, eq, inArray } from "drizzle-orm";

import { getDb } from "../client.ts";
import { project, workspace, workspaceMember } from "../schema/index.ts";

/** Resumen de proyecto dentro de un workspace. */
export type WorkspaceProjectSummary = { id: string; name: string };

/** Workspace del que el usuario es miembro, con sus proyectos. */
export type WorkspaceWithProjects = {
  id: string;
  name: string;
  createdAt: Date;
  projects: WorkspaceProjectSummary[];
};

/** Fila completa de `project`. */
export type ProjectRow = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
};

/**
 * Workspaces del usuario (por nombre) con sus proyectos (por nombre).
 * Dos consultas: workspaces del miembro y proyectos de esos workspaces.
 */
export async function listWorkspacesForUser(userId: string): Promise<WorkspaceWithProjects[]> {
  const db = getDb();

  const workspaces = await db
    .select({ id: workspace.id, name: workspace.name, createdAt: workspace.createdAt })
    .from(workspace)
    .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId))
    .orderBy(asc(workspace.name));

  if (workspaces.length === 0) {
    return [];
  }

  const projects = await db
    .select({ id: project.id, workspaceId: project.workspaceId, name: project.name })
    .from(project)
    .where(
      inArray(
        project.workspaceId,
        workspaces.map((row) => row.id),
      ),
    )
    .orderBy(asc(project.name));

  return workspaces.map((row) => ({
    ...row,
    projects: projects
      .filter((item) => item.workspaceId === row.id)
      .map((item) => ({ id: item.id, name: item.name })),
  }));
}

/**
 * Proyecto por id, solo si el usuario es miembro de su workspace.
 * Devuelve `null` si no existe o no es miembro (el llamador responde 404).
 */
export async function getProjectForMember(
  projectId: string,
  userId: string,
): Promise<ProjectRow | null> {
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
      and(eq(workspaceMember.workspaceId, project.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(project.id, projectId))
    .limit(1);

  return rows[0] ?? null;
}
