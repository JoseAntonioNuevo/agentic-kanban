# Sesión 4 · 00 — Plan de la sesión

Partiendo de la clase 3 aceptada, este es un paso de planificación, no una
autorización para implementar comentarios, notificaciones ni el deploy.

## Encargo de planificación

Lee `AGENTS.md`, `prompts/notifications/README.md`, los seis prompts
`prompts/notifications/01-comments.md` a `06-review.md`, las reglas implicadas
y el código de partida. Comprueba las APIs instaladas o documentadas cuando
afecten al plan, especialmente las transacciones y FK de Drizzle,
`z.iso.datetime()` de Zod, `refetchInterval` e invalidación de TanStack
Query, `popover` y `badge` de shadcn, el hub, `boardEventSchema` y
`useBoardEvents` de la clase 3, la API REST de Cloudflare Email Service y la
configuración de wrangler para Containers y assets.

No edites la app, instales paquetes, ejecutes migraciones/seed, levantes otro
proceso ni hagas commit. No envíes emails reales, no ejecutes el reset ni
despliegues. Si falta la aceptación de la clase 3, identifica qué
prerrequisito impide un plan fiable.

Prepara **un solo plan para toda la sesión 4** para ejecutar paso a paso:

1. Estado observado de partida y supuestos pendientes, separados de hechos.
2. Orden 01–06, objetivo de cada paso, archivos previstos y dependencias.
3. Contratos exactos que no deben divergir: tablas `comment` y
   `notification`, rutas y códigos HTTP, `commentSchema`,
   `extractMentionTokens`, `deliverEmail` con sus dos transportes y sus
   variables, `notificationSchema`, hooks, `TaskComments`,
   `NotificationBell`, `comment.created`, `apps/edge` y
   `deploy:cloudflare`. Respeta los nombres de los prompts.
4. Menciones y email: parser (incluido `ana@demo.test`), resolución contra
   miembros del workspace de la tarea, transacción comentario +
   notificaciones, después entrega y `emailed_at`, redirección a la bandeja
   de demo y qué pasa si falla Cloudflare o el archivo.
5. Privacidad y secretos: autor y destinatario desde la sesión, 401/404,
   lectura solo por el destinatario, diferencia entre toast, campana y email,
   y dónde viven el token y los demás secretos sin entrar en el repo ni en
   la imagen.
6. Flujo de cliente: hilo solo en editar con Comentar separado de Guardar,
   estados de la campana sin confundir vacío con error y `comment.created`
   por el mismo WebSocket.
7. Deploy: Worker con assets, `/api/*` y WebSocket hacia un único contenedor,
   imagen de producción con migración y seed al arrancar, disco efímero,
   orígenes de Better Auth, comprobación de la cuenta con `wrangler whoami` y
   espera de aprovisionamiento.
8. Migraciones en host y aplicación/seed dentro de `api`; tests con DB y
   outbox temporales y sin red. Tabla de aceptación por paso con comandos y
   comprobaciones manuales con dos navegadores, en local y en la URL pública.
9. Riesgos concretos de la sesión.

Entrega un plan ejecutable y conciso.
