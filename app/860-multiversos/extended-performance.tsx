import { useSavedSetting } from "./saved-setting";
import { TOP_KEYS } from "./control-map";
import { useEffect, useMemo, useRef, useState } from "react";
import { SpiralProjection } from "./spiral";
import { appendVisualNotes, createVisualHistory, LiveChordTimeline } from "./chord-loop-view";
import { cubeIndexForMidi, CUBE_FIRST_MIDI, CUBE_SIZE, CUBE_TRACK_NAMES, CUBE_TRACKS, DEFAULT_A4, FACE_NAMES, getCubeKeys, isTimbreScene, MATRIX_ORDER, TIMBRE_NAMES,
  type CubeTrack, type ExtendedScene, type TimbreScene } from "./extended-scenes";
import { createPerformanceNotes, type NoteFrequency, type PerformanceInput } from "./performance-notes";
import { createTimbreRack } from "./timbre-rack";
import { createSceneInstrument, sceneDrumLabel, usesSceneKeyboard } from "./scene-instrument";
import {ritualLayer} from "./ritual-patterns";
import { TEMPERAMENT_SCENE } from "./show-score";
import { useTempo } from "./tempo";

type OutputRef = { current: GainNode | null };
type TrackNotes = [NoteFrequency[], NoteFrequency[], NoteFrequency[]];
const EMPTY_TRACKS: TrackNotes = [[], [], []];

export function isPlayableExtendedScene(scene: ExtendedScene | null) {
  return scene === 15 || scene === 18 || isTimbreScene(scene);
}

export function useExtendedPerformance(scene: ExtendedScene | null, clock: AudioContext | null, output: OutputRef,
  routing: { current: PerformanceInput | null }, manualOutput: GainNode | null, firstMidi: number) {
  const [selected, setSelected] = useSavedSetting<CubeTrack>("selected", 0);
  const [a4, setA4] = useSavedSetting("a4", DEFAULT_A4);
  const [amounts, setAmounts] = useSavedSetting<Partial<Record<TimbreScene, number>>>("amounts", {});
  const [live, setLive] = useState<TrackNotes>(EMPTY_TRACKS);
  const selectedRef = useRef(selected);
  const numeric = scene !== null && scene < TEMPERAMENT_SCENE;
  const instrument = useRef<OutputRef["current"]>(null);
  const rack = useRef<ReturnType<typeof createTimbreRack> | null>(null);
  const auditionRack = useRef<ReturnType<typeof createTimbreRack> | null>(null);
  const attack = useRef({ count: 0, frequency: 0, velocity: 0 });
  const {bpm,clock:beatOrigin}=useTempo();
  const percussion=!!ritualLayer(scene);
  const transport=useRef({bpm,beatOrigin});
  transport.current={bpm,beatOrigin};
  const player = useRef<{ strike: (id: string, track: CubeTrack, index: number, velocity: number) => void; release: (id: string) => void } | null>(null);
  const timbre = isTimbreScene(scene) ? scene : null;
  const loopScene = percussion ? null : timbre ? 20 : scene === 15 || scene === 18 ? scene : null;
  const loopCue = useMemo(() => clock && loopScene ? { context: clock, beginsAt: clock.currentTime } : null, [clock, loopScene]);
  const three = loopScene === 15 || loopScene === 18;
  const keys = useMemo(() => getCubeKeys(!numeric, a4, firstMidi), [a4, numeric, firstMidi]);
  const strength = timbre ? amounts[timbre] ?? 72 : 72;

  useEffect(() => {
    const bus=manualOutput;
    if(!(usesSceneKeyboard(scene) || percussion) || !bus)return;
    const synth=createSceneInstrument(percussion ? 34 : scene as Parameters<typeof createSceneInstrument>[0],bus,a4,()=>({
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
        else {
          sustained.delete(key);
          const pitch = numeric && !percussion ? CUBE_FIRST_MIDI + note - firstMidi : note;
          if (velocity <= 0 || !numeric || percussion || pitch >= CUBE_FIRST_MIDI) play(key,pitch,velocity);
        }
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
  },[scene,manualOutput,routing,a4,firstMidi,numeric,percussion]);


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

  const histories = useMemo(() => CUBE_TRACKS.map(() => createVisualHistory()), [scene, clock]);

  useEffect(() => {
    if (!manualOutput || !loopCue) return;
    const bus = auditionOutput ? auditionRack.current?.input ?? auditionOutput : instrument.current;
    if (!bus) return;
    const players = CUBE_TRACKS.map((track) => createPerformanceNotes(bus, (notes) => {
      appendVisualNotes(histories[track], notes);
      setLive((current) => current.map((existing, index) => index === track ? notes : existing) as TrackNotes);
    }, undefined, 0.15));
    const held = new Map<string, CubeTrack>();
    const release = (id: string) => {
      const track = held.get(id);
      if (track === undefined) return;
      held.delete(id);
      players[track].release(id);
    };
    const releaseAll = () => { for (const id of held.keys()) release(id); };
    const strike = (id: string, track: CubeTrack, index: number, velocity: number) => {
      if (velocity <= 0) { release(id); return; }
      if (bus.context.state !== "running" || index < 0 || index >= CUBE_SIZE) return;
      if (held.has(id) && held.get(id) !== track) release(id);
      held.set(id, track);
      const frequency = keys[track][Math.floor(index / 9)][index % 9].frequency;
      attack.current = {count: attack.current.count + 1, frequency, velocity};
      players[track].press(id, frequency, velocity);
    };
    const midiPrefix = (id: string) => `midi:${JSON.stringify(id)}:`;
    const destination: PerformanceInput = {
      midiNote: (id, channel, note, velocity) => {
        const identity = `${midiPrefix(id)}${channel}:${note}`;
        if (velocity <= 0) { release(identity); return; }
        const index = cubeIndexForMidi(note, firstMidi);
        if (index < 0 || index >= CUBE_TRACKS.length * CUBE_SIZE) return;
        const track = CUBE_TRACKS[Math.floor(index / CUBE_SIZE)];
        strike(identity, track, index % CUBE_SIZE, velocity);
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
  }, [histories, keys, loopCue, loopScene, manualOutput, auditionOutput, routing, three, a4, numeric, firstMidi]);

  return {
    attack, keys, three, timbre, selected, a4, setA4, firstMidi, live, strength, histories,
    select: (track: CubeTrack) => { selectedRef.current = track; setSelected(track); },
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
  const { selected, keys, live, histories, three, select, press, release } = performance;
  const pulseId = useRef(0);
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = strip.current;
    const track = list?.children[selected] as HTMLElement | undefined;
    if (list && track && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: track.offsetLeft - (list.clientWidth - track.clientWidth) / 2,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }, [selected]);
  const liveNotes = [...new Set(live.flat())].sort((a, b) => a - b);
  const percussion=ritualLayer(scene);
  return <div className="extended-instrument" data-extended-scene={scene}>
    {(scene === 31 || scene === 45) && <SpiralProjection analyser={analyser} attack={performance.attack} scene={scene} clock={clock} notes={liveNotes} />}
    <div className="extended-cubes" ref={strip} role="group" aria-label={percussion ? "Tres cubos de percusión" : "Tres cubos de frecuencias"}>
      {CUBE_TRACKS.map((track) => {

        const sounding = live[track];
        return <div role="group" className="extended-track" key={track} aria-label={`Cubo ${CUBE_TRACK_NAMES[track].toLowerCase()}`} data-selected={selected === track}>
          <button type="button" className="extended-track-select" aria-pressed={selected === track} onClick={() => select(track)}>{CUBE_TRACK_NAMES[track]}</button>
          <div className="extended-cube-space">
            <div className="zero-cube extended-cube" data-folding="true" data-show-sides="true">
              {(["front", "right", "top"] as const).map((face, faceIndex) => <div className={`zero-cube-face zero-cube-${face}`} key={face} role="group" aria-label={FACE_NAMES[faceIndex]}>
                {MATRIX_ORDER.map((index) => {
                  const key = keys[track][faceIndex][index];
                  const address = faceIndex * 9 + index;
                  const drum=percussion ? sceneDrumLabel(48+track*12+address) : null;
                  return <button key={key.midi} type="button" className="zero-note-key" data-hz={drum ? undefined : key.frequency}
                    data-sounding={sounding.includes(key.frequency)} aria-label={drum ?? `${key.label}${scene === 15 ? " hercios" : `, ${hz.format(key.frequency)} hercios`}`}
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
                    }}><span className="zero-note-hz">{drum ?? key.label}</span></button>;
                })}
              </div>)}
            </div>
          </div>
          {scene === 15 && <LiveChordTimeline histories={[histories[track]]} live={live[track]} compact />}
        </div>;
      })}
    </div>
    {performance.timbre && <>
      <div className="extended-manual-strip">
        {!percussion && <LiveChordTimeline histories={histories} live={liveNotes} compact />}
      </div>
      <p className="extended-effect-caption">{ritualLayer(scene)?.name ?? TIMBRE_NAMES[performance.timbre]}</p>
    </>}
  </div>;
}

export function ExtendedPerformanceControls({ performance, paused, scene }: { performance: Performance; paused: boolean; scene: ExtendedScene }) {
  const { a4, setA4, selected, select, three, firstMidi, timbre, strength, setStrength } = performance;
  const tuning = scene >= TEMPERAMENT_SCENE && scene !== 89 && <>
    <label htmlFor="extended-a4">La4 de referencia <output>{a4} Hz</output></label>
    <input id="extended-a4" type="range" min={400} max={480} step={1} value={a4} onChange={(event) => setA4(Number(event.currentTarget.value))} />
    <div className="zero-loop-presets">{[440, 444].map((value) => <button type="button" key={value} aria-pressed={a4 === value} onClick={() => setA4(value)}>{value} Hz</button>)}</div>
  </>;
  const percussion=ritualLayer(scene);
  if(percussion)return <div className="extended-settings">
    <p>{percussion.name} · La base entra después de la cuenta. Tocá el teclado para grabar tus propios acentos encima.</p>
  </div>;
  if (!three && !timbre) {
    if(scene===89)return null;
    return <div className="extended-settings">
      {tuning}
      <p>{scene===16 ? "El teclado retoma la serie de los tres cubos. Cada tecla consecutiva sube 111 Hz." : "Piano MIDI · A–K en la computadora, con las teclas negras en la fila superior."}</p>
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
    <p>MIDI · Desde la nota {firstMidi}. Nueve teclas por cara, 27 por cubo. Teclas 1–27 a la izquierda, 28–54 en el centro y desde la 55 a la derecha.</p>
    <p className="extended-keys">1–9 frente · Mayús + 1–9 derecha · Z, X, C, V, B, N, M, coma y punto arriba.</p>
    {timbre && <>
      <label htmlFor="extended-effect-mix">{TIMBRE_NAMES[timbre]} <output>{strength}%</output></label>
      <input id="extended-effect-mix" type="range" min={0} max={100} step={1} value={strength} onChange={(event) => setStrength(Number(event.currentTarget.value))} />
    </>}
  </div>;
}
