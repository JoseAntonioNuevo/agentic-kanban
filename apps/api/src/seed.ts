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
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
  upsertWorkspaceMember,
} from "@agentic-kanban/db";

import { auth } from "./auth/index.ts";

const DEMO_PASSWORD = "Demo1234!";
const DEMO_WORKSPACE_ID = "ws_thepower_demo";
const DEMO_PROJECT_ID = "proj_agentic_kanban";
const ANA_WORKSPACE_ID = "ws_ana_demo";
const ANA_PROJECT_ID = "proj_ana_notes";

const DEMO_COLUMNS = [
  { id: "col_todo", name: "To Do", position: 0 },
  { id: "col_in_progress", name: "In Progress", position: 1 },
  { id: "col_done", name: "Done", position: 2 },
] as const;

const DEMO_TASKS = [
  {
    id: "task_write_readme",
    columnId: "col_todo",
    title: "Escribir el README del aula",
    position: 0,
  },
  {
    id: "task_live_demo",
    columnId: "col_todo",
    title: "Preparar la demo en vivo",
    position: 1,
  },
  {
    id: "task_model_board",
    columnId: "col_in_progress",
    title: "Modelar column y task",
    position: 0,
  },
  {
    id: "task_seed_board",
    columnId: "col_in_progress",
    title: "Sembrar el tablero",
    position: 1,
  },
  {
    id: "task_auth_email",
    columnId: "col_done",
    title: "Montar auth con Better Auth",
    position: 0,
  },
  {
    id: "task_tenant_list",
    columnId: "col_done",
    title: "Listar workspaces por membresía",
    position: 1,
  },
] as const;

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

  for (const col of DEMO_COLUMNS) {
    await upsertColumn({
      id: col.id,
      workspaceId: DEMO_WORKSPACE_ID,
      projectId: DEMO_PROJECT_ID,
      name: col.name,
      position: col.position,
    });
  }

  for (const card of DEMO_TASKS) {
    await upsertTask({
      id: card.id,
      workspaceId: DEMO_WORKSPACE_ID,
      projectId: DEMO_PROJECT_ID,
      columnId: card.columnId,
      title: card.title,
      position: card.position,
    });
  }

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

  for (const col of DEMO_COLUMNS) {
    await upsertColumn({
      id: `ana_${col.id}`,
      workspaceId: ANA_WORKSPACE_ID,
      projectId: ANA_PROJECT_ID,
      name: col.name,
      position: col.position,
    });
  }

  console.log(`workspace ${DEMO_WORKSPACE_ID}`);
  console.log(`project ${DEMO_PROJECT_ID}`);
  console.log(`columns ${DEMO_COLUMNS.length} tasks ${DEMO_TASKS.length}`);
  console.log(`workspace ${ANA_WORKSPACE_ID} (Ana only)`);
  console.log(`project ${ANA_PROJECT_ID}`);
  console.log(`members ${userIds.length + 1}`);
  console.log(`password ${DEMO_PASSWORD}`);
}

await seed();
