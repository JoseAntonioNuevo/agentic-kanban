import type { BoardEvent } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { boardEventToastMessage } from "./board-event-toast.ts";

const base = { projectId: "p_1", actorUserId: "u_1" };
const task = {
  id: "t_1",
  workspaceId: "w_1",
  projectId: "p_1",
  columnId: "c_1",
  title: "Revisar PR",
  description: "",
  position: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("boardEventToastMessage", () => {
  it("task.created usa el título del evento", () => {
    const event: BoardEvent = { type: "task.created", ...base, task };

    expect(boardEventToastMessage(event)).toBe("Nueva tarea: Revisar PR");
  });

  it("task.updated usa el título del evento", () => {
    const event: BoardEvent = { type: "task.updated", ...base, task };

    expect(boardEventToastMessage(event)).toBe("Tarea actualizada: Revisar PR");
  });

  it("task.deleted usa el título de la caché si existe", () => {
    const event: BoardEvent = { type: "task.deleted", ...base, taskId: "t_1" };

    expect(boardEventToastMessage(event, "Revisar PR")).toBe("Tarea eliminada: Revisar PR");
  });

  it("task.deleted sin título no añade dos puntos", () => {
    const event: BoardEvent = { type: "task.deleted", ...base, taskId: "t_1" };

    expect(boardEventToastMessage(event)).toBe("Tarea eliminada");
  });

  it("task.moved usa el título de la caché si existe", () => {
    const event: BoardEvent = {
      type: "task.moved",
      ...base,
      taskId: "t_1",
      columnId: "c_2",
      position: 0,
    };

    expect(boardEventToastMessage(event, "Revisar PR")).toBe("Tarea movida: Revisar PR");
  });

  it("task.moved sin título no añade dos puntos", () => {
    const event: BoardEvent = {
      type: "task.moved",
      ...base,
      taskId: "t_1",
      columnId: "c_2",
      position: 0,
    };

    expect(boardEventToastMessage(event)).toBe("Tarea movida");
  });

  it("comment.created muestra el autor del comentario", () => {
    const event: BoardEvent = {
      type: "comment.created",
      ...base,
      comment: {
        id: "cm_1",
        taskId: "t_1",
        projectId: "p_1",
        authorId: "u_2",
        authorName: "Ana",
        body: "Hola",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    };

    expect(boardEventToastMessage(event)).toBe("Nuevo comentario de Ana");
  });
});
