/**
 * Tests de `/api/notifications`: Luis ve la mención de Ana (la respuesta pasa
 * `notificationListResponseSchema`, fechas incluidas), Ana no ve la suya,
 * marcar como leída es idempotente, 404 (nunca 403) para otro usuario o id
 * inexistente y 401 sin sesión.
 */
import {
  errorResponseSchema,
  notificationListResponseSchema,
  notificationSchema,
} from "@agentic-kanban/schemas";
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import {
  createBoardFixture,
  createWorkspaceFixture,
  requestAs,
  signUpUser,
} from "../test/helpers.ts";
import type { SignedUpUser } from "../test/helpers.ts";

const TASK_TITLE = "Tarea compartida";

let ana: SignedUpUser;
let luis: SignedUpUser;
let notificationId = "";

function getNotifications(cookie: string | null) {
  return requestAs(cookie, "/api/notifications");
}

function markRead(cookie: string | null, id: string) {
  return requestAs(cookie, `/api/notifications/${id}/read`, { method: "POST" });
}

beforeAll(async () => {
  ana = await signUpUser({ name: "Ana", email: `ana-${randomUUID()}@demo.test` });
  luis = await signUpUser({ name: "Luis", email: `luis-${randomUUID()}@demo.test` });

  const { workspaceId, projectIds } = await createWorkspaceFixture({
    name: "Compartido",
    memberUserIds: [ana.userId, luis.userId],
    projects: ["Tablero"],
  });
  const { taskIds } = await createBoardFixture({
    workspaceId,
    projectId: projectIds[0] ?? "",
    columns: [{ name: "Pendiente", tasks: [TASK_TITLE] }],
  });
  const taskId = taskIds[0]?.[0] ?? "";

  // La mención real: Ana comenta por HTTP y se crea la notificación de Luis.
  const comment = await requestAs(ana.cookie, `/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body: "@Luis mira esto" }),
  });

  expect(comment.status).toBe(201);
});

describe("GET /api/notifications", () => {
  it("devuelve 401 sin sesión", async () => {
    expect((await getNotifications(null)).status).toBe(401);
  });

  it("Luis ve la mención de Ana con el contrato completo", async () => {
    const response = await getNotifications(luis.cookie);

    expect(response.status).toBe(200);

    const list = notificationListResponseSchema.parse(await response.json());

    expect(list).toHaveLength(1);

    const [item] = list;

    expect(item?.kind).toBe("mention");
    expect(item?.actorName).toBe("Ana");
    expect(item?.taskTitle).toBe(TASK_TITLE);
    expect(item?.commentPreview).toBe("@Luis mira esto");
    expect(item?.readAt).toBeNull();

    notificationId = item?.id ?? "";
  });

  it("Ana no ve en su campana la mención que escribió", async () => {
    const response = await getNotifications(ana.cookie);

    expect(response.status).toBe(200);
    expect(notificationListResponseSchema.parse(await response.json())).toEqual([]);
  });
});

describe("POST /api/notifications/:notificationId/read", () => {
  it("devuelve 401 sin sesión", async () => {
    expect((await markRead(null, notificationId)).status).toBe(401);
  });

  it("Ana no puede marcar la de Luis: 404 y sigue sin leer", async () => {
    const response = await markRead(ana.cookie, notificationId);

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json())).toEqual({ error: "No encontrado" });

    const list = notificationListResponseSchema.parse(
      await (await getNotifications(luis.cookie)).json(),
    );

    expect(list[0]?.readAt).toBeNull();
  });

  it("devuelve 404 con un id inexistente", async () => {
    const response = await markRead(luis.cookie, randomUUID());

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json())).toEqual({ error: "No encontrado" });
  });

  it("Luis la marca como leída y repetir es idempotente", async () => {
    const first = await markRead(luis.cookie, notificationId);

    expect(first.status).toBe(200);

    const readOnce = notificationSchema.parse(await first.json());

    expect(readOnce.id).toBe(notificationId);
    expect(readOnce.readAt).not.toBeNull();

    const second = await markRead(luis.cookie, notificationId);

    expect(second.status).toBe(200);
    expect(notificationSchema.parse(await second.json()).readAt).toBe(readOnce.readAt);

    const list = notificationListResponseSchema.parse(
      await (await getNotifications(luis.cookie)).json(),
    );

    expect(list[0]?.readAt).toBe(readOnce.readAt);
  });
});
