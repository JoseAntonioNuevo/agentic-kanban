# Sesión 1 (S9) — Opus orquesta auth y aislamiento

Miércoles 21 de octubre de 2026, 18:30–20:00. Partimos del starter con health
y terminamos, al ejecutar los prompts en clase, con auth por cookie, tenants
aislados y dashboard. Estos archivos son material de clase; la app del starter
todavía no incorpora esas funciones.

## Reparto durante toda la clase

**Agent con Opus 5.5 como principal, Grok 4.7 xhigh Fast como worker.** Opus
coordina y revisa; `kanban-grok-worker` inspecciona, implementa, comprueba y
corrige. Los seis pasos usan este reparto, incluidos tablas, seed y dashboard.
El estilo de ejecución directa se enseñará en la clase 2 tras un plan inicial.

Lee [la guía común de Cursor](../CURSOR.md): contiene el selector explícito
`Task.model: "grok-4.7-xhigh-fast"`, autonomía, propietarios de archivos,
límites, comprobaciones y criterio de CodeRabbit. No uses agentes históricos
Sonnet/Haiku ni subagentes integrados. No omitas `model` ni heredes Opus.

| Paso                                   | Qué coordina Opus                                | Qué entrega Grok y qué validar                                  |
| -------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------- |
| [01 · Auth](01-estructura.md)          | Contratos DB/API/web, cookie y proxy             | Registro, login, recarga, logout, rate limit y migración        |
| [02 · Tablas](02-multi-tenants.md)     | Modelo workspace/membership/project              | FK, cascadas, unicidad de membresía y SQL de migración          |
| [03 · Autorización](03-workspaces.md)  | Sesión → recurso → membresía → consulta filtrada | Lecturas 200/401/404 y tests con DB temporal                    |
| [04 · Seed](04-seed.md)                | Datos cerrados, IDs e idempotencia               | Dos ejecuciones sin duplicados; Ana dos espacios, Luis uno      |
| [05 · Dashboard](05-tenant-visible.md) | Identidad, queryKey y limpieza de caché          | Estados distintos y cambio Ana → Luis sin filtraciones          |
| [06 · Revisión](06-review.md)          | Evidencia conjunta y revisión cuando aporta      | Aislamiento, regresiones, correcciones verificadas y pendientes |

No hace falta multiplicar workers en el 02 o el 04. En 01/03/05, fija primero
contratos y paraleliza solo archivos independientes; un responsable integra
barrels, montaje y documentación. Opus no implementa la app ni pide «adelante»
para avanzar dentro del paso solicitado.

## Preparación y arranque

Sigue la preparación de la guía común: versiones fijadas, solo `web` y `api`,
health por `:5173`, permisos de terminal y checkout sin worktrees anidados.
Ejecuta [el preflight de solo lectura](../00-comprobar-delegacion.md) con el
worker común antes del directo. Guarda `BASE_CLASE` antes del 01. Las pruebas
del preflight no construyen auth ni sustituyen la aceptación del 01.

En cada paso abre un chat Agent con Opus, adjunta su prompt y deja que
coordine hasta completar las comprobaciones. El prompt prevalece sobre las
frases de estado «aún no existe» dentro de su alcance; Grok actualiza ese
estado al cerrar sin borrar el reparto de modelos de `AGENTS.md`.

Si ya habías lanzado el ensayo con un prompt anterior, usa el mensaje de
[recuperación de la guía común](../CURSOR.md#retomar-una-prueba-con-instrucciones-antiguas).
Editar un archivo no cambia el encargo que ya está dentro del chat.

## CodeRabbit en esta sesión

El punto previsto es el 06, después de integrar el 05: auth, autorización
multi-tenant y caché privada justifican una revisión del conjunto si no está
ya cubierto. Una duda importante en 01/03 puede justificar adelantarla;
conserva ese alcance y evita repetir lo que siga revisado.

Usa el procedimiento de [CodeRabbit](../CURSOR.md#coderabbit-cuando-aporte-valor)
con la base anterior al 01, checkpoints, cambios sin commit y nuevos archivos.
Opus contrasta los hallazgos; Grok corrige lo confirmado y repite los checks
afectados. La falta de CLI/cuota no se convierte en «revisión aprobada».

## Demo de cierre y guiones

- Ana ve «thePower Demo» y «Espacio de Ana»; Luis solo «thePower Demo».
- Luis recibe 404 al pedir `proj_ana_notes`. Sin sesión, 401.
- En la misma pestaña, salir de Ana y entrar como Luis no deja datos de Ana;
  comprueba también una respuesta privada tardía y la pérdida de sesión.
- Registro, recarga de sesión, logout y health siguen funcionando.
- El rate limit de auth es de 10 peticiones por minuto y ruta: pruébalo al
  final para no bloquear el sign-in de la demo. No lo desactives para pasar.

El tablero y el arrastre empiezan en la clase 2. Usa el
[guion operativo](../../docs/obsidian/S9-Kanban-clase-1-guion.md) y el
[texto para leer](../../docs/obsidian/S9-Kanban-clase-1-texto-para-leer.md).
