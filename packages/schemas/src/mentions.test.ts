import { describe, expect, it } from "vite-plus/test";

import { extractMentionTokens } from "./mentions.ts";

describe("extractMentionTokens", () => {
  it("extrae una mención simple", () => {
    expect(extractMentionTokens("@Luis mira esto")).toEqual(["Luis"]);
  });

  it("la puntuación corta el nombre", () => {
    expect(extractMentionTokens("@Luis,")).toEqual(["Luis"]);
    expect(extractMentionTokens("(@luis)")).toEqual(["luis"]);
  });

  it("ignora emails y @ pegado a letras o números", () => {
    expect(extractMentionTokens("ana@demo.test")).toEqual([]);
    expect(extractMentionTokens("x@Luis")).toEqual([]);
    expect(extractMentionTokens("2@Luis")).toEqual([]);
  });

  it("admite tildes y eñes", () => {
    expect(extractMentionTokens("@José y @Ñandú")).toEqual(["José", "Ñandú"]);
  });

  it("deduplica sin distinguir mayúsculas y conserva la primera grafía", () => {
    expect(extractMentionTokens("@Luis @luis @LUIS")).toEqual(["Luis"]);
  });

  it("normaliza a NFC una tilde combinante", () => {
    const combining = "@José";
    expect(combining.length).not.toBe("@José".length);
    expect(extractMentionTokens(combining)).toEqual(["José"]);
  });

  it("devuelve vacío sin menciones o con un @ suelto", () => {
    expect(extractMentionTokens("sin menciones")).toEqual([]);
    expect(extractMentionTokens("@")).toEqual([]);
    expect(extractMentionTokens("hola @ mundo")).toEqual([]);
  });
});
