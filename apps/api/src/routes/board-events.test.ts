/**
 * Tests de la publicación de eventos desde las escrituras del tablero: cada
 * escritura correcta (`POST`, `PATCH`, `DELETE`, `move`) publica exactamente un
 * evento válido para `boardEventSchema` en el hub de su project, con
 * `actorUserId` de la sesión. Las escrituras con 404 (usuario ajeno) o 400
 * (input inválido) no publican nada.
 */
import { boardEventSchema, taskSchema, type BoardEvent } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { subscribe } from "../realtime/index.ts";
import {
  createBoardFixture,
  createWorkspaceFixture,
  requestAs,
  signUpUser,
} from "../test/helpers.ts";

const JSON_HEADERS = { "content-type": "application/json" };

/** Ana (miembro) y Luis (ajeno) con un tablero de dos columnas en el project de Ana. */
async function setup() {
  const ana = await signUpUser();
  const luis = await signUpUser();
  const workspace = await createWorkspaceFixture({
    name: "Ana",
    memberUserIds: [ana.userId],
    projects: ["Tablero Ana"],
  });
  const projectId = workspace.projectIds[0] ?? "";
  const board = await createBoardFixture({
    workspaceId: workspace.workspaceId,
    projectId,
    columns: [{ name: "Por hacer", tasks: ["A0", "A1", "A2"] }, { name: "En curso" }],
  });

  return {
    ana,
    luis,
    projectId,
    todoId: board.columnIds[0] ?? "",
    doingId: board.columnIds[1] ?? "",
    taskIds: board.taskIds[0] ?? [],
  };
}

/** Ejecuta `write` con un suscriptor al hub del project y devuelve la respuesta y los eventos. */
async function withEvents(projectId: string, write: () => Response | Promise<Response>) {
  const events: BoardEvent[] = [];
  const unsubscribe = subscribe(projectId, (event) => events.push(event));

  try {
    const response = await write();

    return { response, events };
  } finally {
    unsubscribe();
  }
}

function json(method: string, body: unknown): RequestInit {
  return { method, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

describe("eventos de las escrituras del tablero", () => {
  it("POST tasks publica task.created con la misma tarea que responde", async () => {
    const { ana, projectId, todoId } = await setup();

    const { response, events } = await withEvents(projectId, () =>
      requestAs(
        ana.cookie,
        `/api/projects/${projectId}/tasks`,
        json("POST", { columnId: todoId, title: "Nueva" }),
      ),
    );

    expect(response.status).toBe(201);
    const task = taskSchema.parse(await response.json());
    expect(events).toHaveLength(1);
    const event = boardEventSchema.parse(events[0]);
    expect(event).toEqual({
      type: "task.created",
      projectId,
      actorUserId: ana.userId,
      task,
    });
  });

  it("PATCH task publica task.updated con la tarea guardada", async () => {
    const { ana, projectId, taskIds } = await setup();

    const { response, events } = await withEvents(projectId, () =>
      requestAs(ana.cookie, `/api/tasks/${taskIds[0]}`, json("PATCH", { title: "Editada" })),
    );

    expect(response.status).toBe(200);
    const task = taskSchema.parse(await response.json());
    expect(events).toHaveLength(1);
    const event = boardEventSchema.parse(events[0]);
    expect(event).toEqual({
      type: "task.updated",
      projectId,
      actorUserId: ana.userId,
      task,
    });
    expect(task.title).toBe("Editada");
  });

  it("DELETE task publica task.deleted con el taskId", async () => {
    const { ana, projectId, taskIds } = await setup();

    const { response, events } = await withEvents(projectId, () =>
      requestAs(ana.cookie, `/api/tasks/${taskIds[1]}`, { method: "DELETE" }),
    );

    expect(response.status).toBe(204);
    expect(events).toHaveLength(1);
    const event = boardEventSchema.parse(events[0]);
    expect(event).toEqual({
      type: "task.deleted",
      projectId,
      actorUserId: ana.userId,
      taskId: taskIds[1],
    });
  });

  it("move publica task.moved con la columna y posición finales", async () => {
    const { ana, projectId, doingId, taskIds } = await setup();

    // Posición 99 se acota a 0 en la columna vacía: el evento lleva el valor final.
    const { response, events } = await withEvents(projectId, () =>
      requestAs(
        ana.cookie,
        `/api/tasks/${taskIds[0]}/move`,
        json("POST", { columnId: doingId, position: 99 }),
      ),
    );

    expect(response.status).toBe(200);
    const task = taskSchema.parse(await response.json());
    expect(events).toHaveLength(1);
    const event = boardEventSchema.parse(events[0]);
    expect(event).toEqual({
      type: "task.moved",
      projectId,
      actorUserId: ana.userId,
      taskId: taskIds[0],
      columnId: task.columnId,
      position: task.position,
    });
    expect(task.columnId).toBe(doingId);
    expect(task.position).toBe(0);
  });

  it("un usuario ajeno recibe 404 y no se publica nada", async () => {
    const { luis, projectId, todoId, doingId, taskIds } = await setup();

    const writes = [
      () =>
        requestAs(
          luis.cookie,
          `/api/projects/${projectId}/tasks`,
          json("POST", { columnId: todoId, title: "Intrusa" }),
        ),
      () => requestAs(luis.cookie, `/api/tasks/${taskIds[0]}`, json("PATCH", { title: "X" })),
      () => requestAs(luis.cookie, `/api/tasks/${taskIds[0]}`, { method: "DELETE" }),
      () =>
        requestAs(
          luis.cookie,
          `/api/tasks/${taskIds[0]}/move`,
          json("POST", { columnId: doingId, position: 0 }),
        ),
    ];

    for (const write of writes) {
      const { response, events } = await withEvents(projectId, write);

      expect(response.status).toBe(404);
      expect(events).toHaveLength(0);
    }
  });

  it("el input inválido recibe 400 y no se publica nada", async () => {
    const { ana, projectId, todoId, taskIds } = await setup();

    const writes = [
      () =>
        requestAs(
          ana.cookie,
          `/api/projects/${projectId}/tasks`,
          json("POST", { columnId: todoId, title: "" }),
        ),
      () => requestAs(ana.cookie, `/api/tasks/${taskIds[0]}`, json("PATCH", { title: "" })),
      () =>
        requestAs(
          ana.cookie,
          `/api/tasks/${taskIds[0]}/move`,
          json("POST", { columnId: todoId, position: -1 }),
        ),
    ];

    for (const write of writes) {
      const { response, events } = await withEvents(projectId, write);

      expect(response.status).toBe(400);
      expect(events).toHaveLength(0);
    }
  });
});
