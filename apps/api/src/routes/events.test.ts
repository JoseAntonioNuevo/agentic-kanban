/**
 * Tests de `GET /api/projects/:projectId/events` (stream SSE): 401 sin sesión,
 * 404 (nunca 403) para no miembros y projects inexistentes, y 200 con las
 * cabeceras SSE, el comentario inicial y los eventos del hub como frames.
 */
import { boardEventSchema, type BoardEvent } from "@agentic-kanban/schemas";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vite-plus/test";

import { publish } from "../realtime/index.ts";
import { createWorkspaceFixture, requestAs, signUpUser } from "../test/helpers.ts";

/** Margen de seguridad para que un stream que no responde no cuelgue el test. */
const READ_TIMEOUT_MS = 2000;

/** Dos usuarios: Ana es miembro de su project; Luis no lo es. */
async function setup() {
  const ana = await signUpUser();
  const luis = await signUpUser();
  const workspace = await createWorkspaceFixture({
    name: "Ana",
    memberUserIds: [ana.userId],
    projects: ["Tablero Ana"],
  });

  return { ana, luis, projectId: workspace.projectIds[0] ?? "" };
}

/** Lo único que usan los tests del lector del body (evita diferir entre tipos DOM y Bun). */
type SseReader = {
  read: () => Promise<{ done: boolean; value?: Uint8Array }>;
};

/** Lee un chunk del stream, o falla si no llega dentro del margen. */
async function readChunk(reader: SseReader, decoder: TextDecoder): Promise<string> {
  const result = await Promise.race([
    reader.read(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout leyendo el stream SSE")), READ_TIMEOUT_MS),
    ),
  ]);

  if (result.done) {
    throw new Error("El stream SSE se cerró antes de lo esperado");
  }

  return decoder.decode(result.value, { stream: true });
}

/** Acumula chunks hasta que el texto leído contiene `needle`. */
async function readUntil(
  reader: SseReader,
  decoder: TextDecoder,
  needle: string,
  initial = "",
): Promise<string> {
  let text = initial;

  while (!text.includes(needle)) {
    text += await readChunk(reader, decoder);
  }

  return text;
}

describe("GET /api/projects/:projectId/events", () => {
  it("devuelve 401 sin cookie de sesión", async () => {
    const { projectId } = await setup();

    const res = await requestAs(null, `/api/projects/${projectId}/events`);

    expect(res.status).toBe(401);
  });

  it("devuelve 404 a un usuario que no es miembro", async () => {
    const { luis, projectId } = await setup();

    const res = await requestAs(luis.cookie, `/api/projects/${projectId}/events`);

    expect(res.status).toBe(404);
  });

  it("devuelve 404 si el project no existe", async () => {
    const { ana } = await setup();

    const res = await requestAs(ana.cookie, `/api/projects/${randomUUID()}/events`);

    expect(res.status).toBe(404);
  });

  it("abre un stream SSE para un miembro y entrega los eventos del hub", async () => {
    const { ana, projectId } = await setup();

    const res = await requestAs(ana.cookie, `/api/projects/${projectId}/events`);

    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/event-stream");
    expect(res.headers.get("cache-control")).toBe("no-cache, no-transform");
    expect(res.headers.get("x-accel-buffering")).toBe("no");

    const reader = res.body?.getReader();

    if (!reader) {
      throw new Error("La respuesta SSE no tiene body");
    }

    const decoder = new TextDecoder();

    try {
      // Primer chunk: el comentario que abre la conexión.
      const first = await readChunk(reader, decoder);
      expect(first).toContain(": connected");

      // Un evento publicado después llega como frame solo con datos.
      const event: BoardEvent = {
        type: "task.deleted",
        projectId,
        actorUserId: ana.userId,
        taskId: "task_stream_1",
      };
      publish(event);

      const text = await readUntil(reader, decoder, "\n\n", first.replace(": connected\n\n", ""));
      const dataLine = text.split("\n").find((line) => line.startsWith("data:"));

      expect(dataLine).toBeDefined();
      expect(
        boardEventSchema.parse(JSON.parse(dataLine?.slice("data:".length).trim() ?? "")),
      ).toEqual(event);
      // Sin `event:` por tipo, para que `EventSource.onmessage` lo reciba.
      expect(text).not.toContain("event:");
    } finally {
      await reader.cancel();
    }

    // Tras cancelar, publicar sigue sin lanzar (el listener ya se dio de baja).
    expect(() =>
      publish({ type: "task.deleted", projectId, actorUserId: ana.userId, taskId: "task_after" }),
    ).not.toThrow();
  });

  it("no entrega eventos de otro project", async () => {
    const { ana, projectId } = await setup();

    const res = await requestAs(ana.cookie, `/api/projects/${projectId}/events`);
    const reader = res.body?.getReader();

    if (!reader) {
      throw new Error("La respuesta SSE no tiene body");
    }

    const decoder = new TextDecoder();

    try {
      const first = await readChunk(reader, decoder);
      expect(first).toContain(": connected");

      // Primero otro project, después el propio: el primer `data:` debe ser el propio.
      publish({
        type: "task.deleted",
        projectId: randomUUID(),
        actorUserId: ana.userId,
        taskId: "task_other_project",
      });
      publish({
        type: "task.deleted",
        projectId,
        actorUserId: ana.userId,
        taskId: "task_own_project",
      });

      const text = await readUntil(reader, decoder, "task_own_project");

      expect(text).not.toContain("task_other_project");
    } finally {
      await reader.cancel();
    }
  });
});
