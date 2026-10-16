/**
 * Tests del tablero: `GET /api/projects/:projectId/board` y las escrituras de
 * tareas (`POST`, `PATCH`, `DELETE`). Cubren 401 sin sesión, 404 (nunca 403)
 * ante recursos ajenos o inexistentes, 400 con input inválido, el orden por
 * `position` y la compactación de posiciones tras borrar.
 */
import { boardResponseSchema, errorResponseSchema, taskSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import {
  createBoardFixture,
  createWorkspaceFixture,
  requestAs,
  signUpUser,
} from "../test/helpers.ts";

const JSON_HEADERS = { "content-type": "application/json" };

/** Dos usuarios, cada uno con su workspace, project y tablero de tres columnas. */
async function setup() {
  const ana = await signUpUser();
  const luis = await signUpUser();

  const anaWorkspace = await createWorkspaceFixture({
    name: "Ana",
    memberUserIds: [ana.userId],
    projects: ["Tablero Ana"],
  });
  const luisWorkspace = await createWorkspaceFixture({
    name: "Luis",
    memberUserIds: [luis.userId],
    projects: ["Tablero Luis"],
  });
  const anaProjectId = anaWorkspace.projectIds[0] ?? "";
  const luisProjectId = luisWorkspace.projectIds[0] ?? "";

  const anaBoard = await createBoardFixture({
    workspaceId: anaWorkspace.workspaceId,
    projectId: anaProjectId,
    columns: [
      { name: "Por hacer", tasks: ["A0", "A1", "A2"] },
      { name: "En curso", tasks: ["B0"] },
      { name: "Hecho" },
    ],
  });
  const luisBoard = await createBoardFixture({
    workspaceId: luisWorkspace.workspaceId,
    projectId: luisProjectId,
    columns: [{ name: "Por hacer", tasks: ["L0"] }],
  });

  return { ana, luis, anaWorkspace, anaProjectId, luisProjectId, anaBoard, luisBoard };
}

function postTask(cookie: string | null, projectId: string, body: unknown) {
  return requestAs(cookie, `/api/projects/${projectId}/tasks`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

function patchTask(cookie: string | null, taskId: string, body: unknown) {
  return requestAs(cookie, `/api/tasks/${taskId}`, {
    method: "PATCH",
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });
}

async function getBoard(cookie: string, projectId: string) {
  const response = await requestAs(cookie, `/api/projects/${projectId}/board`);

  expect(response.status).toBe(200);

  return boardResponseSchema.parse(await response.json());
}

describe("GET /api/projects/:projectId/board", () => {
  it("responde 401 con { error } sin cookie", async () => {
    const response = await requestAs(null, "/api/projects/cualquier-id/board");

    expect(response.status).toBe(401);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve 404 para el board de un project ajeno", async () => {
    const { ana, luisProjectId } = await setup();
    const response = await requestAs(ana.cookie, `/api/projects/${luisProjectId}/board`);

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve 404 para un project inexistente", async () => {
    const { ana } = await setup();
    const response = await requestAs(ana.cookie, "/api/projects/no-existe/board");

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve 200 con columnas y tareas ordenadas por position", async () => {
    const { ana, anaProjectId, anaBoard } = await setup();
    const board = await getBoard(ana.cookie, anaProjectId);

    expect(board.project.id).toBe(anaProjectId);
    expect(board.columns.map((column) => column.name)).toEqual(["Por hacer", "En curso", "Hecho"]);
    expect(board.columns.map((column) => column.id)).toEqual(anaBoard.columnIds);
    expect(board.columns.map((column) => column.position)).toEqual([0, 1, 2]);
    expect(board.columns.map((column) => column.tasks.map((item) => item.title))).toEqual([
      ["A0", "A1", "A2"],
      ["B0"],
      [],
    ]);
    expect(board.columns[0]?.tasks.map((item) => item.position)).toEqual([0, 1, 2]);
    expect(board.columns[0]?.tasks.map((item) => item.id)).toEqual(anaBoard.taskIds[0]);
  });
});

describe("POST /api/projects/:projectId/tasks", () => {
  it("responde 401 sin cookie", async () => {
    const response = await postTask(null, "cualquier-id", { columnId: "x", title: "T" });

    expect(response.status).toBe(401);
    errorResponseSchema.parse(await response.json());
  });

  it("crea la tarea al final de su columna con 201", async () => {
    const { ana, anaProjectId, anaWorkspace, anaBoard } = await setup();
    const columnId = anaBoard.columnIds[0] ?? "";

    const response = await postTask(ana.cookie, anaProjectId, {
      columnId,
      title: "  Nueva  ",
      description: "Detalle",
    });

    expect(response.status).toBe(201);
    const created = taskSchema.parse(await response.json());

    expect(created.title).toBe("Nueva");
    expect(created.description).toBe("Detalle");
    expect(created.columnId).toBe(columnId);
    expect(created.projectId).toBe(anaProjectId);
    expect(created.workspaceId).toBe(anaWorkspace.workspaceId);
    expect(created.position).toBe(3);

    const board = await getBoard(ana.cookie, anaProjectId);

    expect(board.columns[0]?.tasks.map((item) => item.title)).toEqual(["A0", "A1", "A2", "Nueva"]);
  });

  it("crea en una columna vacía con position 0 y descripción vacía por defecto", async () => {
    const { ana, anaProjectId, anaBoard } = await setup();

    const response = await postTask(ana.cookie, anaProjectId, {
      columnId: anaBoard.columnIds[2],
      title: "Primera",
    });

    expect(response.status).toBe(201);
    const created = taskSchema.parse(await response.json());

    expect(created.position).toBe(0);
    expect(created.description).toBe("");
  });

  it("devuelve 404 si el project es ajeno", async () => {
    const { ana, luisProjectId, luisBoard } = await setup();

    const response = await postTask(ana.cookie, luisProjectId, {
      columnId: luisBoard.columnIds[0],
      title: "Intruso",
    });

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve 404 si el columnId es de otro project ajeno", async () => {
    const { ana, luis, anaProjectId, luisBoard, luisProjectId } = await setup();

    const response = await postTask(ana.cookie, anaProjectId, {
      columnId: luisBoard.columnIds[0],
      title: "Intruso",
    });

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());

    // La columna ajena sigue intacta.
    const board = await getBoard(luis.cookie, luisProjectId);

    expect(board.columns[0]?.tasks.map((item) => item.title)).toEqual(["L0"]);
  });

  it("devuelve 404 si el columnId es de otro project del mismo usuario", async () => {
    const user = await signUpUser();
    const first = await createWorkspaceFixture({
      name: "Uno",
      memberUserIds: [user.userId],
      projects: ["P1"],
    });
    const second = await createWorkspaceFixture({
      name: "Dos",
      memberUserIds: [user.userId],
      projects: ["P2"],
    });
    const firstProjectId = first.projectIds[0] ?? "";
    const secondProjectId = second.projectIds[0] ?? "";
    const firstBoard = await createBoardFixture({
      workspaceId: first.workspaceId,
      projectId: firstProjectId,
      columns: [{ name: "Col 1" }],
    });
    const secondBoard = await createBoardFixture({
      workspaceId: second.workspaceId,
      projectId: secondProjectId,
      columns: [{ name: "Col 2" }],
    });

    const response = await postTask(user.cookie, firstProjectId, {
      columnId: secondBoard.columnIds[0],
      title: "Cruzada",
    });

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());

    // Ninguna de las dos columnas recibió la tarea.
    const firstAfter = await getBoard(user.cookie, firstProjectId);
    const secondAfter = await getBoard(user.cookie, secondProjectId);

    expect(firstAfter.columns[0]?.id).toBe(firstBoard.columnIds[0]);
    expect(firstAfter.columns[0]?.tasks).toEqual([]);
    expect(secondAfter.columns[0]?.tasks).toEqual([]);
  });

  it("devuelve 400 con título vacío", async () => {
    const { ana, anaProjectId, anaBoard } = await setup();

    for (const title of ["", "   "]) {
      const response = await postTask(ana.cookie, anaProjectId, {
        columnId: anaBoard.columnIds[0],
        title,
      });

      expect(response.status).toBe(400);
    }

    const board = await getBoard(ana.cookie, anaProjectId);

    expect(board.columns[0]?.tasks).toHaveLength(3);
  });
});

describe("PATCH /api/tasks/:taskId", () => {
  it("responde 401 sin cookie", async () => {
    const response = await patchTask(null, "cualquier-id", { title: "X" });

    expect(response.status).toBe(401);
    errorResponseSchema.parse(await response.json());
  });

  it("edita título y descripción con 200", async () => {
    const { ana, anaProjectId, anaBoard } = await setup();
    const taskId = anaBoard.taskIds[0]?.[1] ?? "";

    const response = await patchTask(ana.cookie, taskId, {
      title: "Editada",
      description: "Nueva descripción",
    });

    expect(response.status).toBe(200);
    const updated = taskSchema.parse(await response.json());

    expect(updated.id).toBe(taskId);
    expect(updated.title).toBe("Editada");
    expect(updated.description).toBe("Nueva descripción");
    expect(updated.position).toBe(1);

    const board = await getBoard(ana.cookie, anaProjectId);

    expect(board.columns[0]?.tasks[1]?.title).toBe("Editada");
  });

  it("permite editar solo la descripción y conserva el título", async () => {
    const { ana, anaBoard } = await setup();
    const taskId = anaBoard.taskIds[0]?.[0] ?? "";

    const response = await patchTask(ana.cookie, taskId, { description: "Solo texto" });

    expect(response.status).toBe(200);
    const updated = taskSchema.parse(await response.json());

    expect(updated.title).toBe("A0");
    expect(updated.description).toBe("Solo texto");
  });

  it("devuelve 404 para una tarea de un project ajeno y no la modifica", async () => {
    const { ana, luis, luisProjectId, luisBoard } = await setup();
    const taskId = luisBoard.taskIds[0]?.[0] ?? "";

    const response = await patchTask(ana.cookie, taskId, { title: "Secuestrada" });

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());

    const board = await getBoard(luis.cookie, luisProjectId);

    expect(board.columns[0]?.tasks[0]?.title).toBe("L0");
  });

  it("devuelve 404 para una tarea inexistente", async () => {
    const { ana } = await setup();
    const response = await patchTask(ana.cookie, "no-existe", { title: "X" });

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());
  });

  it("devuelve 400 con cuerpo vacío o título vacío", async () => {
    const { ana, anaBoard } = await setup();
    const taskId = anaBoard.taskIds[0]?.[0] ?? "";

    expect((await patchTask(ana.cookie, taskId, {})).status).toBe(400);
    expect((await patchTask(ana.cookie, taskId, { title: "" })).status).toBe(400);
  });
});

describe("DELETE /api/tasks/:taskId", () => {
  it("responde 401 sin cookie", async () => {
    const response = await requestAs(null, "/api/tasks/cualquier-id", { method: "DELETE" });

    expect(response.status).toBe(401);
    errorResponseSchema.parse(await response.json());
  });

  it("borra con 204 y compacta las posiciones de la columna", async () => {
    const { ana, anaProjectId, anaBoard } = await setup();
    const middleId = anaBoard.taskIds[0]?.[1] ?? "";

    const response = await requestAs(ana.cookie, `/api/tasks/${middleId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");

    const board = await getBoard(ana.cookie, anaProjectId);
    const remaining = board.columns[0]?.tasks ?? [];

    expect(remaining.map((item) => item.title)).toEqual(["A0", "A2"]);
    expect(remaining.map((item) => item.position)).toEqual([0, 1]);
    // Las otras columnas no cambian.
    expect(board.columns[1]?.tasks.map((item) => item.position)).toEqual([0]);

    const again = await requestAs(ana.cookie, `/api/tasks/${middleId}`, { method: "DELETE" });

    expect(again.status).toBe(404);
  });

  it("devuelve 404 para una tarea ajena y no la borra", async () => {
    const { ana, luis, luisProjectId, luisBoard } = await setup();
    const taskId = luisBoard.taskIds[0]?.[0] ?? "";

    const response = await requestAs(ana.cookie, `/api/tasks/${taskId}`, { method: "DELETE" });

    expect(response.status).toBe(404);
    errorResponseSchema.parse(await response.json());

    const board = await getBoard(luis.cookie, luisProjectId);

    expect(board.columns[0]?.tasks).toHaveLength(1);
  });
});
