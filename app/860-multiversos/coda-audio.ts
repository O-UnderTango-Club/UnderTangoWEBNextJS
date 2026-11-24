import {useEffect,useRef} from "react";
import type {PerformanceInput} from "./performance-notes";
import type {Timbre} from "./coda-ballot";

export function useCodaInstrument(scene:number, sound:Timbre, output:GainNode|null, paused:boolean,
    routing:{current:PerformanceInput|null}) {
  const current=useRef({scene,sound,paused});
  current.current={scene,sound,paused};
  useEffect(()=>{
    if(!output)return;
    const clock=output.context;
    const bus=clock.createGain();
    bus.gain.value=.28;
    bus.connect(output);
    const air=clock.createBuffer(1,Math.round(clock.sampleRate*1.25),clock.sampleRate);
    const data=air.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    const active=new Map<string,()=>void>();
    const ringing=new Set<()=>void>();
    let nextAt=clock.currentTime+1, phrase=0;
    function note(id:string,midi:number,velocity:number){
      active.get(id)?.();
      if(!velocity || clock.state!=="running")return;
      if(ringing.size>=24)ringing.values().next().value?.();
      const {scene,sound}=current.current;
      const level=(.015+.28*((111-scene)/21)**1.5)*Math.max(.13,velocity);
      const hz=222*2**((midi-57)/12), now=clock.currentTime;
      const gain=clock.createGain(),filter=clock.createBiquadFilter();
      const source=sound==="aire"?clock.createBufferSource():clock.createOscillator();
      const end=now+(sound==="campana"?2.75:sound==="agua"?1.5:2);
      if(source instanceof AudioBufferSourceNode){
        source.buffer=air;source.loop=true;filter.type="bandpass";filter.Q.value=1.4;
        filter.frequency.setValueAtTime(Math.min(4600,Math.max(120,hz*2)),now);
      }else{
        source.type=sound==="campana"?"triangle":"sine";
        source.frequency.setValueAtTime(Math.min(5000,Math.max(28,hz*(sound==="agua"?1.8:1))),now);
        if(sound==="agua")source.frequency.exponentialRampToValueAtTime(Math.max(28,Math.min(3500,hz*.65)),now+.19);
        filter.type="lowpass";filter.frequency.value=sound==="campana"?2400:1100;
      }
      source.connect(filter).connect(gain).connect(bus);
      const attack=sound==="aire"?.18:.015;
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
      const {scene,paused}=current.current;
      if(paused || scene<93 || scene>=110 || clock.state!=="running" || clock.currentTime<nextAt)return;
      const pitches=[57,64,69,62,57,52,64,57];
      note("room-tail/"+phrase,pitches[phrase++%pitches.length],.55);
      nextAt=clock.currentTime+2.1+(scene-93)*.26;
    },140);
    window.addEventListener("blur",allOff);
    return ()=>{
      window.removeEventListener("blur",allOff);window.clearInterval(timer);allOff();bus.disconnect();
      if(routing.current===dest)routing.current=null;
    };
  },[output,routing,scene]);
}
