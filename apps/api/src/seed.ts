/**
 * Seed determinista e idempotente del aula.
 *
 * No lo importa el servidor: la API no seedea al arrancar. Usuarios vía
 * `auth.api.signUpEmail` (Better Auth hashea). Tenant vía upsert en
 * `@agentic-kanban/db`. Nunca DELETE masivo. Nunca HTTP a `/api/auth`.
 *
 * Mismo `.db` que migrate. No lo ejecutes con la API del Mac y Compose a
 * la vez.
 */
import {
  findUserIdByEmail,
  upsertProject,
  upsertWorkspace,
  upsertWorkspaceMember,
} from "@agentic-kanban/db";

import { auth } from "./auth/index.ts";

const DEMO_PASSWORD = "Demo1234!";
const DEMO_WORKSPACE_ID = "ws_thepower_demo";
const DEMO_PROJECT_ID = "proj_agentic_kanban";
const ANA_WORKSPACE_ID = "ws_ana_demo";
const ANA_PROJECT_ID = "proj_ana_notes";

const seedHeaders = new Headers({
  origin: "http://localhost:5173",
});

const demoUsers = [
  { name: "Ana", email: "ana@demo.test" },
  { name: "Luis", email: "luis@demo.test" },
] as const;

/**
 * Crea el usuario con Better Auth o reutiliza el `id` si el email ya existe.
 * No INSERT en `user` / `account` y no toca el hash si ya está.
 */
async function ensureUser(name: string, email: string): Promise<string> {
  const existing = await findUserIdByEmail(email);
  if (existing) {
    return existing;
  }

  try {
    const created = await auth.api.signUpEmail({
      body: { name, email, password: DEMO_PASSWORD },
      headers: seedHeaders,
    });
    return created.user.id;
  } catch (error) {
    const raced = await findUserIdByEmail(email);
    if (raced) {
      return raced;
    }
    throw error;
  }
}

async function seed(): Promise<void> {
  const userIds: string[] = [];

  for (const demo of demoUsers) {
    const userId = await ensureUser(demo.name, demo.email);
    userIds.push(userId);
    console.log(`${demo.name} ${demo.email} → ${userId}`);
  }

  await upsertWorkspace({ id: DEMO_WORKSPACE_ID, name: "thePower Demo" });
  await upsertProject({
    id: DEMO_PROJECT_ID,
    workspaceId: DEMO_WORKSPACE_ID,
    name: "Agentic Kanban",
  });

  for (const userId of userIds) {
    await upsertWorkspaceMember({
      workspaceId: DEMO_WORKSPACE_ID,
      userId,
    });
  }

  const anaId = userIds[0];
  if (!anaId) {
    throw new Error("seed: falta el user.id de Ana");
  }

  await upsertWorkspace({ id: ANA_WORKSPACE_ID, name: "Espacio de Ana" });
  await upsertProject({
    id: ANA_PROJECT_ID,
    workspaceId: ANA_WORKSPACE_ID,
    name: "Notas de Ana",
  });
  await upsertWorkspaceMember({
    workspaceId: ANA_WORKSPACE_ID,
    userId: anaId,
  });

  console.log(`workspace ${DEMO_WORKSPACE_ID}`);
  console.log(`project ${DEMO_PROJECT_ID}`);
  console.log(`workspace ${ANA_WORKSPACE_ID} (Ana only)`);
  console.log(`project ${ANA_PROJECT_ID}`);
  console.log(`members ${userIds.length + 1}`);
  console.log(`password ${DEMO_PASSWORD}`);
}

await seed();
