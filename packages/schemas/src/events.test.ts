/**
 * Parse válido y rechazo del contrato de anuncios de tablero.
 */
import { describe, expect, it } from "vite-plus/test";

import type { Board, Task } from "./board.ts";
import type { Comment } from "./comment.ts";
import { applyBoardEvent, boardEventSchema, boardEventToastMessage, type BoardEvent } from "./events.ts";

const createdAt = "2026-08-19T15:00:00.000Z";

const task: Task = {
  id: "t1",
  workspaceId: "ws_1",
  projectId: "proj_1",
  columnId: "col_a",
  title: "Uno",
  description: "",
  position: 0,
  createdAt,
};

const created: BoardEvent = {
  type: "task.created",
  projectId: "proj_1",
  actorUserId: "user_ana",
  task,
};

const updated: BoardEvent = {
  type: "task.updated",
  projectId: "proj_1",
  actorUserId: "user_ana",
  task: { ...task, title: "Uno editado" },
};

const deleted: BoardEvent = {
  type: "task.deleted",
  projectId: "proj_1",
  actorUserId: "user_ana",
  taskId: "t1",
};

const moved: BoardEvent = {
  type: "task.moved",
  projectId: "proj_1",
  actorUserId: "user_luis",
  taskId: "t1",
  columnId: "col_b",
  position: 0,
};

const comment: Comment = {
  id: "comment_1",
  workspaceId: "ws_1",
  projectId: "proj_1",
  taskId: "t1",
  authorId: "user_ana",
  authorName: "Ana",
  body: "@Luis mira esto",
  createdAt,
};

const commentCreated: BoardEvent = {
  type: "comment.created",
  projectId: "proj_1",
  actorUserId: "user_ana",
  comment,
};

describe("boardEventSchema", () => {
  it("acepta task.created con la tarea resultante", () => {
    expect(boardEventSchema.parse(created)).toEqual(created);
  });

  it("acepta task.updated con la tarea resultante", () => {
    expect(boardEventSchema.parse(updated)).toEqual(updated);
  });

  it("acepta task.deleted con taskId", () => {
    expect(boardEventSchema.parse(deleted)).toEqual(deleted);
  });

  it("acepta task.moved con los ids de move", () => {
    expect(boardEventSchema.parse(moved)).toEqual(moved);
  });

  it("acepta comment.created con el comentario resultante", () => {
    expect(boardEventSchema.parse(commentCreated)).toEqual(commentCreated);
  });

  it("rechaza un type desconocido", () => {
    expect(() =>
      boardEventSchema.parse({
        type: "task.commented",
        projectId: "proj_1",
        actorUserId: "user_ana",
        taskId: "t1",
      }),
    ).toThrow();
  });

  it("rechaza sin actorUserId", () => {
    expect(() =>
      boardEventSchema.parse({
        type: "task.created",
        projectId: "proj_1",
        task,
      }),
    ).toThrow();
  });

  it("rechaza task.created con una tarea incompleta", () => {
    expect(() =>
      boardEventSchema.parse({
        ...created,
        task: { ...task, title: "" },
      }),
    ).toThrow();
  });

  it("rechaza task.moved con position negativa", () => {
    expect(() => boardEventSchema.parse({ ...moved, position: -1 })).toThrow();
  });

  it("rechaza task.deleted sin taskId", () => {
    expect(() =>
      boardEventSchema.parse({
        type: "task.deleted",
        projectId: "proj_1",
        actorUserId: "user_ana",
      }),
    ).toThrow();
  });

  it("rechaza comment.created sin comment", () => {
    expect(() =>
      boardEventSchema.parse({
        type: "comment.created",
        projectId: "proj_1",
        actorUserId: "user_ana",
      }),
    ).toThrow();
  });
});

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
        { ...task, id: "t1", position: 0 },
        { ...task, id: "t2", title: "Dos", position: 1 },
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

describe("boardEventToastMessage", () => {
  it("usa el título del evento en created y updated", () => {
    expect(boardEventToastMessage(created, "Uno")).toBe("Nueva tarea: Uno");
    expect(boardEventToastMessage(updated, "Uno editado")).toBe("Tarea actualizada: Uno editado");
  });

  it("añade el título de cache en deleted y moved si está", () => {
    expect(boardEventToastMessage(deleted, "Uno")).toBe("Tarea eliminada: Uno");
    expect(boardEventToastMessage(moved, "Uno")).toBe("Tarea movida: Uno");
  });

  it("omite el título si no está en cache", () => {
    expect(boardEventToastMessage(deleted, undefined)).toBe("Tarea eliminada");
    expect(boardEventToastMessage(moved, undefined)).toBe("Tarea movida");
  });

  it("usa el authorName en comment.created", () => {
    expect(boardEventToastMessage(commentCreated, undefined)).toBe("Nuevo comentario de Ana");
  });
});

describe("applyBoardEvent", () => {
  it("mueve la tarea con applyBoardMove", () => {
    const next = applyBoardEvent(board, moved);
    expect(next.columns[0]?.tasks.map((item) => item.id)).toEqual(["t2"]);
    expect(next.columns[1]?.tasks.map((item) => item.id)).toEqual(["t1"]);
    expect(next.columns[1]?.tasks[0]).toMatchObject({ columnId: "col_b", position: 0 });
  });

  it("inserta task.created en la columna y posición", () => {
    const createdAtPosition: BoardEvent = {
      type: "task.created",
      projectId: "proj_1",
      actorUserId: "user_ana",
      task: { ...task, id: "t3", title: "Tres", position: 1 },
    };
    const next = applyBoardEvent(board, createdAtPosition);
    expect(next.columns[0]?.tasks.map((item) => item.id)).toEqual(["t1", "t3", "t2"]);
    expect(next.columns[0]?.tasks.map((item) => item.position)).toEqual([0, 1, 2]);
    expect(applyBoardEvent(next, createdAtPosition).columns[0]?.tasks.map((item) => item.id)).toEqual(
      ["t1", "t3", "t2"],
    );
  });

  it("deja el board igual si task.created ya existe (idempotente)", () => {
    const next = applyBoardEvent(board, created);
    expect(next).toBe(board);
  });

  it("reemplaza task.updated in situ", () => {
    const next = applyBoardEvent(board, updated);
    expect(next.columns[0]?.tasks[0]?.title).toBe("Uno editado");
    expect(next.columns[0]?.tasks[0]?.id).toBe("t1");
    expect(next.columns[0]?.tasks[1]?.id).toBe("t2");
  });

  it("quita task.deleted y reindexa", () => {
    const next = applyBoardEvent(board, deleted);
    expect(next.columns[0]?.tasks.map((item) => item.id)).toEqual(["t2"]);
    expect(next.columns[0]?.tasks[0]?.position).toBe(0);
  });

  it("ignora un evento de otro project", () => {
    const next = applyBoardEvent(board, { ...moved, projectId: "proj_other" });
    expect(next).toBe(board);
  });

  it("deja el board igual en comment.created", () => {
    expect(applyBoardEvent(board, commentCreated)).toBe(board);
  });
});
