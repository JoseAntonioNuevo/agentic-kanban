# Sesión 1 · 05 — El tenant visible en el dashboard

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

## Fuera de alcance

Tablero, React Router, escrituras HTTP, CORS, RBAC y paquetes nuevos. Health
no se toca.

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

1. **Inspección (Grok).** Lee `use-health.ts`, `App.tsx`, `authClient`,
   `queryClient` y la respuesta real de `GET /api/workspaces`.
2. **Contratos (Opus).** Fija hook, queryKey, pérdida/cambio de sesión,
   limpieza de caché y color. Asigna los archivos de hooks y componentes si
   pueden avanzar de forma independiente; un único responsable integra `App.tsx`.
3. **Implementación y comprobaciones (Grok).** Web y documentación de
   «Al terminar», `vp check`, `vp test` y pruebas HTTP. Deja separadas las
   comprobaciones del navegador que debe observar el profesor.
4. **Revisión (Opus).** Examina identidad, respuestas tardías y caché al salir.
   Encarga a Grok las correcciones y repite los checks afectados. No pares
   para aprobar el plan ni hagas pasar una explicación por prueba manual.

La revisión del cambio completo se decide en el 06. No añadas una pasada de
CodeRabbit solo por terminar el dashboard.

## Requisitos

- Copia el patrón de `apps/web/src/hooks/use-health.ts`: `useQuery`, `fetch`
  relativo a `/api/workspaces` con `credentials: "include"`, el JSON como
  `unknown` y `workspaceListResponseSchema.parse`. Nunca un cast.
- La convención de queryKey y caché evita que, al cambiar de usuario en la
  misma pestaña, se vean datos del anterior.
- El `userId` sale de `authClient.useSession()`, la única excepción a TanStack
  Query para estado de servidor; los datos de la API van por `useQuery`.
- Sin sesión válida no se renderiza el dashboard privado ni se ejecutan sus
  queries. Al salir o cambiar de identidad, cancela/descarta las peticiones
  privadas anteriores y limpia su estado; una respuesta tardía de Ana no
  debe reaparecer en la vista de Luis. Mantén `queryClient.clear()` al salir.
- Lista bajo la card de health en `App.tsx`: nombre del workspace, un swatch de
  color y los nombres de sus projects (aún sin enlace).
- El color depende solo de `workspace.id`, nunca del nombre o el email del
  usuario: Ana y Luis ven el mismo color en `ws_thepower_demo`.
- Estados con mensajes distintos: cargando, error y lista vacía (que es válida).

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Navegador (lo compruebo yo): Ana ve «thePower Demo» y «Espacio de Ana»;
      Luis, en una ventana privada, solo «thePower Demo», con el mismo color.
- [ ] Navegador (lo compruebo yo): Ana cierra sesión y entra Luis en la misma
      pestaña: no aparece el espacio de Ana. Compruebo también sin sesión y
      con una petición de workspaces pendiente: no reaparece contenido
      privado ni se siguen lanzando consultas privadas sin sesión. Grok
      explica qué código lo garantiza, pero no da esta prueba por observada.
- [ ] Luis `GET /api/projects/proj_ana_notes` → 404; health OK.

## Al terminar

Actualiza `AGENTS.md`,
`.cursor/rules/web.mdc`, `.cursor/rules/scope.mdc` y el README (Ana ve dos
espacios; Luis, uno). No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
