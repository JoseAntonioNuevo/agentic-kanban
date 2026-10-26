/**
 * Autorización de las lecturas de workspace y project.
 * La base es la temporal del setup; no usa `data/`.
 */
import { randomUUID } from "node:crypto";

import { projectSchema, workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import {
  addWorkspaceMember,
  apiGet,
  signUpUser,
  upsertProject,
  upsertWorkspace,
} from "../test/helpers.ts";

function email(label: string): string {
  return `s1-03-${label}-${randomUUID()}@example.com`;
}

describe("lecturas autenticadas", () => {
  it("responde 401 sin cookie", async () => {
    const workspaces = await apiGet("/api/workspaces");
    expect(workspaces.status).toBe(401);
    expect(await workspaces.json()).toEqual({ error: "Unauthorized" });

    const project = await apiGet("/api/projects/proj_missing");
    expect(project.status).toBe(401);
    expect(await project.json()).toEqual({ error: "Unauthorized" });
  });

  it("devuelve una lista vacía a un usuario sin membresías", async () => {
    const user = await signUpUser({ name: "Nuevo", email: email("empty") });
    const response = await apiGet("/api/workspaces", user.cookie);

    expect(response.status).toBe(200);
    expect(workspaceListResponseSchema.parse(await response.json())).toEqual([]);
  });

  it("lista los workspaces del miembro con sus projects y omite el ajeno", async () => {
    const member = await signUpUser({ name: "Miembro", email: email("member") });
    const other = await signUpUser({ name: "Ajeno", email: email("other") });
    const ownA = `ws_own_a_${randomUUID()}`;
    const ownB = `ws_own_b_${randomUUID()}`;
    const foreignId = `ws_foreign_${randomUUID()}`;
    const projectA = `proj_a_${randomUUID()}`;
    const projectB = `proj_b_${randomUUID()}`;
    const projectForeign = `proj_f_${randomUUID()}`;

    await upsertWorkspace({ id: ownA, name: "Espacio A" });
    await upsertWorkspace({ id: ownB, name: "Espacio B" });
    await upsertWorkspace({ id: foreignId, name: "Espacio ajeno" });
    await addWorkspaceMember({ workspaceId: ownA, userId: member.userId });
    await addWorkspaceMember({ workspaceId: ownB, userId: member.userId });
    await addWorkspaceMember({ workspaceId: foreignId, userId: other.userId });
    await upsertProject({ id: projectA, workspaceId: ownA, name: "Tablero A" });
    await upsertProject({ id: projectB, workspaceId: ownA, name: "Tablero B" });
    await upsertProject({ id: projectForeign, workspaceId: foreignId, name: "Notas ajenas" });

    const response = await apiGet("/api/workspaces", member.cookie);
    expect(response.status).toBe(200);
    const list = workspaceListResponseSchema.parse(await response.json());
    const byId = new Map(list.map((workspace) => [workspace.id, workspace]));

    expect([...byId.keys()].sort()).toEqual([ownA, ownB].sort());
    expect(
      byId
        .get(ownA)
        ?.projects.map((item) => item.id)
        .sort(),
    ).toEqual([projectA, projectB].sort());
    expect(
      byId
        .get(ownA)
        ?.projects.map((item) => item.name)
        .sort(),
    ).toEqual(["Tablero A", "Tablero B"].sort());
    expect(byId.get(ownB)?.projects).toEqual([]);
    expect(byId.has(foreignId)).toBe(false);
    expect(list.flatMap((workspace) => workspace.projects.map((item) => item.id))).not.toContain(
      projectForeign,
    );

    const otherResponse = await apiGet("/api/workspaces", other.cookie);
    expect(otherResponse.status).toBe(200);
    const otherList = workspaceListResponseSchema.parse(await otherResponse.json());
    expect(otherList.map((workspace) => workspace.id)).toEqual([foreignId]);
    expect(otherList[0]?.projects).toEqual([{ id: projectForeign, name: "Notas ajenas" }]);
  });

  it("devuelve el project propio y 404 si no hay membresía o no existe", async () => {
    const owner = await signUpUser({ name: "Dueño", email: email("owner") });
    const stranger = await signUpUser({ name: "Extraño", email: email("stranger") });
    const neighbor = await signUpUser({ name: "Vecino", email: email("neighbor") });
    const workspaceId = `ws_proj_${randomUUID()}`;
    const otherWorkspaceId = `ws_other_${randomUUID()}`;
    const projectId = `proj_own_${randomUUID()}`;

    await upsertWorkspace({ id: workspaceId, name: "Espacio del project" });
    await upsertWorkspace({ id: otherWorkspaceId, name: "Otro espacio" });
    await addWorkspaceMember({ workspaceId, userId: owner.userId });
    await addWorkspaceMember({ workspaceId: otherWorkspaceId, userId: neighbor.userId });
    await upsertProject({ id: projectId, workspaceId, name: "Tablero propio" });

    const own = await apiGet(`/api/projects/${projectId}`, owner.cookie);
    expect(own.status).toBe(200);
    const project = projectSchema.parse(await own.json());
    expect(project.id).toBe(projectId);
    expect(project.workspaceId).toBe(workspaceId);
    expect(project.name).toBe("Tablero propio");

    const hidden = await apiGet(`/api/projects/${projectId}`, stranger.cookie);
    expect(hidden.status).toBe(404);
    expect(await hidden.json()).toEqual({ error: "Not found" });

    const neighborResponse = await apiGet(`/api/projects/${projectId}`, neighbor.cookie);
    expect(neighborResponse.status).toBe(404);
    expect(await neighborResponse.json()).toEqual({ error: "Not found" });

    const missing = await apiGet(`/api/projects/proj_does_not_exist_${randomUUID()}`, owner.cookie);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Not found" });
  });
});
