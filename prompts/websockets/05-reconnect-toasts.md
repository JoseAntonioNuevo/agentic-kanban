# Sesión 3 · 05 — Reconexión y avisos in-app

## Punto de partida

`useBoardEvents` abre un WebSocket por tablero, aplica los eventos a la caché
y ya distingue los eventos propios (04). Si el socket se cierra, no vuelve a
abrirse. `sonner` está montado en `main.tsx` (`<Toaster />`).

## Objetivo

Que el canal se recupere solo tras un corte y que cada usuario reciba un aviso
in-app cuando otro cambia el tablero que tiene abierto.

## Contratos que fijas aquí

- `reconnectDelay(attempt)`: función pura con tests que devuelve la espera
  antes de cada reintento.
- `boardEventToastMessage(event, title?)`: función pura con tests que devuelve
  el texto del aviso.

## Requisitos

- Reconexión: el `WebSocket` del navegador no reconecta solo. Si se cierra sin
  que lo pida el hook, reintenta con una espera creciente (por ejemplo 1 s,
  2 s, 5 s y como mucho 10 s) según `reconnectDelay`. Al volver a conectar,
  invalida la query del board: el hub vive en memoria y no repite lo que se
  perdió durante el corte.
- Al desmontar o cambiar de project, marca el cierre como intencionado,
  cancela el reintento pendiente y cierra el socket. El doble montaje de
  `StrictMode` en desarrollo no debe dejar conexiones ni reintentos colgados.
- Avisos:

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
- Sin tabla, campana, historial ni email: el toast se pierde al cerrar. Sin
  librerías de reconexión.
- `AGENTS.md` y `.cursor/rules/web.mdc` describen la reconexión y los toasts
  de cambios ajenos.

## Fuera de alcance

Presencia, comentarios y menciones.

## Cómo trabajar

1. **Inspeccionar.** Confirma cómo `useBoardEvents` abre, cierra y reconoce al
   autor, cómo está montado `sonner` y la firma instalada de `toast.info`.
2. **Implementar.** Reconexión, textos y regla de cuándo no mostrar toast del
   plan. Implementa las dos funciones puras y sus tests, su integración en el
   hook y la documentación.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa que no hay reintentos
   tras desmontar, que solo el otro usuario recibe el aviso y que borrar o
   mover conserva un título útil.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta → Luis ve
      «Tarea movida: …»; Ana no ve toast de su propio movimiento.
- [ ] Reconexión (lo compruebo yo): con los dos tableros abiertos,
      `docker compose restart api`; cuando vuelve, Ana mueve una tarjeta y
      Luis la ve sin refrescar.
