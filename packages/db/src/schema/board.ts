/**
 * Tablero de un proyecto: columnas y tareas, con un orden que persiste.
 *
 * Cada fila guarda su `workspace_id` para filtrar por tenant sin fiarse del
 * cliente; la API hará que coincida con el del project. `position` no lleva
 * UNIQUE: reordenar dentro de una transacción rompería la unicidad a mitad
 * de camino. El índice es no único y un CHECK exige un entero ≥ 0. Las
 * claves foráneas usan `onDelete: "cascade"`: libSQL las aplica y, sin
 * cascada, borrar una columna o un project fallaría.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { project } from "./project.ts";
import { nowMs } from "./timestamps.ts";
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
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs()),
  },
  (table) => [
    index("column_projectId_position_idx").on(table.projectId, table.position),
    index("column_workspaceId_idx").on(table.workspaceId),
    check("column_position_nonnegative", sql`${table.position} >= 0`),
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
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs()),
  },
  (table) => [
    index("task_columnId_position_idx").on(table.columnId, table.position),
    index("task_workspaceId_idx").on(table.workspaceId),
    check("task_position_nonnegative", sql`${table.position} >= 0`),
  ],
);
