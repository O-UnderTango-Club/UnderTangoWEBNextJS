# Calendario público

La ruta `/usersCalendar` usa Google Calendar como fuente canónica de fechas y horarios. La interfaz mensual deriva categorías de los títulos y no expone descripciones internas del calendario.

La vista inicial incluye todas las categorías. Si los filtros ocultan todos los eventos, se informa cuántos hay publicados y se ofrece «Mostrar todos». Un mes sin eventos publicados tiene un aviso distinto. El pie indica los eventos visibles y el total cuando hay filtros activos; no reutiliza el total de otro mes durante la carga.
