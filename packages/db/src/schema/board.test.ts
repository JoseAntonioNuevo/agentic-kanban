/**
 * Prueba el esquema del tablero contra la libSQL temporal del setup.
 * No usa `data/`.
 */
import { randomUUID } from "node:crypto";

import { column, getDb, project, task, workspace } from "@agentic-kanban/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vite-plus/test";

/** Junta el mensaje de Drizzle con el de libSQL, que viaja en `cause`. */
function errorText(error: unknown): string {
  const parts: string[] = [];
  const seen = new Set<unknown>();
  let current: unknown = error;

  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    parts.push(current.message);
    current = current.cause;
  }

  return parts.join("\n");
}

async function seedProject(label: string) {
  const workspaceId = `ws_${label}_${randomUUID()}`;
  const projectId = `proj_${label}_${randomUUID()}`;
  const database = getDb();

  await database.insert(workspace).values({ id: workspaceId, name: label });
  await database.insert(project).values({ id: projectId, workspaceId, name: label });

  return { workspaceId, projectId, database };
}

describe("esquema del tablero", () => {
  it("permite dos columnas del mismo project en la misma posición", async () => {
    const { workspaceId, projectId, database } = await seedProject("dup");

    await database.insert(column).values([
      { id: `col_a_${randomUUID()}`, workspaceId, projectId, name: "A", position: 0 },
      { id: `col_b_${randomUUID()}`, workspaceId, projectId, name: "B", position: 0 },
    ]);

    const rows = await database.select().from(column).where(eq(column.projectId, projectId));
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.position === 0)).toBe(true);
  });

  it("rechaza una tarea cuya columna no existe", async () => {
    const { workspaceId, projectId, database } = await seedProject("fk");

    await expect(
      database.insert(task).values({
        id: `task_${randomUUID()}`,
        workspaceId,
        projectId,
        columnId: `col_missing_${randomUUID()}`,
        title: "Huérfana",
        position: 0,
      }),
    ).rejects.toSatisfy((error: unknown) =>
      /FOREIGN KEY constraint failed/i.test(errorText(error)),
    );
  });

  it("rechaza una posición negativa", async () => {
    const { workspaceId, projectId, database } = await seedProject("check");

    await expect(
      database.insert(column).values({
        id: `col_${randomUUID()}`,
        workspaceId,
        projectId,
        name: "Negativa",
        position: -1,
      }),
    ).rejects.toSatisfy((error: unknown) => /CHECK constraint failed/i.test(errorText(error)));
  });

  it("aplica description vacía y created_at como fecha", async () => {
    const { workspaceId, projectId, database } = await seedProject("defaults");
    const columnId = `col_${randomUUID()}`;
    const taskId = `task_${randomUUID()}`;

    await database.insert(column).values({
      id: columnId,
      workspaceId,
      projectId,
      name: "Por hacer",
      position: 0,
    });
    await database.insert(task).values({
      id: taskId,
      workspaceId,
      projectId,
      columnId,
      title: "Sin descripción",
      position: 0,
    });

    const [row] = await database.select().from(task).where(eq(task.id, taskId));
    expect(row?.description).toBe("");
    expect(row?.createdAt).toBeInstanceOf(Date);
  });

  it("borra en cascada las tareas de una columna y el tablero de un project", async () => {
    const { workspaceId, projectId, database } = await seedProject("cascade");
    const droppedColumnId = `col_drop_${randomUUID()}`;
    const keptColumnId = `col_kept_${randomUUID()}`;
    const droppedTaskId = `task_drop_${randomUUID()}`;
    const keptTaskId = `task_kept_${randomUUID()}`;

    await database.insert(column).values([
      { id: droppedColumnId, workspaceId, projectId, name: "Se borra", position: 0 },
      { id: keptColumnId, workspaceId, projectId, name: "Queda", position: 1 },
    ]);
    await database.insert(task).values([
      {
        id: droppedTaskId,
        workspaceId,
        projectId,
        columnId: droppedColumnId,
        title: "Se va con la columna",
        position: 0,
      },
      {
        id: keptTaskId,
        workspaceId,
        projectId,
        columnId: keptColumnId,
        title: "Se va con el project",
        position: 0,
      },
    ]);

    await database.delete(column).where(eq(column.id, droppedColumnId));
    expect(await database.select().from(task).where(eq(task.id, droppedTaskId))).toEqual([]);
    expect(await database.select().from(task).where(eq(task.id, keptTaskId))).toHaveLength(1);

    await database.delete(project).where(eq(project.id, projectId));
    expect(await database.select().from(column).where(eq(column.projectId, projectId))).toEqual([]);
    expect(await database.select().from(task).where(eq(task.projectId, projectId))).toEqual([]);
  });
});
