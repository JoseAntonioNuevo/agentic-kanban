# Sesión 3 · 02 — El canal WebSocket y el hub

## Punto de partida

`boardEventSchema` existe (01). `apps/api/src/realtime/index.ts` es un
placeholder. `requireSession` y `getProjectForMember` existen desde la Sesión 1.

## Objetivo

Un WebSocket autenticado por project, en este mismo proceso Hono, que se
queda abierto y entrega los eventos del hub. Las escrituras siguen por HTTP:
el canal solo anuncia. Este prompt todavía no publica nada.

## Contratos que fijas aquí

- Hub en memoria en `apps/api/src/realtime/index.ts`:
  - `subscribe(projectId, listener)` devuelve la función para darse de baja.
  - `publish(event)` valida con `boardEventSchema.safeParse` y reparte solo a
    los suscriptores de ese `projectId`; sin suscriptores no hace nada.
  - `publish` nunca lanza: un evento inválido se registra con `console.error`
    y no se envía, y un listener que falla no impide entregar a los demás. El
    03 publicará tras guardar, y un fallo del hub no puede convertir una
    escritura ya guardada en un 5xx.
- `GET /api/projects/:projectId/events` en `apps/api/src/routes/events.ts`,
  que se convierte en WebSocket. Cada mensaje es un texto con
  `JSON.stringify(event)`, sin envoltorio.

## Requisitos

- Cadena de la ruta, en este orden; nada se abre antes de autorizar:
  1. `requireSession` → 401 sin sesión.
  2. Validación del parámetro y `getProjectForMember` → 404 si no es miembro
     o el project no existe, nunca 403 (el `workspace_id` sale de la fila del
     project).
  3. Sin cabecera `Upgrade: websocket` (sin distinguir mayúsculas) → 426.
  4. `upgradeWebSocket` de `hono/bun` con los manejadores del project.
- El 426 lo escribes tú. En Hono 4.13.13, si `server.upgrade` falla,
  `upgradeWebSocket` llama a `next()` y la petición acabaría en 404. Si el
  `env` no trae el servidor de Bun, lanza `TypeError`.
- `upgradeWebSocket` y `websocket` de `hono/bun`. Sus tipos los marcan como
  deprecados en favor de `@hono/bun` para la v5, pero siguen disponibles y
  `vp check` los acepta. No instales `@hono/bun`.
- `boardSocketEvents(projectId)` devuelve los `WSEvents` (de `hono/ws`) y se
  exporta para probarla con un socket falso:
  - `onOpen` hace `subscribe` al hub de ese project con un listener que envía
    el evento serializado.
  - `onClose` se da de baja.
  - No hay `onMessage`: lo que mande el cliente se ignora, porque el canal no
    es una API de escritura.
- En `apps/api/src/index.ts`:
  - Monta la ruta como las demás y añade `websocket` al `export default`
    junto a `fetch`. Bun pasa el `server` como segundo argumento de `fetch`, y
    Hono lo recibe como `env` para hacer el upgrade.
  - Bun envía pings y corta a los 120 s sin actividad (`sendPings` e
    `idleTimeout` en `bun-types`): no añadas un keepalive propio ni toques el
    timeout HTTP.
  - `api` corre con `--hot`: tras añadir `websocket`, ejecuta
    `docker compose restart api` en vez de fiarte de la recarga en caliente.
- Proxy de Vite+ en `apps/web/vite.config.ts`: añade `ws: true` a `/api` para
  que reenvíe la apertura del WebSocket. Si Vite no recarga su configuración,
  ejecuta `docker compose restart web`.
- Tests con el arnés y los helpers de sesión de los tests existentes:
  - Hub: suscribir, publicar a un project y no a otro, darse de baja, un
    evento inválido que no se entrega ni lanza, y un listener que lanza sin
    afectar a los demás.
  - Ruta con `app.request(path, init, { server: { upgrade } })` y un
    `upgrade` simulado:
    - 401 sin cookie.
    - 404 para Luis en `proj_ana_notes` y para un project inexistente.
    - 426 para Ana sin `Upgrade`.
    - En esos cuatro casos `upgrade` no se llama. Con `Upgrade: websocket`,
      Ana provoca exactamente una llamada.
  - Manejadores con un socket falso (`{ send }`): tras `onOpen` reciben los
    eventos de su project y no los de otro; tras `onClose` dejan de
    recibirlos.
- `AGENTS.md` y `.cursor/rules/api.mdc` describen el canal y dejan de llamar
  placeholder al realtime (y de hablar de SSE). Todavía no existen la
  publicación ni el cliente.

## Fuera de alcance

Publicar desde las escrituras, frontend, toasts, presencia, comentarios,
escrituras por el WebSocket, Socket.IO, Redis y cualquier servicio aparte.

## Cómo trabajar

1. **Inspeccionar.** Confirma `upgradeWebSocket` y `websocket` de `hono/bun`
   (y cómo obtienen el servidor del `env`), `WSEvents`, las opciones
   WebSocket de `bun-types`, la opción `ws` del proxy, `requireSession`,
   `getProjectForMember` y el arnés de tests.
2. **Implementar.** Hub, ruta, manejadores, montaje en `index.ts`, proxy,
   tests y documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test`, reinicia `api` y lanza las
   pruebas de «Hecho cuando» por `http://localhost:5173`. Revisa que nada se
   abre antes de autorizar y que la baja ocurre al cerrar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] «Pruebas HTTP del canal» de `prompts/websockets/README.md`: sin cookie
      → 401; Luis en `proj_ana_notes` → 404; Ana en `proj_agentic_kanban`
      sin `Upgrade` → 426.
- [ ] «Probar el canal» de la misma guía como Ana: la conexión sigue abierta a
      los 25 s. El `curl` del Mac no habla WebSocket.
