import { useEffect, useRef, useState } from "react";
import {createMasterFilters,type FilterValues} from "./master-filters";
import { protectPeaks, SPEAKER_CEILING } from "./peak-protection";
import { setOutputVolume } from "./output-volume";

// The score clock is suspended during a pause. Only manual input from the
// selected scene reaches this output; scheduled music and recorders stay frozen.
export function usePausedSceneOutput(score: AudioContext | null, volume: number, synthVolume: number, filters:FilterValues) {
  const [output, setOutput] = useState<{ score: AudioContext; gain: GainNode; volume:GainNode; rack:ReturnType<typeof createMasterFilters> } | null>(null);
  const level = useRef(volume);
  level.current = volume;
  const synthLevel = useRef(synthVolume);
  synthLevel.current = synthVolume;
  const filterValues=useRef(filters);
  filterValues.current=filters;
  useEffect(() => {
    if (!score) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.value = synthLevel.current / 100;
    const master=context.createGain();
    master.gain.value = level.current / 100;
    const rack=createMasterFilters(gain,master,filterValues.current);
    const limit = protectPeaks(master, SPEAKER_CEILING);
    limit.connect(context.destination);
    setOutput({ score, gain, volume:master, rack });
    void context.resume().catch(() => {});
    return () => {
      rack.dispose(); master.disconnect(); limit.disconnect();
      void context.close().catch(() => {});
      setOutput(null);
    };
  }, [score]);
  useEffect(() => {
    if (output && output.score === score) {
      output.volume.gain.setTargetAtTime(volume / 100, output.volume.context.currentTime, .012);
    }
  }, [output, score, volume]);
  useEffect(() => {
    if (output && output.score === score) setOutputVolume(output.gain, synthVolume);
  }, [output, score, synthVolume]);
  useEffect(() => { output?.rack.apply(filters); },[output,filters]);
  return output?.score === score ? output?.gain ?? null : null;
}
