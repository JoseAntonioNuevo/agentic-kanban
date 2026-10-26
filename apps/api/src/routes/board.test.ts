/**
 * Tablero, CRUD de tareas y movimiento. La base es la temporal del setup;
 * no usa `data/`.
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
  it("responde 401 sin cookie en las rutas del tablero", async () => {
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

    const moved = await apiRequest("POST", "/api/tasks/task_missing/move", {
      body: { columnId: "col_missing", position: 0 },
    });
    expect(moved.status).toBe(401);
    expect(await moved.json()).toEqual({ error: "Unauthorized" });
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

async function columnWithTasks(
  workspaceId: string,
  projectId: string,
  name: string,
  position: number,
  titles: string[],
) {
  const columnId = `col_${randomUUID()}`;
  await upsertColumn({ id: columnId, workspaceId, projectId, name, position });
  const taskIds: string[] = [];
  for (const [index, title] of titles.entries()) {
    const taskId = `task_${randomUUID()}`;
    taskIds.push(taskId);
    await upsertTask({
      id: taskId,
      workspaceId,
      projectId,
      columnId,
      title,
      description: "",
      position: index,
    });
  }
  return { columnId, taskIds };
}

async function boardOf(projectId: string, cookie: string) {
  const response = await apiGet(`/api/projects/${projectId}/board`, cookie);
  expect(response.status).toBe(200);
  const board = boardResponseSchema.parse(await response.json());
  for (const item of board.columns) {
    expect(item.tasks.map((task) => task.position)).toEqual(item.tasks.map((_, index) => index));
  }
  return board;
}

describe("mover tareas", () => {
  it("reordena dentro de la misma columna y deja posiciones contiguas", async () => {
    const own = await makeProject(owner.userId, "same");
    const todo = await columnWithTasks(own.workspaceId, own.projectId, "To Do", 0, ["A", "B", "C"]);
    const movedId = todo.taskIds[2];
    if (movedId === undefined) {
      throw new Error("falta la tarea");
    }

    const moved = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: owner.cookie,
      body: { columnId: todo.columnId, position: 0 },
    });
    expect(moved.status).toBe(200);
    const task = taskSchema.parse(await moved.json());
    expect(task.id).toBe(movedId);
    expect(task.columnId).toBe(todo.columnId);
    expect(task.position).toBe(0);

    const board = await boardOf(own.projectId, owner.cookie);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual([
      movedId,
      todo.taskIds[0],
      todo.taskIds[1],
    ]);
  });

  it("mueve a otra columna en la posición pedida y compacta el origen", async () => {
    const own = await makeProject(owner.userId, "other");
    const todo = await columnWithTasks(own.workspaceId, own.projectId, "To Do", 0, ["A", "B", "C"]);
    const doing = await columnWithTasks(own.workspaceId, own.projectId, "In Progress", 1, [
      "D",
      "E",
    ]);
    const movedId = todo.taskIds[1];
    if (movedId === undefined) {
      throw new Error("falta la tarea");
    }

    const moved = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: owner.cookie,
      body: { columnId: doing.columnId, position: 1 },
    });
    expect(moved.status).toBe(200);
    const task = taskSchema.parse(await moved.json());
    expect(task.columnId).toBe(doing.columnId);
    expect(task.position).toBe(1);

    const board = await boardOf(own.projectId, owner.cookie);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual([
      todo.taskIds[0],
      todo.taskIds[2],
    ]);
    expect(board.columns[1]?.tasks.map((item) => item.id)).toEqual([
      doing.taskIds[0],
      movedId,
      doing.taskIds[1],
    ]);
  });

  it("acota la posición al insertar en una columna vacía", async () => {
    const own = await makeProject(owner.userId, "empty");
    const todo = await columnWithTasks(own.workspaceId, own.projectId, "To Do", 0, ["A", "B", "C"]);
    const done = await columnWithTasks(own.workspaceId, own.projectId, "Done", 1, []);
    const movedId = todo.taskIds[0];
    if (movedId === undefined) {
      throw new Error("falta la tarea");
    }

    const moved = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: owner.cookie,
      body: { columnId: done.columnId, position: 5 },
    });
    expect(moved.status).toBe(200);
    const task = taskSchema.parse(await moved.json());
    expect(task.columnId).toBe(done.columnId);
    expect(task.position).toBe(0);

    const board = await boardOf(own.projectId, owner.cookie);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual([
      todo.taskIds[1],
      todo.taskIds[2],
    ]);
    expect(board.columns[1]?.tasks.map((item) => item.id)).toEqual([movedId]);
  });

  it("responde 404 al mover a una columna de otro project, aunque el usuario sea miembro de ambos workspaces", async () => {
    const home = await makeProject(both.userId, "home");
    const notes = await makeProject(both.userId, "notes");
    const todo = await columnWithTasks(home.workspaceId, home.projectId, "To Do", 0, ["A", "B"]);
    const foreign = await columnWithTasks(notes.workspaceId, notes.projectId, "To Do", 0, ["Nota"]);
    const movedId = todo.taskIds[0];
    if (movedId === undefined) {
      throw new Error("falta la tarea");
    }

    const moved = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: both.cookie,
      body: { columnId: foreign.columnId, position: 0 },
    });
    expect(moved.status).toBe(404);
    expect(await moved.json()).toEqual({ error: "Not found" });

    const board = await boardOf(home.projectId, both.cookie);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual(todo.taskIds);
    const notesBoard = await boardOf(notes.projectId, both.cookie);
    expect(notesBoard.columns[0]?.tasks.map((item) => item.id)).toEqual(foreign.taskIds);
  });

  it("responde 404 al mover entre dos projects del mismo workspace", async () => {
    const workspaceId = `ws_siblings_${randomUUID()}`;
    const leftId = `proj_left_${randomUUID()}`;
    const rightId = `proj_right_${randomUUID()}`;
    await upsertWorkspace({ id: workspaceId, name: "Espacio compartido" });
    await addWorkspaceMember({ workspaceId, userId: both.userId });
    await upsertProject({ id: leftId, workspaceId, name: "Izquierda" });
    await upsertProject({ id: rightId, workspaceId, name: "Derecha" });
    const left = await columnWithTasks(workspaceId, leftId, "To Do", 0, ["A"]);
    const right = await columnWithTasks(workspaceId, rightId, "To Do", 0, []);
    const movedId = left.taskIds[0];
    if (movedId === undefined) {
      throw new Error("falta la tarea");
    }

    const moved = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: both.cookie,
      body: { columnId: right.columnId, position: 0 },
    });
    expect(moved.status).toBe(404);
    expect(await moved.json()).toEqual({ error: "Not found" });

    const board = await boardOf(leftId, both.cookie);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual([movedId]);
  });

  it("responde 404 si no hay membresía, si la tarea no existe o si la columna no existe", async () => {
    const own = await makeProject(owner.userId, "denied");
    const todo = await columnWithTasks(own.workspaceId, own.projectId, "To Do", 0, ["A", "B"]);
    const movedId = todo.taskIds[0];
    if (movedId === undefined) {
      throw new Error("falta la tarea");
    }

    const strangerMove = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: stranger.cookie,
      body: { columnId: todo.columnId, position: 1 },
    });
    expect(strangerMove.status).toBe(404);
    expect(await strangerMove.json()).toEqual({ error: "Not found" });

    const missingTask = await apiRequest("POST", `/api/tasks/task_missing_${randomUUID()}/move`, {
      cookie: owner.cookie,
      body: { columnId: todo.columnId, position: 0 },
    });
    expect(missingTask.status).toBe(404);

    const missingColumn = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: owner.cookie,
      body: { columnId: `col_missing_${randomUUID()}`, position: 0 },
    });
    expect(missingColumn.status).toBe(404);

    const board = await boardOf(own.projectId, owner.cookie);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual(todo.taskIds);
  });

  it("responde 400 con una posición negativa, un columnId vacío o sin posición", async () => {
    const own = await makeProject(owner.userId, "bad-move");
    const todo = await columnWithTasks(own.workspaceId, own.projectId, "To Do", 0, ["A"]);
    const movedId = todo.taskIds[0];
    if (movedId === undefined) {
      throw new Error("falta la tarea");
    }

    const negative = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: owner.cookie,
      body: { columnId: todo.columnId, position: -1 },
    });
    expect(negative.status).toBe(400);

    const emptyColumn = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: owner.cookie,
      body: { columnId: "", position: 0 },
    });
    expect(emptyColumn.status).toBe(400);

    const missingPosition = await apiRequest("POST", `/api/tasks/${movedId}/move`, {
      cookie: owner.cookie,
      body: { columnId: todo.columnId },
    });
    expect(missingPosition.status).toBe(400);

    const board = await boardOf(own.projectId, owner.cookie);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual([movedId]);
    expect(board.columns[0]?.tasks.map((item) => item.position)).toEqual([0]);
  });
});
