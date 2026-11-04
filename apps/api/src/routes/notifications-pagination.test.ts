/**
 * Campana a escala: paginación por cursor, contador de no leídas y «marcar
 * todas». Las filas se insertan directamente (120 para Luis, de tres en tres
 * con el mismo `createdAt`) para no crear 120 comentarios por HTTP. La base
 * es la temporal del setup; no usa `data/`.
 */
import { randomUUID } from "node:crypto";

import { comment, db, notification } from "@agentic-kanban/db";
import {
  NOTIFICATION_PAGE_SIZE,
  notificationCursor,
  notificationListResponseSchema,
  notificationReadAllResponseSchema,
  notificationSchema,
  notificationUnreadCountResponseSchema,
  type Notification,
} from "@agentic-kanban/schemas";
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

type Session = { cookie: string; userId: string };

const LUIS_ROWS = 120;
const base = Date.parse("2026-11-04T10:00:00.000Z");

let ana: Session;
let luis: Session;
let foreignNotificationId: string;

function email(label: string): string {
  return `s4-05-page-${label}-${randomUUID()}@example.com`;
}

/** Workspace con una tarea y un comentario de `authorId`; devuelve sus ids. */
async function seedWorkspace(memberIds: string[], authorId: string) {
  const workspaceId = `ws_page_${randomUUID()}`;
  const projectId = `proj_page_${randomUUID()}`;
  const columnId = `col_page_${randomUUID()}`;
  const taskId = `task_page_${randomUUID()}`;
  const commentId = `comment_page_${randomUUID()}`;
  await upsertWorkspace({ id: workspaceId, name: "Paginación" });
  for (const userId of memberIds) {
    await addWorkspaceMember({ workspaceId, userId });
  }
  await upsertProject({ id: projectId, workspaceId, name: "Tablero" });
  await upsertColumn({ id: columnId, workspaceId, projectId, name: "To Do", position: 0 });
  await upsertTask({
    id: taskId,
    workspaceId,
    projectId,
    columnId,
    title: "Tarea",
    description: "",
    position: 0,
  });
  await db
    .insert(comment)
    .values({ id: commentId, workspaceId, projectId, taskId, authorId, body: "@todos" });
  return { workspaceId, taskId, commentId };
}

function row(
  seeded: { workspaceId: string; taskId: string; commentId: string },
  ids: { id: string; recipientUserId: string; actorUserId: string },
  createdAt: number,
) {
  return {
    ...ids,
    workspaceId: seeded.workspaceId,
    taskId: seeded.taskId,
    commentId: seeded.commentId,
    kind: "mention",
    emailTo: "nadie@example.com",
    emailSubject: "Asunto",
    emailBody: "Cuerpo",
    createdAt: new Date(createdAt),
  };
}

beforeAll(async () => {
  ana = await signUpUser({ name: "Ana", email: email("ana") });
  luis = await signUpUser({ name: "Luis", email: email("luis") });

  const shared = await seedWorkspace([ana.userId, luis.userId], ana.userId);
  await db.insert(notification).values(
    Array.from({ length: LUIS_ROWS }, (_, index) =>
      row(
        shared,
        {
          id: `n_${String(index).padStart(3, "0")}`,
          recipientUserId: luis.userId,
          actorUserId: ana.userId,
        },
        // De tres en tres con el mismo createdAt: el desempate es el id.
        base + Math.floor(index / 3),
      ),
    ),
  );
  await db
    .insert(notification)
    .values([
      row(shared, { id: "n_ana_1", recipientUserId: ana.userId, actorUserId: luis.userId }, base),
      row(shared, { id: "n_ana_2", recipientUserId: ana.userId, actorUserId: luis.userId }, base),
    ]);

  // Luis ya no es miembro de este workspace: su fila no cuenta ni se marca.
  const former = await seedWorkspace([ana.userId], ana.userId);
  foreignNotificationId = `n_former_${randomUUID()}`;
  await db
    .insert(notification)
    .values(
      row(
        former,
        { id: foreignNotificationId, recipientUserId: luis.userId, actorUserId: ana.userId },
        base + 10_000,
      ),
    );
});

async function page(session: Session, before?: string) {
  const query = before === undefined ? "" : `?before=${encodeURIComponent(before)}`;
  const response = await apiGet(`/api/notifications${query}`, session.cookie);
  expect(response.status).toBe(200);
  return notificationListResponseSchema.parse(await response.json());
}

async function unreadCount(session: Session) {
  const response = await apiGet("/api/notifications/unread-count", session.cookie);
  expect(response.status).toBe(200);
  return notificationUnreadCountResponseSchema.parse(await response.json()).count;
}

async function walk(session: Session) {
  const pages: Notification[][] = [];
  let before: string | undefined;
  for (;;) {
    const current = await page(session, before);
    pages.push(current);
    const last = current.at(-1);
    if (current.length < NOTIFICATION_PAGE_SIZE || last === undefined) return pages;
    before = notificationCursor(last);
  }
}

describe("401 antes que nada", () => {
  it("sin sesión, la bandeja (también con cursor), el contador y marcar todas son 401", async () => {
    expect((await apiGet("/api/notifications?before=roto")).status).toBe(401);
    expect((await apiGet("/api/notifications/unread-count")).status).toBe(401);
    expect((await apiRequest("POST", "/api/notifications/read-all")).status).toBe(401);
  });
});

describe("GET /api/notifications con cursor", () => {
  it("recorre las 120 en páginas de 50, sin huecos ni repetidas pese a empates", async () => {
    const pages = await walk(luis);
    expect(pages.map((current) => current.length)).toEqual([50, 50, 20]);

    const ids = pages.flat().map((item) => item.id);
    const expected = Array.from(
      { length: LUIS_ROWS },
      (_, index) => `n_${String(index).padStart(3, "0")}`,
    ).reverse();
    expect(ids).toEqual(expected);
    expect(ids).not.toContain(foreignNotificationId);
  });

  it("un cursor más antiguo que todo devuelve []", async () => {
    expect(await page(luis, "2000-01-01T00:00:00.000Z|n_000")).toEqual([]);
  });

  it("un cursor mal formado es 400", async () => {
    for (const before of ["roto", "ayer|n_1", "2026-11-04T10:00:00.000Z|"]) {
      const response = await apiGet(
        `/api/notifications?before=${encodeURIComponent(before)}`,
        luis.cookie,
      );
      expect(response.status).toBe(400);
    }
  });
});

describe("contador y marcar todas", () => {
  it("el contador cuenta todas las no leídas, más de una página", async () => {
    expect(await unreadCount(luis)).toBe(LUIS_ROWS);
    expect(await unreadCount(ana)).toBe(2);
  });

  it("marcar una baja el contador; marcar todas deja 0 y no toca otras bandejas", async () => {
    const [first] = await page(luis);
    if (first === undefined) throw new Error("Luis no tiene menciones");
    const marked = await apiRequest("POST", `/api/notifications/${first.id}/read`, {
      cookie: luis.cookie,
    });
    const markedAt = notificationSchema.parse(await marked.json()).readAt;
    expect(await unreadCount(luis)).toBe(LUIS_ROWS - 1);

    const response = await apiRequest("POST", "/api/notifications/read-all", {
      cookie: luis.cookie,
    });
    expect(response.status).toBe(200);
    expect(notificationReadAllResponseSchema.parse(await response.json())).toEqual({
      updated: LUIS_ROWS - 1,
    });
    expect(await unreadCount(luis)).toBe(0);
    expect((await walk(luis)).flat().every((item) => item.readAt !== null)).toBe(true);
    expect((await page(luis)).find((item) => item.id === first.id)?.readAt).toBe(markedAt);

    // La bandeja de Ana y la fila del workspace que Luis dejó siguen sin leer.
    expect(await unreadCount(ana)).toBe(2);
    const rows = await db
      .select({ id: notification.id, readAt: notification.readAt })
      .from(notification);
    expect(rows.find((item) => item.id === foreignNotificationId)?.readAt).toBeNull();

    const again = await apiRequest("POST", "/api/notifications/read-all", { cookie: luis.cookie });
    expect(notificationReadAllResponseSchema.parse(await again.json())).toEqual({ updated: 0 });
  });
});
