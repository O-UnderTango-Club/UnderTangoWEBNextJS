# Calendario público

La ruta `/usersCalendar` usa Google Calendar como fuente canónica de fechas y horarios. La interfaz mensual deriva categorías de los títulos y no expone descripciones internas del calendario.

La vista inicial incluye todas las categorías. Si los filtros ocultan todos los eventos, se informa cuántos hay publicados y se ofrece «Mostrar todos». Un mes sin eventos publicados tiene un aviso distinto. El pie indica los eventos visibles y el total cuando hay filtros activos; no reutiliza el total de otro mes durante la carga.

Solo las tarjetas de shows y clases abren el WhatsApp de UnderTango (`5493757618270`) con una consulta que identifica evento, fecha, horario cuando corresponda y lugar. Los ensayos y otros eventos son informativos y no muestran el enlace de consulta. La fecha se toma del día del calendario, sin convertir zonas horarias; los eventos sin horario conservan esa condición. El mensaje queda preparado para que el visitante lo revise y envíe.
