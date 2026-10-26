/**
 * Lectura del tablero y CRUD de tareas.
 *
 * Primero la sesión, después el validador. Sin membresía, o si el recurso
 * no existe, 404: el id del cliente solo identifica. La Sesión 3 publicará
 * eventos desde estas escrituras.
 */
import {
  createTaskForMember,
  deleteTaskForMember,
  getBoardForMember,
  updateTaskForMember,
  type MemberTask,
} from "@agentic-kanban/db";
import {
  boardResponseSchema,
  createTaskBodySchema,
  projectIdParamSchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

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
    const created = await createTaskForMember(
      {
        projectId,
        columnId: body.columnId,
        title: body.title,
        description: body.description ?? "",
      },
      c.get("userId"),
    );

    if (created === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(taskSchema.parse(toTask(created)), 201);
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
    const updated = await updateTaskForMember(taskId, c.get("userId"), body);

    if (updated === undefined) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.json(taskSchema.parse(toTask(updated)), 200);
  },
);

boardRoutes.delete(
  "/api/tasks/:taskId",
  requireSession,
  zValidator("param", taskIdParamSchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const deleted = await deleteTaskForMember(taskId, c.get("userId"));

    if (!deleted) {
      return c.json({ error: "Not found" }, 404);
    }

    return c.body(null, 204);
  },
);
