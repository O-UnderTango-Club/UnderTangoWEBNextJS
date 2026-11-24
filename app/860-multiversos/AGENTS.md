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

En la lupera A9, el fader de volumen de un casillero vacío y disponible lo elige para la próxima grabación. En un casillero ocupado se puede mezclar, mutear o reproducir conservando el destino elegido. Para regrabarlo manualmente, pulsá el nombre S1–S9 o el botón MIDI asignado a **Elegir destino**. Después de grabar, la lupera busca el siguiente casillero libre. Con el banco lleno, la grabación manual requiere elegir expresamente el destino. Verificá esta regla moviendo el fader de un sample ya grabado antes de la siguiente toma.

Las escenas 32 a 39 graban en S1 a S8 respectivamente. Verificá el reemplazo con los nueve casilleros ocupados y la recuperación de la toma anterior. El botón **▶ Todos** de la lupera tiene su propia asignación MIDI. Reinicia juntos los loops del banco y conserva sus volúmenes y silencios. El **Play general** sigue controlando la partitura.

El teclado, MIDI y el botón de sonido tocan el instrumento de la escena indicada. Al pausar se puede tocar ese mismo instrumento mientras el reloj y las grabaciones esperan. Sin escena activa, el teclado queda en silencio.

**Stop general** tiene su propio botón MIDI junto al stop de la partitura. **Vaciar lupera** requiere dos pulsaciones del mismo botón dentro de tres segundos. Una pulsación muestra la confirmación. La segunda detiene el banco, cancela sus tomas en curso y libera S1 a S9, incluido el historial de deshacer de esas tomas. Verificá el stop y el vaciado con audio de prueba en un perfil descartable.

El archivo se actualiza cuando cambian las asignaciones. Su historial conserva hasta 64 revisiones recientes por perfil. Los cambios de teclas incorporadas se registran al abrir la nueva versión de la partitura. Al modificar esos controles, actualizá la referencia en `control-map.ts` en el mismo cambio y verificá exportación, reapertura y recuperación.
