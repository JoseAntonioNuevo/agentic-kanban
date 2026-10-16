# Sesión 4 · 04 — Menciones y correo de aula

Tiempo en clase: ~14 min. Tú no editas código: orquestas. Antes de lanzar a los implementadores, presenta un plan de 15 líneas
como máximo (cómo parseas, cómo resuelves miembros, la transacción y el
outbox) y espera mi «adelante».

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

Tú (Opus) orquestas y no editas ficheros: investigan los subagentes Haiku, implementa Sonnet y verifica Haiku. Usa los subagentes de `.claude/agents/`; si tu herramienta no los tiene, haz los mismos pasos en este orden.

1. **Investigar** — `kanban-recon` (Haiku): el `POST` de comentarios, la tabla `notification`, cómo se resuelve `DATABASE_URL` y el arnés de tests.
2. **Planificar** — tú: detalla en los briefs la transacción y el orden (transacción → outbox → `emailed_at`). Presenta el plan y espera mi «adelante».
3. **Implementar** — `kanban-implementer` (Sonnet): dos en paralelo: A, `extractMentionTokens` y sus tests; B, el módulo del outbox y sus tests con `OUTBOX_PATH` temporal. Después, un tercero integra la resolución y la transacción en el `POST`, escribe los tests de extremo a extremo y actualiza la documentación de «Al terminar».
4. **Verificar** — `kanban-verifier` (Haiku): puerta de calidad y prueba en vivo: Ana comenta `@Luis mira esto` en `task_kanban_1` y la última línea de `data/outbox.jsonl` va a `luis@demo.test`.
5. **Revisar** — tú revisas el diff completo con lupa en la transacción y en el orden del outbox. Si algo falla, encarga el arreglo a un `kanban-implementer` y vuelve a verificar.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde; los tests no escriben en `data/`.
- [ ] La prueba en vivo deja la línea del outbox para Luis.

## Al terminar

El implementador encargado de la documentación actualiza `AGENTS.md` (menciones y outbox sí; campana no). No hagas commit.
Cierra con el resumen que pide `AGENTS.md`.
