/** The performance instruments feed the same scene bus as the score and sample recorder. */
export const SCENE_INSTRUMENT_NAMES = {
  16: "Armónicos de 111 Hz", 17: "Clavecín temperado", 19: "Timbre al tacto",
  32: "Bajo de pulso", 33: "Pads abiertos", 34: "Batería electrónica", 35: "Arpegio",
  36: "Acordes cortos", 37: "Bajo ácido", 38: "Melodía de sierra", 39: "Ensamble por registros",
  63: "Dub", 64: "House", 65: "Garage", 66: "Breakbeat", 67: "Electro", 68: "Techno", 69: "Trance",
  70: "Bombo psy", 71: "Bajo rodante", 72: "Contratiempo", 73: "Ácido", 74: "Arpegio Goa",
  75: "Percusión metálica", 76: "Atmósfera", 77: "Resonancia", 78: "Lead en octavas", 79: "Ensamble psy",
  80: "Contrabajo", 81: "Bandoneón", 82: "Marcato", 83: "Cuerdas", 84: "Milonga",
  85: "Arrastre", 86: "Bordoneo", 87: "Ensamble de tango", 88: "Piano solo", 89: "Sala",
} as const;

type InstrumentScene = keyof typeof SCENE_INSTRUMENT_NAMES;
export function usesSceneKeyboard(scene: number | null): scene is InstrumentScene {
  return scene !== null && Object.prototype.hasOwnProperty.call(SCENE_INSTRUMENT_NAMES, scene);
}

type Color = "bass" | "pad" | "stab" | "acid" | "lead" | "hollow" | "piano" | "pluck" |
  "reed" | "strings" | "doubleBass" | "drag" | "kick" | "snare" | "hat" | "metal" | "tom";
type Rhythm = { divisions: number; steps: readonly (number | null)[]; gate: number };
// Steps are semitone offsets. Resting the first sixteenth leaves room for the kick.
const roll: Rhythm = { divisions: 4, steps: [null, 0, 0, 0], gate: .73 };
const offbeat: Rhythm = { divisions: 2, steps: [null, 0], gate: .8 };
const arpeggio: Rhythm = { divisions: 2, steps: [0, 7, 12, 7], gate: .8 };
const goa: Rhythm = { divisions: 4, steps: [0, 1, 7, 12, 0, 10, 7, 1], gate: .76 };
const garage: Rhythm = { divisions: 4, steps: [0, null, null, 7, null, null, 0, null], gate: 1.15 };
const breakKick: Rhythm = { divisions: 4, steps: [0,null,null,null,null,null,0,null,null,null,0,null,null,null,null,0], gate: .8 };
const breakSnare: Rhythm = { divisions: 4, steps: [null,null,null,null,0,null,null,null,null,null,null,0,0,null,null,null], gate: .75 };
const breakHat: Rhythm = { divisions: 4, steps: [0,null,0,0,0,null,0,null], gate: .57 };
const milonga: Rhythm = { divisions: 2, steps: [0, null, null, 7, null, null, 0, null], gate: 1.35 };
const downbeats: Rhythm = { divisions: 1, steps: [0], gate: .66 };

function kit(note: number): Color {
  return (["kick", "hat", "snare", "metal", "snare", "tom", "hat", "tom", "metal", "tom", "hat", "hat"] as const)[note % 12];
}
function orchestration(scene: InstrumentScene, note: number): {color: Color; rhythm?: Rhythm} {
  switch (scene) {
    case 16: return {color:"hollow"};
    case 17: return {color:"pluck"};
    case 19: case 77: return {color:"hollow"};
    case 32: return {color:"bass"};
    case 33: case 76: return {color:"pad"};
    case 34: return {color:kit(note)};
    case 66: {const color=kit(note);return {color,rhythm:color==="kick"?breakKick:color==="snare"?breakSnare:breakHat};}
    case 35: return {color:"pluck",rhythm:arpeggio};
    case 36: case 64: return {color:"stab"};
    case 37: case 73: return {color:"acid"};
    case 38: case 78: return {color:"lead"};
    case 39: return {color:note<48?"bass":note<68?"stab":"lead"};
    case 63: return {color:"pluck"};
    case 65: return {color:"bass",rhythm:garage};
    case 67: return {color:"hollow",rhythm:arpeggio};
    case 68: return {color:note<52?"kick":"acid",rhythm:note<52?downbeats:roll};
    case 69: return {color:"lead",rhythm:arpeggio};
    case 70: return {color:"kick",rhythm:downbeats};
    case 71: return {color:"bass",rhythm:roll};
    case 72: return {color:"stab",rhythm:offbeat};
    case 74: return {color:"acid",rhythm:goa};
    case 75: return {color:note%2?"hat":"metal"};
    case 79: return note<42?{color:"kick",rhythm:downbeats}:note<60?{color:"bass",rhythm:roll}:{color:"acid",rhythm:goa};
    case 80: return {color:"doubleBass"};
    case 81: return {color:"reed"};
    case 82: return {color:note<53?"doubleBass":"reed",rhythm:downbeats};
    case 83: return {color:"strings"};
    case 84: return {color:"doubleBass",rhythm:milonga};
    case 85: return {color:"drag"};
    case 86: return {color:"pluck",rhythm:milonga};
    case 87: return {color:note<48?"doubleBass":note<71?"reed":"strings"};
    default: return {color:"piano"};
  }
}

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>();
function noiseBuffer(ctx: BaseAudioContext) {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*.5),ctx.sampleRate);
    const samples=buffer.getChannelData(0);
    for(let i=0;i<samples.length;i++) samples[i]=Math.random()*2-1;
    noiseBuffers.set(ctx,buffer);
  }
  return buffer;
}

type Sound = {release:(time:number)=>void; mute:()=>void};
function makeSound(bus: GainNode, scene: InstrumentScene, color: Color, hz: number, velocity: number, time: number, done: (s:Sound)=>void): Sound {
  const ctx=bus.context;
  const envelope=ctx.createGain();
  const filter=ctx.createBiquadFilter();
  filter.type="lowpass";
  const limit=ctx.sampleRate*.46;
  filter.frequency.value=limit;
  filter.Q.value=.7;
  filter.connect(envelope).connect(bus);
  const sources: AudioScheduledSourceNode[]=[];
  const nodes: AudioNode[]=[filter,envelope];
  const piano=color==="piano", pad=color==="pad" || color==="strings";
  const bass=color==="bass" || color==="doubleBass";
  const drums=["kick","snare","hat","metal","tom"].includes(color);
  const struck=drums || ["pluck","stab","doubleBass"].includes(color);
  const attack=pad?(scene===76?.22:.11):color==="reed" || color==="drag"?.035:.003;
  const releaseTime=pad?.34:piano?.14:color==="reed"?.1:.045;
  const peak=(drums?.26:pad?.15:.19)*(.14+.86*velocity**1.35);
  const amp=envelope.gain;
  amp.setValueAtTime(.00001,time);
  amp.exponentialRampToValueAtTime(peak,time+attack);
  const natural=color==="kick"?.36:color==="tom"?.26:color==="snare"?.2:color==="hat"?.075:color==="metal"?.3:
    color==="doubleBass"?.9:color==="pluck"?1.1:color==="stab"?.28:0;
  if(natural) amp.exponentialRampToValueAtTime(.00001,time+natural);
  else if(piano) amp.setTargetAtTime(.00001,time+attack,1.1);
  else amp.setTargetAtTime(peak*(pad?.87:.63),time+attack,.12);

  function osc(wave: OscillatorType, ratio: number, gain: number, cents=0, decay=0) {
    const oscillator=ctx.createOscillator(), level=ctx.createGain();
    oscillator.type=wave;
    oscillator.frequency.value=Math.min(limit,hz*ratio);
    oscillator.detune.value=cents;
    level.gain.setValueAtTime(gain,time);
    if(decay)level.gain.setTargetAtTime(.00001,time+.004,decay);
    oscillator.connect(level).connect(filter);nodes.push(level);sources.push(oscillator);
    return oscillator;
  }
  function noise(type:BiquadFilterType,cut:number,gain:number) {
    const src=ctx.createBufferSource(), band=ctx.createBiquadFilter(), level=ctx.createGain();
    src.buffer=noiseBuffer(ctx);src.loop=true;band.type=type;band.frequency.value=Math.min(limit,cut);
    level.gain.value=gain;src.connect(band).connect(level).connect(filter);
    nodes.push(band,level);sources.push(src);
  }
  function sweep(from:number,to:number,decay:number,q=.8) {
    filter.frequency.setValueAtTime(Math.min(limit,from),time);
    filter.frequency.exponentialRampToValueAtTime(Math.min(limit,to),time+decay);
    filter.Q.value=q;
  }
  if(bass || color==="acid"){
    osc(color==="doubleBass"?"triangle":"sawtooth",1,.52);osc("sine",1,.6);
    if(color==="doubleBass")osc("sawtooth",2,.22,0,.075);
    sweep(hz*(color==="acid"?18:8)*(1+velocity),hz*(color==="acid"?2.5:1.7),color==="acid"?.22:.12,color==="acid"?4.2:1.1);
  } else if(piano || color==="pluck"){
    // Piano strings lose their upper partials faster than their fundamental.
    osc(piano?"triangle":"sawtooth",1,.73);
    osc("sine",2.002,.28*velocity,0,.65);
    osc("sine",3.006,.2*velocity**2,0,.28);
    osc("sine",5.014,.12*velocity**2,0,.08);
    sweep(hz*(4+velocity*12),hz*2.2,.42);
  } else if(color==="kick" || color==="tom") {
    const fundamental=osc("sine",1,1), end=color==="kick"?Math.min(85,Math.max(39,hz)):Math.min(440,Math.max(72,hz));
    fundamental.frequency.setValueAtTime(end*(color==="kick"?4.1:1.8),time);
    fundamental.frequency.exponentialRampToValueAtTime(end,time+(color==="kick"?.047:.11));
    osc("triangle",2,.16,0,.016);
  } else if(drums){
    if(color==="snare"){noise("highpass",950,.9);osc("triangle",1,.26,0,.052);}
    else if(color==="hat")noise("highpass",6400,1.15);
    else {osc("square",1,.32);osc("square",1.48,.23);osc("triangle",2.71,.23);noise("highpass",4700,.38);}
  } else if(pad || color==="reed" || color==="drag" || color==="lead" || color==="stab"){
    const reed=color==="reed" || color==="drag";
    const main=osc(reed?"square":"sawtooth",1,.56);
    osc("sawtooth",1,.37,pad?8:reed?3:-7);
    if(scene===78 || pad || reed) osc("triangle",2,.24);
    if(scene===76)osc("sine",1.498,.3,-3);
    if(scene===64){osc("sawtooth",2**(3/12),.22);osc("triangle",2**(10/12),.22);}
    if(color==="drag"){main.detune.setValueAtTime(-180,time);main.detune.linearRampToValueAtTime(0,time+.145);}
    if(pad || reed)sweep(hz*2.7,hz*(5+velocity*5),pad?.32:.14);
    else sweep(hz*(7+velocity*7),hz*(color==="stab"?2.2:4.3),.18,1.25);
  } else {
    const carrier=osc("sine",1,.95);
    const mod=ctx.createOscillator(), depth=ctx.createGain();
    mod.frequency.value=hz*(scene===77?1.498:2);
    depth.gain.setValueAtTime(hz*(.25+2*velocity),time);
    depth.gain.setTargetAtTime(hz*.16,time+.02,.26);
    mod.connect(depth).connect(carrier.frequency);sources.push(mod);nodes.push(depth);
  }
  let releaseAt=Infinity, disposed=false;
  const sound:Sound={
    release(at) {
      if(disposed || at>=releaseAt)return;
      releaseAt=at;
      if(at<=time){sound.mute();return;}
      // Drum hits ring out. Releasing a pitched key damps its strings or oscillator.
      if(drums)return;
      if(typeof amp.cancelAndHoldAtTime==="function")amp.cancelAndHoldAtTime(at);
      else {const level=amp.value;amp.cancelScheduledValues(at);amp.setValueAtTime(Math.max(.00001,level),at);}
      amp.setTargetAtTime(.00001,at,releaseTime/4);
      const stopAt=natural?Math.min(time+natural+.015,at+releaseTime):at+releaseTime;
      sources.forEach(src=>src.stop(stopAt));
    },
    mute() {
      if(disposed)return;
      disposed=true;
      sources.forEach(src=>{src.onended=null;src.stop();src.disconnect();});
      nodes.forEach(node=>node.disconnect());done(sound);
    },
  };
  let remaining=sources.length;
  sources.forEach(src=>{
    src.onended=()=>{if(--remaining===0 && !disposed){disposed=true;sources.forEach(s=>s.disconnect());nodes.forEach(n=>n.disconnect());done(sound);}};
    src.start(time);
    if(struck || piano)src.stop(time+(natural || 9)+.015);
  });
  return sound;
}

type Beat = {bpm:number; origin:number};
export function createSceneInstrument(scene: InstrumentScene, output: GainNode, tuning:number, beat:()=>Beat,
  onAttack:(frequency:number,velocity:number)=>void) {
  const ctx=output.context;
  const bus=ctx.createGain();
  bus.gain.value=.82;
  bus.connect(output);
  const echo=[35,38,63,65,69,74,76,77,78].includes(scene);
  const delay=echo?ctx.createDelay(2):null, feedback=echo?ctx.createGain():null;
  if(delay && feedback){
    delay.delayTime.value=Math.min(1.9,45/beat().bpm);feedback.gain.value=scene===63?.44:.24;
    bus.connect(delay).connect(feedback);feedback.connect(delay);feedback.connect(output);
  }
  const voices=new Set<Sound>();
  type Held = {note:number; velocity:number; color:Color; rhythm?:Rhythm; next:number; notes:Set<Sound>};
  const keys=new Map<string,Held>();
  let timer:number|undefined;
  function frequency(note:number,color:Color) {
    if(scene===16)return 111*(1+note%9)*2**Math.max(-2,Math.min(2,Math.floor((note-48)/24)));
    let midi=note;
    if(color==="bass" || color==="doubleBass" || color==="kick" || (color==="acid" && scene!==74 && scene!==79)) {
      while(midi>51)midi-=12;
      while(midi<26)midi+=12;
    } else {
      while(midi<21)midi+=12;
      while(midi>108)midi-=12;
    }
    return Math.max(18, Math.min(ctx.sampleRate*.21,tuning*2**((midi-69)/12)));
  }
  function hit(key:Held, at:number, step:number, duration?:number) {
    const hz=frequency(key.note+step,key.color);
    if(voices.size>=48)voices.values().next().value?.mute();
    const sound=makeSound(bus,scene,key.color,hz,key.velocity,at,s=>{voices.delete(s);key.notes.delete(s);});
    voices.add(sound);key.notes.add(sound);
    if(duration!==undefined)sound.release(at+duration);
  }
  function schedule() {
    if(ctx.state!=="running")return;
    const now=ctx.currentTime, {bpm,origin}=beat();
    if(delay)delay.delayTime.setTargetAtTime(Math.min(1.9,45/bpm),now,.025);
    for(const key of keys.values()){
      const pattern=key.rhythm;if(!pattern)continue;
      const interval=60/bpm/pattern.divisions;
      key.next=Math.max(key.next,Math.ceil((now-origin-.012)/interval));
      while(origin+key.next*interval<now+.075){
        const offset=pattern.steps[((key.next%pattern.steps.length)+pattern.steps.length)%pattern.steps.length];
        const at=Math.max(now,origin+key.next*interval);
        if(offset!==null)hit(key,at,offset,interval*pattern.gate);
        key.next++;
      }
    }
  }
  function release(id:string) {
    const key=keys.get(id);if(!key)return;
    keys.delete(id);
    // Remove scheduled attacks on the next subdivision as soon as the hand lifts.
    key.notes.forEach(s=>s.release(ctx.currentTime));
    if(timer!==undefined && !Array.from(keys.values()).some(k=>k.rhythm)){
      window.clearInterval(timer);timer=undefined;
    }
  }
  return {
    press(id:string,note:number,velocity:number){
      release(id);
      if(ctx.state!=="running")return;
      if(scene===89){onAttack(0,velocity);window.dispatchEvent(new CustomEvent("860-room-accent",{detail:{velocity}}));return;}
      const {color,rhythm}=orchestration(scene,note);
      const {bpm,origin}=beat(), interval=60/bpm/(rhythm?.divisions ?? 1);
      const now=ctx.currentTime;
      const next=Math.floor((now-origin)/interval)+1;
      const key:Held={color,rhythm,note,velocity,next,notes:new Set()};keys.set(id,key);
      onAttack(frequency(note,color),velocity);
      hit(key,now,0,rhythm?Math.min(interval*rhythm.gate,Math.max(.022,origin+next*interval-now)):undefined);
      if(rhythm && timer===undefined){schedule();timer=window.setInterval(schedule,25);}
    },
    release,
    releaseFrom(prefix:string){for(const id of keys.keys())if(id.startsWith(prefix))release(id);},
    releaseAll(){for(const id of keys.keys())release(id);},
    close(){
      window.clearInterval(timer);keys.clear();voices.forEach(voice=>voice.mute());
      bus.disconnect();delay?.disconnect();feedback?.disconnect();
    },
  };
}
