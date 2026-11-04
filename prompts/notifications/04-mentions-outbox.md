# Sesión 4 · 04 — Menciones, notificaciones y outbox

## Punto de partida

Comentarios por HTTP (02) y en la interfaz (03). La tabla `notification` ya
tiene los campos del email (02). El seed tiene a `Ana` (`ana@demo.test`) y a
`Luis` (`luis@demo.test`) como `user.name`.

## Objetivo

Al crear un comentario con `@Nombre`, cada miembro mencionado recibe una  
notificación persistida a un outbox local. Este paso no sale a la red: el transporte real de  
Cloudflare Email Service llega en el 06 detrás de la misma función. No tenemos todavia el sistema de emailing creado pero dejalo preparado para cuando esté.

## Contratos que fijas aquí

- `extractMentionTokens(body: string): string[]`: función pura con tests en
  `packages/schemas/src/mentions.ts`, reexportada desde
  `@agentic-kanban/schemas`.
- Correo en `apps/api/src/mail/`:
  - `deliverEmail(email)` en `apps/api/src/mail/index.ts` es el único punto de
    entrada para enviar. `email` lleva `{ notificationId, to, subject, text }`
    y devuelve si la entrega fue bien. Hoy solo usa el outbox; el 06 le añadirá
    el transporte de Cloudflare sin cambiar sus llamadas.
  - `outbox.ts` escribe una línea JSON por email.
- Variable `OUTBOX_PATH` (opcional, para tests).

## Requisitos

- **Parser.** Una mención es `@` seguido de letras (`\p{L}+`, también con
  tildes), con el `@` al principio del texto o tras un carácter que no sea
  letra ni número (así `ana@demo.test` no menciona a nadie). La puntuación
  corta el nombre: `@Luis,` → `Luis`. Sin duplicados, sin distinguir
  mayúsculas.
- **Resolución.** Se compara sin distinguir mayúsculas con `user.name` de los
  miembros del **mismo** workspace que la tarea, en una sola consulta. Se
  ignoran los desconocidos y la automención.
- **Transacción.** En la misma transacción que el comentario, una fila
  `notification` por mención válida: `kind = "mention"`, destinatario
  (`recipient_user_id`), `actor_user_id` (el autor), `task_id`, `comment_id`,
  el `workspace_id` de la tarea, `email_to` (email del mencionado),
  `email_subject` (`«{actor} te mencionó en "{título de la tarea}"»`),
  `email_body` en texto con el título, el comentario y el enlace a la app
  (`BETTER_AUTH_URL`), y `emailed_at` vacío (`null`).
- **Entrega.** Después de confirmar la transacción, un `deliverEmail` por
  notificación:
  - Outbox: `OUTBOX_PATH` si existe (tests); si no, `outbox.jsonl` junto al
    fichero de `DATABASE_URL` (en Compose, `/data/outbox.jsonl`; en el Mac,
    `data/outbox.jsonl`; en el contenedor de Cloudflare, su disco efímero).
    Cada línea lleva `to`, `subject`, `body`, `notificationId` y `createdAt`.
  - `emailed_at` se marca solo si la entrega fue bien. Si falla (por ejemplo,
    la escritura del archivo), se registra el error, `emailed_at` se queda
    vacío y el comentario igualmente responde 201.
- El contrato HTTP del `POST /api/tasks/:taskId/comments` no cambia. Sin
  dependencias nuevas.
- **Git.** `data/outbox.jsonl` está versionado con líneas de un ensayo
  anterior: añádelo a `.gitignore` y sácalo del índice con
  `git rm --cached data/outbox.jsonl` sin borrar el fichero local.
- **Tests.** En `apps/api/src/test/setup.ts`, fija un `OUTBOX_PATH` temporal
  en `tmpdir()` (y bórralo en `afterAll`): los tests nunca escriben en `data/`
  ni salen a la red. Con fixtures como las de la demo (usuarios `Ana` y
  `Luis`, un workspace compartido y otro solo de Ana):
  - Ana comenta `@Luis mira esto` → una notificación para Luis, una línea en
    el outbox para su email y `emailed_at` relleno; Ana no recibe ninguna.
  - `@Pepe` y `@Ana` escrito por Ana → ninguna.
  - `@Luis` en una tarea del workspace privado de Ana → ninguna.
  - `@luis,` o `@Luis @LUIS` → una sola notificación.
  - Sin menciones → 201 y ninguna.
  - Un outbox que no se puede escribir deja `emailed_at` vacío y el
    comentario responde 201.
- `AGENTS.md`, `.cursor/rules/db.mdc`, `.cursor/rules/schemas.mdc` y
  `.cursor/rules/api.mdc` describen las menciones y el outbox; la campana y
  el transporte de Cloudflare todavía no existen.

## Fuera de alcance

Campana, frontend de menciones, transporte de Cloudflare Email Service (06),
SMTP, otros proveedores de correo y redeploy.

## Cómo trabajar

1. **Inspeccionar.** Confirma el `POST` de comentarios, la tabla

   `notification`, la resolución de `DATABASE_URL` en `packages/db`, el arnés
   de tests (`apps/api/src/test/setup.ts`) y si `data/outbox.jsonl` sigue en
   el índice.

2. **Implementar.** Primero `extractMentionTokens` y sus tests; después la

   transacción comentario + notificaciones y el marcado de `emailed_at` en
   `@agentic-kanban/db`, `deliverEmail` y `outbox.ts`, la integración en
   `routes/comments.ts`, el setup de tests, `.gitignore`, los tests de
   extremo a extremo y la documentación.

3. **Comprobar.** Ejecuta `vp check`, `vp test` y la prueba en vivo de «Hecho

   cuando». Revisa destinatarios, atomicidad y que nada se entrega antes de
   confirmar la transacción.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde; los tests no escriben en `data/` ni
  ```
  salen a la red.
  ```
- [ ] `git status` muestra `data/outbox.jsonl` eliminado del índice y no
  ```
  como modificado.
  ```
- [ ] En local por `:5173`: Ana comenta `@Luis mira esto` en `task_kanban_1`
  ```
  y la última línea de `data/outbox.jsonl` va a `luis@demo.test`.
  ```
