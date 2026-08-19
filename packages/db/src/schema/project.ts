/**
 * Proyecto de un workspace. Sin columns ni tasks — eso es tablero, más
 * adelante. Toda fila lleva `workspace_id` NOT NULL; las queries de tenant
 * (más adelante) lo usarán como filtro, no el cliente.
 */
import { sql } from "drizzle-orm";
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
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [index("project_workspace_id_idx").on(table.workspaceId)],
);
