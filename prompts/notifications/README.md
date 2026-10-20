# Sesión 4 (S12) — Opus orquesta comentarios y menciones

Miércoles 4 de noviembre de 2026, 18:30–20:00. Partimos de la clase 3 aceptada:
board sincronizado por SSE. Añadimos comentarios, menciones, notificaciones
privadas y un outbox local para simular email, y cerramos una demo reproducible.

## Reparto durante los ocho pasos

**Agent con Opus 5.5 como principal; workers Grok 4.7 xhigh Fast.** Sigue
[la guía común](../CURSOR.md): Task nueva a `kanban-grok-worker` con modelo
explícito, autonomía dentro del paso y propietarios de archivos. Opus
coordina/revisa, Grok inspecciona/implementa/prueba/corrige. No hay aprobación
rutinaria del plan, implementaciones de Opus ni agentes históricos.

| Paso                                            | Qué mantiene Opus                         | Qué comprobar                                                        |
| ----------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| [01 · Modelo](01-models.md)                     | FK y propiedad de comentario/notificación | Migración e índices; cascada al borrar tarea                         |
| [02 · API](02-api.md)                           | Autor desde sesión y permiso de tarea     | 201/200; 400/401/404 y fechas serializadas                           |
| [03 · Hilo](03-ui.md)                           | Acción Comentar separada de Guardar       | Hilo en edición, estados y ninguna escritura accidental              |
| [04 · Menciones y outbox](04-mentions-email.md) | Miembro → transacción → outbox → marcado  | Solo destinatario válido; fallo de archivo no revierte el comentario |
| [05 · Campana](05-bell.md)                      | Destinatario, schema y dos cabeceras      | Luis recibe; Ana ve vacío válido; errores visibles y lectura privada |
| [06 · Tiempo real](06-realtime.md)              | `comment.created` sobre el SSE existente  | Hilo/campana al día, sin segunda conexión ni filas duplicadas        |
| [07 · Demo local](07-deploy-demo.md)            | README y alcance reproducible             | Solo web/api, build, Compose y outbox fuera de Git                   |
| [08 · Revisión](08-review.md)                   | Fronteras y regresiones del producto      | Checks, aislamiento y pendientes reales                              |

En el 04, extracción de tokens y módulo de outbox pueden avanzar en paralelo
con archivos separados; la transacción se integra después. En 05/06, fija
schemas antes de dividir API y cliente. El responsable de integración ejecuta
las pruebas generales; no compiten varios workers por migraciones ni por
escribir el mismo archivo de eventos.

## Preparación, cierre y guiones

Guarda `BASE_CLASE` antes del 01 y comprueba el checkpoint de clase 3 con dos
navegadores. Repite [el preflight](../00-comprobar-delegacion.md) si cambió la
configuración. Usa las cuentas ficticias Ana y Luis; nunca datos personales.

El «email» es una línea de JSON en `data/outbox.jsonl`, no un envío real.
No hay proveedor SMTP/Resend, credenciales nuevas ni tercer contenedor. El
paso 07 prepara y verifica la demo **local**: no despliega a producción ni
ejecuta el procedimiento destructivo de reset para demostrarlo.

En el 08, transacción, privacidad de destinatarios y orden del outbox pueden
justificar CodeRabbit si no hay cobertura vigente. Opus usa
[el criterio común](../CURSOR.md#coderabbit-cuando-aporte-valor), contrasta
hallazgos y delega correcciones; no necesita un «adelante» para arreglos del
alcance. CLI/cuota pendiente y prueba manual pendiente se declaran por separado.

La demo final muestra a Ana comentando `@Luis` en el proyecto compartido:
Luis recibe hilo, toast y campana; Ana no recibe su propio aviso. El outbox
registra el destinatario ficticio. Luis sigue sin acceder al proyecto ni
comentarios privados de Ana. Marcar leído solo puede hacerlo el destinatario.

Usa el [guion operativo](../../docs/obsidian/S12-Kanban-clase-4-guion.md) y el
[texto para leer](../../docs/obsidian/S12-Kanban-clase-4-texto-para-leer.md).
