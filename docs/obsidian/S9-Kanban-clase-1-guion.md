---
title: "S9 · Kanban · Clase 1 · Guion del profesor"
date: 2026-10-21
duration: 90 min
tags:
  - thepower
  - desarrollo-agentico
  - kanban
  - guion
---

# S9 · Kanban · Clase 1 — Guion del profesor

**Miércoles 21 de octubre de 2026 · 18:30–20:00 · Hora de Madrid**

> [!abstract] Objetivo de hoy
> Pasar de un starter que comprueba Frontend/API/Database a un SaaS con
> registro, login, sesión, workspaces aislados y dashboard. Ana verá dos
> espacios y Luis uno. El tablero y las tareas empiezan en la clase 2.

> [!info] Cómo usar esta nota en Obsidian
> Mantén abierto el panel **Esquema** para saltar entre bloques. Usa las
> casillas para marcar lo que hayas observado. Los bloques plegables contienen
> comandos y frases de ayuda; puedes dejarlos cerrados durante la explicación.
> Los enlaces a los prompts funcionan conservando la carpeta del repositorio
> dentro de tu vault. Esta nota es un guion: no ejecuta ningún prompt por sí sola.

## Vista rápida del directo

Los tiempos son un objetivo de ensayo, no duraciones medidas de los agentes.
El tiempo de cada bloque incluye explicación, generación y comprobación.

| Hora        | Minutos | Bloque                     | Modelo principal            | Resultado que debes ver                           |
| ----------- | ------- | -------------------------- | --------------------------- | ------------------------------------------------- |
| 18:30–18:38 | 8       | Apertura y starter         | —                           | Objetivo y arquitectura entendidos; health OK     |
| 18:38–18:56 | 18      | 01 · Autenticación         | Opus → Grok                 | Registro, sesión y logout                         |
| 18:56–19:04 | 8       | 02 · Modelo multi-tenant   | Grok directo                | Tablas, relaciones y migración                    |
| 19:04–19:23 | 19      | 03 · Lecturas autorizadas  | Opus → Grok                 | Acceso propio 200, ajeno 404                      |
| 19:23–19:32 | 9       | 04 · Seed                  | Grok directo                | Ana y Luis; seed repetible                        |
| 19:32–19:44 | 12      | 05 · Dashboard             | Grok directo                | Ana ve dos espacios; Luis uno                     |
| 19:44–19:55 | 11      | 06 · Revisión con criterio | Opus; CodeRabbit si procede | Hallazgos contrastados y correcciones verificadas |
| 19:55–20:00 | 5       | Demo, preguntas y cierre   | —                           | Recorrido completo y pendientes explícitos        |

**Cambio de modelo que debes recordar:** Opus en **01, 03 y 06**; Grok en
**02, 04 y 05**. En los pasos orquestados, el subagente implementador también
es Grok; Opus planifica y revisa, y Grok corrige.

## 0. Antes de entrar en directo

Haz esta preparación fuera de los 90 minutos. Repositorio en este Mac:
`/Users/jose/Documents/the-power/kanban`.

### Preparación del entorno

- [ ] Abre **la carpeta `kanban`** en Cursor, no el padre ni LangGraph.
- [ ] Conserva cualquier trabajo pendiente y prepara la rama de clase con el
      starter correcto. No resetees el checkout ni uses automáticamente las
      ramas antiguas `fase1`–`fase4`: pertenecen a otro starter.
- [ ] Ten Docker Desktop iniciado y solo los servicios `web` y `api` de este
      proyecto funcionando. libSQL es un fichero, no un tercer contenedor.
- [ ] Ejecuta los comandos de preparación de abajo y abre la app.
- [ ] Confirma Frontend, API y Database en **OK**.
- [ ] Ensaya Opus 5.5 como principal y el subagente `s1-grok-implementer` con
      una tarea de inspección, comprobando que realmente usa Grok 4.7 Fast.
- [ ] Comprueba la ayuda y el acceso a CodeRabbit antes del directo. No hace
      falta revisar el starter para comprobar que la herramienta está preparada.
- [ ] Ten dos ventanas de navegador preparadas: normal para Ana y privada
      para Luis. Todavía no podrás entrar como ellos hasta el prompt 04.
- [ ] Ensaya los seis prompts y prepara checkpoints recuperables de esta
      versión del starter. Un checkpoint solo es de reserva si lo has validado.

> [!example]- Comandos de preparación — ejecutar antes de la clase
>
> ```bash
> cd /Users/jose/Documents/the-power/kanban
> git status --short --branch
> bun install --frozen-lockfile
> docker compose up --build -d
> docker compose ps
> curl -sS http://localhost:5173/api/health
> vp check
> vp test
> coderabbit review --help
> ```
>
> En health espera `status: "ok"`, `api: "ok"` y `database: "ok"`.
> La web está en `http://localhost:5173`; la API, en `http://localhost:3000`.
> Si el puerto 3000 está ocupado, arranca con
> `API_HOST_PORT=3002 docker compose up --build -d`: la web sigue en 5173.
>
> Si los tests descubren otra copia dentro de `.claude/worktrees/`, declara
> ese alcance inesperado y no modifiques esa copia. Para comprobar este
> checkout: `vp test --exclude '**/.claude/worktrees/**'`. Conserva esta
> distinción en el informe; no presentes el comando general como aprobado.

### Preparación de pantalla y evidencias

- [ ] Abre este guion en Obsidian en una pantalla o zona que puedas consultar.
- [ ] Deja accesibles Cursor, navegador y terminal del proyecto.
- [ ] En Cursor, localiza [la guía de ejecución](../../prompts/auth/README.md)
      y los seis archivos de `prompts/auth/`.
- [ ] Guarda el SHA de `git rev-parse HEAD` **antes de ejecutar el 01**, después
      de preparar el material de clase. Pégalo aquí y consérvalo entre chats.
- [ ] Ten identificados los archivos que forman parte de la sesión; no envíes
      secretos, bases de datos ni cambios ajenos a CodeRabbit.

**BASE_CLASE, SHA completo previo al 01:** `PENDIENTE DE ANOTAR`

**Rama de clase:** `PENDIENTE DE ANOTAR`

**Alcance de tests utilizado:** `PENDIENTE DE ANOTAR`

## 1. Apertura — 18:30–18:38

### Qué decir

> «Durante estas cuatro clases vamos a construir un SaaS de gestión de
> proyectos. Hoy vamos a poner su base: quién eres, a qué espacios perteneces
> y qué datos puedes consultar. Al terminar lo demostraremos con dos usuarios
> que comparten un espacio, pero no todos sus datos.»

> «También vamos a elegir cómo trabajar con los agentes. En cambios que cruzan
> varias capas, Opus planifica y Grok implementa. En tareas cerradas, Grok puede
> resolver el paso completo. Las comprobaciones se mantienen en ambos casos.»

### Qué mostrar y hacer

1. Abre `http://localhost:5173`: muestra la pantalla de estado inicial.
2. Enseña el árbol, solo a este nivel: `apps/web`, `apps/api`, `packages/db` y
   `packages/schemas`.
3. Explica el recorrido de una petición con este esquema:

```text
Navegador: React + TanStack Query
              ↓ /api/health
          Proxy de Vite+
              ↓
          Hono sobre Bun
              ↓
          Drizzle → libSQL local
```

4. Abre brevemente `AGENTS.md`: es el contrato de alcance y tecnologías.
   Las reglas de `.cursor/rules/` aportan el detalle por capa.
5. Muestra `apps/api/src/auth/index.ts` y `packages/db/src/schema/index.ts`:
   auth y tablas siguen pendientes. No hay que fingir que el producto ya existe.

### Conceptos que debes dejar claros

- **Autenticación:** saber quién eres. La resolverá Better Auth.
- **Autorización:** decidir a qué tienes acceso. La comprueba nuestra API.
- **Tenant:** el workspace; no es necesariamente una persona. Una persona
  puede pertenecer a varios espacios y varias personas compartir uno.
- **Contrato compartido:** Zod valida los datos en ejecución; TypeScript
  comprueba tipos durante el desarrollo. Se complementan.

**Pregunta breve al grupo:** «Si dos personas trabajan en la misma empresa,
¿necesitan dos tenants o pueden pertenecer al mismo workspace?»

**Respuesta que buscas:** pueden compartir workspace; la membresía determina
el acceso. El usuario y el tenant son conceptos distintos.

- [ ] El starter funciona y el grupo entiende la meta de la clase.
- [ ] `BASE_CLASE` está guardado antes del primer cambio de implementación.

## 2. Prompt 01 · Autenticación — 18:38–18:56

**Abre:** [01-estructura.md](../../prompts/auth/01-estructura.md).

**Cursor:** chat nuevo, **Opus 5.5**, esfuerzo alto. Pega el archivo completo.
Opus espera tu «adelante» tras el plan; después delega en Grok.

### Para qué sirve este prompt

Conectar Better Auth con la misma base de datos del proyecto y añadir
registro, login, sesión por cookie `httpOnly` y logout. Afecta a DB, API,
contratos y frontend: es el primer ejemplo de orquestación justificada.

### Antes de lanzarlo, di

> «Aquí hay varias piezas que deben encajar: tablas de autenticación, rutas,
> cookies y formularios. Opus va a fijar ese encaje. Grok implementará el plan
> y aportará pruebas de que funciona.»

### Qué haces durante el paso

1. Lee el plan antes de aprobarlo. Debe incluir tablas de auth, rutas
   `/api/auth/*`, cliente web, formularios, migración y comprobaciones.
2. Confirma que el navegador seguirá usando el origen `localhost:5173` y que
   el agente consulta las APIs de la versión instalada.
3. Si el plan respeta el alcance, responde «Adelante con ese plan».
4. Comprueba que la tarjeta del implementador indica Grok; el nombre del
   agente por sí solo no demuestra el modelo ejecutado.
5. Mientras trabaja, explica la cookie: el navegador la envía para recuperar
   la sesión; `httpOnly` impide que el JavaScript de la página la lea.
6. Al terminar, muestra solo dos piezas de código: el montaje de auth en la
   API y el cliente/formulario. Usa el resto del tiempo para la demo.

### Qué validar al terminar

- [ ] La migración de auth existe y se ha aplicado.
- [ ] `vp check` y `vp test` pasan con el alcance correcto.
- [ ] Registro nuevo → **200** y cookie de sesión, sin mostrar su valor.
- [ ] `get-session` con esa cookie devuelve al usuario.
- [ ] Contraseña incorrecta → **401**.
- [ ] Logout deja de dar una sesión válida.
- [ ] En el navegador: regístrate con un usuario de prueba, recarga y
      comprueba que sigues dentro; sal y comprueba que vuelves al login.
- [ ] Health sigue OK.

> [!tip] Tu señal para avanzar
> «Ahora la aplicación sabe quién soy y conserva mi sesión. Todavía no tiene
> workspaces ni decide a qué proyectos pertenezco.»

**Evidencia/checkpoint del 01:** `PENDIENTE`

## 3. Prompt 02 · Modelo multi-tenant — 18:56–19:04

**Abre:** [02-multi-tenants.md](../../prompts/auth/02-multi-tenants.md).

**Cursor:** chat nuevo, **Grok 4.7 Fast**, esfuerzo medio. Pega el archivo
completo. Grok explica el plan breve y continúa; no espera otro «adelante».

### Para qué sirve este prompt

Crear tres tablas y sus relaciones: `workspace`, `workspace_member` y
`project`. El resultado es estructura de datos; la pantalla apenas cambiará.

### Antes de lanzarlo, di

> «Ahora conocemos al usuario, pero necesitamos representar sus espacios de
> trabajo. Este cambio ya tiene tablas, relaciones y restricciones definidas.
> Grok puede ejecutarlo directamente y comprobar la migración.»

### Qué explicar mientras trabaja

```text
Ana ──┐
      ├── workspace_member ── workspace ── project
Luis ─┘
```

Una fila de `workspace_member` relaciona usuario y espacio. La combinación
`workspace_id + user_id` no debe repetirse. Cada proyecto pertenece a un
workspace; no basta con conocer el ID de un proyecto para poder leerlo.

### Qué haces y validas al terminar

1. Abre el SQL de la nueva migración; señala las tres tablas.
2. Localiza una FK y el `UNIQUE (workspace_id, user_id)`.
3. Si usas TablePlus, abre `data/agentic-kanban.db` como SQLite; no arranques
   otra API para inspeccionarla. Mostrar el SQL es suficiente si falta tiempo.

- [ ] Hay una migración nueva; las anteriores no han sido reescritas.
- [ ] `project.workspace_id` es obligatorio y tiene FK.
- [ ] Las membresías no se duplican; están los índices y cascadas pedidos.
- [ ] Migración aplicada; `vp check`, tests y health correctos.
- [ ] No ha añadido endpoints, usuarios demo, roles o tareas.

**Pregunta:** «¿Por qué todavía no podemos decir que los datos están aislados?»

**Respuesta:** las relaciones lo permiten, pero falta que la API compruebe
la membresía y filtre cada lectura. Eso llega en el 03.

**Evidencia/checkpoint del 02:** `PENDIENTE`

## 4. Prompt 03 · Lecturas autorizadas — 19:04–19:23

**Abre:** [03-workspaces.md](../../prompts/auth/03-workspaces.md).

**Cursor:** chat nuevo, **Opus 5.5**, esfuerzo alto. Pega el prompt completo.
Revisa el plan, apruébalo y comprueba que implementa Grok.

### Para qué sirve este prompt

Crear `GET /api/workspaces` y `GET /api/projects/:projectId`, con sesión y
membresía, y preparar tests de API con una base independiente de la demo.
Es la frontera de acceso a los datos del producto.

### Antes de lanzarlo, di

> «Estar autenticado no significa poder leer cualquier proyecto. Vamos a
> comprobar quién hace la petición, a qué workspace pertenece el recurso y
> si el usuario es miembro. La comprobación se hace en el servidor.»

### Qué revisar en el plan y en el resultado

1. **Sesión:** sin usuario autenticado → **401**.
2. **Membresía:** el usuario debe pertenecer al workspace del recurso.
3. **Origen del tenant:** `workspace_id` procede de la base de datos; no
   confiamos en un tenant enviado por el navegador.
4. **Acceso ajeno:** si no es miembro o el proyecto no existe → **404**.
5. **Datos:** consultas a través de `@agentic-kanban/db` y respuestas validadas
   con los schemas compartidos.

Explica la decisión de 404: «Para este curso devolvemos la misma respuesta
si el recurso no existe o no tienes acceso; no revelamos su existencia».

### Qué mostrar mientras Grok trabaja

- Un recorrido de código: ruta → sesión → consulta con membresía.
- Un test con el proyecto de otro workspace y su resultado esperado.
- La configuración de la base temporal de tests. No uses un test que escriba
  en `data/agentic-kanban.db` para justificar aislamiento.

### Qué validar al terminar

- [ ] `vp check` y tests correctos; la base de tests está separada de `data/`.
- [ ] Sin cookie, `GET /api/workspaces` → **401**.
- [ ] Un usuario recién registrado sin membresías obtiene **200** y `[]`.
- [ ] Con fixtures de test, un miembro ve su workspace con sus proyectos.
- [ ] Proyecto propio → **200**.
- [ ] Otro usuario sin membresía, sobre ese mismo proyecto → **404**.
- [ ] Health sigue OK.
- [ ] No ha adelantado el seed ni creado frontend de workspaces.

> [!important] Cómo interpretar la evidencia en este punto
> Ana y Luis de la demo aún no existen. Los casos con membresías se prueban
> ahora con fixtures en la base de tests; en el 04 repetiremos la demostración
> sobre los datos de aula. Una lista vacía por sí sola no prueba aislamiento.

**CodeRabbit aquí:** úsalo antes de seguir solo si queda una incertidumbre
concreta importante de autorización. Si lo ejecutas, anota qué versión y
qué alcance revisó. No hace falta lanzarlo por haber terminado el prompt.

**Evidencia/checkpoint del 03:** `PENDIENTE`

## 5. Prompt 04 · Seed — 19:23–19:32

**Abre:** [04-seed.md](../../prompts/auth/04-seed.md).

**Cursor:** chat nuevo, **Grok 4.7 Fast**, esfuerzo medio. Ejecución directa.

### Para qué sirve este prompt

Crear datos de demostración conocidos y repetibles, sin duplicarlos al
ejecutar de nuevo el seed. Conecta la autorización con un ejemplo visible.

### Antes de lanzarlo, di

> «Necesitamos demostrar lo mismo cada vez. El seed prepara Ana, Luis y sus
> espacios. Debe poder ejecutarse dos veces sin duplicar usuarios ni pertenencias.
> Los requisitos están cerrados, así que volvemos a trabajar directamente con Grok.»

### Los datos que debes recordar

| Usuario | Espacio compartido                 | Espacio privado                   |
| ------- | ---------------------------------- | --------------------------------- |
| Ana     | `thePower Demo` → `Agentic Kanban` | `Espacio de Ana` → `Notas de Ana` |
| Luis    | `thePower Demo` → `Agentic Kanban` | No pertenece al espacio de Ana    |

**Cuentas ficticias de aula:** `ana@demo.test` y `luis@demo.test`.
**Contraseña ficticia de ambos:** `Demo1234!`.

### Qué haces y validas al terminar

Si Grok ya ha ejecutado y mostrado el seed dos veces con sus recuentos,
aprovecha esa evidencia. No hace falta repetirlo de nuevo por ritual.

```bash
docker compose exec api bun run db:seed
docker compose exec api bun run db:seed
```

- [ ] Ana y Luis existen una vez cada uno; puede haber usuarios del ensayo
      de registro del 01, que no se deben borrar.
- [ ] Hay 2 workspaces demo, 2 proyectos demo y 3 membresías demo.
- [ ] El segundo seed no duplica ni borra datos.
- [ ] Los usuarios se crean mediante Better Auth, sin hashes inventados.
- [ ] Ambos logins devuelven **200**.
- [ ] Ana obtiene 2 workspaces; Luis, 1.
- [ ] Luis recibe **404** al pedir `proj_ana_notes`.
- [ ] Checks, tests y health siguen correctos.

Todavía puedes estar viendo solo la información de sesión y health en la
web. El listado de workspaces se añade en el siguiente prompt; muestra las
respuestas de API o usa el bloque de comandos del final.

**Evidencia/checkpoint del 04:** `PENDIENTE`

## 6. Prompt 05 · Dashboard — 19:32–19:44

**Abre:** [05-tenant-visible.md](../../prompts/auth/05-tenant-visible.md).

**Cursor:** chat nuevo, **Grok 4.7 Fast**, esfuerzo medio. Ejecución directa.

### Para qué sirve este prompt

Pintar los workspaces y proyectos del usuario y gestionar correctamente el
estado al entrar, salir y cambiar de identidad. El color identifica al workspace.

### Antes de lanzarlo, di

> «La API ya decide qué podemos leer. Ahora lo vamos a mostrar sin dejar
> datos de un usuario en la sesión del siguiente. Compartir un navegador no
> puede implicar compartir la caché privada.»

### Qué explicar mientras trabaja

- TanStack Query gestiona los datos recibidos del servidor.
- La clave de las consultas privadas incluye `userId`.
- Al salir se limpia la caché; sin sesión no se muestra el dashboard privado
  ni se siguen haciendo sus consultas.
- Una respuesta tardía de Ana no debe reaparecer después de entrar como Luis.
- El color depende del workspace, de modo que ambos ven igual el compartido.

### Demo y validación de este paso

1. Entra como **Ana** en la ventana normal. Muestra ambos espacios y proyectos.
2. Entra como **Luis** en la privada. Muestra únicamente el espacio compartido.
3. Compara el color de `thePower Demo` en ambas ventanas.
4. En la ventana normal, sal de Ana y entra como Luis. Comprueba que no
   aparece `Espacio de Ana`, tampoco durante la carga.
5. Sal y recarga: no debe mostrarse contenido privado ni lanzarse consultas
   de workspaces sin sesión.
6. Reproduce el caso de petición pendiente que ensayaste, con la red
   ralentizada o una prueba reproducible: una respuesta antigua no repone
   datos privados. Si no consigues observarlo, déjalo pendiente; no lo marques.

- [ ] Ana ve 2 espacios y Luis 1.
- [ ] El color del espacio compartido coincide.
- [ ] Cambio de usuario sin restos de datos anteriores.
- [ ] Sin sesión y con respuesta tardía: no aparece el dashboard anterior.
- [ ] Cargando, error y lista vacía son estados diferenciados.
- [ ] Checks, tests, health y 404 del proyecto ajeno correctos.

Si queda una duda concreta en sesión/caché, trasládala a Opus con el escenario
y la evidencia que falta. No añadas un orquestador ni CodeRabbit por terminar
una pantalla. La revisión del conjunto se decide en el 06.

**Evidencia/checkpoint del 05:** `PENDIENTE`

## 7. Prompt 06 · Revisión con criterio — 19:44–19:55

**Abre:** [06-review.md](../../prompts/auth/06-review.md).

**Cursor:** chat nuevo, **Opus 5.5**, esfuerzo alto. Pega el prompt completo y
aporta `BASE_CLASE`, evidencias anteriores y cualquier informe ya realizado.
La revisión empieza sin editar. Aprueba el plan de corrección si hay problemas
confirmados; las correcciones las implementa Grok.

### Para qué sirve este prompt

Cerrar la clase con evidencias y decidir si una revisión adicional reduce
una incertidumbre real. CodeRabbit aporta hallazgos; Opus los contrasta con
el código y el alcance. No damos por correctos todos los comentarios del revisor.

### Qué decir

> «Ya tenemos un cambio completo con autenticación, autorización y caché
> privada. Es una razón concreta para pedir una revisión adicional. Primero
> comprobamos que las pruebas locales funcionan; después contrastamos las
> observaciones de CodeRabbit y corregimos las que sean reales.»

### Decisión sobre CodeRabbit

| Lo que ha ocurrido                                            | Qué haces                                                           |
| ------------------------------------------------------------- | ------------------------------------------------------------------- |
| No hubo revisión externa y el flujo está implementado         | Justifica y revisa el cambio acumulado de la clase                  |
| Ya revisaste auth, pero luego añadiste autorización/dashboard | Identifica y revisa lo que quedó sin cubrir                         |
| Todo el código final sigue cubierto por un informe válido     | Reutiliza el informe; no lo ejecutes otra vez para mostrarlo        |
| Hay tests fallando o una funcionalidad incompleta             | Diagnostica y corrige primero; no uses CodeRabbit para certificarlo |
| CodeRabbit no está disponible o no termina a tiempo           | Explica qué revisión queda pendiente y continúa con la demo         |

### Qué haces durante la revisión

1. Comprueba qué pruebas siguen siendo válidas. Pide a Grok solo las
   comprobaciones pendientes o invalidadas, en modo verificar.
2. Aporta el SHA completo previo al 01. Mira el diff acumulado y los archivos
   nuevos; los checkpoints intermedios no deben ocultar parte de la clase.
3. Si corresponde una primera revisión completa, usa el bloque de abajo o
   deja que Opus lo ejecute según el prompt. No lo lances tú también.
4. Mientras CodeRabbit trabaja, prepara el recorrido final y atiende una
   pregunta. No abras otra revisión en paralelo para llenar la espera.
5. Elige un hallazgo real, si existe, y sigue la ruta de código que lo confirma.
   Si no hay hallazgos reales, dilo; no fabriques un fallo para la demostración.
6. Opus distingue problema confirmado, descartado con motivo o duda pendiente.
   Aprueba un plan mínimo; Grok corrige y repite los checks afectados.

> [!example]- Primera revisión completa con CodeRabbit
>
> Sustituye el marcador por el SHA que anotaste antes del 01. Este bloque se
> ejecuta dentro de `kanban`, no desde la carpeta padre.
>
> ```bash
> BASE_CLASE='<SHA completo previo al prompt 01>'
> if git cat-file -e "${BASE_CLASE}^{commit}" &&
>   git merge-base --is-ancestor "$BASE_CLASE" HEAD; then
>   git diff --stat "$BASE_CLASE"
>   git status --short
>   coderabbit review --agent --fresh --base-commit "$BASE_CLASE" --include-untracked
> else
>   printf '%s\n' 'Revisa BASE_CLASE: no se ha iniciado CodeRabbit.'
> fi
> ```
>
> Continúa solo si el SHA existe y es ancestro. Confirma que el informe
> cubre cambios comprometidos, sin commit y archivos nuevos. El diff de Git
> no muestra el contenido de los archivos sin seguimiento.
>
> Si un informe anterior cubre por completo un tramo hasta un SHA conocido,
> puedes revisar desde ese SHA el tramo posterior, conservando `BASE_CLASE`
> como referencia del conjunto. Un informe parcial o sin snapshot identificable
> no demuestra esa cobertura. Sigue el criterio de la guía de ejecución.

### Qué validar al terminar

- [ ] Motivo, base y alcance de la revisión identificados.
- [ ] Informe de CodeRabbit contrastado, o revisión pendiente declarada.
- [ ] Hallazgos reales corregidos por Grok y comprobaciones afectadas repetidas.
- [ ] Ninguna ampliación a tareas, tablero, roles o nuevas tecnologías.
- [ ] Checks y tests vigentes; aceptación manual distinguida de los informes.

**CodeRabbit: motivo, snapshot e informe:** `PENDIENTE`

**Hallazgos confirmados/corregidos:** `PENDIENTE`

**Hallazgos descartados y motivo:** `PENDIENTE`

## 8. Demo y cierre — 19:55–20:00

### Recorrido final, en este orden

- [ ] Abre sin sesión: no hay dashboard privado.
- [ ] Entra como Ana: 2 espacios y sus proyectos; recarga y conserva sesión.
- [ ] En la ventana privada, Luis: 1 espacio y proyecto compartido.
- [ ] Muestra que Luis obtiene **404** para `proj_ana_notes`.
- [ ] En la misma pestaña de Ana, sal y entra como Luis: no quedan datos de Ana.
- [ ] Muestra el resultado vigente de `vp check`, tests y health.
- [ ] Declara si queda algo pendiente de revisión, corrección o comprobación.

### Qué decir para cerrar

> «Hoy hemos separado identidad y permisos, construido la relación entre
> usuarios y workspaces y comprobado el acceso desde la API. Hemos usado
> orquestación donde había decisiones entre capas y ejecución directa donde
> el trabajo estaba definido. La próxima clase añadirá columnas, tareas y
> movimiento de tarjetas sobre esta base.»

**Preguntas si queda tiempo:**

- «¿Por qué esconder un proyecto en la interfaz no basta para protegerlo?»
- «¿Qué demuestra que Luis reciba 404 y Ana pueda acceder?»
- «¿Qué hizo útil al orquestador en el 03 y prescindible en el 02?»

**Estado final:** `COMPLETO / PENDIENTE — rellenar tras observar las pruebas`

**Pendientes para el siguiente encuentro:**

- [ ] Anotar aquí los pendientes reales, si los hay.

## 9. Si algo se atasca

| Síntoma                                  | Qué haces                                                          | Qué explicas al grupo                                          |
| ---------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------- |
| No abre la app                           | `docker compose ps`, logs acotados y health por 5173               | Primero comprobamos el recorrido mínimo                        |
| Auth devuelve error de origen            | Revisa 5173, proxy, `trustedOrigins` y `Origin` en POST            | El origen del navegador y el contrato de cookies deben encajar |
| Faltan tablas tras un reset              | Aplica migraciones; después seed si ya estás en 04                 | Crear el fichero DB no crea las tablas del producto            |
| Aparece `SQLITE_BUSY`                    | Comprueba que no hay una segunda API ni tests usando la DB de demo | No solucionamos aislamiento borrando datos                     |
| Tests de `.claude/worktrees/`            | Declara el alcance y ejecuta los del checkout correcto             | Otra copia del proyecto no pertenece a esta ejecución          |
| Grok pide otro modelo para una decisión  | Concreta la duda y cambia tú a Opus si procede                     | Escalamos por una necesidad observada                          |
| El modelo real del subagente no coincide | Revisa la configuración antes de delegar más trabajo               | Configurar el nombre no equivale a comprobar la ejecución      |
| CodeRabbit tarda o falla                 | Conserva el estado y marca la revisión pendiente                   | Un informe pendiente no es una revisión aprobada               |

> [!warning] Si vas más de cinco minutos por detrás del ensayo
> Reduce el paseo por archivos y prioriza las comprobaciones. Si necesitas
> usar un checkpoint de reserva, conserva primero el trabajo actual y utiliza
> una copia preparada y validada; cuenta que estás mostrando el resultado del
> ensayo. No hagas resets destructivos ni cambies a una rama antigua a ciegas.
> Si no hay checkpoint válido, declara el paso pendiente. No ejecutes el
> siguiente sobre una dependencia rota ni omitas las pruebas de aislamiento.

## 10. Comandos de consulta para la demo

Ejecutar **desde el prompt 04 en adelante**, cuando existen los datos de aula.
Los ejemplos usan solo cuentas ficticias. Mantén los cookie jars locales y
no muestres su contenido en pantalla. No imprimas cookies ni cabeceras de auth.

### Login de Ana y Luis

```bash
KANBAN_ANA_JAR="$(mktemp)"
KANBAN_LUIS_JAR="$(mktemp)"

curl -sS -o /dev/null -w 'Login Ana: %{http_code}\n' \
  -c "$KANBAN_ANA_JAR" \
  -H 'Origin: http://localhost:5173' \
  -H 'Content-Type: application/json' \
  -d '{"email":"ana@demo.test","password":"Demo1234!"}' \
  http://localhost:5173/api/auth/sign-in/email

curl -sS -o /dev/null -w 'Login Luis: %{http_code}\n' \
  -c "$KANBAN_LUIS_JAR" \
  -H 'Origin: http://localhost:5173' \
  -H 'Content-Type: application/json' \
  -d '{"email":"luis@demo.test","password":"Demo1234!"}' \
  http://localhost:5173/api/auth/sign-in/email
```

**Esperado:** 200 en los dos logins. Si falla alguno, diagnostica antes de
interpretar las respuestas de autorización.

### Workspaces: comparar también el contenido

```bash
curl -sS -b "$KANBAN_ANA_JAR" http://localhost:5173/api/workspaces
curl -sS -b "$KANBAN_LUIS_JAR" http://localhost:5173/api/workspaces
```

**Esperado:** Ana, 2 workspaces y sus proyectos; Luis, 1 y solo el proyecto
compartido. No basta con ver que ambas peticiones devuelven 200.

### Proyectos: demostrar la diferencia de acceso

```bash
curl -sS -o /dev/null -w 'Ana, proyecto privado: %{http_code}\n' \
  -b "$KANBAN_ANA_JAR" \
  http://localhost:5173/api/projects/proj_ana_notes

curl -sS -o /dev/null -w 'Luis, proyecto privado de Ana: %{http_code}\n' \
  -b "$KANBAN_LUIS_JAR" \
  http://localhost:5173/api/projects/proj_ana_notes

curl -sS -o /dev/null -w 'Luis, proyecto compartido: %{http_code}\n' \
  -b "$KANBAN_LUIS_JAR" \
  http://localhost:5173/api/projects/proj_agentic_kanban

curl -sS -o /dev/null -w 'Sin sesion, workspaces: %{http_code}\n' \
  http://localhost:5173/api/workspaces
```

**Esperado, en orden:** **200, 404, 200, 401**. La cookie de Luis debe ser
válida: un 401 no demuestra que un usuario autenticado carezca de membresía.

### Migraciones, seed y health

```bash
# Solo cuando el paso ya haya generado la migración correspondiente.
docker compose exec api bun run db:migrate

# Solo desde el 04, que crea este comando.
docker compose exec api bun run db:seed

curl -sS http://localhost:5173/api/health
```

Generar migraciones se hace en el host con `bun run db:generate` cuando el
prompt lo pide. Con Compose funcionando, aplicar migraciones y seed se hace
en `api`. No arranques una segunda API en el Mac.

## 11. Registro breve del resultado

Rellena solo después de observarlo; un agente que dice «hecho» no sustituye
la salida de comandos ni la demo.

| Bloque            | Versión/checkpoint | Checks y tests | Aceptación observada | Pendientes |
| ----------------- | ------------------ | -------------- | -------------------- | ---------- |
| 01 · Auth         |                    |                |                      |            |
| 02 · Modelo       |                    |                |                      |            |
| 03 · Autorización |                    |                |                      |            |
| 04 · Seed         |                    |                |                      |            |
| 05 · Dashboard    |                    |                |                      |            |
| 06 · Revisión     |                    |                |                      |            |

**Material de referencia:** [guía de ejecución de la sesión](../../prompts/auth/README.md),
[contrato del repositorio](../../AGENTS.md) y
[arranque del starter](../../README.md).
