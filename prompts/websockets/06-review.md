# Sesión 3 · 06 — Revisión como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades. Se ejecuta en un
chat nuevo de Agent con Opus: revisas el código, no la conversación que lo
produjo.

## Alcance

Todo lo implementado en la Sesión 3 (prompts 01–05) y las regresiones sobre
las Sesiones 1 y 2, contrastado con `AGENTS.md`, `.cursor/rules/` y los
prompts `prompts/websockets/01-events.md` a `05-reconnect-toasts.md`. El
profesor te da `BASE_CLASE`: el cambio es `git diff "$BASE_CLASE"` más los
archivos nuevos sin seguimiento de `git status --short`.

## Cómo trabajar

1. **Comprobar.** Ejecuta `vp check`, `vp test` y, por
   `http://localhost:5173`, las «Pruebas HTTP del canal» de
   `prompts/websockets/README.md`:
   - Canal sin cookie → 401.
   - Luis en `/api/projects/proj_ana_notes/events` → 404.
   - Ana en `/api/projects/proj_agentic_kanban/events` sin `Upgrade` → 426.
   - Luis `GET /api/projects/proj_ana_notes/board` → 404 (regresión de la
     Sesión 2).

   Después, con «Probar el canal», el WebSocket de Ana sigue abierto a los
   25 s, y una tarea creada por Ana llega al canal de Luis.

2. **Contrastar.** Revisa las dimensiones de abajo y confirma cada hallazgo en
   el código con `ruta:línea` y un escenario concreto.
3. **Corregir y verificar.** Corrige los problemas confirmados y repite los
   checks afectados. Si el profesor indica que vais tarde, corrige solo los
   de severidad alta y deja el resto como pendiente.

## Qué revisa cada dimensión

1. **Transporte y autorización.**
   - Escrituras solo por HTTP: el WebSocket solo anuncia y el servidor no
     define `onMessage`.
   - Antes del upgrade: 401 sin sesión, 404 sin membresía (nunca 403) y 426
     sin `Upgrade`.
   - `ws: true` en el proxy.
   - Bajas del hub al cerrar.
   - Sin Socket.IO, Redis ni servicios extra.
2. **Publicación y contrato.**
   - Eventos solo después de que la transacción se confirme y ninguno si la
     escritura falla.
   - `actorUserId` sale de la sesión.
   - `publish` nunca lanza ni convierte una escritura guardada en 5xx.
   - Zod en los dos lados; eventos inválidos ignorados en el cliente.
3. **Cliente.**
   - Un solo `WebSocket` por tablero, cerrado al salir.
   - Ningún canal sin board cargado ni para un 404.
   - Ningún reintento tras desmontar ni en el doble montaje de `StrictMode`.
   - Espera creciente; invalidación al abrir y si llega un evento durante un
     fetch.
   - Ningún board en `useState`.
   - El eco propio no rompe el optimista y el autor no recibe toast.
4. **Alcance, regresiones y documentación.**
   - Nada de presencia, notificaciones persistidas ni comentarios.
   - Las pruebas de las Sesiones 1 y 2 siguen pasando.
   - `AGENTS.md` y `.cursor/rules/` describen el árbol actual, ya no llaman
     placeholder al realtime y siguen siendo breves.

## Entrega

Una línea por problema real, del más grave al menos grave:
`severidad (alta/media/baja) | ruta:línea | problema | escenario | corrección mínima`.
Añade los checks y pruebas con su resultado real, los hallazgos descartados
con motivo y lo que siga pendiente. Si no hay problemas reales, dilo.
