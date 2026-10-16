/**
 * Consultas de escritura idempotentes para el seed de aula.
 *
 * Todo es upsert (nunca DELETE): ejecutar el seed varias veces deja las
 * mismas filas. Los usuarios los crea Better Auth, aquí solo se consultan.
 */
import { eq } from "drizzle-orm";

import { getDb } from "../client.ts";
import { project, user, workspace, workspaceMember } from "../schema/index.ts";

/** `user.id` por email (se compara en minúsculas, como guarda Better Auth). */
export async function findUserIdByEmail(email: string): Promise<string | null> {
  const rows = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);

  return rows[0]?.id ?? null;
}

/** Crea el workspace o actualiza su nombre si el `id` ya existe. */
export async function upsertWorkspace(input: { id: string; name: string }): Promise<void> {
  await getDb()
    .insert(workspace)
    .values({ id: input.id, name: input.name })
    .onConflictDoUpdate({ target: workspace.id, set: { name: input.name } });
}

/** Crea el project o actualiza nombre y workspace si el `id` ya existe. */
export async function upsertProject(input: {
  id: string;
  workspaceId: string;
  name: string;
}): Promise<void> {
  await getDb()
    .insert(project)
    .values({ id: input.id, workspaceId: input.workspaceId, name: input.name })
    .onConflictDoUpdate({
      target: project.id,
      set: { name: input.name, workspaceId: input.workspaceId },
    });
}

/** Añade la membresía; si ya existe (`UNIQUE workspace_id, user_id`) no hace nada. */
export async function ensureWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
  await getDb()
    .insert(workspaceMember)
    .values({ workspaceId, userId })
    .onConflictDoNothing({ target: [workspaceMember.workspaceId, workspaceMember.userId] });
}
