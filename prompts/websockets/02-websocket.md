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
  `subscribe(projectId, listener)` devuelve la función para darse de baja, y
  `publish(event)` valida con `boardEventSchema` y reparte solo a los
  suscriptores de ese `projectId` (sin suscriptores, no hace nada).
- `GET /api/projects/:projectId/events` en `apps/api/src/routes/events.ts`,
  que se convierte en WebSocket.

## Requisitos

- Orden en la ruta: sin sesión → 401; no miembro o project inexistente → 404,
  nunca 403 (el `workspace_id` sale de la fila del project); sin cabecera
  `Upgrade: websocket` → 426; si todo cuadra, se abre el WebSocket. La
  autorización se decide antes de abrir la conexión.
- `upgradeWebSocket` y `websocket` de `hono/bun` (Hono 4.13.13). Sus tipos los
  marcan como deprecados en favor de `@hono/bun` para la v5: siguen
  disponibles y no se instala `@hono/bun`. Si `vp check` rechaza ese import,
  usa `server.upgrade` y los manejadores `websocket` de Bun con el mismo
  contrato.
- Al abrir: `subscribe` al hub del project; cada evento sale como un mensaje
  de texto con `JSON.stringify(event)`, sin envoltorio. Al cerrar: darse de
  baja. Los mensajes que mande el cliente se ignoran: el canal no es una API
  de escritura.
- Extrae los manejadores de abrir y cerrar a una función que reciba el
  `projectId` (por ejemplo `boardSocketEvents(projectId)`), para probarla con
  un socket falso.
- En `apps/api/src/index.ts`, añade `websocket` al `export default` junto a
  `fetch`: Bun pasa el `server` como segundo argumento de `fetch` y Hono lo usa
  para abrir el WebSocket. Bun envía pings y corta a los 120 s sin actividad
  (`sendPings` e `idleTimeout` del manejador WebSocket en `bun-types`): no
  hace falta un keepalive propio ni tocar el timeout HTTP. `api` corre con
  `--hot`: tras añadir `websocket`, reinicia solo `api` en vez de fiarte de la
  recarga en caliente.
- Proxy de Vite+ en `apps/web/vite.config.ts`: añade `ws: true` a `/api` para
  que reenvíe la apertura del WebSocket. Si Vite no recarga su configuración,
  reinicia solo `web`.
- Tests: hub (suscribir, publicar a un project, no a otro, darse de baja);
  ruta con 401 sin cookie, 404 para un no miembro, 426 para un miembro sin
  `Upgrade` y, con un `server.upgrade` simulado en el entorno de
  `app.request`, que la apertura solo se pide después de autorizar;
  manejadores con un socket falso: tras abrir reciben los eventos del project
  y tras cerrar dejan de recibirlos.
- `AGENTS.md` y `.cursor/rules/api.mdc` describen el canal y dejan de llamar
  placeholder al realtime; la publicación y el cliente todavía no existen.

## Fuera de alcance

Publicar desde las escrituras, frontend, toasts, presencia, comentarios,
escrituras por el WebSocket, Socket.IO, Redis y cualquier servicio aparte.

## Cómo trabajar

1. **Inspeccionar.** Confirma `upgradeWebSocket` y `websocket` de `hono/bun`,
   las opciones WebSocket de `bun-types`, la opción `ws` del proxy de Vite+,
   `requireSession`, `getProjectForMember` y el arnés de tests.
2. **Implementar.** Orden de autorización, apertura, suscripción y baja del
   plan. Implementa el hub, la ruta, sus manejadores, el montaje en
   `index.ts`, el proxy, los tests y la documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y las pruebas de «Hecho
   cuando» por `http://localhost:5173`. Revisa que nada se abre antes de
   autorizar y que la baja ocurre al cerrar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] `GET` normal por `:5173`: sin cookie → 401; Luis en
      `/api/projects/proj_ana_notes/events` → 404; Ana en
      `/api/projects/proj_agentic_kanban/events` → 426.
- [ ] WebSocket por `ws://localhost:5173`: con el script «Probar el canal»
      de `prompts/websockets/README.md` como Ana, la conexión sigue abierta
      a los 25 s. El `curl` del Mac no habla WebSocket.
