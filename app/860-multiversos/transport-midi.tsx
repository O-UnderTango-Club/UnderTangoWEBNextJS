import { useEffect, useState } from "react";
import { useSavedSetting } from "./saved-setting";

const names = { play: "Play general", record: "Grabar", playAll: "Reproducir todos los loops", stop: "Detener todos" } as const;
type TransportAction = keyof typeof names;

export function useTransportMidi(connectMidi: (rescan?: boolean) => Promise<void>) {
  const [play, setPlay] = useSavedSetting("generalPlayButton", "");
  const [record, setRecord] = useSavedSetting("mixerRecordButton", "");
  const [legacyRecord, setLegacyRecord] = useSavedSetting("mixerLiveButton", "");
  const [playAll, setPlayAll] = useSavedSetting("mixerPlayAllButton", "");
  const [stop, setStop] = useSavedSetting("mixerStopButton", "");
  const [aliases, setAliases] = useSavedSetting("mixerTransportAliases", { play: "", record: "", playAll: "", stop: "" });
  const [learning, setLearning] = useState<TransportAction | null>(null);
  const [conflict, setConflict] = useState("");
  const buttons = { play, record: record || legacyRecord, playAll, stop };

  useEffect(() => {
    const otherControl = (event: Event) => {
      if ((event as CustomEvent).detail !== "transport") setLearning(null);
    };
    window.addEventListener("860-midi-learn", otherControl);
    return () => window.removeEventListener("860-midi-learn", otherControl);
  }, []);

  function match(id: string, alias?: string) {
    return (Object.keys(buttons) as TransportAction[]).find(action =>
      alias && aliases[action] ? aliases[action] === alias : buttons[action] === id);
  }

  function toggle(action: TransportAction) {
    window.dispatchEvent(new CustomEvent("860-midi-learn", { detail: "transport" }));
    setConflict("");
    if (learning !== action) void connectMidi(true);
    setLearning(learning === action ? null : action);
  }

  function bind(id: string, alias?: string) {
    if (!learning) return;
    const assigned = match(id, alias);
    if (assigned && assigned !== learning) {
      setConflict(`Ese botón ya controla ${names[assigned]}.`);
      return;
    }
    if (learning === "record") {
      setRecord(id);
      setLegacyRecord("");
    } else if (learning === "stop") setStop(id);
    else if (learning === "playAll") setPlayAll(id);
    else setPlay(id);
    setAliases(current => ({ ...current, [learning]: alias || "" }));
    setLearning(null);
    setConflict("");
  }

  const hint = learning && (conflict || `Pulsá el botón MIDI para ${names[learning]}.`);
  return { buttons, match, learning, toggle, bind, setConflict, hint };
}

export type TransportMidi = ReturnType<typeof useTransportMidi>;

export function TransportMidiButton({ action, midi }: { action: TransportAction; midi: TransportMidi }) {
  const label = `Asignar MIDI a ${names[action]}`;
  return <button type="button" className="transport-midi-button" aria-label={label} title={label}
    aria-pressed={midi.learning === action} onClick={() => midi.toggle(action)}>
    MIDI{midi.buttons[action] ? " ✓" : ""}
  </button>;
}
