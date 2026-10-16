import { describe, expect, it } from "vite-plus/test";

import { boardEventSchema } from "./events.ts";

const task = {
  id: "task_1",
  workspaceId: "ws_1",
  projectId: "proj_1",
  columnId: "col_1",
  title: "Tarea",
  description: "",
  position: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

const comment = {
  id: "cm_1",
  taskId: "task_1",
  projectId: "proj_1",
  authorId: "user_2",
  authorName: "Ana",
  body: "Hola",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const base = { projectId: "proj_1", actorUserId: "user_1" };

describe("boardEventSchema", () => {
  it("parsea task.created", () => {
    const event = { type: "task.created", ...base, task };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("parsea task.updated", () => {
    const event = { type: "task.updated", ...base, task };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("parsea task.deleted", () => {
    const event = { type: "task.deleted", ...base, taskId: "task_1" };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("parsea task.moved con columna y posición finales", () => {
    const event = { type: "task.moved", ...base, taskId: "task_1", columnId: "col_2", position: 3 };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("parsea comment.created", () => {
    const event = { type: "comment.created", ...base, comment };
    expect(boardEventSchema.parse(event)).toEqual(event);
  });

  it("rechaza comment.created sin comment", () => {
    expect(() => boardEventSchema.parse({ type: "comment.created", ...base })).toThrow();
  });

  it("rechaza comment.created con comment sin authorName", () => {
    const { authorName: _authorName, ...sinAutor } = comment;
    expect(() =>
      boardEventSchema.parse({ type: "comment.created", ...base, comment: sinAutor }),
    ).toThrow();
  });

  it("rechaza un type desconocido", () => {
    expect(() => boardEventSchema.parse({ type: "task.archived", ...base, taskId: "t" })).toThrow();
  });

  it("rechaza un evento sin actorUserId", () => {
    expect(() =>
      boardEventSchema.parse({ type: "task.deleted", projectId: "proj_1", taskId: "task_1" }),
    ).toThrow();
  });

  it("rechaza task.moved sin position", () => {
    expect(() =>
      boardEventSchema.parse({ type: "task.moved", ...base, taskId: "task_1", columnId: "col_2" }),
    ).toThrow();
  });

  it("rechaza task.created sin task", () => {
    expect(() => boardEventSchema.parse({ type: "task.created", ...base })).toThrow();
  });
});
