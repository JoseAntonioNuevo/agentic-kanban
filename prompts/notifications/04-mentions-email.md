Revisa el POST de comentarios y las tablas notification.

Al crear un comentario, parsea `@Nombre` en el body.

Requisitos:

El nombre se compara con `user.name` de los miembros del workspace (Ana, Luis). Case-insensitive.
Solo miembros. Ignora @desconocidos. No te menciones a ti mismo.
Por cada mención válida: inserta `notification` kind `mention` y genera el email (to = email del mencionado, subject y body en texto).
“Enviar” el email: escribe una línea JSON en `data/outbox.jsonl` (mismo volumen que el `.db`) y marca `emailed_at`. No Resend, no SMTP, no contenedor extra, no dotenv.
El POST de comentario no cambia de contrato HTTP salvo el efecto servidor.
No implementes campana, frontend de menciones ni deploy.

Plan primero: cómo parseas, cómo resuelves miembros, forma del outbox, archivos.
Luego implementa. Actualiza `AGENTS.md`: menciones + outbox sí; campana no.

Verificación: `vp check --no-fmt`.
Test: Ana comenta `@Luis` en el board compartido → notification para Luis + línea en outbox; Luis no recibe nada si no es miembro; auto-mención no crea fila.
