import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createChordLoop, DEFAULT_CHORD_LOOP, MAX_LOOP_BEATS, MAX_LOOP_BPM, type Chord, type ChordLoopFrame } from "./chord-loop";
import { buildLoopTraces } from "./chord-loop-traces";
import type { NoteStrike } from "./performance-notes";

type LoopCue = { context: AudioContext; beginsAt: number };
type LoopConfig = { manual?: boolean; bpm?: number; click?: boolean; mix?: number; synchronized?: boolean; clickOutputRef?: { current: GainNode | null } };

export function useChordLoop(cue: LoopCue | null, outputRef: { current: GainNode | null }, config: LoopConfig = {}) {
  const { manual, bpm, click, mix, synchronized, clickOutputRef } = config;
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_CHORD_LOOP, bpm: bpm ?? DEFAULT_CHORD_LOOP.bpm }));
  const [latest, setLatest] = useState<{ cue: LoopCue; frame: ChordLoopFrame } | null>(null);
  const settingsRef = useRef(settings);
  const playerRef = useRef<ReturnType<typeof createChordLoop> | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
    playerRef.current?.configure(settings);
  }, [settings]);

  useEffect(() => {
    const output = outputRef.current;
    if (!cue || !output || output.context !== cue.context) return;
    const player = createChordLoop(output, settingsRef.current, (frame) => setLatest({ cue, frame }), {
      manual, click, mix, startAt: synchronized ? cue.beginsAt + 0.06 : undefined, clickOutput: clickOutputRef?.current ?? undefined,
    });
    playerRef.current = player;
    return () => {
      player.stop();
      playerRef.current = null;
    };
  }, [cue, outputRef, manual, click, mix, synchronized, clickOutputRef]);

  return {
    settings,
    frame: latest?.cue === cue ? latest.frame : null,
    setBpm: (bpm: number) => setSettings((current) => ({ ...current, bpm })),
    setLength: (length: number) => setSettings((current) => ({ ...current, length })),
    arm: () => playerRef.current?.arm(),
    toggleRecording: () => playerRef.current?.toggleRecording(),
    stopPlayback: () => playerRef.current?.stopPlayback(),
    strike: useCallback<NoteStrike>((frequency, time) => playerRef.current?.strike(frequency, time), []),
  };
}

export function ChordLoopControls({ loop, active, paused, label = "Modo acorde", manual = false }: {
  loop: ReturnType<typeof useChordLoop>; active: boolean; paused: boolean; label?: string; manual?: boolean;
}) {
  const { settings, frame, setBpm, setLength, arm, toggleRecording, stopPlayback } = loop;
  const [tempoText, setTempoText] = useState<string | null>(null);
  const commitTempo = () => {
    if (tempoText?.trim()) {
      const requested = Number(tempoText);
      if (Number.isFinite(requested)) setBpm(Math.min(MAX_LOOP_BPM, Math.max(1, Math.round(requested))));
    }
    setTempoText(null);
  };

  return <fieldset className="zero-loop-controls">
    <legend>{label}</legend>
    <div className="zero-loop-options">
      <label>Tempo (BPM)
        <input type="number" min={1} max={MAX_LOOP_BPM} step={1} inputMode="numeric"
          value={tempoText ?? settings.bpm} onChange={(event) => setTempoText(event.currentTarget.value)}
          onBlur={commitTempo} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} />
      </label>
      <label>Golpes por vuelta
        <select value={settings.length} onChange={(event) => setLength(Number(event.currentTarget.value))}>
          {Array.from({ length: MAX_LOOP_BEATS }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
        </select>
      </label>
    </div>
    <div className="zero-loop-presets" role="group" aria-label="Tempos de prueba">
      {[11, 111].map((bpm) => <button key={bpm} type="button" aria-pressed={settings.bpm === bpm}
        onClick={() => { setTempoText(null); setBpm(bpm); }}>{bpm} BPM</button>)}
    </div>
    {active && <>
      <p className="zero-loop-status">{manual && !frame?.running ? "Loop detenido" : frame?.armed ? "Graba en el próximo golpe" : frame
        ? `${frame.recording ? "Grabando" : "Repitiendo"} · golpe ${frame.slot + 1} de ${frame.cells.length}`
        : "Esperando el primer golpe"}</p>
      {manual ? <div className="zero-loop-presets">
        <button type="button" onClick={toggleRecording} disabled={!frame || paused} aria-pressed={frame?.recording ?? false}>Loop</button>
        <button type="button" onClick={stopPlayback} disabled={!frame?.running}>Detener loop</button>
      </div> : <button className="zero-loop-record" type="button" onClick={arm} disabled={!frame || paused || frame.armed}>Grabar otra vuelta</button>}
    </>}
  </fieldset>;
}

const PAST_BEATS = 2;
const SHOWN_BEATS = Array.from({ length: PAST_BEATS + MAX_LOOP_BEATS + 1 }, (_, index) => index - PAST_BEATS);
const PLOT_BEAT_WIDTH = 100;

const formatFrequency = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2, useGrouping: false });
const frequencyLabel = (chord: Chord) => chord.map((frequency) => formatFrequency.format(frequency)).join(", ") + " Hz";

export function ChordLoopTimeline({ clock, frame, paused, live, compact = false }: { clock: AudioContext; frame: ChordLoopFrame; paused: boolean; live: Chord; compact?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const line = track.current;
    if (!line) return;
    let animation = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const paint = () => {
      const progress = reduced ? 0 : Math.max(0, Math.min(1, (clock.currentTime - frame.beatAt) / frame.period));
      line.style.setProperty("--loop-position", String(PAST_BEATS + progress));
      if (!paused && !reduced && progress < 1) animation = window.requestAnimationFrame(paint);
    };
    paint();
    return () => window.cancelAnimationFrame(animation);
  }, [clock, frame.beatAt, frame.period, paused]);

  const active = paused ? [] : [...new Set([...live, ...frame.sounding])].sort((a, b) => a - b);
  const cells = frame.cells.map((cell, slot) => {
    if (!frame.recording || slot !== frame.slot || !frame.draft.length) return cell;
    return frame.overdub ? [...new Set([...(cell ?? []), ...frame.draft])].sort((a, b) => a - b) : frame.draft;
  });
  const intervals = SHOWN_BEATS.map((offset) => {
    const beat = frame.beat + offset;
    const slot = (frame.slot + offset + cells.length * PAST_BEATS) % cells.length;
    const visible = beat >= 0 && (frame.overdub || !frame.recording || offset >= -frame.slot);
    const chord = visible ? cells[slot] : null;
    const capturing = frame.recording && offset === 0;
    const label = chord?.length ? frequencyLabel(chord) : capturing ? "Escuchando" : chord ? "Silencio" : "Por grabar";
    return { beat, slot, visible, chord, label };
  });
  const traces = buildLoopTraces(cells, active);
  const current = intervals[PAST_BEATS];
  const next = intervals[PAST_BEATS + 1];
  const sounding = active.length ? frequencyLabel(active) : current.label === "Silencio" ? "Silencio" : "—";

  return <div className={`zero-loop-timeline${compact ? " extended-loop-timeline" : ""}`} role="group" aria-label="Frecuencias y silencios en el tiempo">
    <div className="zero-loop-readout">
      <div><span>Sonando</span><span className="zero-loop-readout-value" data-loop-sounding title={sounding} tabIndex={active.length > 4 ? 0 : undefined}>{sounding}</span></div>
      <div><span>Próximo</span><span className="zero-loop-readout-value" data-loop-next title={next.label} tabIndex={(next.chord?.length ?? 0) > 4 ? 0 : undefined}>{next.label}</span></div>
    </div>
    <div className="zero-loop-plot">
      <div className="zero-loop-track" ref={track}>
        {intervals.map(({ beat, slot, visible, chord, label }, index) => <div className="zero-loop-beat" key={beat}
          data-beat={visible ? beat : undefined} aria-current={index === PAST_BEATS ? "true" : undefined}>
          {visible && <>
            <div className="zero-loop-card" title={label} aria-label={`Golpe ${slot + 1}. ${label}`}>
              <span className="zero-loop-count">{slot + 1}</span>
              {!chord?.length && <span>{label}</span>}
            </div>
            {chord?.length && chord.length <= 6 ? <div className="zero-loop-pitches" aria-hidden="true">
              {chord.map((frequency, noteIndex) => <span key={frequency} style={{ top: `${traces.y(frequency)}%`, color: traces.color(slot, frequency),
                left: noteIndex % 2 && traces.y(chord[noteIndex - 1]) - traces.y(frequency) < 13 ? "2.5rem" : undefined }}>{formatFrequency.format(frequency)}</span>)}
            </div> : null}
          </>}
        </div>)}
        <svg className="zero-loop-traces" aria-hidden="true" viewBox={`0 0 ${intervals.length * PLOT_BEAT_WIDTH} 100`} preserveAspectRatio="none">
          {intervals.flatMap(({ chord, slot, beat }, index) => {
            const left = index * PLOT_BEAT_WIDTH;
            const right = left + PLOT_BEAT_WIDTH;
            return (chord ?? []).map((frequency) => {
              const to = intervals[index + 1]?.chord?.length ? traces.links[slot].get(frequency) : undefined;
              const y = traces.y(frequency);
              const endY = to === undefined ? y : traces.y(to);
              const path = endY === y ? `M ${left} ${y} H ${right}`
                : `M ${left} ${y} H ${right - 18} C ${right - 9} ${y}, ${right - 9} ${endY}, ${right} ${endY}`;
              return <path key={`${beat}-${frequency}`} d={path} stroke={traces.color(slot, frequency)} data-beat={beat}
                data-frequency={frequency} data-next-frequency={to} vectorEffect="non-scaling-stroke" />;
            });
          })}
        </svg>
      </div>
      <div className="zero-loop-playhead" aria-hidden="true">
        <div className="zero-loop-lights">
          {active.map((frequency) => <span className="zero-loop-light" key={frequency} style={{ top: `${traces.y(frequency)}%`, color: traces.color(frame.slot, frequency) }} />)}
        </div>
      </div>
    </div>
  </div>;
}
