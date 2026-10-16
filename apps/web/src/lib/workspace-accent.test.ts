import { describe, expect, it } from "vite-plus/test";

import { workspaceAccent } from "./workspace-accent.ts";

describe("workspaceAccent", () => {
  it("devuelve el mismo color para el mismo id", () => {
    expect(workspaceAccent("ws_thepower_demo")).toBe(workspaceAccent("ws_thepower_demo"));
  });

  it("devuelve colores distintos para los workspaces del seed", () => {
    expect(workspaceAccent("ws_thepower_demo")).not.toBe(workspaceAccent("ws_ana_demo"));
  });

  it("usa formato hsl", () => {
    expect(workspaceAccent("ws_ana_demo")).toMatch(/^hsl\(\d{1,3} 65% 45%\)$/);
  });
});
