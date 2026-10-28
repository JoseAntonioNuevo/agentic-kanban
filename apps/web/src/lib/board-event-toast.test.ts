/**
 * Un texto por tipo de evento, con y sin título cuando el evento no lo trae.
 */
import type { BoardEvent } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { boardEventToastMessage } from "./board-event-toast.ts";

const base = { projectId: "proj_agentic_kanban", actorUserId: "user_ana" };
const task = {
  id: "task_kanban_1",
  projectId: base.projectId,
  columnId: "col_kanban_todo",
  title: "Diseñar login",
  description: "",
  position: 0,
  createdAt: "2026-10-28T18:30:00.000Z",
};

const created: BoardEvent = { ...base, type: "task.created", task };
const updated: BoardEvent = { ...base, type: "task.updated", task };
const deleted: BoardEvent = { ...base, type: "task.deleted", taskId: task.id };
const moved: BoardEvent = {
  ...base,
  type: "task.moved",
  taskId: task.id,
  columnId: "col_kanban_done",
  position: 0,
};

describe("boardEventToastMessage", () => {
  it("created y updated usan el título del evento", () => {
    expect(boardEventToastMessage(created)).toBe("Nueva tarea: Diseñar login");
    expect(boardEventToastMessage(updated)).toBe("Tarea actualizada: Diseñar login");
    expect(boardEventToastMessage(updated, "otro")).toBe("Tarea actualizada: Diseñar login");
  });

  it("deleted y moved usan el título recibido", () => {
    expect(boardEventToastMessage(deleted, "Diseñar login")).toBe("Tarea eliminada: Diseñar login");
    expect(boardEventToastMessage(moved, "Diseñar login")).toBe("Tarea movida: Diseñar login");
  });

  it("deleted y moved sin título dicen solo la acción", () => {
    expect(boardEventToastMessage(deleted)).toBe("Tarea eliminada");
    expect(boardEventToastMessage(moved)).toBe("Tarea movida");
    expect(boardEventToastMessage(moved, "")).toBe("Tarea movida");
  });
});
