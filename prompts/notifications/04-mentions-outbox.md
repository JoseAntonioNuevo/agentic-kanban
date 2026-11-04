# Sesión 4 · 03 — Menciones y emails de notificación

## Punto de partida

Comentarios por HTTP (01) y en la interfaz (02). La tabla `notification` ya
tiene los campos del email (01). El seed tiene a `Ana` y a `Luis` como
`user.name`.

## Objetivo

Al crear un comentario con `@Nombre`, cada miembro mencionado recibe una
notificación persistida y un email de notificación real, enviado con
Cloudflare Email Service. Sin credenciales (tests y desarrollo), el email
queda en un outbox local.

## Contratos que fijas aquí

- `extractMentionTokens(body): string[]`: función pura con tests en
  `packages/schemas/src/mentions.ts`.
- Correo en `apps/api/src/mail/`: `deliverEmail(email)` elige el transporte;
  `cloudflare.ts` envía por la API REST de Email Service y `outbox.ts` escribe
  una línea JSON por email.
- Variables: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN` (token con el
  permiso «Email Sending: Edit»), `MAIL_FROM` (dirección de un dominio
  incorporado a Email Sending) y `MAIL_REDIRECT_TO` (opcional).

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
  `notification` por mención válida: `kind = "mention"`, destinatario,
  `actor_user_id` (el autor), `task_id`, `comment_id`, el `workspace_id` de la
  tarea, `email_to` (email del mencionado), `email_subject`
  (`«{actor} te mencionó en "{título de la tarea}"»`), `email_body` en texto
  con el título, el comentario y el enlace a la app (`BETTER_AUTH_URL`), y
  `emailed_at` vacío.
- **Envío.** Después de confirmar la transacción, un email por notificación
  con `deliverEmail`:
  - Con `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN` y `MAIL_FROM`:
    `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/email/sending/send`
    con `Authorization: Bearer`, `from`, `to`, `subject`, `text` y un `html`
    mínimo con el texto escapado. Es correcto si responde 2xx con
    `success: true` y el destinatario no aparece en `permanent_bounces`.
  - Si existe `MAIL_REDIRECT_TO`, todos los emails van a esa dirección y el
    cuerpo indica el destinatario original: los usuarios de demo usan
    `@demo.test`, que no recibe correo.
  - Sin esas variables, outbox: `OUTBOX_PATH` si existe (tests); si no,
    `outbox.jsonl` junto al fichero de `DATABASE_URL` (en Compose,
    `/data/outbox.jsonl`; en el Mac, `data/outbox.jsonl`). Cada línea lleva
    `to`, `subject`, `body`, `notificationId` y `createdAt`.
  - En los dos transportes, `emailed_at` se marca solo si la entrega fue bien.
    Si falla (red, error de Cloudflare o escritura del archivo), se registra
    el error sin el token, `emailed_at` se queda vacío y el comentario
    igualmente responde 201.
- `fetch` nativo: sin SDK, SMTP ni dependencias nuevas. El contrato HTTP del
  `POST` no cambia.
- **Configuración.** `docker-compose.yml` pasa las cuatro variables a `api`
  desde el entorno (`${VARIABLE:-}`) y `.env.example` las lista vacías. Los
  valores reales viven en el `.env` local, que Git ignora; nunca en el repo,
  en logs ni en el frontend. No llames `CLOUDFLARE_API_TOKEN` al token de
  correo: wrangler lo usaría para desplegar.
- **Tests** con la base de test y un `OUTBOX_PATH` temporal. Nunca salen a la
  red ni leen credenciales reales: fuerzan el outbox o inyectan un `fetch`
  falso. Con fixtures como las de la demo (usuarios `Ana` y `Luis`, un
  workspace compartido y otro solo de Ana): Ana comenta `@Luis mira esto` →
  una notificación para Luis, una línea en el outbox para su email y
  `emailed_at` relleno; Ana no recibe ninguna; `@Pepe` y `@Ana` escrito por
  Ana → ninguna; `@Luis` en una tarea del workspace privado de Ana →
  ninguna; `@luis,` → una; sin menciones → 201 y ninguna. Con el transporte
  de Cloudflare y un `fetch` falso: URL, cabecera y cuerpo correctos;
  `MAIL_REDIRECT_TO` cambia el destinatario; un error deja `emailed_at` vacío
  y el comentario responde 201.
- `AGENTS.md` describe las menciones y el correo; la campana todavía no
  existe.

## Fuera de alcance

Campana, frontend de menciones, despliegue, SMTP y otros proveedores de correo.

## Cómo trabajar

1. **Inspeccionar.** Confirma el `POST` de comentarios, la tabla
   `notification`, la resolución de `DATABASE_URL`, el arnés de tests, el
   `environment` de `api` en Compose y la referencia REST de Email Service.
2. **Implementar.** Orden transacción → entrega → `emailed_at` del plan.
   Implementa `extractMentionTokens` y sus tests, los dos transportes y
   `deliverEmail`, la resolución de miembros, la transacción, Compose y
   `.env.example`, los tests de extremo a extremo y la documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test` y las pruebas en vivo de
   «Hecho cuando». Revisa destinatarios, atomicidad, que nada sale antes de
   confirmar la transacción y que el token no aparece en logs.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde; los tests no escriben en `data/` ni
      salen a la red.
- [ ] Sin credenciales: Ana comenta `@Luis mira esto` en `task_kanban_1` y la
      última línea de `data/outbox.jsonl` va a `luis@demo.test`.
- [ ] Con las cuatro variables en `.env` y `api` recreado
      (`docker compose up -d api`): el mismo comentario hace llegar el email a
      la bandeja de `MAIL_REDIRECT_TO` (lo compruebo yo) y su notificación
      tiene `emailed_at`.
