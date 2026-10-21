/**
 * API pública del paquete `@agentic-kanban/db`.
 * La API Hono solo entra a la base por aquí: no importes `@libsql/client`
 * ni `drizzle-orm` desde `apps/api`.
 *
 * El esquema y las escrituras del seed se reexportan. Importar el paquete
 * no abre la base: `db` sigue siendo el proxy lazy de `client.ts`.
 */
export { db, getDb, getLibsql, libsql, pingDatabase } from "./client.ts";
export { upsertProject } from "./queries/project.ts";
export { findUserIdByEmail } from "./queries/user.ts";
export { addWorkspaceMember, upsertWorkspace } from "./queries/workspace.ts";
export * from "./schema/index.ts";
