/**
 * Tablero: upserts del seed y lecturas/escrituras autorizadas.
 *
 * El conflicto de `id` en el upsert actualiza el lugar y el orden y deja
 * `created_at` quieto. Las consultas `ForMember` no autorizan con el id
 * que manda el cliente: comprueban la membresía contra el `workspace_id`
 * de la fila. Crear y borrar corren en una transacción para que la
 * posición siguiente y la compactación no se mezclen con otra escritura.
 */
import { randomUUID } from "node:crypto";

import { and, asc, eq, max } from "drizzle-orm";

import { db } from "../client.ts";
import { column, task } from "../schema/board.ts";
import { workspaceMember } from "../schema/workspace.ts";
import { getProjectForMember } from "./project.ts";

/** Tarea devuelta por las consultas autorizadas. `createdAt` sigue siendo `Date`. */
export type MemberTask = {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  createdAt: Date;
};

export type BoardForMember = {
  project: {
    id: string;
    workspaceId: string;
    name: string;
    createdAt: Date;
  };
  columns: Array<{
    id: string;
    projectId: string;
    name: string;
    position: number;
    createdAt: Date;
    tasks: MemberTask[];
  }>;
};

const taskColumns = {
  id: task.id,
  projectId: task.projectId,
  columnId: task.columnId,
  title: task.title,
  description: task.description,
  position: task.position,
  createdAt: task.createdAt,
};

export async function upsertColumn({
  id,
  workspaceId,
  projectId,
  name,
  position,
}: {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  position: number;
}): Promise<void> {
  await db
    .insert(column)
    .values({ id, workspaceId, projectId, name, position })
    .onConflictDoUpdate({
      target: column.id,
      set: { workspaceId, projectId, name, position },
    });
}

export async function upsertTask({
  id,
  workspaceId,
  projectId,
  columnId,
  title,
  description,
  position,
}: {
  id: string;
  workspaceId: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
}): Promise<void> {
  await db
    .insert(task)
    .values({ id, workspaceId, projectId, columnId, title, description, position })
    .onConflictDoUpdate({
      target: task.id,
      set: { workspaceId, projectId, columnId, title, description, position },
    });
}

/**
 * Tablero visible para un miembro del workspace del project.
 *
 * Sin membresía, o si el project no existe, no hay fila. Columnas y
 * tareas se filtran con el `workspace_id` de esa fila, no con el de la URL.
 */
export async function getBoardForMember(
  projectId: string,
  userId: string,
): Promise<BoardForMember | undefined> {
  const project = await getProjectForMember(projectId, userId);
  if (project === undefined) {
    return undefined;
  }

  const columns = await db
    .select({
      id: column.id,
      projectId: column.projectId,
      name: column.name,
      position: column.position,
      createdAt: column.createdAt,
    })
    .from(column)
    .where(and(eq(column.projectId, project.id), eq(column.workspaceId, project.workspaceId)))
    .orderBy(asc(column.position), asc(column.id));

  const tasks = await db
    .select(taskColumns)
    .from(task)
    .where(and(eq(task.projectId, project.id), eq(task.workspaceId, project.workspaceId)))
    .orderBy(asc(task.position), asc(task.id));

  const tasksByColumn = new Map<string, MemberTask[]>();
  for (const item of tasks) {
    const list = tasksByColumn.get(item.columnId) ?? [];
    list.push(item);
    tasksByColumn.set(item.columnId, list);
  }

  return {
    project,
    columns: columns.map((item) => ({
      ...item,
      tasks: tasksByColumn.get(item.id) ?? [],
    })),
  };
}

/**
 * Añade la tarea al final de la columna, si esa columna es del project
 * y el usuario es miembro de su workspace. Si no, `undefined`.
 */
export async function createTaskForMember(
  input: {
    projectId: string;
    columnId: string;
    title: string;
    description: string;
  },
  userId: string,
): Promise<MemberTask | undefined> {
  return await db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: column.id,
        workspaceId: column.workspaceId,
        projectId: column.projectId,
      })
      .from(column)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, column.workspaceId),
          eq(workspaceMember.userId, userId),
        ),
      )
      .where(and(eq(column.id, input.columnId), eq(column.projectId, input.projectId)))
      .limit(1);

    const found = rows[0];
    if (found === undefined) {
      return undefined;
    }

    const maxRows = await tx
      .select({ value: max(task.position) })
      .from(task)
      .where(and(eq(task.columnId, found.id), eq(task.workspaceId, found.workspaceId)));
    const position = (maxRows[0]?.value ?? -1) + 1;

    const inserted = await tx
      .insert(task)
      .values({
        id: `task_${randomUUID()}`,
        workspaceId: found.workspaceId,
        projectId: found.projectId,
        columnId: found.id,
        title: input.title,
        description: input.description,
        position,
      })
      .returning(taskColumns);

    return inserted[0];
  });
}

/**
 * Actualiza título y/o descripción. La tarea se busca por membresía del
 * `workspace_id` de su fila. Sin fila, `undefined`.
 */
export async function updateTaskForMember(
  taskId: string,
  userId: string,
  patch: { title?: string; description?: string },
): Promise<MemberTask | undefined> {
  const rows = await db
    .select({ workspaceId: task.workspaceId })
    .from(task)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, task.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(task.id, taskId))
    .limit(1);

  const found = rows[0];
  if (found === undefined) {
    return undefined;
  }

  const changes: { title?: string; description?: string } = {};
  if (patch.title !== undefined) {
    changes.title = patch.title;
  }
  if (patch.description !== undefined) {
    changes.description = patch.description;
  }

  const updated = await db
    .update(task)
    .set(changes)
    .where(and(eq(task.id, taskId), eq(task.workspaceId, found.workspaceId)))
    .returning(taskColumns);

  return updated[0];
}

/**
 * Borra la tarea y compacta las posiciones de su columna a `0..n-1`.
 * Todo en una transacción. Sin membresía, o si no existe, `false`.
 */
export async function deleteTaskForMember(taskId: string, userId: string): Promise<boolean> {
  return await db.transaction(async (tx) => {
    const rows = await tx
      .select({
        id: task.id,
        workspaceId: task.workspaceId,
        columnId: task.columnId,
      })
      .from(task)
      .innerJoin(
        workspaceMember,
        and(eq(workspaceMember.workspaceId, task.workspaceId), eq(workspaceMember.userId, userId)),
      )
      .where(eq(task.id, taskId))
      .limit(1);

    const found = rows[0];
    if (found === undefined) {
      return false;
    }

    await tx
      .delete(task)
      .where(and(eq(task.id, found.id), eq(task.workspaceId, found.workspaceId)));

    const remaining = await tx
      .select({ id: task.id, position: task.position })
      .from(task)
      .where(and(eq(task.columnId, found.columnId), eq(task.workspaceId, found.workspaceId)))
      .orderBy(asc(task.position), asc(task.id));

    for (const [index, row] of remaining.entries()) {
      if (row.position === index) {
        continue;
      }

      await tx
        .update(task)
        .set({ position: index })
        .where(and(eq(task.id, row.id), eq(task.workspaceId, found.workspaceId)));
    }

    return true;
  });
}
