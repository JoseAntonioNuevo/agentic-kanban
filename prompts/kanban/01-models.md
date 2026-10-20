# Sesión 2 · 01 — Columnas y tareas

## Punto de partida

La Sesión 1 está completa: auth con Better Auth, `workspace`,
`workspace_member` y `project`, lecturas autorizadas, seed de Ana y Luis y
dashboard. Todavía no hay columnas ni tareas.

## Objetivo

El modelo de datos del tablero, con un orden que persiste.

## Requisitos

- `column`: `id` (text, PK), `workspace_id`, `project_id`, `name`, `position`,
  `created_at`.
- `task`: `id` (text, PK), `workspace_id`, `project_id`, `column_id`, `title`,
  `description` (texto, `""` por defecto), `position`, `created_at`.
- Claves foráneas hacia `workspace`, `project` y `column` con
  `onDelete: "cascade"`: libSQL aplica las FK y, sin cascada, borrar una
  columna o un project fallaría.
- `position` es un entero ≥ 0 **sin** `UNIQUE`: al reordenar dentro de una
  transacción, la unicidad se rompería a mitad de camino. Usa índices no
  únicos: `(project_id, position)` en `column`, `(column_id, position)` en
  `task`, y `workspace_id` en ambas.
- Cada fila guarda su `workspace_id` para filtrar por tenant sin depender de
  lo que mande el cliente; la API se encargará de que coincida con el del
  project.
- Mismo modo de timestamp que el resto de tablas. Una migración nueva; no
  edites las anteriores. Aplícala con
  `docker compose exec api bun run db:migrate` si Compose está arriba.

## Fuera de alcance

API, frontend, seed, responsables, etiquetas y fechas límite.

## Cómo trabajar

**Cursor: Agent con Grok 4.7 xhigh Fast como único ejecutor.** El profesor
ya ha revisado el plan inicial de Opus y lo adjunta a este paso. Lee
`AGENTS.md`, `prompts/CURSOR.md`, `prompts/kanban/README.md`, ese plan, las
reglas implicadas y el código. No uses Task, subagentes, agentes históricos
ni cambio automático de modelo. No hagas commit ni implementes pasos futuros.

Este prompt autoriza su alcance y sus correcciones locales, aunque la
documentación de partida diga «aún no existe». Ejecuta sin otro «adelante»
ni pausa de aprobación. El plan guía la sesión; verifica sus supuestos contra
el código. Adapta detalles locales conservando contratos y comunica solo los
conflictos importantes que necesiten una decisión. No vuelvas a Opus por rutina.

1. **Inspeccionar.** Confirma schema actual, timestamps, FK existentes y generación de migraciones.
2. **Implementar.** Tablas, cascadas e índices del plan; conserva posiciones sin UNIQUE. Implementa
   tablas, reexport, migración generada y documentación de «Al terminar».
3. **Comprobar.** Aplica la migración dentro de `api`, pasa `vp check` y `vp test` y comprueba health.
4. **Revisar y corregir.** Lee tu diff, corrige los problemas confirmados y
   repite los checks afectados. Actualiza la documentación de «Al terminar»
   sin borrar el reparto de modelos. Distingue la evidencia automática y la
   aceptación manual pendiente. CodeRabbit solo por una duda importante;
   el cierre del conjunto se decide en el 08.

## Hecho cuando

- [ ] Hay un SQL nuevo en `packages/db/migrations/` con las dos tablas, sus FK
      e índices, y se aplicó.
- [ ] `vp check` y `vp test` en verde; `GET /api/health` sigue OK.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (tablas del tablero sí; HTTP no) y
`.cursor/rules/db.mdc`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
