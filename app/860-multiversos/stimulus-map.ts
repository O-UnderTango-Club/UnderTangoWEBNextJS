export type Stimulus = "audio" | "piano" | "tempo" | "clock" | "loop" | "camera" | "votes" | "tuning";

// These are inputs to the projected image. A keyboard driving the mix does
// not by itself make a spectrum drawing sensitive to individual key attacks.
export function visualStimuli(scene: number): readonly Stimulus[] {
  if (scene < 1 || scene > 111 || scene === 19 || scene === 90 || scene === 91) return [];
  if (scene === 1 || scene === 2) return ["piano", "clock"];
  if (scene <= 9 || scene === 16) return ["clock"];
  if (scene <= 12) return ["piano"];
  if (scene === 13) return ["piano", "clock"];
  if (scene === 17) return ["clock", "tuning"];
  if (scene === 31) return ["audio", "piano", "loop", "clock"];
  if (scene <= 30) return ["piano", "loop"];
  if (scene === 44 || scene === 54 || scene === 78) return ["audio", "piano", "tempo", "clock"];
  if (scene === 42 || scene === 62) return ["audio", "piano", "clock"];
  if (scene === 45) return ["audio", "piano", "loop", "clock"];
  if (scene === 60) return ["audio", "piano"];
  if (scene === 61) return ["camera", "audio", "piano"];
  if (scene === 68) return ["camera", "audio"];
  if (scene < 80) return ["audio", "tempo"];
  if (scene < 90) return ["audio"];
  return ["votes"];
}
