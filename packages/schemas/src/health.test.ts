/**
 * Prueba el contrato de health: un parse válido y un rechazo.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import { healthResponseSchema } from "./health.ts";

describe("healthResponseSchema", () => {
  it("acepta una respuesta sana", () => {
    expect(
      healthResponseSchema.parse({
        status: "ok",
        api: "ok",
        database: "ok",
      }),
    ).toEqual({
      status: "ok",
      api: "ok",
      database: "ok",
    });
  });

  it("rechaza un cuerpo incompleto", () => {
    expect(() => healthResponseSchema.parse({ status: "ok" })).toThrow();
  });
});
