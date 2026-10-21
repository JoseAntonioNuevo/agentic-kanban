/**
 * Escrituras idempotentes del workspace y de su membresía.
 *
 * El conflicto de id actualiza el nombre y deja `created_at` quieto.
 * La membresía, si el par ya existe, no hace nada: no reescribe
 * `created_at` y no borra filas.
 */
import { db } from "../client.ts";
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
