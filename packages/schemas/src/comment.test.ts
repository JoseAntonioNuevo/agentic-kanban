/**
 * Contratos de comentarios: parse válido y rechazos.
 */
import { describe, expect, it } from "vite-plus/test";

import { commentListResponseSchema, commentSchema, createCommentBodySchema } from "./comment.ts";

const validComment = {
  id: "comment_1",
  taskId: "task_kanban_1",
  projectId: "proj_agentic_kanban",
  authorId: "user_ana",
  authorName: "Ana",
  body: "Primer comentario",
  createdAt: "2026-11-04T10:00:00.000Z",
};

describe("commentSchema", () => {
  it("acepta un comentario válido", () => {
    expect(commentSchema.parse(validComment)).toEqual(validComment);
  });

  it("rechaza un createdAt que no es ISO", () => {
    expect(commentSchema.safeParse({ ...validComment, createdAt: "ayer" }).success).toBe(false);
    expect(commentSchema.safeParse({ ...validComment, createdAt: "2026-11-04" }).success).toBe(
      false,
    );
  });

  it("rechaza un comentario sin autor", () => {
    const { authorId: _authorId, ...rest } = validComment;
    expect(commentSchema.safeParse(rest).success).toBe(false);
  });
});

describe("commentListResponseSchema", () => {
  it("acepta una lista vacía y una lista de comentarios", () => {
    expect(commentListResponseSchema.parse([])).toEqual([]);
    expect(commentListResponseSchema.parse([validComment])).toEqual([validComment]);
  });

  it("rechaza un elemento inválido", () => {
    expect(commentListResponseSchema.safeParse([{ ...validComment, id: "" }]).success).toBe(false);
  });
});

describe("createCommentBodySchema", () => {
  it("recorta el body", () => {
    expect(createCommentBodySchema.parse({ body: "  @Luis mira esto  " })).toEqual({
      body: "@Luis mira esto",
    });
  });

  it("rechaza un body vacío o solo espacios", () => {
    expect(createCommentBodySchema.safeParse({ body: "" }).success).toBe(false);
    expect(createCommentBodySchema.safeParse({ body: "   " }).success).toBe(false);
    expect(createCommentBodySchema.safeParse({}).success).toBe(false);
  });

  it("acepta 2000 caracteres y rechaza 2001", () => {
    expect(createCommentBodySchema.safeParse({ body: "a".repeat(2000) }).success).toBe(true);
    expect(createCommentBodySchema.safeParse({ body: "a".repeat(2001) }).success).toBe(false);
  });
});
