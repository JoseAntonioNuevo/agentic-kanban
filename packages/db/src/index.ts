export {
  db,
  ensureForeignKeys,
  getDb,
  getLibsql,
  libsql,
  pingDatabase,
  resetDatabase,
  type AppSchema,
  type Database,
} from "./client.ts";
export {
  DEMO_PROJECT_ID,
  DEMO_PROJECT_NAME,
  DEMO_WORKSPACE_ID,
  DEMO_WORKSPACE_NAME,
} from "./demo.ts";
export { applyMigrations } from "./migrate.ts";
export {
  addMembership,
  findMembership,
  getProjectForWorkspace,
  getProjectInWorkspace,
  getUserByEmail,
  getWorkspace,
  listWorkspacesForUser,
  upsertProject,
  upsertWorkspace,
} from "./queries/workspaces.ts";
export * as schema from "./schema/index.ts";
export {
  account,
  project,
  session,
  user,
  verification,
  workspace,
  workspaceMember,
} from "./schema/index.ts";
