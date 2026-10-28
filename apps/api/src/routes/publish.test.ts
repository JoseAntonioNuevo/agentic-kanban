/**
 * Publicación desde las escrituras del tablero: cada escritura correcta
 * anuncia su evento después de persistir y antes de responder; un 4xx no
 * publica nada. La base es la temporal del setup; no usa `data/`.
 */
import { randomUUID } from "node:crypto";

import {
  boardEventSchema,
  boardResponseSchema,
  taskSchema,
  type BoardEvent,
} from "@agentic-kanban/schemas";
import { afterEach, beforeAll, describe, expect, it } from "vite-plus/test";

import { subscribe } from "../realtime/index.ts";
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

function email(label: string): string {
  return `s3-03-${label}-${randomUUID()}@example.com`;
}

type Session = { cookie: string; userId: string };

let ana: Session;
let luis: Session;
let stranger: Session;

beforeAll(async () => {
  ana = await signUpUser({ name: "Ana", email: email("ana") });
  luis = await signUpUser({ name: "Luis", email: email("luis") });
  stranger = await signUpUser({ name: "Ajeno", email: email("stranger") });
});

let unsubscribe: (() => void) | undefined;

afterEach(() => {
  unsubscribe?.();
  unsubscribe = undefined;
});

/** Project compartido por Ana y Luis con To Do y Done; To Do trae una tarea. */
async function makeBoard() {
  const workspaceId = `ws_pub_${randomUUID()}`;
  const projectId = `proj_pub_${randomUUID()}`;
  const todoId = `col_todo_${randomUUID()}`;
  const doneId = `col_done_${randomUUID()}`;
  const taskId = `task_${randomUUID()}`;

  await upsertWorkspace({ id: workspaceId, name: "Compartido" });
  await addWorkspaceMember({ workspaceId, userId: ana.userId });
  await addWorkspaceMember({ workspaceId, userId: luis.userId });
  await upsertProject({ id: projectId, workspaceId, name: "Tablero" });
  await upsertColumn({ id: todoId, workspaceId, projectId, name: "To Do", position: 0 });
  await upsertColumn({ id: doneId, workspaceId, projectId, name: "Done", position: 1 });
  await upsertTask({
    id: taskId,
    workspaceId,
    projectId,
    columnId: todoId,
    title: "Existente",
    description: "",
    position: 0,
  });

  return { projectId, todoId, doneId, taskId };
}

/**
 * Se suscribe al project. Cada evento se valida con `boardEventSchema` y,
 * en el mismo instante, lanza una lectura del tablero: si la escritura ya
 * está confirmada, esa lectura la ve.
 */
function listen(projectId: string) {
  const events: BoardEvent[] = [];
  const boardsAtEvent: Promise<Response>[] = [];
  unsubscribe = subscribe(projectId, (event) => {
    events.push(boardEventSchema.parse(event));
    boardsAtEvent.push(apiGet(`/api/projects/${projectId}/board`, ana.cookie));
  });
  return { events, boardsAtEvent };
}

async function taskIdsAt(board: Promise<Response> | undefined): Promise<string[]> {
  if (board === undefined) {
    throw new Error("No llegó ningún evento");
  }
  const parsed = boardResponseSchema.parse(await (await board).json());
  return parsed.columns.flatMap((item) => item.tasks.map((entry) => entry.id));
}

describe("publicación tras escribir", () => {
  it("POST tasks publica task.created con la tarea de la respuesta y el actor de la sesión", async () => {
    const board = await makeBoard();
    const { events, boardsAtEvent } = listen(board.projectId);

    const response = await apiRequest("POST", `/api/projects/${board.projectId}/tasks`, {
      cookie: luis.cookie,
      body: { columnId: board.todoId, title: "Nueva", description: "Desde Luis" },
    });
    expect(response.status).toBe(201);
    const saved = taskSchema.parse(await response.json());

    expect(events).toEqual([
      { type: "task.created", projectId: board.projectId, actorUserId: luis.userId, task: saved },
    ]);
    expect(await taskIdsAt(boardsAtEvent[0])).toContain(saved.id);
  });

  it("PATCH publica task.updated con la tarea guardada", async () => {
    const board = await makeBoard();
    const { events } = listen(board.projectId);

    const response = await apiRequest("PATCH", `/api/tasks/${board.taskId}`, {
      cookie: ana.cookie,
      body: { title: "Editada" },
    });
    expect(response.status).toBe(200);
    const saved = taskSchema.parse(await response.json());
    expect(saved.title).toBe("Editada");

    expect(events).toEqual([
      { type: "task.updated", projectId: board.projectId, actorUserId: ana.userId, task: saved },
    ]);
  });

  it("move publica task.moved con la columna y la posición de la fila, no del body", async () => {
    const board = await makeBoard();
    const { events } = listen(board.projectId);

    const response = await apiRequest("POST", `/api/tasks/${board.taskId}/move`, {
      cookie: luis.cookie,
      body: { columnId: board.doneId, position: 99 },
    });
    expect(response.status).toBe(200);
    const saved = taskSchema.parse(await response.json());
    expect(saved.columnId).toBe(board.doneId);
    expect(saved.position).toBe(0);

    expect(events).toEqual([
      {
        type: "task.moved",
        projectId: board.projectId,
        actorUserId: luis.userId,
        taskId: board.taskId,
        columnId: board.doneId,
        position: 0,
      },
    ]);
  });

  it("DELETE publica task.deleted con el projectId de la fila, ya borrada", async () => {
    const board = await makeBoard();
    const { events, boardsAtEvent } = listen(board.projectId);

    const response = await apiRequest("DELETE", `/api/tasks/${board.taskId}`, {
      cookie: ana.cookie,
    });
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");

    expect(events).toEqual([
      {
        type: "task.deleted",
        projectId: board.projectId,
        actorUserId: ana.userId,
        taskId: board.taskId,
      },
    ]);
    expect(await taskIdsAt(boardsAtEvent[0])).not.toContain(board.taskId);
  });

  it("un 404 de un usuario ajeno no publica nada", async () => {
    const board = await makeBoard();
    const { events } = listen(board.projectId);

    const created = await apiRequest("POST", `/api/projects/${board.projectId}/tasks`, {
      cookie: stranger.cookie,
      body: { columnId: board.todoId, title: "Intrusa" },
    });
    expect(created.status).toBe(404);

    const updated = await apiRequest("PATCH", `/api/tasks/${board.taskId}`, {
      cookie: stranger.cookie,
      body: { title: "No" },
    });
    expect(updated.status).toBe(404);

    const moved = await apiRequest("POST", `/api/tasks/${board.taskId}/move`, {
      cookie: stranger.cookie,
      body: { columnId: board.doneId, position: 0 },
    });
    expect(moved.status).toBe(404);

    const deleted = await apiRequest("DELETE", `/api/tasks/${board.taskId}`, {
      cookie: stranger.cookie,
    });
    expect(deleted.status).toBe(404);

    expect(events).toEqual([]);
  });

  it("un 400 por body inválido no publica nada", async () => {
    const board = await makeBoard();
    const { events } = listen(board.projectId);

    const created = await apiRequest("POST", `/api/projects/${board.projectId}/tasks`, {
      cookie: ana.cookie,
      body: { columnId: board.todoId, title: "" },
    });
    expect(created.status).toBe(400);

    const updated = await apiRequest("PATCH", `/api/tasks/${board.taskId}`, {
      cookie: ana.cookie,
      body: {},
    });
    expect(updated.status).toBe(400);

    const moved = await apiRequest("POST", `/api/tasks/${board.taskId}/move`, {
      cookie: ana.cookie,
      body: { columnId: board.doneId, position: -1 },
    });
    expect(moved.status).toBe(400);

    expect(events).toEqual([]);
  });
});
