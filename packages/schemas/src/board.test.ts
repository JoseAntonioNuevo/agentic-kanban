/**
 * Prueba los contratos del tablero: parse válido y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  applyBoardMove,
  boardColumnSchema,
  boardResponseSchema,
  createTaskBodySchema,
  moveTaskBodySchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
  type BoardResponse,
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

describe("moveTaskBodySchema", () => {
  it("acepta columna y position, incluida la 0", () => {
    expect(moveTaskBodySchema.parse({ columnId: "c_2", position: 0 })).toEqual({
      columnId: "c_2",
      position: 0,
    });
  });

  it("rechaza una position negativa", () => {
    expect(() => moveTaskBodySchema.parse({ columnId: "c_2", position: -1 })).toThrow();
  });

  it("rechaza una position no entera", () => {
    expect(() => moveTaskBodySchema.parse({ columnId: "c_2", position: 1.5 })).toThrow();
  });

  it("rechaza una columna vacía", () => {
    expect(() => moveTaskBodySchema.parse({ columnId: "", position: 0 })).toThrow();
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

describe("applyBoardMove", () => {
  const makeTask = (id: string, columnId: string, position: number) => ({
    ...task,
    id,
    columnId,
    position,
  });
  const makeColumn = (id: string, position: number, taskIds: string[]) => ({
    ...column,
    id,
    position,
    tasks: taskIds.map((taskId, index) => makeTask(taskId, id, index)),
  });
  const makeBoard = (): BoardResponse => ({
    project,
    columns: [
      makeColumn("c_1", 0, ["a", "b", "c"]),
      makeColumn("c_2", 1, ["d", "e"]),
      makeColumn("c_3", 2, []),
    ],
  });
  const idsOf = (board: BoardResponse, columnId: string) =>
    board.columns.find((col) => col.id === columnId)?.tasks.map((t) => t.id);
  const positionsOf = (board: BoardResponse, columnId: string) =>
    board.columns.find((col) => col.id === columnId)?.tasks.map((t) => t.position);

  it("mueve dentro de la misma columna de la posición 0 a la 2", () => {
    const next = applyBoardMove(makeBoard(), { taskId: "a", columnId: "c_1", position: 2 });

    expect(idsOf(next, "c_1")).toEqual(["b", "c", "a"]);
    expect(positionsOf(next, "c_1")).toEqual([0, 1, 2]);
  });

  it("mueve dentro de la misma columna de la posición 2 a la 0", () => {
    const next = applyBoardMove(makeBoard(), { taskId: "c", columnId: "c_1", position: 0 });

    expect(idsOf(next, "c_1")).toEqual(["c", "a", "b"]);
    expect(positionsOf(next, "c_1")).toEqual([0, 1, 2]);
  });

  it("mueve a otra columna, en medio, y renumera origen y destino", () => {
    const board = makeBoard();
    const next = applyBoardMove(board, { taskId: "a", columnId: "c_2", position: 1 });

    expect(idsOf(next, "c_1")).toEqual(["b", "c"]);
    expect(positionsOf(next, "c_1")).toEqual([0, 1]);
    expect(idsOf(next, "c_2")).toEqual(["d", "a", "e"]);
    expect(positionsOf(next, "c_2")).toEqual([0, 1, 2]);
    expect(next.columns[1]?.tasks[1]?.columnId).toBe("c_2");
    expect(next.columns[2]).toBe(board.columns[2]);
  });

  it("mueve a una columna vacía", () => {
    const next = applyBoardMove(makeBoard(), { taskId: "e", columnId: "c_3", position: 0 });

    expect(idsOf(next, "c_2")).toEqual(["d"]);
    expect(idsOf(next, "c_3")).toEqual(["e"]);
    expect(positionsOf(next, "c_3")).toEqual([0]);
    expect(next.columns[2]?.tasks[0]?.columnId).toBe("c_3");
  });

  it("acota una posición mayor que el final al final", () => {
    const next = applyBoardMove(makeBoard(), { taskId: "a", columnId: "c_2", position: 99 });

    expect(idsOf(next, "c_2")).toEqual(["d", "e", "a"]);
    expect(positionsOf(next, "c_2")).toEqual([0, 1, 2]);
  });

  it("acota una posición negativa al principio", () => {
    const next = applyBoardMove(makeBoard(), { taskId: "e", columnId: "c_1", position: -5 });

    expect(idsOf(next, "c_1")).toEqual(["e", "a", "b", "c"]);
    expect(positionsOf(next, "c_1")).toEqual([0, 1, 2, 3]);
  });

  it("devuelve el mismo objeto si la tarea no existe", () => {
    const board = makeBoard();

    expect(applyBoardMove(board, { taskId: "x", columnId: "c_1", position: 0 })).toBe(board);
  });

  it("devuelve el mismo objeto si la columna destino no existe", () => {
    const board = makeBoard();

    expect(applyBoardMove(board, { taskId: "a", columnId: "c_x", position: 0 })).toBe(board);
  });

  it("no muta el tablero original", () => {
    const board = makeBoard();
    const snapshot = boardResponseSchema.parse(JSON.parse(JSON.stringify(board)));
    const next = applyBoardMove(board, { taskId: "a", columnId: "c_2", position: 0 });

    expect(next).not.toBe(board);
    expect(board).toEqual(snapshot);
  });
});
