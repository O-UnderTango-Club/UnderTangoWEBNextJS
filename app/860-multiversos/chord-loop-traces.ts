import type { Chord } from "./chord-loop";
import type { NoteFrequency } from "./performance-notes";

const TRACE_COLORS = ["#ffac78", "#c7aaff", "#7dcfff", "#89e9d5", "#ffe58d", "#f7aed4", "#d4eb9d"];

function closestFrequency(frequency: NoteFrequency, choices: Chord) {
  const distance = (candidate: NoteFrequency) => Math.abs(Math.log2(candidate / frequency));
  return choices.reduce((closest, candidate) => distance(candidate) < distance(closest) ? candidate : closest);
}

function connectLoopFrequencies(from: Chord, to: Chord) {
  const pairs = new Map<NoteFrequency, NoteFrequency>();
  const connectRange = (left: Chord, right: Chord) => {
    const count = Math.min(left.length, right.length);
    if (count === 0) return;
    if (count === 1) {
      if (left.length === 1) pairs.set(left[0], closestFrequency(left[0], right));
      else pairs.set(closestFrequency(right[0], left), right[0]);
      return;
    }
    for (let index = 0; index < count; index++) {
      const position = index / (count - 1);
      pairs.set(left[Math.round(position * (left.length - 1))], right[Math.round(position * (right.length - 1))]);
    }
  };

  // Keep shared pitches fixed, then match the voices in order between them.
  let fromStart = 0, toStart = 0;
  from.forEach((frequency, index) => {
    const match = to.indexOf(frequency, toStart);
    if (match < 0) return;
    connectRange(from.slice(fromStart, index), to.slice(toStart, match));
    pairs.set(frequency, frequency);
    fromStart = index + 1;
    toStart = match + 1;
  });
  connectRange(from.slice(fromStart), to.slice(toStart));
  return pairs;
}

export function buildLoopTraces(cells: readonly (Chord | null)[], active: Chord) {
  const frequencies = [...new Set([...cells.flatMap((cell) => cell ?? []), ...active])].sort((a, b) => a - b);
  const steps = Math.max(1, frequencies.length - 1);
  const spacing = Math.min(17, 78 / steps);
  const pitchY = new Map(frequencies.map((frequency, index) => [frequency, 51 + ((frequencies.length - 1) / 2 - index) * spacing]));
  const nextSlot = (slot: number) => (slot + 1) % cells.length;
  const links = cells.map((cell, slot) => connectLoopFrequencies(cell ?? [], cells[nextSlot(slot)] ?? []));

  const parents = new Map<number, number>();
  const noteId = (slot: number, frequency: NoteFrequency) => slot * 10_000 + frequency;
  const voice = (id: number): number => parents.has(id) ? voice(parents.get(id)!) : id;
  links.forEach((pairs, slot) => {
    for (const [from, to] of pairs) {
      const outgoing = voice(noteId(slot, from)), incoming = voice(noteId(nextSlot(slot), to));
      if (outgoing !== incoming) parents.set(incoming, outgoing);
    }
  });
  const colors = new Map<number, string>();
  cells.forEach((cell, slot) => {
    for (const frequency of cell ?? []) {
      const id = voice(noteId(slot, frequency));
      if (!colors.has(id)) colors.set(id, TRACE_COLORS[colors.size % TRACE_COLORS.length]);
    }
  });
  const color = (slot: number, frequency: NoteFrequency) => colors.get(voice(noteId(slot, frequency))) ?? "#b6e9ff";
  const y = (frequency: NoteFrequency) => pitchY.get(frequency) ?? 51;
  return { links, color, y };
}
