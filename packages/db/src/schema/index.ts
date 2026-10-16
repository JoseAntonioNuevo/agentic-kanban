/**
 * Esquema Drizzle del proyecto (lo lee `drizzle-kit` y el adapter de Better Auth).
 *
 * Contiene las tablas de autenticación y las del tenant (`workspace`,
 * `workspace_member`, `project`) y las del tablero (`column`, `task`). Cada query de tenant lleva `workspace_id`.
 */
export * from "./auth.ts";
export * from "./board.ts";
export * from "./project.ts";
export * from "./workspace.ts";
