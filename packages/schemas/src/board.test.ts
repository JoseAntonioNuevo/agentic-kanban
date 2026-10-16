/**
 * Prueba los contratos del tablero: parse válido y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  applyBoardEvent,
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
import type { BoardEvent } from "./events.ts";

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

describe("applyBoardMove", () => {
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

describe("applyBoardEvent", () => {
  const actorUserId = "u_1";
  const created = (position: number, columnId = "c_2", id = "n"): BoardEvent => ({
    type: "task.created",
    projectId: "p_1",
    actorUserId,
    task: makeTask(id, columnId, position),
  });

  it("task.created inserta en medio y renumera la columna", () => {
    const board = makeBoard();
    const next = applyBoardEvent(board, created(1));

    expect(idsOf(next, "c_2")).toEqual(["d", "n", "e"]);
    expect(positionsOf(next, "c_2")).toEqual([0, 1, 2]);
    expect(next.columns[0]).toBe(board.columns[0]);
    expect(next.columns[2]).toBe(board.columns[2]);
  });

  it("task.created acota la posición al final", () => {
    const next = applyBoardEvent(makeBoard(), created(99));

    expect(idsOf(next, "c_2")).toEqual(["d", "e", "n"]);
    expect(positionsOf(next, "c_2")).toEqual([0, 1, 2]);
  });

  it("task.created inserta en una columna vacía", () => {
    const next = applyBoardEvent(makeBoard(), created(0, "c_3"));

    expect(idsOf(next, "c_3")).toEqual(["n"]);
  });

  it("task.created con un id ya presente deja el tablero igual", () => {
    const board = makeBoard();

    expect(applyBoardEvent(board, created(0, "c_2", "a"))).toBe(board);
  });

  it("task.created con una columna inexistente deja el tablero igual", () => {
    const board = makeBoard();

    expect(applyBoardEvent(board, created(0, "c_x"))).toBe(board);
  });

  it("task.updated reemplaza los datos y conserva posición y columna locales", () => {
    const board = makeBoard();
    const event: BoardEvent = {
      type: "task.updated",
      projectId: "p_1",
      actorUserId,
      task: { ...makeTask("b", "c_1", 7), title: "Nuevo título", description: "Más texto" },
    };
    const next = applyBoardEvent(board, event);
    const updated = next.columns[0]?.tasks[1];

    expect(updated?.title).toBe("Nuevo título");
    expect(updated?.description).toBe("Más texto");
    expect(updated?.position).toBe(1);
    expect(idsOf(next, "c_1")).toEqual(["a", "b", "c"]);
    expect(next.columns[1]).toBe(board.columns[1]);
    expect(next.columns[0]?.tasks[0]).toBe(board.columns[0]?.tasks[0]);
  });

  it("task.deleted elimina la tarea y renumera su columna", () => {
    const board = makeBoard();
    const next = applyBoardEvent(board, {
      type: "task.deleted",
      projectId: "p_1",
      actorUserId,
      taskId: "a",
    });

    expect(idsOf(next, "c_1")).toEqual(["b", "c"]);
    expect(positionsOf(next, "c_1")).toEqual([0, 1]);
    expect(next.columns[1]).toBe(board.columns[1]);
  });

  it("task.moved mueve la tarea a su columna y posición finales", () => {
    const next = applyBoardEvent(makeBoard(), {
      type: "task.moved",
      projectId: "p_1",
      actorUserId,
      taskId: "a",
      columnId: "c_2",
      position: 1,
    });

    expect(idsOf(next, "c_1")).toEqual(["b", "c"]);
    expect(idsOf(next, "c_2")).toEqual(["d", "a", "e"]);
    expect(positionsOf(next, "c_2")).toEqual([0, 1, 2]);
    expect(next.columns[1]?.tasks[1]?.columnId).toBe("c_2");
  });

  const events: [string, BoardEvent][] = [
    ["task.created", created(1)],
    [
      "task.updated",
      {
        type: "task.updated",
        projectId: "p_1",
        actorUserId,
        task: { ...makeTask("b", "c_1", 1), title: "Editada" },
      },
    ],
    ["task.deleted", { type: "task.deleted", projectId: "p_1", actorUserId, taskId: "a" }],
    [
      "task.moved",
      {
        type: "task.moved",
        projectId: "p_1",
        actorUserId,
        taskId: "a",
        columnId: "c_2",
        position: 1,
      },
    ],
  ];

  it.each(events)("%s es idempotente: aplicarlo dos veces equivale a una", (_type, event) => {
    const once = applyBoardEvent(makeBoard(), event);
    const twice = applyBoardEvent(once, event);

    expect(twice).toEqual(once);
  });

  it("task.updated, task.deleted y task.moved de una tarea ausente devuelven el mismo objeto", () => {
    const board = makeBoard();

    expect(
      applyBoardEvent(board, {
        type: "task.updated",
        projectId: "p_1",
        actorUserId,
        task: makeTask("x", "c_1", 0),
      }),
    ).toBe(board);
    expect(
      applyBoardEvent(board, { type: "task.deleted", projectId: "p_1", actorUserId, taskId: "x" }),
    ).toBe(board);
    expect(
      applyBoardEvent(board, {
        type: "task.moved",
        projectId: "p_1",
        actorUserId,
        taskId: "x",
        columnId: "c_2",
        position: 0,
      }),
    ).toBe(board);
  });

  it.each(events)("%s de otro proyecto devuelve el mismo objeto", (_type, event) => {
    const board = makeBoard();

    expect(applyBoardEvent(board, { ...event, projectId: "p_otro" })).toBe(board);
  });

  it("comment.created devuelve el mismo objeto", () => {
    const board = makeBoard();
    const event: BoardEvent = {
      type: "comment.created",
      projectId: "p_1",
      actorUserId,
      comment: {
        id: "cm_1",
        taskId: "a",
        projectId: "p_1",
        authorId: "u_2",
        authorName: "Ana",
        body: "Hola",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    };

    expect(applyBoardEvent(board, event)).toBe(board);
  });

  it("no muta el tablero original", () => {
    const board = makeBoard();
    const snapshot = boardResponseSchema.parse(JSON.parse(JSON.stringify(board)));

    applyBoardEvent(board, created(0, "c_1"));
    expect(board).toEqual(snapshot);
  });
});
