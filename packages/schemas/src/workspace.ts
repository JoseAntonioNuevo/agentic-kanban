/**
 * Contratos Zod de workspaces y proyectos.
 *
 * API y web comparten estos schemas: la API los usa para serializar y
 * validar parámetros; el navegador llama a `.parse()` sobre las respuestas
 * en vez de castearlas. Los tipos se derivan con `z.infer`.
 */
import { z } from "zod";

/** Resumen de proyecto embebido en cada workspace. */
export const projectSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
});

/** Workspace del usuario con sus proyectos. `createdAt` es ISO 8601. */
export const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  createdAt: z.iso.datetime(),
  projects: z.array(projectSummarySchema),
});

/** Respuesta de `GET /api/workspaces`: el array tal cual (puede ser vacío). */
export const workspaceListResponseSchema = z.array(workspaceSchema);

/** Proyecto completo, con el workspace al que pertenece. */
export const projectSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string(),
  createdAt: z.iso.datetime(),
});

/** Parámetro de ruta `:projectId`. */
export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});

/** Cuerpo de error de las respuestas 401 y 404. */
export const errorResponseSchema = z.object({
  error: z.string(),
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
