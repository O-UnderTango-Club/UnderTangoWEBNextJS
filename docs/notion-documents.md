# Documentos de Notion en UnderTango

Regla canónica: [Documentos Notion → web](https://github.com/O-UnderTango-Club/undertango-operating-system/blob/main/PROTOCOLO_DOCUMENTOS_NOTION_WEB.md).

El texto se edita en Notion. Este repositorio conserva el lector y la asociación explícita entre página y ruta, sin copias de los textos o imágenes como contenido editable.

## Documentos publicados

- Fuente: [Revisión de diapositivas y discurso](https://app.notion.com/p/3eae2fde62f881c09602e7e2b7c2636a).
- Ruta: `/80/diapositivas-y-discurso`, enlazada desde `/80-startup-undertango`; `/80` redirige al departamento.
- Configuración: `src/lib/notion-document.ts`. No se acepta un ID de página desde parámetros públicos.

- Fuente: [One-pager ÉLITROS](https://app.notion.com/p/3eae2fde62f88169acd5ed407396432d).
- Sección: `/elitros#onepager` (también `#one-pager`), dentro de la página existente.
- El encabezado y los siete apartados se leen de Notion: los títulos de nivel 3 abren tarjetas; un separador después de las tarjetas abre el pie. Se conserva el orden y los bloques adicionales. El formato visual está en `app/elitros/onepager.module.css`.
- La descarga `UnderTango-One-Pager-2026-09-29.pdf` es una instantánea fechada del documento aprobado el 29/09/2026. No es la fuente editable ni se regenera con cada cambio de Notion.

## Trabajo VTeIE

- Fuente: [UnderTango · VTeIE — app y red productiva](https://app.notion.com/p/3eae2fde62f8817e979cc36efb716648).
- Ruta: `/80/vigilancia-tecnologica`, enlazada desde `/elitros` y `/80-startup-undertango`.
- Usa el lector existente y una asociación explícita de página. El contenido completo y el índice se obtienen de Notion; no hay copia editorial en el repositorio.
- La ruta es pública y tiene `noindex`. Las ediciones aparecen al recargar, una vez que la API de Notion refleja los cambios. No se envía el trabajo al programa ni a Padlet al publicarlo aquí.
- La conexión de lectura del servidor necesita acceso a esta página además de los documentos anteriores.

## Conexión de lectura

Crear una conexión interna de Notion con capacidad **Read content**, sin escritura, comentarios ni información de usuarios. Darle acceso sólo al documento publicado. Guardar su credencial como `NOTION_API_KEY` en el entorno del servidor de Vercel (producción y preview si corresponde). Para desarrollo usar `.env.local`, que no se versiona. Nunca usar `NEXT_PUBLIC_` ni exponer el secreto en logs o respuestas.

La conexión del asistente a Notion es independiente de esta credencial del servidor. No afirmar que el sitio está conectado hasta probarlo con la credencial y los permisos reales.

## Lectura y límites

La implementación consulta la API oficial en cada solicitud, sin caché persistente de texto ni enlaces temporales de imágenes. Una edición aparece al recargar o volver a abrir la página, siempre que la API ya refleje ese cambio. Una pestaña abierta no se actualiza sola. La consulta de permisos y estado precede a la lectura: una página archivada, eliminada o inaccesible no se muestra desde una copia local.

Se usa la versión estable `2022-06-28` de los endpoints de páginas y bloques; no se usan bases de datos. Hay paginación de 100 bloques y límites de 1000 bloques y 8 niveles para evitar respuestas incompletas o recorridos ilimitados. Los tipos admitidos incluyen párrafos, títulos, imágenes, listas, citas, llamadas, tareas, desplegables, tablas y código. Los bloques no admitidos muestran un aviso con enlace al original. Las subpáginas, bases y bloques sincronizados no se recorren automáticamente.

Los errores muestran una salida limitada con enlace al documento. Los permisos de Notion siguen aplicándose al abrir ese enlace. La API no recibe URLs elegidas por el visitante; el lector no inserta HTML crudo ni ejecuta código de Notion. La página de revisión tiene `noindex`, que no constituye control de acceso: la ruta web es pública cuando está conectada.

## Validación antes de publicar

1. Ejecutar `node scripts/notion-document.test.cjs` y el chequeo de TypeScript / build del proyecto.
2. Comprobar título, todos los párrafos y cinco imágenes contra Notion, en escritorio y móvil.
3. Editar una frase de prueba en Notion, recargar la web, verificarla y restaurar el original.
4. Verificar ausencia de credencial, errores de permisos y ausencia de secretos en HTML.
5. Revisar preview, publicar y comprobar la ruta de producción. Registrar la evidencia en el seguimiento existente de Supabase.

Los cambios editoriales se hacen en la fuente. La publicación queda pendiente mientras falte configurar y verificar la conexión.
