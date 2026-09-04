# Estadísticas de UnderTango y APRENDE

Los dos endpoints públicos conservan el formato usado por los trackers. Guardan únicamente los eventos en `public.analytics_events` del proyecto Supabase `UnderTango Analytics` (`titmbxbymfajgmidfabn`). El sistema operativo, contactos y finanzas continúan en Airtable.

## Configuración privada en Vercel

`ANALYTICS_SUPABASE_URL` y `ANALYTICS_SUPABASE_SECRET_KEY` pertenecen exclusivamente al servidor. No usar el prefijo NEXT_PUBLIC. La conexión de Supabase existente para autenticación es independiente y se conserva.

La tabla tiene RLS habilitado y ningún permiso para `anon` o `authenticated`. Solo `service_role` escribe y consulta. La clave secreta se guarda en Vercel; no se incluye en Git ni en respaldos de datos.

## Validación y migración

1. Aplicar `supabase/migrations/20260904_analytics_events.sql` una sola vez al proyecto nuevo.
2. Exportar ambas tablas completas de Airtable con su esquema y todos los registros. Guardar una copia privada en Drive.
3. Ejecutar `node scripts/migrate-analytics.mjs RUTA_AL_RESPALDO.json` con las dos variables privadas. Verifica cada identificador, campo normalizado y registro original completo.
4. Publicar y comprobar eventos reales de ambas webs. Repetir la exportación y migración para incluir lo que entró durante el cambio.
5. Solo después de verificar, retirar de Airtable los identificadores exactos respaldados. Conservar las tablas vacías para facilitar una eventual vuelta atrás.

Pruebas del receptor: `node --test scripts/analytics.test.mjs` (Node 24).

La clave primaria `(source,event_id)` evita duplicar reintentos. Los eventos históricos conservan su ID de Airtable y el objeto original completo. Un clic de descarga no acredita una descarga terminada; eventos enviados por el navegador como `payment` no acreditan cobros.

## Consultas y respaldo

Consultar desde el panel SQL de Supabase o desde su API con la clave privada. Ejemplo diario en hora argentina:

```sql
select source, (occurred_at at time zone 'America/Argentina/Cordoba')::date as fecha,
       event, count(*) as eventos, count(distinct nullif(visitor_id,'')) as visitantes
from public.analytics_events
group by 1,2,3 order by 2 desc,1,3;
```

El plan Free no incluye copias automáticas. Mantener exportaciones privadas en Drive antes de cualquier limpieza. No se ha programado una tarea automática. No volver a publicar el receptor anterior que escribe en Airtable sin planificar un corte y reconciliar ambos destinos.
