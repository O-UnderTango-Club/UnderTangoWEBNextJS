export const MIDI_REASSIGNMENT = "860-midi-reassignment";

export type MidiReassignment = {
  id: string;
  alias?: string;
  owner: "bank" | "transport" | "master";
};

export function reassignMidi(detail: MidiReassignment) {
  window.dispatchEvent(new CustomEvent(MIDI_REASSIGNMENT, { detail }));
}

export function sameMidiSignal(id: string, alias: string | undefined, incoming: MidiReassignment) {
  if (alias && incoming.alias) return alias === incoming.alias;
  return id === incoming.id || (!!incoming.alias && id === incoming.alias);
}
