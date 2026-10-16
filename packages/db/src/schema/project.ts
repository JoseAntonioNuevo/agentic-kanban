/**
 * Tabla `project`: pertenece a un workspace (el tenant), así que toda query
 * debe filtrar por un `workspace_id` autorizado. FK en cascada.
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { workspace } from "./workspace.ts";

export const project = sqliteTable(
  "project",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("project_workspace_id_idx").on(table.workspaceId)],
);
