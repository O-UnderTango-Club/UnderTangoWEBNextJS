/** Keep the configured loop length; unused samples remain silent. */
const processor = `
class MeasureRecorder extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { start, length, end } = options.processorOptions;
    this.end = end;
    this.port.onmessage = e => {
      if (e.data === "stop") this.stopped = true;
      else if (typeof e.data === "number") this.end = Math.min(this.end, e.data);
    };
    this.start = start;
    this.length = length;
    this.channels = [new Float32Array(length), new Float32Array(length)];
  }
  process(inputs, outputs) {
    if (this.stopped) return false;
    const input = inputs[0], frames = outputs[0][0].length;
    for (let i = 0; i < frames; i++) {
      const frame = currentFrame + i, offset = frame - this.start;
      if (offset >= 0 && frame < this.end)
        for (let ch = 0; ch < 2; ch++) this.channels[ch][offset] = (input[ch] || input[0])?.[i] || 0;
    }
    if (currentFrame + frames >= this.end) {
      this.port.postMessage(this.channels, this.channels.map(ch=>ch.buffer));
      return false;
    }
    return true;
  }
}
registerProcessor("measure-recorder", MeasureRecorder);`;

const modules = new WeakMap<AudioContext, Promise<void>>();
export function prepareMeasureRecorder(ctx: AudioContext) {
  let ready = modules.get(ctx);
  if (!ready) {
    const url = URL.createObjectURL(new Blob([processor], { type: "application/javascript" }));
    ready = ctx.audioWorklet.addModule(url).catch(e => { modules.delete(ctx); throw e; })
      .finally(() => URL.revokeObjectURL(url));
    modules.set(ctx, ready);
  }
  return ready;
}

const readyContexts = new WeakSet<AudioContext>();
export function warmRecorder(ctx: AudioContext) {
  if (ctx.audioWorklet) void prepareMeasureRecorder(ctx).then(()=>readyContexts.add(ctx)).catch(()=>{});
}
export function captureFactory(ctx: AudioContext) {
  if (readyContexts.has(ctx)) {
    return (start: number,length: number,end:number,onLoop:(data:Float32Array[])=>void) => {
      const node = new AudioWorkletNode(ctx,"measure-recorder",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{start,length,end}});
      node.port.onmessage=e=>onLoop(e.data);
      return {node,finish:(frame:number)=>node.port.postMessage(frame),stop:()=>{node.port.postMessage("stop");node.port.close();node.disconnect();}};
    };
  } else {
    return (start:number,length:number,end:number,onLoop:(data:Float32Array[])=>void) => {
      const node=ctx.createScriptProcessor(1024,2,2);
      const channels=[new Float32Array(length),new Float32Array(length)];
      let offset:number|null=null, sent=false;
      node.onaudioprocess=e=>{
        if(offset===null)offset=Math.round(ctx.currentTime*ctx.sampleRate)-start;
        for(let ch=0;ch<2;ch++){
          const out=e.outputBuffer.getChannelData(ch), input=e.inputBuffer.getChannelData(ch);
          for(let i=0;i<out.length;i++){
            const j=offset+i;
            if(j>=0 && j+start<end)channels[ch][j]=input[i];
          }
        }
        offset+=e.outputBuffer.length;
        if(!sent && offset+start>=end){sent=true;onLoop(channels);}
      };
      return {node,finish:(frame:number)=>{end=Math.min(end,frame);},stop:()=>{node.onaudioprocess=null;node.disconnect();}};
    };
  }
}
