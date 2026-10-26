/**
 * Prueba los contratos de workspace y project: un parse válido y rechazos.
 * Los tests de Vite+ se importan desde `vite-plus/test`, no desde Vitest.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  projectIdParamSchema,
  projectSchema,
  projectSummarySchema,
  workspaceListResponseSchema,
  workspaceSchema,
} from "./workspace.ts";

const createdAt = "2026-10-26T17:00:00.000Z";

const validSummary = {
  id: "proj_agentic_kanban",
  name: "Agentic Kanban",
};

const validWorkspace = {
  id: "ws_thepower_demo",
  name: "thePower Demo",
  createdAt,
  projects: [validSummary],
};

const validProject = {
  id: "proj_ana_notes",
  workspaceId: "ws_ana_demo",
  name: "Notas de Ana",
  createdAt,
};

describe("projectSummarySchema", () => {
  it("acepta un resumen de project", () => {
    expect(projectSummarySchema.parse(validSummary)).toEqual(validSummary);
  });

  it("rechaza un nombre vacío", () => {
    expect(() => projectSummarySchema.parse({ ...validSummary, name: "" })).toThrow();
  });
});

describe("workspaceSchema", () => {
  it("acepta un workspace con projects", () => {
    expect(workspaceSchema.parse(validWorkspace)).toEqual(validWorkspace);
  });

  it("acepta un workspace sin projects", () => {
    expect(workspaceSchema.parse({ ...validWorkspace, projects: [] })).toEqual({
      ...validWorkspace,
      projects: [],
    });
  });

  it("rechaza una fecha que no es ISO", () => {
    expect(() => workspaceSchema.parse({ ...validWorkspace, createdAt: "ayer" })).toThrow();
  });

  it("rechaza un workspace sin projects", () => {
    expect(() =>
      workspaceSchema.parse({
        id: validWorkspace.id,
        name: validWorkspace.name,
        createdAt: validWorkspace.createdAt,
      }),
    ).toThrow();
  });

  it("rechaza un id vacío", () => {
    expect(() => workspaceSchema.parse({ ...validWorkspace, id: "" })).toThrow();
  });
});

describe("workspaceListResponseSchema", () => {
  it("acepta una lista y una lista vacía", () => {
    expect(workspaceListResponseSchema.parse([validWorkspace])).toEqual([validWorkspace]);
    expect(workspaceListResponseSchema.parse([])).toEqual([]);
  });

  it("rechaza un objeto en lugar del array", () => {
    expect(() => workspaceListResponseSchema.parse({ workspaces: [] })).toThrow();
  });
});

describe("projectSchema", () => {
  it("acepta un project", () => {
    expect(projectSchema.parse(validProject)).toEqual(validProject);
  });

  it("rechaza una fecha que no es ISO y un workspaceId vacío", () => {
    expect(() => projectSchema.parse({ ...validProject, createdAt: "2026-10-26" })).toThrow();
    expect(() => projectSchema.parse({ ...validProject, workspaceId: "" })).toThrow();
  });
});

describe("projectIdParamSchema", () => {
  it("acepta un projectId", () => {
    expect(projectIdParamSchema.parse({ projectId: "proj_ana_notes" })).toEqual({
      projectId: "proj_ana_notes",
    });
  });

  it("rechaza un projectId vacío", () => {
    expect(() => projectIdParamSchema.parse({ projectId: "" })).toThrow();
  });
});
