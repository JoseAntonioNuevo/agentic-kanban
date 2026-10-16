/**
 * Tablas del tenant: `workspace` y `workspace_member`.
 *
 * El workspace es el tenant; la pertenencia une usuarios de Better Auth con
 * workspaces. Sin `role` (RBAC fuera del curso). Las FK borran en cascada
 * porque libSQL las aplica. Mismo modo de fecha que `auth.ts` (epoch en ms).
 */
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";

export const workspace = sqliteTable("workspace", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const workspaceMember = sqliteTable(
  "workspace_member",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    unique("workspace_member_workspace_user_unique").on(table.workspaceId, table.userId),
    index("workspace_member_user_id_idx").on(table.userId),
  ],
);
