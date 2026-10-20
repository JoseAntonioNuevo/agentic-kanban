# Sesión 2 · 00 — plan de Opus para ejecutar después con Grok

Ejecutar en **Plan con Opus 5.5**, partiendo de la clase 1 aceptada. Este es
un paso de planificación, no una autorización para implementar el tablero.

## Encargo de planificación

Lee `AGENTS.md`, `prompts/CURSOR.md`, `prompts/kanban/README.md`, los ocho
prompts `prompts/kanban/01-models.md` a `08-review.md`, las reglas implicadas
y el código de partida. Comprueba las APIs instaladas cuando afecten al plan,
especialmente Drizzle, TanStack Query y `@dnd-kit/react` 0.5.1.

Trabaja tú en la inspección y el plan, sin subagentes. No edites la app,
instales paquetes, ejecutes migraciones/seed, levantes otro proceso, hagas
commit ni llames a CodeRabbit. No implementes las clases 3 o 4. Si falta la
aceptación de la clase 1, identifica qué prerrequisito impide un plan fiable.

Prepara **un solo plan para toda la sesión 2**, que Grok podrá ejecutar paso a
paso sin otra fase de planificación formal. Debe incluir:

1. Estado observado de partida y supuestos pendientes, separados de hechos.
2. Orden 01–08, objetivo de cada paso, archivos previstos y dependencias.
3. Contratos exactos que no deben divergir: tablas y posiciones, schemas
   compartidos, rutas y códigos HTTP, `useBoard`, `boardQueryKey`, mutations,
   `applyBoardMove` y la API real de dnd-kit. Respeta los nombres de los prompts.
4. Algoritmo transaccional de movimiento: quitar, insertar, acotar posición y
   renumerar origen/destino dentro del mismo proyecto. Explica los casos
   misma columna, columna vacía, borde y destino prohibido.
5. Flujo de cliente: una fuente de verdad en TanStack Query, optimista,
   rollback, invalidación y navegación local; nada de copia del board en state.
6. Migraciones en host y aplicación/seed dentro de `api`; tests con DB aislada.
   Tabla de aceptación por paso con comandos y comprobaciones manuales,
   incluidos 400/401/404, persistencia y fallo controlado de la API.
7. Riesgos concretos y cuándo revisar con CodeRabbit. Guarda la base previa
   al 01 y aplica el criterio de cobertura; no programes una revisión por paso.
8. Brief final para Grok: un único ejecutor en Agent, sin Task ni subagentes,
   autónomo dentro del paso seleccionado, sin commit ni funciones futuras.

Entrega un plan ejecutable y conciso. No afirmes que las comprobaciones futuras
ya pasaron. Termina indicando que el profesor debe revisar este plan una vez,
guardarlo/adjuntarlo y seleccionar Agent con Grok 4.7 xhigh Fast. Este es el
único traspaso manual previsto; no añadas «espera mi adelante» a cada paso.
