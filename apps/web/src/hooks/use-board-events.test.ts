/**
 * Canal del tablero sin navegador: `WebSocket` y `location` se sustituyen y
 * la caché es un `QueryClient` real.
 */
import type { BoardEvent, BoardResponse } from "@agentic-kanban/schemas";
import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { boardQueryKey } from "./use-board.ts";
import {
  boardEventsUrl,
  connectBoardEvents,
  handleBoardEvent,
  parseBoardEvent,
} from "./use-board-events.ts";

const projectId = "proj_agentic_kanban";
const ana = "user_ana";
const luis = "user_luis";
const createdAt = "2026-10-28T18:30:00.000Z";

function task(id: string, position: number) {
  return {
    id,
    projectId,
    columnId: "col_kanban_todo",
    title: id,
    description: "",
    position,
    createdAt,
  };
}

function sampleBoard(): BoardResponse {
  return {
    project: { id: projectId, workspaceId: "ws_thepower_demo", name: "Agentic Kanban", createdAt },
    columns: [
      {
        id: "col_kanban_todo",
        projectId,
        name: "To Do",
        position: 0,
        createdAt,
        tasks: [task("task_kanban_1", 0), task("task_kanban_2", 1)],
      },
    ],
  };
}

const deletedByAna: BoardEvent = {
  type: "task.deleted",
  projectId,
  actorUserId: ana,
  taskId: "task_kanban_1",
};

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((message: { data: unknown }) => void) | null = null;
  closed = false;
  readonly send = vi.fn();
  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  close() {
    this.closed = true;
  }
}

let queryClient: QueryClient;

function taskIds(userId: string) {
  return queryClient
    .getQueryData<BoardResponse>(boardQueryKey(projectId, userId))
    ?.columns[0]?.tasks.map((item) => item.id);
}

beforeEach(() => {
  queryClient = new QueryClient();
  queryClient.setQueryData(boardQueryKey(projectId, luis), sampleBoard());
  queryClient.setQueryData(boardQueryKey(projectId, ana), sampleBoard());
  FakeWebSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.stubGlobal("location", { protocol: "http:", host: "localhost:5173" });
});

afterEach(() => {
  queryClient.clear();
  vi.unstubAllGlobals();
});

describe("boardEventsUrl", () => {
  it("usa ws: o wss: según el protocolo y el host de la página", () => {
    expect(boardEventsUrl("proj agentic")).toBe(
      "ws://localhost:5173/api/projects/proj%20agentic/events",
    );

    vi.stubGlobal("location", { protocol: "https:", host: "kanban.example" });
    expect(boardEventsUrl(projectId)).toBe(
      "wss://kanban.example/api/projects/proj_agentic_kanban/events",
    );
  });
});

describe("parseBoardEvent", () => {
  it("devuelve el evento válido", () => {
    expect(parseBoardEvent(JSON.stringify(deletedByAna))).toEqual(deletedByAna);
  });

  it("ignora JSON roto, formas inválidas y mensajes que no son texto", () => {
    expect(parseBoardEvent("{")).toBeUndefined();
    expect(parseBoardEvent(JSON.stringify({ type: "task.deleted", projectId }))).toBeUndefined();
    expect(parseBoardEvent(new ArrayBuffer(4))).toBeUndefined();
  });
});

describe("connectBoardEvents", () => {
  it("abre un socket, invalida al abrir, aplica eventos y cierra en el cleanup", () => {
    const close = connectBoardEvents({ queryClient, projectId, userId: luis });

    expect(FakeWebSocket.instances).toHaveLength(1);
    const socket = FakeWebSocket.instances[0];
    expect(socket?.url).toBe("ws://localhost:5173/api/projects/proj_agentic_kanban/events");

    socket?.onopen?.();
    expect(queryClient.getQueryState(boardQueryKey(projectId, luis))?.isInvalidated).toBe(true);

    socket?.onmessage?.({ data: "no es json" });
    socket?.onmessage?.({ data: JSON.stringify({ ...deletedByAna, projectId: "proj_ana_notes" }) });
    expect(taskIds(luis)).toEqual(["task_kanban_1", "task_kanban_2"]);

    socket?.onmessage?.({ data: JSON.stringify(deletedByAna) });
    expect(taskIds(luis)).toEqual(["task_kanban_2"]);
    expect(taskIds(ana)).toEqual(["task_kanban_1", "task_kanban_2"]);

    close();
    expect(socket?.closed).toBe(true);
    expect(socket?.onmessage).toBeNull();
    expect(socket?.send).not.toHaveBeenCalled();
    expect(FakeWebSocket.instances).toHaveLength(1);
  });
});

describe("handleBoardEvent", () => {
  it("ignora un evento propio mientras hay una mutation del tablero en curso", async () => {
    const pending = new MutationObserver(queryClient, {
      mutationKey: ["board", projectId, "move"],
      mutationFn: () => new Promise<never>(() => {}),
    });
    void pending.mutate();
    await vi.waitFor(() => {
      expect(queryClient.isMutating({ mutationKey: ["board", projectId] })).toBe(1);
    });

    handleBoardEvent({ queryClient, projectId, userId: ana }, deletedByAna);
    expect(taskIds(ana)).toEqual(["task_kanban_1", "task_kanban_2"]);

    // El mismo evento sí llega a otro usuario.
    handleBoardEvent({ queryClient, projectId, userId: luis }, deletedByAna);
    expect(taskIds(luis)).toEqual(["task_kanban_2"]);
  });

  it("aplica un evento propio sin mutation en curso (otra pestaña)", () => {
    handleBoardEvent({ queryClient, projectId, userId: ana }, deletedByAna);
    expect(taskIds(ana)).toEqual(["task_kanban_2"]);
  });

  it("invalida además si el board se está recargando", async () => {
    const queryKey = boardQueryKey(projectId, luis);
    // `clear()` cancela esta recarga al terminar el test; el rechazo se descarta.
    queryClient
      .fetchQuery({ queryKey, queryFn: () => new Promise<never>(() => {}) })
      .catch(() => undefined);
    await vi.waitFor(() => {
      expect(queryClient.isFetching({ queryKey })).toBe(1);
    });

    handleBoardEvent({ queryClient, projectId, userId: luis }, deletedByAna);

    expect(taskIds(luis)).toEqual(["task_kanban_2"]);
    expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });

  it("no invalida si no hay recarga en curso", () => {
    handleBoardEvent({ queryClient, projectId, userId: luis }, deletedByAna);
    expect(queryClient.getQueryState(boardQueryKey(projectId, luis))?.isInvalidated).toBe(false);
  });
});
