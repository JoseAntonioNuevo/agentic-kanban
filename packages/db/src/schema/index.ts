/**
 * Esquema Drizzle del producto.
 *
 * Better Auth: `user`, `session`, `account`, `verification` en `./auth.ts`.
 * Tenant: `workspace`, `workspace_member` en `./workspace.ts`; `project` en
 * `./project.ts`; `column` y `task` en `./column.ts` / `./task.ts`;
 * `comment` y `notification` en `./comment.ts` / `./notification.ts`.
 * Lectura vía helpers en `../queries.ts` (membership + `workspace_id` de
 * la fila). Comment HTTP y menciones sí. Notification: list de campana
 * (recipient + membership) y mark read.
 *
 * `authSchema` se pasa al `drizzleAdapter` de Better Auth. Las tablas de
 * tenant no van ahí.
 */
export { account, session, user, verification } from "./auth.ts";
export { column } from "./column.ts";
export { comment } from "./comment.ts";
export { notification } from "./notification.ts";
export { project } from "./project.ts";
export { task } from "./task.ts";
export { workspace, workspaceMember } from "./workspace.ts";

import { account } from "./auth.ts";
import { session } from "./auth.ts";
import { user } from "./auth.ts";
import { verification } from "./auth.ts";

/** Objeto de tablas que el adapter de Drizzle de Better Auth consume. */
export const authSchema = {
  account,
  session,
  user,
  verification,
};
