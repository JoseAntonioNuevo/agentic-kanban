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

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`, `prompts/auth/README.md`,
las reglas implicadas y el código. Usa `kanban-grok-worker` con
`model: "grok-4.7-xhigh-fast"` explícito en cada nueva Task si está en el catálogo;
si cambia, aplica el protocolo de la guía común. No omitas `model`, no uses
`inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza su alcance y sus correcciones locales aunque el estado
anterior diga «aún no existe». Opus coordina, fija contratos y revisa; Grok
inspecciona, implementa, prueba y actualiza la documentación al cerrar. No
pidas «adelante», no hagas commit ni implementes los pasos siguientes.

1. **Inspección (Grok).** Confirma `auth.api.signUpEmail` instalado, consultas
   reutilizables de `packages/db` y scripts existentes.
2. **Contratos (Opus).** Fija cómo crear usuarios mediante Better Auth,
   reutilizar IDs y evitar duplicados. Los datos de esta clase están cerrados;
   continúa sin otro «adelante». Un worker puede ejecutar el paso completo.
3. **Implementación (Grok).** Seed, scripts, consultas necesarias y documentación.
4. **Comprobaciones (Grok).** Ejecuta el seed dos veces, cuenta filas demo y
   demuestra logins y lecturas de «Hecho cuando», con cookie jar separado y
   `Origin` en los POST de auth. Ejecuta `vp check` y `vp test`; no borres datos.
   Los sign-in cuentan para el rate limit del 01 (10 por minuto y ruta): si
   recibes 429, espera la ventana; no lo desactives.
5. **Revisión (Opus).** Contrasta idempotencia e identidad de cada cuenta.
   Devuelve fallos a Grok y repite los checks afectados sin pausa de aprobación.

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
