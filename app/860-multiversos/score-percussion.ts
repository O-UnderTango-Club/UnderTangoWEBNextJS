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
// The electronic battery take layers its voices against the score clock.
export function isPlayedPercussionScene(scene:number|null):scene is Exclude<PercussionScene,34> {
  return isPercussionScene(scene) && scene!==34;
}

export type PercussionCursor = {step:number|null};

function createPercussionOutput(output:GainNode) {
  const context=output.context;
  const bus=context.createGain();
  bus.gain.value=.62;
  bus.connect(output);
  const voices:{sound:ReturnType<typeof schedulePercussionHit>;expires:number}[]=[];
  return {
    hit(scene:PercussionScene,voice:PercussionVoice,time:number,velocityScale=1) {
      while(voices.length && voices[0].expires<=context.currentTime) voices.shift();
      if(voices.length>=48) voices.shift()?.sound.mute();
      voices.push({sound:schedulePercussionHit(bus,scene,voice,time,velocityScale),expires:time+.42});
    },
    close() {
      for(const {sound} of voices) sound.mute();
      bus.disconnect();
    },
  };
}

export function createPlayedPercussion(scene:Exclude<PercussionScene,34>,output:GainNode,cursor:PercussionCursor,
    onAttack:(frequency:number,velocity:number)=>void) {
  const context=output.context;
  const drums=createPercussionOutput(output);
  const layers:ReadonlyArray<{voice:PercussionVoice;steps:readonly number[]}>=PERCUSSION_PATTERNS[scene];
  const points=[...new Set(layers.flatMap(layer=>layer.steps))].sort((a,b)=>a-b);
  const held=new Set<string>();

  return {
    press(id:string,note:number,velocity:number) {
      if (velocity<=0 || context.state!=="running" || held.has(id)) return;
      held.add(id);
      const index=(points.indexOf(cursor.step ?? -1)+1)%points.length;
      const step=points[index], time=context.currentTime;
      for(const {voice,steps} of layers) {
        if(steps.includes(step)) drums.hit(scene,voice,time,velocity);
      }
      cursor.step=step;
      onAttack(440*2**((note-69)/12),velocity);
    },
    release(id:string) { held.delete(id); },
    releaseFrom(prefix:string) {
      for(const id of held) if(id.startsWith(prefix)) held.delete(id);
    },
    releaseAll() { held.clear(); },
    close() { drums.close(); },
  };
}

export const rhythmLayerVisible=(scene:PercussionScene,layer:number,elapsedBeats:number)=>
  scene!==34 || elapsedBeats>=layer*4;

export function useScorePercussion(scene:number|null,cue:{context:AudioContext;beginsAt:number}|null,
    paused:boolean,output:GainNode|null) {
  const {bpm,clock}=useTempo();
  useEffect(()=>{
    if(scene!==34 || !cue || !output || paused || output.context!==cue.context)return;
    const {context,beginsAt}=cue;
    const origin=clock(context), stepSeconds=60/bpm/4;
    const drums=createPercussionOutput(output);
    let next=Math.max(0,Math.ceil((Math.max(beginsAt,context.currentTime)-origin)/stepSeconds-1e-6));
    const schedule=()=>{
      if(context.state!=="running")return;
      const now=context.currentTime;
      next=Math.max(next,Math.ceil((now-origin-.006)/stepSeconds));
      while(origin+next*stepSeconds<now+.085){
        const stepAt=origin+next*stepSeconds;
        const elapsed=(stepAt-beginsAt)/stepSeconds/4;
        for(const [layer,{voice,steps}] of PERCUSSION_PATTERNS[scene].entries()){
          if(rhythmLayerVisible(scene,layer,elapsed+1e-6) && (steps as readonly number[]).includes(next%16)){
            drums.hit(scene,voice,Math.max(now,stepAt));
          }
        }
        next++;
      }
    };
    schedule();
    const timer=window.setInterval(schedule,20);
    return ()=>{
      window.clearInterval(timer);
      drums.close();
    };
  },[bpm,clock,cue,output,paused,scene]);
}
