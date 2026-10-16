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
  upsertProject,
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

  // La Sesión 2 añadirá aquí el bloque de columnas y tareas.

  console.log("Seed listo:");
  console.log(`  usuarios: ${ANA.email}, ${LUIS.email} (contraseña ${DEMO_PASSWORD})`);
  console.log(`  ${WS_THEPOWER_DEMO.id}: Ana y Luis -> ${PROJ_AGENTIC_KANBAN.id}`);
  console.log(`  ${WS_ANA_DEMO.id}: solo Ana -> ${PROJ_ANA_NOTES.id}`);
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
