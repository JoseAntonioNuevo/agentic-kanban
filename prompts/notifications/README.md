# Sesión 4 (S12) — un plan y ocho pasos en Agent

Miércoles 4 de noviembre de 2026, 18:30–20:00. Partimos de la clase 3 aceptada:
board sincronizado por WebSocket. Añadimos comentarios, menciones,
notificaciones privadas y emails de notificación reales con Cloudflare Email
Service, y cerramos con el deploy en la cuenta de Cloudflare del profesor.

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

| Paso                                           | Para qué sirve                           | Qué validar antes de avanzar                                         |
| ---------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| [01 · Modelo](01-models.md)                    | Comentarios y notificaciones             | Migración e índices; cascada al borrar tarea                         |
| [02 · API](02-api.md)                          | Comentarios por HTTP autorizado          | 201/200; 400/401/404 y fechas serializadas                           |
| [03 · Hilo](03-ui.md)                          | Hilo en el diálogo de editar             | Comentar separado de Guardar; ninguna escritura accidental           |
| [04 · Menciones y email](04-mentions-email.md) | `@Nombre` y email de notificación real   | Solo destinatario válido; el email llega; un fallo no revierte       |
| [05 · Campana](05-bell.md)                     | Menciones privadas del usuario           | Luis recibe; Ana ve vacío válido; errores visibles y lectura privada |
| [06 · Tiempo real](06-realtime.md)             | `comment.created` por el mismo WebSocket | Hilo y campana al día, sin segunda conexión ni filas duplicadas      |
| [07 · Deploy](07-deploy-cloudflare.md)         | URL pública en Cloudflare y README       | Cuenta comprobada; health, login, 404 y WebSocket en la URL pública  |
| [08 · Revisión](08-review.md)                  | Cierre de fronteras y regresiones        | Evidencia local y pública, revisión justificada y correcciones       |

Los detalles y nombres públicos del plan deben coincidir con los prompts:
`commentSchema`, `extractMentionTokens`, `deliverEmail`, `notificationSchema`,
`comment.created`, `apps/edge` y `deploy:cloudflare` cierran el producto. Un
plan bonito no sustituye comprobar la transacción real, el parser con
`ana@demo.test`, las fechas que valida Zod en la campana ni la URL pública.

## Preparar Cloudflare antes de clase

El deploy y el envío real dependen de la cuenta del profesor. Déjalo listo
antes del directo; ninguno de estos pasos se hace con el agente:

1. Plan **Workers Paid** activo en la cuenta: Containers lo exige.
2. Un dominio de la cuenta incorporado en **Email Service → Email Sending**
   (añade los registros SPF, DKIM y DMARC). `MAIL_FROM` es una dirección de
   ese dominio.
3. Un token de API de la cuenta con el permiso **Email Sending: Edit**
   (`CLOUDFLARE_EMAIL_TOKEN`) y el ID de la cuenta (`CLOUDFLARE_ACCOUNT_ID`).
4. Una bandeja tuya para la demo (`MAIL_REDIRECT_TO`): los usuarios de demo
   usan `@demo.test` y no reciben correo.
5. `.env` en la raíz (Compose lo lee y Git lo ignora) con
   `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN`, `MAIL_FROM` y
   `MAIL_REDIRECT_TO`.
6. `.env.cloudflare.local` con esas cuatro, un `BETTER_AUTH_SECRET` nuevo y
   largo, y `BETTER_AUTH_URL` con la URL pública
   (`https://agentic-kanban.<tu-subdominio>.workers.dev`).
7. En la terminal de Cursor, `bunx wrangler login` y después
   `bunx wrangler whoami`: debe mostrar la cuenta del curso. Docker Desktop
   arrancado.

Ese acceso es el que usará el agente en el 07. No pegues tokens en el chat ni
uses credenciales de otros proyectos.

## Tiempo en directo

Ocho pasos más el plan no caben con holgura en 90 minutos, y el 07 añade la
construcción de la imagen y unos minutos de aprovisionamiento la primera vez.
Con Cloudflare preparado de antemano, lanza el deploy del 07 y aprovecha esa
espera para empezar el 08 en local. CodeRabbit va después de la clase salvo
que sobre tiempo.

## Preparación, revisión y guiones

Guarda una base propia `BASE_CLASE` antes del 01 y comprueba el checkpoint de
clase 3 con dos navegadores. Usa las cuentas ficticias Ana y Luis; nunca datos
personales.

El email es real cuando hay credenciales: la API lo envía con la API REST de
Cloudflare Email Service, sin SMTP ni SDK. Sin credenciales (tests y
desarrollo) queda en `data/outbox.jsonl`. El 07 despliega en la cuenta
comprobada con `wrangler whoami` y documenta el reset local sin ejecutarlo.
El disco del contenedor es efímero: cada arranque vuelve al seed.

En el 08, la transacción, la privacidad de destinatarios, los secretos y el
deploy pueden justificar CodeRabbit si no están ya cubiertos. El agente
consolida la evidencia, ejecuta esa revisión solo cuando aporte valor,
contrasta sus hallazgos y corrige lo confirmado sin otra aprobación. Aplica
la [base y cobertura comunes](../CURSOR.md#coderabbit-cuando-aporte-valor);
no vuelvas a Plan por rutina para el cierre. CLI o cuota pendiente y prueba
manual pendiente se declaran por separado.

La demo final se hace en la URL pública: Ana comenta `@Luis` en el proyecto
compartido; Luis recibe hilo, toast y campana; Ana no recibe su propio aviso.
El email de la mención llega a la bandeja de demo. Luis sigue sin acceder al
proyecto ni a los comentarios privados de Ana. Marcar leído solo puede
hacerlo el destinatario.

Usa el [guion operativo](../../docs/obsidian/S12-Kanban-clase-4-guion.md) y el
[texto para leer](../../docs/obsidian/S12-Kanban-clase-4-texto-para-leer.md).
