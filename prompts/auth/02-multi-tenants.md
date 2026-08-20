Revisa el estado actual del repo antes de proponer cambios.

Estamos construyendo auth de la Sesión 1.

Añade el modelo multi-tenant en Drizzle. Sin endpoints, UI, seed, Zod de API.

Requisitos:

Tablas (`sqliteTable` / `text` / `integer` de `drizzle-orm/sqlite-core`):

- workspace: id (text PK), name, created_at
- workspace_member: workspace_id, user_id, unique (workspace_id, user_id).
  user_id FK a user.id de Better Auth. Sin role (RBAC está fuera de alcance).
- project: id (text PK), workspace_id NOT NULL FK a workspace, name, created_at

Índices: `project.workspace_id`, `workspace_member.user_id`.
No inventes user, slug, owner, columns ni tasks.

Una migración: `bun run db:generate` + `db:migrate` una vez; SQL committed.
La API no migra al arrancar. Nunca Mac API + Compose contra el mismo `.db`.

Plan primero: esquema, FKs, índices, constraints, archivos concretos.
Luego implementa. Actualiza `AGENTS.md`: tablas sí; CRUD no.

Verificación: `vp check --no-fmt`; el SQL está en `packages/db/migrations/`; GET `/api/health` sigue OK.
