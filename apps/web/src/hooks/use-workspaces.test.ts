/**
 * Contrato de la query de workspaces: clave con userId y fetch validado con Zod.
 * El `fetch` global se sustituye y se restaura; no hay navegador.
 */
import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { fetchWorkspaces, workspacesQueryKey } from "./use-workspaces.ts";

const validWorkspace = {
  id: "ws_thepower_demo",
  name: "thePower Demo",
  createdAt: "2026-10-21T18:30:00.000Z",
  projects: [{ id: "proj_agentic_kanban", name: "Agentic Kanban" }],
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

describe("workspacesQueryKey", () => {
  it("incluye el userId como segundo elemento", () => {
    expect(workspacesQueryKey("user-ana")).toEqual(["workspaces", "user-ana"]);
  });
});

describe("fetchWorkspaces", () => {
  it("parsea una lista válida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([validWorkspace])),
    );

    await expect(fetchWorkspaces()).resolves.toEqual([validWorkspace]);
  });

  it("acepta un array vacío", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([])),
    );

    await expect(fetchWorkspaces()).resolves.toEqual([]);
  });

  it("rechaza una forma inválida con ZodError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([{ id: "ws", name: "Incompleto" }])),
    );

    await expect(fetchWorkspaces()).rejects.toBeInstanceOf(ZodError);
  });

  it("lanza en 401 y en 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 401 })),
    );

    await expect(fetchWorkspaces()).rejects.toThrow("401");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 500 })),
    );

    await expect(fetchWorkspaces()).rejects.toThrow("500");
  });

  it("envía credentials include y el signal", async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn(async () => jsonResponse([]));
    vi.stubGlobal("fetch", fetchMock);

    await fetchWorkspaces(signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/workspaces", {
      credentials: "include",
      signal,
    });
  });
});
