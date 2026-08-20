Revisa el hub y las rutas de board.

Tras cada escritura HTTP exitosa, publica el evento Zod correspondiente a los suscriptores de ese project.

Writes:

- crear → task.created
- editar → task.updated
- eliminar → task.deleted
- mover → task.moved

Si el write falla (404, validación), no publiques.
`actorUserId` es el `userId` de la sesión (contexto), no un id del body.
No cambies el contrato HTTP. El stream no es una API de escritura.
No toques el frontend.
No implementes toasts.

Plan primero: desde qué punto de `board.ts` se emite, qué payload, cómo evitar publicar antes de persistir.
Luego implementa. Actualiza `AGENTS.md`: publish desde writes sí; cliente no.

Verificación: `vp check --no-fmt`.
Test: suscríbete, write OK → llega el evento Zod; write 404 → no se publica.
