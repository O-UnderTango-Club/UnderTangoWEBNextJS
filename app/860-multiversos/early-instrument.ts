import { useLayoutEffect } from "react";
import { OCTAVE_NOTES, ORIGINAL_NOTES, interpolateTuning } from "./frequency-tuning";
import type { PerformanceInput } from "./performance-notes";
import { sceneNoiseBuffers } from "./scene-audio";
import { noiseKey, strikeMembrane, type PointStrike } from "./opening-sound";
import { CROSS_CUE, NEXT_NOTES, NOISE_IDS, SCENE_SYMBOLS, sceneProgress, type NoisePair } from "./scene-cues";

type EarlyScene = "opening" | "beacon" | "line" | "harmonics" | "space" | "time" | "cross" | "sphere" | "noise" | "return" | "breath";


// Each third of the octave selects an axis of the figure. The octaves on the
// keyboard transpose that axis, keeping even the extreme MIDI keys audible.
function axisPitch(scene: EarlyScene, note: number, progress: number) {
  const axis = Math.floor((note % 12) / 4);
  const octave = 2 ** Math.max(-2, Math.min(2, Math.floor(note / 12) - 5));
  if (scene === "sphere") return SCENE_SYMBOLS[note % 12].notes[axis] * octave;
  if (scene === "time") return interpolateTuning(ORIGINAL_NOTES, OCTAVE_NOTES, progress)[axis] * octave;
  if (scene === "cross") return interpolateTuning(OCTAVE_NOTES, NEXT_NOTES, progress)[axis] * octave;
  if (scene === "breath" || scene === "line") return 111 * octave;
  return ORIGINAL_NOTES[axis] * octave;
}

export function earlyInstrument(scene: EarlyScene, output: GainNode, beginsAt: number, seconds: number, pair: NoisePair, score: AudioContext, onHit?: (hit: PointStrike) => void) {
  const ctx = output.context;
  const bus = ctx.createGain();
  bus.connect(output);
  const held = new Map<string, (immediate: boolean) => void>();
  const noise = scene === "opening" || scene === "noise" || scene === "return" ? sceneNoiseBuffers(ctx) : null;
  const tails: ReturnType<typeof strikeMembrane>[] = [];
  const balance = () => bus.gain.setTargetAtTime(1 / Math.sqrt(Math.max(1, held.size)), ctx.currentTime, 0.012);

  function play(id: string, note: number, velocity: number) {
    if (ctx.state !== "running") return;
    if (held.has(id)) release(id);
    if (held.size >= 12) release(held.keys().next().value!);
    const now = ctx.currentTime;
    const strength = Math.max(0.05, Math.min(1, velocity));
    if (scene === "beacon" || scene === "line") {
      if (scene === "beacon") tails[tails.length - 1]?.releaseSub();
      if (tails.length >= 12) tails.shift()!.close();
      const hit = strikeMembrane(bus, note, strength, scene === "beacon");
      tails.push(hit);
      onHit?.(hit);
      return;
    }
    const envelope = ctx.createGain();
    const pan = ctx.createStereoPanner();
    pan.pan.value = (note % 12 / 11 - 0.5) * (scene === "space" ? 1.8 : 0.6);
    envelope.connect(pan).connect(bus);
    const sources: AudioScheduledSourceNode[] = [];
    const nodes: AudioNode[] = [envelope, pan];
    const textural = !!noise;
    if (noise) {
      const source = ctx.createBufferSource();
      const color = scene === "opening" ? noiseKey(note).color : scene === "return" ? (note % 2 ? pair.to : pair.from) : NOISE_IDS[note % 4];
      source.buffer = noise.find(entry => entry.id === (color === "grey" ? "white" : color))!.buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = Math.min(ctx.sampleRate * 0.45, 2800 + (note / 127) * 11000);
      filter.Q.value = 0.65;
      if (scene === "opening") filter.frequency.value = Math.min(18500, ctx.sampleRate * .45);
      if (color === "grey") {
        // A perceptual grey: lift low frequencies and soften the ear's most sensitive band.
        const bass = ctx.createBiquadFilter(), presence = ctx.createBiquadFilter();
        bass.type = "lowshelf"; bass.frequency.value = 480; bass.gain.value = 11;
        presence.type = "peaking"; presence.frequency.value = 3100; presence.Q.value = .77; presence.gain.value = -8;
        source.connect(bass).connect(presence).connect(filter);
        nodes.push(bass, presence);
      } else source.connect(filter);
      filter.connect(envelope);
      nodes.push(filter);
      sources.push(source);
      source.start(now, Math.random() * source.buffer.duration);
    } else {
      const osc = ctx.createOscillator();
      const from = scene === "cross" ? CROSS_CUE.morph : 0;
      const to = scene === "cross" ? CROSS_CUE.formed : 1;
      const progress = sceneProgress((score.currentTime - beginsAt) / Math.max(0.001, seconds), from, to);
      const hz = axisPitch(scene, note, progress);
      osc.type = scene === "sphere" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(hz, now);
      if ((scene === "time" || scene === "cross") && progress < 1 && score === ctx) {
        osc.frequency.setValueAtTime(hz, Math.max(now, beginsAt + seconds * from));
        osc.frequency.exponentialRampToValueAtTime(axisPitch(scene, note, 1), beginsAt + seconds * to);
      }
      osc.connect(envelope);
      sources.push(osc);
      osc.start(now);
    }
    const attack = scene === "breath" ? 0.065 : textural ? 0.016 : 0.009;
    const peak = strength * (textural ? 0.65 : scene === "breath" ? 0.105 : 0.235);
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(peak, now + attack);
    envelope.gain.setTargetAtTime(peak * 0.83, now + attack, 0.2);
    sources[0].onended = () => { for (const node of [...sources, ...nodes]) node.disconnect(); };
    held.set(id, immediate => {
      const time = ctx.currentTime;
      const releaseTime = immediate ? 0 : scene === "breath" ? 0.18 : 0.065;
      if (ctx.state !== "closed") {
        if (typeof envelope.gain.cancelAndHoldAtTime === "function") envelope.gain.cancelAndHoldAtTime(time);
        else envelope.gain.cancelScheduledValues(time);
        envelope.gain.linearRampToValueAtTime(0, time + releaseTime);
        for (const source of sources) source.stop(time + releaseTime);
      }
      if (immediate) for (const node of [...sources, ...nodes]) node.disconnect();
    });
    balance();
  }
  function release(id: string, immediate = false) {
    const stop = held.get(id);
    if (!stop) return;
    held.delete(id);
    stop(immediate);
    if (ctx.state !== "closed") balance();
  }
  const releaseAll = () => {
    for (const key of held.keys()) release(key, true);
    for (const hit of tails.splice(0)) hit.close();
  };
  const prefix = (id: string) => `midi:${JSON.stringify(id)}:`;
  const input: PerformanceInput = {
    midiNote(id, channel, note, velocity) {
      const key = prefix(id) + channel + ":" + note;
      if (velocity > 0) play(key, note, velocity); else release(key);
    },
    releaseMidi(id, channel) {
      const device = prefix(id) + (channel === undefined ? "" : channel + ":");
      for (const key of held.keys()) if (key.startsWith(device)) release(key);
    },
    computerNote(key, note, pressed) {
      if (pressed) play(key, note, 0.82); else release(key);
    },
    releaseAll,
  };
  return { input, dispose: () => { releaseAll(); bus.disconnect(); } };
}

export function useEarlyInstrument(scene: EarlyScene | null, output: GainNode | null, beginsAt: number, seconds: number,
  pair: NoisePair, score: AudioContext | null, routing: {current: PerformanceInput | null}, onHit?: (hit: PointStrike) => void) {
  useLayoutEffect(() => {
    if (!scene || !output || !score) return;
    const player = earlyInstrument(scene, output, beginsAt, seconds, pair, score, onHit);
    routing.current = player.input;
    const clear = () => player.input.releaseAll?.();
    const hide = () => { if (document.hidden) clear(); };
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", hide);
      if (routing.current === player.input) routing.current = null;
      player.dispose();
    };
  }, [scene, output, beginsAt, seconds, pair, score, routing, onHit]);
}
