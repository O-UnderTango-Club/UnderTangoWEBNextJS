export function setOutputVolume(output: GainNode, volume: number) {
  const { context, gain } = output;
  const now = context.currentTime;
  const previousGain = gain.value;
  gain.cancelScheduledValues(now);
  if (context.state === "running") {
    gain.setValueAtTime(previousGain, now);
    gain.linearRampToValueAtTime(volume / 100, now + 0.025);
  } else {
    gain.setValueAtTime(volume / 100, now);
  }
}
