# Sesión 3 · 06 — Revisión como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades.

## Alcance

Todo lo implementado en la Sesión 3 (prompts 01–05) y las regresiones sobre
las Sesiones 1 y 2, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios
prompts. No añadas funcionalidades.

## Cómo trabajar

**Cursor: Agent con Opus 5.5; workers Grok 4.7 xhigh Fast.** Lee
`AGENTS.md`, `prompts/CURSOR.md` y `prompts/websockets/README.md`. Opus coordina y
revisa; Grok verifica y corrige. Usa `kanban-grok-worker` con
`model: "grok-4.7-xhigh-fast"` explícito en cada nueva Task si está en el
catálogo. Aplica el protocolo común si cambia; nunca omisión, `inherit` ni
Claude. No uses agentes históricos, subagentes integrados ni cuatro revisores
por rutina. Continúa sin otra aprobación ni commit; Opus no implementa la app.

1. **Consolidar.** Identifica la versión actual y los resultados aún válidos.
   Completa solo la evidencia ausente o invalidada. En las clases orquestadas,
   encarga a Grok el modo verificar de solo lectura sobre integración estable.
   Primero diagnostica y corrige los fallos locales conocidos.
2. **Aceptación que debe quedar cubierta.** `vp check`, `vp test` y estas pruebas por
   `http://localhost:5173`: stream sin cookie → 401; Luis en
   `/api/projects/proj_ana_notes/events` → 404; Ana en
   `/api/projects/proj_agentic_kanban/events` sigue abierta más de 10 s; una
   tarea creada por Ana aparece en el stream de Luis; Luis
   `GET /api/projects/proj_ana_notes/board` → 404 (regresión).
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

1. **Transporte y autorización.** Escrituras solo por HTTP; el stream solo
   anuncia; 401 sin sesión y 404 sin membresía, nunca 403; timeouts de Bun y
   del proxy; bajas del hub al desconectar; sin Socket.IO, Redis ni servicios
   extra.
2. **Publicación y contrato.** Eventos solo después de persistir; ninguno si
   la escritura falla; `actorUserId` de la sesión; Zod en los dos lados;
   eventos inválidos ignorados en el cliente.
3. **Cliente.** Un solo `EventSource` por tablero y cerrado al salir; ningún
   board en `useState`; el eco propio no rompe el optimista; invalidación al
   reconectar; ningún toast al autor.
4. **Alcance, regresiones y documentación.** Nada de presencia,
   notificaciones persistidas ni comentarios; las pruebas de las Sesiones 1 y 2
   siguen pasando; `AGENTS.md` y `.cursor/rules/` describen el árbol actual y
   siguen breves.

## Entrega

Una línea por problema real, del más grave al menos grave:
`severidad (alta/media/baja) | ruta:línea | problema | escenario | corrección mínima`.
Añade los checks y pruebas con su resultado real, los hallazgos descartados
con motivo y lo que siga pendiente. Si no hay problemas reales, dilo.
Opus delega a Grok las correcciones confirmadas, revisa sus diffs y repite
los checks afectados, sin pausa de aprobación. Distingue la evidencia local,
CodeRabbit y la aceptación manual del profesor. No hagas commit.
