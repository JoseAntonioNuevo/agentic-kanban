/**
 * Contratos Zod del tablero: columnas, tareas y cuerpos de escritura.
 *
 * `GET /api/projects/:projectId/board` devuelve las columnas ya ordenadas por
 * `position`, cada una con sus tareas. El navegador llama a `.parse()` sobre
 * la respuesta; la API valida con estos mismos schemas los cuerpos y params.
 */
import { z } from "zod";

import { projectSchema } from "./workspace.ts";

/** Título de tarea: sin espacios en los extremos, entre 1 y 200 caracteres. */
const taskTitleSchema = z.string().trim().min(1).max(200);

/** Descripción de tarea: texto libre de hasta 5000 caracteres. */
const taskDescriptionSchema = z.string().max(5000);

/** Tarea de una columna. `position` es entero ≥ 0 y `createdAt` ISO 8601. */
export const taskSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string(),
  description: z.string(),
  position: z.number().int().min(0),
  createdAt: z.iso.datetime(),
});

/** Columna del tablero con sus tareas (ordenadas por `position`). */
export const boardColumnSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string(),
  position: z.number().int().min(0),
  createdAt: z.iso.datetime(),
  tasks: z.array(taskSchema),
});

/** Respuesta del tablero: proyecto y columnas ordenadas por `position`. */
export const boardResponseSchema = z.object({
  project: projectSchema,
  columns: z.array(boardColumnSchema),
});

/** Cuerpo de `POST` de tarea: columna destino, título y descripción opcional. */
export const createTaskBodySchema = z.object({
  columnId: z.string().min(1),
  title: taskTitleSchema,
  description: taskDescriptionSchema.optional(),
});

/** Cuerpo de `PATCH` de tarea: al menos título o descripción. */
export const updateTaskBodySchema = z
  .object({
    title: taskTitleSchema.optional(),
    description: taskDescriptionSchema.optional(),
  })
  .refine((body) => body.title !== undefined || body.description !== undefined, {
    message: "Indica al menos el título o la descripción",
  });

/** Cuerpo de `POST` de mover: columna destino y posición (se acota a `0..n` en la consulta). */
export const moveTaskBodySchema = z.object({
  columnId: z.string().min(1),
  position: z.number().int().min(0),
});

/** Parámetro de ruta `:taskId`. */
export const taskIdParamSchema = z.object({
  taskId: z.string().min(1),
});

export type Task = z.infer<typeof taskSchema>;
export type BoardColumn = z.infer<typeof boardColumnSchema>;
export type BoardResponse = z.infer<typeof boardResponseSchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type MoveTaskBody = z.infer<typeof moveTaskBodySchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
