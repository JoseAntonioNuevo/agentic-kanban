# Sesión 2 · 00 — Plan de la sesión

Partiendo de la clase 1 aceptada, este es un paso de planificación, no una
autorización para implementar el tablero.

## Encargo de planificación

Lee `AGENTS.md`, `prompts/kanban/README.md`, los ocho prompts
`prompts/kanban/01-models.md` a `08-review.md`, las reglas implicadas y el
código de partida. Comprueba las APIs instaladas cuando afecten al plan,
especialmente Drizzle, TanStack Query y `@dnd-kit/react` 0.5.1.

No edites la app, instales paquetes, ejecutes migraciones/seed, levantes otro
proceso ni hagas commit. No implementes las clases 3 o 4. Si falta la
aceptación de la clase 1, identifica qué prerrequisito impide un plan fiable.

Prepara **un solo plan para toda la sesión 2** para ejecutar paso a paso:

1. Estado observado de partida y supuestos pendientes, separados de hechos.
2. Orden 01–08, objetivo de cada paso, archivos previstos y dependencias.
3. Contratos exactos que no deben divergir: tablas y posiciones, schemas
   compartidos, rutas y códigos HTTP, `useBoard`, `boardQueryKey`, mutations,
   `applyBoardMove` y la API real de dnd-kit. Respeta los nombres de los prompts.
4. Algoritmo transaccional de movimiento: quitar, insertar, acotar posición y
   renumerar origen/destino dentro del mismo proyecto. Explica los casos
   misma columna, columna vacía, borde y destino prohibido.
5. Flujo de cliente: una fuente de verdad en TanStack Query, optimista,
   rollback, invalidación y navegación local; nada de copia del board en state.
6. Migraciones en host y aplicación/seed dentro de `api`; tests con DB aislada.
   Tabla de aceptación por paso con comandos y comprobaciones manuales,
   incluidos 400/401/404, persistencia y fallo controlado de la API.
7. Riesgos concretos de la sesión.

Entrega un plan ejecutable y conciso.
