/**
 * Contrato de las mutations de tareas: prefijo de clave, método, URL y parse.
 * El `fetch` global se sustituye y se restaura; no hay navegador.
 */
import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { createTask, deleteTask, taskMutationKey, updateTask } from "./use-task-mutations.ts";

const validTask = {
  id: "task_new",
  projectId: "proj_agentic_kanban",
  columnId: "col_kanban_todo",
  title: "Nueva tarea",
  description: "Detalle",
  position: 2,
  createdAt: "2026-10-26T18:30:00.000Z",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("taskMutationKey", () => {
  it("empieza por board y el projectId", () => {
    const actions = ["create", "update", "delete"] as const;

    for (const action of actions) {
      expect(taskMutationKey("proj_agentic_kanban", action).slice(0, 2)).toEqual([
        "board",
        "proj_agentic_kanban",
      ]);
    }
  });
});

describe("createTask", () => {
  it("hace POST, parsea el 201 y devuelve la tarea", async () => {
    const body = {
      columnId: "col_kanban_todo",
      title: "Nueva tarea",
      description: "Detalle",
    };
    const fetchMock = vi.fn(async () => jsonResponse(validTask, 201));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createTask("proj_agentic_kanban", body)).resolves.toEqual(validTask);
    expect(fetchMock).toHaveBeenCalledWith("/api/projects/proj_agentic_kanban/tasks", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });

  it("rechaza un 201 con forma inválida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ id: "task_new" }, 201)),
    );

    await expect(
      createTask("proj_agentic_kanban", { columnId: "col_kanban_todo", title: "Nueva tarea" }),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("lanza en 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Not found" }, 404)),
    );

    await expect(
      createTask("proj_agentic_kanban", { columnId: "col_otra", title: "Nueva tarea" }),
    ).rejects.toThrow("404");
  });
});

describe("updateTask", () => {
  it("hace PATCH y parsea el 200", async () => {
    const body = { title: "Título nuevo", description: "Detalle" };
    const fetchMock = vi.fn(async () => jsonResponse({ ...validTask, title: "Título nuevo" }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(updateTask("task_new", body)).resolves.toMatchObject({ title: "Título nuevo" });
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/task_new", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });

  it("lanza en 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Not found" }, 404)),
    );

    await expect(updateTask("task_missing", { title: "Título nuevo" })).rejects.toThrow("404");
  });
});

describe("deleteTask", () => {
  it("hace DELETE, acepta el 204 y no lee el cuerpo", async () => {
    const response = new Response(null, { status: 204 });
    const json = vi.spyOn(response, "json");
    const fetchMock = vi.fn(async () => response);
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteTask("task_new")).resolves.toBeUndefined();
    expect(json).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/task_new", {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("lanza en 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Not found" }, 404)),
    );

    await expect(deleteTask("task_missing")).rejects.toThrow("404");
  });
});
