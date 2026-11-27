import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { SETTINGS_PREFIX } from "./control-map";
import { REPERTOIRE } from "./repertoire-cue";
import { DJ_CONTROL, isInpulse200, type DeckSide, type DjCommand } from "./dj-midi";
import { djFiles, type LibraryFile } from "./dj-library";
import { SHOW_SCORE, type ShowScene } from "./show-score";
import { useSavedSetting } from "./saved-setting";
import type { MidiDevice } from "./midi-inputs";

type Track = { id:string; name:string; url:string };
type AudioBus = GainNode | null;
type ScoreCue = { context: AudioContext; beginsAt: number };
type DjEntry = { trackId:string; scene:ShowScene; offset:number; side:DeckSide };
type Launch = { trackId:string };
const repertoire = Object.entries(REPERTOIRE).flatMap(([id, clip], index) => clip ? [{
  track: {id:"860-"+id, name:clip.title+" · fragmento", url:clip.file},
  entry: {trackId:"860-"+id, scene:Number(id) as ShowScene, offset:clip.entry, side:(index % 2 ? "B" : "A") as DeckSide},
}] : []);
const fragments = repertoire.map(({track}) => track);
function initialEntries(): DjEntry[] {
  return repertoire.map(({entry}) => {
    // A fragment disabled on the old score stays disabled on first opening the DJ console.
    try {
      if (localStorage.getItem(SETTINGS_PREFIX + "repertoire-" + entry.scene) === "false") {
        return {...entry, trackId:""};
      }
    } catch { /* Use the score defaults if storage is unavailable. */ }
    return entry;
  });
}
const time = (s:number) => Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");

function Deck({side,track,load,canLoad,output,crossGain,launch,onBusy,onLaunch}: {
  side:DeckSide;track?:Track;load:()=>void;canLoad:boolean;output:AudioBus;
  crossGain:number;launch?:Launch;onBusy:(side:DeckSide,busy:boolean)=>void;
  onLaunch:(side:DeckSide)=>void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const node = useRef<MediaElementAudioSourceNode|null>(null);
  const gain = useRef<GainNode|null>(null);
  const resumeAt = useRef(0);
  const resumeOnScorePlay = useRef(false);
  // A media element can only be attached to one AudioContext.
  const [route,setRoute] = useState({output, version:0});
  if (route.output !== output) setRoute({output, version:route.version+1});
  const request = useRef(0), starting = useRef(false), cue = useRef(0);
  const consumedLaunch = useRef<Launch | undefined>(undefined);
  const [position,setPosition] = useState(0), [duration,setDuration] = useState(0);
  const [playing,setPlaying] = useState(false), [error,setError] = useState("");
  const [volume,setVolume] = useSavedSetting("djDeckVolume"+side, 100);
  const level = crossGain * volume / 100;
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
      onBusy(side,false);
      if (el && el.readyState >= 1) resumeAt.current=el.currentTime;
      el?.pause();
      if (node.current) {
        node.current.context.removeEventListener("statechange",contextState);
        node.current.disconnect(); node.current=null;
      }
      gain.current?.disconnect(); gain.current=null;
    };
  },[contextState,onBusy,route.version,side]);
  function pause() {
    request.current++; starting.current=false; resumeOnScorePlay.current=false;
    audio.current?.pause(); onBusy(side,false);
  }
  function reportStopped() {
    setPlaying(false);
    if (!resumeOnScorePlay.current && !starting.current) onBusy(side,false);
  }
  async function play(fromStart = false) {
    const el=audio.current;
    if (!el || !track || !output || output.context.state !== "running" || starting.current || !el.paused) return;
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
      if (fromStart) {cue.current=0;resumeAt.current=0;el.currentTime=0;}
      else if (el.ended) el.currentTime=cue.current;
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
    void play(true);
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
      if (c.action==="scene" || c.side!==side) return;
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
      onPlay={()=>{setPlaying(true);onBusy(side,true);}} onPause={reportStopped} onEnded={reportStopped}
      onError={()=>{if(track)setError("Este archivo no se puede reproducir.");}} />
    <input aria-label={"Posición del deck "+side} type="range" min={0} max={duration || 1} step=".01" disabled={!duration}
      value={Math.min(position,duration)} aria-valuetext={time(position)+" de "+time(duration)}
      onChange={e=>{if(audio.current){cue.current=Number(e.target.value);audio.current.currentTime=cue.current;setPosition(cue.current);}}}/>
    <div className="dj-transport"><button type="button" aria-label={(playing?"Pausar":"Reproducir")+" deck "+side}
      disabled={!track || !output || output.context.state!=="running"} title={output ? undefined : "Elegí una escena para reproducir"} onClick={toggle}>{playing?"Ⅱ Pausa":"▶ Play"}</button>
      <button type="button" title="Volver al punto elegido" aria-label={"Detener deck "+side} disabled={!track} onClick={stop}>■ Cue</button>
      <output>{time(position)} / {time(duration)}</output></div>
    <label>Volumen {side} · {volume} %
      <input type="range" min={0} max={100} value={volume} aria-label={"Volumen deck "+side}
        onChange={event=>setVolume(event.currentTarget.valueAsNumber)} />
    </label>
    {error && <small role="status">{error}</small>}
  </div>;
}

export function DjConsole({output,inputs,scene,cue,seconds,paused,automatic,setAutomatic}: {
  output:AudioBus;inputs:MidiDevice[];scene:ShowScene|null;cue:ScoreCue|null;seconds:number;
  paused:boolean;automatic:boolean;setAutomatic:(enabled:boolean)=>void;
}) {
  const [library,setLibrary]=useState<Track[]>(fragments);
  const [choice,setChoice]=useState(fragments[0]?.id ?? "");
  const selected=useRef(choice);
  const [loaded,setLoaded]=useSavedSetting("djDeckFiles",{A:fragments[0]?.id ?? "",B:fragments[1]?.id ?? ""});
  const [entries,setEntries]=useSavedSetting("djScoreEntries",initialEntries);
  const [cross,setCross]=useState(50);
  const [launches,setLaunches]=useState<Partial<Record<DeckSide,Launch>>>({});
  const pending=useRef(new Set<DeckSide>());
  const onLaunch=useCallback((side:DeckSide)=>{pending.current.delete(side);},[]);
  const busy=useRef(new Set<DeckSide>());
  const onBusy=useCallback((side:DeckSide,active:boolean)=>{
    if (active) busy.current.add(side);
    else busy.current.delete(side);
  },[]);
  const fired=useRef<{cue:ScoreCue;rows:Set<number>} | undefined>(undefined);
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
  function load(side:DeckSide){
    const id=selected.current;
    if (!id || pending.current.has(side) || busy.current.has(side)) return;
    setLaunches(current=>({...current,[side]:undefined}));
    setLoaded(current=>({...current,[side]:id}));
  }
  useEffect(()=>{
    const receive=(e:Event)=>{
      const c=(e as CustomEvent<DjCommand>).detail;
      // A controller can send Load and Play before the next browser paint.
      if(c.action==="load")flushSync(()=>load(c.side));
    };
    window.addEventListener(DJ_CONTROL,receive);return ()=>window.removeEventListener(DJ_CONTROL,receive);
  });
  useLayoutEffect(()=>{
    if (output) return;
    pending.current.clear();
    setLaunches({});
    setCueNotice("");
  },[output]);
  function changeEntry(index:number,change:Partial<DjEntry>) {
    setEntries(current=>current.map((entry,i)=>i===index ? {...entry,...change} : entry));
  }
  useEffect(()=>{
    if (!automatic || !cue || paused || !output || scene===null) return;
    if (fired.current?.cue!==cue) fired.current={cue,rows:new Set()};
    const {rows}=fired.current;
    const timers:number[]=[];
    entries.forEach((entry,index)=>{
      if (!entry.trackId || entry.scene!==scene || entry.offset>=seconds || rows.has(index)) return;
      const at=cue.beginsAt+entry.offset;
      const launch=()=>{
        const now=cue.context.currentTime;
        if (cue.context.state!=="running" || rows.has(index) || now>=cue.beginsAt+seconds) return;
        if (at-now>.005) {
          timers.push(window.setTimeout(launch,(at-now)*1000));
          return;
        }
        const track=library.find(item=>item.id===entry.trackId);
        if (!track) {
          setCueNotice("Falta el archivo de la entrada "+(index+1)+".");
          return;
        }
        rows.add(index);
        if (pending.current.has(entry.side) || busy.current.has(entry.side)) {
          setCueNotice("Entrada "+(index+1)+" omitida. Deck "+entry.side+" ocupado.");
          return;
        }
        pending.current.add(entry.side);
        setLoaded(current=>({...current,[entry.side]:track.id}));
        const next={trackId:track.id};
        setLaunches(current=>({...current,[entry.side]:next}));
        setCueNotice("Escena "+scene+" · "+track.name+" → "+entry.side);
      };
      launch();
    });
    return ()=>timers.forEach(timer=>window.clearTimeout(timer));
  },[automatic,cue,entries,library,output,paused,scene,seconds,setLoaded]);

  const hercules=inputs.filter(p=>isInpulse200(p.name));
  const port=hercules.find(p=>p.status==="open") ?? hercules[0];
  return <details className="dj-drawer"><summary>Consola DJ · A / B</summary>
    <div className="dj-sheet">
      <small role="status">{port?.status==="open"?"Inpulse 200 MK3 conectada":port?.status==="failed"?"Puerto Hercules ocupado · revisá DJUCED":"Consola A/B · control en pantalla"}</small>
      {!output && <small>Podés cargar pistas ahora. Para escucharlas, elegí una escena.</small>}
      {cueNotice && <small role="status">{cueNotice}</small>}
      <label>Crossfader
        <input type="range" min={0} max={100} value={cross} aria-label="Crossfader A/B"
          aria-valuetext={cross===50 ? "Centro" : cross<50 ? (100-2*cross)+" % hacia A" : (2*cross-100)+" % hacia B"}
          onChange={event=>setCross(event.currentTarget.valueAsNumber)} />
        <span className="dj-cross-labels"><span>A</span><span>B</span></span>
      </label>
      {(["A","B"] as const).map(side=>{
        const track=library.find(t=>t.id===loaded[side]);
        const crossGain=side==="A" ? Math.cos(cross*Math.PI/200) : Math.sin(cross*Math.PI/200);
        return <Deck key={side+(track?.id ?? "")} side={side} track={track} load={()=>load(side)} canLoad={!!choice}
          output={output} crossGain={crossGain} launch={output ? launches[side] : undefined} onBusy={onBusy} onLaunch={onLaunch}/>;
      })}
      <label>Biblioteca <select value={choice} aria-label="Tema de la biblioteca" onChange={e=>select(e.target.value)}>
        {library.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label className="dj-files">Agregar audio <input type="file" multiple accept="audio/*,.mp3,.wav" aria-label="Agregar archivos de audio"
        onChange={e=>{const files=Array.from(e.currentTarget.files ?? []);e.currentTarget.value="";void add(files);}}/></label>
      {notice && <small role="status">{notice}</small>}
      <details className="dj-entries">
        <summary>Pauta musical</summary>
        <label className="dj-arm"><input type="checkbox" checked={automatic} onChange={event=>setAutomatic(event.target.checked)} />
          Activar entradas por escena
        </label>
        {entries.map((entry,index)=><fieldset key={index}>
          <legend>Entrada {index+1}</legend>
          <label>Tema <select value={entry.trackId} onChange={event=>changeEntry(index,{trackId:event.target.value})}>
            <option value="">Sin tema</option>
            {entry.trackId && !library.some(item=>item.id===entry.trackId) && <option value={entry.trackId}>Archivo pendiente</option>}
            {library.map(track=><option key={track.id} value={track.id}>{track.name}</option>)}
          </select></label>
          <div className="dj-entry-fields">
            <label>Escena <select value={entry.scene} onChange={event=>changeEntry(index,{scene:Number(event.target.value) as ShowScene})}>
              {SHOW_SCORE.map(({number,title})=><option key={number} value={number}>{number} · {title}</option>)}
            </select></label>
            <label>Segundo <input type="number" min={0} step={.1} value={entry.offset} onChange={event=>{
              const offset=event.currentTarget.valueAsNumber;
              if (Number.isFinite(offset)) changeEntry(index,{offset:Math.max(0,offset)});
            }}/></label>
            <label>Deck <select value={entry.side} onChange={event=>changeEntry(index,{side:event.target.value as DeckSide})}>
              <option>A</option><option>B</option>
            </select></label>
          </div>
        </fieldset>)}
      </details>
      {[...new Set(entries.map(entry=>entry.trackId))].map(id=>{
        const track=library.find(item=>item.id===id);
        return track ? <audio key={id} hidden preload="auto" src={track.url} /> : null;
      })}
    </div>
  </details>;
}
