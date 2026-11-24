import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  createPerformanceNotes, FIRST_MIDI_NOTE, hasNoteCube, MIDI_START_BY_FACE, NOTE_FACE_FREQUENCIES, NOTE_SCENES, noteSceneFrequency,
  type NoteFace, type NoteFrequency, type NoteScene, type NoteStrike, type PerformanceInput, type PerformanceNotes,
} from "./performance-notes";
import { RestingSphere } from "./scene-visuals";

export function usePerformanceInput({ scene, ownsInput, output, routing, splitNote, learnSplit, onStrike }: {
  scene: NoteScene | null; ownsInput: boolean; output: GainNode | null;
  routing: { current: PerformanceInput | null };
  splitNote: number; learnSplit: (note: number) => boolean; onStrike: NoteStrike;
}) {
  const [sounding, setSounding] = useState<NoteFrequency[]>([]);
  const notesRef = useRef<PerformanceNotes | null>(null);
  const clickId = useRef(0);

  useEffect(() => {
    if (!ownsInput) return;
    const player = scene && output ? createPerformanceNotes(output, setSounding, onStrike) : null;
    notesRef.current = player;
    const send = (key: string, index: number, velocity: number, splitIndex?: number, face: NoteFace = "front") => {
      if (!scene || !player) return;
      if (velocity <= 0) {
        player.release(key);
        return;
      }
      if (output?.context.state !== "running") return;
      const frequency = noteSceneFrequency(scene, index, splitIndex, face);
      if (frequency !== undefined) player.press(key, frequency, velocity);
    };
    const midiPrefix = (inputId: string) => `midi:${JSON.stringify(inputId)}:`;
    const destination: PerformanceInput = {
      midiNote: (id, channel, note, velocity) => {
        if (scene === "eleven" && velocity > 0 && output?.context.state === "running" && learnSplit(note)) return;
        let face: NoteFace = "front";
        if (hasNoteCube(scene)) {
          if (note >= MIDI_START_BY_FACE.top) face = "top";
          else if (note >= MIDI_START_BY_FACE.right) face = "right";
        }
        const offset = note - MIDI_START_BY_FACE[face];
        // Preserve each face's original nine keys and repeat its scale in unused registers.
        const index = scene === "eleven" ? offset : ((offset % 9) + 9) % 9;
        send(`${midiPrefix(id)}${channel}:${note}`, index, velocity, splitNote - FIRST_MIDI_NOTE, face);
      },
      releaseMidi: (id, channel) => player?.releaseFrom(midiPrefix(id) + (channel === undefined ? "" : `${channel}:`)),
      computerNote: (key, note, pressed) => {
        const offset = note - FIRST_MIDI_NOTE;
        send(`keyboard:${key}`, scene === "eleven" ? offset : ((offset % 9) + 9) % 9, pressed ? 0.85 : 0);
      },
    };
    routing.current = destination;

    const computerDigit = (event: KeyboardEvent, pressed: boolean) => {
      if (!scene || (pressed && (event.repeat || event.altKey || event.ctrlKey || event.metaKey))) return;
      const rightFace = hasNoteCube(scene) && event.shiftKey;
      const digit = rightFace ? /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1] : event.key;
      if (!digit || !/^[1-9]$/.test(digit)) return;
      const target = event.target;
      if (pressed && target instanceof Element && target.closest("input, select, textarea, [contenteditable=true]")) return;
      if (pressed) event.preventDefault();
      send(`keyboard:${event.code || event.key}`, Number(digit) - 1, pressed ? 0.85 : 0, undefined, rightFace ? "right" : "front");
    };
    const keyDown = (event: KeyboardEvent) => computerDigit(event, true);
    const keyUp = (event: KeyboardEvent) => {
      if (/^(Digit|Numpad)[1-9]$/.test(event.code)) player?.release(`keyboard:${event.code}`);
      else computerDigit(event, false);
    };
    const releaseAll = () => player?.releaseFrom("");
    const hide = () => { if (document.hidden) releaseAll(); };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", hide);
      if (routing.current === destination) routing.current = null;
      if (notesRef.current === player) notesRef.current = null;
      releaseAll();
    };
  }, [output, learnSplit, onStrike, ownsInput, routing, scene, splitNote]);

  return {
    sounding,
    press: (id: string, frequency: NoteFrequency) => {
      if (output?.context.state === "running") notesRef.current?.press(id, frequency, 0.85);
    },
    release: (id: string) => notesRef.current?.release(id),
    releaseAll: () => notesRef.current?.releaseFrom(""),
    pulse: (frequency: NoteFrequency) => {
      const player = notesRef.current;
      if (!player || output?.context.state !== "running") return;
      const id = `button:${++clickId.current}`;
      player.press(id, frequency, 0.85);
      window.setTimeout(() => player.release(id), 190);
    },
  };
}

type NoteProjectionProps = {
  scene: NoteScene; paused: boolean; input: ReturnType<typeof usePerformanceInput>;
  clock: AudioContext | null; beginsAt: number;
};

function NoteButtons({ scene, input, face = "front" }: Pick<NoteProjectionProps, "scene" | "paused" | "input"> & { face?: NoteFace }) {
  const frequencies = NOTE_FACE_FREQUENCIES[face];
  return NOTE_SCENES[scene].keys.map((key) => {
    const frequency = frequencies[key - 1];
    const keyLabel = scene === "eleven" ? (key === 1 ? "1–4" : "5–9") : key;
    const description = scene === "ten" || face === "top" ? "" : scene === "eleven" ? `, teclas ${keyLabel}`
      : face === "right" ? `, Mayús más ${keyLabel}` : `, tecla ${keyLabel}`;
    return <button key={frequency} type="button" className="zero-note-key"
      aria-label={`${frequency} hercios${description}`} data-sounding={input.sounding.includes(frequency)}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        input.press(`pointer:${event.pointerId}`, frequency);
      }}
      onPointerUp={(event) => input.release(`pointer:${event.pointerId}`)}
      onPointerCancel={(event) => input.release(`pointer:${event.pointerId}`)}
      onLostPointerCapture={(event) => input.release(`pointer:${event.pointerId}`)}
      onClick={(event) => { if (event.detail === 0) input.pulse(frequency); }}>
      {(scene === "ten" || scene === "eleven") && <span className="zero-note-glyph" aria-hidden="true" />}
      <span className="zero-note-hz">{frequency} <small>Hz</small></span>
      {scene !== "ten" && face !== "top" && <kbd aria-hidden="true">{keyLabel}</kbd>}
    </button>;
  });
}

const CUBE_FORM_SECONDS = 2.8;
const ISOMETRIC_TILT = Math.atan(Math.SQRT1_2) * 180 / Math.PI;

function NoteCube({ scene, paused, input, clock, beginsAt }: NoteProjectionProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const solidRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const area = areaRef.current, solid = solidRef.current, front = frontRef.current;
    if (!hasNoteCube(scene) || !clock || !area || !solid || !front) return;
    let frame = 0, lastProgress = -1;
    let flatWidth = 0, flatHeight = 0, side = 0;

    const flatten = () => {
      solid.style.cssText = "";
      delete solid.dataset.folding;
      delete solid.dataset.showSides;
    };
    const paint = () => {
      const elapsed = scene === "fourteen" ? 1 : Math.max(0, Math.min(1, (clock.currentTime - beginsAt) / CUBE_FORM_SECONDS));
      if (elapsed !== lastProgress) {
        lastProgress = elapsed;
        const progress = elapsed * elapsed * (3 - 2 * elapsed);
        if (progress > 0) {
          solid.dataset.folding = "true";
          solid.dataset.showSides = String(progress > 0.17);
          solid.style.width = `${flatWidth + (side - flatWidth) * progress}px`;
          solid.style.height = `${flatHeight + (side - flatHeight) * progress}px`;
          solid.style.setProperty("--cube-depth", `${Math.max(1, side * progress)}px`);
          solid.style.setProperty("--cube-color", String(progress));
          solid.style.transform = `rotateX(${-ISOMETRIC_TILT * progress}deg) rotateY(${-45 * progress}deg)`;
        }
      }
      if (elapsed < 1) frame = window.requestAnimationFrame(paint);
    };
    const measure = () => {
      window.cancelAnimationFrame(frame);
      flatten();
      const bounds = front.getBoundingClientRect();
      flatWidth = bounds.width;
      flatHeight = bounds.height;
      side = Math.min(222, area.clientWidth * 0.65);
      lastProgress = -1;
      paint();
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      flatten();
    };
  }, [beginsAt, clock, scene]);

  return <div className="zero-cube-area" ref={areaRef}>
    <div className="zero-cube" ref={solidRef}>
      <div className="zero-cube-face zero-cube-front" ref={frontRef} role="group" aria-label="Frecuencias de tres dígitos">
        <NoteButtons scene={scene} paused={paused} input={input} />
      </div>
      {hasNoteCube(scene) && <>
        <div className="zero-cube-face zero-cube-right" role="group" aria-label="Frecuencias de cuatro dígitos">
          <NoteButtons scene={scene} paused={paused} input={input} face="right" />
        </div>
        <div className="zero-cube-face zero-cube-top" role="group" aria-label="Frecuencias de la cara superior">
          <NoteButtons scene={scene} paused={paused} input={input} face="top" />
        </div>
      </>}
    </div>
  </div>;
}

export function PerformanceProjection(props: NoteProjectionProps) {
  const { scene, paused, input } = props;
  return <div className="zero-harmonic-frame zero-note-scene" data-note-scene={scene}>
    <RestingSphere />
    {scene === "twelve" || hasNoteCube(scene) ? <NoteCube {...props} />
      : <div className="zero-note-bank" role="group" aria-label="Frecuencias del piano">
        <NoteButtons scene={scene} paused={paused} input={input} />
      </div>}
  </div>;
}
