# Sesión 3 · 02 — El stream SSE y el hub

Tiempo en clase: ~15 min. Antes de lanzar a los implementadores, presenta un plan de 15 líneas
como máximo (ruta, autorización, cómo se registra y se da de baja un
suscriptor, ficheros) y espera mi «adelante».

## Punto de partida

`boardEventSchema` existe (01). `apps/api/src/realtime/index.ts` es un
placeholder. `requireSession` y `getProjectForMember` existen desde la Sesión 1.

## Objetivo

Un `GET` SSE autenticado por project, en este mismo proceso Hono, que mantiene
la conexión abierta y entrega los eventos del hub. Este prompt todavía no
publica nada.

## Contratos que fijas aquí

- Hub en memoria en `apps/api/src/realtime/index.ts`:
  `subscribe(projectId, listener)` devuelve la función para darse de baja, y
  `publish(event)` valida con `boardEventSchema` y reparte solo a los
  suscriptores de ese `projectId` (sin suscriptores, no hace nada).
- `GET /api/projects/:projectId/events` en `apps/api/src/routes/events.ts`.

## Requisitos

- Autorización: sin sesión → 401; no miembro o project inexistente → 404, nunca 403. El `workspace_id` sale de la fila del project.
- `streamSSE` de `hono/streaming` (Hono 4.13.13). El callback debe quedarse
  vivo hasta que el cliente se desconecte (`stream.onAbort`): si termina, Hono
  cierra el stream.
- Los listeners del hub solo encolan; el callback de `streamSSE` es el único
  que escribe, en un bucle que espera a la cola. En el ensayo anterior,
  escribir en el stream desde el contexto de otra petición (el `POST` que
  publica) no llegaba al cliente de forma fiable en Bun.
- Cada evento es un frame solo con datos:
  `writeSSE({ data: JSON.stringify(event) })`, sin `event:` por tipo, para que
  `EventSource.onmessage` reciba todo.
- Nada más abrir, escribe un comentario SSE (`stream.write(": connected\n\n")`)
  y después uno cada ~15 s (`: keepalive`). Así `EventSource` pasa a OPEN al
  momento y ningún proxy ve la conexión como inactiva. `EventSource` ignora los
  comentarios.
- Cabeceras `Cache-Control: no-cache, no-transform` y `X-Accel-Buffering: no`.
- Bun cierra las peticiones inactivas a los 10 s. En `apps/api/src/index.ts`
  pon `idleTimeout: 0` en el `export default` y, para las peticiones a
  `/events`, llama a `server.timeout(req, 0)` (Bun pasa el `server` como
  segundo argumento de `fetch`). Comprueba ambas firmas en `bun-types`.
- Proxy de Vite+ en `apps/web/vite.config.ts`: añade `timeout: 0` y
  `proxyTimeout: 0` a `/api` para que el proxy de desarrollo no corte
  conexiones largas. No actives `ws`.
- Al desconectarse el cliente: darse de baja del hub y parar el keepalive, sin
  fugas.
- Tests: hub (suscribir, publicar a un project, no a otro, darse de baja); ruta
  con 401 sin cookie, 404 para un no miembro y 200 con
  `content-type: text/event-stream` para un miembro. En el caso 200, cancela
  el body (`await res.body?.cancel()`) para que el test no se quede colgado.

## Fuera de alcance

Publicar desde las escrituras, frontend, toasts, presencia, comentarios,
Socket.IO, Redis y cualquier servicio aparte.

## Cómo trabajar

Sigue el flujo con subagentes de `AGENTS.md` (Agent workflow). En este paso:

- **Investigar** (Haiku): `apps/api/src/index.ts`, `requireSession`, `getProjectForMember`, el proxy de Vite+ y las firmas instaladas de `streamSSE` (`hono/streaming`), `idleTimeout` y `server.timeout` (`bun-types`).
- **Planificar** (Opus): API del hub y cómo cablear el `server.timeout` de Bun.
- **Implementar** (Sonnet): dos en paralelo: A, hub, ruta, montaje, `index.ts` de Bun y proxy de Vite+; B, tests del hub y de la autorización de la ruta. Uno de ellos actualiza la documentación de «Al terminar».
- **Verificar** (Haiku): puerta de calidad y estas pruebas por `http://localhost:5173` (Vite se reinicia solo al cambiar su config; si no, `docker compose restart web`): sin cookie → 401; Luis en `/api/projects/proj_ana_notes/events` → 404; Ana en `/api/projects/proj_agentic_kanban/events` con `curl -N --max-time 25` sigue abierta más de 10 s y recibe keepalives.
- **Revisar** (Opus): bajas del hub y ninguna escritura fuera del bucle.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Las tres pruebas HTTP dan lo esperado; la conexión de Ana aguanta más de
      10 s.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` y `.cursor/rules/api.mdc` (stream sí; publicar y cliente
no; quita la frase de realtime como placeholder). No hagas commit. Cierra con
el resumen que pide `AGENTS.md`.
