/**
 * Authz del stream SSE: 401 sin cookie, 404 si no es miembro (nunca 403),
 * miembro → 200 text/event-stream. Cancela el body para no colgar el test.
 */
import {
  insertColumn,
  insertProject,
  insertTask,
  insertWorkspace,
  insertWorkspaceMember,
} from "@agentic-kanban/db";
import { describe, expect, it } from "vite-plus/test";

import { app } from "./index.ts";
import { auth } from "./auth/index.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "secure123";
const demoPassword = "Demo1234!";

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

async function signInDemo(email: string): Promise<string> {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email, password: demoPassword }),
    }),
  );

  const cookie = extractCookie(res);
  if (res.status !== 200 || !cookie) {
    throw new Error(`sign-in falló para ${email}: ${res.status}. ¿Corriste bun run db:seed?`);
  }

  return cookie;
}

describe("SSE /api/projects/:projectId/events", () => {
  let ana: { userId: string; cookie: string };
  let luis: { userId: string; cookie: string };
  const workspaceId = `ws_${suffix}`;
  const projectId = `proj_${suffix}`;
  const foreignProjectId = `proj_foreign_${suffix}`;

  it("registra dos usuarios y siembra fixtures", async () => {
    ana = await signUp("Ana");
    luis = await signUp("Luis");

    await insertWorkspace({ id: workspaceId, name: "Ana Space" });
    await insertWorkspaceMember({ workspaceId, userId: ana.userId });
    await insertProject({ id: projectId, workspaceId, name: "Ana Board" });

    const foreignWorkspaceId = `ws_foreign_${suffix}`;
    await insertWorkspace({ id: foreignWorkspaceId, name: "Ajeno" });
    await insertWorkspaceMember({ workspaceId: foreignWorkspaceId, userId: luis.userId });
    await insertProject({
      id: foreignProjectId,
      workspaceId: foreignWorkspaceId,
      name: "Luis Board",
    });
  });

  it("GET /api/projects/:id/events sin cookie → 401", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${projectId}/events`),
    );

    expect(res.status).toBe(401);
  });

  it("GET /api/projects/:id/events si no es miembro → 404 (nunca 403)", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${projectId}/events`, {
        headers: { cookie: luis.cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("Luis GET /api/projects/proj_ana_notes/events → 404", async () => {
    const cookie = await signInDemo("luis@demo.test");
    const res = await app.fetch(
      new Request("http://localhost:3000/api/projects/proj_ana_notes/events", {
        headers: { cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("GET /api/projects/:id/events miembro → 200 text/event-stream", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${projectId}/events`, {
        headers: { cookie: ana.cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    await res.body?.cancel();
  });

  it("Luis recibe task.moved de Ana en el body SSE", async () => {
    const sharedWorkspaceId = `ws_sse_${suffix}`;
    const sharedProjectId = `proj_sse_${suffix}`;
    const colTodo = `col_todo_sse_${suffix}`;
    const colDone = `col_done_sse_${suffix}`;
    const taskId = `task_sse_${suffix}`;

    await insertWorkspace({ id: sharedWorkspaceId, name: "Shared SSE" });
    await insertWorkspaceMember({ workspaceId: sharedWorkspaceId, userId: ana.userId });
    await insertWorkspaceMember({ workspaceId: sharedWorkspaceId, userId: luis.userId });
    await insertProject({ id: sharedProjectId, workspaceId: sharedWorkspaceId, name: "Shared" });
    await insertColumn({
      id: colTodo,
      workspaceId: sharedWorkspaceId,
      projectId: sharedProjectId,
      name: "To Do",
      position: 0,
    });
    await insertColumn({
      id: colDone,
      workspaceId: sharedWorkspaceId,
      projectId: sharedProjectId,
      name: "Done",
      position: 1,
    });
    await insertTask({
      id: taskId,
      workspaceId: sharedWorkspaceId,
      projectId: sharedProjectId,
      columnId: colTodo,
      title: "Carta",
      position: 0,
    });

    const streamRes = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${sharedProjectId}/events`, {
        headers: { cookie: luis.cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(streamRes.status).toBe(200);
    expect(streamRes.body).toBeTruthy();

    const reader = streamRes.body!.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    const waitFor = async (needle: string, timeoutMs = 4000) => {
      const deadline = Date.now() + timeoutMs;
      while (!buf.includes(needle)) {
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          throw new Error(`SSE timeout waiting for ${needle}: ${buf}`);
        }
        const chunk = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error(`SSE timeout waiting for ${needle}: ${buf}`));
            }, remaining);
          }),
        ]);
        if (chunk.done) {
          throw new Error(`SSE ended before ${needle}: ${buf}`);
        }
        buf += decoder.decode(chunk.value, { stream: true });
      }
    };

    try {
      await waitFor("keepalive");

      const moveRes = await app.fetch(
        new Request(`http://localhost:3000/api/tasks/${taskId}/move`, {
          method: "POST",
          headers: {
            cookie: ana.cookie,
            origin: "http://localhost:5173",
            "content-type": "application/json",
          },
          body: JSON.stringify({ columnId: colDone, position: 0 }),
        }),
      );
      expect(moveRes.status).toBe(200);

      await waitFor("task.moved");
      expect(buf).toContain(taskId);
      expect(buf).toContain(colDone);
    } finally {
      await reader.cancel();
    }
  });
});
