/**
 * Contratos del tablero: GET, CRUD de tareas y movimiento.
 *
 * IDs en JSON son datos, no permiso. La API autoriza con sesión +
 * membership + el `workspace_id` de la fila.
 */
import { z } from "zod";

import { projectSchema } from "./workspace.ts";

export const taskSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  columnId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  position: z.number().int().min(0),
  createdAt: z.iso.datetime(),
});

export const boardColumnSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  name: z.string().min(1),
  position: z.number().int().min(0),
  createdAt: z.iso.datetime(),
  tasks: z.array(taskSchema),
});

export const boardResponseSchema = z.object({
  project: projectSchema,
  columns: z.array(boardColumnSchema),
});

export const taskIdParamSchema = z.object({
  taskId: z.string().min(1),
});

export const createTaskBodySchema = z.object({
  columnId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().default(""),
});

export const updateTaskBodySchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
  })
  .refine((body) => body.title !== undefined || body.description !== undefined, {
    message: "Debe enviarse title o description",
  });

export const moveTaskBodySchema = z.object({
  columnId: z.string().min(1),
  position: z.number().int().min(0),
});

export type Task = z.infer<typeof taskSchema>;
export type BoardColumn = z.infer<typeof boardColumnSchema>;
export type Board = z.infer<typeof boardResponseSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type MoveTaskBody = z.infer<typeof moveTaskBodySchema>;

/**
 * Reordena una tarea en el snapshot del board (posiciones 0..n-1).
 * Lo usa la mutación optimista del cliente; el backend aplica el mismo orden.
 */
export function applyBoardMove(
  board: Board,
  taskId: string,
  destColumnId: string,
  destPosition: number,
): Board {
  const source = board.columns.find((column) => column.tasks.some((task) => task.id === taskId));
  const destExists = board.columns.some((column) => column.id === destColumnId);
  const moving = source?.tasks.find((task) => task.id === taskId);

  if (!source || !destExists || !moving) {
    return board;
  }

  const columns = board.columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => task.id !== taskId),
  }));
  const dest = columns.find((column) => column.id === destColumnId);

  if (!dest) {
    return board;
  }

  const index = Math.max(0, Math.min(destPosition, dest.tasks.length));
  dest.tasks.splice(index, 0, { ...moving, columnId: destColumnId });

  return {
    ...board,
    columns: columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task, position) => ({ ...task, position })),
    })),
  };
}
