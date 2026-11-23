import { useCallback, useEffect, useRef, useState } from "react";

import { warmRecorder, captureFactory } from "./measure-recorder";
import { useSavedSetting } from "./saved-setting";

import { useTempo } from "./tempo";

type Mode = "matrix" | "live";
type Clip = { mode:Mode; id: number; scene: string; buffer: AudioBuffer; recordedBpm:number; startBeat:number; muted: boolean; volume: number };
type Voice = { bpm:number; gain: GainNode; dispose: () => void };

export function SceneMixer({scene, pitch, input, master, paused, startScene, ready}: {
  startScene:()=>void; ready:boolean; scene?: string; pitch: number; input: GainNode | null; master: GainNode | null; paused: boolean;
}) {
  const [clips, setClips] = useState<Clip[]>([]);
  const {bpm,setBpm,clock,setLocked}=useTempo();
  const [meter,setMeter] = useSavedSetting("mixerMeter",4);
  const [bars,setBars] = useSavedSetting("mixerBars",4);
  const [room,setRoom] = useState(false);
  const [learn,setLearn]=useState(false);
  const [matrix,setMatrix]=useSavedSetting("mixerMatrixEnabled",true);
  const [live,setLive]=useSavedSetting("mixerLiveEnabled",false);
  const [liveBinding,setLiveBinding]=useSavedSetting("mixerLiveButton","");
  const [binding,setBinding] = useSavedSetting("mixerRecordButton","");
  const [state,setState] = useState<"idle"|"padding"|"recording">("idle");
  useEffect(()=>{setLocked(state!=="idle");return ()=>setLocked(false);},[state,setLocked]);
  const [position,setPosition] = useState(0);
  const [message,setMessage] = useState("");
  const voices = useRef(new Map<number, Voice>());
  const serial = useRef(0);
  const generation = useRef(0);
  const pending=useRef(new Map<Mode,{silence:()=>void;cancel:()=>void}>());
  const matrixStart=useRef(0);
  const [waiting,setWaiting]=useState(false);
  const mic = useRef<MediaStream|null>(null);
  const external = useRef<MediaStream|null>(null);
  const [shared,setShared] = useState(false);
  const [requesting,setRequesting] = useState(false);
  const alive=useRef(true);
  const queued=useRef<Mode[]>([]);
  useEffect(()=>{alive.current=true;return ()=>{alive.current=false;for(const stream of [mic.current,external.current])stream?.getTracks().forEach(t=>t.stop());};},[]);
  useEffect(()=>{if(input)warmRecorder(input.context as AudioContext);},[input]);
  async function chooseSource(kind:"room"|"computer", enabled:boolean) {
    const ref=kind==="room"?mic:external;
    const update=kind==="room"?setRoom:setShared;
    if(!enabled){ref.current?.getTracks().forEach(t=>t.stop());ref.current=null;update(false);return;}
    setRequesting(true);setMessage("");
    try {
      const stream=kind==="room" ? await navigator.mediaDevices.getUserMedia({audio:true}) :
        await navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
      if(!alive.current || !stream.getAudioTracks().length){
        stream.getTracks().forEach(t=>t.stop());
        if(alive.current)setMessage("Elegí una fuente con la opción Compartir audio activada.");
        return;
      }
      ref.current=stream;update(true);
      stream.getAudioTracks()[0].onended=()=>{stream.getTracks().forEach(t=>t.stop());if(ref.current===stream){ref.current=null;update(false);}};
    } catch {setMessage(kind==="room"?"Micrófono desactivado. Revisá el permiso de Sala.":"Se mantiene el estéreo de 860.");}
    finally {if(alive.current)setRequesting(false);}
  }
  const tone = useRef<OscillatorNode | null>(null);
  const stopTone = useCallback(() => { tone.current?.stop(); tone.current = null; }, []);
  const beat = 60 / bpm;
  const cycle = beat * meter * bars;
  const cancel = useCallback(() => {
    generation.current++;
    for(const take of pending.current.values())take.cancel();
    pending.current.clear();setWaiting(false);

    setState("idle");
  },[]);
  useEffect(() => () => { cancel(); stopTone(); }, [input,cancel,stopTone]);
  useEffect(() => () => stopTone(), [scene,stopTone]);

  useEffect(() => {
    if (!input || paused) return;
    const origin=clock(input.context);
    let frame=0;
    const draw=()=> {
      const now=input.context.currentTime;
      setWaiting(pending.current.has("matrix") && now<matrixStart.current);
      setPosition(Math.floor(Math.max(0,now-origin)/beat) % (meter*bars));

      frame=requestAnimationFrame(draw);
    };
    draw();return ()=>cancelAnimationFrame(frame);
  },[clock,input,paused,beat,meter,bars]);

  const play = useCallback(() => {
    if (!input || !scene || paused || tone.current) return;
    const ctx = input.context;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = pitch;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.14, ctx.currentTime, 0.007);
    osc.connect(gain).connect(input);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    tone.current = osc;
    osc.start();
  }, [input, scene, paused, pitch]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyP" && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey &&
        !(e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable=true]"))) play();
    };
    const up = (e: KeyboardEvent) => { if (e.code === "KeyP") stopTone(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    window.addEventListener("blur", stopTone);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", stopTone); };
  }, [play, stopTone]);

  function pressRecord(){
    if(paused || requesting || queued.current.length)return;
    const modes:Mode[]=[];
    if(matrix && !pending.current.has("matrix"))modes.push("matrix");
    if(live && !pending.current.has("live"))modes.push("live");
    if(!modes.length)return;
    if(!scene || !input || !master){
      if(ready){queued.current=modes;startScene();}
      return;
    }
    for(const kind of modes)record(kind);
  }
  function record(kind:Mode) {
    if(!scene || !input || !master || pending.current.has(kind))return;
    if(paused || requesting)return;

    const ctx=input.context as AudioContext;
    if(cycle>180){setMessage("Para grabar hasta 3 minutos a este tempo, elegí menos compases.");return;}
    const attempt=generation.current;
    setMessage("");
    try {
      const makeCapture=captureFactory(ctx);
      const origin=clock(ctx);
      const start=ctx.currentTime;
      const pressBeat=(start-origin)/beat;
      const startBeat=kind==="matrix" ? Math.ceil(pressBeat/meter)*meter : pressBeat;
      const base=origin+startBeat*beat;
      const end=base+cycle;
      if(kind==="matrix"){matrixStart.current=base;setWaiting(base>start);}
      const length=Math.round(ctx.sampleRate*cycle);
      const capture=makeCapture(Math.round(base*ctx.sampleRate),length,Math.round(end*ctx.sampleRate),onLoop);
      const node=capture.node;
      const gain=ctx.createGain();gain.gain.value=0.75;
      node.connect(gain).connect(master);
      const gate=ctx.createGain();
      const sources:AudioNode[]=[];
      sources.push(shared && external.current ? ctx.createMediaStreamSource(external.current) : input);
      if(room && mic.current)sources.push(ctx.createMediaStreamSource(mic.current));
      for(const source of sources)source.connect(gate);
      gate.connect(node);
      const detach=()=>{for(const source of sources)source.disconnect(gate);gate.disconnect();};
      const dispose=()=>{capture.stop();gain.disconnect();};
      pending.current.set(kind,{silence:()=>{gate.gain.setValueAtTime(0,ctx.currentTime);capture.finish(Math.round(ctx.currentTime*ctx.sampleRate));},cancel:()=>{detach();dispose();}});
      const label=scene;
      function onLoop(channels:Float32Array[]){
        if(attempt!==generation.current)return;
        detach();dispose();pending.current.delete(kind);
        const buffer=ctx.createBuffer(2,length,ctx.sampleRate);
        channels.forEach((samples,ch)=>buffer.getChannelData(ch).set(samples));
        const id=++serial.current;
        const source=ctx.createBufferSource(), level=ctx.createGain();
        source.buffer=buffer;source.loop=true;level.gain.value=0.75;
        source.connect(level).connect(master!);
        const firstRepeat=base+length/ctx.sampleRate;
        const when=Math.max(firstRepeat,ctx.currentTime);
        source.start(when,(when-firstRepeat)%buffer.duration);
        voices.current.set(id,{bpm,gain:level,dispose:()=>{source.stop();source.disconnect();level.disconnect();}});

        setClips(all=>[...all,{id,mode:kind,scene:label,buffer,recordedBpm:bpm,startBeat,volume:75,muted:false}]);if(!pending.current.size)setState("idle");
      };
      setState("recording");
    } catch {
      if(attempt!==generation.current)return;
      cancel();setMessage(room ? "Revisá el permiso de micrófono. Para grabar solo el instrumento, desactivá Sala." : "No se pudo iniciar la captura de audio.");
    }
  }
  function releaseLive(){
    queued.current=queued.current.filter(kind=>kind!=="live");
    pending.current.get("live")?.silence();
  }
  useEffect(()=>{
    window.addEventListener("blur",releaseLive);
    return ()=>window.removeEventListener("blur",releaseLive);
  },[]);
  useEffect(()=>{
    if(queued.current.length && scene && input && master){const modes=queued.current;queued.current=[];for(const kind of modes)record(kind);}
  },[scene,input,master]);
  const pressed=useRef(new Set<string>());
  useEffect(()=>{
    const receive=(event:Event)=>{
      const e=event as CustomEvent<{id:string;on:boolean}>;
      const id=e.detail.id;
      const matches=id===(binding || liveBinding);
      if(!scene || (!learn && !matches))return;
      e.preventDefault();
      if(!e.detail.on){
        if(pressed.current.delete(id) && matches) releaseLive();
        return;
      }
      if(pressed.current.has(id))return;
      pressed.current.add(id);
      if(learn){
        setBinding(id);setLiveBinding("");setLearn(false);return;
      }
      if(matches)pressRecord();
    };
    window.addEventListener("860-record-midi",receive);
    return ()=>window.removeEventListener("860-record-midi",receive);
  });
  useEffect(() => {
    const active = voices.current;
    return () => { for (const v of active.values()) { v.dispose(); } active.clear(); };
  }, [master]);
  useEffect(() => {
    if (!master) return;
    const ctx = master.context;
    for (const [id,v] of voices.current) if (!clips.some(c => c.id === id)) {
      v.dispose(); voices.current.delete(id);
    }
    for (const clip of clips) {
      let voice = voices.current.get(clip.id);
      if(voice && voice.bpm!==bpm){voice.dispose();voices.current.delete(clip.id);voice=undefined;}
      if (!voice) {
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        gain.gain.value = 0;
        source.buffer = clip.buffer; source.loop = true;
        const beatNow=(ctx.currentTime-clock(ctx))*bpm/60;
        const seconds=(beatNow-clip.startBeat)*60/clip.recordedBpm;
        const offset=((seconds%clip.buffer.duration)+clip.buffer.duration)%clip.buffer.duration;
        source.playbackRate.value=bpm/clip.recordedBpm;
        source.connect(gain).connect(master); source.start(0,offset);
        voice = {bpm,gain,dispose:()=>{source.stop();source.disconnect();gain.disconnect();}}; voices.current.set(clip.id,voice);
      }
      voice.gain.gain.setTargetAtTime(clip.muted ? 0 : clip.volume / 100, ctx.currentTime, 0.012);
    }
  }, [master,clips,bpm,clock]);


  return <div className="scene-mixer" role="region" aria-label="Lupera de objetos sonoros">
    <div className="scene-mixer-tools">
      <button className="scene-record" aria-label="Grabar" title="Grabar con los modos seleccionados" disabled={(!scene && !ready && !queued.current.length)||paused||requesting||(!matrix && !live)}
        onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);pressRecord();}}
        onPointerUp={releaseLive} onPointerCancel={releaseLive} onLostPointerCapture={releaseLive}
        onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();if(!e.repeat)pressRecord();}}}
        onKeyUp={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();releaseLive();}}}>●</button>
      <label title="Grabar los compases configurados desde el próximo tiempo 1"><input type="checkbox" checked={matrix} disabled={state!=="idle"} onChange={e=>setMatrix(e.target.checked)}/> Matriz</label>
      <label title="Grabar desde que apretás hasta que soltás"><input type="checkbox" checked={live} disabled={state!=="idle"} onChange={e=>setLive(e.target.checked)}/> En vivo</label>
      <output>{state==="recording" ? [pending.current.has("live")?"En vivo grabando":"",pending.current.has("matrix")?(waiting?"Matriz espera el 1":"Matriz grabando"):""].filter(Boolean).join(" · ") : shared?"Audio compartido":"Estéreo de 860"}</output>
      <div className="tempo-lights" role="img" aria-label={input ? `Compás ${Math.floor(position/meter)+1} de ${bars}, pulso ${position%meter+1} de ${meter}` : `${bars} compases de ${meter} pulsos`}>
        {Array.from({length:bars},(_,bar)=><span className="tempo-bar" key={bar} aria-hidden="true">
          {Array.from({length:meter},(_,pulse)=><i key={pulse} data-current={Boolean(input) && (bar*meter+pulse)===position} />)}
        </span>)}
      </div>
      <label title="Sumar el micrófono predeterminado"><input type="checkbox" checked={room} disabled={requesting||state!=="idle"} onChange={e=>void chooseSource("room",e.target.checked)}/> Sala</label>
      <details><summary>{bpm} BPM · {bars} × {meter}</summary>
      <label>BPM <input aria-label="BPM de grabación" type="number" min="1" max="240" key={bpm} defaultValue={bpm} disabled={state!=="idle"} onBlur={e=>{const n=Math.min(240,Math.max(1,Math.round(Number(e.target.value)||111)));setBpm(n);e.target.value=String(n);}} /></label>
      <label>Pulsos <select aria-label="Pulsos" disabled={state!=="idle"} value={meter} onChange={e=>setMeter(Number(e.target.value))}>{[2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Compases <select aria-label="Compases" disabled={state!=="idle"} value={bars} onChange={e=>setBars(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,12,16].map(n=><option key={n}>{n}</option>)}</select></label>
      <label><input type="checkbox" checked={shared} disabled={requesting||state!=="idle"} onChange={e=>void chooseSource("computer",e.target.checked)}/> Audio de otra pestaña o pantalla</label>
      <button aria-pressed={learn} onClick={()=>setLearn(!learn)}>{learn?"Pulsá el botón MIDI":`MIDI · Récord${binding||liveBinding?" ✓":""}`}</button>
      </details>
      <button disabled={!scene || paused} aria-label="Tocar sonido de escena" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); play(); }}
        onPointerUp={stopTone} onLostPointerCapture={stopTone} onKeyDown={e => { if (e.key === " " || e.key === "Enter") play(); }}
        onKeyUp={stopTone}>Tocar · P</button>
      {message && <small role="status">{message}</small>}
    </div>
    {clips.map(clip => <div className="scene-mixer-row" key={clip.id}>
      <span>#{clip.id} · {clip.mode==="matrix"?"Matriz":"En vivo"} · {clip.scene} · {clip.buffer.duration.toFixed(1)} s</span>
      <button aria-pressed={clip.muted} onClick={() => setClips(all => all.map(c => c.id === clip.id ? {...c,muted:!c.muted} : c))}>{clip.muted ? "Activar" : "Mutear"}</button>
      <input aria-label={"Volumen del sonido " + clip.id} type="range" min="0" max="100" value={clip.volume}
        onChange={e => { const volume = Number(e.target.value); setClips(all => all.map(c => c.id === clip.id ? {...c,volume} : c)); }} />
      <button aria-label={"Eliminar sonido " + clip.id} onClick={() => setClips(all => all.filter(c => c.id !== clip.id))}>×</button>
    </div>)}
  </div>;
}
