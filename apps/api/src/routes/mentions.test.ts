/**
 * Menciones de extremo a extremo en `POST /api/tasks/:taskId/comments`: una
 * notificación por miembro mencionado del workspace de la tarea (misma
 * transacción que el comentario), una línea en el outbox (`OUTBOX_PATH`
 * temporal) y `emailed_at` relleno. Desconocidos, automención y usuarios de
 * otro workspace no generan nada; si el outbox falla, el comentario sigue en 201.
 */
import { getDb, notification } from "@agentic-kanban/db";
import { commentSchema } from "@agentic-kanban/schemas";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import {
  createBoardFixture,
  createWorkspaceFixture,
  requestAs,
  signUpUser,
} from "../test/helpers.ts";
import type { SignedUpUser } from "../test/helpers.ts";

const outboxLineSchema = z.object({
  to: z.string(),
  subject: z.string(),
  body: z.string(),
  notificationId: z.string(),
  createdAt: z.string(),
});

let ana: SignedUpUser;
let luis: SignedUpUser;
let sharedTaskId = "";
let privateTaskId = "";

/** Crea un workspace con un project, una columna y una tarea; devuelve el id de la tarea. */
async function createTask(name: string, memberUserIds: string[], title: string): Promise<string> {
  const { workspaceId, projectIds } = await createWorkspaceFixture({
    name,
    memberUserIds,
    projects: ["Tablero"],
  });
  const { taskIds } = await createBoardFixture({
    workspaceId,
    projectId: projectIds[0] ?? "",
    columns: [{ name: "Pendiente", tasks: [title] }],
  });

  return taskIds[0]?.[0] ?? "";
}

beforeAll(async () => {
  ana = await signUpUser({ name: "Ana", email: `ana-${randomUUID()}@demo.test` });
  luis = await signUpUser({ name: "Luis", email: `luis-${randomUUID()}@demo.test` });
  sharedTaskId = await createTask("Compartido", [ana.userId, luis.userId], "Tarea compartida");
  privateTaskId = await createTask("Privado de Ana", [ana.userId], "Tarea de Ana");
});

function postComment(cookie: string, taskId: string, body: string) {
  return requestAs(cookie, `/api/tasks/${taskId}/comments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body }),
  });
}

/** Líneas actuales del outbox (vacío si el fichero aún no existe). */
function readOutboxLines(): string[] {
  const path = process.env.OUTBOX_PATH ?? "";

  if (!existsSync(path)) {
    return [];
  }

  return readFileSync(path, "utf8").split("\n").filter(Boolean);
}

async function notificationsOfTask(taskId: string) {
  const rows = await getDb().select().from(notification);

  return rows.filter((row) => row.taskId === taskId);
}

/** Comenta como `author` y devuelve las notificaciones nuevas y las líneas nuevas del outbox. */
async function commentAndCollect(author: SignedUpUser, taskId: string, body: string) {
  const notificationsBefore = new Set((await notificationsOfTask(taskId)).map((row) => row.id));
  const linesBefore = readOutboxLines();
  const response = await postComment(author.cookie, taskId, body);

  expect(response.status).toBe(201);

  const created = commentSchema.parse(await response.json());
  const notifications = (await notificationsOfTask(taskId)).filter(
    (row) => !notificationsBefore.has(row.id),
  );
  const lines = readOutboxLines()
    .slice(linesBefore.length)
    .map((line) => outboxLineSchema.parse(JSON.parse(line)));

  return { created, notifications, lines };
}

describe("menciones en comentarios", () => {
  it("notifica a Luis, escribe el outbox y marca emailed_at", async () => {
    const { created, notifications, lines } = await commentAndCollect(
      ana,
      sharedTaskId,
      "@Luis mira esto",
    );

    expect(notifications).toHaveLength(1);

    const [row] = notifications;

    expect(row?.recipientUserId).toBe(luis.userId);
    expect(row?.actorUserId).toBe(ana.userId);
    expect(row?.commentId).toBe(created.id);
    expect(row?.kind).toBe("mention");
    expect(row?.emailTo).toBe(luis.email);
    expect(row?.emailSubject).toBe('Ana te mencionó en "Tarea compartida"');
    expect(row?.emailBody).toContain("@Luis mira esto");
    expect(row?.emailedAt).toBeInstanceOf(Date);

    expect(lines).toHaveLength(1);
    expect(lines[0]?.to).toBe(luis.email);
    expect(lines[0]?.notificationId).toBe(row?.id);
    expect(lines[0]?.subject).toBe(row?.emailSubject);
  });

  it("no genera nada para desconocidos ni para la automención", async () => {
    const unknown = await commentAndCollect(ana, sharedTaskId, "@Pepe ¿puedes verlo?");
    const self = await commentAndCollect(ana, sharedTaskId, "Nota para mí @Ana");

    expect(unknown.notifications).toHaveLength(0);
    expect(unknown.lines).toHaveLength(0);
    expect(self.notifications).toHaveLength(0);
    expect(self.lines).toHaveLength(0);
  });

  it("no notifica a quien no es miembro del workspace de la tarea", async () => {
    const { notifications, lines } = await commentAndCollect(
      ana,
      privateTaskId,
      "@Luis ¿ves esto?",
    );

    expect(notifications).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });

  it("ignora mayúsculas y puntuación: @luis, notifica a Luis una vez", async () => {
    const { notifications, lines } = await commentAndCollect(
      ana,
      sharedTaskId,
      "Gracias @luis, y @LUIS otra vez",
    );

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.recipientUserId).toBe(luis.userId);
    expect(lines).toHaveLength(1);
  });

  it("un comentario sin menciones responde 201 y no crea notificaciones", async () => {
    const { notifications, lines } = await commentAndCollect(
      ana,
      sharedTaskId,
      "Escríbeme a ana@demo.test",
    );

    expect(notifications).toHaveLength(0);
    expect(lines).toHaveLength(0);
  });

  it("si el outbox falla responde 201 y deja emailed_at vacío", async () => {
    const original = process.env.OUTBOX_PATH;
    const blocker = join(tmpdir(), `agentic-kanban-outbox-blocker-${randomUUID()}`);

    writeFileSync(blocker, "no soy un directorio");
    // Un fichero existente como "carpeta": mkdir/append fallan con ENOTDIR.
    process.env.OUTBOX_PATH = join(blocker, "outbox.jsonl");

    const previous = new Set((await notificationsOfTask(sharedTaskId)).map((row) => row.id));

    try {
      const response = await postComment(ana.cookie, sharedTaskId, "@Luis el correo no saldrá");

      expect(response.status).toBe(201);
      commentSchema.parse(await response.json());
    } finally {
      process.env.OUTBOX_PATH = original;
      rmSync(blocker, { force: true });
    }

    const created = (await notificationsOfTask(sharedTaskId)).filter(
      (row) => !previous.has(row.id),
    );

    expect(created).toHaveLength(1);
    expect(created[0]?.recipientUserId).toBe(luis.userId);
    expect(created[0]?.emailedAt).toBeNull();
  });

  it("compara nombres con tildes sin distinguir mayúsculas: @álvaro notifica a Álvaro", async () => {
    const alvaro = await signUpUser({ name: "Álvaro", email: `alvaro-${randomUUID()}@demo.test` });
    const taskId = await createTask("Con Álvaro", [ana.userId, alvaro.userId], "Tarea con tilde");

    const { notifications } = await commentAndCollect(ana, taskId, "@álvaro revisa esto");

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.recipientUserId).toBe(alvaro.userId);
  });
});
