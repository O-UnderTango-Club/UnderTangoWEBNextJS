import { useEffect, useRef } from "react";
import { useProjectionSignals } from "./projection-signals";
import { visualStimuli } from "./stimulus-map";

type Props = {
  scene: number;
  paused: boolean;
  notes?: readonly number[];
  loop?: { running: boolean; beat: number } | null;
  camera?: "waiting" | "live" | "off";
  room?: boolean;
  ballot?: { open: boolean; total: number; choice?: string | null } | null;
  tuning?: number;
  resting?: boolean;
  interactiveObject?: boolean;
};

const visualHints: Record<number, {audio:string; piano:string}> = {
  44: {audio:"Los graves abren la órbita, los medios giran las facetas y los agudos iluminan los reflejos.",
    piano:"El ataque de una tecla abre la espiral de cristales."},
  54: {audio:"Los graves cambian la distancia focal, los medios tiñen la luz violeta y los agudos iluminan la trama en azul.",
    piano:"El ataque de una tecla inclina la mirada dentro del fractal."},
  78: {audio:"Los graves ensanchan el trazo, los medios desplazan su contorno y los agudos encienden los bordes.",
    piano:"El ataque de una tecla ensancha la pincelada."},
};

const css = `
.stimulus-bar { position:absolute; z-index:3; inset-block-start:clamp(.45rem,1.5vw,1.25rem); inset-inline-end:clamp(.5rem,1.7vw,1.5rem); max-width:calc(100% - 4.5rem); box-sizing:border-box; display:flex; align-items:center; justify-content:flex-end; flex-wrap:wrap; gap:.15rem .6rem; padding:.27rem .5rem; border:1px solid #ababbb32; border-radius:.25rem; color:#dadde3; background:#101319d9; pointer-events:none; font:500 clamp(9px,.76vw,12px)/1.35 system-ui,sans-serif; font-variant-numeric:tabular-nums; letter-spacing:.015em; }
.stimulus-bar span { color:inherit; font:inherit; }
.stimulus-bar .stimulus-label { color:#b6bcc7; font-size:.9em; }
.stimulus-bar [data-source] { display:inline-flex; align-items:center; gap:.3em; white-space:nowrap; }
.stimulus-bar [data-source][title] { pointer-events:auto; cursor:help; }
.stimulus-bar [data-source][title] { pointer-events:auto; }
.stimulus-bar [data-source=piano] .stimulus-reading {min-width:3.6em;}
.stimulus-bar .stimulus-reading { color:#bcc6d1; }
.stimulus-bar .stimulus-lamp { flex:none; width:.54em; height:.54em; border:1px solid #adb2bb; border-radius:50%; box-sizing:border-box; }
.stimulus-bar [data-active=true] .stimulus-lamp { background:var(--signal-color,#99dfd7); border-color:var(--signal-color,#99dfd7); }
.stimulus-bar [data-source=piano] { --signal-color:#f2c68f; }
.stimulus-bar [data-source=piano][data-active=true] .stimulus-lamp { box-shadow:0 0 .42em #fac78990; }
.stimulus-bar [data-source=votes] { --signal-color:#beadf4; }
.stimulus-bar [data-source=camera] { --signal-color:#b0dbb7; }
.zero-stage .stimulus-bar .stimulus-wave { position:static; inset:auto; display:block; width:3.7em; height:1.15em; max-width:none; min-height:0; mix-blend-mode:normal; }
.stimulus-band { width:.23em; height:.9em; flex:none; transform-origin:center bottom; transform:scaleY(.12); background:#92ccc8; }
.stimulus-bands { display:inline-flex; align-items:flex-end; gap:1px; height:1em; }
.stimulus-bar[data-paused=true] { color:#bdc1c9; }
@media(max-width:520px){.stimulus-bar {gap:.15rem .4rem; padding:.2rem .28rem; max-width:calc(100% - 3.5rem)} .stimulus-bar .stimulus-label {display:none;}}
`;

function setValue(element: HTMLElement | null, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}

function setActive(element: HTMLElement | null, on: boolean) {
  const value = String(on);
  if (element && element.dataset.active !== value) element.dataset.active = value;
}

function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
}

/** This reads the projection's frame. It never requests media or opens an audio connection. */
export function StimulusBar({ scene, paused, notes, loop, camera, room, ballot, tuning, resting, interactiveObject }: Props) {
  const signals = useProjectionSignals();
  const audioNode = useRef<HTMLSpanElement>(null);
  const pianoNode = useRef<HTMLSpanElement>(null);
  const gestureNode = useRef<HTMLSpanElement>(null);
  const pitch = useRef<HTMLSpanElement>(null);
  const tempoNode = useRef<HTMLSpanElement>(null);
  const tempoValue = useRef<HTMLSpanElement>(null);
  const clockValue = useRef<HTMLSpanElement>(null);
  const wave = useRef<HTMLCanvasElement>(null);
  const bands = useRef<HTMLSpanElement>(null);
  const liveNotes = useRef(notes);
  useEffect(() => { liveNotes.current = notes; }, [notes]);

  const sources = visualStimuli(scene);
  const hasCamera = sources.includes("camera");
  const videoAvailable = !hasCamera || camera === "live";
  const hasAudio = sources.includes("audio") && videoAvailable;
  const hasPiano = sources.includes("piano") && videoAvailable;
  const hasGesture = scene === 1 && !!interactiveObject;
  const hasTime = sources.includes("clock") && !resting;
  const hasTempo = sources.includes("tempo");
  const hasLoop = sources.includes("loop") && !!loop?.running;
  const hasTuning = sources.includes("tuning") && tuning !== undefined;
  const round = scene === 92 || scene === 96 || scene === 100;
  const result = scene === 93 || scene === 97 || scene === 101;
  const hasBallot = sources.includes("votes") && !!ballot && (round || result || !!ballot.choice);
  const hasBands = scene === 44 || scene === 54 || scene === 78;

  useEffect(() => {
    if (!hasAudio && !hasTime && !hasPiano && !hasTempo && !hasGesture) return;
    const scope = wave.current;
    const ink = scope?.getContext("2d");
    const meters = bands.current?.children;
    let previousRms = -1;
    function refresh() {
      const frame = signals.current;
      const energy = !paused && frame.hasAudio ? frame.rms : 0;
      if (hasAudio) {
        setActive(audioNode.current, energy > .003);
        const status = paused ? "en pausa" : !frame.hasAudio ? "sin conexión" : energy > .003 ? "con señal" : "en silencio";
        const label = (room ? "Micrófono de sala" : "Mezcla de audio") + " " + status;
        if (audioNode.current?.getAttribute("aria-label") !== label) audioNode.current?.setAttribute("aria-label", label);
        if (ink && scope && (energy > 0 || previousRms !== 0)) {
          const { width, height } = scope;
          ink.clearRect(0, 0, width, height);
          ink.beginPath();
          for (let x = 0; x < width; x += 2) {
            const index = Math.floor((frame.wave.length - 1) * x / (width - 1));
            const sample = energy > 0 ? (frame.wave[index] - 128) / 128 : 0;
            const y = height * (.5 - .47 * Math.max(-1, Math.min(1, sample * 2.8)));
            if (x === 0) ink.moveTo(x, y); else ink.lineTo(x, y);
          }
          ink.lineWidth = 1.6;
          ink.strokeStyle = energy > .003 ? "#98e0da" : "#868e9a";
          ink.stroke();
        }
        previousRms = energy;
        if (meters) [frame.low, frame.mid, frame.high].forEach((value, index) => {
          const meter = meters[index] as HTMLElement;
          meter.style.transform = "scaleY(" + (paused || !frame.hasAudio ? .12 : Math.max(.12, Math.min(1, value))) + ")";
        });
      }
      if (hasPiano) {
        const held = liveNotes.current;
        const on = !paused && (frame.attack > .07 || !!held?.length);
        setActive(pianoNode.current, on);
        const hz = held?.length ? held[held.length - 1] : frame.frequency;
        setValue(pitch.current, on && hz > 0 ? Math.round(hz) + " Hz" : "");
      }
      if (hasGesture) setActive(gestureNode.current, !paused && frame.gesture > .07);
      if (hasTempo) {
        setActive(tempoNode.current, !paused && frame.beat < .2);
        setValue(tempoValue.current, Math.round(frame.bpm) + " BPM");
      }
      if (hasTime) setValue(clockValue.current, formatTime(frame.time));
    }
    refresh();
    if (paused) return;
    const timer = window.setInterval(refresh, hasAudio || hasTempo || hasPiano || hasGesture ? 64 : 250);
    return () => window.clearInterval(timer);
  }, [scene, signals, paused, room, hasAudio, hasTime, hasPiano, hasTempo, hasGesture]);

  if (!hasAudio && !hasTime && !hasPiano && !hasTempo && !hasLoop && !hasCamera && !hasTuning && !hasBallot && !hasGesture) return null;
  return <div className="stimulus-bar" role="group" aria-label="Estímulos de la proyección" data-scene={scene} data-paused={paused}>
    <style>{css}</style>
    <span className="stimulus-label">Señales</span>
    {hasCamera && <span data-source="camera" data-active={camera === "live" && !paused}>
      <i className="stimulus-lamp" aria-hidden="true" />Cámara
      {camera !== "live" && <span className="stimulus-reading">{camera === "waiting" ? "en espera" : "sin señal"}</span>}
    </span>}
    {hasAudio && <span ref={audioNode} data-source="audio" title={visualHints[scene]?.audio ?? (room ? "Onda del micrófono de sala" : "Onda de la mezcla que alimenta la proyección")}>
      {room ? "Sala" : "Audio"}<canvas ref={wave} width={104} height={28} className="stimulus-wave" aria-hidden="true" />
      {hasBands && <span className="stimulus-bands" ref={bands} role="img" aria-label="Graves, medios y agudos">
        <i className="stimulus-band"/><i className="stimulus-band"/><i className="stimulus-band"/>
      </span>}
    </span>}
    {hasPiano && <span ref={pianoNode} data-source="piano" title={visualHints[scene]?.piano ?? "Ataque de las teclas y altura tocada"}>
      <i className="stimulus-lamp" aria-hidden="true"/>Piano <span className="stimulus-reading" ref={pitch}/>
    </span>}
    {hasGesture && <span ref={gestureNode} data-source="gesture" title="Arrastre y rotación del objeto con el puntero o las flechas">
      <i className="stimulus-lamp" aria-hidden="true"/>Gesto
    </span>}
    {hasTempo && <span ref={tempoNode} data-source="tempo" title="Pulso del transporte">
      <i className="stimulus-lamp" aria-hidden="true"/><span ref={tempoValue}/>
    </span>}
    {hasTime && <span data-source="clock" title="Tiempo transcurrido en la secuencia visual">Tiempo <span className="stimulus-reading" ref={clockValue}/></span>}
    {hasLoop && loop && <span data-source="loop" data-active={!paused && loop.beat >= 0}>Lupera <span className="stimulus-reading">{loop.beat >= 0 ? loop.beat + 1 : "en espera"}</span></span>}
    {hasTuning && <span data-source="tuning">La4 <span className="stimulus-reading">{tuning} Hz</span></span>}
    {hasBallot && ballot && <span data-source="votes" data-active={ballot.open || !!ballot.choice}>
      <i className="stimulus-lamp" aria-hidden="true"/>
      {round || !ballot.choice ? `Votos · ${ballot.total}` : `Público · ${ballot.choice}`}
    </span>}
    {paused && <span className="stimulus-label">Pausa</span>}
  </div>;
}
