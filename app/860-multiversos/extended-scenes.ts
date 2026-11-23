export const EXTENDED_SCENES = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 45] as const;
export type ExtendedScene = typeof EXTENDED_SCENES[number];
export type TimbreScene = Exclude<ExtendedScene, 15 | 16 | 17 | 18 | 19>;
export const TIMBRE_NAMES: Record<TimbreScene, string> = {
  20: "Armónicos", 21: "Filtro resonante", 22: "Saturación", 23: "Trémolo", 24: "Modulación en anillo",
  25: "Chorus", 26: "Flanger", 27: "Phaser", 28: "Eco", 29: "Reverberación", 30: "Ecos en estéreo", 31: "Ondas concéntricas", 45: "Espiral expansiva",
};
export const EXTENDED_DEFAULT_SECONDS: Record<ExtendedScene, number> = {
  15: 0, 16: 16, 17: 14, 18: 0, 19: 6,
  20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0, 45: 0,
};
export function isTimbreScene(scene: ExtendedScene | null): scene is TimbreScene {
  return scene !== null && scene >= 20;
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
