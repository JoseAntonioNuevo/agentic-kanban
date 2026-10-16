/**
 * Reexporta los contratos Zod públicos.
 * Web y API importan desde `@agentic-kanban/schemas`, no copian shapes.
 */
export {
  signInInputSchema,
  signUpInputSchema,
  type SignInInput,
  type SignUpInput,
} from "./auth.ts";
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
export { boardEventSchema, type BoardEvent } from "./events.ts";
export {
  healthResponseSchema,
  serviceStatusSchema,
  type HealthResponse,
  type ServiceStatus,
} from "./health.ts";
export {
  errorResponseSchema,
  projectIdParamSchema,
  projectSchema,
  projectSummarySchema,
  workspaceListResponseSchema,
  workspaceSchema,
  type ErrorResponse,
  type Project,
  type ProjectIdParam,
  type ProjectSummary,
  type Workspace,
  type WorkspaceListResponse,
} from "./workspace.ts";
