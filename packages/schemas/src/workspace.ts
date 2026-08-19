/**
 * Contratos Zod de workspace y project (GET de lectura).
 *
 * `workspaceId` en el JSON es dato, no permiso: la API no lo toma de
 * query/body para autorizar. El `workspace_id` sale de la fila.
 */
import { z } from "zod";

/** Query de `GET /api/workspaces`: no se acepta un workspaceId de permiso. */
export const workspacesQuerySchema = z.object({});

/** Params de `GET /api/projects/:projectId`. */
export const projectIdParamSchema = z.object({
  projectId: z.string().min(1),
});

export const workspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
});

export const workspaceListResponseSchema = z.array(workspaceSchema);

export const projectSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.iso.datetime(),
});

export type WorkspacesQuery = z.infer<typeof workspacesQuerySchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
export type Project = z.infer<typeof projectSchema>;
