# Ranking individual de acciones — Supabase

## Regla vigente

Supabase operativo es la fuente canónica. Airtable queda histórico, sin fallback ante errores. Cada acción abierta tiene frente y posición propios. Los proyectos siguen vinculados como contexto, pero no determinan el orden. Una acción compartida aparece una sola vez.

`1.4` significa acción en el frente Primario, posición 4: no es un decimal ni el puesto de un proyecto. La posición es única entre acciones abiertas del mismo frente. Las acciones del mismo proyecto pueden estar intercaladas con otras.

Frentes toma las primeras tres acciones ejecutables de cada frente. Esperas, acciones en curso y registros por revisar mantienen su posición pero no ocupan esos tres lugares. Las dependencias y estados conservan las reglas existentes. La recurrencia no crea ejecuciones automáticas.

## Datos y guardado

- Tabla: `operativo.follow_ups`.
- Campos persistidos: `frente_de_accion` y `posicion_de_accion`; contrato del adaptador: `action_front` y `action_rank`.
- `orden_en_plan` sigue siendo el paso dentro de un plan; no determina el ranking de acciones.
- El ranking histórico de `operativo.projects` se conserva, pero el panel no lo usa ni permite editarlo en modo individual.
- La restricción `follow_ups_action_position_valid` exige frente válido y posición positiva, o ambos vacíos para catalogar.
- `follow_ups_action_position_unique` es un índice/restricción único diferido sobre dos columnas generadas, `ranking_frente_abierto` y `ranking_posicion_abierta`. Excluye del conflicto las acciones Hecho/Cancelado.
- Mover inserta la acción y desplaza sólo las posiciones afectadas; cerrar compacta su frente; reabrir sin posición explícita agrega al final. No se mueven proyectos ni acciones hermanas como bloque.
- `ut_panel_commit_v1` guarda los cambios en una sola transacción, comprueba revisión global y registra recibo idempotente. Los triggers existentes conservan fecha, versión, auditoría y revisión global. Una colisión rechaza toda la operación.
- `ut_panel_snapshot_v2` entrega contrato 2 con los campos individuales; conserva la lectura v1 para compatibilidad. Sólo `service_role` puede ejecutarlo. No se exponen claves al navegador ni se agregan permisos públicos.

## Lecturas y consumo

El panel pide un snapshot completo de proyectos, acciones (incluido historial), casos y disparadores. Ordena y clasifica las acciones en el servidor de la aplicación. El navegador renderiza inicialmente 36 tarjetas: “Mostrar más” es un límite visual, no paginación de Supabase.

El refresco automático sucede cada dos minutos mientras la página está visible y no hay editor abierto, además de apertura, recuperación de conexión, regreso a la pestaña, actualización manual y después de guardar. La rama Supabase no usa la caché antigua de Airtable de 90 segundos. No se añadió realtime ni un trabajo programado para el ranking.

Mover de la posición i a j dentro del mismo frente actualiza hasta `abs(i-j)+1` filas, con sus efectos de auditoría. No cuesta más almacenar una posición alta, pero enviarla lejos puede escribir varias posiciones para mantener números consecutivos. Una petición/transacción no significa una sola fila escrita.

El nuevo índice evita duplicados; no elimina el costo de la lectura completa. No se cambiaron paginación ni caché en esta entrega, para mantener búsquedas, conteos, relaciones y detección de dependencias coherentes. A mayor volumen, conviene separar detalle/historial del snapshot frecuente, medir bytes y consultas antes de cambiar el modelo. No se infiere una factura a partir del número de filas.

## Migración y verificación

Aplicar `supabase/migrations/20260908_action_ranking.sql` antes de publicar el código que solicita v2. La migración es aditiva y guarda una copia privada del snapshot anterior y su revisión en `operativo.action_ranking_migration`.

La asignación inicial conserva una sola vez el orden anterior: frente/ranking del proyecto principal, paso en el plan, nombre en español e identificador. Las acciones sin contexto clasificado permanecen sin posición; no se les inventa una prioridad. Antes de confirmar, comparar contra el orden calculado por el modelo anterior sobre la misma revisión. La migración comprueba que no cambió ningún valor previo del snapshot ni su cantidad de acciones.

Ejecutar primero toda la migración en una transacción terminada en ROLLBACK. Insertar antes del cierre `scripts/action-ranking-db-test.sql`: verifica intercambio atómico, recibo repetido sin escritura duplicada, rechazo de colisiones y reversión de todas las pruebas. Después aplicar y confirmar la misma migración validada. No ejecutar pruebas mutantes fuera de su transacción reversible.

Pruebas locales: `node scripts/panel.test.mjs`, `node scripts/panel-operations.test.mjs`, `node scripts/finance.test.mjs` y `tsc --noEmit`. Verificar build de Vercel, dominio de producción, lectura autenticada y editor de posición individual antes de anunciar el cambio activo.
