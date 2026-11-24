import { useEffect, useRef, useState } from "react";
import { captureFactory } from "./measure-recorder";
import { createTimbreRack } from "./timbre-rack";

export const VOICE_CUES = {
  31: "Decí una frase corta. Cada vuelta abre el eco hacia los costados.",
  89: "Sostené la última vocal de El último café. Va a volver como un coro grave.",
} as const;
export type VoiceScene = keyof typeof VOICE_CUES;
type Cue = { context: AudioContext; beginsAt: number };
type Phase = "off" | "listening" | "recording" | "playing" | "stopped" | "empty" | "late" | "error";

// Browsers often reveal device labels only after granting audio permission.
// Keep the authorised input when a webcam microphone cannot be identified.
export async function getVoiceMicrophone(signal: AbortSignal) {
  const devices = navigator.mediaDevices;
  const initial = await devices.getUserMedia({ audio: true, video: false });
  const stopInitial = () => initial.getTracks().forEach(track => track.stop());
  if (signal.aborted) { stopInitial(); return initial; }
  signal.addEventListener("abort", stopInitial, {once: true});
  try {
    const inputs = await devices.enumerateDevices();
    if (signal.aborted) return initial;
    const cameras = inputs.filter(device => device.kind === "videoinput" && device.groupId);
    const microphones = inputs.filter(device => device.kind === "audioinput" && device.deviceId
      && device.deviceId !== "default" && device.deviceId !== "communications");
    const webcam = microphones.find(mic => /web\s?cam|camera|cámara/i.test(mic.label))
      ?? microphones.find(mic => cameras.some(camera => camera.groupId === mic.groupId));
    const track = initial.getAudioTracks()[0];
    const settings = track?.getSettings();
    if (!webcam || webcam.deviceId === settings?.deviceId || webcam.label === track?.label
      || (webcam.groupId && webcam.groupId === settings?.groupId)) return initial;
    const selected = await devices.getUserMedia({ audio: { deviceId: { exact: webcam.deviceId } }, video: false });
    stopInitial();
    return selected;
  } catch {
    return initial;
  } finally {
    signal.removeEventListener("abort", stopInitial);
  }
}

function makeTake(ctx: AudioContext, samples: Float32Array, scene: VoiceScene) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  if (peak < .0015) return null;
  let first = 0, end = samples.length;
  // Keep the full pulse in 31. In 89 let the vocal sustain determine the loop.
  if (scene === 89) {
    const edge = peak * .035;
    while (first < end && Math.abs(samples[first]) < edge) first++;
    while (end > first && Math.abs(samples[end - 1]) < edge) end--;
    const margin = Math.round(ctx.sampleRate * .06);
    first = Math.max(0, first - margin);
    end = Math.min(samples.length, end + margin);
  }
  const buffer = ctx.createBuffer(1, end - first, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  const fade = Math.min(channel.length / 2, ctx.sampleRate * (scene === 31 ? .018 : .09));
  const gain = Math.min(4, .58 / peak);
  for (let i = 0; i < channel.length; i++) {
    const envelope = Math.min(1, i / fade, (channel.length - 1 - i) / fade);
    channel[i] = samples[first + i] * gain * envelope;
  }
  return buffer;
}

function playTake(ctx: AudioContext, output: GainNode, scene: VoiceScene, take: AudioBuffer) {
  const bus = ctx.createGain();
  bus.connect(output);
  const rack = createTimbreRack(bus);
  rack.select(scene === 31 ? 31 : 29, scene === 31 ? 68 : 96);
  const voices: AudioBufferSourceNode[] = [];
  const branches: AudioNode[] = [];
  const start = ctx.currentTime + .015;

  function layer(buffer: AudioBuffer, rate: number, offset: number, pan: number, volume: number, swell: number) {
    const source = ctx.createBufferSource();
    const level = ctx.createGain();
    const position = ctx.createStereoPanner();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = rate;
    level.gain.setValueAtTime(0, start + offset);
    level.gain.linearRampToValueAtTime(volume, start + offset + swell);
    position.pan.setValueAtTime(0, start + offset);
    position.pan.linearRampToValueAtTime(pan, start + offset + swell);
    source.connect(level).connect(position).connect(rack.input);
    voices.push(source);
    branches.push(level, position);
    source.start(start + offset);
  }

  if (scene === 31) {
    const beat = take.duration / 4;
    layer(take, 1, 0, 0, .76, .05);
    layer(take, 1, beat * .75, -.9, .30, 2.4);
    layer(take, 1, beat * 1.5, .9, .23, 4.8);
  } else {
    const reverse = ctx.createBuffer(1, take.length, ctx.sampleRate);
    reverse.getChannelData(0).set(take.getChannelData(0));
    reverse.getChannelData(0).reverse();
    layer(take, .5, 0, -.55, .83, .75);
    layer(reverse, .75, .32, .75, .58, 2.8);
  }

  return {
    fadeAt(end: number) {
      const now = ctx.currentTime;
      const fade = scene === 31 ? 1.2 : 2.5;
      const level = bus.gain.value;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(level, now);
      const release = Math.max(now, end - fade);
      if (release > now) bus.gain.linearRampToValueAtTime(1, Math.min(release, now + .05));
      bus.gain.setValueAtTime(release > now ? 1 : level, release);
      bus.gain.linearRampToValueAtTime(0, Math.max(now + .01, end));
    },
    close() {
      const now = ctx.currentTime;
      const tail = ctx.state === "running" ? .025 : 0;
      const level = bus.gain.value;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(level, now);
      bus.gain.linearRampToValueAtTime(0, now + tail);
      for (const voice of voices) voice.stop(now + tail);
      const disconnect = () => {
        for (const voice of voices) voice.disconnect();
        for (const branch of branches) branch.disconnect();
        rack.close();
        bus.disconnect();
      };
      if (tail) window.setTimeout(disconnect, 45);
      else disconnect();
    },
  };
}

export function useVoiceLoop(scene: VoiceScene | null, cue: Cue | null, seconds: number,
    stream: MediaStream | null, output: GainNode | null, bpm: number) {
  const [phase, setPhase] = useState<Phase>("off");
  const [attempt, setAttempt] = useState(0);
  const controls = useRef<{ record: () => void; stop: () => void } | null>(null);
  const player = useRef<ReturnType<typeof playTake> | null>(null);
  const timing = useRef({ end: 0, bpm });
  useEffect(() => {
    timing.current = { end: (cue?.beginsAt ?? 0) + seconds, bpm };
    player.current?.fadeAt(timing.current.end);
  }, [cue, seconds, bpm]);

  useEffect(() => {
    if (!scene || !cue || !output || !stream?.getAudioTracks().some(track => track.readyState === "live")) {
      setPhase("off");
      return;
    }
    const ctx = cue.context;
    if (output.context !== ctx) return;
    const mic = ctx.createMediaStreamSource(stream);
    const bassCut = ctx.createBiquadFilter();
    bassCut.type = "highpass";
    bassCut.frequency.value = 85;
    bassCut.channelCountMode = "explicit";
    bassCut.channelCount = 1;
    const meter = ctx.createAnalyser();
    meter.fftSize = 2048;
    const samples = new Float32Array(meter.fftSize);
    // Keep the beginning of a consonant while the main thread detects the onset.
    const preRoll = ctx.createDelay(.3);
    preRoll.delayTime.value = .16;
    const silence = ctx.createGain();
    silence.gain.value = 0;
    mic.connect(bassCut).connect(meter).connect(preRoll).connect(silence).connect(output);
    let recorder: ReturnType<ReturnType<typeof captureFactory>> | null = null;
    let timer = 0;
    let listening = true;
    let cancelled = false;
    const releaseInput = () => {
      window.clearInterval(timer);
      recorder?.stop();
      recorder = null;
      for (const node of [mic, bassCut, meter, preRoll, silence]) node.disconnect();
    };
    const stop = () => {
      cancelled = true;
      releaseInput();
      player.current?.close();
      player.current = null;
    };
    const record = () => {
      if (cancelled || !listening || ctx.state !== "running") return;
      listening = false;
      window.clearInterval(timer);
      const available = timing.current.end - ctx.currentTime;
      const phrase = scene === 31 ? Math.min(3.6, Math.max(1.6, 240 / timing.current.bpm)) : 3.2;
      const duration = Math.min(phrase, available / 2.5);
      if (duration < .32) { releaseInput(); setPhase("late"); return; }
      const start = Math.ceil((ctx.currentTime + .018) * ctx.sampleRate);
      const length = Math.round(duration * ctx.sampleRate);
      try {
        recorder = captureFactory(ctx)(start, length, start + length, channels => {
          if (cancelled) return;
          releaseInput();
          const take = makeTake(ctx, channels[0], scene);
          if (!take) { setPhase("empty"); return; }
          player.current = playTake(ctx, output, scene, take);
          player.current.fadeAt(timing.current.end);
          setPhase("playing");
        });
        preRoll.connect(recorder.node).connect(silence);
        setPhase("recording");
      } catch { releaseInput(); setPhase("error"); }
    };
    setPhase("listening");
    timer = window.setInterval(() => {
      if (ctx.state !== "running") return;
      meter.getFloatTimeDomainData(samples);
      let power = 0;
      for (const value of samples) power += value * value;
      if (power > samples.length * .006 ** 2) record();
    }, 24);
    controls.current = { record, stop: () => { stop(); setPhase("stopped"); } };
    return () => { controls.current = null; stop(); };
  }, [attempt, cue, output, scene, stream]);

  return { phase, record: () => controls.current?.record(), stop: () => controls.current?.stop(),
    retake: () => setAttempt(value => value + 1) };
}
