# Sesión 4 (S12) — un plan y ocho pasos en Agent

Miércoles 4 de noviembre de 2026, 18:30–20:00. Partimos de la clase 3 aceptada:
board sincronizado por SSE. Añadimos comentarios, menciones, notificaciones
privadas y un outbox local para simular email, y cerramos una demo reproducible.

## Un plan inicial, un traspaso y ocho pasos

1. Selecciona **Plan** en Cursor. Ejecuta
   [00 · Plan de la sesión](00-plan-sesion.md), adjuntando los ocho prompts.
   El agente inspecciona y produce el plan completo sin implementar.
2. Revisa una vez contratos, secuencia y aceptación. Guarda el plan de Cursor
   o su contenido como `docs/planes/S12-comentarios.plan.md`; no es un archivo
   ya generado por este material. Ese plan concreto acompaña a cada paso.
3. Cambia manualmente a **Agent** y comprueba los selectores de modo y modelo.
   Pega el traspaso de abajo y ejecuta 01–08 uno cada vez. No vuelvas a Plan
   ni pidas un «adelante» entre pasos. Si abres contexto nuevo, adjunta el
   plan guardado y el prompt actual.

Los prompts no fijan modelo: lo eliges tú en el selector de cada modo. El
agente de Agent es el único ejecutor y revisor local: inspecciona, implementa,
prueba y corrige. No crea `Task`, workers ni subagentes. Lee también
[la guía común](../CURSOR.md) para límites, preparación, comprobaciones y
CodeRabbit. El preflight de subagentes no corresponde aquí.

```text
Ejecuta en Agent. Adjunto el plan ya revisado de la sesión 4 y el prompt del
paso actual. Lee AGENTS.md, prompts/CURSOR.md, prompts/notifications/README.md,
el plan, las reglas implicadas y el código real. Completa solo ese paso y sus
correcciones, sin pedir adelante. Eres el único ejecutor: no Task ni
subagentes. Conserva los contratos del plan, adapta detalles locales al código
y señala cualquier conflicto importante antes de cambiar el contrato. No hagas
commit ni implementes pasos futuros. Devuelve evidencia real y aceptación
manual pendiente.
```

| Paso                                            | Para qué sirve                     | Qué validar antes de avanzar                                         |
| ----------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- |
| [01 · Modelo](01-models.md)                     | Comentarios y notificaciones       | Migración e índices; cascada al borrar tarea                         |
| [02 · API](02-api.md)                           | Comentarios por HTTP autorizado    | 201/200; 400/401/404 y fechas serializadas                           |
| [03 · Hilo](03-ui.md)                           | Hilo en el diálogo de editar       | Comentar separado de Guardar; ninguna escritura accidental           |
| [04 · Menciones y outbox](04-mentions-email.md) | `@Nombre` y correo de aula         | Solo destinatario válido; fallo de archivo no revierte el comentario |
| [05 · Campana](05-bell.md)                      | Menciones privadas del usuario     | Luis recibe; Ana ve vacío válido; errores visibles y lectura privada |
| [06 · Tiempo real](06-realtime.md)              | `comment.created` por el mismo SSE | Hilo y campana al día, sin segunda conexión ni filas duplicadas      |
| [07 · Demo local](07-deploy-demo.md)            | README y demo reproducible         | Solo web/api, build, Compose y outbox fuera de Git                   |
| [08 · Revisión](08-review.md)                   | Cierre de fronteras y regresiones  | Evidencia conjunta, revisión justificada y correcciones              |

Los detalles y nombres públicos del plan deben coincidir con los prompts:
`commentSchema`, `extractMentionTokens`, `OUTBOX_PATH`, `notificationSchema`
y `comment.created` cierran el producto. Un plan bonito no sustituye comprobar
la transacción real, el parser con `ana@demo.test` ni las fechas que valida
Zod en la campana.

## Preparación, revisión y guiones

Guarda una base propia `BASE_CLASE` antes del 01 y comprueba el checkpoint de
clase 3 con dos navegadores. Usa las cuentas ficticias Ana y Luis; nunca datos
personales.

El «email» es una línea de JSON en `data/outbox.jsonl`, no un envío real.
No hay proveedor SMTP/Resend, credenciales nuevas ni tercer contenedor. El
paso 07 prepara y verifica la demo **local**: no despliega a producción ni
ejecuta el procedimiento destructivo de reset para demostrarlo.

En el 08, la transacción, la privacidad de destinatarios y el orden del
outbox pueden justificar CodeRabbit si no están ya cubiertos. El agente
consolida la evidencia, ejecuta esa revisión solo cuando aporte valor,
contrasta sus hallazgos y corrige lo confirmado sin otra aprobación. Aplica
la [base y cobertura comunes](../CURSOR.md#coderabbit-cuando-aporte-valor);
no vuelvas a Plan por rutina para el cierre. CLI o cuota pendiente y prueba
manual pendiente se declaran por separado.

La demo final muestra a Ana comentando `@Luis` en el proyecto compartido:
Luis recibe hilo, toast y campana; Ana no recibe su propio aviso. El outbox
registra el destinatario ficticio. Luis sigue sin acceder al proyecto ni
comentarios privados de Ana. Marcar leído solo puede hacerlo el destinatario.

Usa el [guion operativo](../../docs/obsidian/S12-Kanban-clase-4-guion.md) y el
[texto para leer](../../docs/obsidian/S12-Kanban-clase-4-texto-para-leer.md).
