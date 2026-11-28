import {createContext, useContext, useEffect, useMemo, useRef} from "react";
import {useTempo} from "./tempo";
import type {PercussionCursor} from "./score-percussion";

function emptyFrame() {
  return {low:0, mid:0, high:0, rms:0, attack:0, frequency:0, time:0, beat:0, beats:0, gesture:0,
    bpm:0, hasAudio:false, wave:new Uint8Array(1024).fill(128)};
}
export type ProjectionSignals = {current:ReturnType<typeof emptyFrame>;percussion:PercussionCursor|null};
export type ProjectionMeter = {current:AnalyserNode|null};
export type ProjectionAttack = {current:{count:number; frequency:number; velocity:number}};
export const ProjectionSignalContext = createContext<ProjectionSignals|null>(null);
export function useProjectionSignals(): ProjectionSignals {
  const signals = useContext(ProjectionSignalContext);
  if (!signals) throw new Error("Falta la señal de la proyección");
  return signals;
}

function bandLevel(bins:Uint8Array, widthHz:number, fromHz:number, toHz:number) {
  const first=Math.max(1,Math.ceil(fromHz/widthHz)), end=Math.min(bins.length,Math.ceil(toHz/widthHz));
  let peak=0, sum=0;
  for(let i=first;i<end;i++) {peak=Math.max(peak,bins[i]);sum+=bins[i]*bins[i];}
  return end>first ? (.55*peak + .45*Math.sqrt(sum/(end-first)))/255 : 0;
}

export function useSceneSignals(scene:number|null, context:AudioContext|null, beginsAt:number,
    paused:boolean, mix:ProjectionMeter, room:ProjectionMeter, strikes:ProjectionAttack,
    percussion:PercussionCursor|null, captureBands=false):ProjectionSignals {
  const state = useRef<ReturnType<typeof emptyFrame>|null>(null);
  const frame=state.current ?? (state.current=emptyFrame());
  const signals=useMemo(()=>({current:frame,percussion}),[frame,percussion]);
  const {bpm,clock}=useTempo();
  const transport=useRef({bpm,clock});
  useEffect(()=>{transport.current={bpm,clock};},[bpm,clock]);

  useEffect(()=>{
    if (scene===null || !context) return;
    const frame=signals.current;
    let seen=strikes.current.count, lastAttack=-Infinity, velocity=0;
    let pending=0, lastSample=-Infinity;
    let bins=new Uint8Array(0);
    frame.wave.fill(128);
    frame.low=frame.mid=frame.high=frame.rms=frame.attack=frame.frequency=frame.gesture=0;
    frame.hasAudio=false;
    function sample(timestamp:number) {
      const ctx=context!;
      const now=ctx.currentTime;
      frame.time=Math.max(0,now-beginsAt);
      const {bpm,clock}=transport.current;
      frame.bpm=bpm;
      frame.beats=Math.max(0,now-clock(ctx))*bpm/60;
      frame.beat=frame.beats%1;
      if (paused) return;
      pending=requestAnimationFrame(sample);
      if (timestamp-lastSample<1000/40) return;
      frame.gesture*=Math.exp(-.005*(timestamp-lastSample));
      lastSample=timestamp;
      const note=strikes.current;
      if (note.count!==seen) {
        seen=note.count;lastAttack=now;velocity=note.velocity;frame.frequency=note.frequency;
      }
      frame.attack=velocity*Math.exp(-5.5*Math.max(0,now-lastAttack));
      const node=(scene===89 && room.current) || mix.current;
      frame.hasAudio=Boolean(node);
      if (node) {
        node.getByteTimeDomainData(frame.wave);
        let power=0;
        for (const value of frame.wave) power+=((value-128)/128)**2;
        frame.rms=Math.sqrt(power/frame.wave.length);
        if (captureBands || scene===44 || scene===78) {
          if (bins.length!==node.frequencyBinCount) bins=new Uint8Array(node.frequencyBinCount);
          node.getByteFrequencyData(bins);
          const widthHz=ctx.sampleRate/node.fftSize;
          frame.low=bandLevel(bins,widthHz,20,250);
          frame.mid=bandLevel(bins,widthHz,250,2400);
          frame.high=bandLevel(bins,widthHz,2400,16000);
        }
      } else {
        if (frame.rms>0) frame.wave.fill(128);
        frame.low=frame.mid=frame.high=frame.rms=0;
      }
    }
    sample(performance.now());
    return ()=>cancelAnimationFrame(pending);
  },[scene,context,beginsAt,paused,mix,room,strikes,signals,captureBands]);
  return signals;
}
