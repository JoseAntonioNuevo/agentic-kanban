/**
 * Tablero y CRUD de tareas. La base es la temporal del setup; no usa `data/`.
 */
import { randomUUID } from "node:crypto";

import { boardResponseSchema, taskSchema } from "@agentic-kanban/schemas";
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

function email(label: string): string {
  return `s2-03-${label}-${randomUUID()}@example.com`;
}

type Session = { cookie: string; userId: string };

let owner: Session;
let stranger: Session;
let both: Session;

beforeAll(async () => {
  owner = await signUpUser({ name: "Dueño", email: email("owner") });
  stranger = await signUpUser({ name: "Ajeno", email: email("stranger") });
  both = await signUpUser({ name: "Ambos", email: email("both") });
});

async function makeProject(userId: string, prefix: string) {
  const workspaceId = `ws_${prefix}_${randomUUID()}`;
  const projectId = `proj_${prefix}_${randomUUID()}`;
  await upsertWorkspace({ id: workspaceId, name: `Espacio ${prefix}` });
  await addWorkspaceMember({ workspaceId, userId });
  await upsertProject({ id: projectId, workspaceId, name: `Tablero ${prefix}` });
  return { workspaceId, projectId };
}

describe("tablero y tareas", () => {
  it("responde 401 sin cookie en las cuatro rutas", async () => {
    const board = await apiGet("/api/projects/proj_missing/board");
    expect(board.status).toBe(401);
    expect(await board.json()).toEqual({ error: "Unauthorized" });

    const created = await apiRequest("POST", "/api/projects/proj_missing/tasks", {
      body: { columnId: "col_missing", title: "Nueva" },
    });
    expect(created.status).toBe(401);
    expect(await created.json()).toEqual({ error: "Unauthorized" });

    const updated = await apiRequest("PATCH", "/api/tasks/task_missing", {
      body: { title: "Editada" },
    });
    expect(updated.status).toBe(401);
    expect(await updated.json()).toEqual({ error: "Unauthorized" });

    const deleted = await apiRequest("DELETE", "/api/tasks/task_missing");
    expect(deleted.status).toBe(401);
    expect(await deleted.json()).toEqual({ error: "Unauthorized" });
  });

  it("responde 404 al pedir el board de un project ajeno o inexistente", async () => {
    const own = await makeProject(owner.userId, "board");

    const hidden = await apiGet(`/api/projects/${own.projectId}/board`, stranger.cookie);
    expect(hidden.status).toBe(404);
    expect(await hidden.json()).toEqual({ error: "Not found" });

    const missing = await apiGet(`/api/projects/proj_missing_${randomUUID()}/board`, owner.cookie);
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: "Not found" });
  });

  it("responde 404 al editar o borrar una tarea de un project ajeno", async () => {
    const own = await makeProject(owner.userId, "task");
    const columnId = `col_${randomUUID()}`;
    const taskId = `task_${randomUUID()}`;
    await upsertColumn({
      id: columnId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      name: "To Do",
      position: 0,
    });
    await upsertTask({
      id: taskId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      columnId,
      title: "Ajena",
      description: "",
      position: 0,
    });

    const updated = await apiRequest("PATCH", `/api/tasks/${taskId}`, {
      cookie: stranger.cookie,
      body: { title: "No" },
    });
    expect(updated.status).toBe(404);
    expect(await updated.json()).toEqual({ error: "Not found" });

    const deleted = await apiRequest("DELETE", `/api/tasks/${taskId}`, {
      cookie: stranger.cookie,
    });
    expect(deleted.status).toBe(404);
    expect(await deleted.json()).toEqual({ error: "Not found" });

    const stillThere = await apiGet(`/api/projects/${own.projectId}/board`, owner.cookie);
    const board = boardResponseSchema.parse(await stillThere.json());
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual([taskId]);
  });

  it("responde 404 al crear con un columnId de otro project, aunque el usuario sea miembro de ambos", async () => {
    const left = await makeProject(both.userId, "left");
    const right = await makeProject(both.userId, "right");
    const foreignColumnId = `col_${randomUUID()}`;
    await upsertColumn({
      id: foreignColumnId,
      workspaceId: right.workspaceId,
      projectId: right.projectId,
      name: "To Do",
      position: 0,
    });

    const created = await apiRequest("POST", `/api/projects/${left.projectId}/tasks`, {
      cookie: both.cookie,
      body: { columnId: foreignColumnId, title: "Cruce" },
    });
    expect(created.status).toBe(404);
    expect(await created.json()).toEqual({ error: "Not found" });
  });

  it("responde 400 con un título vacío y con un PATCH sin campos", async () => {
    const own = await makeProject(owner.userId, "invalid");
    const columnId = `col_${randomUUID()}`;
    const taskId = `task_${randomUUID()}`;
    await upsertColumn({
      id: columnId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      name: "To Do",
      position: 0,
    });
    await upsertTask({
      id: taskId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      columnId,
      title: "Queda",
      description: "",
      position: 0,
    });

    const empty = await apiRequest("POST", `/api/projects/${own.projectId}/tasks`, {
      cookie: owner.cookie,
      body: { columnId, title: "" },
    });
    expect(empty.status).toBe(400);

    const blank = await apiRequest("POST", `/api/projects/${own.projectId}/tasks`, {
      cookie: owner.cookie,
      body: { columnId, title: "   " },
    });
    expect(blank.status).toBe(400);

    const untouched = await apiRequest("PATCH", `/api/tasks/${taskId}`, {
      cookie: owner.cookie,
      body: {},
    });
    expect(untouched.status).toBe(400);
  });

  it("devuelve el tablero ordenado por position", async () => {
    const own = await makeProject(owner.userId, "order");
    const laterId = `col_later_${randomUUID()}`;
    const firstId = `col_first_${randomUUID()}`;
    const secondTaskId = `task_b_${randomUUID()}`;
    const firstTaskId = `task_a_${randomUUID()}`;

    await upsertColumn({
      id: laterId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      name: "Done",
      position: 1,
    });
    await upsertColumn({
      id: firstId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      name: "To Do",
      position: 0,
    });
    await upsertTask({
      id: secondTaskId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      columnId: firstId,
      title: "Segunda",
      description: "",
      position: 1,
    });
    await upsertTask({
      id: firstTaskId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      columnId: firstId,
      title: "Primera",
      description: "nota",
      position: 0,
    });

    const response = await apiGet(`/api/projects/${own.projectId}/board`, owner.cookie);
    expect(response.status).toBe(200);
    const board = boardResponseSchema.parse(await response.json());
    expect(board.project.id).toBe(own.projectId);
    expect(board.columns.map((item) => item.position)).toEqual([0, 1]);
    expect(board.columns.map((item) => item.name)).toEqual(["To Do", "Done"]);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual([firstTaskId, secondTaskId]);
    expect(board.columns[0]?.tasks.map((item) => item.position)).toEqual([0, 1]);
    expect(board.columns[1]?.tasks).toEqual([]);
  });

  it("crea, edita y borra, y compacta las posiciones de la columna", async () => {
    const own = await makeProject(owner.userId, "crud");
    const columnId = `col_${randomUUID()}`;
    const keepId = `task_keep_${randomUUID()}`;
    const dropId = `task_drop_${randomUUID()}`;
    await upsertColumn({
      id: columnId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      name: "To Do",
      position: 0,
    });
    await upsertTask({
      id: dropId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      columnId,
      title: "Se borra",
      description: "",
      position: 0,
    });
    await upsertTask({
      id: keepId,
      workspaceId: own.workspaceId,
      projectId: own.projectId,
      columnId,
      title: "Se queda",
      description: "",
      position: 1,
    });

    const created = await apiRequest("POST", `/api/projects/${own.projectId}/tasks`, {
      cookie: owner.cookie,
      body: { columnId, title: "  Nueva  ", description: "detalle" },
    });
    expect(created.status).toBe(201);
    const createdTask = taskSchema.parse(await created.json());
    expect(createdTask.title).toBe("Nueva");
    expect(createdTask.description).toBe("detalle");
    expect(createdTask.position).toBe(2);
    expect(createdTask.columnId).toBe(columnId);
    expect(createdTask.projectId).toBe(own.projectId);

    const updated = await apiRequest("PATCH", `/api/tasks/${createdTask.id}`, {
      cookie: owner.cookie,
      body: { title: "Editada" },
    });
    expect(updated.status).toBe(200);
    const updatedTask = taskSchema.parse(await updated.json());
    expect(updatedTask.title).toBe("Editada");
    expect(updatedTask.description).toBe("detalle");
    expect(updatedTask.position).toBe(2);

    const afterEdit = await apiGet(`/api/projects/${own.projectId}/board`, owner.cookie);
    const editedBoard = boardResponseSchema.parse(await afterEdit.json());
    expect(editedBoard.columns[0]?.tasks.map((item) => item.title)).toEqual([
      "Se borra",
      "Se queda",
      "Editada",
    ]);

    const deleted = await apiRequest("DELETE", `/api/tasks/${dropId}`, { cookie: owner.cookie });
    expect(deleted.status).toBe(204);
    expect(await deleted.text()).toBe("");

    const afterDelete = await apiGet(`/api/projects/${own.projectId}/board`, owner.cookie);
    const board = boardResponseSchema.parse(await afterDelete.json());
    const tasks = board.columns[0]?.tasks ?? [];
    expect(tasks.map((item) => item.id)).toEqual([keepId, createdTask.id]);
    expect(tasks.map((item) => item.position)).toEqual([0, 1]);
  });
});
