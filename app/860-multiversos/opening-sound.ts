import { sceneNoiseBuffers } from "./scene-audio";

export const OPENING_QUESTION = "¿Cuál es la entidad mínima capaz de ser imaginada?";
export const NOISE_KEYS = [
  { key: "A", midi: 60, note: "Do", color: "white", label: "Blanco" },
  { key: "S", midi: 62, note: "Re", color: "grey", label: "Gris" },
  { key: "D", midi: 64, note: "Mi", color: "pink", label: "Rosa" },
  { key: "F", midi: 65, note: "Fa", color: "brown", label: "Marrón" },
] as const;
const KEY_COLORS = [0, 0, 1, 1, 2, 3, 3, 0, 1, 2, 2, 3] as const;
export const noiseKey = (note: number) => NOISE_KEYS[KEY_COLORS[note % 12]];

export type PointStrike = { clock: BaseAudioContext; time: number; note: number; frequency: number; velocity: number };
export type StrikeLog = { current: { hits: PointStrike[]; energy: number } };
export const WAVE_SECONDS = 1.8;

export function pointTiming(seconds: number) {
  const gong = Math.min(5.0, seconds * .62);
  return { voice: .30, gong, fade: Math.min(1.32, seconds * .13) };
}

export function collisionTiming(seconds: number) {
  const lead = Math.min(.78, seconds * .06);
  const harmonics = seconds * .55;
  const ramp = seconds * .47 - lead;
  return { lead, ramp, harmonics };
}

// Integral of the same exponential frequency ramp scheduled on the audio thread.
export function collisionBeat(elapsed: number, ramp: number) {
  const t = Math.min(ramp, Math.max(0, elapsed));
  const logRatio = Math.log(111 / 2);
  return 2 * ramp * Math.expm1(logRatio * t / ramp) / logRatio + 111 * Math.max(0, elapsed - ramp);
}

let questionBytes: Promise<ArrayBuffer> | undefined;
export async function loadQuestion(context: AudioContext) {
  questionBytes ??= fetch("/multiversos/pregunta-apertura.wav").then(response => {
    if (!response.ok) throw Error("Falta la voz de la apertura");
    return response.arrayBuffer();
  }).catch(error => { questionBytes = undefined; throw error; });
  return context.decodeAudioData((await questionBytes).slice(0));
}

export function speakQuestion(output: GainNode, buffer: AudioBuffer, start: number, seconds: number) {
  const ctx = output.context, timing = pointTiming(seconds);
  const voice = ctx.createBufferSource(), level = ctx.createGain();
  voice.buffer = buffer;
  voice.playbackRate.value = Math.max(1, buffer.duration / (timing.gong - timing.voice - .30));
  level.gain.value = .66;
  voice.connect(level).connect(output);
  voice.onended = () => { voice.disconnect(); level.disconnect(); };
  voice.start(start + timing.voice);
}

export function whiteOverture(output: GainNode, start: number, seconds: number) {
  const ctx = output.context;
  const white = sceneNoiseBuffers(ctx).find(entry => entry.id === "white")!.buffer;
  const stereo = ctx.createChannelMerger(2), level = ctx.createGain();
  stereo.connect(level).connect(output);
  level.gain.setValueAtTime(0, start);
  level.gain.linearRampToValueAtTime(.065, start + seconds * .18);
  level.gain.linearRampToValueAtTime(.48, start + seconds * .65);
  level.gain.setValueAtTime(.48, start + seconds * .77);
  level.gain.exponentialRampToValueAtTime(.001, start + seconds * .99);
  level.gain.linearRampToValueAtTime(0, start + seconds);
  let ended = 0;
  for (let side = 0; side < 2; side++) {
    const source = ctx.createBufferSource();
    source.buffer = white;
    source.loop = true;
    source.connect(stereo, 0, side);
    source.onended = () => {
      source.disconnect();
      if (++ended === 2) { stereo.disconnect(); level.disconnect(); }
    };
    source.start(start, side * white.duration * .43);
    source.stop(start + seconds);
  }
}

// An early reflection on each side gives the struck skin a room without a long wash over the next attack.
export function strikeMembrane(bus: GainNode, note: number, velocity: number, universal = false) {
  const ctx = bus.context, now = ctx.currentTime;
  const pitch = universal ? 55.5 : 54 * 2 ** ((note % 19) / 20);
  const depth = Math.max(.045, Math.min(1, velocity));
  const pan = ((note % 12) / 11 - .5) * .72;
  const shell = ctx.createGain();
  const center = ctx.createStereoPanner();
  center.pan.value = pan;
  shell.connect(center).connect(bus);
  const nodes: AudioNode[] = [shell, center];
  for (const [delay, gain, side] of [[.061, .21, -.76], [.127, .115, .8]]) {
    const wall = ctx.createDelay(.2), amount = ctx.createGain(), stereo = ctx.createStereoPanner();
    wall.delayTime.value = delay;
    amount.gain.value = gain;
    stereo.pan.value = side;
    shell.connect(wall).connect(amount).connect(stereo).connect(bus);
    nodes.push(wall, amount, stereo);
  }
  const sources: AudioScheduledSourceNode[] = [];
  // Keep the descending fundamental in the centre; only its skin and overtones reach the stereo walls.
  let subLevel: GainNode | undefined;
  if (universal) {
    const sub = ctx.createOscillator();
    subLevel = ctx.createGain();
    sub.frequency.setValueAtTime(pitch * (3.2 + 2 * depth), now);
    sub.frequency.exponentialRampToValueAtTime(111, now + .024);
    sub.frequency.exponentialRampToValueAtTime(pitch, now + .115);
    const gain = subLevel.gain;
    gain.setValueAtTime(.0001, now);
    gain.exponentialRampToValueAtTime(.58 * depth, now + .005);
    gain.exponentialRampToValueAtTime(.29 * depth, now + .18);
    gain.exponentialRampToValueAtTime(.0001, now + 1.32);
    sub.connect(subLevel).connect(bus);
    sub.start(now); sub.stop(now + 1.34);
    nodes.push(subLevel); sources.push(sub);
  }
  const white = ctx.createBufferSource(), band = ctx.createBiquadFilter(), skin = ctx.createGain();
  white.buffer = sceneNoiseBuffers(ctx)[0].buffer;
  band.type = "bandpass";
  band.frequency.value = 1000 + 3300 * depth;
  band.Q.value = .76;
  skin.gain.setValueAtTime(.001, now);
  skin.gain.exponentialRampToValueAtTime((universal ? .32 : .6) * depth, now + .004);
  skin.gain.exponentialRampToValueAtTime(.001, now + .10);
  white.connect(band).connect(skin).connect(shell);
  white.start(now, Math.random() * .4); white.stop(now + .12);
  nodes.push(band, skin); sources.push(white);
  const modes = universal
    ? [[2, .20, 1.12], [3, .11, .75], [4 + (note % 12) / 24, .055, .48], [7.02, .035, .32]]
    : [[1, .40, 1.02], [1.55, .105, .53], [2.39, .067, .31], [3.83, .035, .16]];
  for (const [ratio, gain, decay] of modes) {
    const mode = ctx.createOscillator(), envelope = ctx.createGain();
    const frequency = pitch * ratio;
    mode.frequency.setValueAtTime(frequency * (1.16 + .67 * depth), now);
    mode.frequency.exponentialRampToValueAtTime(frequency, now + .085);
    envelope.gain.setValueAtTime(.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain * depth, now + .008);
    envelope.gain.exponentialRampToValueAtTime(.0001, now + decay);
    mode.connect(envelope).connect(shell);
    mode.start(now);
    // Keep the reflection nodes connected through the final delayed tail.
    mode.stop(now + decay + .15);
    nodes.push(envelope); sources.push(mode);
  }
  let closed = false, remaining = sources.length;
  const close = () => {
    if (closed) return;
    closed = true;
    for (const source of sources) { source.onended = null; source.stop(); source.disconnect(); }
    for (const node of nodes) node.disconnect();
  };
  for (const source of sources) source.onended = () => { if (--remaining === 0) close(); };
  const releaseSub = () => {
    if (closed || !subLevel) return;
    const gain = subLevel.gain, at = ctx.currentTime;
    if (typeof gain.cancelAndHoldAtTime === "function") gain.cancelAndHoldAtTime(at);
    else { const level = gain.value; gain.cancelScheduledValues(at); gain.setValueAtTime(level, at); }
    gain.setTargetAtTime(.0001, at, .021);
  };
  return { close, releaseSub, clock: ctx, time: now, note, frequency: pitch, velocity: depth };
}

export function collideIntoPitch(output: GainNode, start: number, seconds: number) {
  const ctx = output.context, { lead, ramp } = collisionTiming(seconds);
  const first = start + lead, arrival = first + ramp;
  // Two identical contacts per buffer cycle. Their early stereo reflections alternate sides.
  const cycle = ctx.createBuffer(2, ctx.sampleRate | 0, ctx.sampleRate);
  for (let hit = 0; hit < 2; hit++) {
    const offset = Math.floor(hit * cycle.length / 2);
    for (let i = 0; i < Math.floor(ctx.sampleRate * .11); i++) {
      const t = i / ctx.sampleRate;
      const attack = Math.min(1, t / .002);
      const contact = attack * (.74 * Math.sin(2 * Math.PI * 96 * t) * Math.exp(-62 * t)
        + (Math.random() * 2 - 1) * .19 * Math.exp(-156 * t));
      for (let side = 0; side < 2; side++) cycle.getChannelData(side)[offset+i] = contact * (side === hit ? 1 : .68);
    }
  }
  const train = ctx.createBufferSource(), level = ctx.createGain();
  train.buffer = cycle; train.loop = true;
  train.playbackRate.setValueAtTime(1, first);
  train.playbackRate.exponentialRampToValueAtTime(55.5, arrival);
  level.gain.setValueAtTime(.38, first);
  level.gain.setValueAtTime(.38, first + ramp * .55);
  level.gain.exponentialRampToValueAtTime(.001, arrival);
  train.connect(level).connect(output);
  train.onended = () => { train.disconnect(); level.disconnect(); };
  train.start(first); train.stop(arrival + .02);
  const root = ctx.createOscillator(), tone = ctx.createGain();
  root.frequency.setValueAtTime(2, first);
  root.frequency.exponentialRampToValueAtTime(111, arrival);
  tone.gain.setValueAtTime(0, first);
  tone.gain.setValueAtTime(0, first + ramp * .51);
  tone.gain.linearRampToValueAtTime(.12, arrival);
  root.connect(tone).connect(output);
  root.onended = () => { root.disconnect(); tone.disconnect(); };
  root.start(first);
  return root;
}
