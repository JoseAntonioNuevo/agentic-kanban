/**
 * Contratos Zod del tablero y del CRUD de tareas.
 *
 * Las fechas viajan como string ISO. Columnas y tareas van ordenadas por
 * `position`. El cliente no manda `workspaceId`: la API lo toma de la fila.
 */
import { z } from "zod";

import { projectSchema } from "./workspace.ts";

const positionSchema = z.int().min(0);

/** Tarea tal como la devuelve la API. */
export const taskSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  position: positionSchema,
  createdAt: z.iso.datetime(),
});

export type Task = z.infer<typeof taskSchema>;

/** Columna del tablero, con sus tareas. */
export const boardColumnSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  position: positionSchema,
  createdAt: z.iso.datetime(),
  tasks: z.array(taskSchema),
});

export type BoardColumn = z.infer<typeof boardColumnSchema>;

/** Cuerpo de `GET /api/projects/:projectId/board`. */
export const boardResponseSchema = z.object({
  project: projectSchema,
  columns: z.array(boardColumnSchema),
});

export type BoardResponse = z.infer<typeof boardResponseSchema>;

/** Body de `POST /api/projects/:projectId/tasks`. */
export const createTaskBodySchema = z.object({
  columnId: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;

/**
 * Body de `PATCH /api/tasks/:taskId`.
 * Título y descripción son opcionales, pero hace falta al menos uno.
 */
export const updateTaskBodySchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(5000).optional(),
  })
  .refine((value) => value.title !== undefined || value.description !== undefined);

export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;

/** Param `taskId` de `PATCH` y `DELETE /api/tasks/:taskId`. */
export const taskIdParamSchema = z.object({
  taskId: z.string().min(1),
});

export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
