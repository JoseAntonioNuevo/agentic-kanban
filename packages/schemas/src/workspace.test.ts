/**
 * Parse válido y rechazo de los contratos de workspace / project.
 */
import { describe, expect, it } from "vite-plus/test";

import {
  projectIdParamSchema,
  projectSchema,
  workspaceListResponseSchema,
  workspaceSchema,
  workspacesQuerySchema,
} from "./workspace.ts";

const createdAt = "2026-08-19T15:00:00.000Z";

describe("workspaceSchema", () => {
  it("acepta un workspace válido", () => {
    expect(
      workspaceSchema.parse({
        id: "ws_1",
        name: "Demo",
        createdAt,
        projects: [],
      }),
    ).toEqual({
      id: "ws_1",
      name: "Demo",
      createdAt,
      projects: [],
    });
  });

  it("rechaza sin nombre", () => {
    expect(() =>
      workspaceSchema.parse({
        id: "ws_1",
        name: "",
        createdAt,
      }),
    ).toThrow();
  });
});

describe("workspaceListResponseSchema", () => {
  it("acepta una lista vacía", () => {
    expect(workspaceListResponseSchema.parse([])).toEqual([]);
  });

  it("rechaza un elemento incompleto", () => {
    expect(() => workspaceListResponseSchema.parse([{ id: "ws_1" }])).toThrow();
  });
});

describe("projectSchema", () => {
  it("acepta un project válido", () => {
    expect(
      projectSchema.parse({
        id: "proj_1",
        workspaceId: "ws_1",
        name: "Board",
        createdAt,
      }),
    ).toEqual({
      id: "proj_1",
      workspaceId: "ws_1",
      name: "Board",
      createdAt,
    });
  });

  it("rechaza sin workspaceId", () => {
    expect(() =>
      projectSchema.parse({
        id: "proj_1",
        name: "Board",
        createdAt,
      }),
    ).toThrow();
  });
});

describe("projectIdParamSchema", () => {
  it("acepta un projectId", () => {
    expect(projectIdParamSchema.parse({ projectId: "proj_1" })).toEqual({
      projectId: "proj_1",
    });
  });

  it("rechaza un projectId vacío", () => {
    expect(() => projectIdParamSchema.parse({ projectId: "" })).toThrow();
  });
});

describe("workspacesQuerySchema", () => {
  it("acepta un query vacío", () => {
    expect(workspacesQuerySchema.parse({})).toEqual({});
  });

  it("no trata workspaceId como input de permiso", () => {
    expect(workspacesQuerySchema.parse({ workspaceId: "ws_ajeno" })).toEqual({});
  });
});
