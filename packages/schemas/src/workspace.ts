import { z } from "zod";

export const errorResponseSchema = z.object({
  error: z.string(),
});

export const workspaceIdParamSchema = z.object({
  workspaceId: z.string().trim().min(1),
});

export const workspaceProjectParamsSchema = z.object({
  workspaceId: z.string().trim().min(1),
  projectId: z.string().trim().min(1),
});

export const projectSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
});

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const workspaceWithProjectSchema = workspaceSchema.extend({
  project: projectSchema.nullable(),
});

export const workspaceListResponseSchema = z.object({
  workspaces: z.array(workspaceWithProjectSchema),
});

export const workspaceDetailResponseSchema = workspaceWithProjectSchema;

export const projectResponseSchema = projectSchema;

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type WorkspaceIdParams = z.infer<typeof workspaceIdParamSchema>;
export type WorkspaceProjectParams = z.infer<typeof workspaceProjectParamsSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;
export type WorkspaceWithProject = z.infer<typeof workspaceWithProjectSchema>;
export type WorkspaceListResponse = z.infer<typeof workspaceListResponseSchema>;
export type WorkspaceDetailResponse = z.infer<typeof workspaceDetailResponseSchema>;
export type ProjectResponse = z.infer<typeof projectResponseSchema>;
