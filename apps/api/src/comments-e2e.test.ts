/**
 * Comentarios: sesión, membership (404), isolation, list/create.
 */
import {
  insertColumn,
  insertProject,
  insertTask,
  insertWorkspace,
  insertWorkspaceMember,
} from "@agentic-kanban/db";
import { commentListResponseSchema, commentSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { app } from "./index.ts";
import { auth } from "./auth/index.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "secure123";

const authHeaders = {
  "content-type": "application/json",
  origin: "http://localhost:5173",
} as const;

function getString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

function getObject(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

function extractCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  return setCookie?.split(";")[0] ?? "";
}

async function signUp(name: string): Promise<{ userId: string; cookie: string }> {
  const email = `${name.toLowerCase()}-${suffix}@example.com`;
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email, password, name }),
    }),
  );

  const body: unknown = await res.json();
  const userId = getString(getObject(body, "user"), "id");
  const cookie = extractCookie(res);

  if (res.status !== 200 || !userId || !cookie) {
    throw new Error(`sign-up falló para ${name}: ${res.status}`);
  }

  return { userId, cookie };
}

function jsonRequest(method: string, path: string, cookie: string, body?: unknown): Request {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: {
      cookie,
      origin: "http://localhost:5173",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe("comment authz y CRUD mínimo", () => {
  let ana: { userId: string; cookie: string };
  let luis: { userId: string; cookie: string };

  const workspaceId = `ws_${suffix}`;
  const projectId = `proj_${suffix}`;
  const columnId = `col_${suffix}`;
  const taskId = `task_${suffix}`;
  const otherTaskId = `task_other_${suffix}`;

  const foreignWorkspaceId = `ws_foreign_${suffix}`;
  const foreignProjectId = `proj_foreign_${suffix}`;
  const foreignColumnId = `col_foreign_${suffix}`;
  const foreignTaskId = `task_foreign_${suffix}`;

  it("registra usuarios y siembra fixtures", async () => {
    ana = await signUp("Ana");
    luis = await signUp("Luis");

    await insertWorkspace({ id: workspaceId, name: "Ana Space" });
    await insertWorkspaceMember({ workspaceId, userId: ana.userId });
    await insertProject({ id: projectId, workspaceId, name: "Ana Board" });
    await insertColumn({
      id: columnId,
      workspaceId,
      projectId,
      name: "To Do",
      position: 0,
    });
    await insertTask({
      id: taskId,
      workspaceId,
      projectId,
      columnId,
      title: "Tarea Ana",
      position: 0,
    });
    await insertTask({
      id: otherTaskId,
      workspaceId,
      projectId,
      columnId,
      title: "Otra",
      position: 1,
    });

    await insertWorkspace({ id: foreignWorkspaceId, name: "Ajeno" });
    await insertWorkspaceMember({ workspaceId: foreignWorkspaceId, userId: luis.userId });
    await insertProject({
      id: foreignProjectId,
      workspaceId: foreignWorkspaceId,
      name: "Luis Board",
    });
    await insertColumn({
      id: foreignColumnId,
      workspaceId: foreignWorkspaceId,
      projectId: foreignProjectId,
      name: "Luis Col",
      position: 0,
    });
    await insertTask({
      id: foreignTaskId,
      workspaceId: foreignWorkspaceId,
      projectId: foreignProjectId,
      columnId: foreignColumnId,
      title: "Secreto",
      position: 0,
    });
  });

  it("GET comments sin cookie → 401", async () => {
    const res = await app.fetch(new Request(`http://localhost:3000/api/tasks/${taskId}/comments`));
    expect(res.status).toBe(401);
  });

  it("POST comment sin cookie → 401", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body: "Hola" }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("Luis GET comments en task de Ana → 404", async () => {
    const res = await app.fetch(jsonRequest("GET", `/api/tasks/${taskId}/comments`, luis.cookie));
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("Luis POST comment en task de Ana → 404", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskId}/comments`, luis.cookie, { body: "No" }),
    );
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("task inexistente → 404", async () => {
    const res = await app.fetch(
      jsonRequest("GET", "/api/tasks/task_no_existe/comments", ana.cookie),
    );
    expect(res.status).toBe(404);
  });

  it("Ana GET lista vacía → 200", async () => {
    const res = await app.fetch(jsonRequest("GET", `/api/tasks/${taskId}/comments`, ana.cookie));
    const list = commentListResponseSchema.parse(await res.json());
    expect(res.status).toBe(200);
    expect(list).toEqual([]);
  });

  it("Ana POST + GET ordenado por created_at", async () => {
    const firstRes = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskId}/comments`, ana.cookie, { body: "  Primero  " }),
    );
    const first = commentSchema.parse(await firstRes.json());
    expect(firstRes.status).toBe(201);
    expect(first.taskId).toBe(taskId);
    expect(first.workspaceId).toBe(workspaceId);
    expect(first.projectId).toBe(projectId);
    expect(first.authorId).toBe(ana.userId);
    expect(first.authorName).toBe("Ana");
    expect(first.body).toBe("Primero");
    expect(first.id.startsWith("comment_")).toBe(true);

    const secondRes = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskId}/comments`, ana.cookie, { body: "Segundo" }),
    );
    const second = commentSchema.parse(await secondRes.json());
    expect(secondRes.status).toBe(201);
    expect(second.body).toBe("Segundo");

    const otherRes = await app.fetch(
      jsonRequest("POST", `/api/tasks/${otherTaskId}/comments`, ana.cookie, {
        body: "De otra tarea",
      }),
    );
    expect(otherRes.status).toBe(201);

    const listRes = await app.fetch(jsonRequest("GET", `/api/tasks/${taskId}/comments`, ana.cookie));
    const list = commentListResponseSchema.parse(await listRes.json());
    expect(listRes.status).toBe(200);
    expect(list.map((row) => row.body)).toEqual(["Primero", "Segundo"]);
    expect(list.every((row) => row.taskId === taskId)).toBe(true);
    expect(list.every((row) => row.authorName === "Ana")).toBe(true);
  });

  it("POST body inválido → 400", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskId}/comments`, ana.cookie, { body: "   " }),
    );
    expect(res.status).toBe(400);
  });

  it("Ana no lee comments del task de Luis → 404", async () => {
    const res = await app.fetch(
      jsonRequest("GET", `/api/tasks/${foreignTaskId}/comments`, ana.cookie),
    );
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });
});
