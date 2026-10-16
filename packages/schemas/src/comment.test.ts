/**
 * Prueba los contratos de comentarios: parses válidos y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import { commentListResponseSchema, commentSchema, createCommentBodySchema } from "./comment.ts";

const validComment = {
  id: "comment-1",
  taskId: "task-1",
  projectId: "project-1",
  authorId: "user-1",
  authorName: "Ada Lovelace",
  body: "Primer comentario",
  createdAt: "2026-10-16T10:00:00.000Z",
};

describe("commentSchema", () => {
  it("acepta un comentario válido", () => {
    expect(commentSchema.parse(validComment)).toEqual(validComment);
  });

  it("rechaza una fecha que no es ISO", () => {
    expect(commentSchema.safeParse({ ...validComment, createdAt: "16/10/2026" }).success).toBe(
      false,
    );
  });
});

describe("commentListResponseSchema", () => {
  it("acepta una lista vacía", () => {
    expect(commentListResponseSchema.parse([])).toEqual([]);
  });

  it("acepta una lista de comentarios", () => {
    expect(commentListResponseSchema.parse([validComment])).toEqual([validComment]);
  });
});

describe("createCommentBodySchema", () => {
  it("acepta un cuerpo válido y lo recorta", () => {
    expect(createCommentBodySchema.parse({ body: "  Hola  " })).toEqual({ body: "Hola" });
  });

  it("rechaza un cuerpo vacío", () => {
    expect(createCommentBodySchema.safeParse({ body: "" }).success).toBe(false);
  });

  it("rechaza un cuerpo de solo espacios", () => {
    expect(createCommentBodySchema.safeParse({ body: "   \n\t " }).success).toBe(false);
  });

  it("acepta 2000 caracteres y rechaza 2001", () => {
    expect(createCommentBodySchema.safeParse({ body: "a".repeat(2000) }).success).toBe(true);
    expect(createCommentBodySchema.safeParse({ body: "a".repeat(2001) }).success).toBe(false);
  });
});
