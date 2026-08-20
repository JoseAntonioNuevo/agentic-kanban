# Agentic Kanban

Proyecto starter del curso **thePower — Desarrollo Agéntico**.

Esqueleto técnico listo (Bun, Vite+, React, Hono, Drizzle, libSQL) con
autenticación email + contraseña (Better Auth), workspaces de lectura y
un seed de aula. El tablero Kanban se construye en las sesiones en vivo.

## Requisitos

- Docker Desktop

## Arrancar

```bash
docker compose up --build
```

- App: http://localhost:5173
- API: http://localhost:3000
- Health: http://localhost:3000/api/health

Si el puerto 3000 del Mac ya está ocupado:

```bash
API_HOST_PORT=3002 docker compose up --build
```

Compose y el Mac comparten el mismo fichero `data/agentic-kanban.db`
(`./data` → `/data`). Ábrelo en TablePlus como **SQLite**. No arranques la API
del Mac mientras Compose esté arriba: los dos bloquearían el mismo `.db`.

## Parar

```bash
docker compose down
```

Eso no borra la base de datos.

## Resetear la base de datos

Para de verdad empezar de cero: para Compose, borra el fichero, migra y
seedea **antes** de volver a levantar la API (si Compose está arriba, el
seed bloquearía el mismo `.db`).

```bash
docker compose down
rm -f data/*.db data/*.db-*
bun run db:migrate
bun run db:seed
docker compose up --build
```

## Seed del aula

Usuarios de demo (contraseña `Demo1234!`):

- Ana — `ana@demo.test`
- Luis — `luis@demo.test`

Workspace compartido `thePower Demo` (`ws_thepower_demo`) y project
`Agentic Kanban` (`proj_agentic_kanban`). Los dos son miembros.

Workspace solo de Ana: `Espacio de Ana` (`ws_ana_demo`) y project
`Notas de Ana` (`proj_ana_notes`). Luis no es miembro.

Tras el login, Ana ve dos workspaces y Luis uno. El color del punto es
del `workspace.id`, no de quién entra.

```bash
docker compose stop api   # si Compose está arriba
bun run db:seed
docker compose start api
```

El seed es idempotente: se puede repetir. No se ejecuta al arrancar la API.
Tras borrar `data/*.db*` hay que `db:migrate` y luego `db:seed`.

## Cómo está conectado

```text
Navegador (React)
  → TanStack Query pide GET /api/health (URL relativa)
  → Vite+ reenvía /api al contenedor api
  → Hono responde
  → Drizzle ejecuta SELECT 1 en libSQL
  → Zod valida el JSON en la API y otra vez en el frontend
```

Autenticación (Better Auth):

```text
Navegador (React, createAuthClient sin baseURL)
  → fetch relativo /api/auth/* (sign-up, sign-in, sign-out, get-session)
  → Vite+ reenvía /api al contenedor api
  → Hono → auth.handler (Better Auth)
  → drizzleAdapter(sqlite) → @libsql/client → libSQL
  → cookie httpOnly de sesión
```

La pantalla inicial muestra si Frontend, API y Database están OK. Con
sesión, lista los workspaces del usuario. Si no hay sesión, muestra el
formulario de login o registro.

## Migraciones

Las tablas (Better Auth + tenant) se generan con Drizzle Kit. Tras clonar
o resetear la base:

```bash
bun install
bun run db:migrate   # o: bun run db:m
bun run db:seed
```

Tras borrar `data/*.db*` hay que migrar y ejecutar el seed otra vez.
