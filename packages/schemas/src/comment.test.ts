/**
 * Parse válido y rechazo de los contratos de comentario.
 */
import { describe, expect, it } from "vite-plus/test";

import { commentListResponseSchema, commentSchema, createCommentBodySchema } from "./comment.ts";

const createdAt = "2026-08-20T12:00:00.000Z";

const comment = {
  id: "comment_1",
  workspaceId: "ws_1",
  projectId: "proj_1",
  taskId: "task_1",
  authorId: "user_1",
  authorName: "Ana",
  body: "Hola",
  createdAt,
};

describe("commentSchema", () => {
  it("acepta un comentario válido", () => {
    expect(commentSchema.parse(comment)).toEqual(comment);
  });

  it("rechaza un body vacío", () => {
    expect(() => commentSchema.parse({ ...comment, body: "" })).toThrow();
  });

  it("rechaza createdAt que no es iso datetime", () => {
    expect(() => commentSchema.parse({ ...comment, createdAt: "ayer" })).toThrow();
  });
});

describe("commentListResponseSchema", () => {
  it("acepta una lista vacía", () => {
    expect(commentListResponseSchema.parse([])).toEqual([]);
  });
});

describe("createCommentBodySchema", () => {
  it("acepta un body y recorta espacios", () => {
    expect(createCommentBodySchema.parse({ body: "  Hola  " })).toEqual({ body: "Hola" });
  });

  it("rechaza un body vacío o solo espacios", () => {
    expect(() => createCommentBodySchema.parse({ body: "" })).toThrow();
    expect(() => createCommentBodySchema.parse({ body: "   " })).toThrow();
  });
});
