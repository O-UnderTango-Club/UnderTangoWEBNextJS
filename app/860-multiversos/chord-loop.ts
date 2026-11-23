import type { NoteFrequency, NoteStrike } from "./performance-notes";

export type ChordLoopSettings = { bpm: number; length: number };
export type Chord = readonly NoteFrequency[];
export type ChordLoopFrame = {
  beat: number;
  slot: number;
  beatAt: number;
  period: number;
  recording: boolean;
  running: boolean;
  overdub: boolean;
  armed: boolean;
  cells: readonly (Chord | null)[];
  draft: Chord;
  sounding: Chord;
};

export const DEFAULT_CHORD_LOOP: ChordLoopSettings = { bpm: 11, length: 4 };
export const MAX_LOOP_BPM = 240;
export const MAX_LOOP_BEATS = 8;
export type ChordLoopOptions = { melodic?: boolean; manual?: boolean; click?: boolean; mix?: number; startAt?: number; nextPulse?:()=>number; clickOutput?: GainNode };
const SILENCE: Chord = [];
const sortNotes = (notes: Set<NoteFrequency>): Chord => [...notes].sort((a, b) => a - b);

export function createChordLoop(output: GainNode, initial: ChordLoopSettings, onFrame: (frame: ChordLoopFrame) => void, options: ChordLoopOptions = {}) {
  const clock = output.context;
  const bus = clock.createGain();
  bus.connect(output);
  const { manual = false, click = true, mix = 1, clickOutput = bus } = options;
  let settings = initial;
  let cells = Array<Chord | null>(settings.length).fill(null);
  type PlayedNote = { frequency: number; offset: number; velocity: number; duration: number };
  let phrases: PlayedNote[][] = cells.map(() => []);
  const heldNotes = new Map<string, { event: PlayedNote; at: number; period: number }>();
  function releaseNote(id: string, time = clock.currentTime) {
    const held = heldNotes.get(id);
    if (!held) return;
    held.event.duration = Math.max(0.001, time - held.at) / held.period;
    heldNotes.delete(id);
  }
  const draft = new Set<NoteFrequency>();
  const voices = new Map<NoteFrequency, { oscillator: OscillatorNode; level: GainNode; gain: number }>();
  let running = !manual;
  let recording = !manual;
  let armed = false;
  let beat = -1;
  let slot = -1;
  let beatAt = options.nextPulse?.() ?? options.startAt ?? clock.currentTime;
  let nextAt = beatAt;
  let period = 60 / settings.bpm;
  let sounding = SILENCE;
  let timer: number | undefined;

  const publish = () => {
    if (beat >= 0 || manual) onFrame({ beat, slot: Math.max(0, slot), beatAt, period, recording, running, overdub: manual, armed: armed || cells.length !== settings.length,
      cells: [...cells], draft: sortNotes(draft), sounding });
  };

  const tone = (frequency: number, gain: number, at: number, length: number, attack: number, release: number) => {
    const oscillator = clock.createOscillator();
    const envelope = clock.createGain();
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(gain, at + attack);
    envelope.gain.setValueAtTime(gain, at + length - release);
    envelope.gain.linearRampToValueAtTime(0, at + length);
    oscillator.connect(envelope).connect(clickOutput);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(at);
    oscillator.stop(at + length);
  };

  const changesAt = (notes: Chord, at: number) => {
    const target = Math.min(0.17, 0.30 / Math.max(1, notes.length)) * mix;
    for (const [frequency, voice] of voices) {
      if (notes.includes(frequency)) continue;
      voices.delete(frequency);
      voice.level.gain.setTargetAtTime(0, at, 0.003);
      voice.oscillator.stop(at + 0.018);
    }
    for (const frequency of notes) {
      const existing = voices.get(frequency);
      if (existing) {
        if (existing.gain !== target) existing.level.gain.setTargetAtTime(target, at, 0.006);
        existing.gain = target;
        continue;
      }
      const oscillator = clock.createOscillator();
      const level = clock.createGain();
      oscillator.frequency.value = frequency;
      level.gain.setValueAtTime(0, at);
      level.gain.linearRampToValueAtTime(target, at + 0.011);
      oscillator.connect(level).connect(bus);
      oscillator.onended = () => { oscillator.disconnect(); level.disconnect(); };
      oscillator.start(at);
      voices.set(frequency, { oscillator, level, gain: target });
    }
    sounding = notes;
  };

  const closeSlot = () => {
    if (slot >= 0 && recording) {
      cells[slot] = manual ? sortNotes(new Set([...(cells[slot] ?? SILENCE), ...draft])) : sortNotes(draft);
    }
    draft.clear();
  };

  const nextBeat = () => {
    closeSlot();
    if (armed || cells.length !== settings.length) {
      cells = Array<Chord | null>(settings.length).fill(null);
      heldNotes.clear();
      phrases = cells.map(() => []);
      slot = 0;
      if (!manual) recording = true;
      armed = false;
    } else if (slot < 0) slot = 0;
    else {
      slot = (slot + 1) % cells.length;
      if (slot === 0 && !manual) {
        for (const id of heldNotes.keys()) releaseNote(id, nextAt);
        recording = false;
      }
    }
    beat++;
    beatAt = nextAt;
    period = 60 / settings.bpm;
    nextAt = beatAt + period;
  };

  const wake = (now = clock.currentTime) => {
    window.clearTimeout(timer);
    if (!running || clock.state !== "running") return;

    if (now >= nextAt) {
      // Keep the beat grid even when the main thread wakes late.
      while (now >= nextAt) nextBeat();
      const at = clock.currentTime + 0.006;
      const downbeat = slot === 0;
      if (click) tone(downbeat ? 1720 : 1520, downbeat ? 0.12 : 0.08, at, 0.032, 0.002, 0.027);
      if (options.melodic && !recording) {
        for (const event of phrases[slot]) {
          const onset = beatAt + event.offset * period;
          const end = onset + event.duration * period;
          const start = Math.max(clock.currentTime, onset);
          if (end <= start) continue;
          const duration = end - start;
          tone(event.frequency, 0.15 * event.velocity * mix, start, duration,
            Math.min(0.005, duration / 3), Math.min(0.008, duration / 3));
        }
        sounding = cells[slot] ?? SILENCE;
      } else changesAt(!manual && recording ? SILENCE : cells[slot] ?? SILENCE, at);
      publish();
    }

    timer = window.setTimeout(() => wake(), Math.max(2, (nextAt - clock.currentTime) * 1000));
  };

  const wakeOnStateChange = () => wake();
  clock.addEventListener("statechange", wakeOnStateChange);
  wake();
  if (manual) publish();

  const strike: NoteStrike = (frequency, time) => {
    if (!running) return;
    if (time >= nextAt) wake(time);
    if (!recording || draft.has(frequency)) return;
    draft.add(frequency);
    publish();
  };

  return {
    strike,
    releaseNote,
    pressNote(id: string, frequency: number, velocity: number) {
      const time = clock.currentTime;
      if (time >= nextAt) wake(time);
      if (!options.melodic || !recording) return;
      releaseNote(id, time);
      const event = { frequency, velocity, duration: 0, offset: slot < 0 ? 0 : (time - beatAt) / period };
      phrases[Math.max(0, slot)].push(event);
      heldNotes.set(id, {event, at: Math.max(time, beatAt), period});
    },
    configure(next: ChordLoopSettings) {
      if(next.bpm!==settings.bpm && options.nextPulse){
        nextAt=options.nextPulse();
        period=60/next.bpm;
        beatAt=nextAt-period;
      }
      const changed=next.bpm!==settings.bpm;
      settings = next;
      if(changed && running) wake();
      publish();
    },
    arm() {
      armed = true;
      publish();
    },
    toggleRecording() {
      if (!manual) return;
      if (!running) {
        running = true;
        slot = -1;
        nextAt = options.nextPulse?.() ?? clock.currentTime;
      }
      if (recording) closeSlot();
      recording = !recording;
      wake();
      publish();
    },
    stopPlayback() {
      closeSlot();
      recording = false;
      running = false;
      window.clearTimeout(timer);
      if (clock.state !== "closed") changesAt(SILENCE, clock.currentTime + 0.003);
      publish();
    },
    stop() {
      window.clearTimeout(timer);
      clock.removeEventListener("statechange", wakeOnStateChange);
      if (clock.state !== "closed") changesAt(SILENCE, clock.currentTime);
      bus.disconnect();
    },
  };
}
