export type DeckSide = "A" | "B";
export type DjCommand = { action: "scene"; step: -1 | 1 } | { action: "load" | "play" | "cue"; side: DeckSide };
export const DJ_CONTROL = "860-dj-control";
export const isInpulse200 = (name?: string) => /inpulse[\s_-]*200[\s_-]*mk[\s_-]*3/i.test(name ?? "");

// Input messages from DJUCED's factory DJControl Inpulse 200 Mk3 map.
export function herculesCommand(inputId: string, data: ArrayLike<number>, held: Set<string>) {
  const [status, control, value] = Array.from(data);
  const send = (detail: DjCommand) => window.dispatchEvent(new CustomEvent(DJ_CONTROL, {detail}));
  if (status === 0xb0 && control === 1) {
    if (value > 0 && value !== 64) send({action:"scene", step:value < 64 ? 1 : -1});
    return true;
  }
  const channel = status & 15, kind = status & 0xf0;
  const action = control === 7 ? "play" : control === 6 ? "cue" : control === 13 ? "load" : null;
  if (!action || (channel !== 1 && channel !== 2) || (kind !== 0x90 && kind !== 0x80)) return false;
  const key = JSON.stringify([inputId, channel, control]);
  if (kind === 0x80 || !value) held.delete(key);
  else if (!held.has(key)) { held.add(key); send({action, side:channel === 1 ? "A" : "B"}); }
  return true;
}
