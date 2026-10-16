/**
 * API pública del paquete `@agentic-kanban/db`.
 * La API Hono solo entra a la base por aquí: no importes `@libsql/client`
 * ni `drizzle-orm` desde `apps/api`.
 */
export { db, getDb, getLibsql, libsql, pingDatabase } from "./client.ts";
export * as schema from "./schema/index.ts";
export { account, session, user, verification } from "./schema/index.ts";
