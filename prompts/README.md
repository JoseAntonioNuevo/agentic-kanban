# Prompts de clase — Agentic Kanban

Las cuatro sesiones se ejecutan en Cursor. Usamos dos estilos, con el mismo
Grok 4.7 xhigh Fast para ejecutar y los mismos criterios de aceptación:

| Sesión  | Fecha      | Carpeta y guía                           | Estilo                                            | Prompts                  | Resultado esperado                             |
| ------- | ---------- | ---------------------------------------- | ------------------------------------------------- | ------------------------ | ---------------------------------------------- |
| 1 (S9)  | Mié 21 oct | [auth](auth/README.md)                   | Agent con Opus orquestando workers Grok, autónomo | 01–06                    | Auth, workspaces aislados y dashboard          |
| 2 (S10) | Lun 26 oct | [kanban](kanban/README.md)               | Plan con Opus → Agent con Grok, sin subagentes    | 00 plan; 01–08 ejecución | CRUD, orden y drag-and-drop optimista          |
| 3 (S11) | Mié 28 oct | [websockets](websockets/README.md)       | Agent con Opus orquestando workers Grok, autónomo | 01–06                    | Dos sesiones sincronizadas por SSE y toasts    |
| 4 (S12) | Mié 4 nov  | [notifications](notifications/README.md) | Agent con Opus orquestando workers Grok, autónomo | 01–08                    | Comentarios, menciones, campana, outbox y demo |

El protocolo de modelos, autonomía, propiedad de archivos, verificación y
CodeRabbit vive en [CURSOR.md](CURSOR.md). El preflight
[00 · Comprobar delegación](00-comprobar-delegacion.md) es de solo lectura;
no implementa ningún paso. Las definiciones de `.claude/agents/` se conservan
como material histórico y no se usan en estos flujos.

## Material para conducir el directo

[Índice de guiones de Obsidian](../docs/obsidian/README.md): cada clase tiene
un guion operativo y otro con texto literal antes, durante y después de cada
prompt, apertura tras la presentación y cierre previo a preguntas. Son notas
locales del profesor en `docs/obsidian/`, carpeta excluida de Git; los prompts
versionados permiten seguir el curso sin esas notas personales.

## Antes de cada clase

- Conserva el trabajo pendiente, prepara el checkout y comprueba el estado
  de la sesión anterior. No ejecutes un paso sobre prerrequisitos rotos.
- Instala las dependencias fijadas y levanta únicamente `web` y `api`.
  Comprueba health por `http://localhost:5173/api/health` y los checks locales.
- Usa un checkout sin worktrees anidados. No borres trabajo ajeno para lograr
  una puerta verde. La guía común explica el alcance de los tests.
- Guarda el SHA completo de HEAD antes del 01 **de esta clase**. No reutilices
  el SHA de otra clase para su revisión final.
- Prepara las dos sesiones de navegador y checkpoints ensayados para esta
  versión. Las ramas antiguas `fase1`–`fase4` no son reservas sin validar.
- En la clase 2 hay un traspaso de modelo tras el plan; en 1/3/4 no hay pausas
  rutinarias de aprobación. En todas se observan las pruebas manuales.

## Base de datos en clase

Genera las migraciones en el host solo cuando el prompt lo pide. Con Compose
arriba, aplícalas y ejecuta el seed dentro de `api`; nunca arranques una
segunda API sobre el mismo fichero. Tests y outbox de test usan rutas
propias, nunca `data/`. [Arranque y reset según el estado](../README.md#resetear-la-base-de-datos).
El reset se prepara fuera del directo y no se ejecuta como arreglo automático.

## Si algo se tuerce

Diagnostica el fallo y repite las comprobaciones afectadas. Si necesitas un
checkpoint, conserva el trabajo y usa una copia ensayada, indicando qué
resultado pertenece al ensayo. Si falta un prerrequisito, deja el paso
pendiente; no avances como si hubiera pasado. Una revisión externa pendiente
no es una revisión aprobada. No amplíes permisos, servicios ni facturación
para sortear un fallo del aula.

## Trampas conocidas del ensayo de agosto

Los prompts incluyen controles para estas incidencias del ensayo; se deben
volver a comprobar sobre la implementación real de cada clase.

| Trampa                                                                                             | Dónde se trata                      |
| -------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Better Auth rechaza `POST` con cookie y sin `Origin` (tests, Postman, curl)                        | 1·03, 2·04, verificador             |
| Los tests escribían en `data/` (incluido el outbox)                                                | 1·03 (arnés de tests)               |
| Al cambiar de usuario en la pestaña se veía la caché del anterior                                  | 1·05                                |
| `UNIQUE` en `position` rompe los reordenados en transacción                                        | 2·01                                |
| `@dnd-kit/helpers` no está instalado; la API 0.5.1 no es la de `@dnd-kit/core`                     | 2·07                                |
| Bun corta las conexiones inactivas a los 10 s y el proxy de Vite también puede cortarlas           | 3·02                                |
| Escribir en el stream desde otra petición no llegaba al cliente en Bun                             | 3·02                                |
| Los nombres que usan sesiones posteriores (`applyBoardMove`, `useBoardEvents`…) no estaban fijados | contratos de cada prompt            |
| libSQL aplica las FK: sin cascada, borrar una tarea con comentarios falla                          | 2·01, 4·01                          |
| `ana@demo.test` contiene una `@`: el parser no debe tomarlo por mención                            | 4·04                                |
| Fechas ISO que Zod rechaza y una campana que pinta el éxito vacío como error                       | 4·05                                |
| `data/outbox.jsonl` está versionado con líneas del ensayo                                          | 4·07                                |
| `AGENTS.md` pasó de 66 a 386 líneas y entra en cada sesión y subagente                             | cada prompt (se actualiza en sitio) |

## Contratos entre prompts

Los nombres que fija un prompt los usan los siguientes. Si en el repo ya existe
un equivalente con otro nombre, el agente lo reutiliza y lo dice en el plan.

| Prompt | Contrato                                                                                                                                                                                                           |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1·01   | `/api/auth/*`, `auth`, `AUTH_RATE_LIMIT_MAX`, `authClient`, `signUpInputSchema`, `signInInputSchema`                                                                                                               |
| 1·03   | `GET /api/workspaces` (con `projects`), `GET /api/projects/:projectId`, `requireSession`, `listWorkspacesForUser`, `getProjectForMember`, `upsertWorkspace`, `addWorkspaceMember`, `upsertProject`, arnés de tests |
| 1·04   | `bun run db:seed`, Ana y Luis, `ws_thepower_demo`, `proj_agentic_kanban`, `ws_ana_demo`, `proj_ana_notes`                                                                                                          |
| 1·05   | `useWorkspaces`, `workspace-accent.ts`, queryKeys con `userId` y `queryClient.clear()` al salir                                                                                                                    |
| 2·02   | `col_kanban_*`, `task_kanban_1..5`, `col_ana_*`, `task_ana_1`                                                                                                                                                      |
| 2·03   | `GET /api/projects/:projectId/board`, `POST /api/projects/:projectId/tasks`, `PATCH` y `DELETE /api/tasks/:taskId`, schemas de `board.ts`                                                                          |
| 2·05   | `useBoard`, `boardQueryKey`, `useTaskMutations`, `mutationKey` `["board", projectId]`, `TaskFormDialog`                                                                                                            |
| 2·06   | `POST /api/tasks/:taskId/move`, `moveTaskBodySchema`                                                                                                                                                               |
| 2·07   | `applyBoardMove`, `useMoveTask`                                                                                                                                                                                    |
| 3·01   | `boardEventSchema` (`task.created`, `task.updated`, `task.deleted`, `task.moved`)                                                                                                                                  |
| 3·02   | `GET /api/projects/:projectId/events`, hub `subscribe`/`publish`                                                                                                                                                   |
| 3·04   | `applyBoardEvent`, `useBoardEvents`                                                                                                                                                                                |
| 4·02   | `GET`/`POST /api/tasks/:taskId/comments`, `commentSchema`                                                                                                                                                          |
| 4·03   | `useComments`, `useCreateComment`, `TaskComments`                                                                                                                                                                  |
| 4·04   | `extractMentionTokens`, `apps/api/src/mail/outbox.ts`, `OUTBOX_PATH`                                                                                                                                               |
| 4·05   | `GET /api/notifications`, `POST /api/notifications/:notificationId/read`, `notificationSchema`, `NotificationBell`                                                                                                 |
| 4·06   | `comment.created` en `boardEventSchema`                                                                                                                                                                            |
