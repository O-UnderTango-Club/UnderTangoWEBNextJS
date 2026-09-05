# Panel de control de frentes

Ruta privada: https://www.undertangoclub.com/panel-de-control

## Acceso y configuración

La sesión del sitio se verifica en el servidor con Supabase Auth `getUser` (endpoint `/auth/v1/user`). Sólo se admite un correo confirmado incluido en `PANEL_ALLOWED_EMAILS`; el valor inicial autorizado es `pablocieslik@gmail.com`. Registrarse en el sitio no concede acceso al panel. No se envían registros en el HTML ni se guardan datos de Airtable en el almacenamiento del navegador.

Vercel necesita `AIRTABLE_PANEL_TOKEN`, con `data.records:read` y `data.records:write`, limitado a la base `appJwwHP1Wkoxo54q`. Se usa una variable separada para no activar accidentalmente las rutas públicas antiguas de Airtable. También se reutilizan `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Las credenciales nunca se incluyen en código ni en variables públicas.

La ruta excluye el chat y las estadísticas del sitio y aplica CSP, noindex, no-store y prohibición de iframes. Acceso por navegación completa a la URL privada.

## Datos y reglas

- Proyectos conserva propósito, ciclo de vida, frente, ranking y documento. El panel obtiene sus acciones de Seguimientos, incluyendo relaciones indirectas por Casos. No escribe la antigua copia de “Estado de acción” ni “Próxima acción” del proyecto.
- Seguimientos es la única fuente editable de acciones. Disponible = Pendiente / Acción inmediata; En curso = En curso / En acción; En espera = En espera / En espera; Por catalogar = Pendiente / Por revisar; finalizada = Hecho / Terminada; descartada = Cancelado sin compuerta de ejecución.
- “Depende de” (`fldoqev0eaVgZVt6G`) es una relación entre seguimientos; “Eventos disparadores” relaciona hechos externos. Todas las dependencias deben resolverse. Un predecesor Cancelado o un evento Descartado requiere revisión. Se rechazan ciclos.
- Los hechos externos sólo cuentan como ocurridos con estado Ocurrido, fecha y evidencia. No se infiere una respuesta o pago de la fecha de revisión.
- Al resolverse todas las dependencias, una acción previamente En espera queda disponible en la vista calculada del panel. No se hace una escritura durante GET ni se inventa una nueva acción. La compuerta guardada se actualiza al iniciar o editar el estado. Los reportes externos que aún usan la compuerta literal deben adoptar esta misma regla.
- Hasta tres acciones disponibles por frente, una por proyecto principal, deduplicadas cuando se comparten. Se conserva la cola completa. Cada acción abierta aparece en una categoría y en Todas las acciones. Proyectos sin próximos pasos aparecen en Por catalogar.
- Los movimientos de ranking insertan la posición solicitada y mantienen el orden relativo del resto. No se cierra un proyecto con acciones abiertas.
- Finalizar requiere resultado; descartar requiere motivo. Ambos se añaden al historial sin borrar lo anterior.
- Se agregaron Orden en plan, Documento de apoyo y Control del panel (fórmula estructural en Airtable). La fórmula detecta casos comunes incluso con cambios directos. La validación de ciclos y resolución de relaciones vive en el servidor del panel.

## Sincronización y límites

La página consulta cada dos minutos mientras está visible; conserva una caché del servidor de 90 segundos y permite actualización manual. Las lecturas paginan todas las filas y seleccionan sólo campos operativos; Resultado no se descarga en cada refresco. Las escrituras hacen una lectura fresca, comparan la revisión del registro y vuelven a leer después de guardar. Ante un fallo no se reemplazan los datos por una copia fija ni se indica éxito sin confirmación.

Airtable no ofrece una transacción entre tablas o una actualización condicional atómica por revisión. El control de concurrencia reduce sobreescrituras pero conserva una pequeña ventana entre lectura y escritura, especialmente si se edita directamente en Airtable. El ranking usa lotes de hasta 10; si hay un fallo parcial se pide revisar Por catalogar.

Los textos largos históricos permanecen íntegros en Airtable hasta su migración verificada a Drive. El panel carga un extracto de descripción, conserva el historial y permite enlazar el documento canónico. La migración masiva y la adaptación del reporte externo no se dan por completadas con la publicación de esta interfaz.

## Verificación

`node scripts/panel.test.mjs` verifica reglas y operaciones del servidor con un adaptador simulado, sin tocar registros reales. `tsc --noEmit` verifica tipos. La compilación local en Windows encontró un fallo preexistente de `next/og` en `/shows/opengraph-image`; la compilación Linux de Vercel es la verificación final de despliegue. La edición real debe comprobarse una vez configurado el token y abierta la cuenta autorizada.
