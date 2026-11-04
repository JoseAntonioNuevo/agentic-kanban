/**
 * Prueba las tablas `comment` y `notification` contra la libSQL temporal del
 * setup. No usa `data/`.
 */
import { randomUUID } from "node:crypto";

import {
  column,
  comment,
  getDb,
  notification,
  project,
  task,
  user,
  workspace,
} from "@agentic-kanban/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vite-plus/test";

async function seed(label: string) {
  const database = getDb();
  const id = randomUUID();
  const workspaceId = `ws_${label}_${id}`;
  const projectId = `proj_${label}_${id}`;
  const columnId = `col_${label}_${id}`;
  const taskId = `task_${label}_${id}`;
  const authorId = `user_a_${label}_${id}`;
  const recipientId = `user_r_${label}_${id}`;
  const commentId = `comment_${label}_${id}`;

  await database.insert(workspace).values({ id: workspaceId, name: label });
  await database.insert(project).values({ id: projectId, workspaceId, name: label });
  await database
    .insert(column)
    .values({ id: columnId, workspaceId, projectId, name: "To Do", position: 0 });
  await database
    .insert(task)
    .values({ id: taskId, workspaceId, projectId, columnId, title: "T", position: 0 });
  await database.insert(user).values([
    { id: authorId, name: "Autor", email: `${authorId}@example.com` },
    { id: recipientId, name: "Destino", email: `${recipientId}@example.com` },
  ]);
  await database
    .insert(comment)
    .values({ id: commentId, workspaceId, projectId, taskId, authorId, body: "Hola" });
  await database.insert(notification).values({
    id: `notif_${label}_${id}`,
    workspaceId,
    recipientUserId: recipientId,
    actorUserId: authorId,
    taskId,
    commentId,
    kind: "mention",
    emailTo: `${recipientId}@example.com`,
    emailSubject: "Te mencionaron",
    emailBody: "Hola",
  });

  return { database, taskId, commentId, authorId, workspaceId };
}

describe("esquema de comentarios y notificaciones", () => {
  it("aplica created_at como fecha y deja read_at y emailed_at nulos", async () => {
    const { database, commentId } = await seed("defaults");
    const [row] = await database.select().from(comment).where(eq(comment.id, commentId));
    expect(row?.createdAt).toBeInstanceOf(Date);

    const [notice] = await database
      .select()
      .from(notification)
      .where(eq(notification.commentId, commentId));
    expect(notice?.createdAt).toBeInstanceOf(Date);
    expect(notice?.readAt).toBeNull();
    expect(notice?.emailedAt).toBeNull();
  });

  it("borrar la tarea borra sus comentarios y notificaciones", async () => {
    const { database, taskId, commentId } = await seed("task");
    await database.delete(task).where(eq(task.id, taskId));
    expect(await database.select().from(comment).where(eq(comment.id, commentId))).toEqual([]);
    expect(
      await database.select().from(notification).where(eq(notification.commentId, commentId)),
    ).toEqual([]);
  });

  it("borrar el comentario borra su notificación", async () => {
    const { database, commentId } = await seed("comment");
    await database.delete(comment).where(eq(comment.id, commentId));
    expect(
      await database.select().from(notification).where(eq(notification.commentId, commentId)),
    ).toEqual([]);
  });

  it("borrar al autor o el workspace borra sus filas", async () => {
    const byUser = await seed("user");
    await byUser.database.delete(user).where(eq(user.id, byUser.authorId));
    expect(
      await byUser.database.select().from(comment).where(eq(comment.id, byUser.commentId)),
    ).toEqual([]);

    const byWorkspace = await seed("ws");
    await byWorkspace.database.delete(workspace).where(eq(workspace.id, byWorkspace.workspaceId));
    expect(
      await byWorkspace.database
        .select()
        .from(comment)
        .where(eq(comment.id, byWorkspace.commentId)),
    ).toEqual([]);
  });
});
