/**
 * Authz de lectura: 401 sin cookie, lista vacía o propia, 404 si no es
 * miembro (nunca 403). Usa `auth.handler` para crear usuarios (sin pasar
 * por el rate limiter) y `app.fetch` para los GET de workspace/project.
 *
 * Un project ajeno debe ser 404 aunque el id exista.
 */
import {
  insertProject,
  insertWorkspace,
  insertWorkspaceMember,
} from "@agentic-kanban/db";
import { projectSchema, workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { app } from "./index.ts";
import { auth } from "./auth/index.ts";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "secure123";

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

async function signUp(name: string): Promise<{ userId: string; cookie: string }> {
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

  return { userId, cookie };
}

describe("workspace/project authz", () => {
  let ana: { userId: string; cookie: string };
  let luis: { userId: string; cookie: string };
  const workspaceId = `ws_${suffix}`;
  const projectId = `proj_${suffix}`;
  const foreignProjectId = `proj_foreign_${suffix}`;

  it("registra dos usuarios", async () => {
    ana = await signUp("Ana");
    luis = await signUp("Luis");
  });

  it("GET /api/workspaces sin cookie → 401", async () => {
    const res = await app.fetch(new Request("http://localhost:3000/api/workspaces"));
    expect(res.status).toBe(401);
  });

  it("GET /api/projects/:id sin cookie → 401", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${projectId}`),
    );
    expect(res.status).toBe(401);
  });

  it("GET /api/workspaces con sesión y sin membership → lista vacía", async () => {
    const res = await app.fetch(
      new Request("http://localhost:3000/api/workspaces", {
        headers: { cookie: ana.cookie, origin: "http://localhost:5173" },
      }),
    );
    const body: unknown = await res.json();

    expect(res.status).toBe(200);
    expect(workspaceListResponseSchema.parse(body)).toEqual([]);
  });

  it("lista solo los workspaces propios tras ser miembro", async () => {
    await insertWorkspace({ id: workspaceId, name: "Ana Space" });
    await insertWorkspaceMember({ workspaceId, userId: ana.userId });
    await insertProject({ id: projectId, workspaceId, name: "Ana Board" });

    const foreignWorkspaceId = `ws_foreign_${suffix}`;
    await insertWorkspace({ id: foreignWorkspaceId, name: "Ajeno" });
    await insertWorkspaceMember({ workspaceId: foreignWorkspaceId, userId: luis.userId });
    await insertProject({
      id: foreignProjectId,
      workspaceId: foreignWorkspaceId,
      name: "Luis Board",
    });

    const anaRes = await app.fetch(
      new Request("http://localhost:3000/api/workspaces", {
        headers: { cookie: ana.cookie, origin: "http://localhost:5173" },
      }),
    );
    const anaBody: unknown = await anaRes.json();

    expect(anaRes.status).toBe(200);
    const anaList = workspaceListResponseSchema.parse(anaBody);
    const anaIds = anaList.map((row) => row.id);
    expect(anaIds).toContain(workspaceId);
    expect(anaIds).not.toContain(foreignWorkspaceId);

    const luisRes = await app.fetch(
      new Request("http://localhost:3000/api/workspaces", {
        headers: { cookie: luis.cookie, origin: "http://localhost:5173" },
      }),
    );
    const luisBody: unknown = await luisRes.json();
    const luisIds = workspaceListResponseSchema.parse(luisBody).map((row) => row.id);

    expect(luisRes.status).toBe(200);
    expect(luisIds).toContain(foreignWorkspaceId);
    expect(luisIds).not.toContain(workspaceId);
  });

  it("GET /api/projects/:id miembro → el project", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${projectId}`, {
        headers: { cookie: ana.cookie, origin: "http://localhost:5173" },
      }),
    );
    const body = projectSchema.parse(await res.json());

    expect(res.status).toBe(200);
    expect(body.id).toBe(projectId);
    expect(body.workspaceId).toBe(workspaceId);
    expect(body.name).toBe("Ana Board");
  });

  it("GET /api/projects/:id si no es miembro → 404 (nunca 403)", async () => {
    const res = await app.fetch(
      new Request(`http://localhost:3000/api/projects/${projectId}`, {
        headers: { cookie: luis.cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });

  it("GET /api/projects/:id inexistente → 404", async () => {
    const res = await app.fetch(
      new Request("http://localhost:3000/api/projects/proj_no_existe", {
        headers: { cookie: ana.cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(res.status).toBe(404);
  });
});
