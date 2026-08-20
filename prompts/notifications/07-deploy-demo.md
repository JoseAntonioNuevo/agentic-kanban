Revisa Docker, README y el flujo Ana/Luis.

Deja la Sesión 4 lista para desplegar en aula y hacer la demo.

Requisitos:

Deploy de aula = `docker compose up --build` (siguen **dos** servicios: web, api). No Fly, no Vercel, no Resend, no contenedor de correo, no `sesion-*` tags.
`data/outbox.jsonl` no se commitea (gitignore). El volumen `./data` ya monta el outbox.
README: pasos de reset/migrate/seed/compose y un guion de demo:

```text
Dos navegadores. Ana y Luis en ws_thepower_demo.
Ana abre una tarjeta, comenta `@Luis …`.
Luis ve el comentario en vivo, toast, campana y (opcional) la línea nueva en data/outbox.jsonl.
Luis no ve comentarios ni notificaciones de proj_ana_notes.
```

No añadas features de producto. Actualiza `AGENTS.md`: deploy de aula = Compose; producto de la Sesión 4 completo.

Verificación: `vp check --no-fmt`; `vp build apps/web`.
Plan primero qué tocarás en README/gitignore/AGENTS.md. Luego implementa.
