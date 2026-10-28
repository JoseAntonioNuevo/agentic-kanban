/**
 * Lectura del tablero, CRUD de tareas y movimiento dentro del project.
 *
 * Primero la sesión, después el validador. Sin membresía, o si el recurso
 * no existe, 404: el id del cliente solo identifica. Una columna de otro
 * project también es 404.
 *
 * Cada escritura correcta publica su evento en el hub cuando la consulta
 * `ForMember` ya ha devuelto (transacción confirmada) y antes de responder.
 * Un 4xx no publica. La tarea del evento es la misma que la respuesta;
 * `projectId` sale de la fila y `actorUserId` de la sesión.
 */
import {
  createTaskForMember,
  deleteTaskForMember,
  getBoardForMember,
  moveTaskForMember,
  updateTaskForMember,
  type MemberTask,
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

function toTask(row: MemberTask) {
  return {
    id: row.id,
    projectId: row.projectId,
    columnId: row.columnId,
    title: row.title,
    description: row.description,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
  };
}

boardRoutes.get(
  "/api/projects/:projectId/board",
  requireSession,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const board = await getBoardForMember(projectId, c.get("userId"));

    if (board === undefined) {
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
        columns: board.columns.map((item) => ({
          id: item.id,
          projectId: item.projectId,
          name: item.name,
          position: item.position,
          createdAt: item.createdAt.toISOString(),
          tasks: item.tasks.map(toTask),
        })),
      }),
      200,
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
    const userId = c.get("userId");
    const created = await createTaskForMember(
      {
        projectId,
        columnId: body.columnId,
        title: body.title,
        description: body.description ?? "",
      },
      userId,
    );

    if (created === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    const saved = taskSchema.parse(toTask(created));
    publish({ type: "task.created", projectId: saved.projectId, actorUserId: userId, task: saved });

    return c.json(saved, 201);
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
    const userId = c.get("userId");
    const updated = await updateTaskForMember(taskId, userId, body);

    if (updated === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    const saved = taskSchema.parse(toTask(updated));
    publish({ type: "task.updated", projectId: saved.projectId, actorUserId: userId, task: saved });

    return c.json(saved, 200);
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
    const userId = c.get("userId");
    const moved = await moveTaskForMember(taskId, userId, {
      columnId: body.columnId,
      position: body.position,
    });

    if (moved === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    const saved = taskSchema.parse(toTask(moved));
    publish({
      type: "task.moved",
      projectId: saved.projectId,
      actorUserId: userId,
      taskId: saved.id,
      columnId: saved.columnId,
      position: saved.position,
    });

    return c.json(saved, 200);
  },
);

boardRoutes.delete(
  "/api/tasks/:taskId",
  requireSession,
  zValidator("param", taskIdParamSchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const userId = c.get("userId");
    const projectId = await deleteTaskForMember(taskId, userId);

    if (projectId === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    publish({ type: "task.deleted", projectId, actorUserId: userId, taskId });

    return c.body(null, 204);
  },
);
