# Sesión 4 · 07 — Revisión final como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades. Se ejecuta en una
sesión nueva de Claude Code con Opus 5.5: revisas el código, no la
conversación que lo produjo.

## Alcance

Todo lo implementado en la Sesión 4 (prompts 01–06) y las regresiones sobre
las Sesiones 1 a 3, contrastado con `AGENTS.md`, `.cursor/rules/` y los
prompts `prompts/notifications/01-deploy-cloudflare.md` a
`06-email-cloudflare.md`. El profesor te da `BASE_CLASE`: el cambio es
`git diff "$BASE_CLASE"` más los archivos nuevos sin seguimiento de
`git status --short`.

## Cómo trabajar

1. **Comprobar.** Ejecuta `vp check`, `vp test`, `vp build apps/web` y las
   pruebas de `prompts/notifications/README.md` por `http://localhost:5173` y
   por `https://thepower-kanban.josenuevo.dev`:
   - Sin cookie `GET /api/tasks/task_kanban_1/comments` → 401.
   - Luis `GET /api/tasks/task_ana_1/comments` → 404.
   - Luis `GET /api/projects/proj_ana_notes/events` → 404 (regresión de la
     Sesión 3).
   - Tras una mención de Ana (`@Luis`), Luis `GET /api/notifications` → 200
     con al menos 1 y Ana → 200 `[]`.
   - Borrar una tarea creada para la prueba con un comentario → 204.
   - En la URL pública, además: `GET /api/health` en `ok` y WebSocket
     `wss://` abierto a los 25 s.

2. **Contrastar.** Revisa las dimensiones de abajo y confirma cada hallazgo en
   el código con `ruta:línea` y un escenario concreto.
3. **Corregir y verificar.** Corrige los problemas confirmados y repite los
   checks afectados. Si un arreglo toca la API, la web o `apps/edge`, vuelve a
   desplegar con `bun run deploy:cloudflare` y repite las pruebas públicas. Si
   el profesor indica que vais tarde, corrige solo los de severidad alta y
   deja el resto como pendiente.

## Qué revisa cada dimensión

1. **Aislamiento y autorización.**
   - Comentarios o notificaciones sin `workspace_id`.
   - IDOR (Luis lee o crea comentarios en tareas de Ana, o Ana lee/marca
     notificaciones de Luis).
   - 403 en lugar de 404, o falta de 401 sin sesión.
   - Una campana que lista notificaciones de otro usuario.
2. **Menciones, transacción y email.**
   - Menciones a quien no es miembro del workspace, automención o emails como
     `ana@demo.test` tratados como mención.
   - Emails entregados antes de confirmar la transacción.
   - `emailed_at` marcado sin una entrega correcta, o un fallo de entrega que
     revierte el 201 del comentario.
   - Producción sin `MAIL_REDIRECT_TO` (`jose@josenuevo.dev`) con usuarios
     ficticios; outbox versionado o fuera de `./data`; tests que salen a la
     red, leen credenciales reales o tocan `data/`.
   - Borrado de tareas con comentarios sin cascada.
3. **Tiempo real y cliente.**
   - WebSocket usado para escribir, o un segundo `WebSocket` abierto.
   - Toast al autor del comentario, o el toast tratado como si fuera la
     campana.
   - Un comentario creado al pulsar **Guardar**.
   - La campana de Luis vacía tras `@Luis`, o no invalidar hilo/campana cuando
     llega `comment.created` (también en eco propio).
   - «No se pudieron cargar las menciones» con un `GET` 200 con filas (parse
     de fechas ISO en el cliente), «Nada pendiente» cuando la query falló, o
     `[]` de Ana pintado como error.
   - Un 500 en `GET /api/notifications` porque Zod rechaza una fecha o un
     `commentPreview` vacío.
4. **Deploy y secretos.**
   - Más de una instancia de contenedor o nombres distintos de `"main"` (el
     hub en memoria se partiría).
   - `/api/*` sin pasar el WebSocket (`containerFetch` en lugar de `fetch`).
   - `BETTER_AUTH_URL` distinta de `https://thepower-kanban.josenuevo.dev` o
     no aceptada como origen de confianza.
   - Un token, `.env` o `.env.cloudflare.local` en el repo, en la imagen
     (`.dockerignore`), en logs o en el frontend; `CLOUDFLARE_API_TOKEN` usado
     como nombre del token de correo.
   - `wrangler` o `@cloudflare/containers` sin versión exacta, o disco efímero
     sin documentar.
5. **Alcance, regresiones y documentación.**
   - SMTP u otro proveedor de correo, Socket.IO, Redis, otra base de datos,
     React Router, React Hook Form o un tercer servicio de Docker.
   - Las pruebas de las Sesiones 1 a 3 siguen pasando y el stack local
     arranca con `docker compose up --build -d`.
   - El README funciona con los comandos reales; `AGENTS.md` y
     `.cursor/rules/` describen el producto final y siguen siendo breves.

## Entrega

Una línea por problema real, del más grave al menos grave:
`severidad (alta/media/baja) | ruta:línea | problema | escenario | corrección mínima`.
Añade los checks y pruebas con su resultado real, los hallazgos descartados
con motivo y lo que siga pendiente. Si no hay problemas reales, dilo.
