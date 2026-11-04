/**
 * Campana: `GET /api/notifications` y `POST /api/notifications/:id/read`.
 *
 * Ana y Luis comparten un workspace; Ana menciona a Luis y solo Luis ve y
 * marca esa fila. La base y el outbox son los temporales del setup.
 */
import { randomUUID } from "node:crypto";

import {
  commentSchema,
  notificationListResponseSchema,
  notificationSchema,
} from "@agentic-kanban/schemas";
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

type Session = { cookie: string; userId: string };

let ana: Session;
let luis: Session;
let taskId: string;
let projectId: string;

function email(label: string): string {
  return `s4-05-${label}-${randomUUID()}@example.com`;
}

beforeAll(async () => {
  ana = await signUpUser({ name: "Ana", email: email("ana") });
  luis = await signUpUser({ name: "Luis", email: email("luis") });

  const workspaceId = `ws_bell_${randomUUID()}`;
  projectId = `proj_bell_${randomUUID()}`;
  const columnId = `col_bell_${randomUUID()}`;
  taskId = `task_bell_${randomUUID()}`;
  await upsertWorkspace({ id: workspaceId, name: "Compartido" });
  await addWorkspaceMember({ workspaceId, userId: ana.userId });
  await addWorkspaceMember({ workspaceId, userId: luis.userId });
  await upsertProject({ id: projectId, workspaceId, name: "Tablero" });
  await upsertColumn({ id: columnId, workspaceId, projectId, name: "To Do", position: 0 });
  await upsertTask({
    id: taskId,
    workspaceId,
    projectId,
    columnId,
    title: "Tarea con mención",
    description: "",
    position: 0,
  });
});

async function comment(session: Session, body: string) {
  const response = await apiRequest("POST", `/api/tasks/${taskId}/comments`, {
    cookie: session.cookie,
    body: { body },
  });
  expect(response.status).toBe(201);
  return commentSchema.parse(await response.json());
}

async function list(session: Session) {
  const response = await apiGet("/api/notifications", session.cookie);
  expect(response.status).toBe(200);
  const json: unknown = await response.json();
  return notificationListResponseSchema.parse(json);
}

describe("GET /api/notifications", () => {
  it("401 sin sesión", async () => {
    expect((await apiGet("/api/notifications")).status).toBe(401);
  });

  it("Luis ve la mención de Ana; Ana no la ve", async () => {
    const before = await list(luis);
    await comment(ana, "@Luis mira esto");

    const forLuis = await list(luis);
    expect(forLuis).toHaveLength(before.length + 1);
    expect(forLuis[0]).toEqual({
      id: expect.any(String),
      kind: "mention",
      actorName: "Ana",
      taskId,
      taskTitle: "Tarea con mención",
      projectId,
      commentPreview: "@Luis mira esto",
      createdAt: expect.any(String),
      readAt: null,
    });
    expect(Number.isNaN(Date.parse(forLuis[0]?.createdAt ?? ""))).toBe(false);

    expect(await list(ana)).toEqual([]);
  });

  it("ordena de la más nueva a la más antigua", async () => {
    await comment(ana, "@Luis primero");
    await new Promise((resolve) => setTimeout(resolve, 5));
    await comment(ana, "@Luis segundo");

    const [newest, older] = await list(luis);
    expect(newest?.commentPreview).toBe("@Luis segundo");
    expect(older?.commentPreview).toBe("@Luis primero");
  });

  it("la respuesta real pasa el schema, con las fechas", async () => {
    const response = await apiGet("/api/notifications", luis.cookie);
    expect(response.status).toBe(200);
    const json: unknown = await response.json();
    expect(notificationListResponseSchema.safeParse(json).success).toBe(true);
  });
});

describe("POST /api/notifications/:notificationId/read", () => {
  it("401 sin sesión", async () => {
    const response = await apiRequest("POST", "/api/notifications/cualquiera/read");
    expect(response.status).toBe(401);
  });

  it("Ana intentando marcar la de Luis es 404 y no la marca", async () => {
    await comment(ana, "@Luis no la marques tú");
    const [target] = await list(luis);
    if (target === undefined) throw new Error("Luis no tiene menciones");

    const response = await apiRequest("POST", `/api/notifications/${target.id}/read`, {
      cookie: ana.cookie,
    });
    expect(response.status).toBe(404);

    const after = (await list(luis)).find((item) => item.id === target.id);
    expect(after?.readAt).toBeNull();
  });

  it("un id que no existe es 404", async () => {
    const response = await apiRequest("POST", `/api/notifications/notification_nope/read`, {
      cookie: luis.cookie,
    });
    expect(response.status).toBe(404);
  });

  it("Luis la marca como leída: readAt queda relleno y se conserva", async () => {
    await comment(ana, "@Luis márcala");
    const [target] = await list(luis);
    if (target === undefined) throw new Error("Luis no tiene menciones");
    expect(target.readAt).toBeNull();

    const response = await apiRequest("POST", `/api/notifications/${target.id}/read`, {
      cookie: luis.cookie,
    });
    expect(response.status).toBe(200);
    const marked = notificationSchema.parse(await response.json());
    expect(marked.id).toBe(target.id);
    expect(marked.readAt).not.toBeNull();

    const listed = (await list(luis)).find((item) => item.id === target.id);
    expect(listed?.readAt).toBe(marked.readAt);

    const again = await apiRequest("POST", `/api/notifications/${target.id}/read`, {
      cookie: luis.cookie,
    });
    expect(again.status).toBe(200);
    expect(notificationSchema.parse(await again.json()).readAt).toBe(marked.readAt);
  });
});
