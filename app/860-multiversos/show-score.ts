// Original phase lengths are also used to recover older saved performances.
export const SHOW_TRANSITIONS = { pointHold: 2.5, lineHold: 4, trailTurn: 3 } as const;
export const SHOW_OPENING = { opening: 5, beacon: 12.5, line: 12, harmonics: 14, space: 9, time: 9, rest: 4 } as const;
export const SHOW_CONTINUATION = { cross: 8, sphere: 10, noise: 12, return: 7, breath: 6 } as const;
export const SHOW_NOTES = { ten: 9, eleven: 9, twelve: 13, thirteen: 16, fourteen: 22 } as const;

export const SHOW_INTERLUDES = {
  40: "Pulso residual", 41: "Contraluz", 43: "Eco de letras", 44: "Órbita",
  46: "Despliegue", 47: "Desfase", 48: "Espejo", 49: "Convergencia",
  50: "Umbral", 51: "Grano", 52: "Trama", 53: "Deriva", 54: "Interferencia",
  55: "Campo", 56: "Latido", 57: "Oleaje", 58: "Foco", 59: "Ascenso",
} as const;

export const CODA_SCENES = [
  90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101,
  102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
] as const;
export type CodaScene = typeof CODA_SCENES[number];

// Durations are seconds of the performance clock. Each row is a scene boundary,
// even when the tail of the previous instrument is still audible.
const cues = [
  [0, "El conjunto vacío · Ruido blanco", 10],
  [1, "La entidad mínima · Primer golpe", 15],
  [2, "Dos puntos · Del golpe al armónico", 19],
  [3, "Espacio", SHOW_OPENING.space],
  [4, "Tiempo y giro", SHOW_OPENING.time + SHOW_TRANSITIONS.trailTurn],
  [5, "Cruce", SHOW_CONTINUATION.cross],
  [6, "Esfera", SHOW_CONTINUATION.sphere],
  [7, "Los cuatro ruidos", SHOW_CONTINUATION.noise],
  [8, "Blanco y rosa", SHOW_CONTINUATION.return],
  [9, "La esfera en reposo", SHOW_CONTINUATION.breath + SHOW_OPENING.rest],
  [10, "Una nota · 111 Hz", SHOW_NOTES.ten],
  [11, "Dos notas · 111 y 999 Hz", SHOW_NOTES.eleven],
  [12, "Nueve alturas", SHOW_NOTES.twelve],
  [13, "El cubo", SHOW_NOTES.thirteen],
  [14, "Visor de acordes", SHOW_NOTES.fourteen],
  [15, "Tres visores melódicos", 25],
  [16, "Vibración y condición inicial", 10],
  [17, "De 111 Hz al temperamento igual", 10],
  [18, "Tres cubos · Semitonos", 20],
  [19, "El timbre", 6],
  [20, "Armónicos", 8], [21, "Filtro resonante", 8], [22, "Saturación", 8],
  [23, "Trémolo", 8], [24, "Modulación en anillo", 8], [25, "Chorus", 8],
  [26, "Flanger", 8], [27, "Phaser", 8], [28, "Eco", 8], [29, "Reverberación", 8],
  [30, "Ecos en estéreo", 12], [31, "Ondas concéntricas", 18],
  [32, "Bajo de pulso", 26], [33, "Pads abiertos", 23], [34, "Batería electrónica", 26],
  [35, "Arpegio", 18], [36, "Acordes cortos", 16], [37, "Bajo ácido", 20],
  [38, "Melodía de sierra", 20], [39, "Ensamble temperado · Entrada de Hardstyle", 27],
  [40, SHOW_INTERLUDES[40], 8], [41, SHOW_INTERLUDES[41], 8], [42, "El punto pensado", 18],
  [43, SHOW_INTERLUDES[43], 7], [44, SHOW_INTERLUDES[44], 8], [45, "Espiral expansiva", 18],
  [46, SHOW_INTERLUDES[46], 8], [47, SHOW_INTERLUDES[47], 8], [48, SHOW_INTERLUDES[48], 8],
  [49, SHOW_INTERLUDES[49], 8], [50, SHOW_INTERLUDES[50], 8], [51, SHOW_INTERLUDES[51], 8],
  [52, SHOW_INTERLUDES[52], 8], [53, SHOW_INTERLUDES[53], 8], [54, SHOW_INTERLUDES[54], 8],
  [55, SHOW_INTERLUDES[55], 8], [56, SHOW_INTERLUDES[56], 8], [57, SHOW_INTERLUDES[57], 8],
  [58, SHOW_INTERLUDES[58], 8], [59, SHOW_INTERLUDES[59], 12],
  [60, "Primera voluntad · Hardstyle", 22], [61, "Seguimos de pie · Público", 40],
  [62, "Letras de pie", 20], [63, "Dub", 13], [64, "House", 13], [65, "Garage", 13],
  [66, "Breakbeat", 13], [67, "Electro", 13], [68, "Techno · Cámara ASCII", 18], [69, "Trance", 18],
  [70, "Bombo psy", 22], [71, "Bajo rodante", 32], [72, "Contratiempo", 20],
  [73, "Ácido", 24], [74, "Arpegio Goa", 26], [75, "Percusión metálica", 18],
  [76, "Atmósfera", 20], [77, "Resonancia", 20], [78, "Lead en octavas", 26], [79, "Ensamble psy", 34],
  [80, "Contrabajo", 22], [81, "Bandoneón", 24], [82, "Marcato", 19], [83, "Cuerdas", 20],
  [84, "Milonga", 22], [85, "Arrastre", 18], [86, "Bordoneo", 20], [87, "Ensamble de tango", 26],
  [88, "El último café · Piano y voz", 180], [89, "Ruido de la sala", 18],
  [90, "La sala respira", 10], [91, "La sala elige", 20], [92, "Primera votación", 28],
  [93, "Primer eco", 12], [94, "Estela", 8], [95, "Penumbra", 9],
  [96, "Segunda votación", 28], [97, "Segundo eco", 12], [98, "Resonancia", 8],
  [99, "Remanso", 9], [100, "Última votación", 28], [101, "Último eco", 12],
  [102, "Distancia", 8], [103, "Decantación", 8], [104, "Memoria", 8],
  [105, "Créditos", 14], [106, "Agradecimientos", 13], [107, "La Cabaña de los Muñecos", 11],
  [108, "Al público", 10], [109, "Última luz", 8], [110, "Reposo", 8], [111, "Fin", 7],
] as const;

export type ShowScene = typeof cues[number][0];
export type ShowCue = { number: ShowScene; title: string; seconds: number; start: number; end: number };

function buildScore(): ShowCue[] {
  let end = 0;
  return cues.map(([number, title, seconds]) => {
    const start = end;
    end += seconds;
    return { number, title, seconds, start, end };
  });
}

export const SHOW_SCORE = buildScore();
export const SHOW_SCENE_COUNT = SHOW_SCORE.filter(cue => cue.number > 0).length;
export const SHOW_TOTAL_SECONDS = SHOW_SCORE[SHOW_SCORE.length - 1].end;
export const SHOW_EXTENDED_SECONDS: Record<number, number> = Object.fromEntries(
  SHOW_SCORE.filter(cue => cue.number >= 15).map(cue => [cue.number, cue.seconds])
);
