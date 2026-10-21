/**
 * Tenant del producto: el workspace y quién pertenece a él.
 *
 * `onDelete: "cascade"` evita membresías huérfanas al borrar el workspace o
 * el usuario. No hay `role`: el RBAC queda fuera del curso. La identidad de
 * la membresía es el par `(workspace_id, user_id)`, no una columna `id`.
 */
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { nowMs } from "./timestamps.ts";

export const workspace = sqliteTable("workspace", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs()),
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
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs()),
  },
  (table) => [
    unique("workspace_member_workspace_id_user_id_unique").on(table.workspaceId, table.userId),
    index("workspace_member_userId_idx").on(table.userId),
  ],
);
