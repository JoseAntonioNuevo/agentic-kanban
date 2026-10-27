# Preflight — comprobar Opus → Grok sin implementar

Para clases 1 y 4. Ejecútalo antes del directo en **Agent con Opus 5.5**.
No es un paso de producto ni sustituye ninguna aceptación funcional.

## Prompt para Cursor

Lee `AGENTS.md`, `prompts/CURSOR.md` y
`.cursor/agents/kanban-grok-worker.md`. Esta petición autoriza únicamente una
prueba de delegación de solo lectura. No edites archivos, no ejecutes comandos
que cambien estado, no hagas migraciones/seed ni implementes la app.

Consulta el esquema de `Task` y su catálogo real. Lanza **una nueva Task** con
`subagentType: "custom"`, `name: "kanban-grok-worker"` y
`model: "grok-4.7-xhigh-fast"` explícito si está permitido. Si cambió el catálogo,
aplica el protocolo de la guía: solo Grok 4.7 con xhigh y Fast; no omisión,
`inherit`, Claude ni sustituciones. No reanudes otro hijo.

Encarga al worker, en modo inspeccionar, leer el schema de health actual y
devolver su ruta y los campos definidos. No ejecutar tests, Docker ni comandos
de escritura. No delegar de nuevo. Espera el resultado sin pedir «adelante».

Devuelve el nombre del worker, el selector enviado, si Cursor aceptó la llamada,
el resultado de lectura y la comprobación del modelo real que falta observar
en la sesión hija si tú no puedes verla. No certifiques el proveedor por lo
que el hijo diga de sí mismo. Si Cursor selecciona otro modelo, detén ese hijo
y reporta el desajuste; no continúes con implementación.

## Qué comprueba el profesor

- Opus está seleccionado en el principal y Grok 4.7 xhigh Fast en la Task.
- La tarjeta/sesión hija muestra Grok; no aparece Opus como implementador.
- El worker común se carga y responde sobre health, sin cambios en Git.
- Se conserva `git status --short` antes y después: solo lectura no significa
  que el checkout tuviera que estar limpio previamente.

Si falla, corrige la selección/configuración antes del prompt 01. No cambies
el flujo de las clases silenciosamente ni implementes el curso como prueba.
