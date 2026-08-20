/**
 * Contrato de anuncios de tablero (Sesión 3).
 *
 * HTTP sigue siendo la escritura. El schema describe el evento; el cliente
 * aplica el snapshot con `applyBoardEvent` sobre la cache de TanStack Query.
 */
import { z } from "zod";

import {
  applyBoardMove,
  moveTaskBodySchema,
  taskIdParamSchema,
  taskSchema,
  type Board,
  type Task,
} from "./board.ts";

const boardEventBaseSchema = z.object({
  projectId: z.string().min(1),
  actorUserId: z.string().min(1),
});

export const taskCreatedEventSchema = boardEventBaseSchema.extend({
  type: z.literal("task.created"),
  task: taskSchema,
});

export const taskUpdatedEventSchema = boardEventBaseSchema.extend({
  type: z.literal("task.updated"),
  task: taskSchema,
});

export const taskDeletedEventSchema = boardEventBaseSchema.extend({
  type: z.literal("task.deleted"),
  taskId: taskIdParamSchema.shape.taskId,
});

export const taskMovedEventSchema = boardEventBaseSchema.extend({
  type: z.literal("task.moved"),
  taskId: taskIdParamSchema.shape.taskId,
  columnId: moveTaskBodySchema.shape.columnId,
  position: moveTaskBodySchema.shape.position,
});

export const boardEventSchema = z.discriminatedUnion("type", [
  taskCreatedEventSchema,
  taskUpdatedEventSchema,
  taskDeletedEventSchema,
  taskMovedEventSchema,
]);

export type TaskCreatedEvent = z.infer<typeof taskCreatedEventSchema>;
export type TaskUpdatedEvent = z.infer<typeof taskUpdatedEventSchema>;
export type TaskDeletedEvent = z.infer<typeof taskDeletedEventSchema>;
export type TaskMovedEvent = z.infer<typeof taskMovedEventSchema>;
export type BoardEvent = z.infer<typeof boardEventSchema>;

function reindexTasks(board: Board): Board {
  return {
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.map((task, position) => ({ ...task, position })),
    })),
  };
}

function taskExists(board: Board, taskId: string): boolean {
  return board.columns.some((column) => column.tasks.some((task) => task.id === taskId));
}

function insertCreatedTask(board: Board, task: Task): Board {
  if (taskExists(board, task.id)) {
    return board;
  }

  const dest = board.columns.find((column) => column.id === task.columnId);
  if (!dest) {
    return board;
  }

  const index = Math.max(0, Math.min(task.position, dest.tasks.length));
  return reindexTasks({
    ...board,
    columns: board.columns.map((column) => {
      if (column.id !== task.columnId) {
        return column;
      }
      const tasks = [...column.tasks];
      tasks.splice(index, 0, task);
      return { ...column, tasks };
    }),
  });
}

function replaceUpdatedTask(board: Board, task: Task): Board {
  if (!taskExists(board, task.id)) {
    return board;
  }

  return {
    ...board,
    columns: board.columns.map((column) => {
      const index = column.tasks.findIndex((candidate) => candidate.id === task.id);
      if (index === -1) {
        return column;
      }
      const tasks = [...column.tasks];
      tasks[index] = task;
      return { ...column, tasks };
    }),
  };
}

function removeDeletedTask(board: Board, taskId: string): Board {
  if (!taskExists(board, taskId)) {
    return board;
  }

  return reindexTasks({
    ...board,
    columns: board.columns.map((column) => ({
      ...column,
      tasks: column.tasks.filter((task) => task.id !== taskId),
    })),
  });
}

/** Copy in-app (sonner) para un anuncio de otro usuario. Sin persistencia. */
export function boardEventToastMessage(event: BoardEvent, title: string | undefined): string {
  switch (event.type) {
    case "task.created":
      return title ? `Nueva tarea: ${title}` : "Nueva tarea";
    case "task.updated":
      return title ? `Tarea actualizada: ${title}` : "Tarea actualizada";
    case "task.deleted":
      return title ? `Tarea eliminada: ${title}` : "Tarea eliminada";
    case "task.moved":
      return title ? `Tarea movida: ${title}` : "Tarea movida";
  }
}

/** Aplica un anuncio de tablero a un snapshot. Idempotente en create/delete. */
export function applyBoardEvent(board: Board, event: BoardEvent): Board {
  if (event.projectId !== board.project.id) {
    return board;
  }

  switch (event.type) {
    case "task.moved":
      return applyBoardMove(board, event.taskId, event.columnId, event.position);
    case "task.created":
      return insertCreatedTask(board, event.task);
    case "task.updated":
      return replaceUpdatedTask(board, event.task);
    case "task.deleted":
      return removeDeletedTask(board, event.taskId);
  }
}
