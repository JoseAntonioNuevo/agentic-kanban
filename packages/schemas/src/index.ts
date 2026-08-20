/**
 * Reexporta los contratos Zod públicos.
 * Web y API importan desde `@agentic-kanban/schemas`, no copian shapes.
 */
export {
  healthResponseSchema,
  serviceStatusSchema,
  type HealthResponse,
  type ServiceStatus,
} from "./health.ts";

export { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "./auth.ts";

export {
  projectIdParamSchema,
  projectSchema,
  projectSummarySchema,
  workspaceListResponseSchema,
  workspaceSchema,
  workspacesQuerySchema,
  type Project,
  type ProjectIdParam,
  type ProjectSummary,
  type Workspace,
  type WorkspaceListResponse,
  type WorkspacesQuery,
} from "./workspace.ts";

export {
  applyBoardMove,
  boardColumnSchema,
  boardResponseSchema,
  createTaskBodySchema,
  moveTaskBodySchema,
  taskIdParamSchema,
  taskSchema,
  updateTaskBodySchema,
  type Board,
  type BoardColumn,
  type CreateTaskBody,
  type MoveTaskBody,
  type Task,
  type TaskIdParam,
  type UpdateTaskBody,
} from "./board.ts";

export {
  applyBoardEvent,
  boardEventSchema,
  boardEventToastMessage,
  taskCreatedEventSchema,
  taskDeletedEventSchema,
  taskMovedEventSchema,
  taskUpdatedEventSchema,
  type BoardEvent,
  type TaskCreatedEvent,
  type TaskDeletedEvent,
  type TaskMovedEvent,
  type TaskUpdatedEvent,
} from "./events.ts";
