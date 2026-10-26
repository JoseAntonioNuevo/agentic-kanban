/**
 * Contratos del tablero: un parse válido y un rechazo por cada body.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  boardResponseSchema,
  createTaskBodySchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
} from "./board.ts";

const createdAt = "2026-10-26T17:00:00.000Z";

const validTask = {
  id: "task_kanban_1",
  projectId: "proj_agentic_kanban",
  columnId: "col_kanban_todo",
  title: "Definir el contrato",
  description: "",
  position: 0,
  createdAt,
};

const validBoard = {
  project: {
    id: "proj_agentic_kanban",
    workspaceId: "ws_thepower_demo",
    name: "Agentic Kanban",
    createdAt,
  },
  columns: [
    {
      id: "col_kanban_todo",
      projectId: "proj_agentic_kanban",
      name: "To Do",
      position: 0,
      createdAt,
      tasks: [validTask],
    },
  ],
};

describe("taskSchema", () => {
  it("acepta una tarea", () => {
    expect(taskSchema.parse(validTask)).toEqual(validTask);
  });

  it("rechaza un título vacío", () => {
    expect(() => taskSchema.parse({ ...validTask, title: "" })).toThrow();
  });
});

describe("boardResponseSchema", () => {
  it("acepta el tablero con sus columnas", () => {
    expect(boardResponseSchema.parse(validBoard)).toEqual(validBoard);
  });

  it("rechaza un tablero sin project", () => {
    expect(() => boardResponseSchema.parse({ columns: [] })).toThrow();
  });
});

describe("createTaskBodySchema", () => {
  it("recorta el título y deja la descripción opcional", () => {
    expect(createTaskBodySchema.parse({ columnId: "col_kanban_todo", title: "  Hola  " })).toEqual({
      columnId: "col_kanban_todo",
      title: "Hola",
    });
  });

  it("rechaza un título vacío o en blanco", () => {
    expect(() =>
      createTaskBodySchema.parse({ columnId: "col_kanban_todo", title: "   " }),
    ).toThrow();
  });
});

describe("updateTaskBodySchema", () => {
  it("acepta solo la descripción", () => {
    expect(updateTaskBodySchema.parse({ description: "" })).toEqual({ description: "" });
  });

  it("rechaza un body vacío", () => {
    expect(() => updateTaskBodySchema.parse({})).toThrow();
  });
});

describe("taskIdParamSchema", () => {
  it("acepta un taskId", () => {
    expect(taskIdParamSchema.parse({ taskId: "task_kanban_1" })).toEqual({
      taskId: "task_kanban_1",
    });
  });

  it("rechaza un taskId vacío", () => {
    expect(() => taskIdParamSchema.parse({ taskId: "" })).toThrow();
  });
});
