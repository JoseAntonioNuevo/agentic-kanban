/**
 * Reexporta los contratos Zod públicos.
 * Web y API importan desde `@agentic-kanban/schemas`, no copian shapes.
 * Los schemas de workspace/proyecto llegarán con su sesión del curso.
 */
export {
  signInInputSchema,
  signUpInputSchema,
  type SignInInput,
  type SignUpInput,
} from "./auth.ts";
export {
  healthResponseSchema,
  serviceStatusSchema,
  type HealthResponse,
  type ServiceStatus,
} from "./health.ts";
