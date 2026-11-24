import { useEffect, useRef, useState } from "react";
import { useSavedSetting } from "./saved-setting";
import type { ShowScene } from "./show-score";

type Excerpt = { title: string; file: string; entry: number; seconds: number };

export const REPERTOIRE: Partial<Record<ShowScene, Excerpt>> = {
  59: { title: "een vriend van Hakken uit Nederland", file: "/multiversos/repertorio-hakken.mp3", entry: 6, seconds: 5.106 },
  67: { title: "Un Cuerpo Musical Electrónico", file: "/multiversos/repertorio-cuerpo.mp3", entry: 1, seconds: 7.085 },
  79: { title: "trance psicomusical", file: "/multiversos/repertorio-trance.mp3", entry: 3, seconds: 13.241 },
  91: { title: "Quero Ver Quem Sente de Verdade", file: "/multiversos/repertorio-quero.mp3", entry: 1, seconds: 6.4 },
};

type Cue = { context: AudioContext; beginsAt: number };
const durationFormat = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });

export function RepertoireCue({ scene, clip, cue, output, seconds }: {
  scene: ShowScene; clip: Excerpt; cue: Cue | null; output: GainNode | null; seconds: number;
}) {
  const [enabled, setEnabled] = useSavedSetting("repertoire-" + scene, true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const duration = useRef(seconds);
  const setEnd = useRef<((end: number) => void) | null>(null);
  useEffect(() => {
    duration.current = seconds;
    if (cue) setEnd.current?.(cue.beginsAt + seconds);
  }, [seconds, cue]);

  useEffect(() => {
    setFailed(false);
    if (!cue || !output || !enabled || output.context !== cue.context) return;
    const { context, beginsAt } = cue;
    const bus = output;
    const controller = new AbortController();
    let source: AudioBufferSourceNode | null = null;
    let level: GainNode | null = null;

    async function play() {
      const response = await fetch(clip.file, { signal: controller.signal });
      if (!response.ok) throw new Error("Fragmento no disponible");
      const buffer = await context.decodeAudioData(await response.arrayBuffer());
      if (controller.signal.aborted) return;

      // Shortened cues keep their own deadline. A late load joins the passage in time.
      const entry = beginsAt + Math.min(clip.entry, duration.current / 2);
      const start = Math.max(context.currentTime, entry);
      const naturalEnd = entry + Math.min(buffer.duration, clip.seconds);
      const deadline = beginsAt + duration.current;
      if (start >= Math.min(deadline, naturalEnd)) return;
      const voice = context.createBufferSource();
      const gain = context.createGain();
      gain.gain.value = 0;
      voice.buffer = buffer;
      voice.connect(gain).connect(bus);
      source = voice;
      level = gain;
      voice.onended = () => {
        voice.disconnect();
        gain.disconnect();
        setEnd.current = null;
        source = null;
        level = null;
      };
      voice.start(start, start - entry);
      const endAt = (sceneEnd: number) => {
        const now = context.currentTime;
        const from = Math.max(now, start);
        const end = Math.min(sceneEnd, naturalEnd);
        if (end > from) {
          const current = gain.gain.value;
          const attack = from + Math.min(.012, (end - from) / 4);
          const release = Math.max(attack, end - .075);
          gain.gain.cancelScheduledValues(now);
          gain.gain.setValueAtTime(current, from);
          gain.gain.linearRampToValueAtTime(.52, attack);
          gain.gain.setValueAtTime(.52, release);
          gain.gain.linearRampToValueAtTime(0, end);
        }
        voice.stop(Math.max(now, end));
      };
      setEnd.current = endAt;
      endAt(deadline);
    }
    void play().catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => {
      controller.abort();
      setEnd.current = null;
      if (source) {
        source.onended = null;
        source.stop();
        source.disconnect();
      }
      level?.disconnect();
    };
  }, [attempt, clip, cue, enabled, output]);

  return <div className="repertoire-cue">
    <label><input type="checkbox" checked={enabled} onChange={event => setEnabled(event.target.checked)} />
      <span>{clip.title} <small>· Fragmento de {durationFormat.format(clip.seconds)} s</small></span>
    </label>
    {failed && <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar fragmento</button>}
  </div>;
}
