/**
 * Parser de menciones: límites del `@`, puntuación, tildes y duplicados.
 */
import { describe, expect, it } from "vite-plus/test";

import { extractMentionTokens } from "./mentions.ts";

describe("extractMentionTokens", () => {
  it("devuelve el nombre tras la @ al principio del texto", () => {
    expect(extractMentionTokens("@Luis mira esto")).toEqual(["Luis"]);
  });

  it("acepta la @ tras un espacio o un carácter que no es letra ni número", () => {
    expect(extractMentionTokens("hola @Ana y (@Luis)")).toEqual(["Ana", "Luis"]);
  });

  it("corta el nombre en la puntuación", () => {
    expect(extractMentionTokens("@Luis, ¿lo ves? @Ana.")).toEqual(["Luis", "Ana"]);
  });

  it("acepta letras con tildes, también en forma descompuesta", () => {
    expect(extractMentionTokens("@Íñigo y @José")).toEqual(["Íñigo", "José"]);
    expect(extractMentionTokens("@José")).toEqual(["José"]);
  });

  it("no repite la ñ ni las tildes aunque cambien las mayúsculas", () => {
    expect(extractMentionTokens("@Íñigo @ÍÑIGO @íñigo @I\u0301n\u0303igo")).toEqual(["Íñigo"]);
    expect(extractMentionTokens("@Ñandú, @ñandú")).toEqual(["Ñandú"]);
  });

  it("no cuenta un email ni una @ pegada a letras o números", () => {
    expect(extractMentionTokens("escribe a ana@demo.test o luis2@x")).toEqual([]);
    expect(extractMentionTokens("versión1@Luis")).toEqual([]);
  });

  it("ignora una @ sin letras detrás", () => {
    expect(extractMentionTokens("@ @1 @_Luis @")).toEqual([]);
  });

  it("no repite tokens aunque cambien las mayúsculas", () => {
    expect(extractMentionTokens("@Luis @LUIS @luis, @Ana")).toEqual(["Luis", "Ana"]);
  });

  it("devuelve una lista vacía sin menciones", () => {
    expect(extractMentionTokens("Sin menciones")).toEqual([]);
  });
});
