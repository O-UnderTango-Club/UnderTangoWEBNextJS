# Órganon de 860 Multiversos

## Archivo vigente

El mapa del operador se llama **Controles-860.json**. La partitura conserva una copia privada en el navegador del instrumento y el proyecto **Multiversos** enlaza su copia de trabajo en **Documento de apoyo** del panel UnderTango. Usá siempre el mismo archivo de Drive y su historial de versiones.

El [Órganon de la partitura](https://www.undertangoclub.com/860-multiversos/organon) muestra la fecha de revisión, el banco S1–S9 por función, el máster, los faders de síntesis, los transportes, las distribuciones MIDI, las teclas de computadora y los controles de la Hercules. El archivo guarda también los identificadores y alias necesarios para recuperar las asignaciones. Los niveles instantáneos de mezcla y las grabaciones pertenecen a la interpretación.

## Cada vez que se trabaje con 860

1. Abrí el Órganon en el perfil que Pablo usa para tocar y consultá la copia del proyecto. Compará las funciones, el dispositivo, el canal y el número de CC o nota. La fecha de la primera lectura de un perfil identifica la captura, no la fecha en que se movió un fader. Un perfil recién abierto puede carecer de asignaciones.
2. Tomá como referencia los últimos cambios de Pablo en ese instrumento. Si hay mapas distintos, cotejá el historial y las funciones que cambiaron antes de restaurar. Conservá las asignaciones existentes al editar la partitura, generar un ensayo local o publicar.
3. Al reasignar o quitar una tecla, un botón o un fader, comprobá el registro con su fecha, el valor anterior y el nuevo. Para los loops, revisá **Volumen**, **Play / stop** y las demás funciones de cada sample. Revisá también los cruces con el máster y síntesis. Dejá cualquier cruce a decisión del operador.
4. Al cerrar una sesión con cambios, descargá **Controles-860.json** del instrumento y reemplazá el contenido del archivo de Drive enlazado al proyecto, conservando su ID. Volvé a leer el archivo, comprobá la última asignación y registrá la verificación en el seguimiento de Multiversos. En sesiones sin cambios alcanza con cotejar la revisión.
5. Para recuperar el mapa en otro navegador o en una copia local, importá la copia vigente, revisá las diferencias y aplicala. Comprobá un fader de loop y un botón de transporte. Las pruebas físicas se hacen en el ensayo. En pruebas de software usá un perfil descartable y dejá libre la sesión de Pablo.

El archivo se actualiza cuando cambian las asignaciones. Su historial conserva hasta 64 revisiones recientes por perfil. Los cambios de teclas incorporadas se registran al abrir la nueva versión de la partitura. Al modificar esos controles, actualizá la referencia en `control-map.ts` en el mismo cambio y verificá exportación, reapertura y recuperación.
