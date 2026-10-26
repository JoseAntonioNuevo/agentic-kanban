/**
 * Contrato del POST de movimiento: clave, URL y parse. El `fetch` global se
 * sustituye; no hay navegador.
 */
import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { moveTask, moveTaskMutationKey } from "./use-move-task.ts";

const validTask = {
  id: "task_b",
  projectId: "proj_agentic_kanban",
  columnId: "col_doing",
  title: "Mover",
  description: "",
  position: 1,
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

describe("moveTaskMutationKey", () => {
  it("es board, el projectId y move", () => {
    expect(moveTaskMutationKey("proj_agentic_kanban")).toEqual([
      "board",
      "proj_agentic_kanban",
      "move",
    ]);
    expect(moveTaskMutationKey("proj_agentic_kanban").slice(0, 2)).toEqual([
      "board",
      "proj_agentic_kanban",
    ]);
  });
});

describe("moveTask", () => {
  it("hace POST, parsea el 200 y devuelve la tarea", async () => {
    const body = { columnId: "col_doing", position: 1 };
    const fetchMock = vi.fn(async () => jsonResponse(validTask));
    vi.stubGlobal("fetch", fetchMock);

    await expect(moveTask("task_b", body)).resolves.toEqual(validTask);
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/task_b/move", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  });

  it("rechaza un 200 con forma inválida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ id: "task_b" })),
    );

    await expect(moveTask("task_b", { columnId: "col_doing", position: 1 })).rejects.toBeInstanceOf(
      ZodError,
    );
  });

  it("lanza en 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Not found" }, 404)),
    );

    await expect(moveTask("task_missing", { columnId: "col_doing", position: 0 })).rejects.toThrow(
      "404",
    );
  });
});
