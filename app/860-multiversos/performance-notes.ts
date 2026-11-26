import { harmonicFrequencyAt } from "./frequency-tuning";

const faceFrequencies = (face: number) =>
  Array.from({ length: 9 }, (_, index) => harmonicFrequencyAt(face * 9 + index));

export const NOTE_FACE_FREQUENCIES = {
  front: faceFrequencies(0),
  right: faceFrequencies(1),
  top: faceFrequencies(2),
} as const;
export const NOTE_FREQUENCIES = NOTE_FACE_FREQUENCIES.front;
export type NoteFace = keyof typeof NOTE_FACE_FREQUENCIES;
export type NoteFrequency = number;

const GRID_KEYS = [2, 3, 4, 8, 9, 1, 5, 6, 7] as const;

export const NOTE_SCENES = {
  ten: { number: 10, keys: [1], next: "eleven" },
  eleven: { number: 11, keys: [1, 9], next: "twelve" },
  twelve: { number: 12, keys: GRID_KEYS, next: "thirteen" },
  thirteen: { number: 13, keys: GRID_KEYS, next: "fourteen" },
  fourteen: { number: 14, keys: GRID_KEYS, next: null },
} as const;
export type NoteScene = keyof typeof NOTE_SCENES;
export const NOTE_SCENE_IDS = Object.keys(NOTE_SCENES) as NoteScene[];
export const FIRST_MIDI_NOTE = 60;
export const MIDI_START_BY_FACE = { front: FIRST_MIDI_NOTE, right: FIRST_MIDI_NOTE + 12, top: FIRST_MIDI_NOTE + 24 } as const;

export function isNoteScene(mode: string): mode is NoteScene {
  return Object.prototype.hasOwnProperty.call(NOTE_SCENES, mode);
}

export function hasNoteCube(scene: NoteScene | null) {
  return scene === "thirteen" || scene === "fourteen";
}

export function noteSceneFrequency(scene: NoteScene, index: number, splitIndex = 4, face: NoteFace = "front"): NoteFrequency | undefined {
  if (scene === "ten") return NOTE_FREQUENCIES[0];
  if (scene === "eleven") return index < splitIndex ? NOTE_FREQUENCIES[0] : NOTE_FREQUENCIES[8];
  if (hasNoteCube(scene)) return NOTE_FACE_FREQUENCIES[face][index];
  return NOTE_FREQUENCIES[index];
}

export type PerformanceInput = {
  midiNote: (inputId: string, channel: number, note: number, velocity: number) => void;
  sustainMidi?: (inputId: string, channel: number, down: boolean) => void;
  releaseMidi: (inputId: string, channel?: number) => void;
  computerNote: (key: string, note: number, pressed: boolean) => void;
  releaseAll?: () => void;
};

export type NoteStrike = (frequency: NoteFrequency, time: number, velocity?: number) => void;

export function createPerformanceNotes(output: GainNode, onChange: (frequencies: NoteFrequency[]) => void, onStrike?: NoteStrike, totalLevel = 0.55) {
  const context = output.context;
  const held = new Map<string, { frequency: NoteFrequency; velocity: number }>();
  const voices = new Map<NoteFrequency, { oscillator: OscillatorNode; level: GainNode }>();

  const keepLevel = (level: AudioParam, time: number) => {
    if (typeof level.cancelAndHoldAtTime === "function") level.cancelAndHoldAtTime(time);
    else {
      const current = level.value;
      level.cancelScheduledValues(time);
      level.setValueAtTime(current, time);
    }
  };

  const update = (retrigger?: NoteFrequency) => {
    const gains = new Map<NoteFrequency, number>();
    for (const { frequency, velocity } of held.values()) gains.set(frequency, Math.max(velocity, gains.get(frequency) ?? 0));
    const now = context.currentTime;
    if (context.state !== "closed") {
      for (const [frequency, voice] of voices) {
        if (gains.has(frequency)) continue;
        voices.delete(frequency);
        keepLevel(voice.level.gain, now);
        voice.level.gain.linearRampToValueAtTime(0, now + 0.08);
        voice.oscillator.stop(now + 0.085);
      }

      const headroom = Math.min(0.22, totalLevel / Math.max(1, gains.size));
      for (const [frequency, velocity] of gains) {
        const existing = voices.get(frequency);
        if (existing) {
          keepLevel(existing.level.gain, now);
          if (frequency === retrigger) existing.level.gain.linearRampToValueAtTime(0, now + 0.006);
          existing.level.gain.linearRampToValueAtTime(headroom * velocity, now + 0.022);
          continue;
        }
        const oscillator = context.createOscillator(), level = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        level.gain.setValueAtTime(0, now);
        level.gain.linearRampToValueAtTime(headroom * velocity, now + 0.014);
        oscillator.connect(level).connect(output);
        oscillator.onended = () => { oscillator.disconnect(); level.disconnect(); };
        oscillator.start(now);
        voices.set(frequency, { oscillator, level });
      }
    } else voices.clear();
    onChange([...gains.keys()].sort((a, b) => a - b));
  };

  const release = (id: string) => {
    if (held.delete(id)) update();
  };
  const releaseFrom = (prefix: string) => {
    let removed = false;
    for (const id of held.keys()) {
      if (id.startsWith(prefix)) removed = held.delete(id) || removed;
    }
    if (removed) update();
  };
  return {
    press(id: string, frequency: NoteFrequency, velocity: number) {
      if (context.state !== "running") return;
      const time = context.currentTime;
      held.set(id, { frequency, velocity: Math.max(0.10, Math.min(1, velocity)) });
      update(frequency);
      onStrike?.(frequency, time, velocity);
    },
    release,
    releaseFrom,
  };
}

export type PerformanceNotes = ReturnType<typeof createPerformanceNotes>;
