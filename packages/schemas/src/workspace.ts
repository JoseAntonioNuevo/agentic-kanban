/**
 * Contratos Zod de las lecturas de workspace y project.
 *
 * La lista de workspaces es un array desnudo (vacío si el usuario no
 * pertenece a ninguno). Las fechas viajan como string ISO.
 */
import { z } from "zod";

/** Project tal como aparece dentro de un workspace. */
export const projectSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;

/** Workspace del que el usuario es miembro, con sus projects. */
export const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
  projects: z.array(projectSummarySchema),
});

export type Workspace = z.infer<typeof workspaceSchema>;

/** Cuerpo de `GET /api/workspaces`. */
export const workspaceListResponseSchema = z.array(workspaceSchema);

export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;

/** Cuerpo de `GET /api/projects/:projectId`. */
export const projectSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
});

export type Project = z.infer<typeof projectSchema>;

/** Param `projectId` de `GET /api/projects/:projectId`. */
export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});

export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
