/**
 * El upsert del tablero es idempotente: una segunda escritura no duplica
 * la fila ni reescribe `created_at`. La base es la temporal del setup.
 */
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { describe, expect, it } from "vite-plus/test";

import {
  column,
  getDb,
  task,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
} from "@agentic-kanban/db";

const fixedCreatedAt = new Date("2020-01-01T00:00:00.000Z");

describe("upsert del tablero", () => {
  it("reaplica una columna sin duplicarla ni tocar created_at", async () => {
    const workspaceId = `ws_${randomUUID()}`;
    const projectId = `proj_${randomUUID()}`;
    const columnId = `col_${randomUUID()}`;
    const database = getDb();

    await upsertWorkspace({ id: workspaceId, name: "Espacio" });
    await upsertProject({ id: projectId, workspaceId, name: "Tablero" });
    await upsertColumn({
      id: columnId,
      workspaceId,
      projectId,
      name: "To Do",
      position: 0,
    });
    await database.update(column).set({ createdAt: fixedCreatedAt }).where(eq(column.id, columnId));

    await upsertColumn({
      id: columnId,
      workspaceId,
      projectId,
      name: "Por hacer",
      position: 2,
    });

    const rows = await database.select().from(column).where(eq(column.id, columnId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Por hacer");
    expect(rows[0]?.position).toBe(2);
    expect(rows[0]?.createdAt).toEqual(fixedCreatedAt);
  });

  it("reaplica una tarea en otra columna sin duplicarla ni tocar created_at", async () => {
    const workspaceId = `ws_${randomUUID()}`;
    const projectId = `proj_${randomUUID()}`;
    const sourceId = `col_src_${randomUUID()}`;
    const targetId = `col_dst_${randomUUID()}`;
    const taskId = `task_${randomUUID()}`;
    const database = getDb();

    await upsertWorkspace({ id: workspaceId, name: "Espacio" });
    await upsertProject({ id: projectId, workspaceId, name: "Tablero" });
    await upsertColumn({
      id: sourceId,
      workspaceId,
      projectId,
      name: "To Do",
      position: 0,
    });
    await upsertColumn({
      id: targetId,
      workspaceId,
      projectId,
      name: "Done",
      position: 1,
    });
    await upsertTask({
      id: taskId,
      workspaceId,
      projectId,
      columnId: sourceId,
      title: "Empezar",
      description: "",
      position: 0,
    });
    await database.update(task).set({ createdAt: fixedCreatedAt }).where(eq(task.id, taskId));

    await upsertTask({
      id: taskId,
      workspaceId,
      projectId,
      columnId: targetId,
      title: "Terminar",
      description: "Hecho",
      position: 0,
    });

    const rows = await database.select().from(task).where(eq(task.id, taskId));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.columnId).toBe(targetId);
    expect(rows[0]?.title).toBe("Terminar");
    expect(rows[0]?.description).toBe("Hecho");
    expect(rows[0]?.position).toBe(0);
    expect(rows[0]?.createdAt).toEqual(fixedCreatedAt);
  });
});
