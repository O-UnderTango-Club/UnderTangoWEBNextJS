import type {PercussionVoice} from "./scene-instrument";

type Instrument = {voice:PercussionVoice; pitch:number; level:number; pan:number; steps:readonly number[]};
const RITUAL = {
  19:{name:"Pisadas y piel grave", parts:[
    {voice:"kick",pitch:55.5,level:.82,pan:0,steps:[0,4,8,12]},
    {voice:"tom",pitch:111,level:.58,pan:-.28,steps:[3,10,15]},
  ]},
  21:{name:"Semillas y manos",parts:[
    {voice:"hat",pitch:6200,level:.53,pan:.32,steps:[2,5,6,9,10,13,14,15]},
    {voice:"clap",pitch:222,level:.63,pan:-.22,steps:[4,12]},
  ]},
  23:{name:"Tambores de llamada y respuesta",parts:[
    {voice:"tom",pitch:111,level:.77,pan:-.5,steps:[0,3,6,10]},
    {voice:"tom",pitch:166.5,level:.64,pan:.5,steps:[4,7,11,14]},
  ]},
  25:{name:"Metal, aire y contratiempo",parts:[
    {voice:"metal",pitch:444,level:.63,pan:.48,steps:[0,7,10,14]},
    {voice:"hat",pitch:6200,level:.58,pan:-.42,steps:[2,6,10,14]},
  ]},
  27:{name:"Bombo rave y caja quebrada",parts:[
    {voice:"kick",pitch:55.5,level:.9,pan:0,steps:[0,4,8,11,14]},
    {voice:"snare",pitch:222,level:.64,pan:.18,steps:[4,7,12,15]},
  ]},
  29:{name:"Ensamble ritual",parts:[
    {voice:"kick",pitch:55.5,level:.86,pan:0,steps:[0,4,8,12]},
    {voice:"tom",pitch:111,level:.78,pan:-.42,steps:[3,6,10,15]},
    {voice:"clap",pitch:222,level:.66,pan:.36,steps:[4,12]},
    {voice:"metal",pitch:333,level:.55,pan:.54,steps:[0,10]},
  ]},
} satisfies Record<number,{name:string;parts:Instrument[]}>;
type RitualScene=keyof typeof RITUAL;
export function ritualLayer(scene:number|null) {
  return scene!==null && Object.hasOwn(RITUAL,scene) ? RITUAL[scene as RitualScene] : undefined;
}
