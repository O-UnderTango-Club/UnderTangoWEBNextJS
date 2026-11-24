import { OCTAVE_NOTES, type FrequencyVector } from "./frequency-tuning";
import {
  BREATH_CUE, CROSS_CUE, NEXT_NOTES, NOISE_COLORS, NOISE_CUE, noiseJourney, NOISE_IDS, RETURN_CUE, SCENE_SYMBOLS, SPHERE_CUE,
  type NoiseColor, type NoisePair, type TimedScene,
} from "./scene-cues";

type SceneTiming = Omit<TimedScene, "startsAt">;
type NoiseMix = Partial<Record<NoiseColor, number>>;
type NoiseFrame = { at: number; mix: NoiseMix };

function inverseTransform(real: Float64Array, imaginary: Float64Array) {
  const size = real.length;
  for (let i = 1, reversed = 0; i < size; i++) {
    let bit = size >> 1;
    while (reversed & bit) {
      reversed ^= bit;
      bit >>= 1;
    }
    reversed ^= bit;
    if (i < reversed) {
      [real[i], real[reversed]] = [real[reversed], real[i]];
      [imaginary[i], imaginary[reversed]] = [imaginary[reversed], imaginary[i]];
    }
  }
  for (let span = 2; span <= size; span *= 2) {
    const half = span / 2;
    const stepCos = Math.cos(2 * Math.PI / span);
    const stepSin = Math.sin(2 * Math.PI / span);
    for (let start = 0; start < size; start += span) {
      let cosine = 1, sine = 0;
      for (let offset = 0; offset < half; offset++) {
        const i = start + offset, j = i + half;
        const re = cosine * real[j] - sine * imaginary[j];
        const im = sine * real[j] + cosine * imaginary[j];
        real[j] = real[i] - re;
        imaginary[j] = imaginary[i] - im;
        real[i] += re;
        imaginary[i] += im;
        const nextCosine = cosine * stepCos - sine * stepSin;
        sine = sine * stepCos + cosine * stepSin;
        cosine = nextCosine;
      }
    }
  }
}

const noiseCache = new WeakMap<BaseAudioContext, { id: NoiseColor; buffer: AudioBuffer }[]>();

export function sceneNoiseBuffers(context: BaseAudioContext) {
  const cached = noiseCache.get(context);
  if (cached) return cached;
  const size = 2 ** 17;
  const cosines = new Float64Array(size / 2), sines = new Float64Array(size / 2);
  for (let bin = 1; bin < size / 2; bin++) {
    const phase = Math.random() * 2 * Math.PI;
    cosines[bin] = Math.cos(phase);
    sines[bin] = Math.sin(phase);
  }

  // Shared phases keep the texture continuous as the spectral slope changes.
  const buffers = NOISE_IDS.map((id) => {
    const real = new Float64Array(size), imaginary = new Float64Array(size);
    for (let bin = 1; bin < size / 2; bin++) {
      const hz = Math.max(30, bin * context.sampleRate / size);
      const amplitude = (hz / 500) ** (NOISE_COLORS[id].slope / 2);
      real[bin] = real[size - bin] = amplitude * cosines[bin];
      imaginary[bin] = amplitude * sines[bin];
      imaginary[size - bin] = -imaginary[bin];
    }
    inverseTransform(real, imaginary);

    let squareSum = 0, peak = 0;
    for (const sample of real) {
      squareSum += sample * sample;
      peak = Math.max(peak, Math.abs(sample));
    }
    const scale = Math.min(0.18 / Math.sqrt(squareSum / size), 0.9 / peak);
    const buffer = context.createBuffer(1, size, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = real[i] * scale;
    return { id, buffer };
  });
  noiseCache.set(context, buffers);
  return buffers;
}

function chord(output: GainNode, notes: FrequencyVector, startsAt: number, endsAt: number, shape: (gain: AudioParam) => void) {
  const context = output.context;
  const bus = context.createGain();
  bus.gain.value = 0;
  shape(bus.gain);
  bus.connect(output);
  const balance = [0.58, 0.28, 0.14];
  return notes.map((hz, index) => {
    const voice = context.createOscillator(), partial = context.createGain();
    voice.frequency.setValueAtTime(hz, startsAt);
    partial.gain.value = balance[index];
    voice.connect(partial).connect(bus);
    voice.start(startsAt);
    voice.stop(endsAt);
    voice.onended = () => {
      voice.disconnect();
      partial.disconnect();
      if (index === notes.length - 1) bus.disconnect();
    };
    return voice;
  });
}

export function scheduleContinuationAudio(output: GainNode, timing: SceneTiming[], earliestStart: number, pair: NoisePair) {
  const context = output.context as AudioContext;
  const buffers = timing.some(({ scene }) => scene !== "cross") ? sceneNoiseBuffers(context) : [];
  let position = Math.max(earliestStart, context.currentTime + 0.07);
  const scenes: TimedScene[] = timing.map((scene) => {
    const startsAt = position;
    position += scene.seconds;
    return { ...scene, startsAt };
  });
  const noiseFrames: NoiseFrame[] = [];

  scenes.forEach(({ scene, startsAt, seconds }, index) => {
    const time = (progress: number) => startsAt + seconds * progress;
    const last = index === scenes.length - 1;
    const noise = (progress: number, mix: NoiseMix) => noiseFrames.push({ at: time(progress), mix });

    if (scene === "cross") {
      const releaseAt = last ? time(0.95) : time(1) + scenes[index + 1].seconds * SPHERE_CUE.gather;
      const end = last ? time(1) : releaseAt + 0.24;
      chord(output, OCTAVE_NOTES, startsAt, end, (gain) => {
        gain.setValueAtTime(0, startsAt);
        gain.linearRampToValueAtTime(0.19, startsAt + 0.08);
        gain.setValueAtTime(0.19, releaseAt);
        gain.linearRampToValueAtTime(0, end);
      });
      const moving = chord(output, OCTAVE_NOTES, time(CROSS_CUE.enter), end, (gain) => {
        gain.setValueAtTime(0, time(CROSS_CUE.enter));
        gain.linearRampToValueAtTime(0.16, time(CROSS_CUE.morph));
        gain.setValueAtTime(0.16, releaseAt);
        gain.linearRampToValueAtTime(0, end);
      });
      moving.forEach((voice, i) => {
        voice.frequency.setValueAtTime(OCTAVE_NOTES[i], time(CROSS_CUE.morph));
        voice.frequency.exponentialRampToValueAtTime(NEXT_NOTES[i], time(CROSS_CUE.formed));
      });
    } else if (scene === "sphere") {
      const gainPerObject = 0.30 / Math.sqrt(SCENE_SYMBOLS.length);
      for (const { notes } of SCENE_SYMBOLS) {
        chord(output, notes, time(SPHERE_CUE.gather), time(SPHERE_CUE.white), (gain) => {
          gain.setValueAtTime(0, time(SPHERE_CUE.gather));
          gain.linearRampToValueAtTime(gainPerObject, time(SPHERE_CUE.grouped));
          gain.setValueAtTime(gainPerObject, time(SPHERE_CUE.pullback));
          gain.linearRampToValueAtTime(0, time(SPHERE_CUE.white));
        });
      }
      noise(SPHERE_CUE.pullback, {});
      noise(SPHERE_CUE.white, { white: 1 });
    } else if (scene === "noise") {
      noise(0, { white: 1 });
      noise(NOISE_CUE.spread, { white: 1 });
      noise(NOISE_CUE.spreadOut, { [pair.from]: 1 });
      for (const leg of noiseJourney(pair)) {
        noise(leg.depart, { [leg.from]: 1 });
        noise(leg.arrive, { [leg.to]: 1 });
      }
    } else if (scene === "return") {
      noise(0, { [pair.to]: 1 });
      noise(RETURN_CUE.linked, { [pair.from]: 0.5, [pair.to]: 0.5 });
      noise(RETURN_CUE.gather, { [pair.from]: 0.5, [pair.to]: 0.5 });
      const combined = Object.fromEntries(NOISE_IDS.map((id) => [id, 1 / NOISE_IDS.length]));
      noise(RETURN_CUE.combined, combined);
      noise(RETURN_CUE.white, { white: 1 });
    } else {
      noise(0, { white: 1 });
      noise(BREATH_CUE.revealed, { white: 1 });
      noise(1, {});
    }
    if (last && scene !== "cross" && scene !== "breath") {
      noise(0.97, noiseFrames[noiseFrames.length - 1].mix);
      noise(1, {});
    }
  });

  if (noiseFrames.length > 0) {
    const startsAt = noiseFrames[0].at;
    for (const { id, buffer } of buffers) {
      const source = context.createBufferSource(), gain = context.createGain();
      source.buffer = buffer;
      source.loop = true;
      gain.gain.setValueAtTime(0, startsAt);
      const level = (mix: NoiseMix) => 0.46 * (mix[id] ?? 0);
      const initialLevel = level(noiseFrames[0].mix);
      if (initialLevel) gain.gain.linearRampToValueAtTime(initialLevel, startsAt + 0.03);
      for (const frame of noiseFrames.slice(1)) gain.gain.linearRampToValueAtTime(level(frame.mix), frame.at);
      source.connect(gain).connect(output);
      source.onended = () => { source.disconnect(); gain.disconnect(); };
      source.start(startsAt);
      source.stop(position);
    }
  }

  return scenes;
}
