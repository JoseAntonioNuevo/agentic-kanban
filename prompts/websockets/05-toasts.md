# Sesión 3 · 05 — Toasts para los cambios de otros

## Punto de partida

`useBoardEvents` aplica los eventos a la caché y ya distingue los eventos
propios (04). `sonner` está montado en `main.tsx` (`<Toaster />`).

## Objetivo

Un aviso in-app cuando otro usuario cambia el tablero que tengo abierto.

## Contrato que fijas aquí

`boardEventToastMessage(event, title?)`: función pura con tests que devuelve el
texto del aviso.

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
- Sin tabla, campana, historial ni email: el toast se pierde al cerrar.
- `AGENTS.md` describe los toasts de cambios ajenos.

## Fuera de alcance

Presencia, comentarios y menciones.

## Cómo trabajar

1. **Inspeccionar.** Confirma dónde `useBoardEvents` reconoce al autor, cómo
   está montado `sonner` y la firma instalada de `toast.info`.
2. **Implementar.** Textos y regla de cuándo no mostrar toast del plan.
   Implementa la función pura, sus tests, la integración en el hook y la
   documentación.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa que solo el otro
   usuario recibe el aviso y que borrar o mover conserva un título útil.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta → Luis ve
      «Tarea movida: …»; Ana no ve toast de su propio movimiento.
