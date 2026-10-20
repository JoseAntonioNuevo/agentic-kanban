# Sesión 2 (S10) — plan de Opus, ejecución de Grok

Lunes 26 de octubre de 2026, 18:30–20:00. Partimos de la clase 1 aceptada:
auth, Ana/Luis, workspaces y proyectos. Construiremos el tablero, CRUD y
arrastre con persistencia. Nada de SSE, comentarios o campana todavía.

## Un plan inicial, un traspaso y ocho pasos

1. Selecciona **Plan con Opus 5.5**. Ejecuta
   [00 · Plan de la sesión](00-plan-sesion.md), adjuntando los ocho prompts.
   Opus inspecciona y produce el plan completo sin implementar.
2. Revisa una vez contratos, secuencia y aceptación. Guarda el plan de Cursor
   o su contenido como `docs/planes/S10-kanban.plan.md`; no es un archivo ya
   generado por este material. Ese plan concreto debe acompañar a Grok.
3. Cambia manualmente ambos selectores: **Agent y Grok 4.7 xhigh Fast**.
   Pega el traspaso de abajo y ejecuta 01–08 uno cada vez. No vuelvas a Plan
   ni pidas un «adelante» entre pasos. Si abres contexto nuevo, adjunta el
   plan guardado y el prompt actual.

Grok es el único ejecutor y revisor local: inspecciona, implementa, prueba y
corrige. No crea `Task`, workers ni subagentes, y Opus no continúa orquestando
de fondo. Lee también [la guía común](../CURSOR.md) para límites, preparación,
comprobaciones y CodeRabbit. El preflight de subagentes no corresponde aquí.

```text
Ejecuta en Agent con Grok 4.7 xhigh Fast. Adjunto el plan ya revisado de Opus
para la sesión 2 y el prompt del paso actual. Lee AGENTS.md, prompts/CURSOR.md,
prompts/kanban/README.md, el plan, las reglas implicadas y el código real.
Completa solo ese paso y sus correcciones, sin pedir adelante. Eres el único
ejecutor: no Task, subagentes ni cambio automático de modelo. Conserva los
contratos del plan, adapta detalles locales al código y señala cualquier
conflicto importante antes de cambiar el contrato. No hagas commit ni
implementes pasos futuros. Devuelve evidencia real y aceptación manual pendiente.
```

| Paso                                   | Para qué sirve                    | Qué validar antes de avanzar                                       |
| -------------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| [01 · Modelo](01-models.md)            | Columnas y tareas                 | FK, índices, posiciones y migración sin UNIQUE de posición         |
| [02 · Seed](02-seed.md)                | Tableros de demo repetibles       | Dos ejecuciones, tres columnas por proyecto y posiciones contiguas |
| [03 · API](03-api.md)                  | Board y CRUD autorizado           | 200/201/204, 400/401/404 y filtros de tenant                       |
| [04 · Postman](04-postman.md)          | API reproducible sin UI           | Cookies, variables, flujo CRUD y casos negativos reales            |
| [05 · UI](05-ui.md)                    | Tablero y formularios             | TanStack Query como estado, parse Zod y persistencia al recargar   |
| [06 · Movimiento](06-task-movement.md) | Reordenación transaccional        | Mismo proyecto, posiciones contiguas y 404 entre proyectos         |
| [07 · Arrastre](07-drag-drop.md)       | Optimista y rollback              | dnd-kit instalado, misma/otra columna/vacía, error y recarga       |
| [08 · Revisión](08-review.md)          | Cierre de contratos y regresiones | Evidencia conjunta, revisión justificada y correcciones            |

Los detalles y nombres públicos del plan deben coincidir con los prompts:
`boardResponseSchema`, `boardQueryKey`, `applyBoardMove` y `mutationKey`
serán dependencias de la clase 3. Un plan bonito no sustituye comprobar las
APIs instaladas de dnd-kit ni el algoritmo real de posiciones.

## Preparación, revisión y guiones

Guarda una base propia `BASE_CLASE` antes del 01; usa el checkpoint aceptado
de clase 1 y comprueba health, logins y el 404 de Luis al proyecto privado.
No resetees la DB ni adelantes datos de la clase 3 para preparar la demo.

En el 08, el movimiento transaccional, el aislamiento y el rollback pueden
justificar CodeRabbit si no están ya cubiertos. Grok consolida la evidencia,
ejecuta esa revisión solo cuando aporte valor, contrasta sus hallazgos y
corrige lo confirmado sin otra aprobación. Aplica la
[base y cobertura comunes](../CURSOR.md#coderabbit-cuando-aporte-valor);
no vuelvas a Opus por rutina para el cierre.

La aceptación manual incluye abrir el board, crear/editar/borrar, recargar,
mover a una columna vacía y observar un rollback ante un fallo controlado.
Solo en la demo preparada, el profesor puede parar y volver a arrancar `api`
para esa prueba; no se declara pasada sin observarla.

Usa el [guion operativo](../../docs/obsidian/S10-Kanban-clase-2-guion.md) y el
[texto para leer](../../docs/obsidian/S10-Kanban-clase-2-texto-para-leer.md).
