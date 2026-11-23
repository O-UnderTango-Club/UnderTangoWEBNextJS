import { useCallback, useEffect, useRef, useState } from "react";

import { protectPeaks, RECORDING_CEILING } from "./peak-protection";
import { warmRecorder, captureFactory } from "./measure-recorder";
import { useSavedSetting } from "./saved-setting";

import { useTempo } from "./tempo";

const BANK_ACTIONS = {volume:"Volumen",stop:"Stop",play:"Play inmediato",next:"Play en el 1",toggle:"Play / stop"} as const;
type BankAction = keyof typeof BANK_ACTIONS;
type Assignment = {slot:number;action:BankAction;label:string};
type BankMessage = {id:string;value:number;type:"cc"|"note"|"bend";reserved:boolean;label:string};

type Mode = "matrix" | "live";
type Clip = { slot:number; stopped:boolean; launchBeat?:number; mode:Mode; id: number; scene: string; buffer: AudioBuffer; recordedBpm:number; startBeat:number; muted: boolean; volume: number };
type Voice = { bpm:number; gain: GainNode; dispose: () => void };

export function SceneMixer({analyser,monitor,synthStream, scene, pitch, input, master, paused, startScene, ready}: {
  analyser?:{current:AnalyserNode|null}; monitor:AudioNode|null; synthStream:MediaStream|null; startScene:()=>void; ready:boolean; scene?: string; pitch: number; input: GainNode | null; master: GainNode | null; paused: boolean;
}) {
  const [clips, setClips] = useState<Clip[]>([]);
  const {bpm,setBpm,clock,setLocked}=useTempo();
  const [meter,setMeter] = useSavedSetting("mixerMeter",4);
  const [bars,setBars] = useSavedSetting("mixerBars",4);
  const [room,setRoom] = useState(false);
  const [bankMap,setBankMap]=useSavedSetting<Record<string,Assignment>>("sampleBankMidi",{});
  const [bankSlot,setBankSlot]=useState(0);
  const [bankLearn,setBankLearn]=useState<BankAction|null>(null);
  const downControls=useRef(new Set<string>());
  const bankVolumes=useRef(new Map<number,number>());
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
  const launchContext=useRef(new WeakMap<AudioBuffer,BaseAudioContext>());
  const serial = useRef(0);
  const occupied=useRef(new Set<number>());
  const stopGeneration=useRef(0);
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
  // The scene and the lower synth own different AudioContexts. Bridge the synth
  // for recording only; its normal speaker output stays connected exactly once.
  const stereo=useRef<GainNode|null>(null);
  useEffect(()=>{
    if(!monitor)return;
    const bus=monitor.context.createGain();
    bus.channelCount=2;bus.channelCountMode="explicit";
    monitor.connect(bus);stereo.current=bus;
    return ()=>{monitor.disconnect(bus);bus.disconnect();stereo.current=null;};
  },[monitor]);
  useEffect(()=>{
    const bus=stereo.current;
    if(!bus || !synthStream)return;
    const synth=(bus.context as AudioContext).createMediaStreamSource(synthStream);
    synth.connect(bus);
    return ()=>synth.disconnect();
  },[master,synthStream]);
  useEffect(()=>{
    const bus=stereo.current;
    if(!bus || !analyser)return;
    const meter=bus.context.createAnalyser();
    meter.fftSize=1024;meter.smoothingTimeConstant=0.65;
    bus.connect(meter);analyser.current=meter;
    return ()=>{bus.disconnect(meter);analyser.current=null;};
  },[monitor,analyser]);
  async function chooseSource(kind:"room"|"computer", enabled:boolean) {
    const ref=kind==="room"?mic:external;
    const update=kind==="room"?setRoom:setShared;
    if(!enabled){ref.current?.getTracks().forEach(t=>t.stop());ref.current=null;update(false);return;}
    setRequesting(true);setMessage("");
    try {
      const stream=kind==="room" ? await navigator.mediaDevices.getUserMedia({audio:true}) :
        await navigator.mediaDevices.getDisplayMedia({video:true,audio:true,systemAudio:"include",selfBrowserSurface:"exclude"} as DisplayMediaStreamOptions);
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
    if(occupied.current.size+modes.length>9){
      setMessage(modes.length===2?"Matriz y En vivo necesitan dos espacios libres.":"Los nueve espacios están ocupados.");
      return;
    }
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
    const slot=Array.from({length:9},(_,i)=>i).find(i=>!occupied.current.has(i)) ?? -1;
    if(slot<0)return;
    occupied.current.add(slot);
    const stopAtStart=stopGeneration.current;
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
      // The processor outputs silence. Keep it outside the recorded master graph.
      node.connect(gain).connect(ctx.destination);
      const gate=ctx.createGain();
      const sources:AudioNode[]=[];
      const desktop=shared ? external.current : null;
      const surface=desktop?.getVideoTracks()[0]?.getSettings().displaySurface;
      if(!desktop || surface==="browser")sources.push(stereo.current ?? master);
      if(desktop)sources.push(ctx.createMediaStreamSource(desktop));
      if(room && mic.current)sources.push(ctx.createMediaStreamSource(mic.current));
      for(const source of sources)source.connect(gate);
      const protectedTake=protectPeaks(gate,RECORDING_CEILING);
      protectedTake.connect(node);
      const detach=()=>{for(const source of sources)source.disconnect(gate);gate.disconnect();protectedTake.disconnect();};
      const dispose=()=>{capture.stop();gain.disconnect();};
      pending.current.set(kind,{silence:()=>{gate.gain.setValueAtTime(0,ctx.currentTime);capture.finish(Math.round(ctx.currentTime*ctx.sampleRate));},cancel:()=>{occupied.current.delete(slot);detach();dispose();}});
      const label=scene;
      function onLoop(channels:Float32Array[]){
        if(attempt!==generation.current)return;
        detach();dispose();pending.current.delete(kind);
        const buffer=ctx.createBuffer(2,length,ctx.sampleRate);
        channels.forEach((samples,ch)=>buffer.getChannelData(ch).set(samples));
        const id=++serial.current;
        launchContext.current.set(buffer,ctx);
        const stopped=stopAtStart!==stopGeneration.current;
        setClips(all=>[...all,{id,slot,stopped,mode:kind,scene:label,buffer,recordedBpm:bpm,startBeat,launchBeat:startBeat+meter*bars,volume:bankVolumes.current.get(slot) ?? 75,muted:false}]);if(!pending.current.size)setState("idle");
      };
      setState("recording");
    } catch {
      if(attempt!==generation.current)return;
      occupied.current.delete(slot);cancel();setMessage(room ? "Revisá el permiso de micrófono. Para grabar solo el instrumento, desactivá Sala." : "No se pudo iniciar la captura de audio.");
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
    const mixGain=1/Math.sqrt(Math.max(1,clips.reduce((sum,c)=>sum+(c.stopped||c.muted?0:(c.volume/100)**2),0)));
    for (const clip of clips) {
      if(clip.stopped)continue;
      let voice = voices.current.get(clip.id);
      if(voice && voice.bpm!==bpm){voice.dispose();voices.current.delete(clip.id);voice=undefined;}
      if (!voice) {
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        gain.gain.value = 0;
        source.buffer = clip.buffer; source.loop = true;
        const origin=clock(ctx);
        const when=Math.max(ctx.currentTime,origin+(launchContext.current.get(clip.buffer)===ctx ? clip.launchBeat ?? 0 : 0)*60/bpm);
        const beatNow=(when-origin)*bpm/60;
        const seconds=(beatNow-clip.startBeat)*60/clip.recordedBpm;
        const offset=((seconds%clip.buffer.duration)+clip.buffer.duration)%clip.buffer.duration;
        source.playbackRate.value=bpm/clip.recordedBpm;
        source.connect(gain).connect(master); source.start(when,offset);
        voice = {bpm,gain,dispose:()=>{source.stop();source.disconnect();gain.disconnect();}}; voices.current.set(clip.id,voice);
      }
      voice.gain.gain.setTargetAtTime(clip.muted ? 0 : mixGain * clip.volume / 100, ctx.currentTime, 0.012);
    }
  }, [master,clips,bpm,clock]);


  function halt(id:number){
    voices.current.get(id)?.dispose();
    voices.current.delete(id);
  }
  function stopAll(){
    stopGeneration.current++;
    for(const id of voices.current.keys())halt(id);
    setClips(all=>all.map(c=>({...c,stopped:true,launchBeat:undefined})));
  }
  function launch(id:number, quantized:boolean){
    if(!master || paused)return;
    const ctx=master.context;
    const now=(ctx.currentTime-clock(ctx))/beat;
    const beatsPerRound=meter*bars;
    const start=quantized?(Math.floor(now/beatsPerRound)+1)*beatsPerRound:now;
    const clip=clips.find(c=>c.id===id);
    if(!clip)return;
    launchContext.current.set(clip.buffer,ctx);
    halt(id);
    setClips(all=>all.map(c=>c.id===id?{...c,stopped:false,muted:false,startBeat:start,launchBeat:start}:c));
  }
  function stopClip(id:number){
    halt(id);
    setClips(all=>all.map(c=>c.id===id?{...c,stopped:true}:c));
  }
  useEffect(()=>{
    function receive(event:Event){
      const e=event as CustomEvent<BankMessage>;
      const {id,value,type,reserved,label}=e.detail;
      let assignment=bankMap[id];
      if(learn)return;
      if(bankLearn){
        if(bankLearn==="volume"?type==="note":type==="bend" || value===0)return;
        if(reserved || id===(binding||liveBinding)){
          e.preventDefault();setMessage("Ese control ya maneja otro parámetro de 860. Elegí otro.");return;
        }
        e.preventDefault();
        assignment={slot:bankSlot,action:bankLearn,label};
        const selected=assignment;
        setBankMap(current=>{
          const next={...current};
          for(const key of Object.keys(next))if(next[key].slot===selected.slot && next[key].action===selected.action)delete next[key];
          next[id]=selected;
          return next;
        });
        setBankLearn(null);setMessage("");
        if(assignment.action!=="volume"){downControls.current.add(id);return;}
      }
      if(!assignment || reserved || id===(binding||liveBinding))return;
      e.preventDefault();
      const {slot,action}=assignment;
      const clip=clips.find(c=>c.slot===slot);
      if(action==="volume"){
        const volume=Math.round(value*100);
        bankVolumes.current.set(slot,volume);
        if(clip)setClips(all=>all.map(c=>c.id===clip.id?{...c,volume}:c));
        return;
      }
      if(!value){downControls.current.delete(id);return;}
      if(downControls.current.has(id))return;
      downControls.current.add(id);
      if(!clip)return;
      if(action==="stop" || (action==="toggle" && !clip.stopped))stopClip(clip.id);
      else launch(clip.id,action==="next");
    }
    window.addEventListener("860-bank-midi",receive);
    return ()=>window.removeEventListener("860-bank-midi",receive);
  });
  return <div className="scene-mixer" role="region" aria-label="Lupera de objetos sonoros">
    <div className="scene-mixer-tools">
      <button className="scene-record" aria-label="Grabar" title="Grabar con los modos seleccionados" disabled={(!scene && !ready && !queued.current.length)||paused||requesting||(!matrix && !live)}
        onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);pressRecord();}}
        onPointerUp={releaseLive} onPointerCancel={releaseLive} onLostPointerCapture={releaseLive}
        onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();if(!e.repeat)pressRecord();}}}
        onKeyUp={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();releaseLive();}}}>●</button>
      <button aria-label="Detener todos los clips" title="Detener todos los clips" onClick={stopAll}>■</button>
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
      <label><input type="checkbox" checked={shared} disabled={requesting||state!=="idle"} onChange={e=>void chooseSource("computer",e.target.checked)}/> Compartir audio de la computadora</label>
      <small>Para todo lo que suena en la computadora, elegí Pantalla completa y activá Compartir audio del sistema.</small>
      <button aria-pressed={learn} onClick={()=>{setBankLearn(null);setLearn(!learn);}}>{learn?"Pulsá el botón MIDI":`MIDI · Récord${binding||liveBinding?" ✓":""}`}</button>
      </details>
      <details onToggle={e=>{if(!e.currentTarget.open)setBankLearn(null);}}><summary>MIDI · Samples</summary>
        <label>Sample <select aria-label="Sample para asignar MIDI" value={bankSlot} onChange={e=>{setBankSlot(Number(e.target.value));setBankLearn(null);}}>
          {Array.from({length:9},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label>
        {(Object.keys(BANK_ACTIONS) as BankAction[]).map(action=>{
          const entry=Object.entries(bankMap).find(([,v])=>v.slot===bankSlot && v.action===action);
          return <span key={action}><button aria-pressed={bankLearn===action} title={entry?.[1].label}
            aria-label={`Asignar ${BANK_ACTIONS[action]} al sample ${bankSlot+1}`}
            onClick={()=>{setLearn(false);setMessage("");setBankLearn(bankLearn===action?null:action);}}>
            {bankLearn===action?(action==="volume"?"Mové el fader":"Pulsá el botón"):BANK_ACTIONS[action]+(entry?" ✓":"")}</button>
            {entry && <button aria-label={`Quitar asignación de ${BANK_ACTIONS[action]}`} onClick={()=>{setBankLearn(null);setBankMap(current=>{const next={...current};delete next[entry[0]];return next;});}}>×</button>}</span>;
        })}
      </details>
      <button disabled={!scene || paused} aria-label="Tocar sonido de escena" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); play(); }}
        onPointerUp={stopTone} onLostPointerCapture={stopTone} onKeyDown={e => { if (e.key === " " || e.key === "Enter") play(); }}
        onKeyUp={stopTone}>Tocar · P</button>
      {message && <small role="status">{message}</small>}
    </div>
    <div className="sample-bank" aria-label="Banco de nueve samples">
    {Array.from({length:9},(_,slot)=>{
      const clip=clips.find(c=>c.slot===slot);
      if(!clip)return <div className="sample-empty" aria-label={`Espacio ${slot+1} libre`} key={slot}>{slot+1}</div>;
      const waitingForPlay=master && launchContext.current.get(clip.buffer)===master.context && clip.launchBeat!==undefined && master.context.currentTime<clock(master.context)+clip.launchBeat*beat;
      return <div className="scene-mixer-row" role="group" aria-label={`Sample ${slot+1}`} key={slot}>
      <span>{slot+1} · {clip.mode==="matrix"?"Matriz":"En vivo"} · {clip.scene} · {clip.buffer.duration.toFixed(1)} s · {clip.stopped?"Detenido":waitingForPlay?"Espera del 1":"En marcha"}</span>
      <button title="Detener sample" aria-label="Detener sample" onClick={()=>stopClip(clip.id)}>■</button>
      <button title="Reproducir ahora" aria-label="Reproducir ahora" disabled={!master||paused} onClick={()=>launch(clip.id,false)}>▶</button>
      <button title="Reproducir en el próximo tiempo 1" aria-label="Reproducir en el próximo tiempo 1" disabled={!master||paused} onClick={()=>launch(clip.id,true)}>▶ 1</button>
      <button aria-pressed={clip.muted} onClick={() => setClips(all => all.map(c => c.id === clip.id ? {...c,muted:!c.muted} : c))}>{clip.muted ? "Activar" : "Mutear"}</button>
      <input aria-label={"Volumen del sonido " + clip.id} type="range" min="0" max="100" value={clip.volume}
        onChange={e => { const volume = Number(e.target.value); setClips(all => all.map(c => c.id === clip.id ? {...c,volume} : c)); }} />
      <button aria-label={"Eliminar sonido " + clip.id} onClick={() => {halt(clip.id);occupied.current.delete(slot);setMessage("");setClips(all => all.filter(c => c.id !== clip.id));}}>×</button>
    </div>;})}</div>
  </div>;
}
