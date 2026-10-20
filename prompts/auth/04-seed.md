# Sesión 1 · 04 — Datos de aula repetibles

## Punto de partida

Auth, tablas multi-tenant y lecturas autorizadas (prompts 01–03).

## Objetivo

Un seed determinista e idempotente para demostrar el aislamiento con datos
conocidos. La API nunca seedea al arrancar.

## Datos (exactamente estos)

| Tipo      | Datos                                                        |
| --------- | ------------------------------------------------------------ |
| usuario   | nombre `Ana`, `ana@demo.test`                                |
| usuario   | nombre `Luis`, `luis@demo.test`                              |
| password  | `Demo1234!` para los dos (ficticia, solo aula)               |
| workspace | `ws_thepower_demo` «thePower Demo»: miembros Ana y Luis      |
| project   | `proj_agentic_kanban` «Agentic Kanban» en `ws_thepower_demo` |
| workspace | `ws_ana_demo` «Espacio de Ana»: solo Ana                     |
| project   | `proj_ana_notes` «Notas de Ana» en `ws_ana_demo`             |

El tenant es el workspace, no el usuario. Los nombres `Ana` y `Luis` importan:
en la Sesión 4 las menciones `@Ana` y `@Luis` se resuelven por `user.name`.

## Fuera de alcance

Endpoints, UI, CORS, paquetes nuevos y más filas de las de la tabla.

## Cómo trabajar

**Cursor: Grok 4.7 Fast directamente como agente principal.** Lee `AGENTS.md`,
`prompts/auth/README.md`, las reglas implicadas y el código. No delegues ni
lances Opus, subagentes (`kanban-*` ni integrados de Cursor) o CodeRabbit por
rutina. No hagas commit.

Este prompt es la petición del curso que autoriza el seed y las cuentas demo:
si `AGENTS.md` o `.cursor/rules/` dicen «sin usuarios demo» o «sin seed», se
refieren al estado anterior a este paso; actualízalos al cerrar.

1. Inspecciona `auth.api.signUpEmail` instalado, consultas reutilizables de
   `packages/db` y scripts existentes.
2. Explica en hasta 8 líneas cómo creas los usuarios mediante Better Auth,
   reutilizas IDs y evitas duplicados. Continúa sin otro «adelante»: los
   datos y criterios están cerrados.
3. Implementa seed, scripts, consultas necesarias y documentación.
4. Ejecuta el seed dos veces, cuenta las filas demo y demuestra los logins
   y lecturas de «Hecho cuando», con cookie jar separado y `Origin` en los
   POST de auth. Ejecuta `vp check` y `vp test`. Corrige los fallos del paso
   y repite las comprobaciones afectadas; no borres datos para lograrlo.
   Los sign-in de prueba cuentan para el rate limit del 01 (10 por minuto y
   ruta): si recibes 429, espera a que pase la ventana; no lo desactives.

Si surge una decisión importante no cubierta, explica la duda para que el
profesor decida si usar Opus; no cambies de modelo ni añadas otro agente en
silencio. Al cerrar, relaciona la ejecución directa con el alcance definido
y las pruebas de idempotencia observadas.

## Requisitos

- Usuarios con `auth.api.signUpEmail` de Better Auth: sin INSERT en `user` o
  `account`, sin hash propio y sin HTTP a `/api/auth`. Si el email ya existe,
  reutiliza su `user.id` (mediante una consulta en `@agentic-kanban/db`).
- Workspaces, projects y memberships con `upsertWorkspace`, `upsertProject` y
  `addWorkspaceMember` de `@agentic-kanban/db` (upsert por `id` y por
  `UNIQUE (workspace_id, user_id)`). Nunca DELETE masivo.
- Script en `apps/api/src/seed.ts` (los datos de tenant solo vía
  `@agentic-kanban/db`), script `seed` en `apps/api/package.json` y `db:seed`
  en la raíz (`bun --filter @agentic-kanban/api seed`). Organízalo por bloques:
  la Sesión 2 añadirá columnas y tareas.
- Usa el mismo `.db` que la migración. Con Compose arriba, ejecútalo con
  `docker compose exec api bun run db:seed`. Después de un reset: migrar y
  luego seedear.

## Hecho cuando

- [ ] El seed corre dos veces sin errores y sin duplicar: Ana y Luis existen
      una sola vez (puede haber otros usuarios de pruebas anteriores), 2
      workspaces y 2 projects demo, 3 memberships.
- [ ] `POST /api/auth/sign-in/email` con Ana y con Luis → 200.
- [ ] Con la cookie de Ana `GET /api/workspaces` → 2 workspaces; con la de
      Luis → 1. Luis `GET /api/projects/proj_ana_notes` → 404.
- [ ] `vp check` y `vp test` en verde; health OK.

## Al terminar

Actualiza `AGENTS.md` (seed y cuentas
demo) y el README (cómo seedear y el orden migrar → seedear). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
