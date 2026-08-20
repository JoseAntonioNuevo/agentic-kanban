Revisa el contrato de eventos y el placeholder `apps/api/src/realtime/`.

Implementa el stream de lectura en este proceso Hono.

Debe permitir:

- GET SSE autenticado para un project (p. ej. `/api/projects/:projectId/events`)
- Hub in-memory: suscriptores por `projectId`
- Sesión → 401; no miembro o project inexistente → 404 (nunca 403)
- `workspace_id` sale de la fila del project, no del cliente

Requisitos:

Usa `streamSSE` de `hono/streaming`. El proxy Vite de `/api` actual vale; no actives `ws`.
En el `export default` de Bun pon `idleTimeout: 0` y `server.timeout(req, 0)` en `/events` (si no, mata el SSE a los 10s de silencio).
El frame SSE lleva el JSON de `boardEventSchema` en `data`. No uses un `event:` distinto por tipo: `EventSource.onmessage` debe bastar.
No Socket.IO, Redis ni un servicio aparte.
No publiques todavía desde create/update/delete/move.
No toques el frontend.
No implementes toasts, presencia ni comentarios.

Plan primero: ruta, authz, cómo se registra/desconecta un suscriptor, archivos concretos.
Luego implementa. Actualiza `AGENTS.md` y `.cursor/rules`: stream sí; publish y cliente no.

Verificación: `vp check --no-fmt`; tests de authz del stream (401; Luis en `proj_ana_notes` → 404). En el caso 200, cancela el body del Response para no colgar el test.
