/**
 * Tokens `@Nombre`: únicos, sin resolver miembros.
 */
import { describe, expect, it } from "vite-plus/test";

import { extractMentionNames } from "./mention.ts";

describe("extractMentionNames", () => {
  it("extrae un nombre", () => {
    expect(extractMentionNames("@Luis hola")).toEqual(["Luis"]);
  });

  it("corta en la coma o el punto", () => {
    expect(extractMentionNames("@Luis, mira esto")).toEqual(["Luis"]);
    expect(extractMentionNames("@Luis.")).toEqual(["Luis"]);
  });

  it("acepta letras Unicode", () => {
    expect(extractMentionNames("hola @José")).toEqual(["José"]);
  });

  it("no captura el local de un email", () => {
    expect(extractMentionNames("escribe a luis@demo.test")).toEqual([]);
  });

  it("deduplica el mismo token", () => {
    expect(extractMentionNames("@Luis @Luis")).toEqual(["Luis"]);
  });

  it("deduplica case-insensitive y conserva la primera forma", () => {
    expect(extractMentionNames("@Luis @luis")).toEqual(["Luis"]);
  });

  it("devuelve el token aunque no exista el usuario", () => {
    expect(extractMentionNames("@Pepe")).toEqual(["Pepe"]);
  });

  it("conserva el orden de la primera aparición", () => {
    expect(extractMentionNames("hola @Luis y @Ana")).toEqual(["Luis", "Ana"]);
  });

  it("no inventa menciones sin @", () => {
    expect(extractMentionNames("Luis hola")).toEqual([]);
    expect(extractMentionNames("")).toEqual([]);
  });
});
