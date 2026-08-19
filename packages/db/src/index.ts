/**
 * API pública del paquete `@agentic-kanban/db`.
 * La API Hono solo entra a la base por aquí: no importes `@libsql/client`
 * ni `drizzle-orm` desde `apps/api`.
 */
export { db, getDb, getLibsql, libsql, pingDatabase } from "./client.ts";
export {
  findUserIdByEmail,
  getProjectForMember,
  insertProject,
  insertWorkspace,
  insertWorkspaceMember,
  listWorkspacesForUser,
  upsertProject,
  upsertWorkspace,
  upsertWorkspaceMember,
} from "./queries.ts";
export { authSchema } from "./schema/index.ts";
