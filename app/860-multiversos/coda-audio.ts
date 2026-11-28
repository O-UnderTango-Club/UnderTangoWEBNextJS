import {useEffect,useRef} from "react";
import type {PerformanceInput} from "./performance-notes";
import type {Atmosphere} from "./coda-ballot";

const phrasing = {
  movido:{steps:[57,57,64,57,69,64,62,64],gaps:[.32,.32,.64,.32,.32,.48,.32,.48],attack:.48,decay:.55,accent:[1,.55,.78,.55]},
  tranquilo:{steps:[57,64,69,62,57,52,64,57],gaps:[2.2,1.8,2.6,2.1],attack:1.15,decay:1.12,accent:[.64,.5,.58,.48]},
  romantico:{steps:[57,60,64,69,67,64,60,62],gaps:[.72,.92,1.3,.83,.77,1.55],attack:1.4,decay:1.45,accent:[.85,.57,.69,.5]},
} as const;

export function useCodaInstrument(scene:number, atmosphere:Atmosphere, output:GainNode|null, scoreOutput:GainNode|null, paused:boolean,
    routing:{current:PerformanceInput|null}) {
  const current=useRef({scene,atmosphere,paused});
  current.current={scene,atmosphere,paused};
  useEffect(()=>{
    if(!output)return;
    const clock=output.context;
    const bus=clock.createGain();
    bus.gain.value=.28;
    bus.connect(output);
    const backing = scoreOutput?.context === clock ? clock.createGain() : null;
    if (backing && scoreOutput) {
      backing.gain.value = bus.gain.value;
      backing.connect(scoreOutput);
    }
    const air=clock.createBuffer(1,Math.round(clock.sampleRate*1.25),clock.sampleRate);
    const data=air.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const active=new Map<string,()=>void>();
    const ringing=new Set<()=>void>();
    let nextAt=clock.currentTime+1, phrase=0;
    function note(id:string,midi:number,velocity:number,destination=bus){
      active.get(id)?.();
      if(!velocity || clock.state!=="running")return;
      if(ringing.size>=24)ringing.values().next().value?.();
      const {scene,atmosphere:{sound,groove}}=current.current;
      const feel=phrasing[groove];
      const level=(.015+.28*((111-scene)/21)**1.5)*Math.max(.13,velocity);
      const hz=222*2**((midi-57)/12), now=clock.currentTime;
      const gain=clock.createGain(),filter=clock.createBiquadFilter();
      const source=sound==="aire"?clock.createBufferSource():clock.createOscillator();
      const end=now+feel.decay*(sound==="campana"?2.75:sound==="agua"?1.5:2);
      if(source instanceof AudioBufferSourceNode){
        source.buffer=air;source.loop=true;filter.type="bandpass";filter.Q.value=1.4;
        filter.frequency.setValueAtTime(Math.min(4600,Math.max(120,hz*2)),now);
      }else{
        source.type=sound==="campana"?"triangle":"sine";
        source.frequency.setValueAtTime(Math.min(5000,Math.max(28,hz*(sound==="agua"?1.8:1))),now);
        if(sound==="agua")source.frequency.exponentialRampToValueAtTime(Math.max(28,Math.min(3500,hz*.65)),now+.19);
        filter.type="lowpass";filter.frequency.value=sound==="campana"?2400:1100;
      }
      source.connect(filter).connect(gain).connect(destination);
      const attack=feel.attack*(sound==="aire"?.18:.015);
      gain.gain.setValueAtTime(.00001,now);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level),now+attack);
      gain.gain.exponentialRampToValueAtTime(.00001,end);
      let released=false;
      const stop=()=>{
        if(released)return;
        released=true;
        if(active.get(id)===stop)active.delete(id);
        ringing.delete(stop);
        const t=clock.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setTargetAtTime(.00001,t,.045);
        source.stop(t+.22);
      };
      active.set(id,stop);ringing.add(stop);
      source.onended=()=>{if(active.get(id)===stop)active.delete(id);ringing.delete(stop);source.disconnect();filter.disconnect();gain.disconnect();};
      source.start(now);source.stop(end+.02);
    }
    const allOff=()=>{for(const release of Array.from(ringing))release();};
    const prefix=(id:string,channel?:number)=>JSON.stringify(id)+"/"+(channel===undefined?"":channel+"/");
    const dest:PerformanceInput={
      midiNote:(id,ch,n,v)=>note(prefix(id,ch)+n,n,v),
      computerNote:(id,n,on)=>note("key/"+id,n,on?.72:0),
      releaseMidi:(id,ch)=>{for(const [key,release] of active)if(key.startsWith(prefix(id,ch)))release();},
      releaseAll:allOff,
    };
    routing.current=dest;
    const timer=window.setInterval(()=>{
      const {scene,paused,atmosphere:{groove}}=current.current;
      if(!backing || paused || scene<93 || scene>=110 || clock.state!=="running" || clock.currentTime<nextAt)return;
      const {steps,gaps,accent}=phrasing[groove];
      note("room-tail/"+phrase,steps[phrase%steps.length],accent[phrase%accent.length],backing);
      const fade=1+Math.max(0,scene-102)*.28;
      nextAt=clock.currentTime+gaps[phrase%gaps.length]*fade;
      phrase++;
    },40);
    window.addEventListener("blur",allOff);
    return ()=>{
      window.removeEventListener("blur",allOff);window.clearInterval(timer);allOff();bus.disconnect();backing?.disconnect();
      if(routing.current===dest)routing.current=null;
    };
  },[output,scoreOutput,routing,scene]);
}
