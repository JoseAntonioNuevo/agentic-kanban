/**
 * Esquema Drizzle del proyecto (lo lee `drizzle-kit` y el adapter de Better Auth).
 *
 * Hoy solo contiene las tablas de autenticación. Los workspaces y el producto
 * llegarán en sesiones posteriores; cada query de tenant llevará `workspace_id`.
 */
export * from "./auth.ts";
