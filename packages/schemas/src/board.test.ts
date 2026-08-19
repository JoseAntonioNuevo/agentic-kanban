/**
 * Parse del board / move y el algoritmo de reorden local.
 */
import { describe, expect, it } from "vite-plus/test";

import { applyBoardMove, boardResponseSchema, moveTaskBodySchema, type Board } from "./board.ts";

const createdAt = "2026-08-19T15:00:00.000Z";

const board: Board = {
  project: {
    id: "proj_1",
    workspaceId: "ws_1",
    name: "Board",
    createdAt,
  },
  columns: [
    {
      id: "col_a",
      workspaceId: "ws_1",
      projectId: "proj_1",
      name: "A",
      position: 0,
      createdAt,
      tasks: [
        {
          id: "t1",
          workspaceId: "ws_1",
          projectId: "proj_1",
          columnId: "col_a",
          title: "Uno",
          description: "",
          position: 0,
          createdAt,
        },
        {
          id: "t2",
          workspaceId: "ws_1",
          projectId: "proj_1",
          columnId: "col_a",
          title: "Dos",
          description: "",
          position: 1,
          createdAt,
        },
      ],
    },
    {
      id: "col_b",
      workspaceId: "ws_1",
      projectId: "proj_1",
      name: "B",
      position: 1,
      createdAt,
      tasks: [],
    },
  ],
};

describe("boardResponseSchema", () => {
  it("acepta un board con una columna vacía", () => {
    expect(boardResponseSchema.parse(board)).toEqual(board);
  });

  it("rechaza una tarea sin título", () => {
    expect(() =>
      boardResponseSchema.parse({
        ...board,
        columns: [
          {
            ...board.columns[0],
            tasks: [{ ...board.columns[0]?.tasks[0], title: "" }],
          },
        ],
      }),
    ).toThrow();
  });
});

describe("moveTaskBodySchema", () => {
  it("acepta columnId y position", () => {
    expect(moveTaskBodySchema.parse({ columnId: "col_b", position: 0 })).toEqual({
      columnId: "col_b",
      position: 0,
    });
  });

  it("rechaza una position negativa", () => {
    expect(() => moveTaskBodySchema.parse({ columnId: "col_b", position: -1 })).toThrow();
  });
});

describe("applyBoardMove", () => {
  it("reordena dentro de la misma columna", () => {
    const next = applyBoardMove(board, "t1", "col_a", 1);
    expect(next.columns[0]?.tasks.map((task) => task.id)).toEqual(["t2", "t1"]);
    expect(next.columns[0]?.tasks.map((task) => task.position)).toEqual([0, 1]);
  });

  it("mueve a una columna vacía", () => {
    const next = applyBoardMove(board, "t1", "col_b", 0);
    expect(next.columns[0]?.tasks.map((task) => task.id)).toEqual(["t2"]);
    expect(next.columns[1]?.tasks.map((task) => task.id)).toEqual(["t1"]);
    expect(next.columns[1]?.tasks[0]).toMatchObject({
      columnId: "col_b",
      position: 0,
    });
  });
});
