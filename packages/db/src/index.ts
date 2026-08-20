/**
 * API pública del paquete `@agentic-kanban/db`.
 * La API Hono solo entra a la base por aquí: no importes `@libsql/client`
 * ni `drizzle-orm` desde `apps/api`.
 */
export { db, getDb, getLibsql, libsql, pingDatabase } from "./client.ts";
export {
  createTaskForMember,
  deleteTaskForMember,
  findUserIdByEmail,
  getBoardForMember,
  getColumnForProjectMember,
  getProjectForMember,
  getTaskForMember,
  insertColumn,
  insertProject,
  insertTask,
  insertWorkspace,
  insertWorkspaceMember,
  listWorkspacesForUser,
  moveTaskForMember,
  updateTaskForMember,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
  upsertWorkspaceMember,
} from "./queries.ts";
export type { BoardRow, ColumnRow, ProjectRow, TaskRow, WorkspaceRow } from "./queries.ts";
export { authSchema } from "./schema/index.ts";
