# Agentic Kanban

Proyecto starter del curso **thePower — Desarrollo Agéntico**.

Esqueleto técnico listo (Bun, Vite+, React, Hono, Drizzle, libSQL). Hay login
y un dashboard con los espacios del usuario: Ana ve dos (`thePower Demo` y
`Espacio de Ana`) y Luis uno (`thePower Demo`, con el mismo color). Cada
proyecto abre su tablero: crear, editar, borrar y mover tareas con
drag-and-drop. Los cambios de un usuario llegan en vivo a los demás (SSE) con
un aviso. Cada tarea tiene comentarios; `@Nombre` menciona a un miembro del
espacio, que recibe una notificación en la campana y un correo de aula.

## Requisitos

- Docker Desktop

## Arrancar

El deploy de aula es solo esto (dos servicios, `web` y `api`):

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

Solo si cambias el esquema, genera la migración en el host (nunca dentro de
Compose): `bun run db:generate`.

## Resetear los datos

Hazlo antes de clase, nunca en mitad de una demo:

```bash
docker compose down
rm -f data/*.db data/*.db-* data/outbox.jsonl
docker compose up --build -d
docker compose exec api bun run db:migrate
docker compose exec api bun run db:seed
```

## Correo de aula

No hay Resend, SMTP ni contenedor de correo. Cada mención añade una línea JSON
a `data/outbox.jsonl` (`/data/outbox.jsonl` en el contenedor). El fichero no se
versiona.

## Guion de la demo

```text
Dos navegadores: Luis en una ventana privada (si no, comparten cookie).
Ana y Luis entran en thePower Demo → Agentic Kanban.
Ana mueve una tarjeta: Luis la ve moverse y recibe un toast.
Ana edita una tarjeta, escribe "@Luis mira esto" y pulsa Comentar (no Guardar).
Luis: hilo actualizado, toast y campana con badge.
Ana: su campana dice "No hay menciones." (no "No se pudieron cargar").
Opcional: la última línea de data/outbox.jsonl va a luis@demo.test.
Luis no ve tableros, comentarios ni notificaciones de proj_ana_notes.
```

## Cómo está conectado

```text
Navegador (React)
  → authClient → /api/auth/* (Better Auth, cookie httpOnly)
  → TanStack Query pide /api/health, /api/workspaces y el tablero (URL relativa)
  → EventSource escucha /api/projects/:id/events (SSE, mismo proxy)
  → comentarios: /api/tasks/:id/comments; la campana consulta /api/notifications
  → Vite+ reenvía /api al contenedor api
  → Hono comprueba sesión y membresía
  → Drizzle consulta libSQL (y cada mención añade una línea a data/outbox.jsonl)
  → Zod valida el JSON en la API y otra vez en el frontend
```

Sin sesión se ve el formulario de acceso. Tras iniciar sesión: el estado de
Frontend, API y Database, y los espacios del usuario con sus proyectos; cada
proyecto abre su tablero, con comentarios en el diálogo de edición y la campana
de menciones en la cabecera.

Para probar la API desde fuera, importa en Postman los dos ficheros de
`postman/` (colección y entorno).
