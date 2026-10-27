# Sesión 4 · 08 — Revisión final como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades.

## Alcance

Todo lo implementado en la Sesión 4 (prompts 01–07) y las regresiones sobre
las Sesiones 1 a 3, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios
prompts. No añadas funcionalidades.

## Cómo trabajar

1. **Comprobar.** Ejecuta `vp check`, `vp test`, `vp build apps/web` y estas
   pruebas por `http://localhost:5173` y por la URL pública de Cloudflare:
   tras una mención de Ana, Luis `GET /api/notifications` → 200 con al menos
   1 y Ana → 200 `[]`; Luis `GET /api/tasks/task_ana_1/comments` → 404; Luis
   `GET /api/projects/proj_ana_notes/events` → 404; borrar una tarea creada
   para la prueba con un comentario → 204. En la URL pública, además, health
   en `ok` y el email de la mención en la bandeja de demo.
2. **Contrastar.** Revisa las dimensiones de abajo y confirma cada hallazgo en
   el código con `ruta:línea` y un escenario concreto.
3. **Corregir y verificar.** Corrige los problemas confirmados y repite los
   checks afectados. Si un arreglo toca la API, la web o `apps/edge`, vuelve a
   desplegar y repite las pruebas públicas.

## Qué revisa cada dimensión

1. **Aislamiento y autorización.** Comentarios o notificaciones sin
   `workspace_id`; IDOR (Luis lee comentarios o notificaciones de Ana); 403 en
   lugar de 404; una campana que lista notificaciones de otro usuario.
2. **Menciones, transacción y email.** Menciones a quien no es miembro;
   automención; emails enviados antes de confirmar la transacción;
   `emailed_at` marcado sin una entrega correcta; demo sin `MAIL_REDIRECT_TO`
   con usuarios ficticios; outbox versionado o fuera de `./data`; tests que
   salen a la red; borrado de tareas con comentarios sin cascada.
3. **Tiempo real y cliente.** WebSocket usado para escribir; toast al autor del
   comentario; el toast tratado como si fuera la campana; un segundo
   `WebSocket`; un comentario creado al pulsar Guardar; la campana de Luis
   vacía tras `@Luis`; «No se pudieron cargar las menciones» con un `GET` 200
   con filas (parse de fechas ISO en el cliente); «Nada pendiente» cuando la
   query falló; `[]` de Ana pintado como error; un 500 en
   `GET /api/notifications` porque Zod rechaza una fecha o un extracto vacío.
4. **Deploy y secretos.** Más de una instancia de contenedor o nombres
   distintos (el hub en memoria se partiría); `/api/*` sin pasar el
   WebSocket; `BETTER_AUTH_URL` distinta de la URL pública; un token, el
   `.env` o `.env.cloudflare.local` en el repo, en la imagen, en logs o en el
   frontend; `wrangler` o `@cloudflare/containers` sin versión exacta; disco
   efímero sin documentar.
5. **Alcance, regresiones y documentación.** SMTP u otro proveedor de correo,
   Socket.IO, Redis, otra base de datos, React Router, React Hook Form o un
   tercer servicio de Docker; las pruebas de las Sesiones 1 a 3 siguen
   pasando; el README funciona con los comandos reales; `AGENTS.md` describe
   el producto final y es breve.

## Entrega

Una línea por problema real, del más grave al menos grave:
`severidad (alta/media/baja) | ruta:línea | problema | escenario | corrección mínima`.
Añade los checks y pruebas con su resultado real, los hallazgos descartados
con motivo y lo que siga pendiente. Si no hay problemas reales, dilo.
