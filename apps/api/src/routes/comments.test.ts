/**
 * Comentarios de una tarea: autorización, alta, lista y cascada. La base es
 * la temporal del setup; no usa `data/`.
 */
import { randomUUID } from "node:crypto";

import { comment, getDb } from "@agentic-kanban/db";
import { commentListResponseSchema, commentSchema } from "@agentic-kanban/schemas";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import {
  addWorkspaceMember,
  apiGet,
  apiRequest,
  signUpUser,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
} from "../test/helpers.ts";

function email(label: string): string {
  return `s4-02-${label}-${randomUUID()}@example.com`;
}

type Session = { cookie: string; userId: string };

let owner: Session;
let teammate: Session;
let stranger: Session;

beforeAll(async () => {
  owner = await signUpUser({ name: "Dueña", email: email("owner") });
  teammate = await signUpUser({ name: "Compañero", email: email("mate") });
  stranger = await signUpUser({ name: "Ajeno", email: email("stranger") });
});

async function makeTask(members: string[], prefix: string) {
  const workspaceId = `ws_${prefix}_${randomUUID()}`;
  const projectId = `proj_${prefix}_${randomUUID()}`;
  const columnId = `col_${prefix}_${randomUUID()}`;
  const taskId = `task_${prefix}_${randomUUID()}`;
  await upsertWorkspace({ id: workspaceId, name: `Espacio ${prefix}` });
  for (const userId of members) {
    await addWorkspaceMember({ workspaceId, userId });
  }
  await upsertProject({ id: projectId, workspaceId, name: `Tablero ${prefix}` });
  await upsertColumn({ id: columnId, workspaceId, projectId, name: "To Do", position: 0 });
  await upsertTask({
    id: taskId,
    workspaceId,
    projectId,
    columnId,
    title: "Tarea",
    description: "",
    position: 0,
  });
  return { workspaceId, projectId, taskId };
}

describe("comentarios de una tarea", () => {
  it("responde 401 sin cookie", async () => {
    const listed = await apiGet("/api/tasks/task_missing/comments");
    expect(listed.status).toBe(401);
    expect(await listed.json()).toEqual({ error: "Unauthorized" });

    const created = await apiRequest("POST", "/api/tasks/task_missing/comments", {
      body: { body: "Hola" },
    });
    expect(created.status).toBe(401);
    expect(await created.json()).toEqual({ error: "Unauthorized" });
  });

  it("responde 404 a quien no es miembro, al leer y al comentar", async () => {
    const own = await makeTask([owner.userId], "private");

    const read = await apiGet(`/api/tasks/${own.taskId}/comments`, stranger.cookie);
    expect(read.status).toBe(404);
    expect(await read.json()).toEqual({ error: "Not found" });

    const write = await apiRequest("POST", `/api/tasks/${own.taskId}/comments`, {
      cookie: stranger.cookie,
      body: { body: "Intruso" },
    });
    expect(write.status).toBe(404);
    expect(await write.json()).toEqual({ error: "Not found" });

    const rows = await getDb().select().from(comment).where(eq(comment.taskId, own.taskId));
    expect(rows).toEqual([]);
  });

  it("responde 404 si la tarea no existe", async () => {
    const read = await apiGet("/api/tasks/task_missing/comments", owner.cookie);
    expect(read.status).toBe(404);

    const write = await apiRequest("POST", "/api/tasks/task_missing/comments", {
      cookie: owner.cookie,
      body: { body: "Hola" },
    });
    expect(write.status).toBe(404);
  });

  it("crea (201) y lista (200) con authorName, el autor sale de la sesión", async () => {
    const shared = await makeTask([owner.userId, teammate.userId], "shared");

    const empty = await apiGet(`/api/tasks/${shared.taskId}/comments`, owner.cookie);
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual([]);

    const first = await apiRequest("POST", `/api/tasks/${shared.taskId}/comments`, {
      cookie: owner.cookie,
      body: { body: "  Primero  " },
    });
    expect(first.status).toBe(201);
    const created = commentSchema.parse(await first.json());
    expect(created).toMatchObject({
      taskId: shared.taskId,
      projectId: shared.projectId,
      authorId: owner.userId,
      authorName: "Dueña",
      body: "Primero",
    });
    expect(new Date(created.createdAt).toISOString()).toBe(created.createdAt);

    const second = await apiRequest("POST", `/api/tasks/${shared.taskId}/comments`, {
      cookie: teammate.cookie,
      body: { body: "Segundo", authorId: owner.userId, projectId: "proj_otro" },
    });
    expect(second.status).toBe(201);
    const reply = commentSchema.parse(await second.json());
    expect(reply.authorId).toBe(teammate.userId);
    expect(reply.authorName).toBe("Compañero");
    expect(reply.projectId).toBe(shared.projectId);

    const listed = await apiGet(`/api/tasks/${shared.taskId}/comments`, teammate.cookie);
    expect(listed.status).toBe(200);
    const list = commentListResponseSchema.parse(await listed.json());
    expect(list.map((item) => item.body)).toEqual(["Primero", "Segundo"]);
    expect(list.map((item) => item.authorName)).toEqual(["Dueña", "Compañero"]);
  });

  it("responde 400 con body vacío, solo espacios o de más de 2000 caracteres", async () => {
    const shared = await makeTask([owner.userId], "invalid");

    for (const body of ["", "   ", "a".repeat(2001)]) {
      const response = await apiRequest("POST", `/api/tasks/${shared.taskId}/comments`, {
        cookie: owner.cookie,
        body: { body },
      });
      expect(response.status).toBe(400);
    }

    const rows = await getDb().select().from(comment).where(eq(comment.taskId, shared.taskId));
    expect(rows).toEqual([]);
  });

  it("borrar una tarea con comentarios devuelve 204 y se llevan los comentarios", async () => {
    const shared = await makeTask([owner.userId], "cascade");
    const created = await apiRequest("POST", `/api/tasks/${shared.taskId}/comments`, {
      cookie: owner.cookie,
      body: { body: "Se irá con la tarea" },
    });
    expect(created.status).toBe(201);

    const deleted = await apiRequest("DELETE", `/api/tasks/${shared.taskId}`, {
      cookie: owner.cookie,
    });
    expect(deleted.status).toBe(204);

    const rows = await getDb().select().from(comment).where(eq(comment.taskId, shared.taskId));
    expect(rows).toEqual([]);
  });
});
