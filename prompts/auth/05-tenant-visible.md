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

**Cursor: Grok 4.7 Fast directamente como agente principal.** Lee `AGENTS.md`,
`prompts/auth/README.md`, las reglas de web y el código. No delegues, no hagas
commit ni lances una revisión adicional por rutina.

1. Inspecciona `use-health.ts`, `App.tsx`, `authClient`, `queryClient` y la
   respuesta real de `GET /api/workspaces`.
2. Explica en hasta 10 líneas hook, queryKey, pérdida/cambio de sesión,
   limpieza de caché y color. Continúa sin otro «adelante» dentro del alcance.
3. Implementa web y documentación de «Al terminar». Ejecuta `vp check`,
   `vp test` y las pruebas HTTP; deja separadas las comprobaciones de
   navegador que debe observar el profesor.
4. Revisa tu diff y corrige los fallos del paso. Si queda una duda concreta
   en sesión o caché, describe el escenario y la evidencia que falta para
   una revisión puntual con Opus, sin cambiar de modelo automáticamente.

La revisión del cambio completo se decide en el 06, con las evidencias de
estos pasos. No añadas una pasada de CodeRabbit solo por terminar el dashboard.

## Requisitos

- Copia el patrón de `apps/web/src/hooks/use-health.ts`: `useQuery`, `fetch`
  relativo a `/api/workspaces` con `credentials: "include"`, el JSON como
  `unknown` y `workspaceListResponseSchema.parse`. Nunca un cast.
- La convención de queryKey y caché evita que, al cambiar de usuario en la
  misma pestaña, se vean datos del anterior.
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
- [ ] Ana cierra sesión y entra Luis en la misma pestaña: no aparece el
      espacio de Ana. Comprueba también sin sesión y con una petición de
      workspaces pendiente: no reaparece contenido privado ni se siguen
      lanzando consultas privadas sin sesión.
- [ ] Luis `GET /api/projects/proj_ana_notes` → 404; health OK.

## Al terminar

Actualiza `AGENTS.md`,
`.cursor/rules/web.mdc` y el README (Ana ve dos espacios; Luis, uno). No
hagas commit. Cierra con el resumen que pide `AGENTS.md`.
