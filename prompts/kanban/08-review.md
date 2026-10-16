# Sesión 2 · 08 — Revisión como una PR

Tiempo en clase: ~5–10 min. Es una revisión: no modifiques código hasta que
apruebe el plan de corrección.

## Alcance

Todo lo implementado en la Sesión 2 (prompts 01–07) y las regresiones sobre la
Sesión 1, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios prompts.
No añadas funcionalidades.

## Cómo trabajar

Usa los subagentes de `.claude/agents/`. Lanza en paralelo:

- `kanban-verifier` (Haiku): `vp check`, `vp test` y estas pruebas por
  `http://localhost:5173`: Ana `GET /api/projects/proj_agentic_kanban/board` →
  200; Luis `GET /api/projects/proj_ana_notes/board` → 404; Ana mueve
  `task_kanban_1` a `col_ana_todo` → 404; sin cookie → 401; Luis
  `GET /api/projects/proj_ana_notes` → 404 (regresión de la Sesión 1).
- Cuatro `kanban-reviewer` (Sonnet), uno por dimensión, con la lista de abajo.

Después, tú (Opus) compruebas cada hallazgo en el código. Descarta lo que no
se sostenga con `ruta:línea` y un escenario concreto, y consolida.

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
Añade el resultado del verificador. Si no hay problemas reales, dilo. Después
propón el plan mínimo de corrección y espera mi aprobación.
