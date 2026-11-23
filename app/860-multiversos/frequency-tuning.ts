export type FrequencyVector = [x: number, y: number, z: number];

export const ORIGINAL_NOTES: FrequencyVector = [111, 222, 333];
export const OCTAVE_NOTES: FrequencyVector = [220, 440, 880];

export function interpolateTuning(from: FrequencyVector, to: FrequencyVector, progress: number): FrequencyVector {
  return from.map((hz, index) => hz * (to[index] / hz) ** progress) as FrequencyVector;
}

export function tuningAt(progress: number): FrequencyVector {
  return interpolateTuning(ORIGINAL_NOTES, OCTAVE_NOTES, progress);
}

export function frequencyPoint(t: number, notes: FrequencyVector) {
  return {
    x: Math.sin(t * notes[0] / 111),
    y: Math.sin(t * notes[1] / 111 + 0.7),
    z: Math.sin(t * notes[2] / 111 + 1.2),
  };
}
