/**
 * Escritura idempotente del proyecto.
 *
 * Si el id ya existe, actualiza nombre y workspace. No toca `created_at`.
 */
import { db } from "../client.ts";
import { project } from "../schema/project.ts";

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
