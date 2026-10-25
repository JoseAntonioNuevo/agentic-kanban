# Sesión 2 · 08 — Revisión como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades.

## Alcance

Todo lo implementado en la Sesión 2 (prompts 01–07) y las regresiones sobre la
Sesión 1, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios prompts.
No añadas funcionalidades.

## Cómo trabajar

1. **Comprobar.** Ejecuta `vp check`, `vp test` y estas pruebas por
   `http://localhost:5173`: Ana `GET /api/projects/proj_agentic_kanban/board` →
   200; Luis `GET /api/projects/proj_ana_notes/board` → 404; Ana mueve
   `task_kanban_1` a `col_ana_todo` → 404; sin cookie → 401; Luis
   `GET /api/projects/proj_ana_notes` → 404 (regresión de la Sesión 1).
2. **Contrastar.** Revisa las dimensiones de abajo y confirma cada hallazgo en
   el código con `ruta:línea` y un escenario concreto.
3. **Corregir y verificar.** Corrige los problemas confirmados y repite los
   checks afectados.

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
