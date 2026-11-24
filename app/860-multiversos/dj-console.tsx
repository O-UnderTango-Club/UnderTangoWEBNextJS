import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { REPERTOIRE } from "./repertoire-cue";
import { DJ_CONTROL, isInpulse200, type DeckSide, type DjCommand } from "./dj-midi";
import { djFiles, type LibraryFile } from "./dj-library";
import { useSavedSetting } from "./saved-setting";
import type { MidiDevice } from "./midi-inputs";

type Track = { id:string; name:string; url:string };
type AudioBus = () => Promise<AudioNode>;
const fragments:Track[] = Object.entries(REPERTOIRE).flatMap(([id, clip]) => clip ? [{id:"860-"+id, name:clip.title+" · fragmento", url:clip.file}] : []);
const time = (s:number) => Math.floor(s/60)+":"+String(Math.floor(s%60)).padStart(2,"0");

function Deck({side,track,load,canLoad,output}: {side:DeckSide;track?:Track;load:()=>void;canLoad:boolean;output:AudioBus}) {
  const audio = useRef<HTMLAudioElement>(null);
  const node = useRef<MediaElementAudioSourceNode|null>(null);
  const request = useRef(0), starting = useRef(false), cue = useRef(0);
  const [position,setPosition] = useState(0), [duration,setDuration] = useState(0);
  const [playing,setPlaying] = useState(false), [error,setError] = useState("");
  const contextState = useCallback(() => {
    if (node.current && node.current.context.state !== "running") audio.current?.pause();
  },[]);
  useEffect(() => {
    const el=audio.current;
    return () => {
      request.current++;
      el?.pause();
      if (node.current) {
        node.current.context.removeEventListener("statechange",contextState);
        node.current.disconnect(); node.current=null;
      }
    };
  },[contextState]);
  function pause() {
    request.current++; starting.current=false; audio.current?.pause();
  }
  async function toggle() {
    const el=audio.current;
    if (!el || !track) return;
    if (starting.current || !el.paused) {pause();return;}
    const token=++request.current;
    starting.current=true;setError("");
    try {
      const bus=await output();
      if (token!==request.current) return;
      if (!node.current) {
        node.current=(bus.context as AudioContext).createMediaElementSource(el);
        node.current.connect(bus);
        bus.context.addEventListener("statechange",contextState);
      }
      if (el.ended) el.currentTime=cue.current;
      await el.play();
    } catch { if (token===request.current) setError("Revisá el archivo y pulsá Play en la página."); }
    finally { if (token===request.current) starting.current=false; }
  }
  function stop() {
    pause();
    if (audio.current && duration) {audio.current.currentTime=cue.current;setPosition(cue.current);}
  }
  useLayoutEffect(()=>{
    function command(e:Event) {
      const c=(e as CustomEvent<DjCommand>).detail;
      if (c.action==="browse" || c.side!==side) return;
      if(c.action==="play")void toggle();
      if(c.action==="cue")stop();
    }
    window.addEventListener(DJ_CONTROL,command);return ()=>window.removeEventListener(DJ_CONTROL,command);
  });
  return <div className="dj-deck" role="region" aria-label={"Deck "+side} data-side={side} data-playing={playing}>
    <div className="dj-deck-head"><strong>Deck {side}</strong><button type="button" onClick={load} disabled={!canLoad} aria-label={"Cargar en deck "+side}>Cargar {side}</button></div>
    <p className="dj-track">{track?.name ?? "Sin tema cargado"}</p>
    <audio ref={audio} preload="metadata" src={track?.url}
      onLoadedMetadata={e=>{const n=e.currentTarget.duration;setDuration(Number.isFinite(n)?n:0);}}
      onTimeUpdate={e=>setPosition(e.currentTarget.currentTime)}
      onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onEnded={()=>setPlaying(false)}
      onError={()=>{if(track)setError("Este archivo no se puede reproducir.");}} />
    <input aria-label={"Posición del deck "+side} type="range" min={0} max={duration || 1} step=".01" disabled={!duration}
      value={Math.min(position,duration)} aria-valuetext={time(position)+" de "+time(duration)}
      onChange={e=>{if(audio.current){cue.current=Number(e.target.value);audio.current.currentTime=cue.current;setPosition(cue.current);}}}/>
    <div className="dj-transport"><button type="button" aria-label={(playing?"Pausar":"Reproducir")+" deck "+side}
      disabled={!track} onClick={()=>void toggle()}>{playing?"Ⅱ Pausa":"▶ Play"}</button>
      <button type="button" title="Volver al punto elegido" aria-label={"Detener deck "+side} disabled={!track} onClick={stop}>■ Cue</button>
      <output>{time(position)} / {time(duration)}</output></div>
    {error && <small role="status">{error}</small>}
  </div>;
}

export function DjConsole({output,inputs}: {output:AudioBus;inputs:MidiDevice[]}) {
  const [library,setLibrary]=useState<Track[]>(fragments);
  const [choice,setChoice]=useState(fragments[0]?.id ?? "");
  const selected=useRef(choice);
  const [loaded,setLoaded]=useSavedSetting("djDeckFiles",{A:"",B:""});
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
    if(id)setLoaded(current=>({...current,[side]:id}));
  }
  useEffect(()=>{
    const receive=(e:Event)=>{
      const c=(e as CustomEvent<DjCommand>).detail;
      // A controller can send Browse, Load and Play before the next browser paint.
      if(c.action==="load")flushSync(()=>load(c.side));
      if(c.action==="browse" && library.length){
        const i=library.findIndex(t=>t.id===selected.current);
        select(library[(i+c.step+library.length)%library.length].id);
      }
    };
    window.addEventListener(DJ_CONTROL,receive);return ()=>window.removeEventListener(DJ_CONTROL,receive);
  });
  const hercules=inputs.filter(p=>isInpulse200(p.name));
  const port=hercules.find(p=>p.status==="open") ?? hercules[0];
  return <details className="dj-drawer"><summary>Consola DJ · A / B</summary>
    <div className="dj-sheet">
      <small role="status">{port?.status==="open"?"Inpulse 200 MK3 conectada":port?.status==="failed"?"Puerto Hercules ocupado · revisá DJUCED":"Consola A/B · control en pantalla"}</small>
      <label>Biblioteca <select value={choice} aria-label="Tema de la biblioteca" onChange={e=>select(e.target.value)}>
        {library.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label className="dj-files">Agregar audio <input type="file" multiple accept="audio/*,.mp3,.wav" aria-label="Agregar archivos de audio"
        onChange={e=>{const files=Array.from(e.currentTarget.files ?? []);e.currentTarget.value="";void add(files);}}/></label>
      {notice && <small role="status">{notice}</small>}
      {(["A","B"] as const).map(side=>{
        const track=library.find(t=>t.id===loaded[side]);
        return <Deck key={side+(track?.id ?? "")} side={side} track={track} load={()=>load(side)} canLoad={!!choice} output={output}/>;
      })}
    </div>
  </details>;
}
