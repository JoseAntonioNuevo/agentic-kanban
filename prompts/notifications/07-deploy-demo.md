# Sesión 4 · 07 — Deploy de aula y guion de la demo

Tiempo en clase: ~8 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, dime qué cambiarás en el README,
`.gitignore` y `AGENTS.md`, y espera mi «adelante».

## Punto de partida

El producto del bloque está completo (Sesiones 1–4, prompts 01–06). Falta
dejarlo listo para arrancar y demostrar en el aula.

## Objetivo

Que cualquiera pueda levantar el proyecto con un comando, preparar los datos
de la demo y seguir un guion de dos navegadores.

## Requisitos

- El deploy de aula es `docker compose up --build` con los dos servicios de
  siempre, `web` y `api`. Nada de Fly, Vercel, Resend, contenedor de correo ni
  tags `sesion-*`.
- `data/outbox.jsonl` fuera de Git: añádelo a `.gitignore` y, como ahora mismo
  está versionado (con líneas de un ensayo anterior), sácalo del índice con
  `git rm --cached data/outbox.jsonl` sin borrar el fichero local. El volumen
  `./data` ya lo monta en la API.
- README con:
  - reset (`docker compose down`, borrar `data/*.db*` y `data/outbox.jsonl`);
  - arranque, migración y seed con los comandos reales de `package.json`
    (dentro del contenedor si Compose está arriba);
  - el guion de la demo:

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

- `AGENTS.md` final: estado del producto completo y deploy de aula = Compose.
  Revísalo entero para que sea breve y no contenga frases que ya no son
  ciertas.
- No ejecutes el reset durante la clase: solo documéntalo.

## Fuera de alcance

Funcionalidades de producto nuevas y despliegues públicos.

## Cómo trabajar

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): README, `.gitignore`, scripts de `package.json`, `docker-compose.yml` y el estado de `data/outbox.jsonl` en Git.
2. **Planificar** — tú: qué cambia en el README, `.gitignore` y `AGENTS.md`. Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): uno solo: README, `.gitignore`, `git rm --cached data/outbox.jsonl` y `AGENTS.md`.
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad completa, `docker compose config` y que cada comando del README existe en `package.json` o en Docker Compose.
5. **Revisar** — tú revisas el diff completo del README y de `AGENTS.md`. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check`, `vp test` y `vp build apps/web` en verde;
      `docker compose config` es válido.
- [ ] `git status` muestra `data/outbox.jsonl` como eliminado del índice y ya
      no como modificado.
- [ ] Los comandos del README coinciden con los scripts reales.

## Al terminar

No hagas commit. Cierra con el resumen que pide `AGENTS.md`.
