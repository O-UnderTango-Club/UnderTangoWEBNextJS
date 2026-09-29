# Próximos deadlines del panel

La columna derecha de `/panel-de-control` reúne fechas canónicas de Supabase sin cambiar los tres frentes, sus cupos, el ranking ni el editor existente. En pantallas de hasta 1150 px aparece antes de los frentes, con una lista acotada y desplazable.

## Lectura y presentación

- `GET /api/panel` autoriza primero al usuario; lee el tablero y la agenda en paralelo. La agenda usa `ut_panel_deadlines_v1()`, sólo accesible para `service_role`. La clave privada permanece en el servidor.
- La RPC reúne vencimientos de acciones abiertas, fechas de operaciones, oportunidades con fecha, objetivos de proyectos y `operativo.agenda_items`.
- Cuatro categorías explícitas: vencimiento/entrega, evento confirmado, tentativo y condicional. Una operación sólo es confirmada por su estado estructurado; una oportunidad no se convierte en contratación.
- Orden ascendente por fecha, conservando fechas civiles en `America/Argentina/Cordoba`. La hora se muestra como texto para conservar avisos como “aproximada” o “por confirmar”. Sin prioridad registrada se muestra “Sin prioridad asignada”.
- Filtros de 30 días, 90 días y todas las próximas fechas; condicionales opcionales; diez filas iniciales y “Ver más”. Los vencimientos anteriores siguen accesibles en un apartado plegado.
- Actualización manual y el ciclo existente del panel. Si falla la agenda, los frentes siguen disponibles y se muestra un error; una falla no se presenta como una agenda vacía. No hay almacenamiento persistente de datos privados en el navegador.

## Datos y mantenimiento

`agenda_items` complementa los registros que ya existen. No reemplaza tareas ni Calendar. `source_key` único impide duplicar la misma fuente. Sus campos y opciones se verifican mediante `migration_manifest` / `panel_write_fields`; las escrituras pasan por `ut_panel_commit_v1`, con revisión global, comprobantes idempotentes y los mismos disparadores de auditoría.

Una agenda vinculada a acción, operación o caso toma la fecha del registro vinculado; un cambio de fecha se refleja sin mantener otra copia. Esa fila sustituye la representación automática del mismo registro. `project_id` aporta contexto y evita duplicar un objetivo que ya representa el mismo evento. `completion_task_id` permite ocultar un límite oficial cuando se completa la entrega asociada, conservando una fecha distinta del objetivo interno.

`Realizado`, `Cancelado` y `Archivado` quedan fuera del radar. Las propuestas enviadas sin respuesta ni disparador concreto no generan seguimiento activo por defecto. La evidencia del envío y la oportunidad se conservan. La ausencia de respuesta no se interpreta como rechazo, contratación o cobro.

La carga inicial de encuentros fue cotejada con Calendar hasta el **2/12/2026**. Se preservaron los horarios sin confirmar y las ventanas sujetas a selección o asignación. Las instancias de A Piacere y Thaís llevan su condición semanal en el contexto. **No hay sincronización automática con Calendar ni expansión indefinida de recurrencias**: cambios y nuevas instancias deben actualizarse en Supabase y en Calendar cuando corresponda. El componente siempre consulta Supabase.

## Migraciones y seguridad

Aplicar en orden:

1. `20260929015412_panel_deadlines_agenda.sql`
2. `20260929015910_panel_deadlines_linked_completion.sql`

Estas migraciones ya fueron aplicadas al Supabase operativo. No recrearlas con otra versión. Son aditivas y no cambian ranking, estados de acciones ni permisos públicos de tablas existentes. No contienen los datos operativos de la carga inicial.

La tabla nueva usa RLS sin políticas públicas, siguiendo el patrón privado operativo. El acceso directo de `anon` y `authenticated` está revocado; sólo el servidor autorizado invoca la RPC. El aviso informativo de RLS sin políticas es intencional para esta tabla privada ([referencia de Supabase](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). La RPC tiene `search_path` fijo.

## Verificación

- `node scripts/panel-deadlines.test.mjs`: fechas, orden, filtros, validación estricta, vínculos seguros, consulta privada, autorización y continuidad de frentes ante falla de agenda.
- `scripts/panel-deadlines.test.sql`: ejecutar como dueño de migraciones; verifica permisos, transacción auditada, idempotencia, revisión obsoleta, duplicados, reprogramación y cierre. Todas las filas de prueba se revierten con `ROLLBACK`.
- `node scripts/panel.test.mjs` y `node scripts/panel-operations.test.mjs`: regresión del tablero y contrato existentes.
- `tsc --noEmit` y ESLint sobre los archivos nuevos y la ruta API.
- Revisión de navegador en 1600×1000 y 390×844: tres frentes, columna derecha, ausencia de desborde, filtros, expansión, errores y vacío. Se reprodujo una lectura real de Supabase en el límite de la API para la prueba visual, sin escrituras.
- Windows: el código compila y pasa tipos; la generación completa encuentra el problema existente de `next/og` en `/shows/opengraph-image` (“Invalid URL”). La compilación Linux de Vercel se comprueba en el PR antes de publicar.

## Publicación

La implementación debe integrarse y desplegarse con autorización de Pablo. Las actualizaciones operativas y las migraciones se verifican aparte de la publicación de la interfaz. Una captura local o un despliegue de prueba no implica publicación en producción.

