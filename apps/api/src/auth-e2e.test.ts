/**
 * Test E2E de Better Auth: sign-up, get-session, sign-in, sign-out.
 *
 * Se ejecuta bajo `vp test` contra la instancia real de auth + la base libSQL.
 * Requiere que las migraciones estén aplicadas (`bun run db:migrate`).
 * Usa emails únicos por ejecución para ser idempotente.
 */
import { auth } from "./auth/index.ts";
import { describe, expect, it } from "vite-plus/test";

/** Sufijo único para que cada ejecución cree su propio usuario. */
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `ada-${suffix}@example.com`;
const password = "secure123";
const name = "Ada";

/** Extrae un string de un `unknown` de forma segura. */
function getString(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === "object" && key in obj) {
    const val = (obj as Record<string, unknown>)[key];
    return typeof val === "string" ? val : undefined;
  }
  return undefined;
}

/** Extrae un objeto anidado de un `unknown` de forma segura. */
function getObject(obj: unknown, key: string): unknown {
  if (obj && typeof obj === "object" && key in obj) {
    return (obj as Record<string, unknown>)[key];
  }
  return undefined;
}

/** Lee la cookie de sesión del header set-cookie. */
function extractCookie(res: Response): string {
  const setCookie = res.headers.get("set-cookie");
  return setCookie?.split(";")[0] ?? "";
}

const authHeaders = {
  "content-type": "application/json",
  origin: "http://localhost:5173",
} as const;

describe("Better Auth E2E", () => {
  let cookie = "";

  it("registra un usuario y crea sesión", async () => {
    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email, password, name }),
      }),
    );

    const body: unknown = await res.json();
    cookie = extractCookie(res);

    expect(res.status).toBe(200);
    expect(getString(body, "token")).toBeTruthy();
    expect(res.headers.get("set-cookie")).toBeTruthy();
    expect(getString(getObject(body, "user"), "email")).toBe(email);
  });

  it("devuelve la sesión activa con get-session", async () => {
    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/get-session", {
        method: "GET",
        headers: { cookie, origin: "http://localhost:5173" },
      }),
    );

    const body: unknown = await res.json();

    expect(res.status).toBe(200);
    expect(getObject(body, "session")).toBeTruthy();
    expect(getString(getObject(body, "user"), "email")).toBe(email);
  });

  it("inicia sesión con credenciales correctas", async () => {
    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email, password }),
      }),
    );

    const body: unknown = await res.json();

    expect(res.status).toBe(200);
    expect(getString(body, "token")).toBeTruthy();
  });

  it("rechaza credenciales incorrectas", async () => {
    const res = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-in/email", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email, password: "wrongpassword" }),
      }),
    );

    expect(res.status).not.toBe(200);
  });

  it("cierra sesión y invalida la cookie", async () => {
    const signOutRes = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-out", {
        method: "POST",
        headers: { cookie, origin: "http://localhost:5173" },
      }),
    );

    expect(signOutRes.status).toBe(200);

    const afterLogoutRes = await auth.handler(
      new Request("http://localhost:3000/api/auth/get-session", {
        method: "GET",
        headers: { cookie, origin: "http://localhost:5173" },
      }),
    );

    const body: unknown = await afterLogoutRes.json();

    expect(afterLogoutRes.status).toBe(200);
    expect(body).toBeNull();
  });
});
