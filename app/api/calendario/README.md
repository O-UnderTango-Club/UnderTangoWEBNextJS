# API de la agenda pública

`GET /api/calendario?year=YYYY&month=M` devuelve las publicaciones del mes en `events` y utiliza `source: "public-calendar"`. La respuesta conserva los campos `live`, `calendar`, `year`, `month` y `updatedAt`. Si se omite el mes o el año, usa la fecha actual de Argentina.

Los datos provienen de la cartelera editorial. Ver [protocolo de calendarios](../../../docs/calendarios.md).
