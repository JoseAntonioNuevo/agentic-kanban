/**
 * Seed de aula. No lo importa `index.ts`: la API no seedea al arrancar.
 *
 * Cada bloque hace upsert por id. Una segunda ejecución no duplica filas
 * ni cambia `created_at`. Contraseña ficticia, solo para el aula; no se imprime.
 */
import {
  addWorkspaceMember,
  findUserIdByEmail,
  getLibsql,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
} from "@agentic-kanban/db";
import { isAPIError } from "better-auth/api";

import { auth } from "./auth/index.ts";

const DEMO_PASSWORD = "Demo1234!";

function isExistingEmailError(error: unknown): boolean {
  return (
    isAPIError(error) &&
    error.status === "UNPROCESSABLE_ENTITY" &&
    error.body?.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"
  );
}

/** Registra el usuario o, si el email ya existe, reutiliza su id. */
async function ensureUser(name: string, email: string): Promise<string> {
  const normalizedEmail = email.toLowerCase();

  try {
    const created = await auth.api.signUpEmail({
      body: {
        name,
        email: normalizedEmail,
        password: DEMO_PASSWORD,
      },
    });
    return created.user.id;
  } catch (error) {
    if (!isExistingEmailError(error)) {
      throw error;
    }

    const userId = await findUserIdByEmail(normalizedEmail);
    if (userId === undefined) {
      throw error;
    }

    return userId;
  }
}

function closeDatabase(): void {
  try {
    getLibsql().close();
  } catch {
    // Si el fallo fue antes de abrir el fichero, no hay handle que cerrar.
  }
}

async function seed(): Promise<void> {
  // 1. usuarios
  const anaId = await ensureUser("Ana", "ana@demo.test");
  const luisId = await ensureUser("Luis", "luis@demo.test");

  // 2. workspaces y membresías
  await upsertWorkspace({ id: "ws_thepower_demo", name: "thePower Demo" });
  await upsertWorkspace({ id: "ws_ana_demo", name: "Espacio de Ana" });
  await addWorkspaceMember({ workspaceId: "ws_thepower_demo", userId: anaId });
  await addWorkspaceMember({ workspaceId: "ws_thepower_demo", userId: luisId });
  await addWorkspaceMember({ workspaceId: "ws_ana_demo", userId: anaId });

  // 3. projects
  await upsertProject({
    id: "proj_agentic_kanban",
    workspaceId: "ws_thepower_demo",
    name: "Agentic Kanban",
  });
  await upsertProject({
    id: "proj_ana_notes",
    workspaceId: "ws_ana_demo",
    name: "Notas de Ana",
  });

  // 4. columnas y tareas. task_kanban_1 nace en To Do.
  await upsertColumn({
    id: "col_kanban_todo",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    name: "To Do",
    position: 0,
  });
  await upsertColumn({
    id: "col_kanban_doing",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    name: "In Progress",
    position: 1,
  });
  await upsertColumn({
    id: "col_kanban_done",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    name: "Done",
    position: 2,
  });
  await upsertTask({
    id: "task_kanban_1",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    columnId: "col_kanban_todo",
    title: "Definir columnas y tareas",
    description: "",
    position: 0,
  });
  await upsertTask({
    id: "task_kanban_2",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    columnId: "col_kanban_todo",
    title: "Sembrar el tablero",
    description: "",
    position: 1,
  });
  await upsertTask({
    id: "task_kanban_3",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    columnId: "col_kanban_doing",
    title: "Leer el tablero",
    description: "",
    position: 0,
  });
  await upsertTask({
    id: "task_kanban_4",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    columnId: "col_kanban_doing",
    title: "Mover dentro del project",
    description: "",
    position: 1,
  });
  await upsertTask({
    id: "task_kanban_5",
    workspaceId: "ws_thepower_demo",
    projectId: "proj_agentic_kanban",
    columnId: "col_kanban_done",
    title: "Comprobar el health",
    description: "",
    position: 0,
  });

  await upsertColumn({
    id: "col_ana_todo",
    workspaceId: "ws_ana_demo",
    projectId: "proj_ana_notes",
    name: "To Do",
    position: 0,
  });
  await upsertColumn({
    id: "col_ana_doing",
    workspaceId: "ws_ana_demo",
    projectId: "proj_ana_notes",
    name: "In Progress",
    position: 1,
  });
  await upsertColumn({
    id: "col_ana_done",
    workspaceId: "ws_ana_demo",
    projectId: "proj_ana_notes",
    name: "Done",
    position: 2,
  });
  await upsertTask({
    id: "task_ana_1",
    workspaceId: "ws_ana_demo",
    projectId: "proj_ana_notes",
    columnId: "col_ana_todo",
    title: "Nota privada de Ana",
    description: "",
    position: 0,
  });
}

try {
  await seed();
  closeDatabase();
} catch (error) {
  const message = error instanceof Error ? error.message : "seed falló";
  console.error(message);
  closeDatabase();
  process.exit(1);
}
