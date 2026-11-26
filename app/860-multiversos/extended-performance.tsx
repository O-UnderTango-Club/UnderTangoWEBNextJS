import { useSavedSetting } from "./saved-setting";
import { TOP_KEYS } from "./control-map";
import { useEffect, useMemo, useRef, useState } from "react";
import { SpiralProjection } from "./spiral";
import { ChordLoopControls, ChordLoopTimeline, useChordLoop } from "./chord-loop-view";
import { cubeIndexForMidi, CUBE_SIZE, CUBE_TRACK_NAMES, CUBE_TRACKS, DEFAULT_A4, FACE_NAMES, getCubeKeys, isTimbreScene, MATRIX_ORDER, TIMBRE_NAMES,
  type CubeTrack, type ExtendedScene, type TimbreScene } from "./extended-scenes";
import { createPerformanceNotes, type NoteFrequency, type PerformanceInput } from "./performance-notes";
import { createTimbreRack } from "./timbre-rack";
import { createSceneInstrument, usesSceneKeyboard } from "./scene-instrument";
import { useTempo } from "./tempo";

type OutputRef = { current: GainNode | null };
type TrackNotes = [NoteFrequency[], NoteFrequency[], NoteFrequency[]];
const EMPTY_TRACKS: TrackNotes = [[], [], []];

export function isPlayableExtendedScene(scene: ExtendedScene | null) {
  return scene === 15 || scene === 18 || isTimbreScene(scene);
}

export function useExtendedPerformance(scene: ExtendedScene | null, clock: AudioContext | null, output: OutputRef,
  routing: { current: PerformanceInput | null }, manualOutput: GainNode | null) {
  const [selected, setSelected] = useSavedSetting<CubeTrack>("selected", 0);
  const [midiLayouts, setMidiLayouts] = useSavedSetting("midiLayouts", { numeric: false, tempered: true });
  const [a4, setA4] = useSavedSetting("a4", DEFAULT_A4);
  const [amounts, setAmounts] = useSavedSetting<Partial<Record<TimbreScene, number>>>("amounts", {});
  const [live, setLive] = useState<TrackNotes>(EMPTY_TRACKS);
  const selectedRef = useRef(selected);
  const layout = scene === 15 ? "numeric" : "tempered";
  const splitMidi = midiLayouts[layout];
  const splitRef = useRef(splitMidi);
  const instrument = useRef<OutputRef["current"]>(null);
  const rack = useRef<ReturnType<typeof createTimbreRack> | null>(null);
  const auditionRack = useRef<ReturnType<typeof createTimbreRack> | null>(null);
  const attack = useRef({ count: 0, frequency: 0, velocity: 0 });
  const {bpm,clock:beatOrigin}=useTempo();
  const transport=useRef({bpm,beatOrigin});
  transport.current={bpm,beatOrigin};
  const player = useRef<{ strike: (id: string, track: CubeTrack, index: number, velocity: number) => void; release: (id: string) => void } | null>(null);
  const timbre = isTimbreScene(scene) ? scene : null;
  const loopScene = timbre ? 20 : scene === 15 || scene === 18 ? scene : null;
  const loopCue = useMemo(() => clock && loopScene ? { context: clock, beginsAt: clock.currentTime } : null, [clock, loopScene]);
  const three = loopScene === 15 || loopScene === 18;
  const keys = useMemo(() => getCubeKeys(loopScene !== 15, a4), [a4, loopScene]);
  const strength = timbre ? amounts[timbre] ?? 72 : 72;

  useEffect(() => {
    const bus=manualOutput;
    if(!usesSceneKeyboard(scene) || !bus)return;
    const synth=createSceneInstrument(scene,bus,a4,()=>({
      bpm:transport.current.bpm,origin:transport.current.beatOrigin(bus.context),
    }),(frequency,velocity)=>{attack.current={count:attack.current.count+1,frequency,velocity};});
    const prefix=(device:string)=>`midi:${JSON.stringify(device)}:`;
    const pedals=new Set<string>(), sustained=new Set<string>();
    const play=(key:string,note:number,velocity:number)=>{
      if(velocity<=0)synth.release(key);
      else if(bus.context.state==="running")synth.press(key,note,Math.min(1,velocity));
    };
    const destination: PerformanceInput={
      midiNote:(device,channel,note,velocity)=>{
        const channelKey=prefix(device)+channel+":", key=channelKey+note;
        if(velocity<=0 && pedals.has(channelKey))sustained.add(key);
        else {sustained.delete(key);play(key,note,velocity);}
      },
      sustainMidi:scene!==88 ? undefined : (device,channel,down)=>{
        const channelKey=prefix(device)+channel+":";
        if(down)pedals.add(channelKey);
        else {
          pedals.delete(channelKey);
          for(const key of sustained)if(key.startsWith(channelKey)){sustained.delete(key);synth.release(key);}
        }
      },
      computerNote:(key,note,down)=>play("piano:"+key,note,down?.82:0),
      releaseMidi:(device,channel)=>{
        const start=prefix(device)+(channel===undefined?"":channel+":");
        for(const key of pedals)if(key.startsWith(start))pedals.delete(key);
        for(const key of sustained)if(key.startsWith(start))sustained.delete(key);
        synth.releaseFrom(start);
      },
      releaseAll:()=>{pedals.clear();sustained.clear();synth.releaseAll();},
    };
    const releaseAll=()=>destination.releaseAll?.();
    const hidden=()=>{if(document.hidden)releaseAll();};
    const touch={strike:(id:string,track:CubeTrack,index:number,v:number)=>play(id,48+track*12+index,v),release:synth.release};
    routing.current=destination;player.current=touch;
    window.addEventListener("blur",releaseAll);document.addEventListener("visibilitychange",hidden);
    return ()=>{
      if(routing.current===destination)routing.current=null;
      if(player.current===touch)player.current=null;
      window.removeEventListener("blur",releaseAll);document.removeEventListener("visibilitychange",hidden);
      synth.close();
    };
  },[scene,manualOutput,routing,a4]);

  useEffect(() => { splitRef.current = splitMidi; }, [splitMidi]);

  useEffect(() => {
    const master = output.current;
    if (!loopCue || !master) return;
    const effects = loopScene === 20 ? createTimbreRack(master) : null;
    rack.current = effects;
    instrument.current = effects?.input ?? master;
    return () => {
      effects?.close();
      rack.current = null;
      instrument.current = null;
    };
  }, [loopCue, loopScene, output]);

  useEffect(() => {
    if (timbre) rack.current?.select(timbre, strength);
  }, [loopCue, strength, timbre]);

  const auditionOutput = manualOutput && manualOutput.context !== clock ? manualOutput : null;
  useEffect(() => {
    if (!auditionOutput || loopScene !== 20) return;
    const effect = createTimbreRack(auditionOutput);
    auditionRack.current = effect;
    return () => { effect.close(); auditionRack.current = null; };
  }, [auditionOutput, loopScene]);
  useEffect(() => {
    if (timbre) auditionRack.current?.select(timbre, strength);
  }, [auditionOutput, strength, timbre]);

  const left = useChordLoop(three ? loopCue : null, instrument, { storageKey: "loop-left", synchronized: true, melodic: loopScene === 15, mix: 0.43 });
  const center = useChordLoop(three ? loopCue : null, instrument, { storageKey: "loop-center", synchronized: true, melodic: loopScene === 15, click: false, mix: 0.43 });
  const right = useChordLoop(three ? loopCue : null, instrument, { storageKey: "loop-right", synchronized: true, melodic: loopScene === 15, click: false, mix: 0.43 });
  const manual = useChordLoop(loopScene === 20 ? loopCue : null, instrument, { storageKey: "loop-manual", manual: true, bpm: 111, clickOutputRef: output });
  const melody = useRef([left, center, right]);
  melody.current = [left, center, right];
  const captureLeft = left.strike, captureCenter = center.strike, captureRight = right.strike, captureManual = manual.strike;

  useEffect(() => {
    if (!manualOutput || !loopCue) return;
    const bus = auditionOutput ? auditionRack.current?.input ?? auditionOutput : instrument.current;
    if (!bus) return;
    const players = CUBE_TRACKS.map((track) => createPerformanceNotes(bus, (notes) => {
      setLive((current) => current.map((existing, index) => index === track ? notes : existing) as TrackNotes);
    }, auditionOutput ? undefined : three ? [captureLeft, captureCenter, captureRight][track] : captureManual, 0.15));
    const held = new Map<string, CubeTrack>();
    const release = (id: string) => {
      const track = held.get(id);
      if (track === undefined) return;
      held.delete(id);
      if (!auditionOutput) melody.current[track].releaseNote(id);
      players[track].release(id);
    };
    const releaseAll = () => { for (const id of held.keys()) release(id); };
    const strike = (id: string, track: CubeTrack, index: number, velocity: number, midiPitch?:number) => {
      if (velocity <= 0) { release(id); return; }
      if (bus.context.state !== "running" || index < 0 || index >= CUBE_SIZE) return;
      if (held.has(id) && held.get(id) !== track) release(id);
      held.set(id, track);
      if(midiPitch!==undefined){
        while(midiPitch<21)midiPitch+=12;
        while(midiPitch>108)midiPitch-=12;
      }
      const frequency = midiPitch===undefined ? keys[track][Math.floor(index / 9)][index % 9].frequency : a4*2**((midiPitch-69)/12);
      attack.current = {count: attack.current.count + 1, frequency, velocity};
      if (!auditionOutput && loopScene === 15) melody.current[track].pressNote(id, frequency, velocity);
      players[track].press(id, frequency, velocity);
    };
    const midiPrefix = (id: string) => `midi:${JSON.stringify(id)}:`;
    const destination: PerformanceInput = {
      midiNote: (id, channel, note, velocity) => {
        const identity = `${midiPrefix(id)}${channel}:${note}`;
        if (velocity <= 0) { release(identity); return; }
        if (loopScene !== 15 && !splitRef.current) {
          const offset=note-60, track=selectedRef.current;
          strike(identity,track,((offset%CUBE_SIZE)+CUBE_SIZE)%CUBE_SIZE,velocity,keys[track][0][0].midi+offset);
          return;
        }
        const index = cubeIndexForMidi(note);
        const track = CUBE_TRACKS[Math.floor(index / CUBE_SIZE)];
        strike(identity, track, index % CUBE_SIZE, velocity, loopScene === 15 ? undefined : note);
      },
      releaseMidi(id, channel) {
        const prefix = midiPrefix(id) + (channel === undefined ? "" : `${channel}:`);
        for (const key of held.keys()) if (key.startsWith(prefix)) release(key);
      },
      computerNote: (key, note, pressed) => strike(`piano:${key}`, selectedRef.current, note - 60, pressed ? 0.85 : 0),
      releaseAll,
    };
    const keyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.metaKey || event.ctrlKey || (event.target instanceof Element && event.target.closest("input, select, textarea, [contenteditable=true]"))) return;
      const digit = /^(?:Digit|Numpad)([1-9])$/.exec(event.code)?.[1];
      const top = TOP_KEYS.indexOf(event.code);
      if (!digit && top < 0) return;
      event.preventDefault();
      const index = digit ? Number(digit) - 1 + (event.shiftKey ? 9 : 0) : 18 + top;
      strike(`keys:${event.code}`, selectedRef.current, index, 0.85);
    };
    const keyUp = (event: KeyboardEvent) => release(`keys:${event.code}`);
    const hide = () => { if (document.hidden) releaseAll(); };
    const active = { strike, release };
    player.current = active;
    routing.current = destination;
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", releaseAll);
    document.addEventListener("visibilitychange", hide);
    return () => {
      releaseAll();
      if (player.current === active) player.current = null;
      if (routing.current === destination) routing.current = null;
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", releaseAll);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [captureCenter, captureLeft, captureManual, captureRight, keys, loopCue, loopScene, manualOutput, auditionOutput, routing, three, a4]);

  return {
    attack, keys, three, timbre, selected, a4, setA4, splitMidi, live, strength, manual, loops: [left, center, right],
    select: (track: CubeTrack) => { selectedRef.current = track; setSelected(track); },
    setSplit: (split: boolean) => { splitRef.current = split; setMidiLayouts((current) => ({ ...current, [layout]: split })); },
    setStrength: (amount: number) => { if (timbre) setAmounts((current) => ({ ...current, [timbre]: amount })); },
    press: (id: string, track: CubeTrack, index: number) => player.current?.strike(id, track, index, 0.85),
    release: (id: string) => player.current?.release(id),
  };
}

type Performance = ReturnType<typeof useExtendedPerformance>;
const hz = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1, useGrouping: false });

export function ExtendedPerformanceProjection({ analyser, performance, clock, paused, scene }: {
  analyser:{current:AnalyserNode|null}; performance: Performance; clock: AudioContext; paused: boolean; scene: ExtendedScene;
}) {
  const { selected, keys, live, loops, manual, three, select, press, release } = performance;
  const pulseId = useRef(0);
  const strip = useRef<HTMLDivElement>(null);
  const active = three ? null : manual.frame;
  useEffect(() => {
    const list = strip.current;
    const track = list?.children[selected] as HTMLElement | undefined;
    if (list && track && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: track.offsetLeft - (list.clientWidth - track.clientWidth) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [selected]);
  const liveNotes = [...new Set(live.flat())].sort((a, b) => a - b);
  return <div className="extended-instrument" data-extended-scene={scene}>
    {(scene === 31 || scene === 45) && <SpiralProjection analyser={analyser} attack={performance.attack} scene={scene} clock={clock} notes={[...liveNotes, ...(active?.sounding ?? [])]} />}
    <div className="extended-cubes" ref={strip} role="group" aria-label="Tres cubos de frecuencias">
      {CUBE_TRACKS.map((track) => {
        const frame = loops[track].frame;
        const sounding = [...live[track], ...(three ? frame?.sounding ?? [] : active?.sounding ?? [])];
        return <div role="group" className="extended-track" key={track} aria-label={`Cubo ${CUBE_TRACK_NAMES[track].toLowerCase()}`} data-selected={selected === track}>
          <button type="button" className="extended-track-select" aria-pressed={selected === track} onClick={() => select(track)}>{CUBE_TRACK_NAMES[track]}</button>
          <div className="extended-cube-space">
            <div className="zero-cube extended-cube" data-folding="true" data-show-sides="true">
              {(["front", "right", "top"] as const).map((face, faceIndex) => <div className={`zero-cube-face zero-cube-${face}`} key={face} role="group" aria-label={FACE_NAMES[faceIndex]}>
                {MATRIX_ORDER.map((index) => {
                  const key = keys[track][faceIndex][index];
                  const address = faceIndex * 9 + index;
                  return <button key={key.midi} type="button" className="zero-note-key" data-hz={key.frequency}
                    data-sounding={sounding.includes(key.frequency)} aria-label={`${key.label}${scene === 15 ? " hercios" : `, ${hz.format(key.frequency)} hercios`}`}
                    onPointerDown={(event) => {
                      if (event.button !== 0) return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      press(`pointer:${event.pointerId}`, track, address);
                    }} onPointerUp={(event) => release(`pointer:${event.pointerId}`)} onPointerCancel={(event) => release(`pointer:${event.pointerId}`)}
                    onLostPointerCapture={(event) => release(`pointer:${event.pointerId}`)} onClick={(event) => {
                      if (event.detail !== 0) return;
                      const id = `button:${++pulseId.current}`;
                      press(id, track, address);
                      window.setTimeout(() => release(id), 220);
                    }}><span className="zero-note-hz">{key.label}</span></button>;
                })}
              </div>)}
            </div>
          </div>
          {three && frame && <ChordLoopTimeline clock={clock} frame={frame} paused={paused} live={live[track]} compact />}
        </div>;
      })}
    </div>
    {performance.timbre && <>
      <div className="extended-manual-strip">
        {active?.running && active.beat >= 0 ? <ChordLoopTimeline clock={clock} frame={active} paused={paused} live={liveNotes} compact />
          : liveNotes.length > 0 && <output>{liveNotes.map((frequency) => hz.format(frequency)).join(" · ")} Hz</output>}
      </div>
      <p className="extended-effect-caption">{TIMBRE_NAMES[performance.timbre]}</p>
    </>}
  </div>;
}

export function ExtendedPerformanceControls({ performance, paused, scene }: { performance: Performance; paused: boolean; scene: ExtendedScene }) {
  const { a4, setA4, selected, select, three, splitMidi, setSplit, timbre, strength, setStrength, loops, manual } = performance;
  const tuning = scene !== 15 && scene !== 16 && scene !== 89 && <>
    <label htmlFor="extended-a4">La4 de referencia <output>{a4} Hz</output></label>
    <input id="extended-a4" type="range" min={400} max={480} step={1} value={a4} onChange={(event) => setA4(Number(event.currentTarget.value))} />
    <div className="zero-loop-presets">{[440, 444].map((value) => <button type="button" key={value} aria-pressed={a4 === value} onClick={() => setA4(value)}>{value} Hz</button>)}</div>
  </>;
  if (!three && !timbre) {
    if(scene===89)return null;
    return <div className="extended-settings">
      {tuning}
      <p>{scene===16 ? "El teclado retoma la serie de los tres cubos. Desde La0, cada una de las 81 teclas sube 111 Hz." : "Piano MIDI · A–K en la computadora, con las teclas negras en la fila superior."}</p>
      {scene===88 && <p>CC64 · Pedal de resonancia del piano.</p>}
      {scene===79 && <p>Graves hasta Fa2 para el bombo, de Fa♯2 a Si3 para el bajo y desde Do4 para el arpegio.</p>}
    </div>;
  }
  return <div className="extended-settings">
    {tuning}
    <label htmlFor="extended-track-choice">Cubo del teclado</label>
    <select id="extended-track-choice" value={selected} onChange={(event) => select(Number(event.currentTarget.value) as CubeTrack)}>
      {CUBE_TRACKS.map((track) => <option value={track} key={track}>{CUBE_TRACK_NAMES[track]}</option>)}
    </select>
    {scene === 15 ? <p>MIDI · Los tres cubos recorren una sola serie en pasos de 111 Hz. Graves a la izquierda, medios al centro y agudos a la derecha. Cada lupera conserva el ritmo y la duración de tus notas.</p> : <label className="extended-midi-split"><input type="checkbox" checked={splitMidi} onChange={(event) => setSplit(event.currentTarget.checked)} /> Repartir el piano MIDI entre los tres cubos</label>}
    <p className="extended-keys">1–9 frente · Mayús + 1–9 derecha · Z, X, C, V, B, N, M, coma y punto arriba. {scene !== 15 && "Con un cubo elegido, Do4 toca su primera nota."}</p>
    {three ? <ChordLoopControls key={selected} loop={loops[selected]} active paused={paused} label={`Lupera ${CUBE_TRACK_NAMES[selected].toLowerCase()}`} /> : timbre && <>
      <label htmlFor="extended-effect-mix">{TIMBRE_NAMES[timbre]} <output>{strength}%</output></label>
      <input id="extended-effect-mix" type="range" min={0} max={100} step={1} value={strength} onChange={(event) => setStrength(Number(event.currentTarget.value))} />
      <ChordLoopControls loop={manual} active paused={paused} label="Lupera" manual />
    </>}
  </div>;
}
