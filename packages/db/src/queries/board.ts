/**
 * Lecturas y escrituras del tablero acotadas por membresía (sufijo `ForMember`).
 *
 * Los ids que llegan del cliente (`projectId`, `columnId`, `taskId`) solo
 * identifican filas: nunca autorizan. La membresía se comprueba siempre con el
 * `workspace_id` de la fila guardada en la base, y ese mismo `workspace_id`
 * filtra cada consulta posterior. Sin membresía o sin fila devuelven `null`
 * (el llamador responde 404, nunca 403).
 */
import { and, asc, eq, gt, max, sql } from "drizzle-orm";

import { getDb } from "../client.ts";
import type { ColumnRow, TaskRow } from "../schema/board.ts";
import { column, project, task, workspaceMember } from "../schema/index.ts";
import { getProjectForMember, type ProjectRow } from "./workspaces.ts";

/** Columna del tablero con sus tareas ordenadas por `position`. */
export type BoardColumnWithTasks = ColumnRow & { tasks: TaskRow[] };

/** Tablero de un project: el project y sus columnas (con tareas) por `position`. */
export type BoardData = { project: ProjectRow; columns: BoardColumnWithTasks[] };

/** Tipo de la transacción de Drizzle (`getDb().transaction(async (tx) => …)`). */
type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

/** Project por id solo si el usuario es miembro de su workspace (dentro de una transacción). */
async function getProjectForMemberTx(
  tx: Transaction,
  projectId: string,
  userId: string,
): Promise<ProjectRow | null> {
  const rows = await tx
    .select({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      createdAt: project.createdAt,
    })
    .from(project)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, project.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(project.id, projectId))
    .limit(1);

  return rows[0] ?? null;
}

/** Tarea por id solo si el usuario es miembro del workspace de la fila (dentro de una transacción). */
async function getTaskForMemberTx(
  tx: Transaction,
  taskId: string,
  userId: string,
): Promise<TaskRow | null> {
  const rows = await tx
    .select({ task })
    .from(task)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, task.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(task.id, taskId))
    .limit(1);

  return rows[0]?.task ?? null;
}

/**
 * Tablero del project con columnas y tareas por `position`.
 * `null` si el project no existe o el usuario no es miembro.
 */
export async function getBoardForMember(
  projectId: string,
  userId: string,
): Promise<BoardData | null> {
  const projectRow = await getProjectForMember(projectId, userId);

  if (!projectRow) {
    return null;
  }

  const db = getDb();

  const columns = await db
    .select()
    .from(column)
    .where(and(eq(column.projectId, projectRow.id), eq(column.workspaceId, projectRow.workspaceId)))
    .orderBy(asc(column.position));

  const tasks = await db
    .select()
    .from(task)
    .where(and(eq(task.projectId, projectRow.id), eq(task.workspaceId, projectRow.workspaceId)))
    .orderBy(asc(task.position));

  return {
    project: projectRow,
    columns: columns.map((col) => ({
      ...col,
      tasks: tasks.filter((item) => item.columnId === col.id),
    })),
  };
}

/** Tarea por id si el usuario es miembro de su workspace; si no, `null`. */
export async function getTaskForMember(taskId: string, userId: string): Promise<TaskRow | null> {
  const rows = await getDb()
    .select({ task })
    .from(task)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, task.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(task.id, taskId))
    .limit(1);

  return rows[0]?.task ?? null;
}

/**
 * Crea una tarea al final de la columna. `workspaceId` y `projectId` salen del
 * project autorizado; `columnId` debe pertenecer a ese mismo project, si no
 * devuelve `null` (anti-IDOR).
 */
export async function createTaskForMember(input: {
  projectId: string;
  userId: string;
  columnId: string;
  title: string;
  description?: string;
}): Promise<TaskRow | null> {
  return getDb().transaction(async (tx) => {
    const projectRow = await getProjectForMemberTx(tx, input.projectId, input.userId);

    if (!projectRow) {
      return null;
    }

    const columns = await tx
      .select({ id: column.id })
      .from(column)
      .where(
        and(
          eq(column.id, input.columnId),
          eq(column.projectId, projectRow.id),
          eq(column.workspaceId, projectRow.workspaceId),
        ),
      )
      .limit(1);

    if (!columns[0]) {
      return null;
    }

    const last = await tx
      .select({ value: max(task.position) })
      .from(task)
      .where(and(eq(task.columnId, input.columnId), eq(task.workspaceId, projectRow.workspaceId)));

    const inserted = await tx
      .insert(task)
      .values({
        id: crypto.randomUUID(),
        workspaceId: projectRow.workspaceId,
        projectId: projectRow.id,
        columnId: input.columnId,
        title: input.title,
        description: input.description ?? "",
        position: (last[0]?.value ?? -1) + 1,
      })
      .returning();

    return inserted[0] ?? null;
  });
}

/** Actualiza título y/o descripción de una tarea autorizada; devuelve la fila actualizada. */
export async function updateTaskForMember(
  taskId: string,
  userId: string,
  patch: { title?: string; description?: string },
): Promise<TaskRow | null> {
  return getDb().transaction(async (tx) => {
    const current = await getTaskForMemberTx(tx, taskId, userId);

    if (!current) {
      return null;
    }

    const set: { title?: string; description?: string } = {};

    if (patch.title !== undefined) {
      set.title = patch.title;
    }

    if (patch.description !== undefined) {
      set.description = patch.description;
    }

    // Un parche vacío no ejecuta UPDATE: devuelve la fila tal cual.
    if (Object.keys(set).length === 0) {
      return current;
    }

    const updated = await tx
      .update(task)
      .set(set)
      .where(and(eq(task.id, current.id), eq(task.workspaceId, current.workspaceId)))
      .returning();

    return updated[0] ?? null;
  });
}

/**
 * Borra una tarea autorizada y compacta las posiciones de su columna (0..n-1)
 * en la misma transacción. Devuelve la fila borrada.
 */
export async function deleteTaskForMember(taskId: string, userId: string): Promise<TaskRow | null> {
  return getDb().transaction(async (tx) => {
    const current = await getTaskForMemberTx(tx, taskId, userId);

    if (!current) {
      return null;
    }

    await tx
      .delete(task)
      .where(and(eq(task.id, current.id), eq(task.workspaceId, current.workspaceId)));

    await tx
      .update(task)
      .set({ position: sql`${task.position} - 1` })
      .where(
        and(
          eq(task.columnId, current.columnId),
          eq(task.workspaceId, current.workspaceId),
          gt(task.position, current.position),
        ),
      );

    return current;
  });
}

/**
 * Mueve una tarea autorizada a `target.columnId` en `target.position`.
 *
 * Todo ocurre en una transacción:
 * 1. La tarea se busca por membresía del `workspace_id` de su fila.
 * 2. La columna destino debe existir en el mismo project y workspace que la
 *    tarea; si no, `null` (cubre otro project y otro workspace).
 * 3. Se leen las tareas de la columna origen (por `position`, `id`) sin la
 *    tarea movida; el destino es esa misma lista o las tareas de la otra columna.
 * 4. La tarea se inserta en el destino en `position` acotada a `0..n`.
 * 5. Se renumera 0..n-1 el destino (con su `column_id`) y, si cambió de
 *    columna, también el origen. UPDATE fila a fila: determinista y sin
 *    conflictos porque `position` no es única.
 * Devuelve la fila ya movida, releída de la base.
 */
export async function moveTaskForMember(
  taskId: string,
  userId: string,
  target: { columnId: string; position: number },
): Promise<TaskRow | null> {
  return getDb().transaction(async (tx) => {
    const current = await getTaskForMemberTx(tx, taskId, userId);

    if (!current) {
      return null;
    }

    const targetColumns = await tx
      .select({ id: column.id })
      .from(column)
      .where(
        and(
          eq(column.id, target.columnId),
          eq(column.projectId, current.projectId),
          eq(column.workspaceId, current.workspaceId),
        ),
      )
      .limit(1);

    if (!targetColumns[0]) {
      return null;
    }

    // Ids de las tareas de una columna en orden estable (`position`, luego `id`).
    const idsOfColumn = async (columnId: string): Promise<string[]> => {
      const rows = await tx
        .select({ id: task.id })
        .from(task)
        .where(and(eq(task.columnId, columnId), eq(task.workspaceId, current.workspaceId)))
        .orderBy(asc(task.position), asc(task.id));

      return rows.map((row) => row.id);
    };

    const sameColumn = target.columnId === current.columnId;
    const sourceIds = (await idsOfColumn(current.columnId)).filter((id) => id !== current.id);
    const targetIds = sameColumn ? [...sourceIds] : await idsOfColumn(target.columnId);

    const index = Math.min(Math.max(target.position, 0), targetIds.length);
    targetIds.splice(index, 0, current.id);

    // Renumera una lista 0..n-1 y fija su `column_id` (la tarea movida cambia de columna).
    const renumber = async (columnId: string, ids: string[]): Promise<void> => {
      for (const [position, id] of ids.entries()) {
        await tx
          .update(task)
          .set({ position, columnId })
          .where(and(eq(task.id, id), eq(task.workspaceId, current.workspaceId)));
      }
    };

    await renumber(target.columnId, targetIds);

    if (!sameColumn) {
      await renumber(current.columnId, sourceIds);
    }

    const moved = await tx
      .select()
      .from(task)
      .where(and(eq(task.id, current.id), eq(task.workspaceId, current.workspaceId)))
      .limit(1);

    return moved[0] ?? null;
  });
}
