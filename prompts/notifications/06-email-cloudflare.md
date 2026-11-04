# Sesión 4 · 06 — Email real con Cloudflare y producto completo en producción

## Punto de partida

El producto está completo en local: comentarios, menciones con su
notificación, email entregado al outbox con `deliverEmail` y campana en tiempo
real (02–05). Producción (`https://thepower-kanban.josenuevo.dev`) sigue con
el tablero de la clase 3 desplegado en el 01. `.env.cloudflare.local` ya
contiene las variables de correo.

## Objetivo

Que `deliverEmail` envíe emails reales con Cloudflare Email Service cuando hay
credenciales, que esas credenciales lleguen al Container como secretos, y
redesplegar para cerrar la demo en la URL pública con el email llegando a la
bandeja de demo.

## Contratos que fijas aquí

- `apps/api/src/mail/cloudflare.ts`: transporte por la API REST de Email
  Service. `deliverEmail` lo elige si existen `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_EMAIL_TOKEN` y `MAIL_FROM`; si falta alguna, sigue el outbox del 04. Las llamadas a `deliverEmail` no cambian.
- Variables: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN` (token con el
  permiso «Email Sending: Edit»), `MAIL_FROM` (dirección de un dominio
  incorporado a Email Sending) y `MAIL_REDIRECT_TO` (opcional).

## Requisitos

- **Envío.**
  `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/email/sending/send`
  con `Authorization: Bearer`, `from`, `to`, `subject`, `text` y un `html`
  mínimo con el texto escapado. Comprueba la forma exacta del cuerpo y de la
  respuesta en la referencia REST de Email Service. Es correcto si responde
  2xx con `success: true` y el destinatario no aparece en
  `permanent_bounces`.
- **Redirección.** Si existe `MAIL_REDIRECT_TO`, todos los emails van a esa
  dirección y el cuerpo indica el destinatario original: los usuarios de demo
  usan `@demo.test`, que no recibe correo.
- **Fallos.** `emailed_at` se marca solo si la entrega fue bien. Si falla (red,
  error de Cloudflare), se registra el error sin el token, `emailed_at` se
  queda vacío y el comentario igualmente responde 201. `fetch` nativo: sin
  SDK, SMTP ni dependencias nuevas.
- **Configuración local.** `docker-compose.yml` pasa las cuatro variables a
  `api` desde el entorno (`${VARIABLE:-}`) y `.env.example` las lista vacías.
  Sin ellas en `.env`, local sigue con el outbox; no hace falta recrear `api`
  en clase. No llames `CLOUDFLARE_API_TOKEN` al token de correo: wrangler lo
  usaría para desplegar.
- **Producción.** `apps/edge` pasa las cuatro variables, desde los secretos
  del Worker, a las `envVars` del Container (decláralas en el tipo `Env` si
  `wrangler types` no las genera). Confirma en los tipos instalados de
  `@cloudflare/containers` que la salida a internet del contenedor está
  activa. Ningún valor en el repo, la imagen, los logs ni el frontend.
- **Tests.** En `apps/api/src/test/setup.ts`, borra las cuatro variables para
  que ningún test lea credenciales reales. Los tests del transporte inyectan
  un `fetch` falso y nunca salen a la red: URL, cabecera y cuerpo correctos;
  `MAIL_REDIRECT_TO` cambia el destinatario e incluye el original en el
  cuerpo; una respuesta con error, `success: false` o el destinatario en
  `permanent_bounces` deja `emailed_at` vacío y el comentario responde 201;
  sin las tres variables obligatorias se usa el outbox.
- **Redeploy.** `bunx wrangler whoami` muestra la cuenta del curso y después
  `bun run deploy:cloudflare`. La imagen aplica al arrancar la migración del
  02 sobre el disco efímero y vuelve a sembrar. Reintenta las pruebas
  públicas con espera mientras se despliega la versión nueva.
- **README final.** Preparación de Email Service (dominio en Email Sending
  con SPF, DKIM y DMARC, token, `MAIL_FROM`, `MAIL_REDIRECT_TO`), el outbox
  como reserva y el guion de la demo:

  ```text
  Dos navegadores en https://thepower-kanban.josenuevo.dev: Luis en una ventana privada.
  Ana y Luis entran en thePower Demo → Agentic Kanban.
  Ana mueve una tarjeta: Luis la ve moverse y recibe un toast.
  Ana edita una tarjeta, escribe "@Luis mira esto" y pulsa Comentar (no Guardar).
  Luis: hilo actualizado, toast y campana con badge.
  Ana: su campana dice "No hay menciones." (no "No se pudieron cargar").
  El email de la mención llega a la bandeja de demo (MAIL_REDIRECT_TO).
  Luis no ve tableros, comentarios ni notificaciones de proj_ana_notes.
  ```

- **`AGENTS.md` final.** Producto completo; en local, Compose con `web` y
  `api` y outbox; en público, Worker y Container en Cloudflare con email real
  por Email Service. Revísalo entero para que sea breve y no contenga frases
  que ya no son ciertas, y actualiza las reglas afectadas de `.cursor/rules/`.

## Fuera de alcance

Funcionalidades nuevas, SMTP u otros proveedores de correo, reenviar emails
fallidos, otra base de datos, CI/CD y borrar recursos de Cloudflare.

## Cómo trabajar

1. **Inspeccionar.** Confirma `deliverEmail` y `outbox.ts`, el setup de tests,
   el `environment` de `api` en Compose, las `envVars` de `ApiContainer`, la
   referencia REST de Email Service y `bunx wrangler whoami`.
2. **Implementar.** `cloudflare.ts` y su selección en `deliverEmail`, los
   tests con `fetch` falso, Compose y `.env.example`, los secretos de
   `apps/edge` y la documentación.
3. **Comprobar.** Ejecuta `vp check`, `vp test`, `vp build apps/web` y
   `docker compose config`. Redespliega y lanza en la URL pública «Probar la
   URL pública y el canal `wss://`» y las «Pruebas HTTP de comentarios y
   notificaciones» de `prompts/notifications/README.md` con
   `BASE=https://thepower-kanban.josenuevo.dev`. Revisa que el token no
   aparece en logs ni en la imagen.

## Hecho cuando

- [ ] `vp check`, `vp test` y `vp build apps/web` en verde; los tests no salen
      a la red; `docker compose config` es válido.
- [ ] Redeploy hecho en la cuenta comprobada con `wrangler whoami`. En la URL
      pública: health `ok`, `wss://` abierto a los 25 s, comentarios 401/404/201
      y, tras la mención de Ana, Luis `GET /api/notifications` → 200 con al
      menos una y Ana → 200 `[]`.
- [ ] Demo con dos navegadores en la URL pública (lo compruebo yo), incluido
      el email de la mención en la bandeja de `MAIL_REDIRECT_TO`.
