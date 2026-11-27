import {ritualLayer} from "./ritual-patterns";
import type {PerformanceInput} from "./performance-notes";

const noise = new WeakMap<BaseAudioContext,AudioBuffer>();
function excitation(context:BaseAudioContext) {
  let buffer=noise.get(context);
  if (!buffer) {
    buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.09),context.sampleRate);
    const samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
    noise.set(context,buffer);
  }
  return buffer;
}

export function createRitualInstrument(scene:number, output:GainNode, firstMidi:number,
    onHit:(pitch:number,velocity:number)=>void) {
  const patch=ritualLayer(scene)!;
  const context=output.context;
  const buffer=excitation(context);
  const tails=new Set<()=>void>();
  function strike(note:number, velocity:number) {
    if (velocity<=0 || context.state!=="running")return;
    if (tails.size>=16) tails.values().next().value?.();
    // Two keys per semitone. Each scene keeps its own synthesis patch.
    const offset=Math.max(-24,Math.min(48,note-firstMidi));
    const pitch=patch.pitch*2**(offset/24);
    const now=context.currentTime, end=now+patch.decay;
    const carrier=context.createOscillator(), mod=context.createOscillator();
    const depth=context.createGain(), body=context.createGain(), lowpass=context.createBiquadFilter();
    carrier.frequency.setValueAtTime(pitch*patch.sweep,now);
    carrier.frequency.exponentialRampToValueAtTime(pitch,now+Math.min(.058,patch.decay*.22));
    mod.frequency.value=pitch*patch.ratio;
    depth.gain.setValueAtTime(pitch*patch.fm*(.5+velocity*.5),now);
    depth.gain.setTargetAtTime(0,now+.006,patch.decay*.19);
    mod.connect(depth).connect(carrier.frequency);
    lowpass.type="lowpass";
    lowpass.frequency.value=Math.min(context.sampleRate*.42,patch.cutoff*(pitch/patch.pitch)**.55);
    body.gain.setValueAtTime(.0001,now);
    body.gain.exponentialRampToValueAtTime(.36*velocity,now+.006);
    body.gain.exponentialRampToValueAtTime(.0001,end);
    carrier.connect(lowpass).connect(body).connect(output);
    const transient=context.createBufferSource(), band=context.createBiquadFilter(), snap=context.createGain();
    transient.buffer=buffer;
    band.type="bandpass";
    band.frequency.value=Math.min(context.sampleRate*.42,patch.cutoff*(pitch/patch.pitch)**.55);
    band.Q.value=1.2;
    snap.gain.setValueAtTime(velocity*patch.noise,now);
    snap.gain.exponentialRampToValueAtTime(.0001,now+.048);
    transient.connect(band).connect(snap).connect(output);
    const sources=[carrier,mod,transient];
    const nodes=[...sources,depth,body,lowpass,band,snap];
    function disconnect(){
      tails.delete(stop);
      for(const node of nodes)node.disconnect();
    }
    function stop(){
      carrier.onended=null;
      for(const source of sources)source.stop();
      disconnect();
    }
    tails.add(stop);
    carrier.onended=disconnect;
    carrier.start(now);mod.start(now);transient.start(now);
    carrier.stop(end);mod.stop(end);
    onHit(pitch,velocity);
  }
  const routing:PerformanceInput={
    midiNote:(_id,_channel,note,velocity)=>strike(note,velocity),
    computerNote:(_id,note,down)=>{ if(down)strike(firstMidi+note-60,.82); },
    releaseMidi:()=>{},
  };
  return {routing,strike,close:()=>{for(const stop of tails)stop();}};
}
