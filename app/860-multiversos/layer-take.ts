import { TIMBRE_NAMES, type TimbreScene } from "./extended-scenes";

import {ritualLayer} from "./ritual-patterns";
import {TEMPERAMENT_SCENE} from "./show-score";

export const LAYERS = [
  {name:"Bajo de pulso",gesture:"pulso",color:"#91dbc2",pitch:110,wave:"sine"},
  {name:"Pads abiertos",gesture:"halo",color:"#b4b1ff",pitch:220,wave:"sine"},
  {name:"Batería electrónica",gesture:"golpe",color:"#ffb679",pitch:160,wave:"triangle"},
  {name:"Arpegio",gesture:"escalera",color:"#a2d7ff",pitch:330,wave:"triangle"},
  {name:"Acordes cortos",gesture:"acorde",color:"#f4c978",pitch:196,wave:"triangle"},
  {name:"Bajo ácido",gesture:"ácido",color:"#bcdf74",pitch:147,wave:"sawtooth"},
  {name:"Melodía de sierra",gesture:"sierra",color:"#ed91bc",pitch:294,wave:"sawtooth"},
  {name:"Ensamble por registros",gesture:"ensamble",color:"#7adddf",pitch:247,wave:"triangle"},
] as const;
export function isLayer(scene:number|null): scene is number {return scene!==null && scene>=32 && scene<=39;}
export function isManualLayer(scene:number|null): scene is number {return scene!==null && scene>=18 && scene<=TEMPERAMENT_SCENE;}
export function hasScoredTake(scene:number|null): scene is number { return isLayer(scene); }
export function takeSlot(scene:number) { return scene>=32 ? scene-32 : (scene-19+9)%9; }
export function takeName(scene:number) { return scene>=32 ? LAYERS[scene-32].name : ritualLayer(scene)?.name ?? (scene===18 ? "Cubos · 111 Hz" : TIMBRE_NAMES[scene as TimbreScene] ?? "El timbre"); }
export function nextTakeBeat(elapsed:number) {
  // The complete count starts at beat 12 and the take at beat 16 (zero-based).
  return 16 * Math.max(1, Math.ceil((elapsed + 4) / 16));
}
export type LayerPlan = {scene:number;slot:number;startBeat:number;base:number;beat:number;meter:number;bars:number};

export function countLayer(ctx:AudioContext, speakers:AudioNode, plan:LayerPlan) {
  const layer=LAYERS[takeSlot(plan.scene)%LAYERS.length], notes:OscillatorNode[]=[];
  for(let i=0;i<plan.meter;i++){
    const when=plan.base-(plan.meter-i)*plan.beat;
    const at=Math.max(ctx.currentTime,when), end=when+Math.min(plan.beat*.34,.15);
    if(end<=at+.004)continue;
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=layer.wave;
    const interval=layer.gesture==="escalera" || layer.gesture==="ensamble" ? [1,1.25,1.5,2][i%4] : i===0 ? 1.5 : 1;
    if (plan.scene<TEMPERAMENT_SCENE) osc.frequency.setValueAtTime(i===0?333:222,at);
    else {
      osc.frequency.setValueAtTime(layer.pitch*interval,at);
      osc.frequency.exponentialRampToValueAtTime(layer.pitch*interval*(layer.gesture==="golpe"?.42:.94),end);
    }
    gain.gain.setValueAtTime(.0001,at);
    gain.gain.exponentialRampToValueAtTime(i===0?.115:.075,at+.003);
    gain.gain.exponentialRampToValueAtTime(.0001,end);
    osc.connect(gain).connect(speakers);osc.onended=()=>{osc.disconnect();gain.disconnect();};
    osc.start(at);osc.stop(end);notes.push(osc);
  }
  return ()=>{for(const osc of notes)try{osc.stop();}catch{/* already ended */}};
}

// Play the first recorded frame on the downbeat, while the recorder delivers its buffer to the UI.
export function firstRepeat(ctx:AudioContext, take:AudioNode, master:AudioNode, base:number, cycle:number, volume:number) {
  const window=ctx.createGain(), delay=ctx.createDelay(cycle), level=ctx.createGain();
  window.gain.value=0;window.gain.setValueAtTime(1,base);window.gain.setValueAtTime(0,base+cycle);
  delay.delayTime.value=cycle;level.gain.value=volume;
  take.connect(window).connect(delay).connect(level).connect(master);
  let disposed=false;
  function stop(){if(disposed)return;disposed=true;window.disconnect();delay.disconnect();level.disconnect();}
  return {stop, handoff(){
    level.gain.setTargetAtTime(0,ctx.currentTime,.006);
    globalThis.setTimeout(stop,45);
  }};
}
