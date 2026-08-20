/**
 * Tablero y tareas. Sesión → 401; no miembro / no existe → 404.
 * `workspace_id` sale de la fila, nunca del body.
 */
import {
  createTaskForMember,
  deleteTaskForMember,
  getBoardForMember,
  moveTaskForMember,
  updateTaskForMember,
  type TaskRow,
} from "@agentic-kanban/db";
import {
  boardResponseSchema,
  createTaskBodySchema,
  moveTaskBodySchema,
  projectIdParamSchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";
import { publish } from "../realtime/index.ts";

export const boardRoutes = new Hono<SessionEnv>();

function toTaskJson(row: TaskRow) {
  return taskSchema.parse({
    id: row.id,
    workspaceId: row.workspaceId,
    projectId: row.projectId,
    columnId: row.columnId,
    title: row.title,
    description: row.description,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  });
}

boardRoutes.get(
  "/api/projects/:projectId/board",
  requireSession,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const board = await getBoardForMember(projectId, c.get("userId"));

    if (!board) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(
      boardResponseSchema.parse({
        project: {
          id: board.project.id,
          workspaceId: board.project.workspaceId,
          name: board.project.name,
          createdAt: board.project.createdAt.toISOString(),
        },
        columns: board.columns.map((col) => ({
          id: col.id,
          workspaceId: col.workspaceId,
          projectId: col.projectId,
          name: col.name,
          position: col.position,
          createdAt: col.createdAt.toISOString(),
          tasks: col.tasks.map(toTaskJson),
        })),
      }),
    );
  },
);

boardRoutes.post(
  "/api/projects/:projectId/tasks",
  requireSession,
  zValidator("param", projectIdParamSchema),
  zValidator("json", createTaskBodySchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await createTaskForMember({
      id: `task_${crypto.randomUUID()}`,
      projectId,
      columnId: body.columnId,
      title: body.title,
      description: body.description,
      userId: c.get("userId"),
    });

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    const task = toTaskJson(row);
    publish({
      type: "task.created",
      projectId: row.projectId,
      actorUserId: c.get("userId"),
      task,
    });

    return c.json(task, 201);
  },
);

boardRoutes.patch(
  "/api/tasks/:taskId",
  requireSession,
  zValidator("param", taskIdParamSchema),
  zValidator("json", updateTaskBodySchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await updateTaskForMember({
      taskId,
      userId: c.get("userId"),
      title: body.title,
      description: body.description,
    });

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    const task = toTaskJson(row);
    publish({
      type: "task.updated",
      projectId: row.projectId,
      actorUserId: c.get("userId"),
      task,
    });

    return c.json(task);
  },
);

boardRoutes.delete(
  "/api/tasks/:taskId",
  requireSession,
  zValidator("param", taskIdParamSchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const row = await deleteTaskForMember(taskId, c.get("userId"));

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    publish({
      type: "task.deleted",
      projectId: row.projectId,
      actorUserId: c.get("userId"),
      taskId: row.id,
    });

    return c.json(toTaskJson(row));
  },
);

boardRoutes.post(
  "/api/tasks/:taskId/move",
  requireSession,
  zValidator("param", taskIdParamSchema),
  zValidator("json", moveTaskBodySchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await moveTaskForMember({
      taskId,
      userId: c.get("userId"),
      columnId: body.columnId,
      position: body.position,
    });

    if (!row) {
      return c.json({ error: "Not found" }, 404);
    }

    publish({
      type: "task.moved",
      projectId: row.projectId,
      actorUserId: c.get("userId"),
      taskId: row.id,
      columnId: row.columnId,
      position: row.position,
    });

    return c.json(toTaskJson(row));
  },
);
