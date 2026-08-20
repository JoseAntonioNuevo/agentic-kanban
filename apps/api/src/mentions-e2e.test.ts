/**
 * Menciones en POST comment: notification + outbox. Sin cambio de contrato HTTP.
 * Fixtures propias y, aparte, el seed de aula (ana@demo.test).
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  findUserIdByEmail,
  insertColumn,
  insertProject,
  insertTask,
  insertWorkspace,
  insertWorkspaceMember,
  listNotificationsByCommentId,
  listNotificationsForRecipient,
} from "@agentic-kanban/db";
import { commentSchema, taskSchema } from "@agentic-kanban/schemas";
import { afterAll, describe, expect, it } from "vite-plus/test";

import { auth } from "./auth/index.ts";
import { app } from "./index.ts";
import { setOutboxPathForTests } from "./mail/outbox.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "secure123";
const demoPassword = "Demo1234!";
const outboxPath = join(mkdtempSync(join(tmpdir(), "kanban-outbox-")), "outbox.jsonl");

setOutboxPathForTests(outboxPath);

afterAll(() => {
  setOutboxPathForTests(undefined);
});

const authHeaders = {
  "content-type": "application/json",
  origin: "http://localhost:5173",
} as const;

function getString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

function getObject(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

function extractCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  return setCookie?.split(";")[0] ?? "";
}

async function signUp(name: string): Promise<{ userId: string; cookie: string; email: string }> {
  const email = `${name.toLowerCase()}-${suffix}@example.com`;
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email, password, name }),
    }),
  );

  const body: unknown = await res.json();
  const userId = getString(getObject(body, "user"), "id");
  const cookie = extractCookie(res);

  if (res.status !== 200 || !userId || !cookie) {
    throw new Error(`sign-up falló para ${name}: ${res.status}`);
  }

  return { userId, cookie, email };
}

async function signInDemo(email: string): Promise<string> {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email, password: demoPassword }),
    }),
  );

  const cookie = extractCookie(res);
  if (res.status !== 200 || !cookie) {
    throw new Error(`sign-in falló para ${email}: ${res.status}. ¿Corriste bun run db:seed?`);
  }

  return cookie;
}

function jsonRequest(method: string, path: string, cookie: string, body?: unknown): Request {
  return new Request(`http://localhost:3000${path}`, {
    method,
    headers: {
      cookie,
      origin: "http://localhost:5173",
      ...(body === undefined ? {} : { "content-type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function readOutbox(): Array<Record<string, unknown>> {
  try {
    return readFileSync(outboxPath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch {
    return [];
  }
}

describe("menciones y outbox en POST comment", () => {
  let ana: { userId: string; cookie: string; email: string };
  let luis: { userId: string; cookie: string; email: string };
  let carlos: { userId: string; cookie: string; email: string };

  const sharedWorkspaceId = `ws_shared_${suffix}`;
  const sharedProjectId = `proj_shared_${suffix}`;
  const sharedColumnId = `col_shared_${suffix}`;
  const sharedTaskId = `task_shared_${suffix}`;

  const anaWorkspaceId = `ws_ana_${suffix}`;
  const anaProjectId = `proj_ana_${suffix}`;
  const anaColumnId = `col_ana_${suffix}`;
  const anaTaskId = `task_ana_${suffix}`;

  it("registra usuarios y siembra fixtures", async () => {
    ana = await signUp("Ana");
    luis = await signUp("Luis");
    carlos = await signUp("Carlos");

    await insertWorkspace({ id: sharedWorkspaceId, name: "Shared" });
    await insertWorkspaceMember({ workspaceId: sharedWorkspaceId, userId: ana.userId });
    await insertWorkspaceMember({ workspaceId: sharedWorkspaceId, userId: luis.userId });
    await insertProject({ id: sharedProjectId, workspaceId: sharedWorkspaceId, name: "Board" });
    await insertColumn({
      id: sharedColumnId,
      workspaceId: sharedWorkspaceId,
      projectId: sharedProjectId,
      name: "To Do",
      position: 0,
    });
    await insertTask({
      id: sharedTaskId,
      workspaceId: sharedWorkspaceId,
      projectId: sharedProjectId,
      columnId: sharedColumnId,
      title: "Tarea compartida",
      position: 0,
    });

    await insertWorkspace({ id: anaWorkspaceId, name: "Ana only" });
    await insertWorkspaceMember({ workspaceId: anaWorkspaceId, userId: ana.userId });
    await insertProject({ id: anaProjectId, workspaceId: anaWorkspaceId, name: "Notes" });
    await insertColumn({
      id: anaColumnId,
      workspaceId: anaWorkspaceId,
      projectId: anaProjectId,
      name: "To Do",
      position: 0,
    });
    await insertTask({
      id: anaTaskId,
      workspaceId: anaWorkspaceId,
      projectId: anaProjectId,
      columnId: anaColumnId,
      title: "Privada",
      position: 0,
    });
  });

  it("Ana @Luis en el board compartido → notification + outbox", async () => {
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${sharedTaskId}/comments`, ana.cookie, {
        body: "@Luis mira esto",
      }),
    );
    const json: unknown = await res.json();
    const comment = commentSchema.parse(json);

    expect(res.status).toBe(201);
    expect(comment.body).toBe("@Luis mira esto");
    expect(json).toEqual(comment);

    const luisNotifs = await listNotificationsForRecipient(luis.userId);
    expect(luisNotifs).toHaveLength(1);
    expect(luisNotifs[0]?.kind).toBe("mention");
    expect(luisNotifs[0]?.recipientUserId).toBe(luis.userId);
    expect(luisNotifs[0]?.actorUserId).toBe(ana.userId);
    expect(luisNotifs[0]?.commentId).toBe(comment.id);
    expect(luisNotifs[0]?.taskId).toBe(sharedTaskId);
    expect(luisNotifs[0]?.workspaceId).toBe(sharedWorkspaceId);
    expect(luisNotifs[0]?.emailTo).toBe(luis.email);
    expect(luisNotifs[0]?.emailSubject).toBe("Ana te mencionó en una tarea");
    expect(luisNotifs[0]?.emailBody).toContain("Tarea compartida");
    expect(luisNotifs[0]?.emailBody).toContain("@Luis mira esto");
    expect(luisNotifs[0]?.emailedAt).toBeInstanceOf(Date);

    const anaNotifs = await listNotificationsForRecipient(ana.userId);
    expect(anaNotifs).toHaveLength(0);

    const lines = readOutbox();
    expect(lines).toHaveLength(1);
    expect(lines[0]?.to).toBe(luis.email);
    expect(lines[0]?.subject).toBe("Ana te mencionó en una tarea");
    expect(lines[0]?.commentId).toBe(comment.id);
    expect(lines[0]?.recipientUserId).toBe(luis.userId);
    expect(typeof lines[0]?.body).toBe("string");
    expect(typeof lines[0]?.sentAt).toBe("string");
  });

  it("Ana @Luis, (coma) también menciona a Luis", async () => {
    const before = await listNotificationsForRecipient(luis.userId);
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${sharedTaskId}/comments`, ana.cookie, {
        body: "@Luis, mira la coma",
      }),
    );
    const comment = commentSchema.parse(await res.json());
    expect(res.status).toBe(201);

    const after = await listNotificationsForRecipient(luis.userId);
    expect(after).toHaveLength(before.length + 1);
    expect(after[after.length - 1]?.commentId).toBe(comment.id);
  });

  it("Ana @Ana no crea notification", async () => {
    const beforeLuis = await listNotificationsForRecipient(luis.userId);
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${sharedTaskId}/comments`, ana.cookie, {
        body: "@Ana me menciono",
      }),
    );
    expect(res.status).toBe(201);
    commentSchema.parse(await res.json());

    expect(await listNotificationsForRecipient(ana.userId)).toHaveLength(0);
    expect(await listNotificationsForRecipient(luis.userId)).toHaveLength(beforeLuis.length);
  });

  it("@NotAMember y @Carlos (no miembro) se ignoran", async () => {
    const beforeLuis = await listNotificationsForRecipient(luis.userId);
    const outboxBefore = readOutbox().length;
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${sharedTaskId}/comments`, ana.cookie, {
        body: "@NotAMember @Carlos hola",
      }),
    );
    expect(res.status).toBe(201);
    commentSchema.parse(await res.json());

    expect(await listNotificationsForRecipient(carlos.userId)).toHaveLength(0);
    expect(await listNotificationsForRecipient(luis.userId)).toHaveLength(beforeLuis.length);
    expect(readOutbox()).toHaveLength(outboxBefore);
  });

  it("Luis @Ana en el workspace solo de Ana → 404 y sin notification", async () => {
    const beforeAna = await listNotificationsForRecipient(ana.userId);
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${anaTaskId}/comments`, luis.cookie, {
        body: "@Ana secreto",
      }),
    );
    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
    expect(await listNotificationsForRecipient(ana.userId)).toHaveLength(beforeAna.length);
  });

  it("@Luis @Luis crea una sola notification", async () => {
    const before = await listNotificationsForRecipient(luis.userId);
    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${sharedTaskId}/comments`, ana.cookie, {
        body: "@Luis @Luis otra vez",
      }),
    );
    const comment = commentSchema.parse(await res.json());
    expect(res.status).toBe(201);

    const after = await listNotificationsForRecipient(luis.userId);
    expect(after).toHaveLength(before.length + 1);
    expect(after[after.length - 1]?.commentId).toBe(comment.id);
  });
});

describe("menciones demo (seed)", () => {
  it("Ana @Luis en proj_agentic_kanban → notification de Luis + outbox", async () => {
    const anaId = await findUserIdByEmail("ana@demo.test");
    const luisId = await findUserIdByEmail("luis@demo.test");
    if (!anaId || !luisId) {
      throw new Error("faltan ana@demo.test / luis@demo.test. ¿Corriste bun run db:seed?");
    }

    const cookie = await signInDemo("ana@demo.test");
    const res = await app.fetch(
      jsonRequest("POST", "/api/tasks/task_write_readme/comments", cookie, {
        body: "@Luis mira esto",
      }),
    );
    const comment = commentSchema.parse(await res.json());
    expect(res.status).toBe(201);

    const rows = await listNotificationsByCommentId(comment.id, comment.workspaceId);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.kind).toBe("mention");
    expect(rows[0]?.recipientUserId).toBe(luisId);
    expect(rows[0]?.actorUserId).toBe(anaId);
    expect(rows[0]?.emailTo).toBe("luis@demo.test");
    expect(rows[0]?.emailedAt).toBeInstanceOf(Date);

    expect(rows.every((row) => row.recipientUserId !== anaId)).toBe(true);

    const line = readOutbox().find((entry) => entry.commentId === comment.id);
    expect(line?.to).toBe("luis@demo.test");
  });

  it("Ana @Pepe no inserta notification", async () => {
    const cookie = await signInDemo("ana@demo.test");
    const res = await app.fetch(
      jsonRequest("POST", "/api/tasks/task_write_readme/comments", cookie, {
        body: "@Pepe hola",
      }),
    );
    const comment = commentSchema.parse(await res.json());
    expect(res.status).toBe(201);
    expect(await listNotificationsByCommentId(comment.id, comment.workspaceId)).toEqual([]);
  });

  it("Ana @Ana (auto) no inserta notification", async () => {
    const cookie = await signInDemo("ana@demo.test");
    const res = await app.fetch(
      jsonRequest("POST", "/api/tasks/task_write_readme/comments", cookie, {
        body: "@Ana nota",
      }),
    );
    const comment = commentSchema.parse(await res.json());
    expect(res.status).toBe(201);
    expect(await listNotificationsByCommentId(comment.id, comment.workspaceId)).toEqual([]);
  });

  it("Ana @Luis en proj_ana_notes no inserta (Luis no es miembro)", async () => {
    const cookie = await signInDemo("ana@demo.test");
    const createRes = await app.fetch(
      jsonRequest("POST", "/api/projects/proj_ana_notes/tasks", cookie, {
        columnId: "ana_col_todo",
        title: `Nota mención ${suffix}`,
      }),
    );
    const task = taskSchema.parse(await createRes.json());
    expect(createRes.status).toBe(201);

    const res = await app.fetch(
      jsonRequest("POST", `/api/tasks/${task.id}/comments`, cookie, {
        body: "@Luis en notas de Ana",
      }),
    );
    const comment = commentSchema.parse(await res.json());
    expect(res.status).toBe(201);
    expect(comment.projectId).toBe("proj_ana_notes");
    expect(await listNotificationsByCommentId(comment.id, comment.workspaceId)).toEqual([]);
  });
});
