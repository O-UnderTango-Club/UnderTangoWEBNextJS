import { memo, useCallback, useEffect, useRef } from "react";

const COLUMNS = 240;
const HEIGHT = 40;
const SILENCE_FLOOR = .0002;
const FRAMES_PER_TASK = 1 << 18;
const cachedPeaks = new WeakMap<AudioBuffer, Float32Array>();

export const SampleWaveform = memo(function SampleWaveform({id, slot, buffer, muted, stopped, cursors}: {
  id: number;
  slot: number;
  buffer: AudioBuffer;
  muted: boolean;
  stopped: boolean;
  cursors: Map<number, HTMLSpanElement>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const register = useCallback((node: HTMLSpanElement | null) => {
    if (node) cursors.set(id, node);
    else cursors.delete(id);
  }, [cursors, id]);

  useEffect(() => {
    const context = canvas.current?.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, COLUMNS, HEIGHT);
    function paint(peaks: Float32Array) {
      if (!context) return;
      const loudest = Math.max(SILENCE_FLOOR, ...peaks);
      context.fillStyle = "#c8bdec";
      peaks.forEach((peak, column) => {
        if (peak <= SILENCE_FLOOR) return;
        // Normalize the drawing to each recording so quiet sounds are still recognizable.
        const height = Math.max(2, Math.round((HEIGHT - 4) * Math.sqrt(peak / loudest)));
        context.fillRect(column, (HEIGHT - height) / 2, 1, height);
      });
    }
    const known = cachedPeaks.get(buffer);
    if (known) { paint(known); return; }
    const peaks = new Float32Array(COLUMNS);
    const channels = Array.from({length:buffer.numberOfChannels}, (_, index) => buffer.getChannelData(index));
    let column = 0, start = 0, task = 0;
    function measure() {
      const limit = start + FRAMES_PER_TASK;
      while (column < COLUMNS && start < limit) {
        const end = Math.floor((column + 1) * buffer.length / COLUMNS);
        let peak = 0;
        for (const samples of channels) {
          for (let frame = start; frame < end; frame++) peak = Math.max(peak, Math.abs(samples[frame]));
        }
        peaks[column++] = peak;
        start = end;
      }
      // Long recordings yield between chunks so the scene can still accept MIDI.
      if (column < COLUMNS) task = window.setTimeout(measure, 0);
      else {
        cachedPeaks.set(buffer, peaks);
        paint(peaks);
      }
    }
    measure();
    return () => window.clearTimeout(task);
  }, [buffer]);

  return <div className="sample-wave" role="img" aria-label={`Forma de onda de S${slot + 1}`}
    title="Los huecos son silencio. La línea marca la posición del loop."
    data-muted={muted || undefined} data-stopped={stopped || undefined}>
    <canvas ref={canvas} width={COLUMNS} height={HEIGHT} aria-hidden="true" />
    <span ref={register} className="sample-wave-cursor" aria-hidden="true" />
  </div>;
});
