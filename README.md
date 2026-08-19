# Agentic Kanban

Proyecto starter del curso **thePower — Desarrollo Agéntico**.

Esqueleto técnico listo (Bun, Vite+, React, Hono, Drizzle, libSQL). Aún no hay
login, workspaces ni tablero Kanban: eso se construye en las sesiones en vivo.

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

```bash
docker compose down
rm -f data/*.db data/*.db-*
docker compose up --build
```

## Cómo está conectado

```text
Navegador (React)
  → TanStack Query pide GET /api/health (URL relativa)
  → Vite+ reenvía /api al contenedor api
  → Hono responde
  → Drizzle ejecuta SELECT 1 en libSQL
  → Zod valida el JSON en la API y otra vez en el frontend
```

La pantalla inicial solo muestra si Frontend, API y Database están OK.
