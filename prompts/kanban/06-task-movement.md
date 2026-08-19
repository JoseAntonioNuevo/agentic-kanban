Revisa el modelo, la API y las reglas de autorización actuales.

Añade una única operación de backend para mover una tarea.

Debe permitir:

reordenar una tarea dentro de la misma columna
moverla a otra columna
indicar su nueva posición

Requisitos:

Valida el input con Zod.
Mantén el algoritmo de orden simple y determinista.
Mantén las posiciones consistentes después de cada movimiento.
Usa una transacción si varias actualizaciones deben ser atómicas.
Verifica sesión y membership.
La tarea y la columna destino deben pertenecer al workspace autorizado.
La tarea y la columna destino deben pertenecer al mismo project.
No permitas movimientos cross-workspace.
No permitas movimientos cross-project.
No confíes en IDs enviados por el cliente como autorización.
Añade tests para estas restricciones.
No implementes todavía drag and drop en el frontend.
No implementes realtime.

Primero propón el contrato de la operación, el algoritmo de orden y cómo garantizarás la consistencia y el aislamiento multi-tenant.
