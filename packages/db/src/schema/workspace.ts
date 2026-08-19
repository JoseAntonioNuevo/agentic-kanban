/**
 * Tenant: workspace y membership.
 *
 * `user` es de Better Auth (`./auth.ts`); no se duplica aquí. Sin `role`,
 * `slug` ni `owner` — RBAC está fuera de alcance. Las queries de tenant
 * (más adelante) filtran por un `workspace_id` autorizado; este archivo
 * solo declara tablas.
 */
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth.ts";

/** Un workspace es el tenant. `id` lo pone quien inserta (seed / API). */
export const workspace = sqliteTable("workspace", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

/**
 * Membresía. Unicidad `(workspace_id, user_id)`. Índice en `user_id` para
 * listar workspaces de un usuario. Sin columna `role`.
 */
export const workspaceMember = sqliteTable(
  "workspace_member",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("workspace_member_workspace_id_user_id_unique").on(table.workspaceId, table.userId),
    index("workspace_member_user_id_idx").on(table.userId),
  ],
);
