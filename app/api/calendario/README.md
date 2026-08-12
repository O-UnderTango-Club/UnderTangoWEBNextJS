# API de calendario

`GET /api/calendario?year=YYYY&month=M` lee el feed ICS público del calendario `UnderTango Club` (`undertangoclub@gmail.com`), expande recurrencias y devuelve sólo datos seguros para la agenda web: título, fecha/hora, ubicación y categoría.

No se exponen descripciones de Google Calendar, donde puede existir información operativa interna.
