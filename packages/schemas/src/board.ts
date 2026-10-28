/**
 * Contratos Zod del tablero y del CRUD de tareas.
 *
 * Las fechas viajan como string ISO. Columnas y tareas van ordenadas por
 * `position`. El cliente no manda `workspaceId`: la API lo toma de la fila.
 */
import { z } from "zod";

import type { BoardEvent } from "./events.ts";
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

/** Param `taskId` de `PATCH`, `DELETE` y `POST /api/tasks/:taskId/move`. */
export const taskIdParamSchema = z.object({
  taskId: z.string().min(1),
});

export type TaskIdParam = z.infer<typeof taskIdParamSchema>;

/**
 * Body de `POST /api/tasks/:taskId/move`.
 * `position` es el índice en la columna destino después de sacar la tarea.
 */
export const moveTaskBodySchema = z.object({
  columnId: z.string().min(1),
  position: positionSchema,
});

export type MoveTaskBody = z.infer<typeof moveTaskBodySchema>;

/** Movimiento que comparten `applyBoardMove` y `POST /api/tasks/:taskId/move`. */
export type BoardMove = { taskId: string } & MoveTaskBody;

/**
 * Aplica en memoria el mismo orden que el movimiento del servidor.
 *
 * Saca la tarea, la inserta en `position` acotada a `0..n` (índice en el
 * destino ya sin ella) y renumera `0..n-1` las columnas afectadas. Si la
 * tarea o la columna no están en el board, o la tarea ya está en ese sitio,
 * devuelve la misma referencia.
 */
export function applyBoardMove(board: BoardResponse, move: BoardMove): BoardResponse {
  const sourceColumn = board.columns.find((column) =>
    column.tasks.some((task) => task.id === move.taskId),
  );
  const task = sourceColumn?.tasks.find((item) => item.id === move.taskId);
  const targetColumn = board.columns.find((column) => column.id === move.columnId);

  if (sourceColumn === undefined || task === undefined || targetColumn === undefined) {
    return board;
  }

  const placed = insertTask(targetColumn.tasks, task, targetColumn.id, move.position);

  if (targetColumn.id === sourceColumn.id && sameTasks(placed, targetColumn.tasks)) {
    return board;
  }

  return {
    ...board,
    columns: board.columns.map((column) => {
      if (column.id === targetColumn.id) {
        return { ...column, tasks: placed };
      }

      if (column.id === sourceColumn.id) {
        return { ...column, tasks: compactColumn(column.tasks, task.id) };
      }

      return column;
    }),
  };
}

/**
 * Aplica a la caché un anuncio del canal del proyecto.
 *
 * Es idempotente: si no hay nada que cambiar (tarea ya creada, borrada o con
 * esos valores, columna o tarea ausentes, otro proyecto) devuelve la misma
 * referencia. `task.updated` no mueve la tarea; `task.moved` reutiliza
 * `applyBoardMove` con la columna y la posición finales.
 */
export function applyBoardEvent(board: BoardResponse, event: BoardEvent): BoardResponse {
  if (event.projectId !== board.project.id) {
    return board;
  }

  switch (event.type) {
    case "task.created": {
      const exists = board.columns.some((column) =>
        column.tasks.some((task) => task.id === event.task.id),
      );
      const targetColumn = board.columns.find((column) => column.id === event.task.columnId);
      if (exists || targetColumn === undefined) {
        return board;
      }

      const placed = insertTask(
        targetColumn.tasks,
        event.task,
        targetColumn.id,
        event.task.position,
      );
      return replaceColumnTasks(board, targetColumn.id, placed);
    }

    case "task.updated": {
      const column = findTaskColumn(board, event.task.id);
      const task = column?.tasks.find((item) => item.id === event.task.id);
      if (
        column === undefined ||
        task === undefined ||
        (task.title === event.task.title && task.description === event.task.description)
      ) {
        return board;
      }

      return replaceColumnTasks(
        board,
        column.id,
        column.tasks.map((item) =>
          item.id === task.id
            ? { ...item, title: event.task.title, description: event.task.description }
            : item,
        ),
      );
    }

    case "task.deleted": {
      const column = findTaskColumn(board, event.taskId);
      if (column === undefined) {
        return board;
      }

      return replaceColumnTasks(board, column.id, compactColumn(column.tasks, event.taskId));
    }

    case "task.moved":
      return applyBoardMove(board, {
        taskId: event.taskId,
        columnId: event.columnId,
        position: event.position,
      });

    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

function findTaskColumn(board: BoardResponse, taskId: string): BoardColumn | undefined {
  return board.columns.find((column) => column.tasks.some((task) => task.id === taskId));
}

function replaceColumnTasks(board: BoardResponse, columnId: string, tasks: Task[]): BoardResponse {
  return {
    ...board,
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, tasks } : column,
    ),
  };
}

function sameTasks(left: Task[], right: Task[]): boolean {
  return left.length === right.length && left.every((task, index) => task === right[index]);
}

function insertTask(tasks: Task[], task: Task, columnId: string, position: number): Task[] {
  const destination = tasks.filter((item) => item.id !== task.id);
  const index = clampIndex(position, destination.length);
  const inserted = [...destination.slice(0, index), task, ...destination.slice(index)];

  return inserted.map((item, offset) =>
    item.position === offset && item.columnId === columnId
      ? item
      : { ...item, columnId, position: offset },
  );
}

function compactColumn(tasks: Task[], taskId: string): Task[] {
  return tasks
    .filter((item) => item.id !== taskId)
    .map((item, offset) => (item.position === offset ? item : { ...item, position: offset }));
}

function clampIndex(position: number, length: number): number {
  const normalized = Number.isFinite(position) ? Math.floor(position) : 0;
  return Math.min(Math.max(0, normalized), length);
}
