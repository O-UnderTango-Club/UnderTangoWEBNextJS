import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { protectPeaks, RECORDING_CEILING } from "./peak-protection";
import { captureFactory } from "./measure-recorder";
import { useSavedSetting } from "./saved-setting";
import { BANK_ACTIONS, type BankAssignment as Assignment } from "./control-map";

import { useTempo } from "./tempo";
import { TransportMidiButton, type TransportMidi } from "./transport-midi";
import { MIDI_REASSIGNMENT, reassignMidi, sameMidiSignal, type MidiReassignment } from "./midi-reassignment";
import { LiveSetProjection } from "./live-set-projection";
import { LAYERS, isLayer, countLayer, firstRepeat, type LayerPlan } from "./layer-take";
import { SCENE_INSTRUMENT_NAMES } from "./scene-instrument";
import type { LiveSetScene } from "./extended-scenes";
import type { PerformanceInput } from "./performance-notes";
import { useRoomInstrument } from "./room-instrument";
import { getVoiceMicrophone, useVoiceLoop, VOICE_CUES, type VoiceScene } from "./voice-loop";
import { SampleWaveform } from "./sample-waveform";

type BankAction = keyof typeof BANK_ACTIONS;
type BankMessage = {id:string;alias?:string;value:number;type:"cc"|"note"|"bend";reserved:boolean;label:string};

type Mode = "matrix" | "live";
const BANK_SIZE = 9;
type RecordingBatch = { version:number; lastCompleted:number };
type Recording = { kind:Mode; slot:number; batch:RecordingBatch; order:number };
type Clip = {
  slot:number; stopped:boolean; once?:boolean; launchBeat?:number; layer?:number; mode:Mode;
  id:number; scene:string; buffer:AudioBuffer; meter:number; bars:number; muted:boolean; volume:number;
};
type Voice = {
  bpm:number; gain:GainNode; source:AudioBufferSourceNode; dispose:()=>void;
  phaseTime:number; phaseOffset:number; duration:number;
};

function phaseInCycle(time:number, cycle:number) {
  const wrap=time%cycle;
  const phase=wrap<0 ? wrap+cycle : wrap;
  return phase<1e-9 || cycle-phase<1e-9 ? 0 : phase;
}

export function SceneMixer({children, stageBackground, extendedDark, canPlayNote,connectMidi,transportMidi,playGeneral,pauseScene,stopScene,analyser,roomAnalyser,monitor, scene, routing, liveSet, codaScene, countingTake, input, master, paused, startScene, ready, voiceScene, cue, seconds}: {
  children: ReactNode; stageBackground: string; extendedDark: boolean;
  voiceScene: VoiceScene | null; cue: {context: AudioContext; beginsAt: number} | null; seconds: number;
  roomAnalyser: {current:AnalyserNode|null};
  codaScene: number | null;
  liveSet: LiveSetScene | null; countingTake: {current:boolean}; routing:{current:PerformanceInput|null};
  canPlayNote: boolean; transportMidi: TransportMidi; playGeneral: () => void; pauseScene: () => void; stopScene: () => void;
  connectMidi:(rescan?:boolean)=>Promise<void>;
  analyser?:{current:AnalyserNode|null}; monitor:AudioNode|null; startScene:()=>void; ready:boolean; scene?: string; input: GainNode | null; master: GainNode | null; paused: boolean;
}) {
  const [clips, setClips] = useState<Clip[]>([]);
  const {bpm,setBpm,clock,setLocked}=useTempo();
  const [meter,setMeter] = useSavedSetting("mixerMeter",4);
  const [bars,setBars] = useSavedSetting("mixerBars",4);
  const [room,setRoom] = useState(false);
  const [bankMap,setBankMap]=useSavedSetting<Record<string,Assignment>>("sampleBankMidi",{});
  const target=useRef<number|null>(null);
  const [selected,setSelected]=useState<number|null>(null);
  const reservedSlots=useRef(new Set<number>());
  const previous=useRef(new Map<number,Clip>());
  const currentClips=useRef(clips);
  currentClips.current=clips;
  const selectionVersion=useRef(0);
  function selectSlot(slot:number|null){
    selectionVersion.current++;
    showDestination(slot);
  }
  function showDestination(slot:number|null){
    target.current=slot;setSelected(slot);
    setBankSlot(slot??0);
  }
  const [bankSlot,setBankSlot]=useState(0);
  const [bankLearn,setBankLearn]=useState<BankAction|null>(null);
  const downControls=useRef(new Set<string>());
  const bankVolumes=useRef(new Map<number,number>());
  const [matrix,setMatrix]=useSavedSetting("mixerMatrixEnabled",true);
  const [live,setLive]=useSavedSetting("mixerLiveEnabled",false);
  const [state,setState] = useState<"idle"|"padding"|"recording">("idle");
  useEffect(()=>{setLocked(state!=="idle");return ()=>setLocked(false);},[state,setLocked]);
  const [position,setPosition] = useState(0);
  const [message,setMessage] = useState("");
  const [clearArmed,setClearArmed] = useState(false);
  const clearPress = useRef<{button:string;until:number;timer:number} | null>(null);
  const disarmClear = useCallback(() => {
    if (!clearPress.current) return;
    window.clearTimeout(clearPress.current.timer);
    clearPress.current=null;
    setClearArmed(false);
  },[]);
  useEffect(() => {
    disarmClear();
    return disarmClear;
  },[cue,transportMidi.learning,disarmClear]);
  const voices = useRef(new Map<number, Voice>());
  const waveCursors = useRef(new Map<number, HTMLSpanElement>());
  const launchContext=useRef(new WeakMap<AudioBuffer,BaseAudioContext>());
  const serial = useRef(0);
  const occupied=useRef(new Set<number>());
  const stopGeneration=useRef(0);
  const generation = useRef(0);
  const pending=useRef(new Map<Mode,{slot:number;silence:()=>void;cancel:()=>void}>());
  const matrixStart=useRef(0);
  const [waiting,setWaiting]=useState(false);
  const mic = useRef<MediaStream|null>(null);
  const sceneMic = useRef(false);
  const micRequest = useRef<AbortController | null>(null);
  const voice = useVoiceLoop(voiceScene, cue, seconds, room ? mic.current : null, input, bpm);
  const showRoomInput = liveSet === 89 && room && voice.phase !== "playing";
  const roomMeter = useRoomInstrument(liveSet === 89 && !paused, room ? mic.current : null, input);
  useEffect(()=>{
    roomAnalyser.current=showRoomInput ? roomMeter.current : null;
    return ()=>{roomAnalyser.current=null;};
  },[showRoomInput,paused,input,roomMeter,roomAnalyser]);
  const [countIn,setCountIn] = useState<number|null>(null);
  const armed = useRef<typeof cue>(null);
  const layer = useRef<LayerPlan|null>(null);
  const firstPasses = useRef(new Map<number,ReturnType<typeof firstRepeat>>());
  const [layerState,setLayerState]=useState("");
  const external = useRef<MediaStream|null>(null);
  const [shared,setShared] = useState(false);
  const [requestKind,setRequestKind] = useState<"room"|"computer"|null>(null);
  const requesting = requestKind !== null;
  const alive=useRef(true);
  const queued=useRef<Recording[]>([]);
  function chooseDestination(slot:number, explicit=false) {
    if (reservedSlots.current.has(slot) || queued.current.some(take=>take.slot===slot)) return;
    if (!explicit && occupied.current.has(slot)) return;
    selectSlot(slot);
  }
  useEffect(()=>{alive.current=true;return ()=>{alive.current=false;micRequest.current?.abort();for(const stream of [mic.current,external.current])stream?.getTracks().forEach(t=>t.stop());};},[]);
  const stereo=useRef<GainNode|null>(null);
  useEffect(()=>{
    if(!monitor)return;
    const bus=monitor.context.createGain();
    bus.channelCount=2;bus.channelCountMode="explicit";
    monitor.connect(bus);stereo.current=bus;
    // Meter and recorder own their outgoing edges and release them independently.
    return ()=>{monitor.disconnect(bus);stereo.current=null;};
  },[monitor]);
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
    setRequestKind(kind);setMessage("");
    const request = kind === "room" ? new AbortController() : null;
    if (request) {
      micRequest.current?.abort();
      micRequest.current = request;
      sceneMic.current = voiceScene !== null;
    }
    try {
      const stream=request ? (voiceScene ? await getVoiceMicrophone(request.signal) : await navigator.mediaDevices.getUserMedia({audio:true})) :
        await navigator.mediaDevices.getDisplayMedia({video:true,audio:true,systemAudio:"include",selfBrowserSurface:"exclude"} as DisplayMediaStreamOptions);
      if(request?.signal.aborted){stream.getTracks().forEach(t=>t.stop());return;}
      if(!alive.current || !stream.getAudioTracks().length){
        stream.getTracks().forEach(t=>t.stop());
        if(alive.current)setMessage("Elegí una fuente con la opción Compartir audio activada.");
        return;
      }
      ref.current=stream;update(true);
      stream.getAudioTracks()[0].onended=()=>{stream.getTracks().forEach(t=>t.stop());if(ref.current===stream){ref.current=null;update(false);}};
    } catch {
      if(alive.current && !request?.signal.aborted)
        setMessage(kind==="room"?"No se pudo abrir el micrófono. Revisá la entrada y el permiso de Sala.":"Se mantiene el estéreo de 860.");
    } finally {
      if(alive.current && !request?.signal.aborted) setRequestKind(null);
    }
  }
  const tone = useRef<PerformanceInput|null>(null);
  const stopTone = useCallback(() => { tone.current?.computerNote("mixer-preview",60,false); tone.current = null; }, []);
  const beat = 60 / bpm;
  const beatsPerCycle = meter * bars;
  const cycle = beat * beatsPerCycle;
  const cancel = useCallback(() => {
    countingTake.current=false;setCountIn(null);
    generation.current++;
    for(const take of pending.current.values())take.cancel();
    pending.current.clear();setWaiting(false);

    setState("idle");
  },[]);
  useEffect(() => () => { cancel(); stopTone(); }, [input,cancel,stopTone]);
  useEffect(() => () => stopTone(), [scene,stopTone]);

  useEffect(() => {
    if (!input) return;
    const context=input.context;
    function drawCursors(now:number) {
      const playing=context.state==="running" && !paused;
      for (const [id,cursor] of waveCursors.current) {
        const voice=voices.current.get(id);
        if (!voice || voice.source.context!==context) {
          delete cursor.dataset.playback;
          continue;
        }
        const position=voice.phaseOffset + Math.max(0,now-voice.phaseTime)*voice.source.playbackRate.value;
        const progress=phaseInCycle(position,voice.duration)/voice.duration;
        cursor.style.transform=`translateX(${progress * 100}%)`;
        const playback=now<voice.phaseTime ? "waiting" : playing ? "playing" : "paused";
        if (cursor.dataset.playback!==playback) cursor.dataset.playback=playback;
      }
    }
    if (paused) { drawCursors(context.currentTime); return; }
    const origin=clock(context);
    let frame=0;
    const draw=()=> {
      const now=context.currentTime;
      drawCursors(now);
      const left = Math.ceil((matrixStart.current-now)/beat);
      setCountIn(countingTake.current && left>=1 && left<=meter ? meter+1-left : null);
      setWaiting(pending.current.has("matrix") && now<matrixStart.current);
      setPosition(Math.floor(phaseInCycle(Math.max(0,(now-origin)/beat),beatsPerCycle)));

      frame=requestAnimationFrame(draw);
    };
    draw();return ()=>cancelAnimationFrame(frame);
  },[clock,input,paused,beat,meter,beatsPerCycle]);

  const play = useCallback(() => {
    if (!canPlayNote || tone.current) return;
    tone.current = routing.current;
    tone.current?.computerNote("mixer-preview",60,true);
  }, [canPlayNote, routing]);
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
    const first=target.current??0;
    const slots=modes.map((_,i)=>(first+i)%BANK_SIZE);
    const busy=slots.find(slot=>reservedSlots.current.has(slot));
    if(busy!==undefined){
      setMessage(`S${busy+1} está grabando.`);
      return;
    }
    const batch={version:++selectionVersion.current,lastCompleted:-1};
    const plan=modes.map((kind,order)=>({kind,slot:slots[order],batch,order}));
    if(!scene || !input || !master){
      queued.current=plan;
      if(ready)startScene();
      return;
    }
    for(const take of plan)record(take);
  }
  function record({kind,slot,batch,order}:Recording,plan?:LayerPlan) {
    if(!scene || !input || !master || pending.current.has(kind) || reservedSlots.current.has(slot))return;
    if(paused || requesting)return;
    const ctx=input.context as AudioContext;
    if(cycle>180){setMessage("Para grabar hasta 3 minutos a este tempo, elegí menos compases.");return;}
    reservedSlots.current.add(slot);
    const stopAtStart=stopGeneration.current;
    const attempt=generation.current;
    setMessage("");
    try {
      const makeCapture=captureFactory(ctx);
      const origin=clock(ctx);
      const start=ctx.currentTime;
      const pressBeat=(start-origin)/beat;
      const startBeat=plan?.startBeat ?? (kind==="matrix" ? Math.ceil(pressBeat/meter)*meter : pressBeat);
      const base=origin+startBeat*beat;
      const end=base+cycle;
      if(kind==="matrix"){matrixStart.current=base;setWaiting(base>start);}
      if(plan)countingTake.current=true;
      const length=Math.round(ctx.sampleRate*cycle);
      const offset=Math.round(phaseInCycle(base-origin,cycle)*ctx.sampleRate)%length;
      const capture=makeCapture(Math.round(base*ctx.sampleRate),length,Math.round(end*ctx.sampleRate),onLoop);
      const node=capture.node;
      const gain=ctx.createGain();gain.gain.value=0.75;
      // The processor outputs silence. Keep it outside the recorded master graph.
      node.connect(gain).connect(ctx.destination);
      const gate=ctx.createGain();
      const sources:AudioNode[]=[];
      const desktop=shared ? external.current : null;
      const surface=desktop?.getVideoTracks()[0]?.getSettings().displaySurface;
      if(!desktop || surface==="browser")sources.push(plan ? input : stereo.current ?? master);
      if(desktop)sources.push(ctx.createMediaStreamSource(desktop));
      if(room && mic.current)sources.push(ctx.createMediaStreamSource(mic.current));
      for(const source of sources)source.connect(gate);
      const protectedTake=protectPeaks(gate,RECORDING_CEILING);
      protectedTake.connect(node);
      const click=plan ? countLayer(ctx,master,plan) : null;
      const replaced=currentClips.current.find(c=>c.slot===slot);
      const volume=replaced?.volume ?? bankVolumes.current.get(slot) ?? 75;
      const weight=currentClips.current.reduce((sum,c)=>sum+(c.slot!==slot && !c.stopped && !c.muted?(c.volume/100)**2:0), (volume/100)**2);
      const bridge=plan ? firstRepeat(ctx,protectedTake,master,base,cycle,(replaced?.muted ? 0 : volume/100)/Math.sqrt(Math.max(1,weight))) : null;
      let released=false;
      const dispose=()=>{
        if(released)return;
        released=true;
        for(const source of sources)source.disconnect(gate);
        gate.disconnect();protectedTake.disconnect();capture.stop();gain.disconnect();
      };
      pending.current.set(kind,{slot,silence:()=>{gate.gain.setValueAtTime(0,ctx.currentTime);capture.finish(Math.round(ctx.currentTime*ctx.sampleRate));},cancel:()=>{click?.();bridge?.stop();reservedSlots.current.delete(slot);dispose();}});
      const label=scene;
      function onLoop(channels:Float32Array[]){
        if(released || attempt!==generation.current)return;
        if(plan){countingTake.current=false;setCountIn(null);}
        dispose();pending.current.delete(kind);
        const old=currentClips.current.find(c=>c.slot===slot);
        if(plan && !old && !channels.some(ch=>ch.some(value=>Math.abs(value)>.0002))){
          reservedSlots.current.delete(slot);bridge?.stop();setLayerState("Sin señal");
          if(!pending.current.size)setState("idle");
          return;
        }
        const buffer=ctx.createBuffer(2,length,ctx.sampleRate);
        // Lay the take on the shared cycle, wrapping captured frames after the next downbeat.
        channels.forEach((samples,ch)=>{
          const channel=buffer.getChannelData(ch);
          const firstPart=length-offset;
          channel.set(samples.subarray(0,firstPart),offset);
          if(offset)channel.set(samples.subarray(firstPart));
        });
        const id=++serial.current;
        launchContext.current.set(buffer,ctx);
        const stopped=stopAtStart!==stopGeneration.current;
        if(bridge){if(stopped)bridge.stop();else firstPasses.current.set(id,bridge);}
        if(plan)setLayerState(stopped?"Detenido":"En loop");
        if(old){ previous.current.set(slot,old); halt(old.id); }
        reservedSlots.current.delete(slot);occupied.current.add(slot);
        if(batch.version===selectionVersion.current && order>batch.lastCompleted){
          // A later destination in the batch wins even if its take finishes first.
          batch.lastCompleted=order;
          showDestination((slot+1)%BANK_SIZE);
        }
        setClips(all=>[...all.filter(c=>c.slot!==slot),{
          id,slot,stopped,layer:plan?.scene,mode:kind,scene:label,buffer,meter,bars,
          launchBeat:kind==="matrix" ? startBeat+beatsPerCycle : undefined,
          volume:old?.volume ?? bankVolumes.current.get(slot) ?? volume,muted:old?.muted ?? false,
        }]);
        if(!pending.current.size)setState("idle");
      };
      setState("recording");
    } catch {
      if(attempt!==generation.current)return;
      reservedSlots.current.delete(slot);cancel();setMessage(room ? "Revisá el permiso de micrófono. Para grabar solo el instrumento, desactivá Sala." : "No se pudo iniciar la captura de audio.");
    }
  }
  function releaseLive(){
    queued.current=queued.current.filter(take=>take.kind!=="live");
    pending.current.get("live")?.silence();
  }
  useEffect(()=>{
    window.addEventListener("blur",releaseLive);
    return ()=>window.removeEventListener("blur",releaseLive);
  },[]);
  useEffect(()=>{
    if(ready)queued.current=[];
    else if(queued.current.length && scene && input && master){const takes=queued.current;queued.current=[];for(const take of takes)record(take);}
  },[ready,scene,input,master]);
  const pressed=useRef(new Set<string>());
  useEffect(() => {
    const clear = () => { pressed.current.clear(); downControls.current.clear(); releaseLive(); disarmClear(); };
    const otherLearn = (event: Event) => {
      if ((event as CustomEvent).detail !== "mixer") { setBankLearn(null); setMessage(""); }
    };
    window.addEventListener("860-midi-learn", otherLearn);
    window.addEventListener("860-midi-disconnect", clear);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("860-midi-learn", otherLearn);
      window.removeEventListener("860-midi-disconnect", clear);
      window.removeEventListener("blur", clear);
    };
  }, [disarmClear]);
  useEffect(()=>{
    const receive=(event:Event)=>{
      const e=event as CustomEvent<{id:string;alias?:string;on:boolean;pulse?:"play"|"stopScene"}>;
      const {id,alias,on,pulse}=e.detail;
      const action=transportMidi.match(id,alias);
      if (pulse && (transportMidi.learning ?? action) !== pulse) return;
      if (!transportMidi.learning && !action) return;
      e.preventDefault();
      if (!on) {
        if (pressed.current.delete(id) && action === "record") releaseLive();
        return;
      }
      if (pressed.current.has(id)) return;
      if (!pulse) pressed.current.add(id);
      if (transportMidi.learning) {
        transportMidi.bind(id,alias);
        return;
      }
      if (action === "play") playGeneral();
      else if (action === "pauseScene") pauseScene();
      else if (action === "stopScene" && !ready) stopScene();
      else if (action === "record") pressRecord();
      else if (action === "playAll") playAll();
      else if (action === "stop") stopAll();
      else if (action === "clear") clearBank(id);
    };
    window.addEventListener("860-record-midi",receive);
    return ()=>window.removeEventListener("860-record-midi",receive);
  });
  useEffect(() => {
    const active = voices.current;
    const bridges=firstPasses.current;
    return () => { for (const v of active.values()) { v.dispose(); } active.clear();for(const v of bridges.values())v.stop();bridges.clear(); };
  }, [master]);
  useEffect(() => {
    if (!master) {
      setClips(all => all.some(c => c.once && !c.stopped)
        ? all.map(c => c.once ? {...c, stopped:true} : c) : all);
      return;
    }
    const ctx = master.context;
    for (const [id,v] of voices.current) if (!clips.some(c => c.id === id)) {
      v.dispose(); voices.current.delete(id);
    }
    const now=ctx.currentTime;
    const origin=clock(ctx);
    const mixGain=1/Math.sqrt(Math.max(1,clips.reduce((sum,c)=>sum+(c.stopped||c.muted?0:(c.volume/100)**2),0)));
    for (const clip of clips) {
      if(clip.stopped)continue;
      let voice = voices.current.get(clip.id);
      if(voice && voice.bpm!==bpm){
        voice.dispose();voices.current.delete(clip.id);voice=undefined;
      }
      if (!voice) {
        const inContext=launchContext.current.get(clip.buffer)===ctx;
        if (clip.once && !inContext) { stopClip(clip.id); continue; }
        const launchBeat=inContext ? clip.launchBeat ?? 0 : 0;
        const when=Math.max(now,origin+launchBeat*beat);
        const clipBeats=clip.meter*clip.bars;
        const cycleSeconds=clipBeats*beat;
        const end=clip.once ? origin+(launchBeat+clipBeats)*beat : undefined;
        if (end!==undefined && end<=when) { stopClip(clip.id); continue; }
        const rate=clip.buffer.duration/cycleSeconds;
        const offset=phaseInCycle(when-origin,cycleSeconds)*rate;
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        gain.gain.value = 0;
        source.buffer = clip.buffer; source.loop = true;
        source.playbackRate.value=rate;
        source.connect(gain).connect(master);
        voice = {bpm,gain,source,phaseTime:when,phaseOffset:offset,duration:clip.buffer.duration,
          dispose:()=>{source.onended=null;source.stop();source.disconnect();gain.disconnect();}};
        voices.current.set(clip.id,voice);
        if (clip.once) source.onended = () => {
          if (voices.current.get(clip.id)?.source === source) stopClip(clip.id);
        };
        source.start(when, offset);
        if (end!==undefined) source.stop(end);
        firstPasses.current.get(clip.id)?.handoff();firstPasses.current.delete(clip.id);
      }
      const codaLevel = codaScene === null ? 1 : (111 - codaScene) / 22;
      voice.gain.gain.setTargetAtTime(clip.muted ? 0 : codaLevel * mixGain * clip.volume / 100, ctx.currentTime, codaScene === null ? 0.012 : 0.45);
    }
  }, [master,clips,bpm,beat,clock,codaScene]);


  function halt(id:number){
    firstPasses.current.get(id)?.stop();
    firstPasses.current.delete(id);
    voices.current.get(id)?.dispose();
    voices.current.delete(id);
  }
  function playAll(){
    if (!master || paused || (!clips.length && !voice.hasTake)) return;
    const ctx=master.context;
    // Give every source the same audio-clock deadline without moving the grid.
    const when=ctx.currentTime + .04;
    const onset=(when - clock(ctx))/beat;
    voice.replay(when);
    for (const clip of clips) {
      halt(clip.id);
      launchContext.current.set(clip.buffer,ctx);
    }
    setClips(all=>all.map(clip=>({...clip,stopped:false,once:false,launchBeat:onset})));
  }
  function stopAll(){
    voice.stop();
    stopBank();
  }
  function clearBank(button:string) {
    const previousPress=clearPress.current;
    disarmClear();
    if (!occupied.current.size && !pending.current.size && !queued.current.length) return;
    const now=performance.now();
    if (previousPress?.button===button && now<=previousPress.until) {
      stopBank();
      cancel();
      previous.current.clear();
      occupied.current.clear();
      reservedSlots.current.clear();
      selectSlot(null);
      setClips([]);
      setMessage("Lupera vacía · S1 a S9 libres");
      return;
    }
    clearPress.current={button,until:now+3000,timer:window.setTimeout(disarmClear,3000)};
    setClearArmed(true);
  }
  function stopBank(){
    if(countingTake.current)endLayerTake();
    for(const pass of firstPasses.current.values())pass.stop();firstPasses.current.clear();
    stopGeneration.current++;
    queued.current=[];
    for(const id of voices.current.keys())halt(id);
    setClips(all=>all.map(c=>({...c,stopped:true,launchBeat:undefined})));
  }
  function launch(id:number, mode:"play"|"once"|"next"){
    if(!master || paused)return;
    const ctx=master.context;
    const clip=clips.find(c=>c.id===id);
    if(!clip)return;
    const now=(ctx.currentTime-clock(ctx))/beat;
    const beatsPerRound=clip.meter*clip.bars;
    const start=mode==="next"?(Math.floor(now/beatsPerRound)+1)*beatsPerRound:now+(mode==="once"?.03/beat:0);
    launchContext.current.set(clip.buffer,ctx);
    halt(id);
    setClips(all=>all.map(c=>c.id===id?{...c,stopped:false,muted:false,once:mode==="once",launchBeat:start}:c));
  }
  function stopClip(id:number){
    halt(id);
    setClips(all=>all.map(c=>c.id===id?{...c,stopped:true}:c));
  }
  useEffect(()=>{
    function releaseBankSignal(event: Event) {
      const signal=(event as CustomEvent<MidiReassignment>).detail;
      if (signal.owner==="bank" || !Object.entries(bankMap).some(([key,item])=>sameMidiSignal(key,item.alias,signal))) return;
      setBankMap(current=>Object.fromEntries(Object.entries(current).filter(([key,item])=>!sameMidiSignal(key,item.alias,signal))));
    }
    function receive(event:Event){
      const e=event as CustomEvent<BankMessage>;
      const {id,alias,value,type,reserved,label}=e.detail;
      // Web MIDI port IDs can change between the published score and a local file.
      // The dispatcher supplies a name alias only for a uniquely identified input.
      const exact = bankMap[id];
      let assignment = exact && (!alias || !exact.alias || exact.alias === alias) ? exact : undefined;
      if (!assignment && alias) assignment = bankMap[alias] ?? Object.values(bankMap).find(item => item.alias === alias);
      if(transportMidi.learning) return;
      if(bankLearn){
        if(bankLearn==="volume"?type==="note":type==="bend" || value===0)return;
        e.preventDefault();
        const signal={id,alias,owner:"bank" as const};
        reassignMidi(signal);
        assignment={slot:bankSlot,action:bankLearn,label,alias};
        const selected=assignment;
        setBankMap(current=>{
          const next={...current};
          for(const [key,item] of Object.entries(next)){
            if((item.slot===selected.slot && item.action===selected.action) || sameMidiSignal(key,item.alias,signal))delete next[key];
          }
          next[id]=selected;
          return next;
        });
        setBankLearn(null);setMessage("");
        if(assignment.action!=="volume")downControls.current.add(id);
        return;
      }
      if(!assignment || reserved || transportMidi.match(id,e.detail.alias))return;
      e.preventDefault();
      const {slot,action}=assignment;
      const clip=clips.find(c=>c.slot===slot);
      if(action==="volume"){
        chooseDestination(slot);
        const volume=Math.round(value*100);
        bankVolumes.current.set(slot,volume);
        if(occupied.current.has(slot))setClips(all=>all.map(c=>c.slot===slot?{...c,volume}:c));
        return;
      }
      if(!value){downControls.current.delete(id);return;}
      if(downControls.current.has(id))return;
      downControls.current.add(id);
      if(action==="select"){chooseDestination(slot,true);return;}
      if(!clip){chooseDestination(slot);return;}
      if(action==="stop" || (action==="toggle" && !clip.stopped))stopClip(clip.id);
      else launch(clip.id,action==="toggle" ? "play" : action);
    }
    window.addEventListener("860-bank-midi",receive);
    window.addEventListener(MIDI_REASSIGNMENT,releaseBankSignal);
    return ()=>{
      window.removeEventListener("860-bank-midi",receive);
      window.removeEventListener(MIDI_REASSIGNMENT,releaseBankSignal);
    };
  });
  useEffect(()=>{
    if(liveSet===88 || liveSet===89){cancel();stopBank();}
  },[liveSet]);
  function endLayerTake(){
    if(!countingTake.current)return;
    countingTake.current=false;
    pending.current.get("matrix")?.cancel();pending.current.delete("matrix");
    setWaiting(false);setCountIn(null);setLayerState("Detenido");
    if(!pending.current.size)setState("idle");
  }
  useEffect(()=>() => {endLayerTake();armed.current=null;layer.current=null;},[cue,liveSet]);
  useEffect(()=>{
    if(!isLayer(liveSet) || !cue || !input || !master || paused || requesting || armed.current===cue)return;
    const slot=liveSet-32;
    armed.current=cue;
    const origin=clock(cue.context);
    const now=Math.max(cue.beginsAt,cue.context.currentTime);
    // Start the count on the shared downbeat so successive layers have the same beat one.
    const elapsedBeats=(now-origin)/beat;
    const countBeat=Math.ceil((elapsedBeats-.035)/meter)*meter;
    const startBeat=countBeat+meter,base=origin+startBeat*beat;
    if(cycle>180 || base+cycle>cue.beginsAt+seconds+.001){setLayerState("La toma supera la duración de la escena");return;}
    // The scored layer owns its matrix take and its slot, even when the bank is full.
    for (const [mode,take] of pending.current) {
      if (mode!=="matrix" && take.slot!==slot) continue;
      take.cancel();
      pending.current.delete(mode);
    }
    const plan={scene:liveSet,slot,startBeat,base,beat,meter,bars};
    layer.current=plan;chooseDestination(slot);setLayerState("Próximo compás");
    record({kind:"matrix",slot,batch:{version:selectionVersion.current,lastCompleted:-1},order:0},plan);
  });
  useEffect(() => {
    if (!voiceScene) return;
    return () => {
      if (sceneMic.current) {
        micRequest.current?.abort();
        setRequestKind(current => current === "room" ? null : current);
        mic.current?.getTracks().forEach(track => track.stop());
        mic.current = null;
        sceneMic.current = false;
        setRoom(false);
      }
    };
  }, [voiceScene]);
  const voiceStatus = {off:"Activá el micrófono", listening:"Escuchando", recording:"Grabando la voz",
    playing:voiceScene === 31 ? "Frase en loop · eco estéreo" : "Vocal en loop · coro grave",
    stopped:"Toma detenida", empty:"Toma sin señal", late:"Fin de la escena", error:"No se pudo grabar"};
  const currentTake=layer.current?.scene===liveSet && armed.current===cue ? layer.current : null;
  const activeCount=currentTake && countingTake.current ? countIn : null;
  const recordedLayer=currentTake && clips.find(c=>c.slot===currentTake.slot && c.layer===liveSet);
  let takeStatus=armed.current===cue ? layerState : "";
  if(currentTake && countingTake.current)takeStatus=activeCount!==null ? "Cuenta de entrada" : waiting ? "Próximo compás" : "Grabando";
  else if(takeStatus==="En loop" && !recordedLayer)takeStatus="Sin sample";
  else if(takeStatus==="En loop" && recordedLayer){
    if(recordedLayer.stopped)takeStatus="Detenido";
    else if(recordedLayer.muted)takeStatus="Silenciado";
    else if(recordedLayer.once)takeStatus="Una vuelta";
  }
  return <>
  <div className="zero-stage" role="group" aria-label="Proyección del módulo cero" data-extended-dark={extendedDark || undefined}
    style={{background:stageBackground}}>
    {children}
    {liveSet && analyser && <LiveSetProjection scene={liveSet} title={SCENE_INSTRUMENT_NAMES[liveSet]}
      analyser={showRoomInput ? roomMeter : analyser} paused={paused} meter={meter} bars={bars} bpm={bpm}
      position={activeCount===null ? position : activeCount-1} recording={state==="recording" && !waiting} waiting={waiting} countIn={activeCount}
      slot={currentTake?.slot ?? null} takeStatus={takeStatus}
      room={showRoomInput}/>}
  </div>
  <div className="scene-mixer" role="region" aria-label="Lupera de objetos sonoros">
    {voiceScene && <div className="voice-loop-strip" role="group" aria-label="Loop de voz">
      <strong>{voiceScene === 31 ? "Voz en ondas" : "Coro de sala"}</strong>
      <output aria-live="polite">{paused ? "En pausa" : requestKind === "room" ? "Abriendo micrófono…" : voiceStatus[voice.phase]}</output>
      <span>{VOICE_CUES[voiceScene]}</span>
      <button type="button" disabled={requesting || state !== "idle"} aria-pressed={room}
        onClick={() => void chooseSource("room", !room)}>{room ? "Desactivar micrófono de sala" : "Activar micrófono de sala"}</button>
      {room && <><small>{mic.current?.getAudioTracks()[0]?.label}</small>
        {voice.phase === "listening"
          ? <button type="button" disabled={paused} onClick={voice.record}>Grabar ahora</button>
          : <button type="button" disabled={paused} onClick={voice.retake}>Nueva toma</button>}
      </>}
    </div>}
    <div className="scene-mixer-tools">
      <button className="scene-record" aria-label="Grabar" title="Grabar con los modos seleccionados" disabled={paused||requesting||(!matrix && !live)}
        onPointerDown={e=>{if(e.button!==0)return;e.currentTarget.setPointerCapture(e.pointerId);pressRecord();}}
        onPointerUp={releaseLive} onPointerCancel={releaseLive} onLostPointerCapture={releaseLive}
        onKeyDown={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();if(!e.repeat)pressRecord();}}}
        onKeyUp={e=>{if(e.key===" "||e.key==="Enter"){e.preventDefault();releaseLive();}}}>●</button>
      <TransportMidiButton midi={transportMidi} action="record" />
      <button type="button" aria-label="Reproducir todos los loops" disabled={!master || paused || (!clips.length && !voice.hasTake)} onClick={playAll}>▶ Todos</button>
      <TransportMidiButton midi={transportMidi} action="playAll" />
      <button aria-label="Detener todos los clips" title="Detener todos los clips" onClick={stopAll}>■</button>
      <TransportMidiButton midi={transportMidi} action="stop" />
      <button type="button" aria-label="Vaciar lupera" aria-describedby={clearArmed ? "confirmar-vaciado-a9" : undefined}
        title="Dos pulsaciones para vaciar S1 a S9"
        disabled={!clips.length && state==="idle" && !queued.current.length}
        onClick={()=>clearBank("pantalla")}
        onKeyDown={e=>{if(e.repeat && (e.key==="Enter" || e.key===" "))e.preventDefault();}}>Vaciar</button>
      <TransportMidiButton midi={transportMidi} action="clear" />
      {clearArmed && <small id="confirmar-vaciado-a9" role="status">Pulsá el mismo botón otra vez para vaciar S1 a S9.</small>}
      {transportMidi.learning && !["play","pauseScene","stopScene"].includes(transportMidi.learning) && <small role="status">{transportMidi.hint}</small>}
      <button title="Volver a S1" aria-label="Destino automático" onClick={()=>selectSlot(null)}>{selected===null?"Auto":`Destino S${selected+1}`}</button>
      <label title="Grabar los compases configurados desde el próximo tiempo 1"><input type="checkbox" checked={matrix} disabled={state!=="idle"} onChange={e=>setMatrix(e.target.checked)}/> Matriz</label>
      <label title="Grabar desde que apretás hasta que soltás, en su lugar dentro del compás"><input type="checkbox" checked={live} disabled={state!=="idle"} onChange={e=>setLive(e.target.checked)}/> En vivo</label>
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
      </details>
      <details onToggle={e=>{if(!e.currentTarget.open)setBankLearn(null);}}><summary>MIDI · Samples</summary>
        <label>Sample <select aria-label="Sample para asignar MIDI" value={bankSlot} onChange={e=>{setBankSlot(Number(e.target.value));setBankLearn(null);}}>
          {Array.from({length:BANK_SIZE},(_,i)=><option key={i} value={i}>{i+1}</option>)}</select></label>
        {(Object.keys(BANK_ACTIONS) as BankAction[]).map(action=>{
          const entry=Object.entries(bankMap).find(([,v])=>v.slot===bankSlot && v.action===action);
          return <span key={action}><button aria-pressed={bankLearn===action} title={entry?.[1].label}
            aria-label={`Asignar ${BANK_ACTIONS[action]} al sample ${bankSlot+1}`}
            onClick={()=>{window.dispatchEvent(new CustomEvent("860-midi-learn",{detail:"mixer"}));setMessage("");if (bankLearn !== action) void connectMidi(true);setBankLearn(bankLearn===action?null:action);}}>
            {bankLearn===action?(action==="volume"?"Mové el fader":"Pulsá el botón"):BANK_ACTIONS[action]+(entry?" ✓":"")}</button>
            {entry && <button aria-label={`Quitar asignación de ${BANK_ACTIONS[action]}`} onClick={()=>{setBankLearn(null);setBankMap(current=>{const next={...current};delete next[entry[0]];return next;});}}>×</button>}</span>;
        })}
      </details>
      <button disabled={!canPlayNote} aria-label="Tocar sonido de escena" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); play(); }}
        onPointerUp={stopTone} onLostPointerCapture={stopTone} onKeyDown={e => { if (e.key === " " || e.key === "Enter") play(); }}
        onKeyUp={stopTone}>Tocar · P</button>
      {message && <small role="status">{message}</small>}
    </div>
    <div className="sample-bank" data-layers={isLayer(liveSet)||undefined} aria-label="Banco de nueve samples">
    {Array.from({length:BANK_SIZE},(_,slot)=>{
      const clip=clips.find(c=>c.slot===slot);
      const isTake=isLayer(liveSet) && currentTake?.slot===slot;
      const recordedName=clip?.layer ? LAYERS[clip.layer-32].name : clip?.scene;
      const padName=isLayer(liveSet) ? (isTake ? LAYERS[liveSet-32].name : recordedName ?? LAYERS[slot]?.name ?? "Libre") : "";
      const padStatus=isTake ? (activeCount!==null ? "Entrada "+activeCount+" / "+meter : takeStatus) : "";
      if(!clip)return <button className="sample-empty" aria-label={`Espacio ${slot+1} libre`} aria-pressed={selected===slot}
        data-selected={selected===slot} data-take={isTake || undefined} onClick={()=>chooseDestination(slot)} key={slot}>S{slot+1}{padName && <span className="pad-title">{padName}</span>}{padStatus && <small>{padStatus}</small>}</button>;
      const waitingForPlay=master && launchContext.current.get(clip.buffer)===master.context && clip.launchBeat!==undefined && master.context.currentTime<clock(master.context)+clip.launchBeat*beat;
      const status = clip.stopped ? "Detenido" : waitingForPlay ? "Espera del 1" : clip.once ? "Una vuelta" : "En marcha";
      const description = `${status} · ${clip.mode==="matrix"?"Matriz":"En vivo"} · ${clip.scene} · ${clip.buffer.duration.toFixed(1)} s`;
      return <div className="scene-mixer-row" role="group" aria-label={`Sample ${slot+1}`} key={slot}
        data-selected={selected===slot} data-take={isTake || undefined}>
      <button className="sample-select" aria-label={`Seleccionar S${slot+1}`} aria-pressed={selected===slot} title={`Grabar la próxima toma sobre S${slot+1}`}
        aria-describedby={`sample-info-${slot}`} onClick={()=>chooseDestination(slot,true)}>S{slot+1}{padName && <span className="pad-title">{padName}</span>}{isTake && padStatus && <small>{padStatus}</small>}</button>
      <button title="Detener sample" aria-label="Detener sample" onClick={()=>stopClip(clip.id)}>■</button>
      <button title="Reproducir ahora en loop" aria-label="Reproducir ahora" disabled={!master||paused} onClick={()=>launch(clip.id,"play")}>▶</button>
      <button title="Reproducir una sola vuelta" aria-label="Reproducir una sola vuelta" disabled={!master||paused}
        onClick={()=>launch(clip.id,"once")}>1×</button>
      <button className="sample-mute" aria-pressed={clip.muted} title={clip.muted ? "Activar sonido" : "Mutear"}
        aria-label={clip.muted ? "Activar sonido" : "Mutear"} onClick={() => setClips(all => all.map(c => c.id === clip.id ? {...c,muted:!c.muted} : c))}>
        <svg viewBox="0 0 20 20" aria-hidden="true">{clip.muted
          ? <path d="M4 10h12" fill="none" stroke="currentColor" strokeWidth="2" />
          : <><path d="M2 8h3l5-4v12l-5-4H2z" fill="currentColor"/><path d="M12 7a5 5 0 0 1 0 6m2-8a8 8 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.5"/></>}</svg>
      </button>
      <button title="Reproducir al comienzo del próximo ciclo de este loop" aria-label="Reproducir en el próximo tiempo 1" disabled={!master||paused} onClick={()=>launch(clip.id,"next")}>▶₁</button>
      <span className="sample-info" id={`sample-info-${slot}`} title={description}>{description}</span>
      <input aria-label={"Volumen del sonido " + clip.id} type="range" min="0" max="100" value={clip.volume}
        onChange={e => { const volume = Number(e.target.value); setClips(all => all.map(c => c.id === clip.id ? {...c,volume} : c)); }} />
      {previous.current.has(slot) && <button title="Recuperar la toma anterior" aria-label="Deshacer toma" disabled={reservedSlots.current.has(slot)} onClick={()=>{
        const old=previous.current.get(slot);if(!old)return;
        previous.current.delete(slot);halt(clip.id);
        setClips(all=>all.map(c=>c.id===clip.id?{...old,stopped:true}:c));
      }}>⟲</button>}
      <button disabled={reservedSlots.current.has(slot)} title="Eliminar sample" aria-label={"Eliminar sonido " + clip.id} onClick={() => {halt(clip.id);previous.current.delete(slot);occupied.current.delete(slot);setMessage("");setClips(all => all.filter(c => c.id !== clip.id));}}>×</button>
      <SampleWaveform key={clip.id} id={clip.id} slot={slot} buffer={clip.buffer} cursors={waveCursors.current}
        meter={clip.meter} bars={clip.bars} stopped={clip.stopped || !master} muted={clip.muted || clip.volume===0} />
    </div>;})}</div>
  </div></>;
}
