/**
 * Canal WebSocket del tablero: la cadena 401/404/426 antes del upgrade y
 * los manejadores con un socket falso. La base es la temporal del setup;
 * no usa `data/`.
 */
import { randomUUID } from "node:crypto";

import type { BoardEvent } from "@agentic-kanban/schemas";
import { WSContext } from "hono/ws";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";

import { app } from "../index.ts";
import { publish } from "../realtime/index.ts";
import { addWorkspaceMember, signUpUser, upsertProject, upsertWorkspace } from "../test/helpers.ts";
import { boardSocketEvents } from "./events.ts";

function email(label: string): string {
  return `s3-02-${label}-${randomUUID()}@example.com`;
}

type Session = { cookie: string; userId: string };

let ana: Session;
let luis: Session;
let sharedProjectId: string;
let anaNotesId: string;

beforeAll(async () => {
  ana = await signUpUser({ name: "Ana", email: email("ana") });
  luis = await signUpUser({ name: "Luis", email: email("luis") });

  const sharedWorkspaceId = `ws_shared_${randomUUID()}`;
  const anaWorkspaceId = `ws_ana_${randomUUID()}`;
  sharedProjectId = `proj_shared_${randomUUID()}`;
  anaNotesId = `proj_ana_notes_${randomUUID()}`;

  await upsertWorkspace({ id: sharedWorkspaceId, name: "Compartido" });
  await upsertWorkspace({ id: anaWorkspaceId, name: "Espacio de Ana" });
  await addWorkspaceMember({ workspaceId: sharedWorkspaceId, userId: ana.userId });
  await addWorkspaceMember({ workspaceId: sharedWorkspaceId, userId: luis.userId });
  await addWorkspaceMember({ workspaceId: anaWorkspaceId, userId: ana.userId });
  await upsertProject({ id: sharedProjectId, workspaceId: sharedWorkspaceId, name: "Tablero" });
  await upsertProject({ id: anaNotesId, workspaceId: anaWorkspaceId, name: "Notas de Ana" });
});

function openChannel(
  projectId: string,
  { cookie, upgrade }: { cookie?: string; upgrade?: string } = {},
) {
  const serverUpgrade = vi.fn(() => true);
  const headers = new Headers();
  if (cookie !== undefined) {
    headers.set("cookie", cookie);
  }
  if (upgrade !== undefined) {
    headers.set("upgrade", upgrade);
  }

  const response = app.request(
    `/api/projects/${projectId}/events`,
    { method: "GET", headers },
    { server: { upgrade: serverUpgrade } },
  );

  return { response, serverUpgrade };
}

function fakeSocket() {
  const send = vi.fn();
  const ws = new WSContext({ send, close: () => {}, readyState: 1 });
  return { send, ws };
}

function deletedEvent(projectId: string): BoardEvent {
  return { type: "task.deleted", projectId, actorUserId: "user_1", taskId: "task_1" };
}

describe("ruta del canal", () => {
  it("responde 401 sin cookie y no hace upgrade", async () => {
    const { response, serverUpgrade } = openChannel(sharedProjectId, { upgrade: "websocket" });

    const result = await response;
    expect(result.status).toBe(401);
    expect(await result.json()).toEqual({ error: "Unauthorized" });
    expect(serverUpgrade).not.toHaveBeenCalled();
  });

  it("responde 404 a Luis en el project privado de Ana y no hace upgrade", async () => {
    const { response, serverUpgrade } = openChannel(anaNotesId, {
      cookie: luis.cookie,
      upgrade: "websocket",
    });

    const result = await response;
    expect(result.status).toBe(404);
    expect(await result.json()).toEqual({ error: "Not found" });
    expect(serverUpgrade).not.toHaveBeenCalled();
  });

  it("responde 404 en un project inexistente y no hace upgrade", async () => {
    const { response, serverUpgrade } = openChannel(`proj_missing_${randomUUID()}`, {
      cookie: ana.cookie,
      upgrade: "websocket",
    });

    const result = await response;
    expect(result.status).toBe(404);
    expect(serverUpgrade).not.toHaveBeenCalled();
  });

  it("responde 426 a Ana sin Upgrade y no hace upgrade", async () => {
    const { response, serverUpgrade } = openChannel(sharedProjectId, { cookie: ana.cookie });

    const result = await response;
    expect(result.status).toBe(426);
    expect(serverUpgrade).not.toHaveBeenCalled();
  });

  it("hace exactamente un upgrade para Ana con Upgrade: WebSocket", async () => {
    const { response, serverUpgrade } = openChannel(sharedProjectId, {
      cookie: ana.cookie,
      upgrade: "WebSocket",
    });

    await response;
    expect(serverUpgrade).toHaveBeenCalledTimes(1);
  });
});

describe("manejadores del socket", () => {
  it("tras onOpen recibe los eventos de su project y no los de otro", () => {
    const projectId = `proj_socket_${randomUUID()}`;
    const events = boardSocketEvents(projectId);
    const { send, ws } = fakeSocket();

    events.onOpen?.(new Event("open"), ws);
    const own = deletedEvent(projectId);
    publish(own);
    publish(deletedEvent(`proj_other_${randomUUID()}`));

    expect(send).toHaveBeenCalledTimes(1);
    expect(send).toHaveBeenCalledWith(JSON.stringify(own), {});

    events.onClose?.(new CloseEvent("close"), ws);
  });

  it("tras onClose deja de recibir", () => {
    const projectId = `proj_socket_${randomUUID()}`;
    const events = boardSocketEvents(projectId);
    const { send, ws } = fakeSocket();

    events.onOpen?.(new Event("open"), ws);
    events.onClose?.(new CloseEvent("close"), ws);
    publish(deletedEvent(projectId));

    expect(send).not.toHaveBeenCalled();
  });
});
