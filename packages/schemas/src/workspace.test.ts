/**
 * Prueba los contratos de workspace y proyecto: parse válido y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  errorResponseSchema,
  projectIdParamSchema,
  projectSchema,
  workspaceListResponseSchema,
  workspaceSchema,
} from "./workspace.ts";

const workspace = {
  id: "ws_1",
  name: "Equipo",
  createdAt: "2026-10-16T10:00:00.000Z",
  projects: [{ id: "p_1", name: "Tablero" }],
};

describe("workspaceSchema", () => {
  it("acepta un workspace con proyectos", () => {
    expect(workspaceSchema.parse(workspace)).toEqual(workspace);
  });

  it("rechaza una fecha que no es ISO", () => {
    expect(() => workspaceSchema.parse({ ...workspace, createdAt: "16/10/2026" })).toThrow();
  });

  it("rechaza un workspace sin projects", () => {
    const { projects: _projects, ...sinProjects } = workspace;
    expect(() => workspaceSchema.parse(sinProjects)).toThrow();
  });
});

describe("workspaceListResponseSchema", () => {
  it("acepta la lista vacía", () => {
    expect(workspaceListResponseSchema.parse([])).toEqual([]);
  });

  it("acepta una lista de workspaces", () => {
    expect(workspaceListResponseSchema.parse([workspace])).toEqual([workspace]);
  });

  it("rechaza un objeto que no es array", () => {
    expect(() => workspaceListResponseSchema.parse({ workspaces: [] })).toThrow();
  });
});

describe("projectSchema", () => {
  it("acepta un proyecto válido", () => {
    const project = {
      id: "p_1",
      workspaceId: "ws_1",
      name: "Tablero",
      createdAt: "2026-10-16T10:00:00.000Z",
    };
    expect(projectSchema.parse(project)).toEqual(project);
  });

  it("rechaza un proyecto sin workspaceId", () => {
    expect(() =>
      projectSchema.parse({ id: "p_1", name: "Tablero", createdAt: "2026-10-16T10:00:00.000Z" }),
    ).toThrow();
  });
});

describe("projectIdParamSchema", () => {
  it("acepta un projectId no vacío", () => {
    expect(projectIdParamSchema.parse({ projectId: "p_1" })).toEqual({ projectId: "p_1" });
  });

  it("rechaza un projectId vacío", () => {
    expect(() => projectIdParamSchema.parse({ projectId: "" })).toThrow();
  });
});

describe("errorResponseSchema", () => {
  it("acepta la forma de error", () => {
    expect(errorResponseSchema.parse({ error: "No encontrado" })).toEqual({
      error: "No encontrado",
    });
  });

  it("rechaza un cuerpo sin error", () => {
    expect(() => errorResponseSchema.parse({})).toThrow();
  });
});
