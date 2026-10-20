# Sesión 3 · 05 — Toasts para los cambios de otros

## Punto de partida

`useBoardEvents` aplica los eventos a la caché y ya distingue los eventos
propios (04). `sonner` está montado en `main.tsx` (`<Toaster />`).

## Objetivo

Un aviso in-app cuando otro usuario cambia el tablero que tengo abierto.

## Requisitos

| Evento         | Texto                                                      |
| -------------- | ---------------------------------------------------------- |
| `task.created` | `Nueva tarea: {title}`                                     |
| `task.updated` | `Tarea actualizada: {title}`                               |
| `task.deleted` | `Tarea eliminada: {title}`, o `Tarea eliminada` sin título |
| `task.moved`   | `Tarea movida: {title}`, o `Tarea movida` sin título       |

- `toast.info` de `sonner`, solo si `actorUserId` es distinto del usuario de la
  sesión. Se decide en el mismo sitio donde `useBoardEvents` ya reconoce los
  eventos propios.
- El título sale del evento (`created` y `updated`) o de la caché del board
  antes de aplicar el evento (`deleted` y `moved`).
- Extrae el texto a una función pura (`boardEventToastMessage(event, title?)`)
  con tests.
- Sin tabla, campana, historial ni email: el toast se pierde al cerrar.

## Fuera de alcance

Presencia, comentarios y menciones.

## Cómo trabajar

**Cursor: Agent con Opus 5.5 orquestando de forma autónoma; Grok 4.7 xhigh
Fast ejecuta.** Lee `AGENTS.md`, `prompts/CURSOR.md`,
`prompts/websockets/README.md`, las reglas implicadas y el código. Usa
`kanban-grok-worker` y pasa `model: "grok-4.7-xhigh-fast"` explícito en cada
nueva Task si está en el catálogo; aplica el protocolo común si cambia.
No uses omisión, `inherit`, Claude, agentes históricos ni subagentes integrados.

Este prompt autoriza el paso y sus correcciones locales. Opus coordina,
fija contratos y revisa; Grok inspecciona, implementa, prueba y actualiza el
estado documentado. Continúa sin «adelante» ni aprobación rutinaria del plan.
No hagas commit, no escribas tú la app ni implementes pasos siguientes.

1. **Inspección (Grok).** Confirma dónde `useBoardEvents` reconoce al autor y cómo
   está montado `sonner`.
2. **Contratos y reparto (Opus); implementación (Grok).** Textos y regla de cuándo no mostrar toast. Un worker puede implementar
   función pura, tests, integración y documentación de «Al terminar».
3. **Comprobaciones y revisión.** Grok pasa `vp check`, `vp test` y «Hecho cuando». Opus revisa que solo el
   otro usuario recibe el aviso y que borrar/mover conserva un título útil.
4. **Correcciones (Grok).** Opus contrasta diff y evidencia y encarga los
   arreglos confirmados; espera los resultados y repite los checks afectados.
   La puerta general se ejecuta sobre integración estable. CodeRabbit solo
   ante una duda importante que aporte valor, conservando alcance y cobertura;
   no se exige una pasada al terminar cada prompt.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta → Luis ve
      «Tarea movida: …»; Ana no ve toast de su propio movimiento.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
