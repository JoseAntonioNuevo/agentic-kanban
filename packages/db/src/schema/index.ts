/**
 * Esquema Drizzle del producto.
 *
 * Ya están las tablas de Better Auth (`user`, `session`, `account`,
 * `verification`). Aún no hay workspaces ni tablas de producto. Cuando se
 * añadan, usa `sqliteTable` / `text` / `integer` de `drizzle-orm/sqlite-core`
 * y scopea cada query de tenant con `workspace_id` autorizado.
 */

export * from "./auth.ts";
