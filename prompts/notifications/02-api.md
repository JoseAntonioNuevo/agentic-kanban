# Sesión 4 · 02 — La API de comentarios

## Punto de partida

Tablas `comment` y `notification` (01). `requireSession`, el patrón de rutas y
el arnés de tests con su propia base existen desde la Sesión 1.

## Objetivo

Leer y crear los comentarios de una tarea con la misma autorización de
siempre.

## Contratos que fijas aquí

| Método y ruta                      | Body       | Respuesta                       |
| ---------------------------------- | ---------- | ------------------------------- |
| `GET /api/tasks/:taskId/comments`  | —          | 200 `commentListResponseSchema` |
| `POST /api/tasks/:taskId/comments` | `{ body }` | 201 `commentSchema`             |

- `commentSchema` en `packages/schemas/src/comment.ts`:
  `{ id, taskId, projectId, authorId, authorName, body, createdAt }`, con
  `createdAt` como string ISO. `authorName` sale de un join con `user.name`.
- `createCommentBodySchema`: `body` recortado, de 1 a 2000 caracteres.
- Rutas en `apps/api/src/routes/comments.ts`; consultas `ForMember` en
  `@agentic-kanban/db`.

## Requisitos

- Sin sesión → 401. No miembro o tarea inexistente → 404, nunca 403. El
  `workspace_id` sale de la fila de la tarea, no del cliente.
- La lista se ordena por `created_at` ascendente.
- Datos solo vía `@agentic-kanban/db`; respuestas pasadas por `.parse()`.
- Tests con el arnés: 401; Luis lee y comenta en una tarea del workspace
  privado de Ana → 404 en los dos casos; un miembro crea y lista con
  `authorName`; body vacío → 400; borrar una tarea con comentarios sigue
  devolviendo 204 (la cascada funciona).

## Fuera de alcance

Menciones, email, campana, publicación por SSE y frontend. No cambies las
rutas del tablero ni el stream.

## Cómo trabajar

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`,
`prompts/notifications/README.md`, las reglas implicadas y el código. Usa
`kanban-grok-worker` y pasa `model: "grok-4.7-xhigh-fast"` explícito en cada
nueva Task si está en el catálogo; aplica el protocolo común si cambia.
No uses omisión, `inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza el paso y sus correcciones locales. Opus coordina,
fija contratos y revisa; Grok inspecciona, implementa, prueba y actualiza el
estado documentado. Continúa sin «adelante» ni aprobación rutinaria del plan.
No hagas commit, no escribas tú la app ni implementes pasos siguientes.

1. **Inspección (Grok).** Confirma rutas, `requireSession`, consultas `ForMember`
   y arnés de tests.
2. **Contratos y reparto (Opus); implementación (Grok).** Fija schemas, rutas y firmas. Primero schemas de `comment.ts`; después
   consultas/rutas y tests pueden avanzar con archivos independientes.
   Asigna montaje, barrels y documentación a un responsable.
3. **Comprobaciones y revisión.** Grok pasa `vp check`, `vp test` y prueba por `:5173`: Ana comenta en
   `task_kanban_1` → 201; Luis `GET /api/tasks/task_ana_1/comments` → 404.
   Opus revisa autor desde sesión, autorización de tarea y fechas ISO.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Las dos pruebas HTTP dan 201 y 404.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (comentarios por HTTP sí; menciones no). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
