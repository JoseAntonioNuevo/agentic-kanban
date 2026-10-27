# Sesión 4 · 00 — Plan de la sesión

Partiendo de la clase 3 aceptada, este es un paso de planificación, no una
autorización para implementar comentarios ni notificaciones.

## Encargo de planificación

Lee `AGENTS.md`, `prompts/notifications/README.md`, los ocho prompts
`prompts/notifications/01-models.md` a `08-review.md`, las reglas implicadas
y el código de partida. Comprueba las APIs instaladas cuando afecten al plan,
especialmente las transacciones y FK de Drizzle, `z.iso.datetime()` de Zod,
`refetchInterval` e invalidación de TanStack Query, `popover` y `badge` de
shadcn, y el hub, `boardEventSchema` y `useBoardEvents` de la clase 3.

No edites la app, instales paquetes, ejecutes migraciones/seed, levantes otro
proceso ni hagas commit. No envíes emails reales, no ejecutes el reset ni
despliegues. Si falta la aceptación de la clase 3, identifica qué
prerrequisito impide un plan fiable.

Prepara **un solo plan para toda la sesión 4** para ejecutar paso a paso:

1. Estado observado de partida y supuestos pendientes, separados de hechos.
2. Orden 01–08, objetivo de cada paso, archivos previstos y dependencias.
3. Contratos exactos que no deben divergir: tablas `comment` y
   `notification`, rutas y códigos HTTP, `commentSchema`,
   `extractMentionTokens`, el módulo de outbox y `OUTBOX_PATH`,
   `notificationSchema`, hooks, `TaskComments`, `NotificationBell` y
   `comment.created`. Respeta los nombres de los prompts.
4. Menciones y email: parser (incluido `ana@demo.test`), resolución contra
   miembros del workspace de la tarea, transacción comentario +
   notificaciones, después outbox y `emailed_at`, y qué pasa si falla el
   archivo.
5. Privacidad: autor y destinatario desde la sesión, 401/404, lectura solo
   por el destinatario y diferencia entre toast, campana y outbox.
6. Flujo de cliente: hilo solo en editar con Comentar separado de Guardar,
   estados de la campana sin confundir vacío con error y `comment.created`
   por el mismo `EventSource`.
7. Migraciones en host y aplicación/seed dentro de `api`; tests con DB y
   outbox temporales. Tabla de aceptación por paso con comandos y
   comprobaciones manuales con dos navegadores, incluida la demo local del 07.
8. Riesgos concretos de la sesión.

Entrega un plan ejecutable y conciso.
