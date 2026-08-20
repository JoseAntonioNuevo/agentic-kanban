Revisa el POST de comentarios y las tablas notification.

Al crear un comentario, parsea `@Nombre` en el body.

Requisitos:

El token es `user.name` del miembro (`Ana`, `Luis` en el seed), no el email. Case-insensitive. El parser toma letras (`@Luis,` → `Luis`); no dejes que la coma o el punto rompan el match.
Solo miembros del **mismo** workspace que el task. Ignora @desconocidos. No te menciones a ti mismo.
Por cada mención válida: en la **misma transacción** que el comment, inserta `notification` kind `mention` (`recipient_user_id` = el mencionado) y genera el email (to = email del mencionado, subject y body en texto). Sin @ válido → 201 del comment y cero notifications.
“Enviar” el email: escribe una línea JSON en `data/outbox.jsonl` (mismo volumen que el `.db`) y marca `emailed_at`. No Resend, no SMTP, no contenedor extra, no dotenv.
El POST de comentario no cambia de contrato HTTP salvo el efecto servidor.
No implementes campana, frontend de menciones ni deploy.

Plan primero: cómo parseas, cómo resuelves miembros, forma del outbox, archivos.
Luego implementa. Actualiza `AGENTS.md`: menciones + outbox sí; campana no.

Verificación: `vp check --no-fmt`.
Test (demo, no solo fixtures): Ana (`ana@demo.test`) POST `@Luis mira esto` en un task de `proj_agentic_kanban` → una fila `notification` con `recipient_user_id` de Luis + línea outbox `to: luis@demo.test`. Ana no recibe fila. `@Pepe` o `@Ana` (auto) no insertan. Luis no miembro de `proj_ana_notes` → tampoco.
