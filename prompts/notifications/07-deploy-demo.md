# Sesión 4 · 07 — Deploy de aula y guion de la demo

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

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`,
`prompts/notifications/README.md`, las reglas implicadas y el código. Usa
`kanban-grok-worker` y pasa `model: "grok-4.7-xhigh-fast"` explícito en cada
nueva Task si está en el catálogo; aplica el protocolo común si cambia.
No uses omisión, `inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza el paso y sus correcciones locales. Opus coordina,
fija contratos y revisa; Grok inspecciona, implementa, prueba y actualiza el
estado documentado. Continúa sin «adelante» ni aprobación rutinaria del plan.
No hagas commit, no escribas tú la app ni implementes pasos siguientes.

1. **Inspección (Grok).** Confirma README, `.gitignore`, scripts de `package.json`,
   `docker-compose.yml` y estado de `data/outbox.jsonl` en Git.
2. **Contratos y reparto (Opus); implementación (Grok).** Cambios mínimos de README, `.gitignore` y estado de `AGENTS.md`. Un worker
   escribe documentación y saca `data/outbox.jsonl` del índice solo si estaba
   seguido, conservando el archivo local. No ejecuta el reset de datos ni
   despliega a producción: este paso prepara la demo local.
3. **Comprobaciones y revisión.** Grok ejecuta `vp check`, `vp test`, `vp build apps/web`,
   `docker compose config` y comprueba que los comandos del README existen
   en `package.json` o Compose. Opus revisa README, `AGENTS.md` y que la
   salida del índice no haya eliminado el outbox local.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check`, `vp test` y `vp build apps/web` en verde;
      `docker compose config` es válido.
- [ ] `git status` muestra `data/outbox.jsonl` como eliminado del índice y ya
      no como modificado.
- [ ] Los comandos del README coinciden con los scripts reales.

## Al terminar

No hagas commit. Cierra con el resumen que pide `AGENTS.md`.
