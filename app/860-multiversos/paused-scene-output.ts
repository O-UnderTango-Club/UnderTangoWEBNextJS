import { useEffect, useRef, useState } from "react";
import { protectPeaks, SPEAKER_CEILING } from "./peak-protection";

// The score clock is suspended during a pause. Only manual input from the
// selected scene reaches this output; scheduled music and recorders stay frozen.
export function usePausedSceneOutput(score: AudioContext | null, volume: number) {
  const [output, setOutput] = useState<{ score: AudioContext; gain: GainNode } | null>(null);
  const level = useRef(volume);
  level.current = volume;
  useEffect(() => {
    if (!score) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = level.current / 100;
    const limit = protectPeaks(gain, SPEAKER_CEILING);
    limit.connect(context.destination);
    setOutput({ score, gain });
    void context.resume().catch(() => {});
    return () => {
      gain.disconnect(); limit.disconnect();
      void context.close().catch(() => {});
      setOutput(null);
    };
  }, [score]);
  useEffect(() => {
    if (output && output.score === score) {
      output.gain.gain.setTargetAtTime(volume / 100, output.gain.context.currentTime, .012);
    }
  }, [output, score, volume]);
  return output?.score === score ? output?.gain ?? null : null;
}
