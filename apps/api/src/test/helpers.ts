/**
 * Helpers compartidos de los tests de API: registro de usuarios con cookie de
 * sesión, fixtures de workspace/membresía/project y peticiones contra `app`.
 */
import {
  getDb,
  project,
  upsertColumn,
  upsertTask,
  workspace,
  workspaceMember,
} from "@agentic-kanban/db";
import { randomUUID } from "node:crypto";
import { z } from "zod";

import { app } from "../index.ts";

/** Origen de confianza: Better Auth rechaza POST con cookie sin él. */
export const TEST_ORIGIN = "http://localhost:5173";

const SESSION_COOKIE = "better-auth.session_token";

const signUpResponseSchema = z.object({
  user: z.object({ id: z.string().min(1) }),
});

export type SignedUpUser = { userId: string; email: string; cookie: string };

/** Registra un usuario (email único por defecto) y devuelve su cookie de sesión. */
export async function signUpUser(
  overrides: { name?: string; email?: string; password?: string } = {},
): Promise<SignedUpUser> {
  const email = overrides.email ?? `user-${randomUUID()}@example.test`;
  const response = await app.request("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json", origin: TEST_ORIGIN },
    body: JSON.stringify({
      name: overrides.name ?? "Usuario de prueba",
      email,
      password: overrides.password ?? "contrasena-de-prueba-123",
    }),
  });

  if (!response.ok) {
    throw new Error(`Registro fallido (${response.status}): ${await response.text()}`);
  }

  // Del Set-Cookie solo interesa `nombre=valor`, sin atributos.
  const setCookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`));

  if (!setCookie) {
    throw new Error(`El registro no devolvió la cookie ${SESSION_COOKIE}`);
  }

  const { user } = signUpResponseSchema.parse(await response.json());
  const cookie = setCookie.split(";")[0] ?? setCookie;

  return { userId: user.id, email, cookie };
}

/** Crea un workspace con sus miembros y projects directamente en la base. */
export async function createWorkspaceFixture(input: {
  name: string;
  memberUserIds: string[];
  projects?: string[];
}): Promise<{ workspaceId: string; projectIds: string[] }> {
  const db = getDb();
  const workspaceId = randomUUID();

  await db.insert(workspace).values({ id: workspaceId, name: input.name });

  if (input.memberUserIds.length > 0) {
    await db
      .insert(workspaceMember)
      .values(input.memberUserIds.map((userId) => ({ workspaceId, userId })));
  }

  const projectIds = (input.projects ?? []).map(() => randomUUID());

  if (projectIds.length > 0) {
    await db.insert(project).values(
      projectIds.map((id, index) => ({
        id,
        workspaceId,
        name: input.projects?.[index] ?? "Project",
      })),
    );
  }

  return { workspaceId, projectIds };
}

/**
 * Crea columnas y tareas de un project directamente en la base, con ids
 * aleatorios y posiciones 0..n-1 según el orden recibido.
 */
export async function createBoardFixture(input: {
  workspaceId: string;
  projectId: string;
  columns: { name: string; tasks?: string[] }[];
}): Promise<{ columnIds: string[]; taskIds: string[][] }> {
  const columnIds: string[] = [];
  const taskIds: string[][] = [];

  for (const [columnIndex, columnInput] of input.columns.entries()) {
    const columnId = randomUUID();

    await upsertColumn({
      id: columnId,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      name: columnInput.name,
      position: columnIndex,
    });

    const ids: string[] = [];

    for (const [taskIndex, title] of (columnInput.tasks ?? []).entries()) {
      const taskId = randomUUID();

      await upsertTask({
        id: taskId,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        columnId,
        title,
        description: "",
        position: taskIndex,
      });
      ids.push(taskId);
    }

    columnIds.push(columnId);
    taskIds.push(ids);
  }

  return { columnIds, taskIds };
}

/** Petición contra `app` con la cookie de sesión (o sin ella si es `null`). */
export function requestAs(
  cookie: string | null,
  path: string,
  init: RequestInit = {},
): Response | Promise<Response> {
  const headers = new Headers(init.headers);

  if (cookie) {
    headers.set("cookie", cookie);
  }

  return app.request(path, { ...init, headers });
}
