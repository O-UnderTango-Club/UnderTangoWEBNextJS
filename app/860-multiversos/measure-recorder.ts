/** Capture and start the first repeat on adjacent samples on the audio thread. */
const processor = `
class MeasureRecorder extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const { start, length } = options.processorOptions;
    this.port.onmessage = e => { if (e.data === "stop") this.stopped = true; };
    this.start = start;
    this.length = length;
    this.channels = [new Float32Array(length), new Float32Array(length)];
  }
  process(inputs, outputs) {
    if (this.stopped) return false;
    const input = inputs[0], output = outputs[0];
    for (let i = 0; i < output[0].length; i++) {
      const offset = currentFrame + i - this.start;
      if (offset < 0) continue;
      if (offset < this.length) {
        for (let ch = 0; ch < 2; ch++) this.channels[ch][offset] = (input[ch] || input[0])?.[i] || 0;
      } else {
        for (let ch = 0; ch < 2; ch++) output[ch][i] = this.channels[ch][offset % this.length];
      }
    }
    if (!this.sent && currentFrame + output[0].length >= this.start + this.length) {
      this.sent = true;
      this.port.postMessage(this.channels);
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

export async function captureFactory(ctx: AudioContext) {
  // Some browser/audio drivers never resolve addModule. Keep the transport usable.
  let timer = 0;
  try {
    await Promise.race([prepareMeasureRecorder(ctx),new Promise<void>((_,reject)=>{
      timer=window.setTimeout(()=>reject(new Error("audio worklet timeout")),1500);
    })]);
    return (start: number,length: number,onLoop:(data:Float32Array[])=>void) => {
      const node = new AudioWorkletNode(ctx,"measure-recorder",{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[2],processorOptions:{start,length}});
      node.port.onmessage=e=>onLoop(e.data);
      return {node,stop:()=>{node.port.postMessage("stop");node.port.close();node.disconnect();}};
    };
  } catch {
    return (start:number,length:number,onLoop:(data:Float32Array[])=>void) => {
      const node=ctx.createScriptProcessor(1024,2,2);
      const channels=[new Float32Array(length),new Float32Array(length)];
      let offset:number|null=null, sent=false;
      node.onaudioprocess=e=>{
        if(offset===null)offset=Math.round(ctx.currentTime*ctx.sampleRate)-start;
        for(let ch=0;ch<2;ch++){
          const out=e.outputBuffer.getChannelData(ch), input=e.inputBuffer.getChannelData(ch);
          for(let i=0;i<out.length;i++){
            const j=offset+i;
            if(j>=length)out[i]=channels[ch][j%length];
            else if(j>=0)channels[ch][j]=input[i];
          }
        }
        offset+=e.outputBuffer.length;
        if(!sent && offset>=length){sent=true;onLoop(channels);}
      };
      return {node,stop:()=>{node.onaudioprocess=null;node.disconnect();}};
    };
  } finally {window.clearTimeout(timer);}
}
