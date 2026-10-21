/**
 * Esquema Drizzle del producto.
 *
 * Tablas de Better Auth (`user`, `session`, `account`, `verification`) y
 * de tenant (`workspace`, `workspace_member`, `project`). Cada query de
 * tenant filtrará por el `workspace_id` autorizado.
 */

export * from "./auth.ts";
export * from "./workspace.ts";
export * from "./project.ts";
