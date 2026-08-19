/**
 * Fixture del seed de aula: Ana ve dos workspaces, Luis uno.
 * Luis no lee `proj_ana_notes` (404). Requiere `bun run db:seed`.
 */
import { workspaceListResponseSchema } from "@agentic-kanban/schemas";
import { describe, expect, it } from "vite-plus/test";

import { app } from "./index.ts";
import { auth } from "./auth/index.ts";

const password = "Demo1234!";

const authHeaders = {
  "content-type": "application/json",
  origin: "http://localhost:5173",
} as const;

function extractCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  return setCookie?.split(";")[0] ?? "";
}

async function signIn(email: string): Promise<string> {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ email, password }),
    }),
  );

  const cookie = extractCookie(res);
  if (res.status !== 200 || !cookie) {
    throw new Error(
      `sign-in falló para ${email}: ${res.status}. ¿Corriste bun run db:seed?`,
    );
  }

  return cookie;
}

describe("demo tenant (seed)", () => {
  it("Ana lista ws_thepower_demo y ws_ana_demo", async () => {
    const cookie = await signIn("ana@demo.test");
    const res = await app.fetch(
      new Request("http://localhost:3000/api/workspaces", {
        headers: { cookie, origin: "http://localhost:5173" },
      }),
    );
    const ids = workspaceListResponseSchema.parse(await res.json()).map((row) => row.id);

    expect(res.status).toBe(200);
    expect(ids).toContain("ws_thepower_demo");
    expect(ids).toContain("ws_ana_demo");
  });

  it("Luis lista solo ws_thepower_demo", async () => {
    const cookie = await signIn("luis@demo.test");
    const res = await app.fetch(
      new Request("http://localhost:3000/api/workspaces", {
        headers: { cookie, origin: "http://localhost:5173" },
      }),
    );
    const ids = workspaceListResponseSchema.parse(await res.json()).map((row) => row.id);

    expect(res.status).toBe(200);
    expect(ids).toContain("ws_thepower_demo");
    expect(ids).not.toContain("ws_ana_demo");
  });

  it("Luis GET /api/projects/proj_ana_notes → 404", async () => {
    const cookie = await signIn("luis@demo.test");
    const res = await app.fetch(
      new Request("http://localhost:3000/api/projects/proj_ana_notes", {
        headers: { cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(res.status).toBe(404);
    expect(res.status).not.toBe(403);
  });
});
