import { useEffect, useRef } from "react";

/** A key plays a short snapshot. The microphone has no live speaker connection. */
export function useRoomInstrument(active: boolean, stream: MediaStream | null, output: GainNode | null) {
  const meter = useRef<AnalyserNode | null>(null);
  useEffect(() => {
    if (!active || !output) return;
    const ctx = output.context as AudioContext;
    const input = stream?.getAudioTracks().some(t => t.readyState === "live") ? ctx.createMediaStreamSource(stream) : null;
    const scope = ctx.createAnalyser();
    scope.fftSize = 8192;
    input?.connect(scope);
    meter.current = scope;
    const voices = new Set<AudioBufferSourceNode>();
    const play = (event: Event) => {
      if (ctx.state !== "running" || voices.size >= 9) return;
      const velocity = Math.min(1, Math.max(0, (event as CustomEvent<{velocity:number}>).detail.velocity));
      const buffer = ctx.createBuffer(1, scope.fftSize, ctx.sampleRate);
      const samples = buffer.getChannelData(0);
      if (input) scope.getFloatTimeDomainData(samples);
      let air = 0;
      for (let i=0; i<samples.length; i++) {
        if (!input) { air = air*.95 + (Math.random()*2-1)*.05; samples[i] = air*.45; }
        samples[i] *= Math.sin(Math.PI*i/(samples.length-1))**2 * velocity * .6;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(output);
      voices.add(source);
      source.onended = () => { voices.delete(source); source.disconnect(); };
      source.start();
    };
    window.addEventListener("860-room-accent", play);
    return () => {
      window.removeEventListener("860-room-accent", play);
      meter.current = null;
      input?.disconnect(); scope.disconnect();
      for (const voice of voices) { voice.stop(); voice.disconnect(); }
    };
  }, [active, stream, output]);
  return meter;
}
