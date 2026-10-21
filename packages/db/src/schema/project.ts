/**
 * Proyecto de un workspace.
 *
 * `workspace_id` es obligatorio: un proyecto no existe fuera de su tenant.
 * La cascada lo borra con el workspace. El índice sirve al filtro por
 * `workspace_id` autorizado.
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { nowMs } from "./timestamps.ts";
import { workspace } from "./workspace.ts";

export const project = sqliteTable(
  "project",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs()),
  },
  (table) => [index("project_workspaceId_idx").on(table.workspaceId)],
);
