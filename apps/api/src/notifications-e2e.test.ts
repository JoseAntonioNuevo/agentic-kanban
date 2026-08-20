/**
 * Campana: sesión 401, solo el recipient ve sus filas, mark-read 404 ajeno.
 */
import {
  insertColumn,
  insertNotification,
  insertProject,
  insertTask,
  insertWorkspace,
  insertWorkspaceMember,
} from "@agentic-kanban/db";
import { commentSchema, notificationListResponseSchema, notificationSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { auth } from "./auth/index.ts";
import { app } from "./index.ts";

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

describe("notification authz y campana", () => {
  let ana: { userId: string; cookie: string };
  let luis: { userId: string; cookie: string };

  const workspaceId = `ws_notif_${suffix}`;
  const projectId = `proj_notif_${suffix}`;
  const columnId = `col_notif_${suffix}`;
  const taskId = `task_notif_${suffix}`;
  const anaWorkspaceId = `ws_ana_notif_${suffix}`;
  const anaProjectId = `proj_ana_notif_${suffix}`;
  const anaColumnId = `col_ana_notif_${suffix}`;
  const anaTaskId = `task_ana_notif_${suffix}`;
  let luisNotificationId: string;

  it("registra usuarios y siembra fixtures", async () => {
    ana = await signUp("Ana");
    luis = await signUp("Luis");

    await insertWorkspace({ id: workspaceId, name: "Shared" });
    await insertWorkspaceMember({ workspaceId, userId: ana.userId });
    await insertWorkspaceMember({ workspaceId, userId: luis.userId });
    await insertProject({ id: projectId, workspaceId, name: "Board" });
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
      title: "Tarea compartida",
      position: 0,
    });

    await insertWorkspace({ id: anaWorkspaceId, name: "Ana only" });
    await insertWorkspaceMember({ workspaceId: anaWorkspaceId, userId: ana.userId });
    await insertProject({ id: anaProjectId, workspaceId: anaWorkspaceId, name: "Notes" });
    await insertColumn({
      id: anaColumnId,
      workspaceId: anaWorkspaceId,
      projectId: anaProjectId,
      name: "To Do",
      position: 0,
    });
    await insertTask({
      id: anaTaskId,
      workspaceId: anaWorkspaceId,
      projectId: anaProjectId,
      columnId: anaColumnId,
      title: "Privada",
      position: 0,
    });
  });

  it("GET /api/notifications sin cookie → 401", async () => {
    const res = await app.fetch(new Request("http://localhost:3000/api/notifications"));
    expect(res.status).toBe(401);
  });

  it("Luis GET ve la mención de Ana; Ana no ve las de Luis", async () => {
    const create = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskId}/comments`, ana.cookie, {
        body: "@Luis mira esto",
      }),
    );
    expect(create.status).toBe(201);

    const luisRes = await app.fetch(jsonRequest("GET", "/api/notifications", luis.cookie));
    const luisList = notificationListResponseSchema.parse(await luisRes.json());
    expect(luisRes.status).toBe(200);
    expect(luisList).toHaveLength(1);
    expect(luisList[0]?.actorUserId).toBe(ana.userId);
    expect(luisList[0]?.actorName).toBe("Ana");
    expect(luisList[0]?.taskId).toBe(taskId);
    expect(luisList[0]?.taskTitle).toBe("Tarea compartida");
    expect(luisList[0]?.bodyPreview).toBe("@Luis mira esto");
    expect(luisList[0]?.kind).toBe("mention");
    expect(luisList[0]?.readAt).toBeNull();
    expect(luisList[0]?.workspaceId).toBe(workspaceId);
    luisNotificationId = luisList[0]!.id;

    const anaRes = await app.fetch(jsonRequest("GET", "/api/notifications", ana.cookie));
    const anaList = notificationListResponseSchema.parse(await anaRes.json());
    expect(anaRes.status).toBe(200);
    expect(anaList).toHaveLength(0);
    expect(anaList.some((row) => row.id === luisNotificationId)).toBe(false);
  });

  it("comentario sin @Luis no llena la campana", async () => {
    const before = await app.fetch(jsonRequest("GET", "/api/notifications", luis.cookie));
    const beforeList = notificationListResponseSchema.parse(await before.json());

    const create = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskId}/comments`, ana.cookie, {
        body: "sin mención",
      }),
    );
    expect(create.status).toBe(201);

    const after = await app.fetch(jsonRequest("GET", "/api/notifications", luis.cookie));
    const afterList = notificationListResponseSchema.parse(await after.json());
    expect(afterList).toHaveLength(beforeList.length);
  });

  it("Ana no ve la mención que Luis le hace a ella en la lista de Luis", async () => {
    const create = await app.fetch(
      jsonRequest("POST", `/api/tasks/${taskId}/comments`, luis.cookie, {
        body: "@Ana tu turno",
      }),
    );
    expect(create.status).toBe(201);

    const luisRes = await app.fetch(jsonRequest("GET", "/api/notifications", luis.cookie));
    const luisList = notificationListResponseSchema.parse(await luisRes.json());
    expect(luisList).toHaveLength(1);
    expect(luisList[0]?.id).toBe(luisNotificationId);
    expect(luisList.some((row) => row.actorUserId === luis.userId)).toBe(false);

    const anaRes = await app.fetch(jsonRequest("GET", "/api/notifications", ana.cookie));
    const anaList = notificationListResponseSchema.parse(await anaRes.json());
    expect(anaList).toHaveLength(1);
    expect(anaList[0]?.actorUserId).toBe(luis.userId);
    expect(anaList[0]?.bodyPreview).toBe("@Ana tu turno");
    expect(anaList.some((row) => row.id === luisNotificationId)).toBe(false);
  });

  it("POST read sin cookie → 401", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/notifications/${luisNotificationId}/read`, {
        method: "POST",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("mark read 404 para el id de otro (nunca 403)", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/notifications/${luisNotificationId}/read`, ana.cookie),
    );
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);

    const luisRes = await app.fetch(jsonRequest("GET", "/api/notifications", luis.cookie));
    const luisList = notificationListResponseSchema.parse(await luisRes.json());
    expect(luisList.find((row) => row.id === luisNotificationId)?.readAt).toBeNull();
  });

  it("Luis marca la suya como leída", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/notifications/${luisNotificationId}/read`, luis.cookie),
    );
    const updated = notificationSchema.parse(await res.json());
    expect(res.status).toBe(200);
    expect(updated.id).toBe(luisNotificationId);
    expect(updated.readAt).toEqual(expect.any(String));

    const luisRes = await app.fetch(jsonRequest("GET", "/api/notifications", luis.cookie));
    const luisList = notificationListResponseSchema.parse(await luisRes.json());
    expect(luisList.find((row) => row.id === luisNotificationId)?.readAt).toEqual(updated.readAt);
  });

  it("mark read de un id inexistente → 404", async () => {
    const res = await app.fetch(
      jsonRequest("POST", "/api/notifications/notification_missing/read", luis.cookie),
    );
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("una fila stray sin membership no aparece en GET", async () => {
    const create = await app.fetch(
      jsonRequest("POST", `/api/tasks/${anaTaskId}/comments`, ana.cookie, {
        body: "comentario privado",
      }),
    );
    const comment = commentSchema.parse(await create.json());
    expect(create.status).toBe(201);

    const strayId = `notification_stray_${suffix}`;
    await insertNotification({
      id: strayId,
      workspaceId: anaWorkspaceId,
      recipientUserId: luis.userId,
      actorUserId: ana.userId,
      taskId: anaTaskId,
      commentId: comment.id,
    });

    const luisRes = await app.fetch(jsonRequest("GET", "/api/notifications", luis.cookie));
    const luisList = notificationListResponseSchema.parse(await luisRes.json());
    expect(luisList.some((row) => row.id === strayId)).toBe(false);

    const readRes = await app.fetch(
      jsonRequest("POST", `/api/notifications/${strayId}/read`, luis.cookie),
    );
    expect(readRes.status).toBe(404);
    expect(readRes.status).not.toBe(403);
  });
});
