# Sesión 3 · 05 — Reconexión y avisos in-app

## Punto de partida

`useBoardEvents(projectId, userId, enabled)` abre un WebSocket por tablero,
invalida el board al abrir, aplica los eventos a la caché y ya distingue los
eventos propios (04). Si el socket se cierra, no vuelve a abrirse. `sonner`
está montado en `main.tsx` (`<Toaster />`).

## Objetivo

Que el canal se recupere solo tras un corte y que cada usuario reciba un aviso
in-app cuando otro cambia el tablero que tiene abierto.

## Contratos que fijas aquí

Funciones puras con tests, junto al hook o en `apps/web/src/lib/`:

- `reconnectDelay(attempt)` devuelve la espera en milisegundos antes de cada
  reintento: `0 → 1000`, `1 → 2000`, `2 → 5000` y `10000` a partir de `3`.
- `boardEventToastMessage(event, title?)` devuelve el texto del aviso.

## Requisitos

- Reconexión:
  - El `WebSocket` del navegador no reconecta solo. Si se cierra sin que lo
    pida el hook, programa otro con `reconnectDelay(attempt)` e incrementa
    `attempt`. Un `onopen` correcto lo vuelve a `0`.
  - La invalidación del 04 al abrir recupera lo que se perdió durante el
    corte: no añadas otra.
  - Los 401 y 404 nunca llegan a reintentarse en bucle: sin board cargado, o
    con `BoardNotFoundError`, `enabled` es falso y el hook no abre ni
    reintenta.
- Cierre intencionado:
  - Al desmontar, al cambiar de project o con `enabled` falso, el cleanup
    marca el cierre como intencionado, cancela el reintento pendiente y
    cierra el socket.
  - Esa marca es una variable local de cada ejecución del efecto, no un
    `useRef` compartido. Así, con el doble montaje de `StrictMode`, el cierre
    del primer socket no programa un reintento ni pisa al segundo.
  - Tras el cleanup no puede quedar ningún `setTimeout` ni socket vivo.
- Avisos:

  | Evento         | Texto                                                      |
  | -------------- | ---------------------------------------------------------- |
  | `task.created` | `Nueva tarea: {title}`                                     |
  | `task.updated` | `Tarea actualizada: {title}`                               |
  | `task.deleted` | `Tarea eliminada: {title}`, o `Tarea eliminada` sin título |
  | `task.moved`   | `Tarea movida: {title}`, o `Tarea movida` sin título       |
  - `toast.info` de `sonner`, solo si `actorUserId` es distinto del usuario
    de la sesión. Se decide en el mismo sitio donde `useBoardEvents` ya
    reconoce los eventos propios. Otra pestaña del mismo usuario aplica el
    cambio, pero no muestra aviso.
  - El título sale del evento (`created` y `updated`) o de la caché del board
    leída con `getQueryData` antes de aplicar el evento (`deleted` y `moved`).
  - El toast se lanza en el manejador del mensaje, nunca dentro del updater
    de `setQueryData`, que debe seguir siendo puro.

- Sin tabla, campana, historial ni email: el toast se pierde al cerrar. Sin
  librerías de reconexión.
- Mientras `api` está caído, Vite registra errores del proxy WebSocket
  (`ECONNREFUSED`): es esperado y desaparece al reconectar.
- Tests de `reconnectDelay` (cada valor y el tope) y de
  `boardEventToastMessage` (cada tipo, con y sin título).
- `AGENTS.md` y `.cursor/rules/web.mdc` describen la reconexión y los toasts
  de cambios ajenos.

## Fuera de alcance

Presencia, comentarios y menciones.

## Cómo trabajar

1. **Inspeccionar.** Confirma cómo `useBoardEvents` abre, cierra y reconoce al
   autor, cómo está montado `sonner` y la firma instalada de `toast.info`.
2. **Implementar.** Las dos funciones puras y sus tests, su integración en el
   hook y la documentación.
3. **Comprobar.** Ejecuta `vp check` y `vp test`. Revisa que no hay reintentos
   tras desmontar ni con `enabled` falso, que solo el otro usuario recibe el
   aviso y que borrar o mover conserva un título útil.

## Hecho cuando

- [ ] `vp check` y `vp test` en verde.
- [ ] Dos navegadores (lo compruebo yo): Ana mueve una tarjeta y Luis ve
      «Tarea movida: …»; Ana no ve toast de su propio movimiento.
- [ ] Reconexión (lo compruebo yo): con los dos tableros abiertos, ejecuta
      `docker compose restart api`. En DevTools → WS de Luis aparece una
      conexión nueva al volver la API; entonces Ana mueve una tarjeta y Luis
      la ve sin refrescar.
- [ ] Tras pulsar «Volver» en Luis no aparecen conexiones nuevas en WS.
