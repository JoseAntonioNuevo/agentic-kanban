/**
 * Acceso a tenant. La API no importa drizzle-orm: lecturas, mutaciones
 * de tablero y upserts del seed. Toda query de project/column/task pasa
 * por membership (`workspace_member.user_id`) y el `workspace_id` de la
 * fila, nunca de un argumento que el cliente haya elegido como permiso.
 * Nunca DELETE masivo.
 */
import { and, eq, inArray, max } from "drizzle-orm";

import { getDb } from "./client.ts";
import { user } from "./schema/auth.ts";
import { column } from "./schema/column.ts";
import { project } from "./schema/project.ts";
import { task } from "./schema/task.ts";
import { workspace, workspaceMember } from "./schema/workspace.ts";

export type WorkspaceRow = {
  id: string;
  name: string;
  createdAt: Date;
};

export type ProjectRow = {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: Date;
};

export type ProjectSummaryRow = {
  id: string;
  name: string;
};

export type WorkspaceWithProjectsRow = WorkspaceRow & {
  projects: ProjectSummaryRow[];
};

export type ColumnRow = {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  position: number;
  createdAt: Date;
};

export type TaskRow = {
  id: string;
  workspaceId: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  position: number;
  createdAt: Date;
};

export type BoardRow = {
  project: ProjectRow;
  columns: Array<ColumnRow & { tasks: TaskRow[] }>;
};

function sortByPositionThenId<T extends { position: number; id: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

/** Workspaces donde `userId` aparece en `workspace_member`, con sus projects. */
export async function listWorkspacesForUser(userId: string): Promise<WorkspaceWithProjectsRow[]> {
  const workspaces = await getDb()
    .select({
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.createdAt,
    })
    .from(workspace)
    .innerJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
    .where(eq(workspaceMember.userId, userId));

  if (workspaces.length === 0) {
    return [];
  }

  const projects = await getDb()
    .select({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
    })
    .from(project)
    .where(
      inArray(
        project.workspaceId,
        workspaces.map((row) => row.id),
      ),
    );

  return workspaces.map((row) => ({
    ...row,
    projects: projects
      .filter((item) => item.workspaceId === row.id)
      .map((item) => ({ id: item.id, name: item.name })),
  }));
}

/**
 * Project si el usuario es miembro del `workspace_id` de esa fila.
 * El join usa el workspace de la fila, no un workspaceId de argumento.
 */
export async function getProjectForMember(
  projectId: string,
  userId: string,
): Promise<ProjectRow | undefined> {
  const rows = await getDb()
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

  return rows[0];
}

/** Tablero del project si el usuario es miembro del workspace de esa fila. */
export async function getBoardForMember(
  projectId: string,
  userId: string,
): Promise<BoardRow | undefined> {
  const projectRow = await getProjectForMember(projectId, userId);
  if (!projectRow) {
    return undefined;
  }

  const columns = await getDb()
    .select({
      id: column.id,
      workspaceId: column.workspaceId,
      projectId: column.projectId,
      name: column.name,
      position: column.position,
      createdAt: column.createdAt,
    })
    .from(column)
    .where(
      and(eq(column.projectId, projectRow.id), eq(column.workspaceId, projectRow.workspaceId)),
    );

  const tasks = await getDb()
    .select({
      id: task.id,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      columnId: task.columnId,
      title: task.title,
      description: task.description,
      position: task.position,
      createdAt: task.createdAt,
    })
    .from(task)
    .where(and(eq(task.projectId, projectRow.id), eq(task.workspaceId, projectRow.workspaceId)));

  const tasksByColumn = new Map<string, TaskRow[]>();
  for (const row of sortByPositionThenId(tasks)) {
    const list = tasksByColumn.get(row.columnId) ?? [];
    list.push(row);
    tasksByColumn.set(row.columnId, list);
  }

  return {
    project: projectRow,
    columns: sortByPositionThenId(columns).map((col) => ({
      ...col,
      tasks: tasksByColumn.get(col.id) ?? [],
    })),
  };
}

/** Columna del project si el usuario es miembro del workspace de esa fila. */
export async function getColumnForProjectMember(
  columnId: string,
  projectId: string,
  userId: string,
): Promise<ColumnRow | undefined> {
  const rows = await getDb()
    .select({
      id: column.id,
      workspaceId: column.workspaceId,
      projectId: column.projectId,
      name: column.name,
      position: column.position,
      createdAt: column.createdAt,
    })
    .from(column)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, column.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(and(eq(column.id, columnId), eq(column.projectId, projectId)))
    .limit(1);

  return rows[0];
}

/** Tarea si el usuario es miembro del workspace de esa fila. */
export async function getTaskForMember(
  taskId: string,
  userId: string,
): Promise<TaskRow | undefined> {
  const rows = await getDb()
    .select({
      id: task.id,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      columnId: task.columnId,
      title: task.title,
      description: task.description,
      position: task.position,
      createdAt: task.createdAt,
    })
    .from(task)
    .innerJoin(
      workspaceMember,
      and(eq(workspaceMember.workspaceId, task.workspaceId), eq(workspaceMember.userId, userId)),
    )
    .where(eq(task.id, taskId))
    .limit(1);

  return rows[0];
}

export async function createTaskForMember(values: {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  userId: string;
}): Promise<TaskRow | undefined> {
  const dest = await getColumnForProjectMember(values.columnId, values.projectId, values.userId);
  if (!dest) {
    return undefined;
  }

  const [agg] = await getDb()
    .select({ maxPosition: max(task.position) })
    .from(task)
    .where(and(eq(task.columnId, dest.id), eq(task.workspaceId, dest.workspaceId)));

  const position = (agg?.maxPosition ?? -1) + 1;

  await getDb().insert(task).values({
    id: values.id,
    workspaceId: dest.workspaceId,
    projectId: dest.projectId,
    columnId: dest.id,
    title: values.title,
    description: values.description,
    position,
  });

  return getTaskForMember(values.id, values.userId);
}

export async function updateTaskForMember(values: {
  taskId: string;
  userId: string;
  title?: string;
  description?: string;
}): Promise<TaskRow | undefined> {
  const current = await getTaskForMember(values.taskId, values.userId);
  if (!current) {
    return undefined;
  }

  const patch: { title?: string; description?: string } = {};
  if (values.title !== undefined) {
    patch.title = values.title;
  }
  if (values.description !== undefined) {
    patch.description = values.description;
  }

  await getDb()
    .update(task)
    .set(patch)
    .where(and(eq(task.id, current.id), eq(task.workspaceId, current.workspaceId)));

  return getTaskForMember(values.taskId, values.userId);
}

export async function deleteTaskForMember(
  taskId: string,
  userId: string,
): Promise<TaskRow | undefined> {
  const current = await getTaskForMember(taskId, userId);
  if (!current) {
    return undefined;
  }

  await getDb().transaction(async (tx) => {
    await tx
      .delete(task)
      .where(and(eq(task.id, current.id), eq(task.workspaceId, current.workspaceId)));

    const remaining = sortByPositionThenId(
      await tx
        .select()
        .from(task)
        .where(and(eq(task.columnId, current.columnId), eq(task.workspaceId, current.workspaceId))),
    );

    for (const [index, row] of remaining.entries()) {
      if (row.position !== index) {
        await tx
          .update(task)
          .set({ position: index })
          .where(and(eq(task.id, row.id), eq(task.workspaceId, current.workspaceId)));
      }
    }
  });

  return current;
}

export async function moveTaskForMember(values: {
  taskId: string;
  userId: string;
  columnId: string;
  position: number;
}): Promise<TaskRow | undefined> {
  return getDb().transaction(async (tx) => {
    const currentRows = await tx
      .select({
        id: task.id,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        position: task.position,
        createdAt: task.createdAt,
      })
      .from(task)
      .innerJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, task.workspaceId),
          eq(workspaceMember.userId, values.userId),
        ),
      )
      .where(eq(task.id, values.taskId))
      .limit(1);

    const current = currentRows[0];
    if (!current) {
      return undefined;
    }

    const destRows = await tx
      .select({
        id: column.id,
      })
      .from(column)
      .where(
        and(
          eq(column.id, values.columnId),
          eq(column.workspaceId, current.workspaceId),
          eq(column.projectId, current.projectId),
        ),
      )
      .limit(1);

    if (!destRows[0]) {
      return undefined;
    }

    const sourceTasks = sortByPositionThenId(
      await tx
        .select()
        .from(task)
        .where(and(eq(task.columnId, current.columnId), eq(task.workspaceId, current.workspaceId))),
    );

    const sameColumn = current.columnId === values.columnId;
    const destTasks = sameColumn
      ? sourceTasks
      : sortByPositionThenId(
          await tx
            .select()
            .from(task)
            .where(
              and(eq(task.columnId, values.columnId), eq(task.workspaceId, current.workspaceId)),
            ),
        );

    const sourceWithout = sourceTasks.filter((row) => row.id !== current.id);
    const destBase = sameColumn ? sourceWithout : destTasks.filter((row) => row.id !== current.id);
    const insertAt = Math.max(0, Math.min(values.position, destBase.length));
    destBase.splice(insertAt, 0, { ...current, columnId: values.columnId, position: insertAt });

    if (!sameColumn) {
      for (const [index, row] of sourceWithout.entries()) {
        await tx
          .update(task)
          .set({ position: index })
          .where(and(eq(task.id, row.id), eq(task.workspaceId, current.workspaceId)));
      }
    }

    for (const [index, row] of destBase.entries()) {
      await tx
        .update(task)
        .set({ columnId: values.columnId, position: index })
        .where(and(eq(task.id, row.id), eq(task.workspaceId, current.workspaceId)));
    }

    return {
      ...current,
      columnId: values.columnId,
      position: insertAt,
    };
  });
}

/** `user.id` de Better Auth por email (normalizado a minúsculas). No inserta. */
export async function findUserIdByEmail(email: string): Promise<string | undefined> {
  const rows = await getDb()
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email.toLowerCase()))
    .limit(1);

  return rows[0]?.id;
}

/** Inserción usada por tests. No es un endpoint. */
export async function insertWorkspace(values: { id: string; name: string }): Promise<void> {
  await getDb().insert(workspace).values(values);
}

export async function insertWorkspaceMember(values: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  await getDb().insert(workspaceMember).values(values);
}

export async function insertProject(values: {
  id: string;
  workspaceId: string;
  name: string;
}): Promise<void> {
  await getDb().insert(project).values(values);
}

export async function insertColumn(values: {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  position: number;
}): Promise<void> {
  await getDb().insert(column).values(values);
}

export async function insertTask(values: {
  id: string;
  workspaceId: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  position: number;
}): Promise<void> {
  await getDb()
    .insert(task)
    .values({
      ...values,
      description: values.description ?? "",
    });
}

/** Upsert por `id`. El seed lo usa; no borra filas. */
export async function upsertWorkspace(values: { id: string; name: string }): Promise<void> {
  await getDb()
    .insert(workspace)
    .values(values)
    .onConflictDoUpdate({
      target: workspace.id,
      set: { name: values.name },
    });
}

export async function upsertProject(values: {
  id: string;
  workspaceId: string;
  name: string;
}): Promise<void> {
  await getDb()
    .insert(project)
    .values(values)
    .onConflictDoUpdate({
      target: project.id,
      set: { name: values.name, workspaceId: values.workspaceId },
    });
}

export async function upsertWorkspaceMember(values: {
  workspaceId: string;
  userId: string;
}): Promise<void> {
  await getDb()
    .insert(workspaceMember)
    .values(values)
    .onConflictDoNothing({
      target: [workspaceMember.workspaceId, workspaceMember.userId],
    });
}

export async function upsertColumn(values: {
  id: string;
  workspaceId: string;
  projectId: string;
  name: string;
  position: number;
}): Promise<void> {
  await getDb()
    .insert(column)
    .values(values)
    .onConflictDoUpdate({
      target: column.id,
      set: {
        workspaceId: values.workspaceId,
        projectId: values.projectId,
        name: values.name,
        position: values.position,
      },
    });
}

export async function upsertTask(values: {
  id: string;
  workspaceId: string;
  projectId: string;
  columnId: string;
  title: string;
  description?: string;
  position: number;
}): Promise<void> {
  const description = values.description ?? "";
  await getDb()
    .insert(task)
    .values({ ...values, description })
    .onConflictDoUpdate({
      target: task.id,
      set: {
        workspaceId: values.workspaceId,
        projectId: values.projectId,
        columnId: values.columnId,
        title: values.title,
        description,
        position: values.position,
      },
    });
}
