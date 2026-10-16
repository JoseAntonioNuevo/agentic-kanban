/**
 * Prueba los contratos del tablero: parse válido y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  boardColumnSchema,
  boardResponseSchema,
  createTaskBodySchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
} from "./board.ts";

const task = {
  id: "t_1",
  workspaceId: "ws_1",
  projectId: "p_1",
  columnId: "c_1",
  title: "Escribir tests",
  description: "",
  position: 0,
  createdAt: "2026-10-16T10:00:00.000Z",
};

const column = {
  id: "c_1",
  workspaceId: "ws_1",
  projectId: "p_1",
  name: "Por hacer",
  position: 0,
  createdAt: "2026-10-16T10:00:00.000Z",
  tasks: [task],
};

const project = {
  id: "p_1",
  workspaceId: "ws_1",
  name: "Tablero",
  createdAt: "2026-10-16T10:00:00.000Z",
};

describe("taskSchema", () => {
  it("acepta una tarea válida", () => {
    expect(taskSchema.parse(task)).toEqual(task);
  });

  it("rechaza una position negativa", () => {
    expect(() => taskSchema.parse({ ...task, position: -1 })).toThrow();
  });

  it("rechaza una position no entera", () => {
    expect(() => taskSchema.parse({ ...task, position: 1.5 })).toThrow();
  });

  it("rechaza una fecha que no es ISO", () => {
    expect(() => taskSchema.parse({ ...task, createdAt: "16/10/2026" })).toThrow();
  });
});

describe("boardColumnSchema", () => {
  it("acepta una columna sin tareas", () => {
    expect(boardColumnSchema.parse({ ...column, tasks: [] }).tasks).toEqual([]);
  });

  it("rechaza una columna con una tarea inválida", () => {
    expect(() =>
      boardColumnSchema.parse({ ...column, tasks: [{ ...task, position: -1 }] }),
    ).toThrow();
  });
});

describe("boardResponseSchema", () => {
  it("acepta un tablero con columnas y tareas", () => {
    const board = { project, columns: [column, { ...column, id: "c_2", position: 1, tasks: [] }] };
    expect(boardResponseSchema.parse(board)).toEqual(board);
  });

  it("rechaza un tablero sin proyecto", () => {
    expect(() => boardResponseSchema.parse({ columns: [column] })).toThrow();
  });
});

describe("createTaskBodySchema", () => {
  it("acepta columna y título, y recorta espacios", () => {
    expect(createTaskBodySchema.parse({ columnId: "c_1", title: "  Hola  " })).toEqual({
      columnId: "c_1",
      title: "Hola",
    });
  });

  it("acepta una descripción opcional", () => {
    const body = createTaskBodySchema.parse({ columnId: "c_1", title: "A", description: "Texto" });
    expect(body.description).toBe("Texto");
  });

  it("rechaza un título vacío", () => {
    expect(() => createTaskBodySchema.parse({ columnId: "c_1", title: "" })).toThrow();
  });

  it("rechaza un título de solo espacios", () => {
    expect(() => createTaskBodySchema.parse({ columnId: "c_1", title: "   " })).toThrow();
  });

  it("rechaza un título de más de 200 caracteres", () => {
    expect(() => createTaskBodySchema.parse({ columnId: "c_1", title: "a".repeat(201) })).toThrow();
  });

  it("rechaza una columna vacía", () => {
    expect(() => createTaskBodySchema.parse({ columnId: "", title: "A" })).toThrow();
  });
});

describe("updateTaskBodySchema", () => {
  it("acepta solo el título", () => {
    expect(updateTaskBodySchema.parse({ title: "Nuevo" })).toEqual({ title: "Nuevo" });
  });

  it("acepta solo la descripción, incluso vacía", () => {
    expect(updateTaskBodySchema.parse({ description: "" })).toEqual({ description: "" });
  });

  it("rechaza un cuerpo vacío con mensaje en español", () => {
    const result = updateTaskBodySchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Indica al menos el título o la descripción");
  });

  it("rechaza un título de solo espacios", () => {
    expect(() => updateTaskBodySchema.parse({ title: "   " })).toThrow();
  });
});

describe("taskIdParamSchema", () => {
  it("acepta un taskId", () => {
    expect(taskIdParamSchema.parse({ taskId: "t_1" })).toEqual({ taskId: "t_1" });
  });

  it("rechaza un taskId vacío", () => {
    expect(() => taskIdParamSchema.parse({ taskId: "" })).toThrow();
  });
});
