Revisa Docker, README y el flujo Ana/Luis.

Deja la Sesión 4 lista para desplegar en aula y hacer la demo.

Requisitos:

Deploy de aula = `docker compose up --build` (siguen **dos** servicios: web, api). No Fly, no Vercel, no Resend, no contenedor de correo, no `sesion-*` tags.
`data/outbox.jsonl` no se commitea (gitignore). El volumen `./data` ya monta el outbox.
README: pasos de reset/migrate/seed/compose y un guion de demo:

```text
Dos navegadores (Luis en incógnito; si no, es la misma cookie).
Ana y Luis en ws_thepower_demo / proj_agentic_kanban.
Ana edita una tarjeta, escribe `@Luis mira esto`, pulsa Comentar (no Guardar).
Luis: hilo, toast, campana con badge (recipient = Luis). Ana: campana vacía (“No hay menciones.”, no “No se pudieron cargar”). Si Luis GET 200 tiene filas y la UI dice que no cargó, es parse/sesión, no Ana.
(opcional) data/outbox.jsonl → to luis@demo.test
Luis no ve comentarios ni notificaciones de proj_ana_notes.
```

No añadas features de producto. Actualiza `AGENTS.md`: deploy de aula = Compose; producto de la Sesión 4 completo.

Verificación: `vp check --no-fmt`; `vp build apps/web`.
Plan primero qué tocarás en README/gitignore/AGENTS.md. Luego implementa.
