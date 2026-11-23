import { interpolateTuning, OCTAVE_NOTES, tuningAt, type FrequencyVector } from "./frequency-tuning";

export const CONTINUATION_SCENES = [
  { mode: "cross", title: "Escena 4 → 5", seconds: 9 },
  { mode: "sphere", title: "Escena 5 → 6", seconds: 12 },
  { mode: "noise", title: "Escena 6 → 7", seconds: 10 },
  { mode: "return", title: "Escena 7 → 8", seconds: 8 },
  { mode: "breath", title: "Escena 8 → 9", seconds: 6 },
] as const;

export type ContinuationScene = typeof CONTINUATION_SCENES[number]["mode"];
export type TimedScene = { scene: ContinuationScene; startsAt: number; seconds: number };

export const NOISE_COLORS = {
  white: { label: "Blanco", hue: 225, saturation: 12, slope: 0 },
  pink: { label: "Rosa", hue: 332, saturation: 67, slope: -1 },
  blue: { label: "Azul", hue: 220, saturation: 80, slope: 1 },
  brown: { label: "Marrón", hue: 24, saturation: 56, slope: -2 },
} as const;

export type NoiseColor = keyof typeof NOISE_COLORS;
export type NoisePair = { from: NoiseColor; to: NoiseColor };
export const NOISE_IDS = Object.keys(NOISE_COLORS) as NoiseColor[];
export const DEFAULT_PAIR: NoisePair = { from: "white", to: "pink" };

export const CROSS_CUE = { enter: 0.12, morph: 0.26, formed: 0.90 };
export const SPHERE_CUE = { gather: 0.08, grouped: 0.36, pullback: 0.51, white: 0.88 };
export const NOISE_CUE = { spread: 0.08, spreadOut: 0.30, connect: 0.36, connected: 0.87 };
export const RETURN_CUE = { linked: 0.13, gather: 0.18, combined: 0.50, grouped: 0.80, white: 0.94 };
export const BREATH_CUE = { pullback: 0.08, revealed: 0.79 };

// Provisional endpoint for the preview, C in three octaves.
export const NEXT_NOTES: FrequencyVector = [130.8128, 261.6256, 523.2511];
export const crossTuningAt = (progress: number) => interpolateTuning(OCTAVE_NOTES, NEXT_NOTES, progress);

// Every object in the gallery has a corresponding chord in the mix.
export const SCENE_SYMBOLS = Array.from({ length: 12 }, (_, index) => {
  const vertical = index < 6;
  const progress = vertical ? index / 5 : (index - 5) / 6;
  return { vertical, progress, notes: vertical ? tuningAt(progress) : crossTuningAt(progress) };
});

export function sceneProgress(progress: number, from: number, to: number) {
  return Math.max(0, Math.min(1, (progress - from) / (to - from)));
}
