import { useEffect, useState } from "react";
import { DJ_TRACK_WAVES, type DjWaveformData } from "./dj-wave-data";

type WaveTrack = {id: string; name: string; url: string};
const COLUMNS = 144;
const waves = new WeakMap<WaveTrack, Promise<DjWaveformData>>();

export function djTime(seconds: number) {
  return Math.floor(seconds / 60) + ":" + String(Math.floor(seconds % 60)).padStart(2, "0");
}

async function decodeWaveform(url: string): Promise<DjWaveformData> {
  const response = await fetch(url);
  if (!response.ok) throw new Error("No se pudo leer el audio.");
  const context = new OfflineAudioContext(1, 1, 22050);
  const buffer = await context.decodeAudioData(await response.arrayBuffer());
  if (!buffer.duration) throw new Error("El tema no tiene audio.");
  const peaks = new Array<number>(COLUMNS).fill(0);
  const channels = Array.from({length: buffer.numberOfChannels}, (_, index) => buffer.getChannelData(index));
  for (let column = 0; column < peaks.length; column++) {
    const from = Math.floor(column * buffer.length / peaks.length);
    const to = Math.floor((column + 1) * buffer.length / peaks.length);
    for (const samples of channels) {
      let peak = peaks[column];
      for (let frame = from; frame < to; frame++) peak = Math.max(peak, Math.abs(samples[frame]));
      peaks[column] = peak;
    }
    if (column % 8 === 7) await new Promise<void>(resolve => window.setTimeout(resolve, 0));
  }
  const loudest = Math.max(.000001, ...peaks);
  return { duration: buffer.duration, peaks: peaks.map(peak => Math.round(100 * Math.sqrt(peak / loudest))) };
}

function readWaveform(track: WaveTrack) {
  const known = waves.get(track);
  if (known) return known;
  const result = decodeWaveform(track.url).catch(error => {
    waves.delete(track);
    throw error;
  });
  waves.set(track, result);
  return result;
}

export function DjPadWaveform({track, label, cueAt, select}: {
  track: WaveTrack; label: string; cueAt?: number; select: (seconds: number) => void;
}) {
  const bundled = DJ_TRACK_WAVES[track.id];
  const [decoded, setDecoded] = useState<DjWaveformData | null>();
  useEffect(() => {
    if (bundled) return;
    let active = true;
    void readWaveform(track).then(data => {
      if (active) setDecoded(data);
    }).catch(() => {
      if (active) setDecoded(null);
    });
    return () => { active = false; };
  }, [bundled, track]);

  const wave = bundled ?? decoded;
  if (!wave) return <small className="dj-wave-status">{decoded === null ? "Onda no disponible" : "Preparando onda…"}</small>;
  const {duration, peaks} = wave;
  const last = Math.max(0, duration - .05);
  const value = typeof cueAt === "number" && Number.isFinite(cueAt) ? Math.max(0, Math.min(last, cueAt)) : 0;
  const title = (cueAt === undefined ? "Principio" : "Inicio " + djTime(value)) + " · " + djTime(duration);
  const bars = peaks.map((peak, index) => {
    const height = Math.max(.6, peak * .24);
    return "M" + (index + .5) + " " + (13 - height / 2) + "v" + height;
  }).join("");
  return <div className="dj-pad-wave" title={title} data-cue-seconds={cueAt === undefined ? undefined : value}>
    <svg viewBox={`0 0 ${peaks.length} 26`} preserveAspectRatio="none" aria-hidden="true">
      <path d={bars}/>
    </svg>
    {cueAt !== undefined && <span className="dj-wave-cue" style={{left: `${100 * value / duration}%`}} aria-hidden="true"/>}
    <input type="range" min={0} max={last} step="any" value={value}
      aria-label={"Inicio del " + label + " · " + track.name} aria-valuetext={title}
      onChange={event => select(event.currentTarget.valueAsNumber)}
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.currentTarget.focus({preventScroll: true});
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={event => {
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (box.width) select(Math.max(0, Math.min(last, (event.clientX - box.left) / box.width * duration)));
      }}/>
  </div>;
}
