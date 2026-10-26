# Agentic Kanban

Proyecto starter del curso **thePower — Desarrollo Agéntico**.

Esqueleto técnico listo (Bun, Vite+, React, Hono, Drizzle, libSQL). Hay login
por cookie (email y contraseña), las tablas `workspace`, `workspace_member`
y `project`, un seed de aula que no corre al arrancar la API, lecturas
autenticadas de workspaces y projects, y un dashboard que lista los espacios
del usuario. El tablero Kanban se construye en las sesiones siguientes.

## Requisitos

Para **arrancar el starter**, basta con Docker Desktop iniciado: los dos
contenedores instalan las dependencias fijadas del workspace.

Para **trabajar con los prompts desde el host**, prepara además Bun `1.4.3`
y las dependencias locales con `bun install --frozen-lockfile`. Vite+ `1.3.0`
pertenece al workspace; puedes ejecutar `bun run check` y `bun run test`
(los prompts usan sus comandos `vp check` y `vp test`).

Las cuatro clases se siguen en Cursor: en las clases **1, 3 y 4**, Opus 5.5
orquesta de forma autónoma workers Grok 4.7 xhigh Fast; en la **2**, Opus
prepara un plan y Grok lo ejecuta en Agent sin subagentes. CodeRabbit se usa
cuando aporta una revisión necesaria; no hace falta para arrancar la app.

El [mapa de las cuatro sesiones](prompts/README.md), la
[guía común de Cursor](prompts/CURSOR.md) y los
[guiones para Obsidian](docs/obsidian/README.md) reúnen prompts, preparación,
texto literal y comprobaciones de cada clase. Los guiones son notas locales
del profesor en `docs/obsidian/`, que permanece excluido de Git.

## Material para la primera clase (S9)

| Material                                                     | Para qué sirve                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------- |
| [Guía de Cursor](prompts/auth/README.md)                     | Preparación, modelo de cada paso, delegación y criterio de revisión |
| [01 · Autenticación](prompts/auth/01-estructura.md)          | Registro, login, sesión y logout                                    |
| [02 · Modelo multi-tenant](prompts/auth/02-multi-tenants.md) | Workspaces, membresías y proyectos                                  |
| [03 · Lecturas autorizadas](prompts/auth/03-workspaces.md)   | Acceso por sesión y membresía, con tests aislados                   |
| [04 · Seed](prompts/auth/04-seed.md)                         | Datos repetibles para Ana y Luis                                    |
| [05 · Dashboard](prompts/auth/05-tenant-visible.md)          | Espacios visibles por usuario y limpieza de caché                   |
| [06 · Cierre](prompts/auth/06-review.md)                     | Evidencias, revisión cuando procede y correcciones verificadas      |

Los prompts se ejecutan uno a uno. El prompt 01 (registro, login y sesión por
cookie), las tablas del 02, las lecturas del 03, el seed del 04 y el
dashboard del 05 ya están. El tablero, no. El [mapa del bloque](prompts/README.md)
enlaza los prompts y guiones de las sesiones 2–4 con sus respectivos estilos.

## Arrancar

Desde la raíz de este repositorio:

```bash
docker compose up --build -d
docker compose ps
```

- App: [http://localhost:5173](http://localhost:5173).
- Comprobación principal, a través del proxy de la web:
  [http://localhost:5173/api/health](http://localhost:5173/api/health).
- API directa, para diagnóstico:
  [http://localhost:3000/api/health](http://localhost:3000/api/health).

```bash
curl -fsS http://localhost:5173/api/health
```

Espera `status: "ok"`, `api: "ok"` y `database: "ok"`. En el navegador deben
aparecer Frontend, API y Database en **OK**. La comprobación por 5173 valida
también el proxy que utiliza el frontend.

Si el puerto 3000 del Mac ya está ocupado:

```bash
API_HOST_PORT=3002 docker compose up --build -d
```

La web y su health siguen en 5173; la API directa queda en
`http://localhost:3002/api/health`.

Compose y el Mac comparten el mismo fichero `data/agentic-kanban.db`
(`./data` → `/data`). Ábrelo en TablePlus como **SQLite**. No arranques la API
del Mac mientras Compose esté arriba: los dos bloquearían el mismo `.db`.

## Parar

```bash
docker compose down
```

Eso no borra la base de datos.

## Resetear la base de datos

Este procedimiento **elimina los datos locales** de `agentic-kanban.db`.
Hazlo solo si quieres reiniciar la demo, antes de la clase y tras conservar
lo que necesites. Se limita al fichero de esta app y sus auxiliares SQLite;
no usa patrones que fallen en zsh cuando no haya coincidencias.

```bash
(
  set -e
  docker compose down
  rm -f -- data/agentic-kanban.db data/agentic-kanban.db-wal \
    data/agentic-kanban.db-shm data/agentic-kanban.db-journal
  docker compose up --build -d
)
```

El bloque se detiene si falla un comando. Después de levantar, restaura la
estructura y los datos según el estado que hayas implementado:

| Estado del proyecto                       | Qué hacer después del reset                     |
| ----------------------------------------- | ----------------------------------------------- |
| Antes del prompt 01, solo health          | No migrar ni seedear: comprueba health por 5173 |
| Desde el prompt 01, con tablas de auth    | Aplicar las migraciones ya generadas            |
| Estado actual (seed, lecturas, dashboard) | Aplicar migraciones y después ejecutar el seed  |

Solo cuando ya existan las migraciones del paso correspondiente:

```bash
docker compose exec api bun run db:migrate
```

Con el seed del prompt 04 ya en el repo, después de migrar:

```bash
docker compose exec api bun run db:seed
```

El seed es idempotente y no corre al arrancar la API. Cuentas de aula
(contraseña ficticia `Demo1234!` para las dos):

- Ana — `ana@demo.test`. Miembro de `ws_thepower_demo` «thePower Demo» y de
  `ws_ana_demo` «Espacio de Ana».
- Luis — `luis@demo.test`. Miembro solo de `ws_thepower_demo`.
- Proyecto `proj_agentic_kanban` «Agentic Kanban» en `ws_thepower_demo`.
- Proyecto `proj_ana_notes` «Notas de Ana» en `ws_ana_demo`.

Con la sesión de Ana, el dashboard lista «thePower Demo» y «Espacio de Ana».
Con la de Luis, solo «thePower Demo». `GET /api/projects/proj_ana_notes` con
la cookie de Luis responde 404. Sin cookie, las lecturas responden 401.

`vp test` no usa `data/agentic-kanban.db`. Cada fichero de test recibe una
base libSQL temporal (`apps/api/src/test/setup.ts`); `test.env` está en el
`vite.config.ts` de la raíz.

Finalmente comprueba `http://localhost:5173/api/health`. No generes una nueva
migración para recuperar las tablas: aplica las existentes. Con Compose
funcionando, migra y seedea dentro de `api`; no arranques otra API en el Mac.

## Cómo está conectado

```text
Navegador (React)
  → TanStack Query pide GET /api/health y GET /api/workspaces (URL relativa)
  → authClient.useSession() lee la cookie
  → Vite+ reenvía /api al contenedor api
  → Hono exige sesión en las lecturas y filtra por membresía
  → Drizzle lee libSQL
  → Zod valida el JSON en la API y otra vez en el frontend
```

Sin sesión, la pantalla muestra registro e inicio de sesión. Con sesión, el
nombre, cerrar sesión, el health y la lista de espacios. Ana ve dos; Luis,
uno. El color de cada espacio sale de su id.
