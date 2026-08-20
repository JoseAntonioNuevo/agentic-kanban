/**
 * Writes HTTP exitosos publican al hub; 404 no publica.
 * Se suscribe al proceso (no al SSE) para no colgar el test.
 */
import {
  insertColumn,
  insertProject,
  insertTask,
  insertWorkspace,
  insertWorkspaceMember,
} from "@agentic-kanban/db";
import { boardEventSchema, taskSchema, type BoardEvent } from "@agentic-kanban/schemas";
import { afterEach, describe, expect, it } from "vite-plus/test";

import { app } from "./index.ts";
import { auth } from "./auth/index.ts";
import { subscribe } from "./realtime/index.ts";

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

describe("board writes publican al hub", () => {
  let ana: { userId: string; cookie: string };
  let luis: { userId: string; cookie: string };
  let unsubscribe: (() => void) | undefined;

  const workspaceId = `ws_${suffix}`;
  const projectId = `proj_${suffix}`;
  const colTodo = `col_todo_${suffix}`;
  const colDone = `col_done_${suffix}`;
  const seedTaskId = `task_seed_${suffix}`;

  afterEach(() => {
    unsubscribe?.();
    unsubscribe = undefined;
  });

  it("registra usuarios y siembra fixtures", async () => {
    ana = await signUp("Ana");
    luis = await signUp("Luis");

    await insertWorkspace({ id: workspaceId, name: "Ana Space" });
    await insertWorkspaceMember({ workspaceId, userId: ana.userId });
    await insertProject({ id: projectId, workspaceId, name: "Ana Board" });
    await insertColumn({
      id: colTodo,
      workspaceId,
      projectId,
      name: "To Do",
      position: 0,
    });
    await insertColumn({
      id: colDone,
      workspaceId,
      projectId,
      name: "Done",
      position: 1,
    });
    await insertTask({
      id: seedTaskId,
      workspaceId,
      projectId,
      columnId: colTodo,
      title: "Semilla",
      position: 0,
    });
  });

  it("POST create miembro → listener recibe task.created parseable", async () => {
    const received: BoardEvent[] = [];
    unsubscribe = subscribe(projectId, (event) => {
      received.push(event);
    });

    const res = await app.fetch(
      jsonRequest("POST", `/api/projects/${projectId}/tasks`, ana.cookie, {
        columnId: colTodo,
        title: "Nueva",
        description: "detalle",
      }),
    );
    const created = taskSchema.parse(await res.json());

    expect(res.status).toBe(201);
    expect(received).toHaveLength(1);
    const event = boardEventSchema.parse(received[0]);
    expect(event).toEqual({
      type: "task.created",
      projectId,
      actorUserId: ana.userId,
      task: created,
    });
  });

  it("Luis mueve una tarea de Ana → 404 y no publica", async () => {
    const received: BoardEvent[] = [];
    unsubscribe = subscribe(projectId, (event) => {
      received.push(event);
    });

    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${seedTaskId}/move`, luis.cookie, {
        columnId: colDone,
        position: 0,
      }),
    );

    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
    expect(received).toHaveLength(0);
  });
});
