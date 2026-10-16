/**
 * Tests de la publicación de `comment.created` desde el `POST` de comentarios:
 * un comentario correcto publica exactamente un evento válido para
 * `boardEventSchema` en el hub de su project, con `actorUserId` del autor y el
 * mismo comentario que responde. Un no miembro (404) y un cuerpo vacío (400)
 * no publican nada.
 */
import { boardEventSchema, commentSchema, type BoardEvent } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { subscribe } from "../realtime/index.ts";
import {
  createBoardFixture,
  createWorkspaceFixture,
  requestAs,
  signUpUser,
} from "../test/helpers.ts";

/** Ana (miembro) y Luis (ajeno) con una tarea en el project de Ana. */
async function setup() {
  const ana = await signUpUser({ name: "Ana" });
  const luis = await signUpUser({ name: "Luis" });
  const workspace = await createWorkspaceFixture({
    name: "Ana",
    memberUserIds: [ana.userId],
    projects: ["Tablero Ana"],
  });
  const projectId = workspace.projectIds[0] ?? "";
  const board = await createBoardFixture({
    workspaceId: workspace.workspaceId,
    projectId,
    columns: [{ name: "Por hacer", tasks: ["Tarea de Ana"] }],
  });

  return { ana, luis, projectId, taskId: board.taskIds[0]?.[0] ?? "" };
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

function postComment(cookie: string, taskId: string, body: unknown) {
  return requestAs(cookie, `/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

describe("eventos del POST de comentarios", () => {
  it("publica un único comment.created con el mismo comentario que responde", async () => {
    const { ana, projectId, taskId } = await setup();

    const { response, events } = await withEvents(projectId, () =>
      postComment(ana.cookie, taskId, "Hola equipo"),
    );

    expect(response.status).toBe(201);
    const comment = commentSchema.parse(await response.json());

    expect(events).toHaveLength(1);
    const event = boardEventSchema.parse(events[0]);

    expect(event).toEqual({
      type: "comment.created",
      projectId,
      actorUserId: ana.userId,
      comment,
    });
  });

  it("no publica nada con 404 (no miembro) ni con 400 (cuerpo vacío)", async () => {
    const { ana, luis, projectId, taskId } = await setup();

    const intruder = await withEvents(projectId, () => postComment(luis.cookie, taskId, "Intruso"));

    expect(intruder.response.status).toBe(404);
    expect(intruder.events).toEqual([]);

    const empty = await withEvents(projectId, () => postComment(ana.cookie, taskId, ""));

    expect(empty.response.status).toBe(400);
    expect(empty.events).toEqual([]);
  });
});
