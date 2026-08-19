/**
 * Esquema Drizzle del producto.
 *
 * Better Auth: `user`, `session`, `account`, `verification` en `./auth.ts`.
 * Tenant: `workspace`, `workspace_member` en `./workspace.ts`; `project` en
 * `./project.ts`. No hay columns ni tasks. Lectura vía `listWorkspacesForUser`
 * / `getProjectForMember` en `../queries.ts`. No hay CRUD de tablero.
 *
 * `authSchema` se pasa al `drizzleAdapter` de Better Auth. Las tablas de
 * tenant no van ahí.
 */
export { account, session, user, verification } from "./auth.ts";
export { project } from "./project.ts";
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
