/**
 * Reexporta los contratos Zod públicos.
 * Web y API importan desde `@agentic-kanban/schemas`, no copian shapes.
 */
export {
  applyBoardMove,
  boardColumnSchema,
  boardResponseSchema,
  createTaskBodySchema,
  moveTaskBodySchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
  type BoardColumn,
  type BoardMove,
  type BoardResponse,
  type CreateTaskBody,
  type MoveTaskBody,
  type Task,
  type TaskIdParam,
  type UpdateTaskBody,
} from "./board.ts";
export {
  signInInputSchema,
  signUpInputSchema,
  type SignInInput,
  type SignUpInput,
} from "./auth.ts";
export { boardEventSchema, type BoardEvent } from "./events.ts";
export {
  healthResponseSchema,
  serviceStatusSchema,
  type HealthResponse,
  type ServiceStatus,
} from "./health.ts";
export {
  projectIdParamSchema,
  projectSchema,
  projectSummarySchema,
  workspaceListResponseSchema,
  workspaceSchema,
  type Project,
  type ProjectIdParam,
  type ProjectSummary,
  type Workspace,
  type WorkspaceListResponse,
} from "./workspace.ts";
