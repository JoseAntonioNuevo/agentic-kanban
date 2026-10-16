/**
 * API pública del paquete `@agentic-kanban/db`.
 * La API Hono solo entra a la base por aquí: no importes `@libsql/client`
 * ni `drizzle-orm` desde `apps/api`.
 */
export { db, getDb, getLibsql, libsql, pingDatabase } from "./client.ts";
export * as schema from "./schema/index.ts";
export {
  account,
  column,
  comment,
  notification,
  project,
  session,
  task,
  user,
  verification,
  workspace,
  workspaceMember,
} from "./schema/index.ts";
export type { ColumnRow, TaskRow } from "./schema/board.ts";
export type { CommentRow } from "./schema/comment.ts";
export type { NotificationRow } from "./schema/notification.ts";
export { migrateDatabase } from "./migrate.ts";
export {
  createTaskForMember,
  deleteTaskForMember,
  getBoardForMember,
  moveTaskForMember,
  updateTaskForMember,
} from "./queries/board.ts";
export type { BoardColumnWithTasks, BoardData } from "./queries/board.ts";
export { getProjectForMember, listWorkspacesForUser } from "./queries/workspaces.ts";
export type {
  ProjectRow,
  WorkspaceProjectSummary,
  WorkspaceWithProjects,
} from "./queries/workspaces.ts";
export {
  ensureWorkspaceMember,
  findUserIdByEmail,
  upsertColumn,
  upsertProject,
  upsertTask,
  upsertWorkspace,
} from "./queries/seed.ts";
