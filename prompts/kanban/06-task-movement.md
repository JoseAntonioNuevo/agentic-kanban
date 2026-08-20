Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo el Kanban de la Sesión 2.

Añade una única operación de backend para mover una tarea.

Debe permitir:

- reordenar una tarea dentro de la misma columna
- moverla a otra columna
- indicar su nueva posición

Requisitos:

Valida el input con Zod en `@agentic-kanban/schemas`.
Sesión → 401. No miembro o recurso inexistente → 404 (nunca 403).
Mantén el algoritmo de orden simple y determinista.
Mantén las posiciones consistentes después de cada movimiento.
Usa una transacción si varias actualizaciones deben ser atómicas.
La tarea y la columna destino deben pertenecer al workspace autorizado y al mismo project.
No permitas movimientos cross-workspace ni cross-project.
No confíes en IDs enviados por el cliente como autorización.
Datos solo vía `@agentic-kanban/db`.
Añade tests para estas restricciones.
No implementes todavía drag and drop en el frontend.
No implementes realtime.

Plan primero: contrato de la operación, algoritmo de orden, consistencia y aislamiento multi-tenant.
Luego implementa. Actualiza `AGENTS.md`: POST move sí; DnD no.

Verificación: `vp check --no-fmt`; tests cross-project / no miembro → 404.
