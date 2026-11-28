# Órganon de 860 Multiversos

## Archivo vigente

El mapa del operador se llama **Controles-860.json**. La partitura conserva una copia privada en el navegador del instrumento y el proyecto **Multiversos** enlaza su copia de trabajo en **Documento de apoyo** del panel UnderTango. Usá siempre el mismo archivo de Drive y su historial de versiones.

El [Órganon de la partitura](https://www.undertangoclub.com/860-multiversos/organon) muestra la fecha de revisión, el banco S1–S9 por función, el máster, las asignaciones históricas de síntesis, los transportes, las distribuciones MIDI, las teclas de computadora y los controles de la Hercules. El archivo guarda también los identificadores y alias necesarios para recuperar las asignaciones. Los niveles instantáneos de mezcla y las grabaciones pertenecen a la interpretación.

## Cada vez que se trabaje con 860

1. Abrí el Órganon en el perfil que Pablo usa para tocar y consultá la copia del proyecto. Compará las funciones, el dispositivo, el canal y el número de CC o nota. La fecha de la primera lectura de un perfil identifica la captura, no la fecha en que se movió un fader. Un perfil recién abierto puede carecer de asignaciones.
2. Tomá como referencia los últimos cambios de Pablo en ese instrumento. Si hay mapas distintos, cotejá el historial y las funciones que cambiaron antes de restaurar. Conservá las asignaciones existentes al editar la partitura, generar un ensayo local o publicar.
3. Al reasignar o quitar una tecla, un botón o un fader, comprobá el registro con su fecha, el valor anterior y el nuevo. Para los loops, revisá **Volumen**, **Play / stop** y las demás funciones de cada sample. Revisá también los cruces con el máster y síntesis. Dejá cualquier cruce a decisión del operador.
4. Al cerrar una sesión con cambios, descargá **Controles-860.json** del instrumento y reemplazá el contenido del archivo de Drive enlazado al proyecto, conservando su ID. Volvé a leer el archivo, comprobá la última asignación y registrá la verificación en el seguimiento de Multiversos. En sesiones sin cambios alcanza con cotejar la revisión.
5. Para recuperar el mapa en otro navegador o en una copia local, importá la copia vigente, revisá las diferencias y aplicala. Comprobá un fader de loop y un botón de transporte. Si cambió el orden de conexión USB, verificá que responda el dispositivo por su nombre y que el equipo que ocupa el puerto anterior conserve sus propias funciones. Las pruebas físicas se hacen en el ensayo. En pruebas de software usá un perfil descartable y dejá libre la sesión de Pablo.

En la lupera A9, el fader de volumen de un casillero vacío y disponible lo elige para la próxima grabación. En un casillero ocupado se puede mezclar, mutear o reproducir conservando el destino elegido. El nombre S1–S9 o el botón MIDI **Elegir destino** permite saltar a cualquier casillero disponible para grabar. La grabación manual empieza en S1 por defecto. Cada toma deja elegido el siguiente número, incluso si está ocupado, y después de S9 vuelve a S1. Verificá la vuelta de S9 a S1 con el banco lleno y el salto de S8 a S9 tras una selección manual.

El piano de Pablo tiene 66 teclas y comienza en MIDI 36. En las escenas con cubos cada semitono físico, incluidas las teclas negras, avanza una celda. Las caras tienen nueve teclas consecutivas y cada cubo ocupa 27. El selector de cubo corresponde a las teclas de computadora. En el tramo de 111 Hz la tecla física número n toca n × 111 Hz cuando la escena ofrece esa celda. En afinación temperada se mantiene la posición de las celdas. El Órganon guarda la primera tecla para otros teclados.

Hasta la escena 29 visible se conserva la afinación microtonal de 111 Hz. Bach acompaña el paso al temperamento igual en la escena 30 visible. La escena duplicada se retiró del recorrido. Los identificadores de las otras escenas se conservan para sus automatizaciones. Antes de Bach se alternan capas de instrumento y percusión, disparadas por el intérprete. Cada escena de percusión usa un único timbre con altura variable. En el tramo visible 17–30, **Grabar capa** inicia o termina la toma del instrumento aislado. El paso de escena también cierra esa toma. La duración de la escena puede editarse. El bloque electrónico posterior, identificado por las escenas 32–39 del archivo, conserva las tomas automáticas en S1–S8. El botón **▶ Todos** de la lupera tiene su propia asignación MIDI. Reanuda juntos los loops del banco en el pulso vigente y conserva sus volúmenes y silencios. El **Play general** sigue controlando la partitura.

Las luces, las ondas de la lupera y su reproducción comparten el origen del compás. **En vivo** registra el audio en el lugar del ciclo donde se tocó. Un sonido que entra en el segundo compás se dibuja y vuelve a sonar en ese compás. Probá también una toma que cruza del último compás al primero.

El teclado, MIDI y el botón de sonido tocan el instrumento de la escena indicada. Al pausar se puede tocar ese mismo instrumento mientras el reloj y las grabaciones esperan. Sin escena activa, el teclado queda en silencio.

**Stop general** tiene su propio botón MIDI junto al stop de la partitura. La primera pulsación pausa la escena en el punto actual. La segunda vuelve al inicio de la obra. Play entre ambas pulsaciones reanuda la escena y reinicia la secuencia de Stop. **Vaciar lupera** requiere dos pulsaciones del mismo botón dentro de tres segundos. Una pulsación muestra la confirmación. La segunda detiene el banco, cancela sus tomas en curso y libera S1 a S9, incluido el historial de deshacer de esas tomas. Verificá el stop y el vaciado con audio de prueba en un perfil descartable.

**Play general** inicia, pausa y reanuda la partitura desde el mismo punto, tanto en pantalla como con su control MIDI. **Pausa general** conserva su asignación junto a Pausar y siempre lleva a pausa. Al aprender un control, la nueva función reemplaza la que tenía ese mismo dispositivo, canal y señal. Verificá el cambio en el Órganon y comprobá ambos destinos.

El archivo se actualiza cuando cambian las asignaciones. Su historial conserva hasta 64 revisiones recientes por perfil. Los cambios de teclas incorporadas se registran al abrir la nueva versión de la partitura. Al modificar esos controles, actualizá la referencia en `control-map.ts` en el mismo cambio y verificá exportación, reapertura y recuperación.

## Ciclos de percusión en vivo

En las escenas visibles 63, 65, 66 y 71 cada pulsación del teclado MIDI o de las teclas musicales de la computadora dispara el siguiente punto sonoro del ciclo. El indicador circular se queda sobre el último punto hasta la próxima pulsación. Si coinciden varios timbres en un punto, suenan juntos. Probá la vuelta al primer golpe, una tecla sostenida y la continuidad del ciclo durante la pausa.

## Consola DJ

Los pads 1 y 2 pertenecen al deck A y los pads 3 y 4 al B. En **Temas guardados**, **Cargar en pad** asigna el tema elegido a uno de los cuatro pads. Con una escena en marcha, un toque lo reproduce y el siguiente lo pausa en su posición. Si su deck contiene otro tema, el pad lo reemplaza y el otro canal sigue sonando. El botón físico de carga prepara el otro pad de ese deck mientras está en pausa. El selector **Esc.** junto a cada botón MIDI dispara el tema de ese pad al entrar en la escena elegida. **0** deja el pad en modo manual. Los temas musicales automáticos pasan por estos selectores. Los botones **MIDI** aprenden los pads, el crossfader y los faders de volumen A y B. Al cambiar de puerto se usa el nombre del dispositivo cuando es único. Verificá en el Órganon que los siete controles y las asignaciones previas aparezcan en la exportación.

## Cámara y audiovisuales

La cámara empieza apagada al abrir 860 y se activa al entrar en la escena visible 60. **Mostrar cámara** controla la señal durante toda la función. Probá que siga al avanzar de escena y que apagarla libere la webcam.

**Activar audiovisuales** muestra clips mudos como capas sobre la proyección. Cada clip guarda su escena visible de inicio y su opacidad. La pieza de Ø Tango Rave entra después de la escena 60 y reacciona al sonido de la sala. Las grabaciones musicales siguen entrando por los pads de la consola DJ.

## Votación de la sala

El QR abre una página por función. Al entrar a las escenas de votación visibles 91, 95 y 99, esa misma página presenta una pregunta de pulso, timbre o color. El resultado de cada ronda se suma a los anteriores y se aplica al instrumento, al fraseo y a la proyección de la coda. Después de la tercera ronda la página muestra el cierre. Probá las tres rondas en una sola pestaña del público, el voto único por ronda y el avance manual de la partitura.

## Videos del piloto local

Cuando Pablo pida revisar material nuevo en `G:\00 - Inicio\860`, ejecutá `node scripts/piloto-860/revisar-clips.cjs` desde la raíz del piloto. Compara el contenido de los originales por SHA-256, incluso si se renombraron. Revisá la imagen y la pista de audio de cada incorporación y elegí la escena por su relación con lo que se proyecta y se toca.

Las asignaciones están en `scene-videos.json`. Cada uso indica escena, encuadre, opacidad y si el clip se repite. Guardá la copia de reproducción en `public/multiversos`, reconstruí el HTML del piloto y probá el fondo con la animación, la pausa, el máster y el cambio de escena. Luego ejecutá `node scripts/piloto-860/revisar-clips.cjs "G:\00 - Inicio\860" --escribir` para actualizar `Registro de clips de 860.txt` junto a los originales.

## Material de montaje

La guía pública está en `public/860-multiversos/materiales.html`. `npm run materiales:860` genera el ZIP desde la partitura y sus referencias audiovisuales. El armado público se ejecuta con `--publico` en cada build. Para comprobar una entrega, extraé el ZIP en otro perfil y tocá la escena 1 sin conexión. Las asignaciones personales se transportan con la exportación privada del Órganon.
