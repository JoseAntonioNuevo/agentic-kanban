/**
 * Contrato de los comentarios en el cliente: clave, URL, método y parse.
 * El `fetch` global se sustituye y se restaura; no hay navegador.
 */
import { ZodError } from "zod";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { appendComment, commentsQueryKey, createComment, fetchComments } from "./use-comments.ts";

const validComment = {
  id: "cmt_1",
  taskId: "task_kanban_1",
  projectId: "proj_agentic_kanban",
  authorId: "user_ana",
  authorName: "Ana",
  body: "Primera línea\nSegunda línea",
  createdAt: "2026-11-04T10:00:00.000Z",
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

describe("commentsQueryKey", () => {
  it("es [comments, userId, taskId]", () => {
    expect(commentsQueryKey("task_kanban_1", "user_ana")).toEqual([
      "comments",
      "user_ana",
      "task_kanban_1",
    ]);
  });
});

describe("fetchComments", () => {
  it("hace GET relativo con la cookie y parsea la lista", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([validComment]));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchComments("task/1")).resolves.toEqual([validComment]);
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/task%2F1/comments", {
      credentials: "include",
      signal: undefined,
    });
  });

  it("rechaza un cuerpo con forma inválida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse([{ id: "cmt_1" }])),
    );

    await expect(fetchComments("task_kanban_1")).rejects.toBeInstanceOf(ZodError);
  });

  it("lanza en 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Not found" }, 404)),
    );

    await expect(fetchComments("task_kanban_1")).rejects.toThrow("404");
  });
});

describe("createComment", () => {
  it("hace POST con { body } y parsea el 201", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(validComment, 201));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createComment("task_kanban_1", { body: "Hola" })).resolves.toEqual(validComment);
    expect(fetchMock).toHaveBeenCalledWith("/api/tasks/task_kanban_1/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Hola" }),
    });
  });

  it("rechaza un 201 con forma inválida", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ id: "cmt_1" }, 201)),
    );

    await expect(createComment("task_kanban_1", { body: "Hola" })).rejects.toBeInstanceOf(ZodError);
  });

  it("lanza en 400", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Bad request" }, 400)),
    );

    await expect(createComment("task_kanban_1", { body: "Hola" })).rejects.toThrow("400");
  });
});

describe("appendComment", () => {
  it("añade al final sin mutar la lista", () => {
    const list = [validComment];
    const next = { ...validComment, id: "cmt_2" };

    expect(appendComment(list, next)).toEqual([validComment, next]);
    expect(list).toEqual([validComment]);
  });

  it("no duplica un id ya presente", () => {
    const list = [validComment];

    expect(appendComment(list, validComment)).toBe(list);
  });

  it("sin lista en caché no crea una", () => {
    expect(appendComment(undefined, validComment)).toBeUndefined();
  });
});
