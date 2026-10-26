/**
 * API pública del paquete `@agentic-kanban/db`.
 * La API Hono solo entra a la base por aquí: no importes `@libsql/client`
 * ni `drizzle-orm` desde `apps/api`.
 *
 * El esquema, las lecturas autorizadas y las escrituras del seed y del
 * tablero se reexportan. `migrateDatabase` aplica las migraciones; lo usa
 * el arnés de tests, no el arranque de la API. Importar el paquete no abre
 * la base: `db` sigue siendo el proxy lazy de `client.ts`.
 */
export {
  createTaskForMember,
  deleteTaskForMember,
  getBoardForMember,
  updateTaskForMember,
  upsertColumn,
  upsertTask,
  type BoardForMember,
  type MemberTask,
} from "./queries/board.ts";
export { db, getDb, getLibsql, libsql, pingDatabase } from "./client.ts";
export { migrateDatabase } from "./migrate.ts";
export { getProjectForMember, upsertProject } from "./queries/project.ts";
export { findUserIdByEmail } from "./queries/user.ts";
export { addWorkspaceMember, listWorkspacesForUser, upsertWorkspace } from "./queries/workspace.ts";
export * from "./schema/index.ts";
