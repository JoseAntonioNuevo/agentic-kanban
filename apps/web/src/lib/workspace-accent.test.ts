/**
 * El acento de un workspace depende solo de su id y no cambia entre llamadas.
 */
import { describe, expect, it } from "vite-plus/test";

import { workspaceAccent } from "./workspace-accent.ts";

const OKLCH_COLOR = /^oklch\(\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?\)$/;

describe("workspaceAccent", () => {
  it("es determinista: el mismo id devuelve el mismo color", () => {
    const first = workspaceAccent("ws_thepower_demo");
    const second = workspaceAccent("ws_thepower_demo");

    expect(first).toBe(second);
    expect(workspaceAccent("ws_ana_demo")).toBe(workspaceAccent("ws_ana_demo"));
  });

  it("asigna colores distintos a los workspaces de la demo", () => {
    expect(workspaceAccent("ws_thepower_demo")).not.toBe(workspaceAccent("ws_ana_demo"));
  });

  it("devuelve un color oklch", () => {
    expect(workspaceAccent("ws_thepower_demo")).toMatch(OKLCH_COLOR);
    expect(workspaceAccent("ws_ana_demo")).toMatch(OKLCH_COLOR);
    expect(workspaceAccent("proj_agentic_kanban")).toMatch(OKLCH_COLOR);
  });
});
