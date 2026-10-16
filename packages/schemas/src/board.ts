/**
 * Contratos Zod del tablero: columnas, tareas y cuerpos de escritura.
 *
 * `GET /api/projects/:projectId/board` devuelve las columnas ya ordenadas por
 * `position`, cada una con sus tareas. El navegador llama a `.parse()` sobre
 * la respuesta; la API valida con estos mismos schemas los cuerpos y params.
 */
import { z } from "zod";

import type { BoardEvent } from "./events.ts";
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

/** Movimiento de una tarea: columna destino y posición (se acota a `0..n`). */
export type BoardMove = { taskId: string; columnId: string; position: number };

/** Renumera `position` 0..n-1 reutilizando la referencia de las tareas que no cambian. */
function renumberTasks(tasks: Task[]): Task[] {
  return tasks.map((t, position) => (t.position === position ? t : { ...t, position }));
}

/**
 * Aplica un movimiento a un tablero y devuelve un tablero nuevo (inmutable).
 *
 * Sigue el mismo orden que el servidor (`moveTaskForMember`): saca la tarea de
 * su columna, acota `position` a `0..n` sobre la lista destino, la inserta y
 * renumera `position` 0..n-1 en las columnas afectadas. Las columnas no
 * afectadas conservan su referencia. Si la tarea o la columna destino no
 * existen, devuelve el mismo `board` sin cambios.
 *
 * La reutilizan la actualización optimista del navegador y `applyBoardEvent`
 * para `task.moved`.
 */
export function applyBoardMove(board: BoardResponse, move: BoardMove): BoardResponse {
  const sourceColumn = board.columns.find((col) => col.tasks.some((t) => t.id === move.taskId));
  const targetColumn = board.columns.find((col) => col.id === move.columnId);
  const moved = sourceColumn?.tasks.find((t) => t.id === move.taskId);

  if (!sourceColumn || !targetColumn || !moved) {
    return board;
  }

  const sameColumn = sourceColumn.id === targetColumn.id;
  const withoutMoved = sourceColumn.tasks.filter((t) => t.id !== move.taskId);
  const targetTasks = sameColumn ? withoutMoved : targetColumn.tasks;

  const index = Math.min(Math.max(move.position, 0), targetTasks.length);
  const inserted = [
    ...targetTasks.slice(0, index),
    { ...moved, columnId: targetColumn.id },
    ...targetTasks.slice(index),
  ];

  return {
    ...board,
    columns: board.columns.map((col) => {
      if (col.id === targetColumn.id) {
        return { ...col, tasks: renumberTasks(inserted) };
      }

      if (col.id === sourceColumn.id) {
        return { ...col, tasks: renumberTasks(withoutMoved) };
      }

      return col;
    }),
  };
}

/** Indica si dos tareas tienen exactamente los mismos valores. */
function sameTask(a: Task, b: Task): boolean {
  return (
    a.id === b.id &&
    a.workspaceId === b.workspaceId &&
    a.projectId === b.projectId &&
    a.columnId === b.columnId &&
    a.title === b.title &&
    a.description === b.description &&
    a.position === b.position &&
    a.createdAt === b.createdAt
  );
}

/**
 * Aplica un evento del tablero (anunciado por la API) y devuelve un tablero
 * nuevo (inmutable). Es idempotente: aplicar dos veces el mismo evento da lo
 * mismo que aplicarlo una. Si el evento no cambia nada (otro proyecto, tarea
 * ausente, tarea ya presente), devuelve el mismo `board`; las columnas no
 * afectadas conservan su referencia.
 *
 * - `task.created`: inserta en su columna en `min(position, n)` si el id no
 *   está en ninguna columna y la columna existe; renumera esa columna.
 * - `task.updated`: reemplaza los datos por id conservando la posición y la
 *   columna del tablero local (mover es cosa de `task.moved`).
 * - `task.deleted`: elimina la tarea si está y renumera su columna.
 * - `task.moved`: reutiliza `applyBoardMove`.
 * - `comment.created`: no cambia el tablero (devuelve el mismo `board`).
 */
export function applyBoardEvent(board: BoardResponse, event: BoardEvent): BoardResponse {
  if (event.projectId !== board.project.id) {
    return board;
  }

  switch (event.type) {
    case "task.created": {
      const { task } = event;
      const exists = board.columns.some((col) => col.tasks.some((t) => t.id === task.id));
      const target = board.columns.find((col) => col.id === task.columnId);

      if (exists || !target) {
        return board;
      }

      const index = Math.min(Math.max(task.position, 0), target.tasks.length);
      const inserted = [...target.tasks.slice(0, index), task, ...target.tasks.slice(index)];

      return {
        ...board,
        columns: board.columns.map((col) =>
          col.id === target.id ? { ...col, tasks: renumberTasks(inserted) } : col,
        ),
      };
    }

    case "task.updated": {
      const owner = board.columns.find((col) => col.tasks.some((t) => t.id === event.task.id));
      const current = owner?.tasks.find((t) => t.id === event.task.id);

      if (!owner || !current) {
        return board;
      }

      const replaced: Task = {
        ...event.task,
        columnId: current.columnId,
        position: current.position,
      };

      if (sameTask(current, replaced)) {
        return board;
      }

      return {
        ...board,
        columns: board.columns.map((col) =>
          col.id === owner.id
            ? { ...col, tasks: col.tasks.map((t) => (t.id === replaced.id ? replaced : t)) }
            : col,
        ),
      };
    }

    case "task.deleted": {
      const owner = board.columns.find((col) => col.tasks.some((t) => t.id === event.taskId));

      if (!owner) {
        return board;
      }

      return {
        ...board,
        columns: board.columns.map((col) =>
          col.id === owner.id
            ? { ...col, tasks: renumberTasks(col.tasks.filter((t) => t.id !== event.taskId)) }
            : col,
        ),
      };
    }

    case "task.moved":
      return applyBoardMove(board, {
        taskId: event.taskId,
        columnId: event.columnId,
        position: event.position,
      });

    case "comment.created":
      return board;
  }
}
