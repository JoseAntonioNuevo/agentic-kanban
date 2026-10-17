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

Sigue los cinco pasos de `AGENTS.md`. Tú planificas y, al final, corriges. Hasta el «adelante» no se editan ficheros. No hagas commit.

En este paso:

- **Investigar.** `kanban-recon`: dónde `useBoardEvents` reconoce los eventos propios y cómo está montado `sonner`.
- **Planificar.** Tú, y espera mi «adelante»: textos y cuándo no hay toast.
- **Implementar.** `kanban-implementer`: uno solo: toasts, función pura con tests y documentación de «Al terminar».
- **Verificar.** `kanban-verifier`: puerta de calidad.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta → Luis ve
      «Tarea movida: …»; Ana no ve toast de su propio movimiento.

## Al terminar

El implementador que cierra el paso actualiza `AGENTS.md`. No hagas commit. Cierra con el resumen que pide
`AGENTS.md`.
