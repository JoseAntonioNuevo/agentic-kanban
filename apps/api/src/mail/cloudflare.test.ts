/**
 * Transporte de Cloudflare Email Service con `fetch` falso: nada sale a la
 * red. Cubre URL, cabecera, cuerpo, redirección, fallos y el 201 del
 * comentario cuando la entrega falla. Las variables reales las borra el setup.
 */
import { randomUUID } from "node:crypto";

import { getDb, notification } from "@agentic-kanban/db";
import { commentSchema } from "@agentic-kanban/schemas";
import { afterEach, beforeAll, describe, expect, it, vi } from "vite-plus/test";

import {
  addWorkspaceMember,
  apiRequest,
  signUpUser,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
} from "../test/helpers.ts";
import { deliverEmail } from "./index.ts";

const TOKEN = "tok-secreto-de-prueba";
const MAIL_VARS = {
  CLOUDFLARE_ACCOUNT_ID: "acc123",
  CLOUDFLARE_EMAIL_TOKEN: TOKEN,
  MAIL_FROM: "kanban@example.org",
};
const email = {
  notificationId: "not_1",
  to: "luis@demo.test",
  subject: "Asunto <b>",
  text: "Hola <script>& adiós",
};

function setMailEnv(extra: Record<string, string> = {}) {
  for (const [key, value] of Object.entries({ ...MAIL_VARS, ...extra })) {
    vi.stubEnv(key, value);
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const okBody = (delivered: string[], bounces: string[] = []) => ({
  success: true,
  errors: [],
  messages: [],
  result: { delivered, permanent_bounces: bounces, queued: [] },
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("transporte de Cloudflare Email Service", () => {
  it("envía URL, cabecera y cuerpo correctos", async () => {
    setMailEnv();
    const fake = vi.fn(async () => jsonResponse(okBody(["luis@demo.test"])));

    expect(await deliverEmail(email, fake as unknown as typeof fetch)).toBe(true);

    expect(fake).toHaveBeenCalledOnce();
    const [url, init] = fake.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.cloudflare.com/client/v4/accounts/acc123/email/sending/send");
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      from: "kanban@example.org",
      to: "luis@demo.test",
      subject: "Asunto <b>",
      text: "Hola <script>& adiós",
    });
    expect(body.html).toContain("Hola &lt;script&gt;&amp; adiós");
    expect(body.html).not.toContain("<script>");
  });

  it("MAIL_REDIRECT_TO cambia el destinatario e incluye el original", async () => {
    setMailEnv({ MAIL_REDIRECT_TO: "jose@josenuevo.dev" });
    const fake = vi.fn(async () => jsonResponse(okBody(["jose@josenuevo.dev"])));

    expect(await deliverEmail(email, fake as unknown as typeof fetch)).toBe(true);

    const body = JSON.parse(
      (fake.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    );
    expect(body.to).toBe("jose@josenuevo.dev");
    expect(body.text).toContain("luis@demo.test");
    expect(body.html).toContain("luis@demo.test");
  });

  it.each([
    [
      "error HTTP",
      () => jsonResponse({ success: false, errors: [{ code: 1, message: "x" }] }, 403),
    ],
    ["success false", () => jsonResponse({ success: false, errors: [] })],
    ["permanent_bounces", () => jsonResponse(okBody([], ["luis@demo.test"]))],
  ])("%s: devuelve false y no filtra el token", async (_name, respond) => {
    setMailEnv();
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = vi.fn(async () => respond());

    expect(await deliverEmail(email, fake as unknown as typeof fetch)).toBe(false);
    expect(JSON.stringify(logged.mock.calls)).not.toContain(TOKEN);
  });

  it("un fallo de red devuelve false", async () => {
    setMailEnv();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = vi.fn(async () => {
      throw new Error("red caída");
    });
    expect(await deliverEmail(email, fake as unknown as typeof fetch)).toBe(false);
  });

  it.each(Object.keys(MAIL_VARS))("sin %s usa el outbox y no llama a fetch", async (missing) => {
    setMailEnv();
    vi.stubEnv(missing, "");
    const fake = vi.fn();
    vi.stubGlobal("fetch", fake);

    expect(await deliverEmail(email)).toBe(true);
    expect(fake).not.toHaveBeenCalled();
  });
});

describe("comentario con entrega fallida", () => {
  let ana: { cookie: string; userId: string };
  let luis: { cookie: string; userId: string };

  beforeAll(async () => {
    ana = await signUpUser({ name: "Ana", email: `s4-06-ana-${randomUUID()}@example.com` });
    luis = await signUpUser({ name: "Luis", email: `s4-06-luis-${randomUUID()}@example.com` });
  });

  it("responde 201 y deja emailed_at vacío", async () => {
    const id = randomUUID();
    const workspaceId = `ws_s406_${id}`;
    const projectId = `proj_s406_${id}`;
    const columnId = `col_s406_${id}`;
    const taskId = `task_s406_${id}`;
    await upsertWorkspace({ id: workspaceId, name: "Espacio 06" });
    await addWorkspaceMember({ workspaceId, userId: ana.userId });
    await addWorkspaceMember({ workspaceId, userId: luis.userId });
    await upsertProject({ id: projectId, workspaceId, name: "Tablero 06" });
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

    setMailEnv();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fake = vi.fn(async () => jsonResponse({ success: false, errors: [] }, 500));
    vi.stubGlobal("fetch", fake);

    const response = await apiRequest("POST", `/api/tasks/${taskId}/comments`, {
      cookie: ana.cookie,
      body: { body: "@Luis mira esto" },
    });
    expect(response.status).toBe(201);
    const created = commentSchema.parse(await response.json());

    expect(fake).toHaveBeenCalledOnce();
    const rows = (await getDb().select().from(notification)).filter(
      (row) => row.commentId === created.id,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.emailedAt).toBeNull();
  });
});
