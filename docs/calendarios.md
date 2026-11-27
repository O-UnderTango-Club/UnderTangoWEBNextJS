# Calendarios de UnderTango Club

## Agenda pública

La portada enlaza a [la agenda pública de UnderTango Club](https://www.undertangoclub.com/usersCalendar). Las rutas `/usersCalendar`, `/agenda` y `/api/calendario` comparten la cartelera editorial de `src/lib/public-calendar.ts`.

1. Confirmá la fecha y la sede en la agenda operativa de Supabase antes de preparar la difusión.
2. Una vez autorizada la difusión, agregá a la cartelera el título, la fecha local, la sede y el horario confirmado. Si el horario sigue pendiente, usá «Horario por confirmar». Subí el flyer a `public/images/agenda/` y agregá su texto alternativo.
3. Al publicar, revisá la portada, el mes del evento en la agenda y la respuesta de la API en una sesión sin iniciar. Para retirar una publicación, quitá su entrada de la cartelera y volvé a publicar.

La agenda web usa la zona horaria `America/Argentina/Cordoba`. Los flyers de eventos próximos aparecen arriba del calendario mensual.

## Agenda privada

La agenda de trabajo se consulta con acceso autorizado en [Red UnderTango](https://red.undertangoclub.com). Supabase, en `operativo.agenda_items`, conserva el registro de los compromisos. Google Calendar acompaña los compromisos con horario.

Marcá como privada toda la serie de una actividad recurrente reservada a huéspedes, al equipo o a invitados. Conservá su recurrencia y los registros operativos al retirar su difusión. Reservá las notas de producción, elenco y contactos para las superficies autenticadas. La API pública sirve exclusivamente las entradas aprobadas en la cartelera.
