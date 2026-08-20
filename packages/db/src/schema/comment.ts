/**
 * Comentario de un task. Toda fila lleva `workspace_id` y `project_id`
 * NOT NULL (los del task). `author_id` es `user.id` de Better Auth.
 * HTTP: list/create vía `listCommentsForMember` / `createCommentForMember`.
 */
import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { project } from "./project.ts";
import { task } from "./task.ts";
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
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("comment_workspace_id_idx").on(table.workspaceId),
    index("comment_task_id_created_at_idx").on(table.taskId, table.createdAt),
  ],
);
