# Sesión 3 · 00 — Plan de la sesión

Partiendo de la clase 2 aceptada, este es un paso de planificación, no una
autorización para implementar el tiempo real.

## Encargo de planificación

Lee `AGENTS.md`, `prompts/websockets/README.md`, los seis prompts
`prompts/websockets/01-events.md` a `06-review.md`, las reglas implicadas y el
código de partida. Comprueba las APIs instaladas cuando afecten al plan,
especialmente `streamSSE` de Hono 4.13.13, `idleTimeout` y `server.timeout`
en `bun-types`, las opciones del proxy de Vite+, `z.discriminatedUnion` de
Zod 4.6.7, `setQueryData` e `isMutating` de TanStack Query y `toast` de sonner.

No edites la app, instales paquetes, ejecutes migraciones/seed, levantes otro
proceso ni hagas commit. No implementes la clase 4. Si falta la aceptación de
la clase 2, identifica qué prerrequisito impide un plan fiable.

Prepara **un solo plan para toda la sesión 3** para ejecutar paso a paso:

1. Estado observado de partida y supuestos pendientes, separados de hechos.
2. Orden 01–06, objetivo de cada paso, archivos previstos y dependencias.
3. Contratos exactos que no deben divergir: variantes de `boardEventSchema`,
   hub `subscribe`/`publish`, `GET /api/projects/:projectId/events` y formato
   de cada frame, `applyBoardEvent`, `useBoardEvents` y
   `boardEventToastMessage`. Respeta los nombres de los prompts.
4. Vida del stream: autorización 401/404, cola con un único escritor,
   comentario inicial y keepalive, cabeceras, timeouts de Bun y del proxy,
   aborto y baja del hub sin fugas.
5. Publicación: punto exacto tras persistir en cada escritura, payload final,
   `actorUserId` de la sesión y ausencia de evento en 4xx/5xx. Indica qué
   consulta necesita devolver más datos para construir el evento.
6. Flujo de cliente: un `EventSource` por tablero, parse Zod, caché de
   TanStack Query como única fuente, eco propio con una mutation en curso,
   invalidación al reconectar, cierre al salir y toast solo al otro usuario.
   Distingue la queryKey del board de la `mutationKey` de sus mutations.
7. Tests con DB aislada. Tabla de aceptación por paso con comandos y
   comprobaciones manuales por `:5173`, incluidos 401/404, la conexión de más
   de 10 s y la prueba con dos navegadores.
8. Riesgos concretos de la sesión.

Entrega un plan ejecutable y conciso.
