Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo el realtime de la Sesión 3.

Añade el contrato Zod mínimo de eventos de tablero en `@agentic-kanban/schemas`.

Eventos:

- task.created
- task.updated
- task.deleted
- task.moved

Cada evento lleva `projectId`, `actorUserId` y el payload mínimo ya existente (task o ids de move).
Usa una unión discriminada por `type`. Reutiliza `taskSchema` / ids de move; no inventes campos nuevos.
Cliente y API parsearán el mismo schema.

Requisitos:

No implementes el hub, SSE, publish ni el frontend.
No añadas tabla de notificaciones, presencia, comentarios ni Socket.IO.
HTTP sigue siendo la escritura: este contrato solo describe el anuncio.

Primero analiza el código existente y propón el plan mínimo: shape de cada evento, archivos y tests de parse/reject.
Luego implementa. Actualiza `AGENTS.md`: el contrato sí; el stream no.

Verificación: `vp check --no-fmt`; tests del schema.
