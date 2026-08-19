# Agentic Kanban

Starter project for thePower Desarrollo Agéntico.

## Requirements

- Docker Desktop

## Start

```bash
docker compose up --build
```

App: http://localhost:5173

API: http://localhost:3000

Health: http://localhost:3000/api/health

If host port 3000 is already taken:

```bash
API_HOST_PORT=3002 docker compose up --build
```

## Stop

```bash
docker compose down
```

## Reset local database

```bash
docker compose down -v
```
