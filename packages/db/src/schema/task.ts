/**
 * Tarea de una column. Toda fila lleva `workspace_id` y `project_id` NOT
 * NULL (los de la column / el project). `position` ordena dentro de la
 * column. `description` es texto libre (puede ser vacío).
 */
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { column } from "./column.ts";
import { project } from "./project.ts";
import { workspace } from "./workspace.ts";

export const task = sqliteTable(
  "task",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    columnId: text("column_id")
      .notNull()
      .references(() => column.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    position: integer("position").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("task_workspace_id_idx").on(table.workspaceId),
    index("task_project_id_idx").on(table.projectId),
    index("task_column_id_position_idx").on(table.columnId, table.position),
  ],
);
