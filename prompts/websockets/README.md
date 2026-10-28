# Sesión 3 (S11) — tiempo real con WebSocket, seis pasos con Opus

Miércoles 28 de octubre de 2026, 18:30–20:00. Partimos de la clase 2 aceptada:
board, CRUD, movimiento persistido y rollback. Añadimos avisos por
**WebSocket** y sincronización entre navegadores, como pide el temario
(«Tiempo real con Websockets»). Las escrituras siguen por HTTP: el WebSocket
solo anuncia. Nada de comentarios, menciones ni campana todavía.

## Cómo se ejecuta

Todo en **Agent con Opus 5.5** (esfuerzo alto), sin Plan previo. Opus es el
único ejecutor: inspecciona, implementa, prueba, revisa y corrige. No crea
`Task`, workers ni subagentes. Cada prompt es autosuficiente: trae sus
contratos, requisitos y aceptación, y el código del paso anterior es el punto
de partida del siguiente. Lee también [la guía común](../CURSOR.md) para
preparación, comprobaciones y CodeRabbit. El preflight de delegación no
corresponde a esta clase.

1. Comprueba los selectores: **Agent** y **Opus 5.5**.
2. Abre un chat nuevo, pega el arranque y adjunta [01](01-events.md).
3. Ejecuta 02–05 en el mismo chat, uno cada vez, con el mensaje de
   continuación. No pidas un «adelante» entre pasos: el paso termina con su
   informe y tú validas la aceptación manual antes de lanzar el siguiente.
4. Abre un chat nuevo para el [06](06-review.md): revisar sin el contexto de
   quien implementó se parece más a una PR. Si antes el chat se hace pesado,
   abre otro con el arranque y el prompt actual; los prompts no dependen de la
   conversación.

Arranque (primer mensaje de cada chat):

```text
Ejecuta en Agent. Adjunto el prompt del paso actual de la sesión 3. Lee
AGENTS.md, prompts/CURSOR.md, prompts/websockets/README.md, las reglas de las
capas que toca y el código real. Completa solo ese paso y sus correcciones,
sin pedir adelante. Eres el único ejecutor: no uses Task ni subagentes. Los
contratos del prompt son fijos; adapta los detalles locales al código y, si un
contrato choca con el código, explica el conflicto antes de cambiarlo. No
hagas commit ni implementes pasos futuros. Devuelve evidencia real y la
aceptación manual pendiente.
```

Continuación (02–05, en el mismo chat):

```text
Siguiente paso de la sesión 3: adjunto el prompt. Mismas reglas que antes;
parte del código actual, no de lo que recuerdes del paso anterior.
```

## Horario de la clase

| Hora        | Min | Bloque                                             | Qué validar antes de avanzar                                |
| ----------- | --- | -------------------------------------------------- | ----------------------------------------------------------- |
| 18:30–18:40 | 10  | Presentación y punto de partida                    | Board de la clase 2 en marcha; Ana y Luis abiertos          |
| 18:40–18:46 | 6   | [01 · Eventos](01-events.md)                       | Cuatro variantes válidas; eventos inválidos rechazados      |
| 18:46–19:02 | 16  | [02 · Canal](02-websocket.md)                      | 401/404/426 por `:5173` y WebSocket abierto a los 25 s      |
| 19:02–19:12 | 10  | [03 · Publicación](03-publish.md)                  | Ana crea una tarea y el canal de Luis recibe `task.created` |
| 19:12–19:27 | 15  | [04 · Cliente](04-client.md)                       | Dos navegadores sincronizados, sin duplicados ni saltos     |
| 19:27–19:41 | 14  | [05 · Reconexión y avisos](05-reconnect-toasts.md) | Reconecta tras reiniciar `api`; solo el otro ve el aviso    |
| 19:41–19:53 | 12  | [06 · Revisión](06-review.md)                      | Pruebas conjuntas, hallazgos confirmados y corregidos       |
| 19:53–20:00 | 7   | Cierre, QR y preguntas                             | —                                                           |

Los minutos de cada paso incluyen la ejecución de Opus y tu aceptación
manual; mientras Opus trabaja, explica el contrato del paso. Si vas tarde:

- El 06 empieza como muy tarde a las 19:45. Desde ese momento solo se
  ejecutan los checks y las pruebas y se corrigen los hallazgos de severidad
  alta; el resto queda documentado como pendiente.
- CodeRabbit va después de la clase, salvo que sobre tiempo en el 06.
- El cierre empieza a las 19:53 aunque el 06 no haya terminado: lo que falte
  se declara pendiente, no pasado.

## Antes de las 18:30

- Stack arriba con `docker compose up --build -d`, health `ok` por
  `http://localhost:5173/api/health` y los datos del seed de la clase 2.
- Comprueba board, movimiento y el 404 de Luis a `proj_ana_notes` con las
  pruebas HTTP de abajo.
- Guarda el SHA completo de `git rev-parse HEAD` como `BASE_CLASE`, junto con
  `git status --short`.
- Abre dos sesiones independientes (dos perfiles, o una ventana normal y otra
  privada): Ana y Luis en `proj_agentic_kanban`. Dos pestañas que comparten
  cookie no son dos usuarios.
- Deja preparados en una terminal los dos scripts de esta guía y DevTools →
  Network → filtro **WS** en el navegador de Luis.

## Pruebas HTTP del canal

Peticiones `GET` normales por el proxy: sin cabecera `Upgrade`, la ruta del
canal responde como HTTP. Cada usuario tiene su cookie jar temporal:

```bash
base=http://localhost:5173
jar_ana=$(mktemp); jar_luis=$(mktemp)
login() {
  curl -s -o /dev/null -c "$1" -H 'content-type: application/json' -H "origin: $base" \
    -d "{\"email\":\"$2\",\"password\":\"Demo1234!\"}" "$base/api/auth/sign-in/email"
}
login "$jar_ana" ana@demo.test
login "$jar_luis" luis@demo.test
curl -s -o /dev/null -w 'canal sin cookie: %{http_code}\n' "$base/api/projects/proj_agentic_kanban/events"
curl -s -o /dev/null -w 'canal de Luis en privado: %{http_code}\n' -b "$jar_luis" "$base/api/projects/proj_ana_notes/events"
curl -s -o /dev/null -w 'canal de Ana sin Upgrade: %{http_code}\n' -b "$jar_ana" "$base/api/projects/proj_agentic_kanban/events"
curl -s -o /dev/null -w 'board de Luis en privado: %{http_code}\n' -b "$jar_luis" "$base/api/projects/proj_ana_notes/board"
rm -f "$jar_ana" "$jar_luis"
```

Esperado tras el 02: 401, 404, 426 y 404. Antes del 02 las tres primeras dan
404 porque la ruta aún no existe.

## Probar el canal

El `curl` del Mac no habla WebSocket. Este script de Bun inicia sesión por el
proxy, abre el canal con la cookie, imprime cada mensaje y a los 25 s dice si
sigue abierto. Bun corta una petición HTTP inactiva a los 10 s; un WebSocket
abierto a los 25 s demuestra que el canal ya no es una petición HTTP y que el
proxy lo reenvía. Cambia el email para probar como Ana o como Luis:

```bash
bun -e '
const base = "http://localhost:5173";
const login = await fetch(`${base}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({ email: "luis@demo.test", password: "Demo1234!" }),
});
const cookie = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const ws = new WebSocket("ws://localhost:5173/api/projects/proj_agentic_kanban/events", {
  headers: { Cookie: cookie },
});
ws.onopen = () => console.log("abierto");
ws.onmessage = (event) => console.log(event.data);
ws.onclose = (event) => console.log("cerrado", event.code);
setTimeout(() => {
  console.log("abierto a los 25 s:", ws.readyState === WebSocket.OPEN);
  ws.close();
}, 25_000);
'
```

Con `proj_ana_notes` y Luis, el canal no llega a abrirse: el servidor
responde 404 antes del upgrade y el script imprime `cerrado` sin `abierto`.

## Aceptación manual y revisión

Las pruebas pasan por `:5173`: un WebSocket que funciona directo en la API
puede estar roto en el proxy. Las rutas de escritura siguen siendo HTTP
autorizado.

La aceptación manual incluye mover en Ana y observar a Luis sin recargar,
comprobar que Ana no recibe toast propio y reconectar tras
`docker compose restart api` sin perder el estado persistido. No se declara
pasada sin observarla. No añadimos presencia, comentarios ni notificaciones
persistidas.

En el 06, el ciclo de vida del WebSocket, el aislamiento, la publicación tras
persistir y el eco con el optimista pueden justificar CodeRabbit si no están
ya cubiertos. Opus consolida la evidencia, ejecuta esa revisión solo cuando
aporte valor, contrasta sus hallazgos y corrige lo confirmado sin otra
aprobación. Aplica la [base y cobertura comunes](../CURSOR.md#coderabbit-cuando-aporte-valor).

## Contratos para la clase 4

`boardEventSchema`, el hub `subscribe`/`publish`, `applyBoardEvent` y
`useBoardEvents` son dependencias de la clase 4, que añadirá
`comment.created` al mismo canal y desplegará esta misma ruta con `wss://`.
Conserva sus nombres exactos.
