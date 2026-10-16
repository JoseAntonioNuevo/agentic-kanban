# Sesión 3 · 06 — Revisión como una PR

Tiempo en clase: ~7–12 min. Es una revisión: no modifiques código hasta que
apruebe el plan de corrección.

## Alcance

Todo lo implementado en la Sesión 3 (prompts 01–05) y las regresiones sobre
las Sesiones 1 y 2, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios
prompts. No añadas funcionalidades.

## Cómo trabajar

Usa los subagentes de `.claude/agents/`. Lanza en paralelo:

- `kanban-verifier` (Haiku): `vp check`, `vp test` y estas pruebas por
  `http://localhost:5173`: stream sin cookie → 401; Luis en
  `/api/projects/proj_ana_notes/events` → 404; Ana en
  `/api/projects/proj_agentic_kanban/events` sigue abierta más de 10 s; una
  tarea creada por Ana aparece en el stream de Luis; Luis
  `GET /api/projects/proj_ana_notes/board` → 404 (regresión).
- Cuatro `kanban-reviewer` (Sonnet), uno por dimensión, con la lista de abajo.

Después, tú (Opus) compruebas cada hallazgo en el código. Descarta lo que no
se sostenga con `ruta:línea` y un escenario concreto, y consolida.

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
Añade el resultado del verificador. Si no hay problemas reales, dilo. Después
propón el plan mínimo de corrección y espera mi aprobación. Si lo apruebo, aplica tú las correcciones y vuelve a pasar `kanban-verifier`
(Haiku).
