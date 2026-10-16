# Prompts de clase — Agentic Kanban

Guía para ejecutar en directo los 28 prompts del bloque con Claude Code: Opus
como agente principal y subagentes Sonnet y Haiku definidos en
`.claude/agents/`.

## Mapa del bloque

| Sesión  | Fecha      | Carpeta          | Prompts | Resultado al terminar                             |
| ------- | ---------- | ---------------- | ------- | ------------------------------------------------- |
| 1 (S9)  | Mié 21 oct | `auth/`          | 01–06   | Login por cookie, workspaces aislados, dashboard  |
| 2 (S10) | Lun 26 oct | `kanban/`        | 01–08   | Tablero con CRUD, orden y drag-and-drop optimista |
| 3 (S11) | Mié 28 oct | `websockets/`    | 01–06   | Dos sesiones sincronizadas por SSE, con toasts    |
| 4 (S12) | Mié 4 nov  | `notifications/` | 01–08   | Comentarios, menciones, campana, outbox y demo    |

Cada prompt indica su tiempo objetivo, coherente con el guion de las
presentaciones de `presentaciones/`.

## Quién hace qué

| Agente               | Modelo | Para qué                                                                             |
| -------------------- | ------ | ------------------------------------------------------------------------------------ |
| principal            | Opus   | Plan, contratos compartidos, partes delicadas, integración y revisión final del diff |
| `kanban-recon`       | Haiku  | Mapa de solo lectura del estado actual y de las APIs instaladas                      |
| `kanban-implementer` | Sonnet | Una parte acotada del plan, con ficheros propios                                     |
| `kanban-verifier`    | Haiku  | Puerta de calidad y pruebas HTTP; nunca edita                                        |
| `kanban-reviewer`    | Sonnet | Revisión de solo lectura de una dimensión, en los prompts de revisión                |

Por qué este reparto: Opus decide lo que es caro equivocarse (contratos,
autorización, transacciones); Sonnet ejecuta en paralelo partes con ficheros
disjuntos; Haiku hace lo mecánico (leer, ejecutar comandos, resumir salidas
largas) y así el contexto del principal queda limpio. Los prompts piden los
subagentes de forma explícita porque algunas configuraciones solo delegan
cuando se pide. Los cambios pequeños los hace Opus directamente: crear un
subagente cuesta más de lo que ahorra. Si se usa una herramienta sin
subagentes, cada prompt funciona igual haciendo los pasos en orden.

## Antes de cada clase

- [ ] `git status` limpio y una rama de clase desde el punto de partida
      (`git switch -c clase-2`, por ejemplo).
- [ ] Si existe `.codex-tmp/`, bórrala: sus ficheros sin formatear hacen fallar
      `vp check`.
- [ ] `bun install --frozen-lockfile` y `docker compose up --build -d`;
      `curl -s localhost:5173/api/health` debe devolver `ok`.
- [ ] Claude Code con Opus (`/model`) y `/agents` lista `kanban-recon`,
      `kanban-implementer`, `kanban-verifier` y `kanban-reviewer`.
- [ ] Permisos preparados para no aprobar cada comando en directo: `vp`,
      `bun run`, `docker compose` y `curl`.
- [ ] Desde la Sesión 1 · 04: dos navegadores, Ana en uno normal y Luis en una
      ventana privada.
- [ ] Ensayo completo con estos prompts y un checkpoint por prompt que puedas
      recuperar en clase.

## El ritual de cada prompt

1. `/clear`: cada prompt es autocontenido y vuelve a leer `AGENTS.md`, las
   reglas y el código. Un contexto limpio es más rápido y más barato.
2. Modo plan (Shift+Tab hasta ver el modo plan) y pega el prompt entero.
3. Lee el plan en voz alta. Corrige lo que haga falta y aprueba.
4. Narra el trabajo de los subagentes mientras implementan.
5. Repasa «Hecho cuando»: lo automático lo trae el verificador; lo manual lo
   haces tú en el navegador.
6. Commit de checkpoint con el mensaje que propone el agente.

Los prompts de revisión (`06`/`08`) no editan: devuelven hallazgos verificados
y un plan mínimo. Si lo apruebas, la corrección es un paso más.

## Base de datos en clase

- Las migraciones se **generan** en el Mac (`bun run db:generate`).
- Con Compose arriba, se **aplican** y se **seedean** dentro del contenedor:
  `docker compose exec api bun run db:migrate` y
  `docker compose exec api bun run db:seed`. Así nunca hay dos procesos de
  distintas máquinas peleando por el mismo `.db`.
- Nunca arranques una segunda API en el Mac con Compose arriba.
- Los tests de la API usan su propia base (desde la Sesión 1 · 03): no ensucian
  los datos de la demo.
- El reset (`docker compose down`, borrar `data/*.db*` y
  `data/outbox.jsonl`, levantar, migrar y seedear) se hace antes de clase,
  nunca en mitad de una demo.

## Si algo se tuerce

- Pide al agente que diagnostique con la salida del verificador; no pegues
  logs enteros.
- Si un paso se pasa más de 5 minutos de su tiempo, guarda el trabajo
  (`git stash -u`), vuelve al último checkpoint y sigue desde ahí. El paso
  pendiente se puede enseñar después.
- Las ramas `fase1`–`fase4` son el ensayo de agosto sobre un starter anterior
  (antes de Bun 1.4.3 y Vite+ 1.3.0). Sirven para consultar soluciones, no
  para hacer checkout en clase sin probarlas antes.

## Trampas conocidas del ensayo de agosto

Ya están resueltas en los prompts; conviene conocerlas por si salen.

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

| Prompt | Contrato                                                                                                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1·01   | `/api/auth/*`, `auth`, `authClient`, `signUpInputSchema`, `signInInputSchema`                                                                                                    |
| 1·03   | `GET /api/workspaces` (con `projects`), `GET /api/projects/:projectId`, `requireSession`, `listWorkspacesForUser`, `getProjectForMember`, arnés de tests en `apps/api/src/test/` |
| 1·04   | `bun run db:seed`, Ana y Luis, `ws_thepower_demo`, `proj_agentic_kanban`, `ws_ana_demo`, `proj_ana_notes`                                                                        |
| 1·05   | `useWorkspaces`, `workspace-accent.ts`, queryKeys con `userId` y `queryClient.clear()` al salir                                                                                  |
| 2·02   | `col_kanban_*`, `task_kanban_1..5`, `col_ana_*`, `task_ana_1`                                                                                                                    |
| 2·03   | `GET /api/projects/:projectId/board`, `POST /api/projects/:projectId/tasks`, `PATCH` y `DELETE /api/tasks/:taskId`, schemas de `board.ts`                                        |
| 2·05   | `useBoard`, `boardQueryKey`, `useTaskMutations`, `mutationKey` `["board", projectId]`, `TaskFormDialog`                                                                          |
| 2·06   | `POST /api/tasks/:taskId/move`, `moveTaskBodySchema`                                                                                                                             |
| 2·07   | `applyBoardMove`, `useMoveTask`                                                                                                                                                  |
| 3·01   | `boardEventSchema` (`task.created`, `task.updated`, `task.deleted`, `task.moved`)                                                                                                |
| 3·02   | `GET /api/projects/:projectId/events`, hub `subscribe`/`publish`                                                                                                                 |
| 3·04   | `applyBoardEvent`, `useBoardEvents`                                                                                                                                              |
| 4·02   | `GET`/`POST /api/tasks/:taskId/comments`, `commentSchema`                                                                                                                        |
| 4·03   | `useComments`, `useCreateComment`, `TaskComments`                                                                                                                                |
| 4·04   | `extractMentionTokens`, `apps/api/src/mail/outbox.ts`, `OUTBOX_PATH`                                                                                                             |
| 4·05   | `GET /api/notifications`, `POST /api/notifications/:notificationId/read`, `notificationSchema`, `NotificationBell`                                                               |
| 4·06   | `comment.created` en `boardEventSchema`                                                                                                                                          |
