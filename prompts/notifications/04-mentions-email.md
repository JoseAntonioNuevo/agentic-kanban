# Sesión 4 · 04 — Menciones y correo de aula

## Punto de partida

Comentarios por HTTP (02) y en la interfaz (03). La tabla `notification` ya
tiene los campos del email (01). El seed tiene a `Ana` y a `Luis` como
`user.name`.

## Objetivo

Al crear un comentario con `@Nombre`, cada miembro mencionado recibe una
notificación persistida y un email generado en un outbox local.

## Contratos que fijas aquí

- `extractMentionTokens(body): string[]`: función pura con tests en
  `packages/schemas/src/mentions.ts`.
- Outbox en `apps/api/src/mail/outbox.ts`: una línea JSON por email.

## Requisitos

- **Parser.** Una mención es `@` seguido de letras (`\p{L}+`, también con
  tildes), con el `@` al principio del texto o tras un carácter que no sea
  letra ni número (así `ana@demo.test` no menciona a nadie). La puntuación
  corta el nombre: `@Luis,` → `Luis`. Sin duplicados, sin distinguir
  mayúsculas.
- **Resolución.** Se compara sin distinguir mayúsculas con `user.name` de los
  miembros del **mismo** workspace que la tarea, en una sola consulta. Se
  ignoran los desconocidos y la automención.
- **Transacción.** En la misma transacción que el comentario, una fila
  `notification` por mención válida: `kind = "mention"`, destinatario,
  `actor_user_id` (el autor), `task_id`, `comment_id`, el `workspace_id` de la
  tarea, `email_to` (email del mencionado), `email_subject`
  (`«{actor} te mencionó en "{título de la tarea}"»`), `email_body` en texto
  con el título y el comentario, y `emailed_at` vacío.
- **Envío de aula.** Después de confirmar la transacción, añade una línea JSON
  por notificación al outbox (`to`, `subject`, `body`, `notificationId`,
  `createdAt`) y marca `emailed_at`. Ruta: `OUTBOX_PATH` si existe (para los
  tests); si no, `outbox.jsonl` en la misma carpeta que el fichero de
  `DATABASE_URL` (en Compose, `/data/outbox.jsonl`; en el Mac,
  `data/outbox.jsonl`). Si falla la escritura, se registra el error, `emailed_at`
  se queda vacío y el comentario igualmente responde 201.
- Sin Resend, SMTP, contenedor de correo ni dotenv. El contrato HTTP del
  `POST` no cambia.
- **Tests** con la base de test y un `OUTBOX_PATH` temporal, con fixtures como
  las de la demo (usuarios `Ana` y `Luis`, un workspace compartido y otro solo
  de Ana): Ana comenta `@Luis mira esto` → una notificación para Luis, una
  línea en el outbox para su email y `emailed_at` relleno; Ana no recibe
  ninguna; `@Pepe` y `@Ana` escrito por Ana → ninguna; `@Luis` en una tarea
  del workspace privado de Ana → ninguna; `@luis,` → una; sin menciones → 201
  y ninguna.

## Fuera de alcance

Campana, frontend de menciones y despliegue.

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

1. **Inspección (Grok).** Confirma el POST de comentarios, tabla `notification`,
   resolución de `DATABASE_URL` y arnés de tests.
2. **Contratos y reparto (Opus); implementación (Grok).** Detalla transacción → outbox → `emailed_at`. Con contratos fijados puede
   repartir `extractMentionTokens` y tests, y módulo outbox con sus tests y
   `OUTBOX_PATH` temporal. Después asigna integración de resolución,
   transacción, tests de extremo a extremo y documentación a un responsable.
3. **Comprobaciones y revisión.** Grok pasa `vp check`, `vp test` y prueba: Ana comenta `@Luis mira esto` en
   `task_kanban_1` y la última línea de `data/outbox.jsonl` va a
   `luis@demo.test`. Opus revisa destinatarios, atomicidad y orden de outbox,
   incluidos los fallos de escritura del archivo.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde; los tests no escriben en `data/`.
- [ ] La prueba en vivo deja la línea del outbox para Luis.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md` (menciones y outbox sí; campana no). No hagas commit.
Cierra con el resumen que pide `AGENTS.md`.
