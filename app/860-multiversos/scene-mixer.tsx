import { useCallback, useEffect, useRef, useState } from "react";

import { captureFactory } from "./measure-recorder";
import { useSavedSetting } from "./saved-setting";

type Clip = { id: number; scene: string; buffer: AudioBuffer; muted: boolean; volume: number };
type Voice = { gain: GainNode; dispose: () => void };

export function SceneMixer({scene, pitch, input, master, paused}: {
  scene?: string; pitch: number; input: GainNode | null; master: GainNode | null; paused: boolean;
}) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [bpm,setBpm] = useSavedSetting("mixerBpm",111);
  const [meter,setMeter] = useSavedSetting("mixerMeter",4);
  const [bars,setBars] = useSavedSetting("mixerBars",4);
  const [room,setRoom] = useState(true);
  const [learn,setLearn] = useState(false);
  const [binding,setBinding] = useSavedSetting("mixerRecordButton","");
  const [state,setState] = useState<"idle"|"waiting"|"recording"|"preparing">("idle");
  const [origin,setOrigin] = useState<number|null>(null);
  const [position,setPosition] = useState(0);
  const [message,setMessage] = useState("");
  const voices = useRef(new Map<number, Voice>());
  const serial = useRef(0);
  const generation = useRef(0);
  const pending = useRef<null | {start:number; cancel:()=>void}>(null);
  const mic = useRef<MediaStream|null>(null);
  const tone = useRef<OscillatorNode | null>(null);
  const stopTone = useCallback(() => { tone.current?.stop(); tone.current = null; }, []);
  const beat = 60 / bpm;
  const cycle = beat * meter * bars;
  const cancel = useCallback(() => {
    generation.current++;
    pending.current?.cancel(); pending.current=null;
    mic.current?.getTracks().forEach(track=>track.stop()); mic.current=null;
    setState("idle");
  },[]);
  useEffect(() => () => { cancel(); stopTone(); }, [scene,input,cancel,stopTone]);
  useEffect(() => {setOrigin(null);setPosition(0);},[input,bpm,meter,bars]);
  useEffect(() => {
    if (origin===null || !input || paused) return;
    let frame=0;
    const draw=()=> {
      const now=input.context.currentTime;
      setPosition(Math.floor(Math.max(0,now-origin)/beat) % (meter*bars));
      if(pending.current && now>=pending.current.start) setState("recording");
      frame=requestAnimationFrame(draw);
    };
    draw();return ()=>cancelAnimationFrame(frame);
  },[origin,input,paused,beat,meter,bars]);

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

  async function record() {
    if (!input || !master || !scene || paused) return;
    if (state !== "idle") { cancel(); return; }
    const ctx=input.context as AudioContext;
    const attempt=++generation.current;
    setMessage("");setState("preparing");
    try {
      const makeCapture=await captureFactory(ctx);
      if (attempt!==generation.current) return;
      let stream: MediaStream|null=null;
      if (room) {
        stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
        if (attempt!==generation.current) {stream.getTracks().forEach(t=>t.stop());return;}
        mic.current=stream;
      }
      const earliest=ctx.currentTime+0.1;
      const anchor=origin ?? earliest;
      const start=anchor+Math.max(0,Math.ceil((earliest-anchor)/cycle))*cycle;
      const length=Math.round(ctx.sampleRate*cycle);
      const capture=makeCapture(Math.round(start*ctx.sampleRate),length,onLoop);
      const node=capture.node;
      const gain=ctx.createGain();gain.gain.value=0.75;
      node.connect(gain).connect(master);
      const source=stream ? ctx.createMediaStreamSource(stream) : null;
      input.connect(node);source?.connect(node);
      const detach=()=>{input.disconnect(node);source?.disconnect();stream?.getTracks().forEach(t=>t.stop());mic.current=null;};
      const dispose=()=>{capture.stop();gain.disconnect();};
      pending.current={start,cancel:()=>{detach();dispose();}};
      const label=scene;
      function onLoop(channels:Float32Array[]){
        if(attempt!==generation.current)return;
        detach();pending.current=null;
        const buffer=ctx.createBuffer(2,length,ctx.sampleRate);
        channels.forEach((samples,ch)=>buffer.getChannelData(ch).set(samples));
        const id=++serial.current;
        voices.current.set(id,{gain,dispose});
        setClips(all=>[...all,{id,scene:label,buffer,volume:75,muted:false}]);setState("idle");
      };
      setOrigin(anchor);setState("waiting");
    } catch {
      if(attempt!==generation.current)return;
      cancel();setMessage(room ? "Revisá el permiso de micrófono. Para grabar solo el instrumento, desactivá Sala." : "No se pudo iniciar la captura de audio.");
    }
  }
  useEffect(()=>{
    let pressed=false;
    const receive=(event:Event)=>{
      const e=event as CustomEvent<{id:string;on:boolean}>;
      if(!scene || (!learn && e.detail.id!==binding)) return;
      e.preventDefault();
      if(!e.detail.on){pressed=false;return;}
      if(pressed)return;
      pressed=true;
      if(learn){setBinding(e.detail.id);setLearn(false);return;}
      if(state==="idle")void record();
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
      if (!voice) {
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        gain.gain.value = 0;
        source.buffer = clip.buffer; source.loop = true;
        source.connect(gain).connect(master); source.start();
        voice = {gain,dispose:()=>{source.stop();source.disconnect();gain.disconnect();}}; voices.current.set(clip.id,voice);
      }
      voice.gain.gain.setTargetAtTime(clip.muted ? 0 : clip.volume / 100, ctx.currentTime, 0.012);
    }
  }, [master,clips]);

  if (!scene && !clips.length && !message) return null;
  return <div className="scene-mixer" role="region" aria-label="Lupera de objetos sonoros">
    <div className="scene-mixer-tools">
      <label>BPM <input aria-label="BPM de grabación" type="number" min="30" max="240" defaultValue={bpm} disabled={state!=="idle"} onBlur={e=>{const n=Math.min(240,Math.max(30,Math.round(Number(e.target.value)||111)));setBpm(n);e.target.value=String(n);}} /></label>
      <label>Pulsos <select aria-label="Pulsos" disabled={state!=="idle"} value={meter} onChange={e=>setMeter(Number(e.target.value))}>{[2,3,4].map(n=><option key={n}>{n}</option>)}</select></label>
      <label>Compases <select aria-label="Compases" disabled={state!=="idle"} value={bars} onChange={e=>setBars(Number(e.target.value))}>{[1,2,3,4,5,6,7,8,12,16].map(n=><option key={n}>{n}</option>)}</select></label>
      <label><input type="checkbox" checked={room} disabled={state!=="idle"} onChange={e=>setRoom(e.target.checked)}/> Sala</label>
      <button disabled={!input||paused||state!=="idle"} aria-label="Play del reloj" onClick={()=>setOrigin(input!.context.currentTime)}>▶</button>
      <output>Compás {Math.floor(position/meter)+1}/{bars} · Pulso {position%meter+1}/{meter}</output>
      <progress aria-label="Posición en la vuelta" max={bars*meter} value={position+1}/>
      <button disabled={!scene || paused} onClick={()=>void record()}>{state==="idle"?"Grabar sonido":state==="preparing"?"Preparando · Cancelar":state==="waiting"?"Espera del 1 · Cancelar":"Grabando · Cancelar"}</button>
      <button aria-label="Asignar botón MIDI a grabar" aria-pressed={learn} title={binding?"Reasignar botón MIDI":"Asignar botón MIDI"} onClick={()=>setLearn(!learn)}>{learn?"Pulsá el botón MIDI":binding?"MIDI ✓":"MIDI ●"}</button>
      <button disabled={!scene || paused} aria-label="Tocar sonido de escena" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); play(); }}
        onPointerUp={stopTone} onLostPointerCapture={stopTone} onKeyDown={e => { if (e.key === " " || e.key === "Enter") play(); }}
        onKeyUp={stopTone}>Tocar · P</button>
      {message && <small role="status">{message}</small>}
    </div>
    {clips.map(clip => <div className="scene-mixer-row" key={clip.id}>
      <span>#{clip.id} · {clip.scene} · {clip.buffer.duration.toFixed(1)} s</span>
      <button aria-pressed={clip.muted} onClick={() => setClips(all => all.map(c => c.id === clip.id ? {...c,muted:!c.muted} : c))}>{clip.muted ? "Activar" : "Mutear"}</button>
      <input aria-label={"Volumen del sonido " + clip.id} type="range" min="0" max="100" value={clip.volume}
        onChange={e => { const volume = Number(e.target.value); setClips(all => all.map(c => c.id === clip.id ? {...c,volume} : c)); }} />
      <button aria-label={"Eliminar sonido " + clip.id} onClick={() => setClips(all => all.filter(c => c.id !== clip.id))}>×</button>
    </div>)}
  </div>;
}
