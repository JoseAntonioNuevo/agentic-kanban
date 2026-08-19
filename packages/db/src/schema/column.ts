/**
 * Columna de un project. Toda fila lleva `workspace_id` NOT NULL (el del
 * project, no un id que el cliente elija como permiso). `position` ordena
 * las columnas del tablero.
 */
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { project } from "./project.ts";
import { workspace } from "./workspace.ts";

export const column = sqliteTable(
  "column",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("column_workspace_id_idx").on(table.workspaceId),
    index("column_project_id_position_idx").on(table.projectId, table.position),
  ],
);
