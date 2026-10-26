/**
 * Contratos del tablero: un parse válido y un rechazo por cada body.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  applyBoardMove,
  boardResponseSchema,
  createTaskBodySchema,
  moveTaskBodySchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
  type BoardResponse,
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

describe("moveTaskBodySchema", () => {
  it("acepta columna y posición", () => {
    expect(moveTaskBodySchema.parse({ columnId: "col_kanban_done", position: 0 })).toEqual({
      columnId: "col_kanban_done",
      position: 0,
    });
  });

  it("rechaza una posición negativa, un decimal y un columnId vacío", () => {
    expect(() => moveTaskBodySchema.parse({ columnId: "col_kanban_done", position: -1 })).toThrow();
    expect(() =>
      moveTaskBodySchema.parse({ columnId: "col_kanban_done", position: 1.5 }),
    ).toThrow();
    expect(() => moveTaskBodySchema.parse({ columnId: "", position: 0 })).toThrow();
  });
});

function column(
  id: string,
  name: string,
  position: number,
  tasks: Array<{ id: string; position: number }>,
): BoardResponse["columns"][number] {
  return {
    id,
    projectId: "proj_agentic_kanban",
    name,
    position,
    createdAt,
    tasks: tasks.map((item) => ({
      id: item.id,
      projectId: "proj_agentic_kanban",
      columnId: id,
      title: item.id,
      description: "",
      position: item.position,
      createdAt,
    })),
  };
}

function sampleBoard(): BoardResponse {
  return {
    project: validBoard.project,
    columns: [
      column("col_todo", "To Do", 0, [
        { id: "task_a", position: 0 },
        { id: "task_b", position: 1 },
        { id: "task_c", position: 2 },
      ]),
      column("col_doing", "In Progress", 1, [
        { id: "task_d", position: 0 },
        { id: "task_e", position: 1 },
      ]),
      column("col_done", "Done", 2, []),
    ],
  };
}

describe("applyBoardMove", () => {
  it("reordena dentro de la misma columna y renumera 0..n-1", () => {
    const board = sampleBoard();

    const next = applyBoardMove(board, {
      taskId: "task_c",
      columnId: "col_todo",
      position: 0,
    });

    expect(board.columns[0]?.tasks.map((task) => task.id)).toEqual(["task_a", "task_b", "task_c"]);
    expect(board.columns[0]?.tasks.map((task) => task.position)).toEqual([0, 1, 2]);
    expect(next.columns[0]?.tasks.map((task) => task.id)).toEqual(["task_c", "task_a", "task_b"]);
    expect(next.columns[0]?.tasks.map((task) => task.position)).toEqual([0, 1, 2]);
    expect(next.columns[0]?.tasks.map((task) => task.columnId)).toEqual([
      "col_todo",
      "col_todo",
      "col_todo",
    ]);
    expect(next.columns[1]).toBe(board.columns[1]);
    expect(next.columns[2]).toBe(board.columns[2]);
  });

  it("mueve a otra columna, compacta el origen y actualiza columnId", () => {
    const board = sampleBoard();

    const next = applyBoardMove(board, {
      taskId: "task_b",
      columnId: "col_doing",
      position: 1,
    });

    expect(next.columns[0]?.tasks.map((task) => task.id)).toEqual(["task_a", "task_c"]);
    expect(next.columns[0]?.tasks.map((task) => task.position)).toEqual([0, 1]);
    expect(next.columns[1]?.tasks.map((task) => task.id)).toEqual(["task_d", "task_b", "task_e"]);
    expect(next.columns[1]?.tasks.map((task) => task.position)).toEqual([0, 1, 2]);
    expect(next.columns[1]?.tasks.map((task) => task.columnId)).toEqual([
      "col_doing",
      "col_doing",
      "col_doing",
    ]);
    expect(next.columns[2]).toBe(board.columns[2]);
  });

  it("inserta en una columna vacía", () => {
    const board = sampleBoard();

    const next = applyBoardMove(board, {
      taskId: "task_a",
      columnId: "col_done",
      position: 0,
    });

    expect(next.columns[0]?.tasks.map((task) => task.id)).toEqual(["task_b", "task_c"]);
    expect(next.columns[0]?.tasks.map((task) => task.position)).toEqual([0, 1]);
    expect(next.columns[2]?.tasks.map((task) => task.id)).toEqual(["task_a"]);
    expect(next.columns[2]?.tasks[0]).toMatchObject({
      columnId: "col_done",
      position: 0,
    });
  });

  it("acota una posición fuera de rango a 0..n", () => {
    const board = sampleBoard();

    const tooHigh = applyBoardMove(board, {
      taskId: "task_a",
      columnId: "col_doing",
      position: 50,
    });
    expect(tooHigh.columns[1]?.tasks.map((task) => task.id)).toEqual([
      "task_d",
      "task_e",
      "task_a",
    ]);
    expect(tooHigh.columns[1]?.tasks.map((task) => task.position)).toEqual([0, 1, 2]);

    const tooLow = applyBoardMove(board, {
      taskId: "task_c",
      columnId: "col_todo",
      position: -4,
    });
    expect(tooLow.columns[0]?.tasks.map((task) => task.id)).toEqual(["task_c", "task_a", "task_b"]);

    const emptyOverflow = applyBoardMove(board, {
      taskId: "task_a",
      columnId: "col_done",
      position: 5,
    });
    expect(emptyOverflow.columns[2]?.tasks.map((task) => task.id)).toEqual(["task_a"]);
    expect(emptyOverflow.columns[2]?.tasks[0]?.position).toBe(0);
  });

  it("deja el mismo board si la tarea o la columna no existen", () => {
    const board = sampleBoard();

    expect(
      applyBoardMove(board, { taskId: "task_missing", columnId: "col_todo", position: 0 }),
    ).toBe(board);
    expect(applyBoardMove(board, { taskId: "task_a", columnId: "col_missing", position: 0 })).toBe(
      board,
    );
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
