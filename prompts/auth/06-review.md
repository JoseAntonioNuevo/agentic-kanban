# Sesión 1 · 06 — Revisión como una PR

Tiempo en clase: ~9 min. Es una revisión: no modifiques código hasta que
apruebe el plan de corrección.

## Alcance

Todo lo implementado en la Sesión 1 (prompts 01–05), contrastado con
`AGENTS.md`, `.cursor/rules/` y los propios prompts. No añadas funcionalidades.

## Cómo trabajar

Usa los subagentes de `.claude/agents/`. Lanza en paralelo:

- `kanban-verifier` (Haiku): `vp check`, `vp test` y estas pruebas por
  `http://localhost:5173`: `GET /api/workspaces` sin cookie → 401; Ana → 2
  workspaces; Luis → 1; Luis `GET /api/projects/proj_ana_notes` → 404;
  `GET /api/health` → 200.
- Cuatro `kanban-reviewer` (Sonnet), uno por dimensión, con la lista de abajo.

Después, tú (Opus) compruebas cada hallazgo en el código. Descarta lo que no
se sostenga con `ruta:línea` y un escenario concreto, y consolida.

## Qué revisa cada dimensión

1. **Autorización y aislamiento.** Sesión por `getSession` con los headers; 401
   sin sesión; membresía en `workspace_member`; 404 si no es miembro, nunca
   403; el `workspace_id` sale de la fila; ninguna consulta tenant-owned sin
   filtro (IDOR); ningún `GET` por id de project sin membresía; la API no
   importa `drizzle-orm` ni `@libsql/client`.
2. **Contratos y tests.** Schemas en `@agentic-kanban/schemas`;
   `@hono/zod-validator` en los params de los `GET`; `/api/auth/*` sin
   envolver; respuestas pasadas por `.parse()`; tests que prueban de verdad
   401, lista vacía, lista propia y 404, y que no tocan `data/`.
3. **Sesión y cliente.** Cookie httpOnly; `createAuthClient` sin `baseURL` a
   `:3000`; TanStack Query para health y workspaces (`useSession` es la única
   excepción); queryKeys con `userId` y caché vacía al cerrar sesión; color
   por `workspace.id`; rate limit solo en sign-up y sign-in; nada de
   `dangerouslySetInnerHTML`.
4. **Seed, alcance y documentación.** `signUpEmail`, idempotente, IDs fijos,
   no arranca solo, sin DELETE masivo, Luis no es miembro de `ws_ana_demo`;
   dependencias con versión exacta; nada de Next, Redux, React Router ni React
   Hook Form; `AGENTS.md` y `.cursor/rules/` describen el árbol actual y
   siguen siendo breves.

## Entrega

Una línea por problema real, del más grave al menos grave:
`severidad (alta/media/baja) | ruta:línea | problema | escenario | corrección mínima`.
Añade el resultado del verificador. Si no hay problemas reales, dilo. Después
propón el plan mínimo de corrección y espera mi aprobación. Si lo apruebo, aplica tú las correcciones y vuelve a pasar `kanban-verifier`
(Haiku).
