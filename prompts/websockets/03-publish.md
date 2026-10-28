# Sesión 3 · 03 — Publicar después de persistir

## Punto de partida

El hub y el canal WebSocket funcionan (02); nadie publica todavía. Las
escrituras del tablero viven en `apps/api/src/routes/board.ts` y cada consulta
`ForMember` de `@agentic-kanban/db` ejecuta su propia transacción.

## Objetivo

Tras cada escritura HTTP correcta, los suscriptores de ese project reciben el
evento que la describe.

## Requisitos

| Escritura                             | Evento         | Payload                                  |
| ------------------------------------- | -------------- | ---------------------------------------- |
| `POST /api/projects/:projectId/tasks` | `task.created` | la tarea guardada, la misma que responde |
| `PATCH /api/tasks/:taskId`            | `task.updated` | la tarea guardada                        |
| `DELETE /api/tasks/:taskId`           | `task.deleted` | `taskId`                                 |
| `POST /api/tasks/:taskId/move`        | `task.moved`   | `taskId`, `columnId`, `position` finales |

- Publica en la ruta, cuando la consulta `ForMember` ya ha devuelto (la
  transacción está confirmada) y antes de responder. Nunca publiques dentro
  de la transacción. Si la respuesta es 4xx o 5xx, no publiques nada.
- La tarea del evento es la misma que la de la respuesta: parsea una vez con
  `taskSchema` y usa ese objeto en ambos sitios. En `task.moved`, `columnId` y
  `position` salen de la fila devuelta, no del body.
- `projectId` sale de la fila y `actorUserId` es el `userId` de la sesión,
  nunca un id del body.
- `deleteTaskForMember` hoy devuelve `Promise<boolean>`. Cámbialo para que
  devuelva el `projectId` de la tarea borrada, o `undefined` si no la borra,
  sin cambiar su autorización ni la compactación. Ajusta sus llamadas y
  tests.
- El contrato HTTP no cambia: mismos status y cuerpos que en la Sesión 2. El
  WebSocket no es una API de escritura.
- Tests:
  - Suscríbete al hub desde el test (y date de baja en `afterEach`), haz cada
    escritura contra `app` y comprueba que llega un evento que pasa
    `boardEventSchema` con el payload de la tabla y `actorUserId` de quien
    escribe.
  - Una escritura con 404 (usuario ajeno) y otra con 400 (body inválido) no
    publican nada.
- `AGENTS.md` describe la publicación desde las escrituras; el cliente
  todavía no existe.

## Fuera de alcance

Frontend, toasts y cualquier cambio del canal.

## Cómo trabajar

1. **Inspeccionar.** Confirma las escrituras de `board.ts`, dónde termina cada
   transacción, qué devuelve cada consulta `ForMember` y la API del hub.
2. **Implementar.** Integra la publicación, el `projectId` del borrado, los
   tests y la documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y la prueba en vivo de «Hecho
   cuando». Revisa los tests que prueban la ausencia de publicación en los
   errores y el orden persistencia → evento.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] En vivo: con «Probar el canal» de `prompts/websockets/README.md` abierto
      como Luis, Ana crea una tarea en su navegador antes de que pasen los
      25 s, y en la terminal llega su `task.created` con `actorUserId` de Ana.
