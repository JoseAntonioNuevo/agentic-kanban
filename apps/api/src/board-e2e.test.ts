/**
 * Board + tareas: sesión, membership (404), isolation y movimiento.
 */
import {
  insertColumn,
  insertProject,
  insertTask,
  insertWorkspace,
  insertWorkspaceMember,
} from "@agentic-kanban/db";
import { boardResponseSchema, taskSchema } from "@agentic-kanban/schemas";
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

describe("board authz y movimiento", () => {
  let ana: { userId: string; cookie: string };
  let luis: { userId: string; cookie: string };

  const workspaceId = `ws_${suffix}`;
  const projectId = `proj_${suffix}`;
  const colTodo = `col_todo_${suffix}`;
  const colDone = `col_done_${suffix}`;
  const taskA = `task_a_${suffix}`;
  const taskB = `task_b_${suffix}`;
  const taskC = `task_c_${suffix}`;

  const foreignWorkspaceId = `ws_foreign_${suffix}`;
  const foreignProjectId = `proj_foreign_${suffix}`;
  const foreignColumnId = `col_foreign_${suffix}`;
  const foreignTaskId = `task_foreign_${suffix}`;

  const otherProjectId = `proj_other_${suffix}`;
  const otherColumnId = `col_other_${suffix}`;

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
      id: taskA,
      workspaceId,
      projectId,
      columnId: colTodo,
      title: "A",
      position: 0,
    });
    await insertTask({
      id: taskB,
      workspaceId,
      projectId,
      columnId: colTodo,
      title: "B",
      position: 1,
    });
    await insertTask({
      id: taskC,
      workspaceId,
      projectId,
      columnId: colTodo,
      title: "C",
      position: 2,
    });

    await insertProject({ id: otherProjectId, workspaceId, name: "Otro project" });
    await insertColumn({
      id: otherColumnId,
      workspaceId,
      projectId: otherProjectId,
      name: "Notas",
      position: 0,
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

  it("GET board sin cookie → 401", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${projectId}/board`),
    );
    expect(res.status).toBe(401);
  });

  it("GET board si no es miembro → 404", async () => {
    const res = await app.fetch(
      jsonRequest("GET", `/api/projects/${projectId}/board`, luis.cookie),
    );
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("GET board miembro → columnas y tareas ordenadas", async () => {
    const res = await app.fetch(jsonRequest("GET", `/api/projects/${projectId}/board`, ana.cookie));
    const board = boardResponseSchema.parse(await res.json());

    expect(res.status).toBe(200);
    expect(board.project.id).toBe(projectId);
    expect(board.columns.map((col) => col.id)).toEqual([colTodo, colDone]);
    expect(board.columns[0]?.tasks.map((row) => row.id)).toEqual([taskA, taskB, taskC]);
    expect(board.columns[1]?.tasks).toEqual([]);
  });

  it("POST tarea + PATCH + DELETE", async () => {
    const createdRes = await app.fetch(
      jsonRequest("POST", `/api/projects/${projectId}/tasks`, ana.cookie, {
        columnId: colDone,
        title: "Nueva",
        description: "detalle",
      }),
    );
    const created = taskSchema.parse(await createdRes.json());
    expect(createdRes.status).toBe(201);
    expect(created.columnId).toBe(colDone);
    expect(created.title).toBe("Nueva");
    expect(created.description).toBe("detalle");
    expect(created.position).toBe(0);

    const patchedRes = await app.fetch(
      jsonRequest("PATCH", `/api/tasks/${created.id}`, ana.cookie, {
        title: "Editada",
        description: "otro",
      }),
    );
    const patched = taskSchema.parse(await patchedRes.json());
    expect(patchedRes.status).toBe(200);
    expect(patched.title).toBe("Editada");
    expect(patched.description).toBe("otro");

    const deletedRes = await app.fetch(
      jsonRequest("DELETE", `/api/tasks/${created.id}`, ana.cookie),
    );
    expect(deletedRes.status).toBe(200);
    taskSchema.parse(await deletedRes.json());
  });

  it("POST body inválido → 400", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/projects/${projectId}/tasks`, ana.cookie, {
        columnId: colTodo,
        title: "",
      }),
    );
    expect(res.status).toBe(400);
  });

  it("reordena en la misma columna", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskA}/move`, ana.cookie, {
        columnId: colTodo,
        position: 2,
      }),
    );
    const moved = taskSchema.parse(await res.json());
    expect(res.status).toBe(200);
    expect(moved.columnId).toBe(colTodo);
    expect(moved.position).toBe(2);

    const board = boardResponseSchema.parse(
      await (
        await app.fetch(jsonRequest("GET", `/api/projects/${projectId}/board`, ana.cookie))
      ).json(),
    );
    expect(board.columns[0]?.tasks.map((row) => row.id)).toEqual([taskB, taskC, taskA]);
    expect(board.columns[0]?.tasks.map((row) => row.position)).toEqual([0, 1, 2]);
  });

  it("mueve a otra columna y compacta el origen", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskB}/move`, ana.cookie, {
        columnId: colDone,
        position: 0,
      }),
    );
    const moved = taskSchema.parse(await res.json());
    expect(res.status).toBe(200);
    expect(moved.columnId).toBe(colDone);
    expect(moved.position).toBe(0);

    const board = boardResponseSchema.parse(
      await (
        await app.fetch(jsonRequest("GET", `/api/projects/${projectId}/board`, ana.cookie))
      ).json(),
    );
    expect(board.columns[0]?.tasks.map((row) => row.id)).toEqual([taskC, taskA]);
    expect(board.columns[0]?.tasks.map((row) => row.position)).toEqual([0, 1]);
    expect(board.columns[1]?.tasks.map((row) => row.id)).toEqual([taskB]);
  });

  it("position mayor que la longitud → append", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskA}/move`, ana.cookie, {
        columnId: colDone,
        position: 99,
      }),
    );
    const moved = taskSchema.parse(await res.json());
    expect(res.status).toBe(200);
    expect(moved.columnId).toBe(colDone);
    expect(moved.position).toBe(1);
  });

  it("move sin cookie → 401", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/tasks/${taskC}/move`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ columnId: colDone, position: 0 }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("move body inválido → 400", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskC}/move`, ana.cookie, {
        columnId: colDone,
        position: -1,
      }),
    );
    expect(res.status).toBe(400);
  });

  it("tarea de otro workspace → 404", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${foreignTaskId}/move`, ana.cookie, {
        columnId: colTodo,
        position: 0,
      }),
    );
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("columna de otro workspace → 404 y no mueve", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskC}/move`, ana.cookie, {
        columnId: foreignColumnId,
        position: 0,
      }),
    );
    expect(res.status).toBe(404);

    const board = boardResponseSchema.parse(
      await (
        await app.fetch(jsonRequest("GET", `/api/projects/${projectId}/board`, ana.cookie))
      ).json(),
    );
    expect(board.columns[0]?.tasks.some((row) => row.id === taskC)).toBe(true);
  });

  it("columna de otro project del mismo workspace → 404", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskC}/move`, ana.cookie, {
        columnId: otherColumnId,
        position: 0,
      }),
    );
    expect(res.status).toBe(404);
  });

  it("columna inexistente → 404", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskC}/move`, ana.cookie, {
        columnId: "col_no_existe",
        position: 0,
      }),
    );
    expect(res.status).toBe(404);
  });

  it("POST tarea en columna ajena → 404", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/projects/${projectId}/tasks`, ana.cookie, {
        columnId: foreignColumnId,
        title: "No",
      }),
    );
    expect(res.status).toBe(404);
  });
});
