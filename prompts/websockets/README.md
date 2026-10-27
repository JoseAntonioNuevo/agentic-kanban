# Sesión 3 (S11) — un plan y seis pasos en Agent

Miércoles 28 de octubre de 2026, 18:30–20:00. Partimos de la clase 2 aceptada:
board, CRUD, movimiento persistido y rollback. Añadimos avisos por SSE y
sincronización entre navegadores. El directorio se llama `websockets` por el
material original; el transporte elegido es **SSE**, con escrituras por HTTP.
Nada de comentarios, menciones ni campana todavía.

## Un plan inicial, un traspaso y seis pasos

1. Selecciona **Plan** en Cursor. Ejecuta
   [00 · Plan de la sesión](00-plan-sesion.md), adjuntando los seis prompts.
   El agente inspecciona y produce el plan completo sin implementar.
2. Revisa una vez contratos, secuencia y aceptación. Guarda el plan de Cursor
   o su contenido como `docs/planes/S11-tiempo-real.plan.md`; no es un archivo
   ya generado por este material. Ese plan concreto acompaña a cada paso.
3. Cambia manualmente a **Agent** y comprueba los selectores de modo y modelo.
   Pega el traspaso de abajo y ejecuta 01–06 uno cada vez. No vuelvas a Plan
   ni pidas un «adelante» entre pasos. Si abres contexto nuevo, adjunta el
   plan guardado y el prompt actual.

Los prompts no fijan modelo: lo eliges tú en el selector de cada modo. El
agente de Agent es el único ejecutor y revisor local: inspecciona, implementa,
prueba y corrige. No crea `Task`, workers ni subagentes. Lee también
[la guía común](../CURSOR.md) para límites, preparación, comprobaciones y
CodeRabbit. El preflight de subagentes no corresponde aquí.

```text
Ejecuta en Agent. Adjunto el plan ya revisado de la sesión 3 y el prompt del
paso actual. Lee AGENTS.md, prompts/CURSOR.md, prompts/websockets/README.md,
el plan, las reglas implicadas y el código real. Completa solo ese paso y sus
correcciones, sin pedir adelante. Eres el único ejecutor: no Task ni
subagentes. Conserva los contratos del plan, adapta detalles locales al código
y señala cualquier conflicto importante antes de cambiar el contrato. No hagas
commit ni implementes pasos futuros. Devuelve evidencia real y aceptación
manual pendiente.
```

| Paso                              | Para qué sirve                    | Qué validar antes de avanzar                                   |
| --------------------------------- | --------------------------------- | -------------------------------------------------------------- |
| [01 · Eventos](01-events.md)      | Contrato Zod de los anuncios      | Cuatro variantes válidas; eventos inválidos rechazados         |
| [02 · Stream](02-stream.md)       | Canal SSE autorizado y hub        | 401/404, conexión >10 s por `:5173`, keepalive y bajas         |
| [03 · Publicación](03-publish.md) | Eventos tras cada escritura       | Ana escribe y el stream de Luis lo recibe; un error no publica |
| [04 · Cliente](04-client.md)      | Caché, eco propio y reconexión    | Dos navegadores sincronizados sin duplicados ni saltos         |
| [05 · Toasts](05-toasts.md)       | Aviso al otro usuario             | Solo el otro usuario recibe el aviso, con un título útil       |
| [06 · Revisión](06-review.md)     | Cierre de contratos y regresiones | Evidencia conjunta, revisión justificada y correcciones        |

Los detalles y nombres públicos del plan deben coincidir con los prompts:
`boardEventSchema`, el hub `subscribe`/`publish`, `applyBoardEvent` y
`useBoardEvents` serán dependencias de la clase 4, que añadirá
`comment.created` al mismo canal. Un plan bonito no sustituye comprobar
`streamSSE`, los timeouts de Bun y del proxy ni la conexión real por `:5173`.

## Preparación, revisión y guiones

Guarda una base propia `BASE_CLASE` antes del 01; usa el checkpoint aceptado
de clase 2 y comprueba health, board, movimiento y el 404 de Luis al proyecto
privado. Abre dos sesiones independientes: Ana y Luis en el mismo proyecto.
No uses dos pestañas que compartan cookie para simular dos usuarios.

Las pruebas pasan por `:5173`: un stream que funciona directo en la API puede
estar roto en el proxy. El callback del stream es el único escritor; los
listeners del hub encolan. Las rutas de escritura siguen siendo HTTP
autorizado.

En el 06, el ciclo de vida SSE, el aislamiento, la publicación tras persistir
y el eco con el optimista pueden justificar CodeRabbit si no están ya
cubiertos. El agente consolida la evidencia, ejecuta esa revisión solo cuando
aporte valor, contrasta sus hallazgos y corrige lo confirmado sin otra
aprobación. Aplica la [base y cobertura comunes](../CURSOR.md#coderabbit-cuando-aporte-valor);
no vuelvas a Plan por rutina para el cierre.

La aceptación manual incluye mover en Ana y observar a Luis sin recargar,
comprobar que Ana no recibe toast propio y reconectar sin perder el estado
persistido. No se declara pasada sin observarla. No añadimos presencia,
comentarios ni notificaciones persistidas.

Usa el [guion operativo](../../docs/obsidian/S11-Kanban-clase-3-guion.md) y el
[texto para leer](../../docs/obsidian/S11-Kanban-clase-3-texto-para-leer.md).
