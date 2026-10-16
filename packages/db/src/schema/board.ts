/**
 * Tablas del tablero: `column` y `task`. Cada fila guarda su propio
 * `workspace_id` para filtrar por tenant sin fiarse del cliente (la API
 * garantiza que coincida con el del project). FK en cascada.
 *
 * `position` es un entero >= 0 SIN `UNIQUE`: al reordenar dentro de una
 * transacción la unicidad se rompería a mitad de camino. Por eso los índices
 * por posición son compuestos y no únicos.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("column_project_position_idx").on(table.projectId, table.position),
    index("column_workspace_id_idx").on(table.workspaceId),
    check("column_position_check", sql`${table.position} >= 0`),
  ],
);

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
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("task_column_position_idx").on(table.columnId, table.position),
    index("task_workspace_id_idx").on(table.workspaceId),
    index("task_project_id_idx").on(table.projectId),
    check("task_position_check", sql`${table.position} >= 0`),
  ],
);

export type ColumnRow = typeof column.$inferSelect;
export type TaskRow = typeof task.$inferSelect;
