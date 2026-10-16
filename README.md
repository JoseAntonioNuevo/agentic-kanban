# Agentic Kanban

Proyecto starter del curso **thePower — Desarrollo Agéntico**.

Esqueleto técnico listo (Bun, Vite+, React, Hono, Drizzle, libSQL). Hay login
y un dashboard con los espacios del usuario: Ana ve dos (`thePower Demo` y
`Espacio de Ana`) y Luis uno (`thePower Demo`, con el mismo color). Cada
proyecto abre su tablero: crear, editar, borrar y mover tareas con
drag-and-drop.

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

## Datos de aula (seed)

Con Compose arriba, aplica las migraciones y luego el seed (repetible, no
duplica filas):

```bash
docker compose exec api bun run db:migrate
docker compose exec api bun run db:seed
```

Crea `ana@demo.test` y `luis@demo.test` (contraseña ficticia `Demo1234!`).
`ws_thepower_demo` tiene a Ana y Luis; `ws_ana_demo`, solo a Ana.

También crea el tablero demo: columnas `To Do`, `In Progress` y `Done` en
`proj_agentic_kanban` (`col_kanban_*`, tareas `task_kanban_1` a `task_kanban_5`)
y en `proj_ana_notes` (`col_ana_*`, tarea `task_ana_1`). Volver a ejecutar el
seed restaura esas filas a su estado inicial.

## Resetear la base de datos

```bash
docker compose down
rm -f data/*.db data/*.db-*
docker compose up --build
```

Tras un reset: migrar y luego seedear (los dos comandos de arriba).

## Cómo está conectado

```text
Navegador (React)
  → authClient → /api/auth/* (Better Auth, cookie httpOnly)
  → TanStack Query pide /api/health, /api/workspaces y el tablero (URL relativa)
  → Vite+ reenvía /api al contenedor api
  → Hono comprueba sesión y membresía
  → Drizzle consulta libSQL
  → Zod valida el JSON en la API y otra vez en el frontend
```

Sin sesión se ve el formulario de acceso. Tras iniciar sesión: el estado de
Frontend, API y Database, y los espacios del usuario con sus proyectos; cada
proyecto abre su tablero.

Para probar la API desde fuera, importa en Postman los dos ficheros de
`postman/` (colección y entorno).
