/**
 * Menciones de extremo a extremo: `POST /api/tasks/:taskId/comments` crea
 * una notificación por miembro mencionado y entrega su correo al outbox.
 *
 * Fixtures como la demo: Ana y Luis comparten un workspace y Ana tiene otro
 * solo suyo. La base y el outbox son los temporales del setup: nada toca
 * `data/` ni sale a la red.
 */
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getDb, notification } from "@agentic-kanban/db";
import { commentSchema } from "@agentic-kanban/schemas";
import { beforeAll, describe, expect, it, vi } from "vite-plus/test";

import {
  addWorkspaceMember,
  apiRequest,
  signUpUser,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
} from "../test/helpers.ts";

type Session = { cookie: string; userId: string; email: string };

let ana: Session;
let luis: Session;
let inigo: Session;
let sharedTaskId: string;
let sharedProjectId: string;
let privateTaskId: string;

async function signUp(name: string): Promise<Session> {
  // El nombre conserva la ñ y las tildes; el email usa solo ASCII.
  const slug = name.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const email = `s4-04-${slug}-${randomUUID()}@example.com`;
  return { ...(await signUpUser({ name, email })), email };
}

async function makeTask(members: string[], prefix: string, title: string) {
  const workspaceId = `ws_${prefix}_${randomUUID()}`;
  const projectId = `proj_${prefix}_${randomUUID()}`;
  const columnId = `col_${prefix}_${randomUUID()}`;
  const taskId = `task_${prefix}_${randomUUID()}`;
  await upsertWorkspace({ id: workspaceId, name: `Espacio ${prefix}` });
  for (const userId of members) {
    await addWorkspaceMember({ workspaceId, userId });
  }
  await upsertProject({ id: projectId, workspaceId, name: `Tablero ${prefix}` });
  await upsertColumn({ id: columnId, workspaceId, projectId, name: "To Do", position: 0 });
  await upsertTask({
    id: taskId,
    workspaceId,
    projectId,
    columnId,
    title,
    description: "",
    position: 0,
  });
  return { workspaceId, projectId, taskId };
}

beforeAll(async () => {
  ana = await signUp("Ana");
  luis = await signUp("Luis");
  inigo = await signUp("Íñigo");
  const shared = await makeTask(
    [ana.userId, luis.userId, inigo.userId],
    "shared",
    "Tarea compartida",
  );
  sharedTaskId = shared.taskId;
  sharedProjectId = shared.projectId;
  privateTaskId = (await makeTask([ana.userId], "private", "Tarea privada")).taskId;
});

async function comment(session: Session, taskId: string, body: string) {
  const response = await apiRequest("POST", `/api/tasks/${taskId}/comments`, {
    cookie: session.cookie,
    body: { body },
  });
  expect(response.status).toBe(201);
  return commentSchema.parse(await response.json());
}

async function notificationsFor(commentId: string) {
  const rows = await getDb().select().from(notification);
  return rows.filter((row) => row.commentId === commentId);
}

async function outboxLines() {
  const outboxPath = process.env.OUTBOX_PATH;
  if (outboxPath === undefined) {
    throw new Error("El setup no fijó OUTBOX_PATH");
  }

  let raw: string;
  try {
    raw = await readFile(outboxPath, "utf8");
  } catch {
    return [];
  }
  return raw
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line): Record<string, unknown> => JSON.parse(line));
}

describe("menciones en comentarios", () => {
  it("Ana menciona a Luis: una notificación, una línea en el outbox y emailed_at", async () => {
    const created = await comment(ana, sharedTaskId, "@Luis mira esto");

    const rows = await notificationsFor(created.id);
    expect(rows).toHaveLength(1);
    const [row] = rows;
    expect(row).toMatchObject({
      kind: "mention",
      recipientUserId: luis.userId,
      actorUserId: ana.userId,
      taskId: sharedTaskId,
      commentId: created.id,
      emailTo: luis.email,
      emailSubject: 'Ana te mencionó en "Tarea compartida"',
      readAt: null,
    });
    expect(row?.emailBody).toContain("Tarea compartida");
    expect(row?.emailBody).toContain("@Luis mira esto");
    expect(row?.emailBody).toContain(`http://localhost:5173/?project=${sharedProjectId}`);
    expect(row?.emailedAt).toBeInstanceOf(Date);

    const lines = (await outboxLines()).filter((line) => line.notificationId === row?.id);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      to: luis.email,
      subject: row?.emailSubject,
      body: row?.emailBody,
    });
    expect(typeof lines[0]?.createdAt).toBe("string");

    const forAna = (await getDb().select().from(notification)).filter(
      (item) => item.recipientUserId === ana.userId,
    );
    expect(forAna).toEqual([]);
  });

  it("ignora a los desconocidos y la automención", async () => {
    const before = (await outboxLines()).length;
    const created = await comment(ana, sharedTaskId, "@Pepe y @Ana");
    expect(await notificationsFor(created.id)).toEqual([]);
    expect(await outboxLines()).toHaveLength(before);
  });

  it("no notifica a quien no es miembro del workspace de la tarea", async () => {
    const created = await comment(ana, privateTaskId, "@Luis");
    expect(await notificationsFor(created.id)).toEqual([]);
  });

  it("una sola notificación aunque cambien las mayúsculas o se repita", async () => {
    for (const body of ["@luis,", "@Luis @LUIS"]) {
      const created = await comment(ana, sharedTaskId, body);
      const rows = await notificationsFor(created.id);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.recipientUserId).toBe(luis.userId);
    }
  });

  it("resuelve nombres con ñ y tildes sin distinguir mayúsculas ni la forma Unicode", async () => {
    for (const body of ["@íñigo, ¿y esto?", "@ÍÑIGO @Íñigo", "@I\u0301n\u0303igo"]) {
      const created = await comment(ana, sharedTaskId, body);
      const rows = await notificationsFor(created.id);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        recipientUserId: inigo.userId,
        emailTo: inigo.email,
        emailSubject: 'Ana te mencionó en "Tarea compartida"',
      });
      expect(rows[0]?.emailedAt).toBeInstanceOf(Date);
    }
  });

  it("sin menciones responde 201 y no crea notificaciones", async () => {
    const created = await comment(ana, sharedTaskId, "Sin menciones, escribe a ana@demo.test");
    expect(await notificationsFor(created.id)).toEqual([]);
  });

  it("un outbox que no se puede escribir deja emailed_at vacío y responde 201", async () => {
    const previous = process.env.OUTBOX_PATH;
    // Un directorio no admite `appendFile`: la entrega falla sin tocar `data/`.
    const directory = await mkdtemp(join(tmpdir(), "agentic-kanban-outbox-dir-"));
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.OUTBOX_PATH = directory;

    try {
      const created = await comment(ana, sharedTaskId, "@Luis ¿lo ves?");
      const rows = await notificationsFor(created.id);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.emailedAt).toBeNull();
      expect(error).toHaveBeenCalled();
    } finally {
      process.env.OUTBOX_PATH = previous;
      error.mockRestore();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
