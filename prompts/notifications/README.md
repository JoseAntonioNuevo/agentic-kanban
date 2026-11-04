# Sesión 4 (S12) — deploy primero, después comentarios, menciones y email real

Miércoles 4 de noviembre de 2026, 18:30–20:00. Partimos de la clase 3 aceptada:
board sincronizado por WebSocket y avisos entre navegadores. Publicamos esa app
en `https://thepower-kanban.josenuevo.dev` y, sobre ella, añadimos
comentarios, menciones, notificaciones privadas y emails reales con Cloudflare
Email Service.

## Por qué este orden

| Paso | Qué                      | Dónde se ve           | Motivo del orden                                                                                                                               |
| ---- | ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 01   | Deploy en Cloudflare     | URL pública           | El riesgo de infraestructura (cuenta, dominio, imagen, `wss://`) sale al principio, y el aprovisionamiento lento del primer deploy queda hecho |
| 02   | Comentarios: datos y API | Local                 | Base de todo lo demás: tablas, migración y autorización                                                                                        |
| 03   | Hilo en el diálogo       | Local                 | Usa la API del 02                                                                                                                              |
| 04   | Menciones y outbox       | Local, sin red        | Crea las notificaciones que necesita la campana; dominio puro y testeable                                                                      |
| 05   | Campana en tiempo real   | Local                 | Lee las notificaciones del 04 y reutiliza el WebSocket de la clase 3                                                                           |
| 06   | Email real y redeploy    | URL pública + bandeja | Todo lo que depende de Cloudflare en vivo se ve junto, con un solo redeploy                                                                    |
| 07   | Revisión como una PR     | Local + URL pública   | Sesión nueva, sin el contexto de quien implementó                                                                                              |

Solo hay dos deploys: el inicial (01) y el final (06). Del 02 al 05 se trabaja
en local sin credenciales de Cloudflare: el email queda en `data/outbox.jsonl`
y no hay que recrear contenedores a mitad de clase.

## Cómo se ejecuta

Todo en **Claude Code con Opus 5.5** (esfuerzo alto), sin Plan previo. Opus es
el único ejecutor: inspecciona, implementa, prueba, revisa y corrige. No crea
`Task`, workers ni subagentes. Cada prompt es autosuficiente: trae sus
contratos, requisitos y aceptación, y el código del paso anterior es el punto
de partida del siguiente (`CLAUDE.md` apunta a `AGENTS.md`). Lee también
[la guía común](../CURSOR.md) para preparación, comprobaciones y CodeRabbit. El
preflight de delegación no corresponde a esta clase.

1. Abre **Claude Code** en la raíz del repositorio y comprueba el modelo:
   **Opus 5.5** (`/model`, esfuerzo alto).
2. En una sesión nueva, pega el arranque con [01](01-deploy-cloudflare.md).
3. Ejecuta 02–06 en la misma sesión, uno cada vez, con el mensaje de
   continuación. No pidas un «adelante» entre pasos: el paso termina con su
   informe y tú validas la aceptación manual antes de lanzar el siguiente.
4. Abre una sesión nueva para el [07](07-review.md): revisar sin el contexto de
   quien implementó se parece más a una PR. Si antes la sesión se hace pesada,
   usa `/clear` y arranca con el prompt actual; los prompts no dependen de la
   conversación.

Arranque (primer mensaje de cada sesión, cambiando el archivo del paso):

```text
Ejecuta el paso actual de la sesión 4: lee
prompts/notifications/01-deploy-cloudflare.md, AGENTS.md, prompts/CURSOR.md,
prompts/notifications/README.md, las reglas de .cursor/rules/ de las capas que
toca y el código real. Completa solo ese paso y sus correcciones, sin pedir
adelante. Eres el único ejecutor: no uses Task ni subagentes. Los contratos
del prompt son fijos; adapta los detalles locales al código y, si un contrato
choca con el código, explica el conflicto antes de cambiarlo. No hagas commit
ni implementes pasos futuros. No muestres secretos. Devuelve evidencia real y
la aceptación manual pendiente.
```

Continuación (02–06, en la misma sesión, cambiando el archivo del paso):

```text
Siguiente paso de la sesión 4: lee prompts/notifications/02-comments.md.
Mismas reglas que antes; parte del código actual, no de lo que recuerdes del
paso anterior.
```

## Horario de la clase

| Hora        | Min | Bloque                                           | Qué validar antes de avanzar                                         |
| ----------- | --- | ------------------------------------------------ | -------------------------------------------------------------------- |
| 18:30–18:38 | 8   | Presentación y punto de partida                  | Board y WebSocket de la clase 3 en local; Ana y Luis abiertos        |
| 18:38–18:52 | 14  | [01 · Deploy](01-deploy-cloudflare.md)           | Health, login, 404 y `wss://` en la URL pública; Luis ve mover a Ana |
| 18:52–19:03 | 11  | [02 · Comentarios](02-comments.md)               | Migración con cascada; 201/200; 400/401/404 y fechas serializadas    |
| 19:03–19:12 | 9   | [03 · Hilo](03-ui.md)                            | Hilo solo en editar; Comentar separado de Guardar                    |
| 19:12–19:24 | 12  | [04 · Menciones y outbox](04-mentions-outbox.md) | Solo destinatarios válidos; línea en `data/outbox.jsonl`; atómico    |
| 19:24–19:37 | 13  | [05 · Campana](05-bell-realtime.md)              | Luis recibe hilo, toast y campana; Ana ve vacío válido; una conexión |
| 19:37–19:47 | 10  | [06 · Email real](06-email-cloudflare.md)        | Redeploy; demo completa en la URL pública y email en la bandeja      |
| 19:47–19:55 | 8   | [07 · Revisión](07-review.md)                    | Evidencia local y pública, hallazgos confirmados y corregidos        |
| 19:55–20:00 | 5   | Cierre, QR y preguntas                           | —                                                                    |

Los minutos de cada paso incluyen la ejecución de Opus y tu aceptación manual.
Mientras Opus trabaja, explica el contrato del paso; en el 01, mientras
Cloudflare aprovisiona, explica la arquitectura Worker → Container y por qué
hay una sola instancia `"main"`. Si vas tarde:

- Si el 01 se atasca por la cuenta o el dominio más de 5 minutos, déjalo
  anotado y sigue con el 02 en local: el 06 vuelve a desplegar.
- El 07 empieza como muy tarde a las 19:48. Desde ese momento solo se ejecutan
  los checks y las pruebas y se corrigen los hallazgos de severidad alta; el
  resto queda documentado como pendiente.
- CodeRabbit va después de la clase, salvo que sobre tiempo en el 07.
- El cierre empieza a las 19:55 aunque el 07 no haya terminado: lo que falte
  se declara pendiente, no pasado.

## Antes de las 18:30

El deploy y el envío real dependen de la cuenta del profesor. Déjalo listo
antes del directo; ninguno de estos pasos de cuenta los hace el agente:

1. Plan **Workers Paid** activo en la cuenta: Containers lo exige.
2. La zona `josenuevo.dev` activa en esa misma cuenta (el 01 crea el custom
   domain `thepower-kanban.josenuevo.dev`).
3. Un dominio incorporado en **Email Service → Email Sending** (registros SPF,
   DKIM y DMARC). `MAIL_FROM` es una dirección de ese dominio.
4. Un token de API con el permiso **Email Sending: Edit**
   (`CLOUDFLARE_EMAIL_TOKEN`) y el ID de la cuenta (`CLOUDFLARE_ACCOUNT_ID`).
   No lo llames `CLOUDFLARE_API_TOKEN`: wrangler lo usaría para desplegar.
5. Bandeja para la demo (`MAIL_REDIRECT_TO=jose@josenuevo.dev`): los usuarios
   de demo usan `@demo.test` y no reciben correo.
6. `.env.cloudflare.local` en la raíz (Git lo ignora) con
   `BETTER_AUTH_SECRET` (nuevo y largo),
   `BETTER_AUTH_URL=https://thepower-kanban.josenuevo.dev`,
   `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_EMAIL_TOKEN`, `MAIL_FROM` y
   `MAIL_REDIRECT_TO=jose@josenuevo.dev`. El `.env` local **no** necesita las
   de correo: en local el email va al outbox.
7. En la terminal donde vas a lanzar Claude Code, `bunx wrangler login` y
   después `bunx wrangler whoami`: debe mostrar la cuenta del curso. Docker
   Desktop arrancado.
8. Permisos de Claude Code: acepta (o deja permitidos) `vp`, `bun`, `bunx
   wrangler`, `docker compose`, `curl` y `git status`/`git diff`. No uses
   `--dangerously-skip-permissions`.
9. Stack local arriba con `docker compose up --build -d`, health `ok` por
   `http://localhost:5173/api/health` y el checkpoint de la clase 3
   verificado.
10. Guarda el SHA completo de `git rev-parse HEAD` como `BASE_CLASE`, junto
    con `git status --short`.
11. Dos sesiones independientes de navegador (Ana y Luis), en local y en la
    URL pública. Usa solo las cuentas ficticias; nunca pegues tokens en el
    chat.
12. Recomendado: ensaya el 01 la víspera en una copia y despliega. Así el
    certificado del dominio y el primer aprovisionamiento ya existen y en
    clase el deploy es una actualización rápida.

## Pruebas HTTP de comentarios y notificaciones

Por el proxy local (`http://localhost:5173`) o contra producción con
`BASE=https://thepower-kanban.josenuevo.dev`. Cada usuario tiene su cookie jar
temporal:

```bash
base="${BASE:-http://localhost:5173}"
jar_ana=$(mktemp); jar_luis=$(mktemp)
login() {
  curl -s -o /dev/null -c "$1" -H 'content-type: application/json' -H "origin: $base" \
    -d "{\"email\":\"$2\",\"password\":\"Demo1234!\"}" "$base/api/auth/sign-in/email"
}
login "$jar_ana" ana@demo.test
login "$jar_luis" luis@demo.test
curl -s -o /dev/null -w 'comentarios sin cookie: %{http_code}\n' "$base/api/tasks/task_kanban_1/comments"
curl -s -o /dev/null -w 'Luis lee comentarios privados de Ana: %{http_code}\n' -b "$jar_luis" "$base/api/tasks/task_ana_1/comments"
curl -s -o /dev/null -w 'Ana comenta @Luis en compartido: %{http_code}\n' -b "$jar_ana" \
  -H 'content-type: application/json' -d '{"body":"@Luis mira esto"}' "$base/api/tasks/task_kanban_1/comments"
curl -s -w '\nnotificaciones de Luis: %{http_code}\n' -b "$jar_luis" "$base/api/notifications"
curl -s -w '\nnotificaciones de Ana: %{http_code}\n' -b "$jar_ana" "$base/api/notifications"
rm -f "$jar_ana" "$jar_luis"
```

Esperado tras el 02: 401, 404 y 201 en las tres primeras. Tras el 05: además,
200 con al menos una notificación para Luis y 200 con `[]` para Ana. En
producción, todo esto vale desde el redeploy del 06.

## Probar la URL pública y el canal `wss://`

Desde el 01: comprueba `GET /api/health`, el 404 de Luis en `proj_ana_notes` y
que el WebSocket público sigue abierto a los 25 s a través del Worker y el
Container. El primer deploy puede tardar unos minutos en responder:

```bash
PUBLIC_URL="${PUBLIC_URL:-https://thepower-kanban.josenuevo.dev}" bun -e '
const base = process.env.PUBLIC_URL!;
const wsBase = base.replace(/^http/, "ws");
const health = await fetch(`${base}/api/health`).then((r) => r.json());
console.log("health:", health);
const login = await fetch(`${base}/api/auth/sign-in/email`, {
  method: "POST",
  headers: { "content-type": "application/json", origin: base },
  body: JSON.stringify({ email: "luis@demo.test", password: "Demo1234!" }),
});
const cookie = login.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
const privateBoard = await fetch(`${base}/api/projects/proj_ana_notes/board`, {
  headers: { Cookie: cookie },
});
console.log("Luis en proj_ana_notes:", privateBoard.status);
const ws = new WebSocket(`${wsBase}/api/projects/proj_agentic_kanban/events`, {
  headers: { Cookie: cookie },
});
ws.onopen = () => console.log("wss abierto");
ws.onmessage = (event) => console.log(event.data);
ws.onclose = (event) => console.log("wss cerrado", event.code);
setTimeout(() => {
  console.log("wss abierto a los 25 s:", ws.readyState === WebSocket.OPEN);
  ws.close();
}, 25_000);
'
```

## Aceptación manual y revisión

En local (02–05) el email va siempre al outbox (`data/outbox.jsonl`; en tests,
`OUTBOX_PATH`). En producción (06) la API lo envía con la API REST de
Cloudflare Email Service, sin SMTP ni SDK, redirigido a `MAIL_REDIRECT_TO`
(`jose@josenuevo.dev`). El disco del contenedor es efímero: cada arranque
vuelve al seed. El reset local se documenta, no se ejecuta.

La demo final se hace con dos navegadores en la URL pública: Ana comenta
`@Luis mira esto` en `proj_agentic_kanban` (pulsando **Comentar**, no
Guardar); Luis recibe hilo actualizado, toast y campana con badge; la campana
de Ana dice «No hay menciones.». El email de la mención llega a
`jose@josenuevo.dev`. Luis sigue sin acceder a `proj_ana_notes`, a sus
comentarios ni a su canal de eventos. Marcar una notificación como leída solo
puede hacerlo su destinatario.

En el 07, la transacción comentario + notificaciones, la privacidad de
destinatarios, los secretos y el deploy pueden justificar CodeRabbit si no
están ya cubiertos. Opus consolida la evidencia, ejecuta esa revisión solo
cuando aporte valor, contrasta sus hallazgos y corrige lo confirmado sin otra
aprobación. Aplica la [base y cobertura comunes](../CURSOR.md#coderabbit-cuando-aporte-valor).
