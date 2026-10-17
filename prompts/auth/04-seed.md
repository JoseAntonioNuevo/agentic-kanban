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

Sigue los cinco pasos de `AGENTS.md`. Tú planificas y, al final, corriges.
Hasta el «adelante» no se editan ficheros. Durante la implementación solo
escriben los `kanban-implementer`. No hagas commit.

1. **Investigar.** Un `kanban-recon`: `auth.api.signUpEmail` instalado,
   consultas reutilizables de `packages/db` y scripts de `package.json`.
2. **Planificar.** Tú. Como máximo 10 líneas: cómo se crean los usuarios sin
   saltarse Better Auth y cómo un segundo seed no duplica. Para y espera mi
   «adelante».
3. **Implementar.** Un `kanban-implementer`: seed, scripts, consultas de
   upsert que falten y documentación de «Al terminar».
4. **Verificar.** Un `kanban-verifier`: ejecuta el seed dos veces, cuenta
   filas y hace los logins y lecturas de «Hecho cuando».
5. **Revisar.** Tú lees el diff y el informe, corriges y pules, y vuelves a
   lanzar `kanban-verifier`.

## Requisitos

- Usuarios con `auth.api.signUpEmail` de Better Auth: sin INSERT en `user` o
  `account`, sin hash propio y sin HTTP a `/api/auth`. Si el email ya existe,
  reutiliza su `user.id`.
- Workspaces, projects y memberships con upsert por `id` y por
  `UNIQUE (workspace_id, user_id)`. Nunca DELETE masivo.
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

El implementador que cierra el paso actualiza `AGENTS.md` (seed y cuentas
demo) y el README (cómo seedear y el orden migrar → seedear). No hagas
commit. Cierra con el resumen que pide `AGENTS.md`.
