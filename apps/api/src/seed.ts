/**
 * Seed de aula: datos conocidos y repetibles para demostrar el aislamiento.
 *
 * Determinista e idempotente: se puede ejecutar varias veces sin duplicar
 * filas ni borrar nada. La API nunca lo ejecuta al arrancar; se lanza a mano
 * con `bun run db:seed` (después de migrar). Los usuarios los crea Better Auth
 * (`auth.api.signUpEmail`) y los datos de tenant van por `@agentic-kanban/db`.
 */
import {
  ensureWorkspaceMember,
  findUserIdByEmail,
  getLibsql,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
} from "@agentic-kanban/db";

import { auth } from "./auth/index.ts";

/** Contraseña ficticia de las cuentas demo (solo aula). */
export const DEMO_PASSWORD = "Demo1234!";

export const ANA = { name: "Ana", email: "ana@demo.test" } as const;
export const LUIS = { name: "Luis", email: "luis@demo.test" } as const;

export const WS_THEPOWER_DEMO = { id: "ws_thepower_demo", name: "thePower Demo" } as const;
export const WS_ANA_DEMO = { id: "ws_ana_demo", name: "Espacio de Ana" } as const;
export const PROJ_AGENTIC_KANBAN = {
  id: "proj_agentic_kanban",
  workspaceId: WS_THEPOWER_DEMO.id,
  name: "Agentic Kanban",
} as const;
export const PROJ_ANA_NOTES = {
  id: "proj_ana_notes",
  workspaceId: WS_ANA_DEMO.id,
  name: "Notas de Ana",
} as const;

// Tablero: columnas y tareas de demostración (IDs fijos, posiciones 0..n-1).
const KANBAN_COLUMNS = [
  { id: "col_kanban_todo", name: "To Do", position: 0 },
  { id: "col_kanban_doing", name: "In Progress", position: 1 },
  { id: "col_kanban_done", name: "Done", position: 2 },
] as const;
const ANA_COLUMNS = [
  { id: "col_ana_todo", name: "To Do", position: 0 },
  { id: "col_ana_doing", name: "In Progress", position: 1 },
  { id: "col_ana_done", name: "Done", position: 2 },
] as const;

export const KANBAN_BOARD_COLUMNS = KANBAN_COLUMNS.map((c) => ({
  ...c,
  workspaceId: PROJ_AGENTIC_KANBAN.workspaceId,
  projectId: PROJ_AGENTIC_KANBAN.id,
}));
export const ANA_BOARD_COLUMNS = ANA_COLUMNS.map((c) => ({
  ...c,
  workspaceId: PROJ_ANA_NOTES.workspaceId,
  projectId: PROJ_ANA_NOTES.id,
}));

export const KANBAN_BOARD_TASKS = [
  {
    id: "task_kanban_1",
    columnId: "col_kanban_todo",
    title: "Configurar Better Auth",
    description: "Registro e inicio de sesión con correo y contraseña.",
    position: 0,
  },
  {
    id: "task_kanban_2",
    columnId: "col_kanban_todo",
    title: "Diseñar el modelo multi-tenant",
    description: "Cada fila lleva su workspace_id y la API lo filtra.",
    position: 1,
  },
  {
    id: "task_kanban_3",
    columnId: "col_kanban_doing",
    title: "API del tablero",
    description: "Endpoints para leer columnas y tareas de un project.",
    position: 0,
  },
  {
    id: "task_kanban_4",
    columnId: "col_kanban_doing",
    title: "Drag and drop optimista",
    description: "Mover tarjetas al instante y reconciliar con la API.",
    position: 1,
  },
  {
    id: "task_kanban_5",
    columnId: "col_kanban_done",
    title: "Seed de aula",
    description: "Datos conocidos y repetibles para las demos.",
    position: 0,
  },
].map((t) => ({
  ...t,
  workspaceId: PROJ_AGENTIC_KANBAN.workspaceId,
  projectId: PROJ_AGENTIC_KANBAN.id,
}));
export const ANA_BOARD_TASKS = [
  {
    id: "task_ana_1",
    columnId: "col_ana_todo",
    title: "Repasar apuntes",
    description: "Releer las notas de la última sesión.",
    position: 0,
  },
].map((t) => ({
  ...t,
  workspaceId: PROJ_ANA_NOTES.workspaceId,
  projectId: PROJ_ANA_NOTES.id,
}));

/** Devuelve el `user.id` del email; si no existe, lo registra con Better Auth. */
async function ensureUser(input: { name: string; email: string }): Promise<string> {
  const existing = await findUserIdByEmail(input.email);
  if (existing) {
    return existing;
  }

  const result = await auth.api.signUpEmail({
    body: { name: input.name, email: input.email, password: DEMO_PASSWORD },
  });
  return result.user.id;
}

async function seed(): Promise<void> {
  // Usuarios
  const anaId = await ensureUser(ANA);
  const luisId = await ensureUser(LUIS);

  // Tenants: workspaces, projects y membresías
  await upsertWorkspace(WS_THEPOWER_DEMO);
  await upsertWorkspace(WS_ANA_DEMO);
  await upsertProject(PROJ_AGENTIC_KANBAN);
  await upsertProject(PROJ_ANA_NOTES);
  await ensureWorkspaceMember(WS_THEPOWER_DEMO.id, anaId);
  await ensureWorkspaceMember(WS_THEPOWER_DEMO.id, luisId);
  await ensureWorkspaceMember(WS_ANA_DEMO.id, anaId);

  // Tablero: columnas y tareas (las columnas antes, por la FK de las tareas)
  for (const col of [...KANBAN_BOARD_COLUMNS, ...ANA_BOARD_COLUMNS]) {
    await upsertColumn(col);
  }
  for (const item of [...KANBAN_BOARD_TASKS, ...ANA_BOARD_TASKS]) {
    await upsertTask(item);
  }

  console.log("Seed listo:");
  console.log(`  usuarios: ${ANA.email}, ${LUIS.email} (contraseña ${DEMO_PASSWORD})`);
  console.log(`  ${WS_THEPOWER_DEMO.id}: Ana y Luis -> ${PROJ_AGENTIC_KANBAN.id}`);
  console.log(`  ${WS_ANA_DEMO.id}: solo Ana -> ${PROJ_ANA_NOTES.id}`);
  console.log(
    `  tablero ${PROJ_AGENTIC_KANBAN.id}: ${KANBAN_BOARD_COLUMNS.length} columnas, ${KANBAN_BOARD_TASKS.length} tareas`,
  );
  console.log(
    `  tablero ${PROJ_ANA_NOTES.id}: ${ANA_BOARD_COLUMNS.length} columnas, ${ANA_BOARD_TASKS.length} tarea`,
  );
}

// Solo se ejecuta como script (`bun run db:seed`): importar sus constantes
// desde un test no lanza el seed.
if (import.meta.main) {
  try {
    await seed();
  } catch (error) {
    console.error("El seed ha fallado:", error);
    process.exitCode = 1;
  } finally {
    // Cierra el cliente para que el proceso termine.
    getLibsql().close();
  }
}
