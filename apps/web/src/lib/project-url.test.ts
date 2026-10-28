/**
 * El proyecto abierto se lee y se escribe en `?project=`.
 */
import { describe, expect, it } from "vite-plus/test";

import { projectUrl, readProjectId } from "./project-url.ts";

describe("readProjectId", () => {
  it("lee el id del parámetro project", () => {
    expect(readProjectId("?project=proj_agentic_kanban")).toBe("proj_agentic_kanban");
  });

  it("devuelve null si falta o está vacío", () => {
    expect(readProjectId("")).toBeNull();
    expect(readProjectId("?project=")).toBeNull();
    expect(readProjectId("?project=%20")).toBeNull();
    expect(readProjectId("?other=1")).toBeNull();
  });
});

describe("projectUrl", () => {
  it("añade el proyecto y conserva el resto de la URL", () => {
    expect(projectUrl("http://localhost:5173/?x=1#top", "proj_ana_notes")).toBe(
      "/?x=1&project=proj_ana_notes#top",
    );
  });

  it("codifica el id", () => {
    expect(projectUrl("http://localhost:5173/", "a b&c")).toBe("/?project=a+b%26c");
    expect(readProjectId("?project=a+b%26c")).toBe("a b&c");
  });

  it("quita el proyecto al volver al dashboard", () => {
    expect(projectUrl("http://localhost:5173/?project=proj_ana_notes", null)).toBe("/");
  });
});
