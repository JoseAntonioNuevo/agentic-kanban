/**
 * Helpers de los tests de API.
 *
 * El registro pasa por `/api/auth/sign-up/email` con `Origin` de confianza.
 * La cookie se arma desde `set-cookie` y no se imprime. Los fixtures usan
 * las escrituras idempotentes de `@agentic-kanban/db`.
 */
import { addWorkspaceMember, upsertProject, upsertWorkspace } from "@agentic-kanban/db";
import { z } from "zod";

import { app } from "../index.ts";

export { addWorkspaceMember, upsertProject, upsertWorkspace };

const TEST_PASSWORD = "password1";

const signUpResponseSchema = z.object({
  user: z.object({
    id: z.string().min(1),
  }),
});

function setCookieValues(headers: Headers): string[] {
  const getSetCookie = Reflect.get(headers, "getSetCookie");
  if (typeof getSetCookie === "function") {
    const values: unknown = getSetCookie.call(headers);
    if (Array.isArray(values) && values.every((value) => typeof value === "string")) {
      return values;
    }
  }

  const combined = headers.get("set-cookie");
  return combined === null ? [] : [combined];
}

function cookieHeader(headers: Headers): string {
  const pairs = setCookieValues(headers)
    .map((value) => value.split(";", 1)[0]?.trim() ?? "")
    .filter((value) => value.length > 0);

  if (pairs.length === 0) {
    throw new Error("El registro no devolvió cookie de sesión");
  }

  return pairs.join("; ");
}

/** Registra un usuario y devuelve su cookie y su id. */
export async function signUpUser({
  name,
  email,
}: {
  name: string;
  email: string;
}): Promise<{ cookie: string; userId: string }> {
  const response = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: {
      Origin: "http://localhost:5173",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password: TEST_PASSWORD,
    }),
  });

  if (!response.ok) {
    throw new Error(`sign-up respondió ${response.status}`);
  }

  const parsed = signUpResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("El registro no devolvió el usuario");
  }

  return {
    cookie: cookieHeader(response.headers),
    userId: parsed.data.user.id,
  };
}

/** `GET` contra `app`, con cookie si se pasa. */
export async function apiGet(path: string, cookie?: string): Promise<Response> {
  const headers = new Headers();
  if (cookie !== undefined) {
    headers.set("cookie", cookie);
  }

  return await app.request(path, {
    method: "GET",
    headers,
  });
}
