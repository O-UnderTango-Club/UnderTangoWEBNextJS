// Keep the same listening level for the score and the paused scene instrument.
export const SPEAKER_CEILING = 0.4;
export const RECORDING_CEILING = 0.8;

const curves = new Map<number, Float32Array<ArrayBuffer>>();
export function protectPeaks(input: AudioNode, ceiling: number) {
  const ctx = input.context;
  const scale = ctx.createGain();
  const shaper = ctx.createWaveShaper();
  // Map +/-16 into the shaper domain so hot sums retain a gradual knee.
  scale.gain.value = 1 / 16;
  let curve = curves.get(ceiling);
  if (!curve) {
    curve = new Float32Array(65537);
    const knee = ceiling * 0.7;
    for (let i = 0; i < curve.length; i++) {
      const x = 16 * (2 * i / (curve.length - 1) - 1);
      const a = Math.abs(x);
      curve[i] = a <= knee ? x : Math.sign(x) *
        (knee + (ceiling - knee) * Math.tanh((a - knee) / (ceiling - knee)));
    }
    curves.set(ceiling, curve);
  }
  shaper.curve = curve;
  input.connect(scale).connect(shaper);
  return shaper;
}
