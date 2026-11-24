import { useEffect, useState } from "react";
import { useSavedSetting } from "./saved-setting";

import { TRANSPORT_NAMES as names, type TransportAction } from "./control-map";
import { MIDI_REASSIGNMENT, reassignMidi, sameMidiSignal, type MidiReassignment } from "./midi-reassignment";

export function useTransportMidi(connectMidi: (rescan?: boolean) => Promise<void>) {
  const [play, setPlay] = useSavedSetting("generalPlayButton", "");
  const [pauseScene, setPauseScene] = useSavedSetting("generalPauseButton", "");
  const [stopScene, setStopScene] = useSavedSetting("generalStopButton", "");
  const [record, setRecord] = useSavedSetting("mixerRecordButton", "");
  const [legacyRecord, setLegacyRecord] = useSavedSetting("mixerLiveButton", "");
  const [playAll, setPlayAll] = useSavedSetting("mixerPlayAllButton", "");
  const [stop, setStop] = useSavedSetting("mixerStopButton", "");
  const [clear, setClear] = useSavedSetting("mixerClearButton", "");
  const [aliases, setAliases] = useSavedSetting<Partial<Record<TransportAction, string>>>("mixerTransportAliases", {});
  const [learning, setLearning] = useState<TransportAction | null>(null);
  const buttons = { play, pauseScene, stopScene, record: record || legacyRecord, playAll, stop, clear };
  const setters = {play:setPlay, pauseScene:setPauseScene, stopScene:setStopScene, record:setRecord,
    playAll:setPlayAll, stop:setStop, clear:setClear};

  useEffect(() => {
    const otherControl = (event: Event) => {
      if ((event as CustomEvent).detail !== "transport") setLearning(null);
    };
    window.addEventListener("860-midi-learn", otherControl);
    return () => window.removeEventListener("860-midi-learn", otherControl);
  }, []);

  function match(id: string, alias?: string) {
    return (Object.keys(buttons) as TransportAction[]).find(action =>
      !!buttons[action] && sameMidiSignal(buttons[action], aliases[action], {id,alias,owner:"transport"}));
  }
  function releaseSignal(signal: MidiReassignment, keep?: TransportAction) {
    const removed=(Object.keys(buttons) as TransportAction[]).filter(action =>
      action!==keep && !!buttons[action] && sameMidiSignal(buttons[action],aliases[action],signal));
    if (!removed.length) return;
    for (const action of removed) setters[action]("");
    if (removed.includes("record")) setLegacyRecord("");
    setAliases(current => {
      const next={...current};
      for (const action of removed) delete next[action];
      return next;
    });
  }
  useEffect(() => {
    const receive=(event:Event) => {
      const signal=(event as CustomEvent<MidiReassignment>).detail;
      if (signal.owner!=="transport") releaseSignal(signal);
    };
    window.addEventListener(MIDI_REASSIGNMENT,receive);
    return () => window.removeEventListener(MIDI_REASSIGNMENT,receive);
  });

  function toggle(action: TransportAction) {
    window.dispatchEvent(new CustomEvent("860-midi-learn", { detail: "transport" }));
    if (learning !== action) void connectMidi(true);
    setLearning(learning === action ? null : action);
  }

  function bind(id: string, alias?: string) {
    if (!learning) return;
    const signal={id,alias,owner:"transport" as const};
    releaseSignal(signal,learning);
    reassignMidi(signal);
    setters[learning](id);
    if (learning==="record") setLegacyRecord("");
    setAliases(current => ({ ...current, [learning]: alias || "" }));
    setLearning(null);
  }

  const hint = learning && `Pulsá el botón MIDI para ${names[learning]}.`;
  return { buttons, match, learning, toggle, bind, hint };
}

export type TransportMidi = ReturnType<typeof useTransportMidi>;

export function TransportMidiButton({ action, midi }: { action: TransportAction; midi: TransportMidi }) {
  const label = `Asignar MIDI a ${names[action]}`;
  return <button type="button" className="transport-midi-button" aria-label={label} title={label}
    aria-pressed={midi.learning === action} onClick={() => midi.toggle(action)}>
    MIDI{midi.buttons[action] ? " ✓" : ""}
  </button>;
}
