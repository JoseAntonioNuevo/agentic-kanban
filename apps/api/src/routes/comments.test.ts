/**
 * Tests de `/api/tasks/:taskId/comments`: 401 sin sesión, 404 (nunca 403) para
 * no miembros y tareas inexistentes, creación con `authorName`, listado en
 * orden de creación, 400 con cuerpo vacío y borrado de tarea con comentarios.
 */
import {
  commentListResponseSchema,
  commentSchema,
  errorResponseSchema,
} from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import {
  createBoardFixture,
  createWorkspaceFixture,
  requestAs,
  signUpUser,
} from "../test/helpers.ts";
import type { SignedUpUser } from "../test/helpers.ts";

/** Workspace privado de Ana con una tarea; devuelve el id de la tarea. */
async function createPrivateTask(owner: SignedUpUser): Promise<string> {
  const { workspaceId, projectIds } = await createWorkspaceFixture({
    name: "Privado de Ana",
    memberUserIds: [owner.userId],
    projects: ["Tablero"],
  });
  const projectId = projectIds[0] ?? "";
  const { taskIds } = await createBoardFixture({
    workspaceId,
    projectId,
    columns: [{ name: "Pendiente", tasks: ["Tarea de Ana"] }],
  });

  return taskIds[0]?.[0] ?? "";
}

function postComment(cookie: string | null, taskId: string, body: unknown) {
  return requestAs(cookie, `/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

async function listComments(cookie: string, taskId: string) {
  const response = await requestAs(cookie, `/api/tasks/${taskId}/comments`);

  expect(response.status).toBe(200);

  return commentListResponseSchema.parse(await response.json());
}

describe("/api/tasks/:taskId/comments", () => {
  it("responde 401 con { error } en GET y POST sin cookie", async () => {
    const getResponse = await requestAs(null, "/api/tasks/cualquier-id/comments");

    expect(getResponse.status).toBe(401);
    errorResponseSchema.parse(await getResponse.json());

    const postResponse = await postComment(null, "cualquier-id", "Hola");

    expect(postResponse.status).toBe(401);
    errorResponseSchema.parse(await postResponse.json());
  });

  it("responde 404 a un no miembro en GET y POST y no crea nada", async () => {
    const ana = await signUpUser({ name: "Ana" });
    const luis = await signUpUser({ name: "Luis" });
    const taskId = await createPrivateTask(ana);

    const getResponse = await requestAs(luis.cookie, `/api/tasks/${taskId}/comments`);

    expect(getResponse.status).toBe(404);
    errorResponseSchema.parse(await getResponse.json());

    const postResponse = await postComment(luis.cookie, taskId, "Intruso");

    expect(postResponse.status).toBe(404);
    errorResponseSchema.parse(await postResponse.json());

    expect(await listComments(ana.cookie, taskId)).toHaveLength(0);
  });

  it("crea comentarios con authorName y body recortado, y los lista en orden de creación", async () => {
    const ana = await signUpUser({ name: "Ana" });
    const taskId = await createPrivateTask(ana);

    const first = await postComment(ana.cookie, taskId, "  Primero  ");

    expect(first.status).toBe(201);
    const firstComment = commentSchema.parse(await first.json());

    expect(firstComment.authorName).toBe("Ana");
    expect(firstComment.authorId).toBe(ana.userId);
    expect(firstComment.taskId).toBe(taskId);
    expect(firstComment.body).toBe("Primero");

    const second = await postComment(ana.cookie, taskId, "Segundo");

    expect(second.status).toBe(201);
    const secondComment = commentSchema.parse(await second.json());

    expect(secondComment.authorName).toBe("Ana");
    expect(secondComment.body).toBe("Segundo");
    expect(secondComment.id).not.toBe(firstComment.id);

    const comments = await listComments(ana.cookie, taskId);

    expect(comments).toHaveLength(2);
    expect(comments.map((comment) => comment.id)).toEqual([firstComment.id, secondComment.id]);
    expect(comments.map((comment) => comment.body)).toEqual(["Primero", "Segundo"]);
    expect(comments[0]?.projectId).toBe(firstComment.projectId);
  });

  it("responde 400 con body vacío o solo espacios y no crea nada", async () => {
    const ana = await signUpUser({ name: "Ana" });
    const taskId = await createPrivateTask(ana);

    for (const body of ["", "   "]) {
      const response = await postComment(ana.cookie, taskId, body);

      expect(response.status).toBe(400);
    }

    expect(await listComments(ana.cookie, taskId)).toHaveLength(0);
  });

  it("responde 404 en GET y POST para una tarea inexistente", async () => {
    const ana = await signUpUser({ name: "Ana" });

    const getResponse = await requestAs(ana.cookie, "/api/tasks/no-existe/comments");

    expect(getResponse.status).toBe(404);
    errorResponseSchema.parse(await getResponse.json());

    const postResponse = await postComment(ana.cookie, "no-existe", "Hola");

    expect(postResponse.status).toBe(404);
    errorResponseSchema.parse(await postResponse.json());
  });

  it("borrar una tarea con comentarios devuelve 204 y después sus comentarios dan 404", async () => {
    const ana = await signUpUser({ name: "Ana" });
    const taskId = await createPrivateTask(ana);

    expect((await postComment(ana.cookie, taskId, "Uno")).status).toBe(201);
    expect((await postComment(ana.cookie, taskId, "Dos")).status).toBe(201);

    const deleted = await requestAs(ana.cookie, `/api/tasks/${taskId}`, { method: "DELETE" });

    expect(deleted.status).toBe(204);

    const after = await requestAs(ana.cookie, `/api/tasks/${taskId}/comments`);

    expect(after.status).toBe(404);
    errorResponseSchema.parse(await after.json());
  });
});
