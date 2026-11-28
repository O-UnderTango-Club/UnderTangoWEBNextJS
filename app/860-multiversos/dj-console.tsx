import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { SETTINGS_PREFIX } from "./control-map";
import {DJ_CONTROL, DJ_MIDI, DJ_MIDI_NAMES, DJ_PADS, isDjPad, isInpulse200,
  type DeckSide, type DjCommand, type DjMidiMap, type DjMidiMessage, type DjMidiTarget, type DjPad} from "./dj-midi";
import {MIDI_REASSIGNMENT, reassignMidi, sameMidiSignal, type MidiReassignment} from "./midi-reassignment";
import { djFiles, type LibraryFile } from "./dj-library";
import { ACTIVE_SCORE, displaySceneNumber, type ShowScene } from "./show-score";
import { useSavedSetting } from "./saved-setting";
import type { MidiDevice } from "./midi-inputs";
import { DjPadWaveform, djTime as time } from "./dj-pad-waveform";

type Track = { id:string; name:string; url:string; trim?:number; fadeIn?:number };
type AudioBus = GainNode | null;
type ScoreCue = { context: AudioContext; beginsAt: number };
type Launch = { trackId: string; startAt: number };
type PadPreset = { trackId: string; side: DeckSide; cueAt?: number; autoScene?: ShowScene };
type ScheduledPad = { pad: DjPad; trackId: string; side: DeckSide };
type SceneEntry = { cue: ScoreCue; scene: ShowScene; pads: ScheduledPad[]; started: Set<DeckSide> };

const unEstiloDificil: Track = {
  id: "860-un-estilo-dificil",
  name: "Un estilo difícil",
  url: "/multiversos/hardstyle.mp3",
  // Keep the score's existing level with the crossfader centred.
  trim: .48 / Math.SQRT1_2,
  fadeIn: .08,
};
const trancePsicomusical: Track = {
  id: "860-trance-psicomusical",
  name: "trance psicomusical",
  url: "/multiversos/electro.mp3",
};
const unCuerpo: Track = {
  id: "860-un-cuerpo-musical-electronico",
  name: "Un Cuerpo Musical Electrónico",
  url: "/multiversos/un-cuerpo-musical-electronico.ogg",
};
const quero: Track = {
  id: "860-quero-ver-quem-sente-de-verdade",
  name: "Quero Ver Quem Sente de Verdade",
  url: "/multiversos/quero-ver-quem-sente-de-verdade.ogg",
};
const defaultTracks: Track[] = [
  unEstiloDificil, trancePsicomusical, unCuerpo, quero,
  {id:"860-59", name:"een vriend van Hakken uit Nederland · fragmento", url:"/multiversos/repertorio-hakken.mp3"},
  {id:"860-67", name:"Un Cuerpo Musical Electrónico · fragmento", url:"/multiversos/repertorio-cuerpo.mp3"},
  {id:"860-79", name:"trance psicomusical · fragmento", url:"/multiversos/repertorio-trance.mp3"},
  {id:"860-91", name:"Quero Ver Quem Sente de Verdade · fragmento", url:"/multiversos/repertorio-quero.mp3"},
];
const AUTO_SCENES = ACTIVE_SCORE.filter(({number}) => number !== 0);

function padScene(pad: DjPad, preset: PadPreset): ShowScene {
  if (!preset.trackId) return 0;
  // Visible scene 39 has stable score ID 40.
  return preset.autoScene ?? (pad === "pad1" && preset.trackId === unEstiloDificil.id ? 40 : 0);
}
const defaultPads: Record<DjPad, PadPreset> = {
  pad1: {trackId: unEstiloDificil.id, side: "A"},
  pad2: {trackId: trancePsicomusical.id, side: "B"},
  pad3: {trackId: unCuerpo.id, side: "B"},
  pad4: {trackId: quero.id, side: "B"},
};

function initialPads(): Record<DjPad, PadPreset> {
  const presets = { ...defaultPads };
  try {
    const v2 = localStorage.getItem(SETTINGS_PREFIX + "djPadPresetsV2");
    const saved: Partial<Record<DjPad, PadPreset>> | null = JSON.parse(v2 ?? localStorage.getItem(SETTINGS_PREFIX + "djPadPresets") ?? "null");
    for (const pad of DJ_PADS) {
      const previous = saved?.[pad];
      if (previous?.side === "A" || previous?.side === "B") {
        presets[pad] = {...presets[pad], side: previous.side};
      }
    }
    if (v2 !== null && typeof saved?.pad1?.trackId === "string") {
      presets.pad1 = {...presets.pad1, trackId: saved.pad1.trackId};
    }
  } catch { /* Use the defaults if the previous presets cannot be read. */ }
  presets.pad3 = defaultPads.pad3;
  return presets;
}

function initialDeckFiles(): Record<DeckSide, string> {
  let first = unEstiloDificil.id;
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_PREFIX + "djDeckFiles") ?? "null");
    if (typeof saved?.A === "string" && saved.A) first = saved.A;
  } catch { /* A new deck uses the first pad. */ }
  return {A: first, B: unCuerpo.id};
}

function padStart(preset?: PadPreset) {
  const at = preset?.cueAt;
  return typeof at === "number" && Number.isFinite(at) && at >= 0 ? at : 0;
}

function Deck({side,track,load,canLoad,output,crossGain,launch,defaultStart,onBusy,onLaunch,onPlayback,volume,setVolume,midi}: {
  side:DeckSide;track?:Track;load:()=>void;canLoad:boolean;output:AudioBus;
  crossGain:number;launch?:Launch;defaultStart:number;onBusy:(side:DeckSide,busy:boolean)=>void;
  onLaunch:(side:DeckSide)=>void;onPlayback:(side:DeckSide,playing:boolean)=>void;
  volume:number;setVolume:(value:number)=>void;midi:ReactNode;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const node = useRef<MediaElementAudioSourceNode|null>(null);
  const gain = useRef<GainNode|null>(null);
  const resumeAt = useRef(0);
  const resumeOnScorePlay = useRef(false);
  // A media element can only be attached to one AudioContext.
  const [route,setRoute] = useState({output, version:0});
  if (route.output !== output) setRoute({output, version:route.version+1});
  const request = useRef(0), starting = useRef(false), cue = useRef(defaultStart);
  const hasPosition = useRef(false);
  const consumedLaunch = useRef<Launch | undefined>(undefined);
  const [position,setPosition] = useState(0), [duration,setDuration] = useState(0);
  const [playing,setPlaying] = useState(false), [error,setError] = useState("");
  const level = crossGain * (track?.trim ?? 1) * volume / 100;
  useEffect(() => {
    const control = gain.current;
    if (control) control.gain.setTargetAtTime(level,control.context.currentTime,.015);
  },[level]);
  const contextState = useCallback(() => {
    const el = audio.current;
    const context = node.current?.context;
    if (!el || !context) return;
    if (context.state === "suspended" && !el.paused) {
      resumeOnScorePlay.current=true;
      el.pause();
    } else if (context.state === "running" && resumeOnScorePlay.current) {
      resumeOnScorePlay.current=false;
      onBusy(side,true);
      void el.play().catch(() => {
        onBusy(side,false);
        setError("Pulsá Play para reanudar el deck.");
      });
    }
  },[onBusy,side]);
  useLayoutEffect(() => {
    const el=audio.current;
    setPlaying(false);
    return () => {
      request.current++; starting.current=false;
      resumeOnScorePlay.current=false;
      onBusy(side,false);onPlayback(side,false);
      if (el && el.readyState >= 1) resumeAt.current=el.currentTime;
      el?.pause();
      if (node.current) {
        node.current.context.removeEventListener("statechange",contextState);
        node.current.disconnect(); node.current=null;
      }
      gain.current?.disconnect(); gain.current=null;
    };
  },[contextState,onBusy,onPlayback,route.version,side]);
  function pause() {
    request.current++; starting.current=false; resumeOnScorePlay.current=false;
    audio.current?.pause(); onBusy(side,false);
  }
  function reportStopped() {
    setPlaying(false);onPlayback(side,false);
    if (!resumeOnScorePlay.current && !starting.current) onBusy(side,false);
  }
  async function play(startAt?: number) {
    const el = audio.current;
    if (!el || !track || !output || output.context.state !== "running") return;
    const seconds = startAt ?? (hasPosition.current ? undefined : defaultStart);
    if (seconds !== undefined) {
      const end = Number.isFinite(el.duration) ? Math.max(0, el.duration - .05) : seconds;
      cue.current = Math.min(seconds, end);
      resumeAt.current = cue.current;
      el.currentTime = cue.current;
      setPosition(cue.current);
      hasPosition.current = true;
    }
    if (starting.current || !el.paused) return;
    const token=++request.current;
    starting.current=true;onBusy(side,true);setError("");
    try {
      if (!node.current) {
        const context=output.context as AudioContext;
        node.current=context.createMediaElementSource(el);
        gain.current=context.createGain();
        gain.current.gain.value=level;
        node.current.connect(gain.current).connect(output);
        context.addEventListener("statechange",contextState);
      }
      if (el.ended) el.currentTime=cue.current;
      if (track.fadeIn && el.currentTime === 0 && gain.current) {
        const now = output.context.currentTime;
        gain.current.gain.cancelScheduledValues(now);
        gain.current.gain.setValueAtTime(0, now);
        gain.current.gain.linearRampToValueAtTime(level, now + track.fadeIn);
      }
      await el.play();
    } catch { if (token===request.current) setError("Revisá el archivo y pulsá Play en el deck."); }
    finally {
      if (token===request.current) {
        starting.current=false;
        if (el.paused && !resumeOnScorePlay.current) onBusy(side,false);
      }
    }
  }
  useEffect(() => {
    if (!launch || launch===consumedLaunch.current || launch.trackId!==track?.id) return;
    consumedLaunch.current=launch;
    void play(launch.startAt);
    onLaunch(side);
  });
  function toggle() {
    if (starting.current || !audio.current?.paused || resumeOnScorePlay.current) pause();
    else void play();
  }
  function stop() {
    pause();
    if (audio.current && duration) {audio.current.currentTime=cue.current;setPosition(cue.current);}
  }
  useLayoutEffect(()=>{
    function command(e:Event) {
      const c=(e as CustomEvent<DjCommand>).detail;
      if (!("side" in c) || c.side!==side) return;
      if(c.action==="play")void toggle();
      if(c.action==="cue")stop();
    }
    window.addEventListener(DJ_CONTROL,command);return ()=>window.removeEventListener(DJ_CONTROL,command);
  });
  return <div className="dj-deck" role="region" aria-label={"Deck "+side} data-side={side} data-playing={playing}>
    <div className="dj-deck-head"><strong>Deck {side}</strong><button type="button" onClick={load} disabled={!canLoad || playing} aria-label={"Cargar en deck "+side}>Cargar {side}</button></div>
    <p className="dj-track">{track?.name ?? "Sin tema cargado"}</p>
    <audio key={route.version} ref={audio} preload="auto" src={track?.url}
      onLoadedMetadata={e=>{const n=e.currentTarget.duration;setDuration(Number.isFinite(n)?n:0);
        if(resumeAt.current>0 && Number.isFinite(n)) e.currentTarget.currentTime=Math.min(resumeAt.current,n);}}
      onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)}
      onPlay={()=>{setPlaying(true);onBusy(side,true);onPlayback(side,true);}} onPause={reportStopped} onEnded={reportStopped}
      onError={()=>{if(track)setError("Este archivo no se puede reproducir.");}} />
    <input aria-label={"Posición del deck "+side} type="range" min={0} max={duration || 1} step=".01" disabled={!duration}
      value={Math.min(position,duration)} aria-valuetext={time(position)+" de "+time(duration)}
      onChange={e=>{if(audio.current){hasPosition.current=true;cue.current=Number(e.target.value);audio.current.currentTime=cue.current;setPosition(cue.current);}}}/>
    <div className="dj-transport"><button type="button" aria-label={(playing?"Pausar":"Reproducir")+" deck "+side}
      disabled={!track || !output || output.context.state!=="running"} title={output ? undefined : "Elegí una escena para reproducir"} onClick={toggle}>{playing?"Ⅱ Pausa":"▶ Play"}</button>
      <button type="button" title="Volver al punto elegido" aria-label={"Detener deck "+side} disabled={!track} onClick={stop}>■ Cue</button>
      <output>{time(position)} / {time(duration)}</output></div>
    <div className="dj-mix-row"><label>Volumen {side} · {volume} %
      <input type="range" min={0} max={100} value={volume} aria-label={"Volumen deck "+side}
        onChange={event=>setVolume(event.currentTarget.valueAsNumber)} />
    </label>{midi}</div>
    {error && <small role="status">{error}</small>}
  </div>;
}

export function DjConsole({output,inputs,scene,cue,paused,connectMidi}: {
  output:AudioBus;inputs:MidiDevice[];scene:ShowScene|null;cue:ScoreCue|null;
  paused:boolean;connectMidi:(retry?:boolean)=>Promise<void>;
}) {
  const [library,setLibrary]=useState<Track[]>(defaultTracks);
  const [choice,setChoice]=useState(unEstiloDificil.id);
  const selected=useRef(choice);
  const [loaded,setLoaded]=useSavedSetting("djDeckFilesV2",initialDeckFiles);
  const [cross,setCross]=useState(50);
  const [volumeA,setVolumeA]=useSavedSetting("djDeckVolumeA",100);
  const [volumeB,setVolumeB]=useSavedSetting("djDeckVolumeB",100);
  const [presets,setPresets]=useSavedSetting("djPadPresetsV3",initialPads);
  const [midiMap,setMidiMap]=useSavedSetting<DjMidiMap>("djMidi",{});
  const mapRef=useRef(midiMap);
  mapRef.current=midiMap;
  const [learning,setLearning]=useState<DjMidiTarget|null>(null);
  const learnRef=useRef<DjMidiTarget|null>(null);
  const held=useRef(new Set<string>());
  const [playing,setPlaying]=useState({A:false,B:false});
  const onPlayback=useCallback((side:DeckSide,value:boolean)=>{
    setPlaying(current=>current[side]===value?current:{...current,[side]:value});
  },[]);
  const [launches,setLaunches]=useState<Partial<Record<DeckSide,Launch>>>({});
  const pending=useRef(new Set<DeckSide>());
  const padOnDeck = useRef<Partial<Record<DeckSide, DjPad>>>({});
  const launchTrack = useCallback((side: DeckSide, trackId: string, startAt: number) => {
    pending.current.add(side);
    setLoaded(current => current[side] === trackId ? current : {...current, [side]: trackId});
    setLaunches(current => ({...current, [side]: {trackId, startAt}}));
  }, [setLoaded]);
  const onLaunch=useCallback((side:DeckSide)=>{pending.current.delete(side);},[]);
  const busy=useRef(new Set<DeckSide>());
  const onBusy=useCallback((side:DeckSide,active:boolean)=>{
    if (active) busy.current.add(side);
    else busy.current.delete(side);
  },[]);
  const sceneEntry = useRef<SceneEntry | null>(null);
  const [cueNotice,setCueNotice]=useState("");
  const [notice,setNotice]=useState("");
  const urls=useRef(new Map<string,string>()), mounted=useRef(false);
  const merge=useCallback((files:LibraryFile[])=>{
    const tracks=files.map(({id,file})=>{
      let url=urls.current.get(id);
      if(!url){url=URL.createObjectURL(file);urls.current.set(id,url);}
      return {id,name:file.name,url};
    });
    setLibrary(current=>{
      const byId=new Map(current.map(track=>[track.id,track]));
      for(const track of tracks)byId.set(track.id,track);
      return Array.from(byId.values());
    });
  },[]);
  useEffect(()=>{
    let active=true;mounted.current=true;
    void djFiles().then(files=>{if(active)merge(files);}).catch(()=>{if(active)setNotice("Biblioteca disponible durante esta sesión.");});
    return ()=>{active=false;mounted.current=false;urls.current.forEach(url=>URL.revokeObjectURL(url));urls.current.clear();};
  },[merge]);
  async function add(files:File[]) {
    const records=files.filter(f=>f.type.startsWith("audio/") || /\.(mp3|wav|m4a|aac|flac|ogg|opus)$/i.test(f.name))
      .map(file=>({id:JSON.stringify([file.name,file.size,file.lastModified]),file}));
    if(!records.length){setNotice("Elegí un archivo de audio.");return;}
    merge(records); select(records[0].id);setNotice("");
    try {await djFiles(records);} catch {if(mounted.current)setNotice("Archivos disponibles durante esta sesión. El navegador no pudo guardarlos.");}
  }
  function select(id:string){
    selected.current=id;
    setChoice(id);
  }
  function load(side:DeckSide,id=selected.current){
    if (!id) return;
    if (pending.current.has(side) || busy.current.has(side)) {
      setCueNotice("El deck "+side+" está en uso. Pausalo para cambiar de tema.");
      return;
    }
    select(id);
    setCueNotice("");
    delete padOnDeck.current[side];
    setLaunches(current=>({...current,[side]:undefined}));
    setLoaded(current=>({...current,[side]:id}));
  }
  const setLevel={cross:setCross,volumeA:setVolumeA,volumeB:setVolumeB};
  function triggerPad(pad: DjPad, seekTo?: number) {
    const preset = presets[pad];
    const {side, trackId} = preset;
    const track = library.find(item => item.id === trackId);
    if (!track) {setCueNotice("Cargá el archivo asignado al " + DJ_MIDI_NAMES[pad] + ".");return;}
    if (seekTo !== undefined) {
      setPresets(current => current[pad].trackId === trackId
        ? {...current, [pad]: {...current[pad], cueAt: seekTo}} : current);
      if (padOnDeck.current[side] === pad) delete padOnDeck.current[side];
    }
    if (!output || output.context.state !== "running") {
      setCueNotice(seekTo === undefined ? "Para tocar los pads, iniciá o reanudá una escena."
        : "Inicio guardado en " + time(seekTo) + ". Iniciá o reanudá una escena para escucharlo.");
      return;
    }

    const owner = padOnDeck.current[side];
    const toggle = seekTo === undefined && loaded[side] === track.id && !pending.current.has(side) &&
      (owner === pad || (owner === undefined && (preset.cueAt === undefined || playing[side])));
    padOnDeck.current[side] = pad;
    setCueNotice(DJ_MIDI_NAMES[pad] + " · " + track.name + " → " + side);
    if (toggle) window.dispatchEvent(new CustomEvent<DjCommand>(DJ_CONTROL, {detail:{action:"play",side}}));
    else flushSync(() => launchTrack(side, track.id, seekTo ?? padStart(preset)));
  }
  function toggleLearn(target:DjMidiTarget){
    const next=learnRef.current===target?null:target;
    if(next){
      window.dispatchEvent(new CustomEvent("860-midi-learn",{detail:"dj"}));
      void connectMidi(true);
    }
    learnRef.current=next;setLearning(next);
  }
  useLayoutEffect(()=>{
    function changeMidi(next:DjMidiMap){
      mapRef.current=next;
      setMidiMap(next);
    }
    function receiveMidi(event:Event){
      const e=event as CustomEvent<DjMidiMessage>;
      const {id,alias,value,type,label}=e.detail;
      const signal={id,alias,owner:"dj" as const};
      const chosen=learnRef.current;
      if(chosen){
        e.preventDefault();
        if(isDjPad(chosen)?type==="bend" || value===0:type==="note")return;
        reassignMidi(signal);
        const next={...mapRef.current};
        for(const key of Object.keys(next) as DjMidiTarget[]){
          const binding=next[key];
          if(binding && sameMidiSignal(binding.id,binding.alias,signal))delete next[key];
        }
        next[chosen]={id,alias,label};
        changeMidi(next);
        learnRef.current=null;setLearning(null);
        if(isDjPad(chosen)){held.current.add(id);return;}
        setLevel[chosen](Math.round(value*100));
        return;
      }
      const target=(Object.keys(mapRef.current) as DjMidiTarget[]).find(key=>{
        const binding=mapRef.current[key];
        return binding && sameMidiSignal(binding.id,binding.alias,signal);
      });
      if(!target)return;
      e.preventDefault();
      if(!isDjPad(target)){setLevel[target](Math.round(value*100));return;}
      if(!value){held.current.delete(id);return;}
      if(held.current.has(id))return;
      held.current.add(id);
      triggerPad(target);
    }
    function release(event:Event){
      const signal=(event as CustomEvent<MidiReassignment>).detail;
      if(signal.owner==="dj")return;
      const next={...mapRef.current};
      let changed=false;
      for(const key of Object.keys(next) as DjMidiTarget[]){
        const binding=next[key];
        if(!binding || !sameMidiSignal(binding.id,binding.alias,signal))continue;
        delete next[key];
        changed=true;
      }
      if(changed)changeMidi(next);
    }
    function reset(event:Event){
      if((event as CustomEvent).detail==="dj")return;
      learnRef.current=null;setLearning(null);
    }
    function disconnect(){held.current.clear();}
    window.addEventListener(DJ_MIDI,receiveMidi);
    window.addEventListener(MIDI_REASSIGNMENT,release);
    window.addEventListener("860-midi-learn",reset);
    window.addEventListener("860-midi-disconnect",disconnect);
    return ()=>{
      window.removeEventListener(DJ_MIDI,receiveMidi);
      window.removeEventListener(MIDI_REASSIGNMENT,release);
      window.removeEventListener("860-midi-learn",reset);
      window.removeEventListener("860-midi-disconnect",disconnect);
    };
  });
  function midiButton(target:DjMidiTarget){
    return <button type="button" className="dj-midi-learn" aria-label={"Asignar MIDI a "+DJ_MIDI_NAMES[target]}
      title={midiMap[target]?.label??"Asignar un control físico"} aria-pressed={learning===target}
      onClick={()=>toggleLearn(target)}>{learning===target?"Cancelar":midiMap[target]?"MIDI ✓":"MIDI"}</button>;
  }
  useEffect(()=>{
    const receive=(e:Event)=>{
      const c=(e as CustomEvent<DjCommand>).detail;
      // A controller can send Load and Play before the next browser paint.
      if(c.action==="load")flushSync(()=>load(c.side));
      if(c.action==="pad" && !mapRef.current[c.pad]) triggerPad(c.pad);
    };
    window.addEventListener(DJ_CONTROL,receive);return ()=>window.removeEventListener(DJ_CONTROL,receive);
  });
  useLayoutEffect(()=>{
    if (output) return;
    pending.current.clear();
    padOnDeck.current = {};
    sceneEntry.current = null;
    setLaunches({});
    setCueNotice("");
  },[output]);
  useEffect(() => {
    if (!cue || !output || scene === null || paused) return;
    const {context,beginsAt} = cue;
    if (sceneEntry.current?.cue !== cue || sceneEntry.current.scene !== scene) {
      const pads = DJ_PADS.flatMap(pad => {
        const preset=presets[pad];
        return padScene(pad,preset) === scene && scene !== 0
          ? [{pad, trackId:preset.trackId, side:preset.side}] : [];
      });
      sceneEntry.current = {cue, scene, pads, started:new Set()};
    }
    const entry = sceneEntry.current;
    if (!entry.pads.length || entry.pads.every(({side}) => entry.started.has(side))) return;

    let timer: number | undefined;
    function startPads() {
      if (context.state !== "running") return;
      const remaining = beginsAt - context.currentTime;
      if (remaining > .005) {
        timer = window.setTimeout(startPads, Math.max(8, remaining * 1000));
        return;
      }
      for (const {pad,trackId,side} of entry.pads) {
        if (entry.started.has(side)) continue;
        const preset = presets[pad];
        if (padScene(pad,preset) !== scene || preset.trackId !== trackId || preset.side !== side) continue;
        const track = library.find(item => item.id === trackId);
        if (!track) continue;
        entry.started.add(side);
        const owner = padOnDeck.current[side];
        padOnDeck.current[side] = pad;
        if (loaded[side] === trackId && (!owner || owner === pad) &&
            (busy.current.has(side) || pending.current.has(side))) continue;
        launchTrack(side, trackId, padStart(preset));
        setCueNotice("Escena "+displaySceneNumber(scene)+" · "+DJ_MIDI_NAMES[pad]+" · "+track.name+" → "+side);
      }
    }
    startPads();
    return () => window.clearTimeout(timer);
  }, [cue, launchTrack, library, loaded, output, paused, presets, scene]);

  function sceneOnDeck(pad: DjPad, side: DeckSide, scene: ShowScene) {
    if (scene === 0) return undefined;
    return DJ_PADS.find(other => pad !== other && presets[other].side === side && padScene(other,presets[other]) === scene);
  }

  const hercules=inputs.filter(p=>isInpulse200(p.name));
  const port=hercules.find(p=>p.status==="open") ?? hercules[0];
  return <details className="dj-drawer"><summary>Consola DJ · A / B</summary>
    <div className="dj-sheet">
      <img className="dj-controller-photo" src="/multiversos/hercules-inpulse-200-mk3.jpg"
        width={546} height={346} alt="Controladora Hercules DJControl Inpulse 200 MK3" loading="lazy" />
      <div className="dj-library" role="group" aria-label="Temas guardados">
        <strong>Temas guardados</strong>
        <ul className="dj-track-list">
          {library.map(track=><li key={track.id}>
            <button type="button" className="dj-track-select" aria-pressed={choice===track.id}
              onClick={()=>select(track.id)}>{track.name}</button>
            {(["A","B"] as const).map(side=><button key={side} type="button" className="dj-track-load"
              aria-label={"Cargar "+track.name+" en deck "+side} aria-pressed={loaded[side]===track.id}
              onClick={()=>load(side,track.id)}>{side}</button>)}
          </li>)}
        </ul>
        <label className="dj-files">Agregar temas <input type="file" multiple accept="audio/*,.mp3,.wav" aria-label="Agregar archivos de audio"
          onChange={e=>{const files=Array.from(e.currentTarget.files ?? []);e.currentTarget.value="";void add(files);}}/></label>
        {notice && <small role="status">{notice}</small>}
      </div>
      <small role="status">{port?.status==="open"?"Inpulse 200 MK3 conectada":port?.status==="failed"?"Puerto Hercules ocupado · revisá DJUCED":"Consola A/B · control en pantalla"}</small>
      {!output && <small>Podés cargar pistas ahora. Para escucharlas, elegí una escena.</small>}
      {cueNotice && <small role="status">{cueNotice}</small>}
      <small>Esc. programa el arranque del pad. Con 0, el pad queda manual.</small>
      <div className="dj-pads" role="group" aria-label="Pads de temas guardados">
        {DJ_PADS.map(pad=>{
          const preset=presets[pad], track=library.find(item=>item.id===preset.trackId);
          const active=loaded[preset.side]===preset.trackId && playing[preset.side];
          const startScene = padScene(pad,preset);
          return <div key={pad} className="dj-pad-cell">
            <button type="button" className="dj-pad" aria-label={DJ_MIDI_NAMES[pad]+" · "+(track?.name??"Sin tema")+" · Deck "+preset.side}
              aria-pressed={active} onClick={()=>triggerPad(pad)}>{DJ_MIDI_NAMES[pad]} · {track?.name??"Sin tema"}</button>
            <div className="dj-pad-actions">
              {midiButton(pad)}
              <label className="dj-pad-auto">
                <span aria-hidden="true">Esc.</span>
                <select aria-label={"Escena automática del "+DJ_MIDI_NAMES[pad]} value={startScene}
                  disabled={!preset.trackId} title="Escena de arranque · 0 = manual"
                  onChange={event=>{
                    const autoScene=Number(event.currentTarget.value) as ShowScene;
                    setPresets(current=>({...current,[pad]:{...current[pad],autoScene}}));
                  }}>
                  <option value={0}>0</option>
                  {AUTO_SCENES.map(({number,title})=>{
                    const occupied = sceneOnDeck(pad,preset.side,number);
                    return <option key={number} value={number} disabled={!!occupied && number!==startScene}>
                      {displaySceneNumber(number)} · {occupied ? DJ_MIDI_NAMES[occupied]+" en "+preset.side : title}
                    </option>;
                  })}
                </select>
              </label>
            </div>
            {track && <DjPadWaveform key={track.id} track={track} label={DJ_MIDI_NAMES[pad]}
              cueAt={preset.cueAt} select={seconds => triggerPad(pad, seconds)}/>}
          </div>;
        })}
      </div>
      <details><summary>Temas de los pads</summary><div className="dj-pad-settings">
        {DJ_PADS.map(pad=><div key={pad} className="dj-mix-row">
          <label>{DJ_MIDI_NAMES[pad]}<select aria-label={"Tema de "+DJ_MIDI_NAMES[pad]} value={presets[pad].trackId}
            onChange={event=>{
              const trackId = event.currentTarget.value;
              setPresets(current => current[pad].trackId === trackId ? current
                : {...current, [pad]: {
                  side: current[pad].side, trackId, autoScene: trackId ? padScene(pad,current[pad]) : 0,
                }});
            }}>
            <option value="">Sin tema</option>
            {presets[pad].trackId && !library.some(item=>item.id===presets[pad].trackId) && <option value={presets[pad].trackId}>Archivo pendiente</option>}
            {library.map(track=><option key={track.id} value={track.id}>{track.name}</option>)}
          </select></label>
          <label>Deck<select aria-label={"Deck de "+DJ_MIDI_NAMES[pad]} value={presets[pad].side}
            onChange={event=>{const side=event.currentTarget.value as DeckSide;setPresets(current=>({...current,[pad]:{...current[pad],side}}));}}>
            {(["A","B"] as const).map(side=>{
              const occupied=sceneOnDeck(pad,side,padScene(pad,presets[pad]));
              return <option key={side} value={side} disabled={!!occupied && side!==presets[pad].side}>
                {side}{occupied ? " · escena asignada al "+DJ_MIDI_NAMES[occupied] : ""}
              </option>;
            })}
          </select></label>
        </div>)}
      </div></details>
      {learning && <small role="status">{isDjPad(learning)?"Pulsá el pad físico":"Mové el fader físico"} para asignar {DJ_MIDI_NAMES[learning]}.</small>}
      <div className="dj-mix-row"><label>Crossfader
        <input type="range" min={0} max={100} value={cross} aria-label="Crossfader A/B"
          aria-valuetext={cross===50 ? "Centro" : cross<50 ? (100-2*cross)+" % hacia A" : (2*cross-100)+" % hacia B"}
          onChange={event=>setCross(event.currentTarget.valueAsNumber)} />
        <span className="dj-cross-labels"><span>A</span><span>B</span></span>
      </label>{midiButton("cross")}</div>
      {(["A","B"] as const).map(side=>{
        const track=library.find(t=>t.id===loaded[side]);
        const matchesDeck = (pad: DjPad) => presets[pad].side === side && presets[pad].trackId === track?.id;
        const owner = padOnDeck.current[side];
        const pad = owner && matchesDeck(owner) ? owner : DJ_PADS.find(matchesDeck);
        const crossGain=side==="A" ? Math.cos(cross*Math.PI/200) : Math.sin(cross*Math.PI/200);
        return <Deck key={side+(track?.id ?? "")} side={side} track={track} load={()=>load(side)} canLoad={!!choice}
          output={output} crossGain={crossGain} launch={output ? launches[side] : undefined}
          defaultStart={padStart(pad ? presets[pad] : undefined)} onBusy={onBusy} onLaunch={onLaunch}
          onPlayback={onPlayback} volume={side==="A"?volumeA:volumeB} setVolume={side==="A"?setVolumeA:setVolumeB}
          midi={midiButton(side==="A"?"volumeA":"volumeB")}/>;
      })}
    </div>
  </details>;
}
