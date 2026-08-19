import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vite-plus/test";

const FOREIGN_WORKSPACE_ID = "ws_foreign";
const FOREIGN_PROJECT_ID = "proj_foreign";
const OUTSIDER_EMAIL = "outsider@test.local";
const OUTSIDER_PASSWORD = "Outsider1234!";
const ORIGIN = "http://localhost:3000";

let app: Awaited<typeof import("./index.ts")>["app"];
let demoWorkspaceId: string;
let demoProjectId: string;
let tempDir: string;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "kanban-session1-"));
  process.env.DATABASE_URL = `file:${join(tempDir, "test.db")}`;
  process.env.BETTER_AUTH_SECRET = "local-dev-only-change-in-session-1";
  process.env.BETTER_AUTH_URL = ORIGIN;
  process.env.VITEST = "true";

  const api = await import("./index.ts");
  const db = await import("@agentic-kanban/db");
  const { auth } = await import("./auth/index.ts");

  app = api.app;
  demoWorkspaceId = db.DEMO_WORKSPACE_ID;
  demoProjectId = db.DEMO_PROJECT_ID;

  await api.prepareDatabase();

  const outsider = await auth.api.signUpEmail({
    body: {
      name: "Outsider",
      email: OUTSIDER_EMAIL,
      password: OUTSIDER_PASSWORD,
    },
  });

  await db.upsertWorkspace({ id: FOREIGN_WORKSPACE_ID, name: "Foreign Workspace" });
  await db.upsertProject({
    id: FOREIGN_PROJECT_ID,
    workspaceId: FOREIGN_WORKSPACE_ID,
    name: "Foreign Project",
  });
  await db.addMembership({
    workspaceId: FOREIGN_WORKSPACE_ID,
    userId: outsider.user.id,
  });
});

afterAll(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

function cookiesFrom(response: Response): string {
  return response.headers
    .getSetCookie()
    .map((part) => part.split(";")[0])
    .join("; ");
}

async function signIn(email: string, password: string) {
  const response = await app.request("/api/auth/sign-in/email", {
    method: "POST",
    headers: {
      origin: ORIGIN,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  return { response, cookie: cookiesFrom(response) };
}

async function signOut(cookie: string) {
  return app.request("/api/auth/sign-out", {
    method: "POST",
    headers: {
      origin: ORIGIN,
      cookie,
    },
  });
}

describe("health", () => {
  it("still reports api and database ok", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      api: "ok",
      database: "ok",
    });
  });
});

describe("authentication", () => {
  it("rejects an empty sign-in body", async () => {
    const response = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        origin: ORIGIN,
        "content-type": "application/json",
      },
      body: "{}",
    });

    expect(response.status).toBe(400);
  });

  it("rejects invalid credentials", async () => {
    const { response } = await signIn("ana@demo.test", "WrongPassword1!");
    expect(response.status).toBe(401);
  });

  it("creates a session for a demo user", async () => {
    const { response, cookie } = await signIn("ana@demo.test", "Demo1234!");
    expect(response.status).toBe(200);
    expect(cookie).toContain("better-auth");

    const session = await app.request("/api/auth/get-session", {
      headers: { cookie, origin: ORIGIN },
    });
    expect(session.status).toBe(200);
    const body = (await session.json()) as { user?: { email?: string } };
    expect(body.user?.email).toBe("ana@demo.test");
  });

  it("creates a session for Luis", async () => {
    const { response, cookie } = await signIn("luis@demo.test", "Demo1234!");
    expect(response.status).toBe(200);

    const session = await app.request("/api/auth/get-session", {
      headers: { cookie, origin: ORIGIN },
    });
    expect(session.status).toBe(200);
    const body = (await session.json()) as { user?: { email?: string } };
    expect(body.user?.email).toBe("luis@demo.test");
  });

  it("invalidates the session on sign-out", async () => {
    const { cookie } = await signIn("ana@demo.test", "Demo1234!");
    const logout = await signOut(cookie);
    expect(logout.status).toBe(200);

    const workspaces = await app.request("/api/workspaces", {
      headers: { cookie: cookiesFrom(logout) || cookie },
    });
    expect(workspaces.status).toBe(401);
  });
});

describe("workspace authorization", () => {
  it("returns 401 without a session", async () => {
    const response = await app.request(`/api/workspaces/${demoWorkspaceId}`);
    expect(response.status).toBe(401);
  });

  it("returns 400 for an empty workspace path param", async () => {
    const { cookie } = await signIn("ana@demo.test", "Demo1234!");
    const response = await app.request("/api/workspaces/%20%20", {
      headers: { cookie },
    });
    expect(response.status).toBe(400);
  });

  it("lets a registered user with no membership see an empty list", async () => {
    const { auth } = await import("./auth/index.ts");
    await auth.api.signUpEmail({
      body: {
        name: "Pat",
        email: "pat@test.local",
        password: "Pat12345!",
      },
    });

    const { cookie } = await signIn("pat@test.local", "Pat12345!");
    const response = await app.request("/api/workspaces", { headers: { cookie } });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ workspaces: [] });
  });

  it("lets Ana read the demo workspace she belongs to", async () => {
    const { cookie } = await signIn("ana@demo.test", "Demo1234!");
    const list = await app.request("/api/workspaces", { headers: { cookie } });
    expect(list.status).toBe(200);
    const listed = (await list.json()) as {
      workspaces: Array<{ id: string; name: string; project: { name: string } | null }>;
    };
    expect(listed.workspaces).toHaveLength(1);
    expect(listed.workspaces[0]?.name).toBe("thePower Demo");
    expect(listed.workspaces[0]?.project?.name).toBe("Agentic Kanban");

    const detail = await app.request(`/api/workspaces/${demoWorkspaceId}`, {
      headers: { cookie },
    });
    expect(detail.status).toBe(200);
    const workspace = (await detail.json()) as { name: string };
    expect(workspace.name).toBe("thePower Demo");
  });

  it("returns 403 when an authenticated user is not a member", async () => {
    const { cookie } = await signIn(OUTSIDER_EMAIL, OUTSIDER_PASSWORD);
    const response = await app.request(`/api/workspaces/${demoWorkspaceId}`, {
      headers: { cookie },
    });
    expect(response.status).toBe(403);
  });

  it("does not expose another workspace by swapping workspaceId", async () => {
    const { cookie } = await signIn("ana@demo.test", "Demo1234!");
    const response = await app.request(`/api/workspaces/${FOREIGN_WORKSPACE_ID}`, {
      headers: { cookie },
    });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.not.toMatchObject({
      name: "Foreign Workspace",
    });
  });

  it("does not return a project by id alone", async () => {
    const { cookie } = await signIn("ana@demo.test", "Demo1234!");
    const crossTenant = await app.request(
      `/api/workspaces/${demoWorkspaceId}/projects/${FOREIGN_PROJECT_ID}`,
      { headers: { cookie } },
    );
    expect(crossTenant.status).toBe(404);

    const foreignWorkspace = await app.request(
      `/api/workspaces/${FOREIGN_WORKSPACE_ID}/projects/${FOREIGN_PROJECT_ID}`,
      { headers: { cookie } },
    );
    expect(foreignWorkspace.status).toBe(403);
  });

  it("returns the project only when the user can access its workspace", async () => {
    const ana = await signIn("ana@demo.test", "Demo1234!");
    const allowed = await app.request(
      `/api/workspaces/${demoWorkspaceId}/projects/${demoProjectId}`,
      { headers: { cookie: ana.cookie } },
    );
    expect(allowed.status).toBe(200);
    await expect(allowed.json()).resolves.toMatchObject({
      id: demoProjectId,
      workspaceId: demoWorkspaceId,
      name: "Agentic Kanban",
    });

    const outsider = await signIn(OUTSIDER_EMAIL, OUTSIDER_PASSWORD);
    const denied = await app.request(
      `/api/workspaces/${demoWorkspaceId}/projects/${demoProjectId}`,
      { headers: { cookie: outsider.cookie } },
    );
    expect(denied.status).toBe(403);
  });

  it("lets Luis read the demo workspace he belongs to", async () => {
    const { cookie } = await signIn("luis@demo.test", "Demo1234!");
    const list = await app.request("/api/workspaces", { headers: { cookie } });
    expect(list.status).toBe(200);
    const listed = (await list.json()) as {
      workspaces: Array<{ name: string; project: { name: string } | null }>;
    };
    expect(listed.workspaces).toHaveLength(1);
    expect(listed.workspaces[0]?.name).toBe("thePower Demo");
    expect(listed.workspaces[0]?.project?.name).toBe("Agentic Kanban");
  });
});

describe("seed", () => {
  it("converges to the same demo state when run again", async () => {
    const { seedDemoData } = await import("./seed.ts");
    const { getUserByEmail } = await import("@agentic-kanban/db");

    await seedDemoData();
    await seedDemoData();

    const ana = await getUserByEmail("ana@demo.test");
    const luis = await getUserByEmail("luis@demo.test");
    expect(ana).not.toBeNull();
    expect(luis).not.toBeNull();

    const { cookie } = await signIn("ana@demo.test", "Demo1234!");
    const list = await app.request("/api/workspaces", { headers: { cookie } });
    expect(list.status).toBe(200);
    const listed = (await list.json()) as {
      workspaces: Array<{ id: string; name: string }>;
    };
    expect(listed.workspaces).toHaveLength(1);
    expect(listed.workspaces[0]?.name).toBe("thePower Demo");
  });
});
