# Sesión 4 · 05 — Deploy en Cloudflare y guion de la demo

## Punto de partida

El producto del bloque está completo en local (Sesiones 1–4, prompts 01–04),
con emails reales por Cloudflare Email Service cuando hay credenciales. Falta
publicarlo en la cuenta de Cloudflare del profesor y dejar la demo
reproducible.

## Objetivo

La app completa en una URL pública de Cloudflare: un Worker sirve el frontend
y reenvía `/api/*` (HTTP y WebSocket) a un Container con la misma API de Bun.
El README explica cómo arrancar en local y cómo desplegar.

## Contratos que fijas aquí

- `apps/edge`: Worker con `wrangler.jsonc`, la clase `ApiContainer` (de
  `@cloudflare/containers`) y un Dockerfile de producción de la API.
- Script `deploy:cloudflare` en el `package.json` raíz: construye la web y
  ejecuta `wrangler deploy` con los secretos de `.env.cloudflare.local`.
- `.env.cloudflare.local` (Git lo ignora por `*.local`): `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL` (la URL pública), `CLOUDFLARE_ACCOUNT_ID`,
  `CLOUDFLARE_EMAIL_TOKEN`, `MAIL_FROM` y `MAIL_REDIRECT_TO`.

## Requisitos

- Dependencias de `apps/edge` fijadas exactamente: `wrangler@4.150.0` y
  `@cloudflare/containers@0.3.7`. Comprueba sus APIs en los tipos instalados
  y en `wrangler deploy --help`; los tipos del Worker salen de
  `wrangler types`.
- **Worker.** `/api/*` va a `getContainer(env.API, "main").fetch(request)`:
  con `fetch`, no `containerFetch`, para que pase el WebSocket. El resto va a
  `env.ASSETS.fetch(request)`. Assets: `apps/web/dist` con
  `not_found_handling: "single-page-application"` y
  `run_worker_first: ["/api/*"]`.
- **Contenedor.** `max_instances: 1` y siempre la instancia `"main"`: el hub
  de la clase 3 vive en memoria y todos los usuarios deben llegar a la misma.
  `defaultPort = 3000`, `instance_type: "basic"`, `sleepAfter` de unas horas
  y salida a internet activa para Email Service. Sus `envVars` salen de los
  secretos del Worker, más `DATABASE_URL=file:/data/agentic-kanban.db` y
  `API_PORT=3000`.
- **Imagen.** Bun 1.4.3, sin `--hot` ni bind mount: al arrancar ejecuta
  `db:migrate`, `db:seed` y la API. El disco de Containers es efímero: cada
  arranque parte del seed y los cambios se pierden cuando el contenedor
  duerme. Documéntalo; no añadas otra base de datos. `.dockerignore` excluye
  `.env`, `*.local` y `data/outbox.jsonl`: ningún secreto entra en la imagen.
- **Better Auth.** La URL pública debe contar como origen de confianza.
  Comprueba en el código instalado si `baseURL` basta o añádela a
  `trustedOrigins` desde `BETTER_AUTH_URL`, sin quitar los orígenes locales.
- **Cuenta.** Antes de desplegar, `bunx wrangler whoami` debe mostrar la
  cuenta del curso; si no, para. Docker tiene que estar en marcha. No uses
  credenciales de otros proyectos ni imprimas secretos.
- **Deploy.** `bun run deploy:cloudflare`. Tras el primer deploy, Cloudflare
  tarda unos minutos en aprovisionar el contenedor: reintenta las pruebas
  con espera antes de dar un fallo por bueno.
- `data/outbox.jsonl` fuera de Git: añádelo a `.gitignore` y, como ahora
  mismo está versionado (con líneas de un ensayo anterior), sácalo del índice
  con `git rm --cached data/outbox.jsonl` sin borrar el fichero local.
- README con:
  - arranque local, migración, seed y reset (`docker compose down`, borrar
    `data/*.db*` y `data/outbox.jsonl`), con los comandos reales;
  - la preparación de Cloudflare: plan Workers Paid, dominio incorporado a
    Email Sending, token de correo, `wrangler login` y
    `.env.cloudflare.local`;
  - el deploy, el aviso de disco efímero y el guion de la demo:

    ```text
    Dos navegadores en la URL pública: Luis en una ventana privada.
    Ana y Luis entran en thePower Demo → Agentic Kanban.
    Ana mueve una tarjeta: Luis la ve moverse y recibe un toast.
    Ana edita una tarjeta, escribe "@Luis mira esto" y pulsa Comentar (no Guardar).
    Luis: hilo actualizado, toast y campana con badge.
    Ana: su campana dice "No hay menciones." (no "No se pudieron cargar").
    El email de la mención llega a la bandeja de demo (MAIL_REDIRECT_TO).
    Luis no ve tableros, comentarios ni notificaciones de proj_ana_notes.
    ```

- `AGENTS.md` final: producto completo; en local, Compose con `web` y `api`;
  en público, Worker y Container en Cloudflare; email real por Email Service
  con el outbox como reserva. Revísalo entero para que sea breve y no
  contenga frases que ya no son ciertas, y actualiza las reglas afectadas de
  `.cursor/rules/`.
- No ejecutes el reset local durante la clase: solo documéntalo.

## Fuera de alcance

Funcionalidades nuevas, otra base de datos (D1, Turso), dominio propio, CI/CD
y borrar recursos de Cloudflare.

## Cómo trabajar

1. **Inspeccionar.** Confirma README, `.gitignore`, `.dockerignore`, scripts
   de `package.json`, `docker-compose.yml`, el Dockerfile de la API, la
   configuración de Better Auth, los tipos de `@cloudflare/containers`, las
   opciones de wrangler (`containers`, `assets`, `--secrets-file`) y
   `bunx wrangler whoami`.
2. **Implementar.** Worker, contenedor, imagen, script y documentación del
   plan. Saca `data/outbox.jsonl` del índice solo si estaba seguido,
   conservando el archivo local.
3. **Comprobar.** Ejecuta `vp check`, `vp test`, `vp build apps/web` y
   `docker compose config`. Despliega y prueba la URL pública. Revisa que no
   hay secretos en el repo ni en la imagen.

## Hecho cuando

- [ ] `vp check`, `vp test` y `vp build apps/web` en verde;
      `docker compose config` es válido.
- [ ] `git status` muestra `data/outbox.jsonl` como eliminado del índice y ya
      no como modificado.
- [ ] Deploy hecho en la cuenta comprobada con `wrangler whoami`. En la URL
      pública: `GET /api/health` con `api` y `database` en `ok`; Ana inicia
      sesión (con `Origin` igual a la URL pública) y lee su board; Luis
      `GET /api/projects/proj_ana_notes/board` → 404; el script «Probar el
      canal» de la clase 3, con esa URL y `wss://`, sigue abierto a los 25 s.
- [ ] Demo con dos navegadores en la URL pública (lo compruebo yo), incluido
      el email de la mención en la bandeja de demo.
