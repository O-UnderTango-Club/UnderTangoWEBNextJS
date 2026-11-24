export const CONTROL_FILE = "Controles-860.json";
export const CONTROL_FORMAT = "undertango-860/controles-v1";
export const SETTINGS_PREFIX = "860-multiversos:settings:v1:";
export const JOURNAL_KEY = "860-multiversos:organon:v1";
export const RECOVERED_CONTROLS = "860-controles-recuperados";
export const BANK_ACTIONS = { volume: "Volumen", stop: "Stop", play: "Play inmediato", once: "Una vuelta", next: "Play en el 1", toggle: "Play / stop" } as const;
export const PIANO_KEYS: Record<string, number> = {
  a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71, k: 72,
};
export const TOP_KEYS = ["KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period"];
export const FIXED_CONTROLS = {
  "Piano cromático · MIDI 60 a 72": Object.keys(PIANO_KEYS).join(" ").toUpperCase(),
  "Banco de notas · cara frontal": "1 a 9",
  "Cubo · cara derecha": "Mayús + 1 a 9",
  "Cubo extendido · cara superior": TOP_KEYS.map(key => key.replace("Key", "").replace("Comma", ",").replace("Period", ".")).join(" "),
  "Sonido de escena": "Mantener P y soltar para cortar",
  "Rotación del objeto enfocado": "Flechas",
  "Grabar con el botón enfocado": "Espacio o Intro",
  "Hercules · Play/Pausa A y B": "Nota 7 · canales 2 y 3",
  "Hercules · Cue A y B": "Nota 6 · canales 2 y 3",
  "Hercules · Cargar A y B": "Nota 13 · canales 2 y 3",
  "Hercules · Selección de pista": "CC 1 relativo · canal 1",
};

export type BankAssignment = {slot: number; action: keyof typeof BANK_ACTIONS; label: string; alias?: string};
export type CcBinding = {inputId: string; inputName?: string; cc: number; bendChannel?: number};
type Settings = {
  sampleBankMidi: Record<string, BankAssignment>;
  ccMap: Record<string, CcBinding>;
  generalPlayButton: string;
  mixerRecordButton: string;
  mixerLiveButton: string;
  mixerStopButton: string;
  mixerTransportAliases: Partial<Record<"play" | "record" | "stop", string>>;
  midiLayouts: {numeric: boolean; tempered: boolean};
  splitNote: number;
};
const defaults: Settings = {
  sampleBankMidi: {}, ccMap: {}, generalPlayButton: "", mixerRecordButton: "", mixerLiveButton: "", mixerStopButton: "",
  mixerTransportAliases: {}, midiLayouts: {numeric: false, tempered: true}, splitNote: 60,
};
type SettingName = keyof Settings;
const settingNames = Object.keys(defaults) as SettingName[];
export const isControlSetting = (name: string): name is SettingName => Object.prototype.hasOwnProperty.call(defaults, name);
type Rows = Record<string, string>;
type Revision = { fecha: string; cambios: string[] };
export type ControlMap = {format: string; fecha: string; settings: Settings; asignaciones: Rows; coincidencias: string[]; tecladoYHercules: Rows; historial: Revision[]};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const short = (v: unknown): v is string => typeof v === "string" && v.length <= 650;
const integer = (v: unknown, lo: number, hi: number): v is number => Number.isInteger(v) && Number(v) >= lo && Number(v) <= hi;

function signal(id: string): unknown[] {
  try { const parts: unknown = JSON.parse(id); return Array.isArray(parts) ? parts : []; } catch { return []; }
}
function validSignal(id: unknown, optional = false): boolean {
  if (!short(id)) return false;
  if (!id && optional) return true;
  const parts = signal(id);
  if (parts[0] === "name" && (parts.length === 5 || parts[2] === "transport")) parts.shift();
  return short(parts[0]) && !!parts[0] && ((parts.length === 3 && parts[1] === "transport" && parts[2] === "play") ||
    (parts.length === 4 && integer(parts[1], 0, 15) && ["cc", "note", "bend"].includes(String(parts[2])) && integer(parts[3], 0, 127)));
}
function validSetting(name: SettingName, value: unknown): boolean {
  switch (name) {
    case "sampleBankMidi":
      return object(value) && Object.keys(value).length <= 54 && Object.entries(value).every(([id, item]) =>
        validSignal(id) && object(item) && integer(item.slot, 0, 8) && short(item.action) && Object.hasOwn(BANK_ACTIONS, item.action) &&
        short(item.label) && (item.alias === undefined || validSignal(item.alias, true)));
    case "ccMap":
      return object(value) && Object.entries(value).every(([slot, b]) => /^(-1|[0-8])$/.test(slot) && object(b) &&
        short(b.inputId) && (b.inputName === undefined || short(b.inputName)) && integer(b.cc, -1, 127) &&
        (b.bendChannel === undefined || integer(b.bendChannel, 0, 15)));
    case "mixerTransportAliases":
      return object(value) && Object.entries(value).every(([k, id]) => ["play", "record", "stop"].includes(k) && validSignal(id, true));
    case "midiLayouts":
      return object(value) && typeof value.numeric === "boolean" && typeof value.tempered === "boolean";
    case "splitNote": return integer(value, 0, 127);
    default: return validSignal(value, true);
  }
}
function normalized(raw: unknown): Settings {
  if (!object(raw)) throw Error("Faltan las asignaciones del archivo.");
  const settings = { ...defaults };
  for (const key of settingNames) {
    if (!Object.hasOwn(raw, key)) continue;
    if (!validSetting(key, raw[key])) throw Error("Revisá el ajuste «" + key + "» del mapa.");
    Object.assign(settings, { [key]: raw[key] });
  }
  // Older versions stored port IDs only. Preserve them and add a portable alias
  // wherever the score actually recorded a device name.
  const devices = new Map<string, string | null>();
  const addDevice = (id: string, name: string) => {
    if (!devices.has(id)) devices.set(id, name);
    else if (devices.get(id) !== name) devices.set(id, null);
  };
  for (const b of Object.values(settings.ccMap)) if (b.inputName) addDevice(b.inputId, b.inputName);
  for (const [id, item] of Object.entries(settings.sampleBankMidi)) {
    const parts = signal(id);
    const device = /^(.*) · (?:CC \d+|Nota \d+|Pitch Bend) · canal \d+$/.exec(item.label)?.[1];
    if (device && parts.length === 4 && typeof parts[1] === "number") {
      addDevice(String(parts[0]), device);
      if (!item.alias) item.alias = JSON.stringify(["name", device, ...parts.slice(1)]);
    }
  }
  settings.mixerTransportAliases = { ...settings.mixerTransportAliases };
  const buttons = { play: settings.generalPlayButton, record: settings.mixerRecordButton || settings.mixerLiveButton, stop: settings.mixerStopButton };
  for (const name of Object.keys(buttons) as (keyof typeof buttons)[]) {
    const parts = signal(buttons[name]);
    const device = devices.get(String(parts[0]));
    if (device && !settings.mixerTransportAliases[name]) settings.mixerTransportAliases[name] = JSON.stringify(["name", device, ...parts.slice(1)]);
  }
  return settings;
}
export function parseControlFile(text: string) {
  if (text.length > 524288) throw Error("El archivo supera los 512 KB.");
  const data = JSON.parse(text);
  if (data?.format !== CONTROL_FORMAT || !object(data.settings) || !["sampleBankMidi", "ccMap", "generalPlayButton"].some(k => Object.hasOwn(data.settings, k))) {
    throw Error("Elegí un archivo de controles exportado por 860.");
  }
  const history: Revision[] = Array.isArray(data.historial) ? data.historial.slice(-64).filter((r: unknown) =>
    object(r) && short(r.fecha) && Number.isFinite(Date.parse(r.fecha)) && Array.isArray(r.cambios) &&
    r.cambios.length <= 128 && r.cambios.every(v => typeof v === "string" && v.length <= 2200)) : [];
  return { settings: normalized(data.settings), history };
}
function labelSignal(id: string) {
  const parts = signal(id);
  if (parts[0] === "name" && (parts.length === 5 || parts[2] === "transport")) parts.shift();
  if (parts[1] === "transport") return parts[0] + " · MIDI Start / Continue";
  return parts[0] + " · " + (parts[2] === "bend" ? "Pitch Bend" : (parts[2] === "cc" ? "CC " : "Nota ") + parts[3]) + " · canal " + (Number(parts[1]) + 1);
}
const synth = ["NUBE", "VCO", "SUB", "CORTE", "Q", "PULSO", "DERIVA", "ECO", "ESPACIO"];
export function describeControls(s: Settings): Rows {
  const rows: Rows = {};
  for (const item of Object.values(s.sampleBankMidi).sort((a, b) => a.slot - b.slot || a.action.localeCompare(b.action))) {
    rows["S" + (item.slot + 1) + " · " + BANK_ACTIONS[item.action]] = item.label;
  }
  for (const [slot, b] of Object.entries(s.ccMap)) {
    rows[slot === "-1" ? "Máster" : "Síntesis · " + synth[Number(slot)]] =
      (b.inputName || b.inputId) + " · " + (b.cc < 0 ? "Pitch Bend · canal " + (Number(b.bendChannel) + 1) : "CC " + b.cc);
  }
  const buttons = [
    ["Play general", s.generalPlayButton, s.mixerTransportAliases.play],
    ["Grabar", s.mixerRecordButton || s.mixerLiveButton, s.mixerTransportAliases.record],
    ["Detener todos", s.mixerStopButton, s.mixerTransportAliases.stop],
  ];
  for (const [label, id, alias] of buttons) if (label && id) rows[label] = labelSignal(alias || id);
  rows["División del teclado MIDI"] = "Nota " + s.splitNote;
  rows["Distribución MIDI"] = [s.midiLayouts.tempered && "Temperada", s.midiLayouts.numeric && "Numérica"].filter(Boolean).join(" + ") || "Desactivada";
  return rows;
}
export function changes(before: Rows, after: Rows): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(k => before[k] !== after[k])
    .map(k => k + " · " + (before[k] || "Sin asignar") + " → " + (after[k] || "Sin asignar"));
}
function sharedFaders(settings: Settings): string[] {
  const found: string[] = [];
  for (const [id, a] of Object.entries(settings.sampleBankMidi)) {
    const key = signal(id);
    if (key.length === 5 && key[0] === "name") key.shift();
    if (key[2] !== "cc" && key[2] !== "bend") continue;
    for (const [slot, b] of Object.entries(settings.ccMap)) {
      const sameDevice = key[0] === b.inputId || (b.inputName && a.label.startsWith(b.inputName + " · "));
      const sameSignal = key[2] === "cc" ? b.cc === key[3] : b.cc < 0 && b.bendChannel === key[1];
      if (sameDevice && sameSignal) found.push("S" + (a.slot + 1) + " · " + BANK_ACTIONS[a.action] + " comparte " + a.label +
        " con " + (slot === "-1" ? "el máster" : synth[Number(slot)]) + ". El banco cede ese control.");
    }
  }
  return found;
}
function readSettings(last: ControlMap | null): Settings {
  const raw: Record<string, unknown> = {};
  for (const key of settingNames) {
    const stored = localStorage.getItem(SETTINGS_PREFIX + key);
    if (stored !== null) raw[key] = JSON.parse(stored);
    else if (last?.settings && Object.hasOwn(last.settings, key)) raw[key] = last.settings[key];
  }
  return normalized(raw);
}
function currentMap(): ControlMap {
  const last: ControlMap | null = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "null");
  const settings = readSettings(last);
  const asignaciones = describeControls(settings);
  if (last && JSON.stringify(last.settings) === JSON.stringify(settings) && JSON.stringify(last.tecladoYHercules) === JSON.stringify(FIXED_CONTROLS)) return last;
  const fecha = new Date().toISOString();
  const edits = last ? [...changes(last.asignaciones, asignaciones), ...changes(last.tecladoYHercules, FIXED_CONTROLS)] : ["Primera lectura de este perfil"];
  const historial = [...(last?.historial ?? []), { fecha, cambios: edits.length ? edits : ["Actualización de los identificadores MIDI"] }].slice(-64);
  const map = { format: CONTROL_FORMAT, fecha, settings, asignaciones, coincidencias: sharedFaders(settings), tecladoYHercules: FIXED_CONTROLS, historial };
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(map));
  return map;
}
export function readControlSetting(name: SettingName, raw: string | null): unknown {
  // Old maps may have a reliable device name only in the sample label or synth binding.
  if (name === "sampleBankMidi" || name === "mixerTransportAliases") {
    try { return readSettings(JSON.parse(localStorage.getItem(JOURNAL_KEY) || "null"))[name]; }
    catch { /* Other unavailable settings should not prevent reading this individual binding. */ }
  }
  if (raw !== null) return JSON.parse(raw);
  return JSON.parse(localStorage.getItem(JOURNAL_KEY) || "null")?.settings?.[name];
}
export type Archive = {map: ControlMap; fileSaved: boolean};
let scheduled: Promise<Archive> | undefined;
let dirty = false;
// A single writer across tabs always re-reads the current assignments under the lock.
async function archive(): Promise<Archive> {
  let file: FileSystemFileHandle | undefined;
  let previous = "";
  try {
    const directory = await navigator.storage.getDirectory();
    file = await directory.getFileHandle(CONTROL_FILE, {create:true});
    previous = await (await file.getFile()).text();
  } catch { /* The journal and the portable download also work without the file API. */ }
  if (previous && !localStorage.getItem(JOURNAL_KEY)) {
    const backup = parseControlFile(previous);
    const saved = JSON.parse(previous);
    const last: ControlMap = { format: CONTROL_FORMAT, fecha: saved.fecha, settings: backup.settings,
      asignaciones: describeControls(backup.settings), coincidencias: sharedFaders(backup.settings),
      tecladoYHercules: saved.tecladoYHercules ?? FIXED_CONTROLS, historial: backup.history };
    localStorage.setItem(JOURNAL_KEY, JSON.stringify(last));
    window.dispatchEvent(new Event(RECOVERED_CONTROLS));
  }
  const map = currentMap();
  let fileSaved = false;
  if (file) try {
    const content = JSON.stringify(map, null, 2);
    if (previous !== content) {
      const writer = await file.createWritable();
      await writer.write(content);
      await writer.close();
    }
    fileSaved = true;
  } catch { /* A manual export remains available when private file storage is unavailable. */ }
  return { map, fileSaved };
}
export function archiveControls(): Promise<Archive> {
  dirty = true;
  if (!scheduled) scheduled = Promise.resolve().then(async () => {
    let result: Archive;
    do {
      dirty = false;
      result = navigator.locks ? await navigator.locks.request(JOURNAL_KEY, archive) : await archive();
    } while (dirty);
    return result;
  }).finally(() => { scheduled = undefined; });
  return scheduled;
}
export async function restoreControls(input: ReturnType<typeof parseControlFile>, reviewedAt: string) {
  // Capture the pre-import state first. Preserve settings from outside the control map.
  const apply = () => {
    if (currentMap().fecha !== reviewedAt) throw Error("El mapa cambió durante la revisión. Volvé a elegir el archivo para comparar las últimas asignaciones.");
    const journal = localStorage.getItem(JOURNAL_KEY)!;
    const previous = settingNames.map(key => localStorage.getItem(SETTINGS_PREFIX + key));
    try {
      for (const key of settingNames) localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(input.settings[key]));
      const updated = currentMap();
      if (input.history.length) {
        const entries = new Map([...input.history, ...updated.historial].map(r => [JSON.stringify(r), r]));
        updated.historial = [...entries.values()].sort((a,b) => Date.parse(a.fecha) - Date.parse(b.fecha)).slice(-64);
        localStorage.setItem(JOURNAL_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      settingNames.forEach((key, i) => {
        if (previous[i] === null) localStorage.removeItem(SETTINGS_PREFIX + key);
        else localStorage.setItem(SETTINGS_PREFIX + key, previous[i]!);
      });
      localStorage.setItem(JOURNAL_KEY, journal);
      throw error;
    }
  };
  if (navigator.locks) await navigator.locks.request(JOURNAL_KEY, apply);
  else apply();
  return archiveControls();
}
