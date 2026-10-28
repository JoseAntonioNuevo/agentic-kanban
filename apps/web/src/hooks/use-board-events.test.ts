/**
 * Canal del tablero sin navegador: `WebSocket` y `location` se sustituyen y
 * la caché es un `QueryClient` real.
 */
import type { BoardEvent, BoardResponse } from "@agentic-kanban/schemas";
import { MutationObserver, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { boardQueryKey } from "./use-board.ts";
import {
  boardEventsUrl,
  connectBoardEvents,
  handleBoardEvent,
  parseBoardEvent,
} from "./use-board-events.ts";

vi.mock("sonner", () => ({
  toast: { info: vi.fn(), error: vi.fn(), success: vi.fn(), warning: vi.fn() },
}));

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
  onclose: (() => void) | null = null;
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
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  for (const fn of [toast.info, toast.error, toast.success, toast.warning]) {
    vi.mocked(fn).mockClear();
  }
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

describe("reconexión", () => {
  it("reabre con reconnectDelay tras un cierre ajeno y vuelve a 0 al abrir", () => {
    const close = connectBoardEvents({ queryClient, projectId, userId: luis });
    const sockets = FakeWebSocket.instances;

    sockets[0]?.onclose?.();
    vi.advanceTimersByTime(999);
    expect(sockets).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(sockets).toHaveLength(2);

    sockets[1]?.onclose?.();
    vi.advanceTimersByTime(2000);
    expect(sockets).toHaveLength(3);

    sockets[2]?.onclose?.();
    vi.advanceTimersByTime(5000);
    expect(sockets).toHaveLength(4);

    sockets[3]?.onclose?.();
    vi.advanceTimersByTime(10_000);
    expect(sockets).toHaveLength(5);

    sockets[4]?.onopen?.();
    sockets[4]?.onclose?.();
    vi.advanceTimersByTime(1000);
    expect(sockets).toHaveLength(6);

    close();
  });

  it("el cleanup cancela el reintento pendiente y no deja timers ni sockets", () => {
    const close = connectBoardEvents({ queryClient, projectId, userId: luis });
    FakeWebSocket.instances[0]?.onclose?.();
    expect(vi.getTimerCount()).toBe(1);

    close();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(FakeWebSocket.instances).toHaveLength(1);
  });

  it("cerrar el primer canal no programa reintento ni pisa al segundo (StrictMode)", () => {
    const closeFirst = connectBoardEvents({ queryClient, projectId, userId: luis });
    const first = FakeWebSocket.instances[0];
    const onclose = first?.onclose;
    closeFirst();
    const closeSecond = connectBoardEvents({ queryClient, projectId, userId: luis });

    // Aunque el navegador dispare close del primero después del cleanup.
    onclose?.();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(60_000);
    expect(FakeWebSocket.instances).toHaveLength(2);
    expect(FakeWebSocket.instances[1]?.closed).toBe(false);

    closeSecond();
  });
});

describe("avisos de cambios ajenos", () => {
  const movedByAna: BoardEvent = {
    type: "task.moved",
    projectId,
    actorUserId: ana,
    taskId: "task_kanban_1",
    columnId: "col_kanban_todo",
    position: 1,
  };

  it("avisa al otro usuario con el título de la caché", () => {
    handleBoardEvent({ queryClient, projectId, userId: luis }, movedByAna);
    expect(toast.info).toHaveBeenCalledWith("Tarea movida: task_kanban_1");

    handleBoardEvent({ queryClient, projectId, userId: luis }, deletedByAna);
    expect(toast.error).toHaveBeenLastCalledWith("Tarea eliminada: task_kanban_1");
  });

  it("usa verde al crear, amarillo al editar y rojo al borrar", () => {
    const newTask = { ...task("task_new", 2), title: "Nueva" };
    handleBoardEvent(
      { queryClient, projectId, userId: luis },
      { type: "task.created", projectId, actorUserId: ana, task: newTask },
    );
    expect(toast.success).toHaveBeenCalledWith("Nueva tarea: Nueva");

    handleBoardEvent(
      { queryClient, projectId, userId: luis },
      { type: "task.updated", projectId, actorUserId: ana, task: { ...newTask, title: "Editada" } },
    );
    expect(toast.warning).toHaveBeenCalledWith("Tarea actualizada: Editada");
  });

  it("no avisa al autor, ni con otra pestaña ni con mutation en curso", () => {
    handleBoardEvent({ queryClient, projectId, userId: ana }, movedByAna);
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("no avisa de otro proyecto", () => {
    handleBoardEvent(
      { queryClient, projectId, userId: luis },
      { ...movedByAna, projectId: "proj_ana_notes" },
    );
    expect(toast.info).not.toHaveBeenCalled();
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
