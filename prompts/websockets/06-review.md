# Sesión 3 · 06 — Revisión como una PR

Esta revisión incluye corregir y verificar los problemas confirmados dentro
del alcance, sin otra aprobación. No añadas funcionalidades.

## Alcance

Todo lo implementado en la Sesión 3 (prompts 01–05) y las regresiones sobre
las Sesiones 1 y 2, contrastado con `AGENTS.md`, `.cursor/rules/` y los propios
prompts. No añadas funcionalidades.

## Cómo trabajar

1. **Comprobar.** Ejecuta `vp check`, `vp test` y estas pruebas por
   `http://localhost:5173`: stream sin cookie → 401; Luis en
   `/api/projects/proj_ana_notes/events` → 404; Ana en
   `/api/projects/proj_agentic_kanban/events` sigue abierta más de 10 s; una
   tarea creada por Ana aparece en el stream de Luis; Luis
   `GET /api/projects/proj_ana_notes/board` → 404 (regresión de la Sesión 2).
2. **Contrastar.** Revisa las dimensiones de abajo y confirma cada hallazgo en
   el código con `ruta:línea` y un escenario concreto.
3. **Corregir y verificar.** Corrige los problemas confirmados y repite los
   checks afectados.

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
