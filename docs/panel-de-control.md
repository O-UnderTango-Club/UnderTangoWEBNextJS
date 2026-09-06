# Panel de control de frentes

Ruta privada: https://www.undertangoclub.com/panel-de-control

## Acceso y configuración

El botón transparente de 48 × 48 píxeles en la esquina inferior derecha abre la ruta privada. El navegador de Pablo se habilita una vez con una cookie firmada, HttpOnly, Secure, SameSite=Strict, restringida al host y con duración de 90 días. Abrir el botón o conocer la ruta no concede acceso a los datos. El panel no depende de Supabase; el servidor conserva la validación del antiguo Bearer como compatibilidad, pero la página ya no la usa. No se envían registros en el HTML ni se guardan datos de Airtable en el almacenamiento persistente del navegador.

Vercel necesita `AIRTABLE_PANEL_TOKEN`, con `data.records:read` y `data.records:write`, limitado a la base `appJwwHP1Wkoxo54q`. Se usa una variable separada para no activar accidentalmente las rutas públicas antiguas de Airtable. Una clave HMAC con dominio dedicado deriva de ese secreto para firmar las sesiones; el token de Airtable nunca sale del servidor. Rotar el token revoca todas las sesiones. No incluir credenciales en código ni variables públicas.

La habilitación inicial admite un archivo local con un secreto aleatorio de 256 bits. Sólo su SHA-256 y un vencimiento corto se publican en `panel-bootstrap.ts`; después de habilitar el navegador se retira el permiso temporal y se elimina el archivo local. La sesión ya emitida continúa funcionando. Para otro navegador hace falta una nueva habilitación autorizada. POST y DELETE exigen origen exacto y JSON; los datos y cookies no se exponen a otros orígenes. DELETE `/api/panel/access` elimina la sesión del navegador. Borrar las cookies también elimina el acceso.

La ruta excluye el chat y las estadísticas del sitio y aplica CSP, noindex, no-store y prohibición de iframes. Acceso por navegación completa a la URL privada.

## Controles directos

Cada tarjeta distingue el proyecto de la acción. El botón Frente y posición abre un editor corto con frente y número: 1.3 significa Primario, posición 3; 2.2 significa Secundario, posición 2. Para acciones compartidas se muestra un control por cada proyecto abierto. Mover un proyecto conserva los estados de sus acciones y reordena las posiciones existentes.

El ranking muestra si cada proyecto tiene una acción inmediata y ofrece Ver acciones, que filtra por el vínculo real del proyecto. El editor de posición advierte cuando moverlo no bastará para mostrarlo. Frentes explica los puestos 1–3 sin acción inmediata en un apartado separado con acceso a sus acciones o a definir el próximo paso. Los estados contradictorios y las esperas sin vínculo siguen excluidos hasta revisarlos; no se reactivan automáticamente por cambiar el ranking.

Cambiar estado abre un editor corto. Sólo Acción inmediata ocupa Frentes; En curso, En espera y Por catalogar tienen sus propias pestañas, y Finalizada/Descartada quedan en Historial. Una acción sólo sale después de confirmar el guardado. En espera exige una dependencia pendiente real; pueden elegirse acciones o hechos y registrarse un nuevo hecho desde el mismo editor. Crear un hecho lo registra en Disparadores, y guardar el estado lo vincula a la acción. Finalizar o descartar requiere evidencia.

## Datos y reglas

- Proyectos conserva propósito, ciclo de vida, frente, ranking y documento. El panel obtiene sus acciones de Seguimientos, incluyendo relaciones indirectas por Casos. No escribe la antigua copia de “Estado de acción” ni “Próxima acción” del proyecto.
- Seguimientos es la única fuente editable de acciones. Disponible = Pendiente / Acción inmediata; En curso = En curso / En acción; En espera = En espera / En espera; Por catalogar = Pendiente / Por revisar; finalizada = Hecho / Terminada; descartada = Cancelado sin compuerta de ejecución.
- “Depende de” (`fldoqev0eaVgZVt6G`) es una relación entre seguimientos; “Eventos disparadores” relaciona hechos externos. Todas las dependencias deben resolverse. Un predecesor Cancelado o un evento Descartado requiere revisión. Se rechazan ciclos.
- Los hechos externos sólo cuentan como ocurridos con estado Ocurrido, fecha y evidencia. No se infiere una respuesta o pago de la fecha de revisión.
- Al resolverse todas las dependencias, una acción previamente En espera queda disponible en la vista calculada del panel. No se hace una escritura durante GET ni se inventa una nueva acción. La compuerta guardada se actualiza al iniciar o editar el estado. Los reportes externos que aún usan la compuerta literal deben adoptar esta misma regla.
- Sólo se muestran acciones inmediatas cuyo proyecto principal ocupa una posición entera de 1 a 3 en ese frente, una acción por proyecto y deduplicadas cuando se comparten. Los proyectos desde la posición 4 quedan en la cola aunque su acción sea inmediata. Una espera o un puesto vacío dentro del rango no se rellena con puestos posteriores. Se conserva la cola completa; Ver ranking permite promover o bajar proyectos directamente. Cada acción abierta aparece en una categoría y en Todas las acciones. Proyectos sin próximos pasos aparecen en Por catalogar.
- Los movimientos de ranking insertan la posición solicitada y mantienen el orden relativo del resto. Mover 1.1 a 1.4 desplaza los antiguos puestos 2, 3 y 4 a 1, 2 y 3. No se cierra un proyecto con acciones abiertas.
- Finalizar requiere resultado; descartar requiere motivo. Ambos se añaden al historial sin borrar lo anterior.
- Se agregaron Orden en plan, Documento de apoyo y Control del panel (fórmula estructural en Airtable). La fórmula detecta casos comunes incluso con cambios directos. La validación de ciclos y resolución de relaciones vive en el servidor del panel.

## Sincronización y límites

La página consulta cada dos minutos mientras está visible; conserva una caché del servidor de 90 segundos y permite actualización manual. Las lecturas paginan todas las filas y seleccionan sólo campos operativos; Resultado no se descarga en cada refresco. Las escrituras hacen una lectura fresca, comparan la revisión del registro y vuelven a leer después de guardar. Ante un fallo no se reemplazan los datos por una copia fija ni se indica éxito sin confirmación.

Airtable no ofrece una transacción entre tablas o una actualización condicional atómica por revisión. El control de concurrencia reduce sobreescrituras pero conserva una pequeña ventana entre lectura y escritura, especialmente si se edita directamente en Airtable. El ranking usa lotes de hasta 10; si hay un fallo parcial se pide revisar Por catalogar.

Los textos largos históricos permanecen íntegros en Airtable hasta su migración verificada a Drive. El panel carga un extracto de descripción, conserva el historial y permite enlazar el documento canónico. La migración masiva y la adaptación del reporte externo no se dan por completadas con la publicación de esta interfaz.

## Verificación

`node scripts/panel.test.mjs` verifica reglas y operaciones del servidor con un adaptador simulado, sin tocar registros reales. `tsc --noEmit` verifica tipos. La compilación local en Windows encontró un fallo preexistente de `next/og` en `/shows/opengraph-image`; la compilación Linux de Vercel es la verificación final de despliegue. La edición real debe comprobarse una vez configurado el token y abierta la cuenta autorizada.
