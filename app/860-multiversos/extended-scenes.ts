export const LIVE_SET_SCENES = [32,33,34,35,36,37,38,39,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89] as const;
export type LiveSetScene = typeof LIVE_SET_SCENES[number];
export const EXTENDED_SCENES = [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,...LIVE_SET_SCENES.slice(0,8),42,45,60,61,62,...LIVE_SET_SCENES.slice(8)] as const;
export type ExtendedScene = typeof EXTENDED_SCENES[number];
export function isLiveSetScene(scene: ExtendedScene | null): scene is LiveSetScene {
  return scene !== null && (scene >= 32 && scene <= 39 || scene >= 63);
}
export type TimbreScene = Exclude<ExtendedScene, 15 | 16 | 17 | 18 | 19 | LiveSetScene>;
export const TIMBRE_NAMES: Record<TimbreScene, string> = {
  20: "Armónicos", 21: "Filtro resonante", 22: "Saturación", 23: "Trémolo", 24: "Modulación en anillo",
  25: "Chorus", 26: "Flanger", 27: "Phaser", 28: "Eco", 29: "Reverberación", 30: "Ecos en estéreo", 31: "Ondas concéntricas", 42: "El punto pensado", 45: "Espiral expansiva", 60: "Primera voluntad · Hardstyle", 61: "Seguimos de pie", 62: "Letras de pie",
};
export const EXTENDED_DEFAULT_SECONDS: Record<ExtendedScene, number> = {
  15: 32, 16: 16, 17: 14, 18: 32, 19: 6,
  20: 15,21: 15,22: 15,23: 15,24: 15,25: 15,26: 15,27: 15,28: 15,29: 15,30: 15,31: 24,
  32: 40,33: 32,34: 32,35: 28,36: 24,37: 32,38: 28,39: 40,42: 42,45: 40,
  60: 24,61: 48,62: 24,63: 24,64: 24,65: 24,66: 24,67: 24,68: 32,69: 32,
  70: 32,71: 48,72: 32,73: 40,74: 40,75: 32,76: 40,77: 32,78: 48,79: 56,
  80: 32,81: 36,82: 32,83: 32,84: 36,85: 28,86: 32,87: 40,88: 180,89: 24,
};
export function isTimbreScene(scene: ExtendedScene | null): scene is TimbreScene {
  return scene !== null && Object.prototype.hasOwnProperty.call(TIMBRE_NAMES,scene);
}

export const CUBE_TRACKS = [0, 1, 2] as const;
export type CubeTrack = typeof CUBE_TRACKS[number];
export const CUBE_TRACK_NAMES = ["Izquierda", "Centro", "Derecha"] as const;
const HUNDREDS = [[1, 2, 3], [4, 5, 6], [6, 7, 8]] as const;
export const MATRIX_ORDER = [1, 2, 3, 7, 8, 0, 4, 5, 6] as const;
export const FACE_NAMES = ["Frente", "Derecha", "Superior"] as const;
const PITCHES = ["Do", "Do♯", "Re", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si"];
export const CUBE_FIRST_MIDI = 21;
export const CUBE_SIZE = 27;
export const DEFAULT_A4 = 444;

export const temperedFrequency = (midi: number, a4: number) => a4 * 2 ** ((midi - 69) / 12);
export const pitchName = (midi: number) => `${PITCHES[midi % 12]}${Math.floor(midi / 12) - 1}`;

export type CubeKey = { frequency: number; midi: number; label: string };
export function getCubeKeys(tempered: boolean, a4: number) {
  return CUBE_TRACKS.map((track) => HUNDREDS[track].map((hundreds, face) =>
    Array.from({ length: 9 }, (_, index): CubeKey => {
      const midi = CUBE_FIRST_MIDI + track * CUBE_SIZE + face * 9 + index;
      const custom = hundreds === 3 && index === 2 ? 383 : hundreds * 100 + (index + 1) * 11;
      return { frequency: tempered ? temperedFrequency(midi, a4) : custom, midi, label: tempered ? pitchName(midi) : `${custom}` };
    })));
}
