# Sesión 1 · 05 — El tenant visible en el dashboard

Tiempo en clase: ~8 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 10 líneas
como máximo y espera mi «adelante».

## Punto de partida

El seed crea a Ana (dos workspaces) y a Luis (uno). `GET /api/workspaces`
devuelve cada workspace con sus projects (prompt 03). Si el `.db` es anterior
al seed, vuelve a ejecutar `db:seed`: es idempotente.

## Objetivo

Tras el login, el dashboard lista los workspaces del usuario y sus projects,
con un acento de color que identifica a cada workspace.

## Contratos que fijas aquí

- `useWorkspaces(userId)` en `apps/web/src/hooks/use-workspaces.ts`.
- Función pura de color en `apps/web/src/lib/workspace-accent.ts`.
- Convención para todas las queries de datos del usuario: la queryKey incluye
  el `userId`, y al cerrar sesión se vacía la caché con `queryClient.clear()`.

## Requisitos

- Copia el patrón de `apps/web/src/hooks/use-health.ts`: `useQuery`, `fetch`
  relativo a `/api/workspaces` con `credentials: "include"`, el JSON como
  `unknown` y `workspaceListResponseSchema.parse`. Nunca un cast.
- La convención de queryKey y caché evita que, al cambiar de usuario en la
  misma pestaña, se vean datos del anterior.
- Lista bajo la card de health en `App.tsx`: nombre del workspace, un swatch de
  color y los nombres de sus projects (aún sin enlace).
- El color depende solo de `workspace.id`, nunca del nombre o el email del
  usuario: Ana y Luis ven el mismo color en `ws_thepower_demo`.
- Estados con mensajes distintos: cargando, error y lista vacía (que es válida).

## Fuera de alcance

Tablero, React Router, escrituras HTTP, CORS, RBAC y paquetes nuevos. Health
no se toca.

## Cómo trabajar

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): `use-health.ts`, `App.tsx`, `authClient`, `queryClient` y la respuesta real de `GET /api/workspaces`.
2. **Planificar** — tú: hook, queryKey, limpieza de la caché y cómo se pinta el acento. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): uno solo: la web y la documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad y pruebas HTTP de «Hecho cuando».
5. **Revisar** — tú revisas el diff completo. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Navegador (lo compruebo yo): Ana ve «thePower Demo» y «Espacio de Ana»;
      Luis, en una ventana privada, solo «thePower Demo», con el mismo color.
- [ ] Ana cierra sesión y entra Luis en la misma pestaña: no aparece el
      espacio de Ana.
- [ ] Luis `GET /api/projects/proj_ana_notes` → 404; health OK.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md`, `.cursor/rules/web.mdc` y el README (Ana ve dos
espacios; Luis, uno). No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
