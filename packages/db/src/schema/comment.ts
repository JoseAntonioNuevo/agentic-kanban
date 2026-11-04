/**
 * Comentario de una tarea.
 *
 * Cada fila guarda su `workspace_id` y su `project_id`, copiados de la fila de
 * la tarea por la consulta (nunca del cliente). `author_id` apunta al `user`
 * de Better Auth. Las claves foráneas usan `onDelete: "cascade"`: libSQL las
 * aplica y, sin cascada, borrar una tarea con comentarios fallaría.
 */
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { task } from "./board.ts";
import { project } from "./project.ts";
import { nowMs } from "./timestamps.ts";
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
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs()),
  },
  (table) => [
    index("comment_taskId_createdAt_idx").on(table.taskId, table.createdAt),
    index("comment_workspaceId_idx").on(table.workspaceId),
  ],
);
