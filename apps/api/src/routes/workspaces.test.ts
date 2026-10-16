/**
 * Tests de `GET /api/workspaces`: 401 sin sesión y lectura limitada a la
 * membresía del usuario autenticado.
 */
import { errorResponseSchema, workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { createWorkspaceFixture, requestAs, signUpUser } from "../test/helpers.ts";

describe("GET /api/workspaces", () => {
  it("responde 401 con { error } sin cookie", async () => {
    const response = await requestAs(null, "/api/workspaces");

    expect(response.status).toBe(401);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve [] para un usuario sin membresías", async () => {
    const user = await signUpUser();
    const response = await requestAs(user.cookie, "/api/workspaces");

    expect(response.status).toBe(200);
    expect(workspaceListResponseSchema.parse(await response.json())).toEqual([]);
  });

  it("lista solo los workspaces propios con sus projects", async () => {
    const alice = await signUpUser();
    const bob = await signUpUser();
    const own = await createWorkspaceFixture({
      name: "Equipo de Alice",
      memberUserIds: [alice.userId],
      projects: ["Alpha", "Beta"],
    });
    const other = await createWorkspaceFixture({
      name: "Equipo de Bob",
      memberUserIds: [bob.userId],
      projects: ["Secreto"],
    });

    const response = await requestAs(alice.cookie, "/api/workspaces");

    expect(response.status).toBe(200);
    const body = workspaceListResponseSchema.parse(await response.json());

    expect(body).toHaveLength(1);
    expect(body[0]?.id).toBe(own.workspaceId);
    expect(body[0]?.name).toBe("Equipo de Alice");
    expect(body[0]?.projects.map((item) => item.id).toSorted()).toEqual(own.projectIds.toSorted());
    expect(body[0]?.projects.map((item) => item.name).toSorted()).toEqual(["Alpha", "Beta"]);
    expect(body.map((item) => item.id)).not.toContain(other.workspaceId);
    expect(JSON.stringify(body)).not.toContain("Secreto");
  });
});
