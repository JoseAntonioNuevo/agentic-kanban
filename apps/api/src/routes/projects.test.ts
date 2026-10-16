/**
 * Tests de `GET /api/projects/:projectId`: 401 sin sesión, 200 para un
 * project del workspace del usuario y 404 (nunca 403) si es de otro
 * workspace o no existe.
 */
import { errorResponseSchema, projectSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { createWorkspaceFixture, requestAs, signUpUser } from "../test/helpers.ts";

describe("GET /api/projects/:projectId", () => {
  it("responde 401 con { error } sin cookie", async () => {
    const response = await requestAs(null, "/api/projects/cualquier-id");

    expect(response.status).toBe(401);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve 200 con el project de un workspace del que es miembro", async () => {
    const user = await signUpUser();
    const fixture = await createWorkspaceFixture({
      name: "Equipo",
      memberUserIds: [user.userId],
      projects: ["Tablero"],
    });
    const projectId = fixture.projectIds[0] ?? "";

    const response = await requestAs(user.cookie, `/api/projects/${projectId}`);

    expect(response.status).toBe(200);
    const body = projectSchema.parse(await response.json());

    expect(body.id).toBe(projectId);
    expect(body.workspaceId).toBe(fixture.workspaceId);
    expect(body.name).toBe("Tablero");
  });

  it("devuelve 404 para un project de otro workspace", async () => {
    const alice = await signUpUser();
    const bob = await signUpUser();
    await createWorkspaceFixture({ name: "Alice", memberUserIds: [alice.userId] });
    const foreign = await createWorkspaceFixture({
      name: "Bob",
      memberUserIds: [bob.userId],
      projects: ["Privado"],
    });
    const projectId = foreign.projectIds[0] ?? "";

    const response = await requestAs(alice.cookie, `/api/projects/${projectId}`);

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve 404 para un project inexistente", async () => {
    const user = await signUpUser();
    const response = await requestAs(user.cookie, "/api/projects/no-existe");

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());
  });
});
