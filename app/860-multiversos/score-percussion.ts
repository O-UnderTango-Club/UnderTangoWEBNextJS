import {useEffect} from "react";
import {schedulePercussionHit,type PercussionVoice} from "./scene-instrument";
import {useTempo} from "./tempo";

const house=[
  {voice:"kick",steps:[0,4,8,12]},
  {voice:"clap",steps:[4,12]},
  {voice:"hat",steps:[2,6,10,14]},
] as const;
const evenHats={voice:"hat",steps:[0,2,4,6,8,10,12,14]} as const;
export const PERCUSSION_PATTERNS = {
  34:house,
  64:house,
  66:[{voice:"kick",steps:[0,4,8,11,14]},{voice:"clap",steps:[4,12]},evenHats],
  67:[{voice:"kick",steps:[0,3,6,10]},{voice:"snare",steps:[4,12]},evenHats],
  72:[{voice:"kick",steps:[0,4,8,12]},{voice:"snare",steps:[3,6,11,14]},evenHats],
} satisfies Record<number,ReadonlyArray<{voice:PercussionVoice;steps:readonly number[]}>>;
export type PercussionScene=keyof typeof PERCUSSION_PATTERNS;
export function isPercussionScene(scene:number|null):scene is PercussionScene {
  return scene!==null && Object.hasOwn(PERCUSSION_PATTERNS,scene);
}
export const rhythmLayerVisible=(scene:PercussionScene,layer:number,elapsedBeats:number)=>
  scene!==34 || elapsedBeats>=layer*4;

export function useScorePercussion(scene:number|null,cue:{context:AudioContext;beginsAt:number}|null,
    seconds:number,paused:boolean,output:GainNode|null) {
  const {bpm,clock}=useTempo();
  useEffect(()=>{
    if(!isPercussionScene(scene) || !cue || !output || paused || output.context!==cue.context)return;
    const {context,beginsAt}=cue;
    const origin=clock(context), stepSeconds=60/bpm/4;
    // The recording scene advances when its take finishes. Its displayed time is an estimate.
    const end=scene===34 ? Infinity : beginsAt+seconds;
    const bus=context.createGain();
    bus.gain.value=.62;
    bus.connect(output);
    const voices:{sound:ReturnType<typeof schedulePercussionHit>;expires:number}[]=[];
    let next=Math.max(0,Math.ceil((Math.max(beginsAt,context.currentTime)-origin)/stepSeconds-1e-6));
    const schedule=()=>{
      if(context.state!=="running")return;
      const now=context.currentTime;
      while(voices.length && voices[0].expires<=now)voices.shift();
      next=Math.max(next,Math.ceil((now-origin-.006)/stepSeconds));
      while(origin+next*stepSeconds<Math.min(end,now+.085)){
        const stepAt=origin+next*stepSeconds;
        const elapsed=(stepAt-beginsAt)/stepSeconds/4;
        for(const [layer,{voice,steps}] of PERCUSSION_PATTERNS[scene].entries()){
          if(rhythmLayerVisible(scene,layer,elapsed+1e-6) && (steps as readonly number[]).includes(next%16)){
            const time=Math.max(now,stepAt);
            voices.push({sound:schedulePercussionHit(bus,scene,voice,time),expires:time+.42});
          }
        }
        next++;
      }
    };
    schedule();
    const timer=window.setInterval(schedule,20);
    return ()=>{
      window.clearInterval(timer);
      for(const {sound} of voices)sound.mute();
      bus.disconnect();
    };
  },[bpm,clock,cue,output,paused,scene,seconds]);
}
