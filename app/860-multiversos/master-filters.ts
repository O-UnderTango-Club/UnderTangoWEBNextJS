export const MASTER_FILTERS = [
  {id:"bass",label:"Graves",short:"Grav",description:"Realce de graves"},
  {id:"treble",label:"Agudos",short:"Agud",description:"Atenuación de agudos"},
  {id:"drive",label:"Saturación",short:"Sat",description:"Saturación suave"},
  {id:"compress",label:"Compresión",short:"Comp",description:"Compresión paralela"},
  {id:"tremolo",label:"Trémolo",short:"Trém",description:"Modulación de volumen"},
  {id:"pan",label:"Paneo",short:"Pan",description:"Paneo estéreo automático"},
  {id:"chorus",label:"Chorus",short:"Chor",description:"Duplicación modulada"},
  {id:"echo",label:"Eco",short:"Eco",description:"Repeticiones con realimentación"},
  {id:"reverb",label:"Reverberación",short:"Rev",description:"Cola estéreo de sala"},
] as const;

export type MasterFilter = typeof MASTER_FILTERS[number]["id"];
export type FilterFader = `filter-${MasterFilter}`;
export const filterFader = (id:MasterFilter):FilterFader => `filter-${id}`;
export const filterForFader = (key:string) => MASTER_FILTERS.find(({id}) => filterFader(id)===key);
export type FilterValues = Partial<Record<MasterFilter,number>>;
const amount=(value:number|undefined)=>Number.isFinite(value) ? Math.min(100,Math.max(0,value ?? 0))/100 : 0;

export function createMasterFilters(input:GainNode, output:GainNode, initial:FilterValues) {
  const context=input.context;
  const oscillators:OscillatorNode[]=[];
  const nodes:AudioNode[]=[];
  const keep=<T extends AudioNode>(node:T)=>{nodes.push(node);return node;};
  const low=keep(context.createBiquadFilter());
  low.type="lowshelf";low.frequency.value=160;
  const high=keep(context.createBiquadFilter());
  high.type="highshelf";high.frequency.value=2900;
  input.connect(low).connect(high);

  const parallel=(drySource:AudioNode,wetSource:AudioNode)=>{
    const dry=keep(context.createGain()),wet=keep(context.createGain()),sum=keep(context.createGain());
    drySource.connect(dry).connect(sum);wetSource.connect(wet).connect(sum);
    return {dry,wet,sum};
  };
  const modulate=(frequency:number,target:AudioParam)=>{
    const oscillator=keep(context.createOscillator()),depth=keep(context.createGain());
    oscillator.frequency.value=frequency;oscillator.connect(depth).connect(target);
    depth.gain.value=0;
    oscillator.start();oscillators.push(oscillator);
    return depth.gain;
  };

  const drive=keep(context.createWaveShaper());
  const curve=new Float32Array(8193);
  for(let i=0;i<curve.length;i++)curve[i]=Math.tanh((2*i/(curve.length-1)-1)*3)/Math.tanh(3);
  drive.curve=curve;drive.oversample="2x";
  high.connect(drive);
  const saturation=parallel(high,drive);

  const compressor=keep(context.createDynamicsCompressor());
  compressor.threshold.value=-26;compressor.knee.value=15;
  compressor.ratio.value=5;compressor.attack.value=.018;compressor.release.value=.17;
  saturation.sum.connect(compressor);
  const compressed=parallel(saturation.sum,compressor);

  const tremolo=keep(context.createGain());
  compressed.sum.connect(tremolo);
  const tremoloDepth=modulate(4.2,tremolo.gain);
  const pan=keep(context.createStereoPanner());
  tremolo.connect(pan);
  const panDepth=modulate(.41,pan.pan);

  const chorusDelay=keep(context.createDelay(.06));
  chorusDelay.delayTime.value=.018;
  pan.connect(chorusDelay);
  const chorusDepth=modulate(.76,chorusDelay.delayTime);
  const chorus=parallel(pan,chorusDelay);

  const delay=keep(context.createDelay(.65)),feedback=keep(context.createGain());
  delay.delayTime.value=.34;
  chorus.sum.connect(delay);delay.connect(feedback).connect(delay);
  const echo=parallel(chorus.sum,delay);

  const room=keep(context.createConvolver());
  const length=Math.round(context.sampleRate*2.2), impulse=context.createBuffer(2,length,context.sampleRate);
  for(let channel=0;channel<2;channel++){
    const wave=impulse.getChannelData(channel);
    for(let i=Math.round(.018*context.sampleRate);i<length;i++){
      wave[i]=(Math.random()*2-1)*Math.pow(1-i/length,3.1);
    }
  }
  room.buffer=impulse;
  echo.sum.connect(room);
  const reverb=parallel(echo.sum,room);
  reverb.sum.connect(output);

  function apply(values:FilterValues,smooth=true) {
    const now=context.currentTime;
    const set=(parameter:AudioParam,value:number)=>{
      if(smooth) parameter.setTargetAtTime(value,now,.025);
      else parameter.value=value;
    };
    const blend=(branch:ReturnType<typeof parallel>,value:number)=>{
      set(branch.dry.gain,1-value);set(branch.wet.gain,value);
    };
    set(low.gain,amount(values.bass)*10);
    set(high.gain,amount(values.treble)*-24);
    blend(saturation,amount(values.drive)*.72);
    blend(compressed,amount(values.compress)*.88);
    const trem=amount(values.tremolo)*.46;
    set(tremolo.gain,1-trem);set(tremoloDepth,trem);
    set(panDepth,amount(values.pan)*.9);
    const chor=amount(values.chorus);
    set(chorusDepth,chor*.006);blend(chorus,chor*.38);
    const delayAmount=amount(values.echo);
    set(feedback.gain,delayAmount*.57);blend(echo,delayAmount*.43);
    blend(reverb,amount(values.reverb)*.65);
  }
  apply(initial,false);
  return {apply,dispose(){
    for(const oscillator of oscillators)oscillator.stop();
    input.disconnect(low);
    for(const node of nodes)node.disconnect();
  }};
}
