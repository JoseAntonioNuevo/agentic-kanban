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

Migrations and the demo seed run when the API starts. No extra commands.

## Demo accounts

Password for both: `Demo1234!`

- Ana — `ana@demo.test`
- Luis — `luis@demo.test`

Both belong to workspace **thePower Demo** and project **Agentic Kanban**.

A newly registered user with no membership sees an empty workspace state.

## Stop

```bash
docker compose down
```

## Database file

Compose and the host share `data/agentic-kanban.db` (`./data` → `/data`). Open
that file in TablePlus as SQLite and refresh after writes. Do not run the
host API while Compose is up — both would lock the same file.

## Reset local database

```bash
docker compose down
rm -f data/*.db data/*.db-*
docker compose up --build
```

That recreates Ana, Luis, thePower Demo, and Agentic Kanban.

## Host-only debugging

```bash
bun install
bun run db:migrate
bun run db:seed
bun --filter @agentic-kanban/api dev
vp dev apps/web
```
