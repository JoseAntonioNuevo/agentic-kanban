# Sesión 3 (S11) — Opus orquesta el tiempo real

Miércoles 28 de octubre de 2026, 18:30–20:00. Partimos de la clase 2 aceptada:
board, CRUD, movimiento persistido y rollback. Añadimos avisos por SSE y
sincronización entre navegadores. El directorio se llama `websockets` por el
material original; el transporte elegido es **SSE**, con escrituras por HTTP.

## Reparto durante los seis pasos

**Agent con Opus 5.5 como principal; workers Grok 4.7 xhigh Fast.** Sigue
[la guía común](../CURSOR.md) y el selector explícito de cada nueva Task a
`kanban-grok-worker`. Opus fija contratos y revisa la integración; Grok
inspecciona, implementa, prueba y corrige. No hay pausa de «adelante», agentes
históricos ni subagentes integrados. No uses Plan y traspaso en esta clase.

| Paso                              | Contrato o frontera que mantiene Opus | Evidencia de Grok y del profesor                        |
| --------------------------------- | ------------------------------------- | ------------------------------------------------------- |
| [01 · Eventos](01-events.md)      | Unión Zod y payload final             | Cuatro variantes válidas; eventos inválidos rechazados  |
| [02 · Stream](02-stream.md)       | Autorización, hub y vida de conexión  | 401/404, conexión >10 s, keepalive y limpieza al cerrar |
| [03 · Publicación](03-publish.md) | Persistencia antes de emitir          | Ana escribe y Luis recibe; un error no publica          |
| [04 · Cliente](04-client.md)      | Caché, eco propio y reconexión        | Dos navegadores sincronizados sin duplicados ni saltos  |
| [05 · Toasts](05-toasts.md)       | Autor y mensajes                      | Solo el otro usuario recibe el aviso                    |
| [06 · Revisión](06-review.md)     | Transporte, contrato y regresiones    | Evidencia vigente, correcciones y pendientes reales     |

Un worker puede resolver 01/03/05. En 02, la vida del stream y los timeouts
requieren integración antes de verificar. En 04, `applyBoardEvent` y el hook
pueden avanzar en paralelo tras fijar firmas y archivos. No paralelices el
mismo `board.ts`, configuración o montaje entre workers.

## Preparación y aceptación

Guarda `BASE_CLASE` antes del 01, comprueba el checkpoint de clase 2 y ejecuta
[el preflight](../00-comprobar-delegacion.md) si cambió la configuración desde
la clase 1. Abre dos sesiones independientes: Ana y Luis en el mismo proyecto.
No uses dos pestañas que compartan cookie para simular dos usuarios.

Las pruebas deben pasar por `:5173`: un stream que funciona directo en la API
puede estar roto en el proxy. El callback del stream es el único escritor;
los listeners del hub encolan. Comprueba aborto, suscripciones, keepalive,
timeouts de Bun/Vite y ausencia de `event:` con nombre si el cliente usa
`onmessage`. Las rutas de escritura siguen siendo HTTP autorizado.

En el 06, ciclo de vida SSE, aislamiento, publicación tras commit y eco con
optimista justifican CodeRabbit si queda una parte sin revisar. Opus aplica
[el criterio de cobertura](../CURSOR.md#coderabbit-cuando-aporte-valor),
clasifica hallazgos y delega correcciones a Grok. No se lanzan cuatro
revisores ni se repiten checks vigentes por sistema.

La prueba manual requiere mover en Ana, observar a Luis sin recargar,
comprobar que Ana no recibe toast propio y reconectar sin perder el estado
persistido. No añadimos presencia, comentarios ni notificaciones persistidas.

Usa el [guion operativo](../../docs/obsidian/S11-Kanban-clase-3-guion.md) y el
[texto para leer](../../docs/obsidian/S11-Kanban-clase-3-texto-para-leer.md).
