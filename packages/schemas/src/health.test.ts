import { describe, expect, it } from "vite-plus/test";

import { healthResponseSchema } from "./health.ts";

describe("healthResponseSchema", () => {
  it("parses a healthy response", () => {
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

  it("rejects an incomplete response", () => {
    expect(() => healthResponseSchema.parse({ status: "ok" })).toThrow();
  });
});
