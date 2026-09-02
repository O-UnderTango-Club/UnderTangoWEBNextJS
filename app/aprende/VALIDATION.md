# APRENDE — Validación 01

Inicio: 2026-08-17.

## Embudo medido

1. `page_view` — visita a la landing APRENDE.
2. `download_click` — clic en la guía gratuita.
3. Respuesta efectiva al Formulario Perfil APRENDE — conversión posterior a la guía.
4. Oferta del acompañamiento de 7 días.
5. Pago.

## Experiencia posterior al Perfil APRENDE

El Perfil APRENDE no es un examen, un diagnóstico clínico ni un test rígido de estilos de aprendizaje. Es la continuación de la experiencia de la guía y un punto de partida para observar qué recursos funcionaron, qué costó, qué quedó en la memoria y qué quiere mejorar la persona.

Recorrido definido antes de automatizar:

1. La persona termina la guía y abre el Perfil APRENDE.
2. Envía el formulario con su experiencia real.
3. Recibe una confirmación clara: sus respuestas fueron recibidas y serán leídas para preparar una devolución breve y personalizada.
4. La devolución se entrega por el canal de contacto informado en el formulario y contiene únicamente:
   - una observación sobre el recurso que mejor le funcionó;
   - una fricción o dificultad concreta que conviene trabajar;
   - una práctica breve recomendada para su próximo intento;
   - una pregunta abierta para precisar qué quiere aprender o mejorar.
5. Recién después de esa devolución, y si existe encaje, se puede invitar a la experiencia “7 días para aprender mejor”.

La devolución no asigna etiquetas permanentes ni promete resultados. Debe sentirse humana, específica y útil por sí misma. La oferta paga no aparece antes de completar el Perfil APRENDE y no se implementa en esta etapa.

Los eventos web de la primera etapa se registran en Airtable en la tabla `APRENDE — Eventos` con identificadores anónimos de visitante y sesión. No se guardan IP, nombre, email ni datos sensibles en este registro de eventos.

## Campaña inicial

Nombre: `APRENDE_VALIDACION_01`.

Convención UTM:

- `utm_source`: canal de origen, por ejemplo `threads`.
- `utm_medium`: `organic` para la primera cohorte.
- `utm_campaign`: `aprende_validacion_01`.
- `utm_content`: variante del mensaje, por ejemplo `hook_a`, `hook_b`, `hook_c`.

Durante la primera cohorte, la guía gratuita queda congelada salvo error funcional. Los cambios posteriores deben responder a evidencia del embudo, no a perfeccionamiento editorial previo.
