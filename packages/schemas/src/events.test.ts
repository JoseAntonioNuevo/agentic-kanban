/**
 * Contrato de anuncios del tablero: un parse por cada `type` y los rechazos.
 */
import { describe, expect, it } from "vite-plus/test";

import { boardEventSchema } from "./events.ts";

const base = {
  projectId: "proj_agentic_kanban",
  actorUserId: "user_ana",
};

const task = {
  id: "task_kanban_1",
  projectId: "proj_agentic_kanban",
  columnId: "col_kanban_todo",
  title: "Definir el contrato",
  description: "",
  position: 0,
  createdAt: "2026-10-26T17:00:00.000Z",
};

describe("boardEventSchema", () => {
  it("acepta task.created", () => {
    const event = { type: "task.created", ...base, task };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("acepta task.updated", () => {
    const event = { type: "task.updated", ...base, task: { ...task, title: "Nuevo título" } };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("acepta task.deleted", () => {
    const event = { type: "task.deleted", ...base, taskId: "task_kanban_1" };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("acepta task.moved con columna y posición finales", () => {
    const event = {
      type: "task.moved",
      ...base,
      taskId: "task_kanban_1",
      columnId: "col_kanban_doing",
      position: 2,
    };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("conserva solo los campos de cada variante", () => {
    const parsed = boardEventSchema.parse({
      type: "task.deleted",
      ...base,
      taskId: "task_kanban_1",
      task,
    });
    expect(parsed).toEqual({ type: "task.deleted", ...base, taskId: "task_kanban_1" });
  });

  it("rechaza un type desconocido", () => {
    const result = boardEventSchema.safeParse({ type: "task.archived", ...base, taskId: "t" });
    expect(result.success).toBe(false);
  });

  it("rechaza un evento sin actorUserId", () => {
    const result = boardEventSchema.safeParse({
      type: "task.deleted",
      projectId: base.projectId,
      taskId: "task_kanban_1",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza task.moved sin position", () => {
    const result = boardEventSchema.safeParse({
      type: "task.moved",
      ...base,
      taskId: "task_kanban_1",
      columnId: "col_kanban_doing",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza task.created sin task", () => {
    const result = boardEventSchema.safeParse({ type: "task.created", ...base });
    expect(result.success).toBe(false);
  });
});
