// Each physical input gets one listener. Opening a port itself fires statechange.
export type MidiInputLike = {
  id: string; name?: string; state?: string; connection?: string;
  open?: () => Promise<unknown>; close?: () => Promise<unknown>;
  onmidimessage: ((event: { data: ArrayLike<number> }) => void) | null;
};
export type MidiDevice = { id: string; name: string; status: "opening" | "open" | "failed"; signal: string };

type Entry = { input: MidiInputLike; device: MidiDevice; lastPaint: number };

export function monitorMidiInputs(
  publish: (devices: MidiDevice[]) => void,
  handle: (port: MidiInputLike, data: ArrayLike<number>) => void,
  disconnected: (id: string) => void,
) {
  const ports = new Map<string, Entry>();
  const notify = () => publish(Array.from(ports.values(), entry => ({...entry.device})));
  function detach(entry: Entry) {
    ports.delete(entry.input.id);
    entry.input.onmidimessage = null;
    disconnected(entry.input.id);
    void entry.input.close?.().catch(() => {});
  }
  function attach(input: MidiInputLike) {
    const entry: Entry = { input, device: {id: input.id, name: input.name || "Entrada MIDI", status: "opening", signal: ""}, lastPaint: -Infinity };
    ports.set(input.id,entry);
    const ready = () => {
      if (ports.get(input.id) !== entry) return;
      input.onmidimessage = ({data}) => {
        const status = data[0], kind = status >> 4;
        if (status !== 0xf8 && status !== 0xfe && performance.now() - entry.lastPaint > 80) {
          const label = kind === 8 || kind === 9 ? "Nota " + data[1] : kind === 11 ? "CC " + data[1] : kind === 14 ? "Pitch Bend" : "MIDI " + status.toString(16).toUpperCase();
          const signal = label + (kind < 15 ? " · canal " + ((status & 15) + 1) : "")
            + (kind === 11 ? " · " + data[2] + "/127" : "");
          if (signal !== entry.device.signal) {
            entry.device.signal = signal;
            notify();
          }
          entry.lastPaint = performance.now();
        }
        handle(input, data);
      };
      entry.device.status = "open";
      notify();
    };
    if (!input.open) { ready(); return; }
    input.open().then(ready).catch(() => {
      if (ports.get(input.id) !== entry) return;
      entry.device.status = "failed";
      notify();
    });
  }
  return {
    refresh(inputs: IterableIterator<MidiInputLike>, retry: boolean) {
      const list = Array.from(inputs).filter(p => p.state !== "disconnected");
      let changed = false;
      for (const entry of ports.values()) {
        if (!list.includes(entry.input)) { detach(entry); changed = true; }
      }
      for (const input of list) {
        const entry = ports.get(input.id);
        if (!entry || (retry && (entry.device.status === "failed" || input.connection === "closed"))) {
          attach(input); changed = true;
        }
      }
      if (changed) notify();
    },
    close() { for (const entry of ports.values()) detach(entry); },
  };
}
