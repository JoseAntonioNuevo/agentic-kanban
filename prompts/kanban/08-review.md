# Sesión 2 · 08 — Revisión como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades.

## Alcance

Todo lo implementado en la Sesión 2 (prompts 01–07) y las regresiones sobre la
Sesión 1, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios prompts.
No añadas funcionalidades.

## Cómo trabajar

**Cursor: Agent con Grok 4.7 xhigh Fast como único ejecutor.** Lee
`AGENTS.md`, `prompts/CURSOR.md`, `prompts/kanban/README.md` y el plan inicial
de Opus adjunto. No uses Task, subagentes ni cambio automático de modelo.
Consolida tú la revisión y corrige los problemas confirmados dentro del
alcance, sin otro «adelante». No hagas commit.

1. **Consolidar.** Identifica la versión actual y los resultados aún válidos.
   Completa tú solo la evidencia ausente o invalidada sobre la integración
   estable, sin editar mientras recoges resultados de verificación.
   Primero diagnostica y corrige los fallos locales conocidos.
2. **Aceptación que debe quedar cubierta.** `vp check`, `vp test` y estas pruebas por
   `http://localhost:5173`: Ana `GET /api/projects/proj_agentic_kanban/board` →
   200; Luis `GET /api/projects/proj_ana_notes/board` → 404; Ana mueve
   `task_kanban_1` a `col_ana_todo` → 404; sin cookie → 401; Luis
   `GET /api/projects/proj_ana_notes` → 404 (regresión de la Sesión 1).
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
5. **Corregir y verificar.** Corrige tú los problemas confirmados y repite los checks afectados.
   No repitas CodeRabbit por rutina tras un arreglo pequeño. Deja separadas
   comprobaciones automáticas, revisión adicional y aceptación manual pendiente.

## Qué revisa cada dimensión

1. **Aislamiento y autorización.** Consultas tenant-owned sin `workspace_id`;
   IDOR; tareas o columnas de otro workspace; movimientos entre projects; 403
   en lugar de 404; autorización basada en IDs del cliente.
2. **Datos y contratos.** Inputs sin validación Zod; respuestas sin `.parse()`;
   `position` inconsistente o sin transacción; seed no idempotente; tests que
   no prueban lo que dicen o que usan `data/`.
3. **Cliente.** Estado del servidor duplicado fuera de TanStack Query;
   optimista o rollback incompletos; uso de APIs legacy de dnd-kit;
   `mutationKey` y queryKeys según el contrato.
4. **Alcance, regresiones y documentación.** Regresiones de auth y
   multi-tenancy de la Sesión 1; dependencias o abstracciones innecesarias;
   `AGENTS.md` y `.cursor/rules/` describen el árbol actual y siguen breves.

## Entrega

Una línea por problema real, del más grave al menos grave:
`severidad (alta/media/baja) | ruta:línea | problema | escenario | corrección mínima`.
Añade los checks y pruebas con su resultado real, los hallazgos descartados
con motivo y lo que siga pendiente. Si no hay problemas reales, dilo.
Grok, como único ejecutor, corrige los problemas confirmados y repite los
checks afectados, sin pausa de aprobación. Distingue la evidencia local,
CodeRabbit y la aceptación manual del profesor. No hagas commit.
