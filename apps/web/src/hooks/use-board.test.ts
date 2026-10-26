/**
 * Contrato de la query del tablero: clave con userId y fetch validado con Zod.
 * El `fetch` global se sustituye y se restaura; no hay navegador.
 */
import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { BoardNotFoundError, boardQueryKey, fetchBoard } from "./use-board.ts";

const validBoard = {
  project: {
    id: "proj_agentic_kanban",
    workspaceId: "ws_thepower_demo",
    name: "Agentic Kanban",
    createdAt: "2026-10-21T18:30:00.000Z",
  },
  columns: [
    {
      id: "col_kanban_todo",
      projectId: "proj_agentic_kanban",
      name: "To Do",
      position: 0,
      createdAt: "2026-10-21T18:30:00.000Z",
      tasks: [
        {
          id: "task_kanban_1",
          projectId: "proj_agentic_kanban",
          columnId: "col_kanban_todo",
          title: "Definir columnas",
          description: "",
          position: 0,
          createdAt: "2026-10-21T18:30:00.000Z",
        },
      ],
    },
  ],
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

describe("boardQueryKey", () => {
  it("incluye el userId como segundo elemento", () => {
    expect(boardQueryKey("proj_agentic_kanban", "user-ana")).toEqual([
      "board",
      "user-ana",
      "proj_agentic_kanban",
    ]);
  });
});

describe("fetchBoard", () => {
  it("parsea un tablero válido", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(validBoard)),
    );

    await expect(fetchBoard("proj_agentic_kanban")).resolves.toEqual(validBoard);
  });

  it("rechaza una forma inválida con ZodError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ project: { id: "proj" }, columns: [] })),
    );

    await expect(fetchBoard("proj_agentic_kanban")).rejects.toBeInstanceOf(ZodError);
  });

  it("lanza BoardNotFoundError en 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Not found" }), { status: 404 })),
    );

    await expect(fetchBoard("proj_ana_notes")).rejects.toBeInstanceOf(BoardNotFoundError);
  });

  it("lanza en 401 y en 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );

    await expect(fetchBoard("proj_agentic_kanban")).rejects.toThrow("401");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );

    await expect(fetchBoard("proj_agentic_kanban")).rejects.toThrow("500");
  });

  it("envía credentials include y el signal", async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn(async () => jsonResponse(validBoard));
    vi.stubGlobal("fetch", fetchMock);

    await fetchBoard("proj_agentic_kanban", signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/projects/proj_agentic_kanban/board", {
      credentials: "include",
      signal,
    });
  });
});
