/**
 * Tabla `comment`: comentarios de una tarea. Cada fila guarda su propio
 * `workspace_id` (y `project_id`) para filtrar por tenant sin fiarse del
 * cliente; la API garantiza que coincidan con los de la tarea. FK en cascada:
 * borrar una tarea borra sus comentarios.
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { task } from "./board.ts";
import { project } from "./project.ts";
import { workspace } from "./workspace.ts";

export const comment = sqliteTable(
  "comment",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("comment_task_created_idx").on(table.taskId, table.createdAt),
    index("comment_workspace_id_idx").on(table.workspaceId),
    index("comment_project_id_idx").on(table.projectId),
    index("comment_author_id_idx").on(table.authorId),
  ],
);

export type CommentRow = typeof comment.$inferSelect;
