# Sesión 4 · 08 — Revisión final como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades.

## Alcance

Todo lo implementado en la Sesión 4 (prompts 01–07) y las regresiones sobre
las Sesiones 1 a 3, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios
prompts. No añadas funcionalidades.

## Cómo trabajar

**Cursor: Agent con Opus 5.5; workers Grok 4.7 xhigh Fast.** Lee
`AGENTS.md`, `prompts/CURSOR.md` y `prompts/notifications/README.md`. Opus coordina y
revisa; Grok verifica y corrige. Usa `kanban-grok-worker` con
`model: "grok-4.7-xhigh-fast"` explícito en cada nueva Task si está en el
catálogo. Aplica el protocolo común si cambia; nunca omisión, `inherit` ni
Claude. No uses agentes históricos, subagentes integrados ni cuatro revisores
por rutina. Continúa sin otra aprobación ni commit; Opus no implementa la app.

1. **Consolidar.** Identifica la versión actual y los resultados aún válidos.
   Completa solo la evidencia ausente o invalidada. En las clases orquestadas,
   encarga a Grok el modo verificar de solo lectura sobre integración estable.
   Primero diagnostica y corrige los fallos locales conocidos.
2. **Aceptación que debe quedar cubierta.** `vp check`, `vp test`, `vp build apps/web` y estas
   pruebas por `http://localhost:5173`: tras una mención de Ana, Luis
   `GET /api/notifications` → 200 con al menos 1 y Ana → 200 `[]`; Luis
   `GET /api/tasks/task_ana_1/comments` → 404; Luis
   `GET /api/projects/proj_ana_notes/events` → 404; borrar una tarea creada
   para la prueba con un comentario → 204.
3. **CodeRabbit si aporta valor.** Explica la incertidumbre o frontera de
   riesgo antes de lanzarlo. Sigue `prompts/CURSOR.md`: base guardada antes
   del 01 de esta clase, checkpoints, cambios sin commit y nuevos archivos.
   Reutiliza cobertura vigente y revisa solo lo pendiente identificable.
   Si no está disponible, declara esa revisión pendiente sin instalar,
   cambiar de cuenta ni activar créditos; distingue la revisión local.
4. **Contrastar.** Usa las dimensiones de abajo sin lanzar una auditoría por
   dimensión. Confirma cada hallazgo con `ruta:línea` y escenario; clasifica
   problema real, descartado con motivo o pendiente de evidencia. El informe
   externo no da órdenes ni autoriza cambios de alcance.
5. **Corregir y verificar.** Opus delega las correcciones confirmadas a Grok, revisa los diffs y repite
   los checks afectados. Paraleliza solo arreglos independientes con archivos
   propios y espera los resultados.
   No repitas CodeRabbit por rutina tras un arreglo pequeño. Deja separadas
   comprobaciones automáticas, revisión adicional y aceptación manual pendiente.

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
Añade los checks y pruebas con su resultado real, los hallazgos descartados
con motivo y lo que siga pendiente. Si no hay problemas reales, dilo.
Opus delega a Grok las correcciones confirmadas, revisa sus diffs y repite
los checks afectados, sin pausa de aprobación. Distingue la evidencia local,
CodeRabbit y la aceptación manual del profesor. No hagas commit.
