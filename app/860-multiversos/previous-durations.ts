import {SHOW_SCORE, SHOW_OPENING, SHOW_TRANSITIONS} from "./show-score";
import {resolveShowDurations} from "./show-durations";
import { SETTINGS_PREFIX } from "./control-map";

// The original panel stored each group independently and used zero for a manual cue.
export function previousSceneDurations(): number[] | null {
  let found = false;
  function read(key:string):unknown {
    try {
      const raw = localStorage.getItem(SETTINGS_PREFIX + key);
      if (raw === null) return undefined;
      const value:unknown = JSON.parse(raw);
      found = true;
      return value;
    } catch { return undefined; }
  }
  const previous = read("sceneSeconds111");
  if (Array.isArray(previous) && previous.length === 111) return resolveShowDurations(previous);
  const seconds = SHOW_SCORE.slice(1).map(cue => cue.seconds);
  const positive = (raw:unknown, fallback:number) =>
    typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? raw : fallback;
  seconds[0] = positive(read("durationSeconds"),SHOW_OPENING.opening)
    + positive(read("oneSeconds"),SHOW_OPENING.beacon) + positive(read("lineSeconds"),SHOW_OPENING.line)
    + SHOW_TRANSITIONS.pointHold + SHOW_TRANSITIONS.lineHold;
  seconds[1] = positive(read("harmonicSeconds"),SHOW_OPENING.harmonics);
  seconds[2] = positive(read("spaceSeconds"),seconds[2]);
  seconds[3] = positive(read("timeSeconds"),SHOW_OPENING.time) + SHOW_TRANSITIONS.trailTurn;
  const continuations = read("continuationSeconds");
  const notes = read("noteSeconds");
  const extended = read("extendedSeconds");
  function group(value:unknown,key:string,fallback:number) {
    return value && typeof value === "object" ? positive((value as Record<string,unknown>)[key],fallback) : fallback;
  }
  ["cross","sphere","noise","return"].forEach((key,i) => {seconds[4+i] = group(continuations,key,seconds[4+i]);});
  seconds[8] = group(continuations,"breath",seconds[8]-SHOW_OPENING.rest) + positive(read("restSeconds"),SHOW_OPENING.rest);
  ["ten","eleven","twelve","thirteen","fourteen"].forEach((key,i) => {seconds[9+i] = group(notes,key,seconds[9+i]);});
  for (let i=14;i<seconds.length;i++) seconds[i] = group(extended,String(i+1),seconds[i]);
  return found ? resolveShowDurations(seconds.map(Math.round)) : null;
}
