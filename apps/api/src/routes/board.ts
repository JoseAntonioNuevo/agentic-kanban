/**
 * Tablero: lectura y escritura de tareas.
 *
 * - `GET /api/projects/:projectId/board`: columnas con tareas por `position`.
 * - `POST /api/projects/:projectId/tasks`: crea al final de la columna.
 * - `PATCH /api/tasks/:taskId`: edita título y/o descripción.
 * - `DELETE /api/tasks/:taskId`: borra y compacta las posiciones.
 * - `POST /api/tasks/:taskId/move`: reordena o mueve a otra columna del mismo project.
 *
 * Todas pasan por `requireSession` y por una consulta `*ForMember`: sin
 * membresía o sin fila responden 404 (nunca 403). Los ids del cliente solo
 * identifican; el `workspace_id` sale siempre de la fila de la base.
 * Input inválido → 400 (`@hono/zod-validator`).
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
  errorResponseSchema,
  moveTaskBodySchema,
  projectIdParamSchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
} from "@agentic-kanban/schemas";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";

import { requireSession, type SessionEnv } from "../middleware/session.ts";

export const boardRoutes = new Hono<SessionEnv>();

/** Serializa una fila de `task` al contrato público (fecha ISO, `.parse()` del schema). */
function toTaskResponse(row: TaskRow) {
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

/** 404 uniforme: no revela si el recurso existe en otro tenant. */
const notFoundBody = () => errorResponseSchema.parse({ error: "No encontrado" });

boardRoutes.get(
  "/api/projects/:projectId/board",
  requireSession,
  zValidator("param", projectIdParamSchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const board = await getBoardForMember(projectId, c.get("userId"));

    if (!board) {
      return c.json(notFoundBody(), 404);
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
          tasks: col.tasks.map(toTaskResponse),
        })),
      }),
    );
  },
);

// La Sesión 3 publicará eventos de tiempo real desde las rutas de escritura.
boardRoutes.post(
  "/api/projects/:projectId/tasks",
  requireSession,
  zValidator("param", projectIdParamSchema),
  zValidator("json", createTaskBodySchema),
  async (c) => {
    const { projectId } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await createTaskForMember({
      projectId,
      userId: c.get("userId"),
      columnId: body.columnId,
      title: body.title,
      description: body.description,
    });

    if (!row) {
      return c.json(notFoundBody(), 404);
    }

    return c.json(toTaskResponse(row), 201);
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
    const row = await updateTaskForMember(taskId, c.get("userId"), body);

    if (!row) {
      return c.json(notFoundBody(), 404);
    }

    return c.json(toTaskResponse(row));
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
      return c.json(notFoundBody(), 404);
    }

    return c.body(null, 204);
  },
);

// La columna destino se valida en la consulta contra el project de la tarea (404 si no).
boardRoutes.post(
  "/api/tasks/:taskId/move",
  requireSession,
  zValidator("param", taskIdParamSchema),
  zValidator("json", moveTaskBodySchema),
  async (c) => {
    const { taskId } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await moveTaskForMember(taskId, c.get("userId"), body);

    if (!row) {
      return c.json(notFoundBody(), 404);
    }

    return c.json(toTaskResponse(row));
  },
);
