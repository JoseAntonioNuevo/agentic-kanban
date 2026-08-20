Revisa el hook de realtime y sonner (ya está montado).

Muestra un toast in-app cuando llega un evento de otro usuario en el board abierto.

Requisitos:

Textos (español, un toast.info):

- task.created → `Nueva tarea: {title}`
- task.updated → `Tarea actualizada: {title}`
- task.deleted → `Tarea eliminada` (título de la cache si está)
- task.moved → `Tarea movida` (título de la cache si está)

Solo `actorUserId` distinto de la sesión actual (el skip-self del hook ya existe: tostea en ese mismo sitio, después de ignorar al actor).
Sin tabla, campana, historial ni email.
No presencia, comentarios ni `@mentions`.

Primero di qué texto mostrarás en cada tipo y cuándo no tosteas.
Luego implementa.

Verificación: `vp check --no-fmt`; Ana mueve → Luis ve toast; Ana no ve toast de su propio move.
