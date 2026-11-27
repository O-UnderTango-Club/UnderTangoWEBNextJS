import {ritualLayer} from "./ritual-patterns";
import {schedulePercussionHit} from "./scene-instrument";
import type {LayerPlan} from "./layer-take";

export function playRitualTake(output:GainNode,plan:LayerPlan) {
  const layer=ritualLayer(plan.scene);
  if(!layer)return undefined;
  const context=output.context;
  const mix=context.createGain();
  mix.gain.value=.68;
  mix.connect(output);
  const space=context.createDelay(.2), reflection=context.createGain(), room=context.createStereoPanner();
  space.delayTime.value=.071;reflection.gain.value=.13;room.pan.value=.54;
  mix.connect(space).connect(reflection).connect(room).connect(output);
  const tracks=layer.parts.map(part=>{
    const pan=context.createStereoPanner(), input=context.createGain();
    pan.pan.value=part.pan;input.connect(pan).connect(mix);
    return {...part,pan,input};
  });
  const hits:{sound:ReturnType<typeof schedulePercussionHit>;end:number}[]=[];
  const stepSeconds=plan.beat/4;
  const total=plan.bars*plan.meter*4;
  let next=0;
  function schedule() {
    if(context.state!=="running")return;
    const now=context.currentTime;
    while(hits.length && hits[0].end<=now)hits.shift();
    next=Math.max(next,Math.ceil((now-plan.base-.012)/stepSeconds));
    while(next<total && plan.base+next*stepSeconds<now+.3){
      const at=plan.base+next*stepSeconds;
      const step=next%16, bar=Math.floor(next/16);
      tracks.forEach((track,part)=>{
        const fill=bar===3 && part===tracks.length-1 && step===13;
        if(!fill && !track.steps.includes(step))return;
        const accent=step%4===0 ? 1 : step%2 ? .72 : .86;
        const pitch=track.pitch*(track.voice==="tom" && bar%2 ? 1.5 : 1);
        const time=Math.max(at,now);
        hits.push({sound:schedulePercussionHit(track.input,34,track.voice,time,
          {pitch,velocity:track.level*accent}),end:time+.39});
      });
      next++;
    }
  }
  schedule();
  const timer=window.setInterval(schedule,25);
  return ()=>{
    window.clearInterval(timer);
    for(const {sound} of hits)sound.mute();
    for(const {input,pan} of tracks){input.disconnect();pan.disconnect();}
    mix.disconnect();space.disconnect();reflection.disconnect();room.disconnect();
  };
}
