# Sesión 4 · 08 — Revisión final como una PR

Tiempo en clase: ~5–10 min. Es una revisión: no modifiques código hasta que
apruebe el plan de corrección.

## Alcance

Todo lo implementado en la Sesión 4 (prompts 01–07) y las regresiones sobre
las Sesiones 1 a 3, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios
prompts. No añadas funcionalidades.

## Cómo trabajar

Usa los subagentes de `.claude/agents/`. Lanza en paralelo:

- `kanban-verifier` (Haiku): `vp check`, `vp test`, `vp build apps/web` y estas
  pruebas por `http://localhost:5173`: tras una mención de Ana, Luis
  `GET /api/notifications` → 200 con al menos 1 y Ana → 200 `[]`; Luis
  `GET /api/tasks/task_ana_1/comments` → 404; Luis
  `GET /api/projects/proj_ana_notes/events` → 404; borrar una tarea creada
  para la prueba con un comentario → 204.
- Cuatro `kanban-reviewer` (Sonnet), uno por dimensión, con la lista de abajo.

Después, tú (Opus) compruebas cada hallazgo en el código. Descarta lo que no
se sostenga con `ruta:línea` y un escenario concreto, y consolida.

## Qué revisa cada dimensión

1. **Aislamiento y autorización.** Comentarios o notificaciones sin
   `workspace_id`; IDOR (Luis lee comentarios o notificaciones de Ana); 403 en
   lugar de 404; una campana que lista notificaciones de otro usuario.
2. **Menciones, transacción y email.** Menciones a quien no es miembro;
   automención; emails escritos antes de persistir el comentario; outbox
   versionado o fuera de `./data`; `emailed_at` mal gestionado; borrado de
   tareas con comentarios sin cascada.
3. **Tiempo real y cliente.** SSE usado para escribir; toast al autor del
   comentario; el toast tratado como si fuera la campana; un segundo
   `EventSource`; un comentario creado al pulsar Guardar; la campana de Luis
   vacía tras `@Luis`; «No se pudieron cargar las menciones» con un `GET` 200
   con filas (parse de fechas ISO en el cliente); «Nada pendiente» cuando la
   query falló; `[]` de Ana pintado como error; un 500 en
   `GET /api/notifications` porque Zod rechaza una fecha o un extracto vacío.
4. **Alcance, regresiones y documentación.** Resend, SMTP, Socket.IO, Redis,
   React Router, React Hook Form o un tercer servicio de Docker; las pruebas
   de las Sesiones 1 a 3 siguen pasando; el guion del README funciona con los
   comandos reales; `AGENTS.md` describe el producto final y es breve.

## Entrega

Una línea por problema real, del más grave al menos grave:
`severidad (alta/media/baja) | ruta:línea | problema | escenario | corrección mínima`.
Añade el resultado del verificador. Si no hay problemas reales, dilo. Después
propón el plan mínimo de corrección y espera mi aprobación. Tú no
editas código: si lo apruebo, encarga cada corrección a un
`kanban-implementer` (Sonnet) y vuelve a pasar `kanban-verifier` (Haiku).
