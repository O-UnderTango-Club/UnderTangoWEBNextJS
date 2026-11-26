import { harmonicFrequencyAt } from "./frequency-tuning";
import { SHOW_EXTENDED_SECONDS } from "./show-score";

export const LIVE_SET_SCENES = [32,33,34,35,36,37,38,39,40,41,43,44,46,47,48,49,50,51,52,53,54,55,56,57,58,59,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89] as const;
export type LiveSetScene = typeof LIVE_SET_SCENES[number];
export const EXTENDED_SCENES = [
  15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,
  41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,
  67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,
  93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,
] as const;
export type ExtendedScene = typeof EXTENDED_SCENES[number];
export function isLiveSetScene(scene: ExtendedScene | null): scene is LiveSetScene {
  return (LIVE_SET_SCENES as readonly (number|null)[]).includes(scene);
}
export const TIMBRE_NAMES = {
  20: "Armónicos", 21: "Filtro resonante", 22: "Saturación", 23: "Trémolo", 24: "Modulación en anillo",
  25: "Chorus", 26: "Flanger", 27: "Phaser", 28: "Eco", 29: "Reverberación", 30: "Ecos en estéreo", 31: "Ondas concéntricas", 42: "El punto pensado", 45: "Espiral expansiva", 60: "Primera voluntad · Hardstyle", 61: "Seguimos de pie", 62: "Letras de pie",
} as const;
export type TimbreScene = keyof typeof TIMBRE_NAMES;
export const EXTENDED_DEFAULT_SECONDS: Record<ExtendedScene, number> = SHOW_EXTENDED_SECONDS;
export function isTimbreScene(scene: ExtendedScene | null): scene is TimbreScene {
  return scene !== null && Object.prototype.hasOwnProperty.call(TIMBRE_NAMES,scene);
}

export const CUBE_TRACKS = [0, 1, 2] as const;
export type CubeTrack = typeof CUBE_TRACKS[number];
export const CUBE_TRACK_NAMES = ["Izquierda", "Centro", "Derecha"] as const;
export const MATRIX_ORDER = [1, 2, 3, 7, 8, 0, 4, 5, 6] as const;
export const FACE_NAMES = ["Frente", "Derecha", "Superior"] as const;
const PITCHES = ["Do", "Do♯", "Re", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si"];
export const CUBE_FIRST_MIDI = 21;
export const CUBE_SIZE = 27;
export const DEFAULT_A4 = 444;

export const temperedFrequency = (midi: number, a4: number) => a4 * 2 ** ((midi - 69) / 12);
export const pitchName = (midi: number) => `${PITCHES[midi % 12]}${Math.floor(midi / 12) - 1}`;

// Outside the 81 assigned keys, repeat the outer cube as on the performance keyboard.
export function cubeIndexForMidi(midi: number) {
  const offset = midi - CUBE_FIRST_MIDI;
  const track = Math.max(0, Math.min(CUBE_TRACKS.length - 1, Math.floor(offset / CUBE_SIZE)));
  const key = ((offset % CUBE_SIZE) + CUBE_SIZE) % CUBE_SIZE;
  return track * CUBE_SIZE + key;
}

export type CubeKey = { frequency: number; midi: number; label: string };
export function getCubeKeys(tempered: boolean, a4: number) {
  return CUBE_TRACKS.map((track) => FACE_NAMES.map((_, face) =>
    Array.from({ length: 9 }, (_, index): CubeKey => {
      const offset = track * CUBE_SIZE + face * 9 + index;
      const midi = CUBE_FIRST_MIDI + offset;
      const frequency = tempered ? temperedFrequency(midi, a4) : harmonicFrequencyAt(offset);
      return { frequency, midi, label: tempered ? pitchName(midi) : String(frequency) };
    })));
}
