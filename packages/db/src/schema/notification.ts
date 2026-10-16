/**
 * Tabla `notification`: avisos persistidos para un usuario. Hoy toda
 * notificación nace de un comentario (`comment_id` NOT NULL) y el único `kind`
 * es `mention`. Guarda el correo que se enviaría (`email_*`) y `emailed_at`
 * (nulo hasta que se envíe). Cada fila lleva su `workspace_id`. FK en cascada:
 * borrar una tarea o un comentario borra sus notificaciones.
 *
 * El `enum` de `kind` solo tipa en TypeScript; la restricción real es el CHECK.
 */
import { sql } from "drizzle-orm";
import { check, index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "./auth.ts";
import { task } from "./board.ts";
import { comment } from "./comment.ts";
import { workspace } from "./workspace.ts";

export const notification = sqliteTable(
  "notification",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    recipientUserId: text("recipient_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: ["mention"] }).notNull(),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    emailTo: text("email_to").notNull(),
    emailSubject: text("email_subject").notNull(),
    emailBody: text("email_body").notNull(),
    emailedAt: integer("emailed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("notification_recipient_created_idx").on(table.recipientUserId, table.createdAt),
    index("notification_workspace_id_idx").on(table.workspaceId),
    index("notification_actor_user_id_idx").on(table.actorUserId),
    index("notification_task_id_idx").on(table.taskId),
    index("notification_comment_id_idx").on(table.commentId),
    check("notification_kind_check", sql`${table.kind} = 'mention'`),
  ],
);

export type NotificationRow = typeof notification.$inferSelect;
