import { clipLength } from './timing.mjs';

// Prepare the same musical phrase for the speakers and for the saved film.
// Decoding in an offline context also works before the listener taps for sound.
const trackUrl = '/multiversos/repertorio-trance.mp3';
const musicGain = 0.31;

export function musicLoop(ctx, clip) {
  const rate = clip.sampleRate;
  const overlap = Math.min(Math.round(rate * 0.055), Math.floor(clip.length / 6));
  const period = clip.length - overlap;
  const loop = ctx.createBuffer(clip.numberOfChannels, period, rate);
  for (let channel = 0; channel < clip.numberOfChannels; channel++) {
    const src = clip.getChannelData(channel);
    const dest = loop.getChannelData(channel);
    for (let phase = 0; phase < period; phase++) {
      let sample = src[phase + overlap];
      if (phase >= period - overlap) {
        const j = phase - (period - overlap);
        const mix = (j + 1) / overlap;
        sample += (src[j] - sample) * mix;
      }
      dest[phase] = sample;
    }
  }
  return loop;
}

// Only the film has an ending. The live player keeps the original crossfaded loop.
export function arrangeScore(ctx, loop, duration) {
  const rate = loop.sampleRate,
    length = Math.round((rate * duration) / 1000);
  const score = ctx.createBuffer(loop.numberOfChannels, length, rate);
  for (let channel = 0; channel < loop.numberOfChannels; channel++) {
    const src = loop.getChannelData(channel),
      dest = score.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      dest[i] = src[i % src.length] * Math.min(1, i / (rate * 0.1), (length - 1 - i) / (rate * 0.18));
    }
  }
  return score;
}

function makeNoise(ctx) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.16), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let prior = 0;
  for (let i = 0; i < data.length; i++) {
    prior = (prior + 0.55 * (Math.random() * 2 - 1)) / 1.5;
    data[i] = prior;
  }
  return buffer;
}

function playStep(context, output, noise, t, { x, y, strong, side }) {
  const pan = context.createStereoPanner?.();
  if (pan) {
    pan.pan.value = Math.max(-0.85, Math.min(0.85, (x - 0.5) * 1.7));
    pan.connect(output);
  }
  const out = pan || output;
  const heel = context.createOscillator(),
    thud = context.createGain();
  heel.frequency.setValueAtTime((side > 0 ? 132 : 109) + 20 * (1 - y), t);
  heel.frequency.exponentialRampToValueAtTime(43 + 12 * y, t + 0.12);
  thud.gain.setValueAtTime(0.0001, t);
  thud.gain.exponentialRampToValueAtTime(strong ? 0.27 : 0.16, t + 0.008);
  thud.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  heel.connect(thud);
  thud.connect(out);
  const scrape = context.createBufferSource(),
    tone = context.createBiquadFilter(),
    grit = context.createGain();
  scrape.buffer = noise;
  tone.type = 'bandpass';
  tone.frequency.value = (side > 0 ? 1150 : 870) + 400 * (1 - y);
  tone.Q.value = 0.72;
  grit.gain.setValueAtTime(0.0001, t);
  grit.gain.exponentialRampToValueAtTime(strong ? 0.35 : 0.23, t + 0.025);
  grit.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  scrape.connect(tone);
  tone.connect(grit);
  grit.connect(out);
  heel.onended = () => {
    heel.disconnect();
    thud.disconnect();
  };
  scrape.onended = () => {
    scrape.disconnect();
    tone.disconnect();
    grit.disconnect();
    pan?.disconnect();
  };
  heel.start(t);
  heel.stop(t + 0.16);
  scrape.start(t + 0.012);
  scrape.stop(t + 0.18);
}

function playScore(ctx, output, score, offset, analyser, repeat = false) {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = score;
  source.loop = repeat;
  gain.gain.value = musicGain;
  if (repeat) {
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(musicGain, ctx.currentTime + 0.09);
  }
  if (analyser) {
    source.connect(analyser);
    analyser.connect(gain);
  } else source.connect(gain);
  gain.connect(output);
  source.start(ctx.currentTime, offset);
  return source;
}

export function soundscape(onChange) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  let context, mix, monitor, recording, music, meter, noise;
  let score, loop, pending, request;
  let started = null,
    muted = false,
    failed = false,
    level = 0;
  const steps = [];
  const samples = new Uint8Array(128);

  function play() {
    if (!context || context.state !== 'running' || !score || started === null || music) return;
    // Joining late only unlocks the speakers; the clip has its own complete score.
    const offset = Math.max(0, (performance.now() - started) / 1000);
    meter = context.createAnalyser();
    meter.fftSize = 256;
    music = playScore(context, mix, loop, offset % loop.duration, meter, true);
  }

  function prepare() {
    if (score) return Promise.resolve(score);
    if (pending) return pending;
    const controller = new AbortController();
    request = controller;
    pending = (async () => {
      try {
        const response = await fetch(trackUrl, { signal: controller.signal });
        if (!response.ok || !Offline) throw Error('Música no disponible');
        const decoder = new Offline(1, 1, 48000);
        const decoded = await decoder.decodeAudioData(await response.arrayBuffer());
        if (controller.signal.aborted) return null;
        loop = musicLoop(decoder, decoded);
        score = arrangeScore(decoder, loop, clipLength);
        failed = false;
        play();
        return score;
      } catch {
        if (!controller.signal.aborted) failed = true;
        return null;
      } finally {
        if (request === controller) {
          pending = request = null;
          onChange();
        }
      }
    })();
    return pending;
  }

  function unlock() {
    if (!Audio) return;
    try {
      if (!context) {
        context = new Audio();
        mix = context.createGain();
        monitor = context.createGain();
        monitor.gain.value = muted ? 0 : 1;
        mix.connect(monitor);
        monitor.connect(context.destination);
        if (context.createMediaStreamDestination) {
          recording = context.createMediaStreamDestination();
          mix.connect(recording);
        }
        noise = makeNoise(context);
        context.onstatechange = () => {
          play();
          onChange();
        };
      }
      if (context.state !== 'running')
        context
          .resume()
          .then(play)
          .catch(() => {});
      else play();
      onChange();
    } catch {
      onChange();
    }
  }

  function toggle() {
    if (failed) {
      prepare();
      unlock();
      return;
    }
    muted = context?.state === 'running' && !muted;
    if (monitor) monitor.gain.setTargetAtTime(muted ? 0 : 1, context.currentTime, 0.015);
    unlock();
  }

  function pulse() {
    if (muted || !meter || context?.state !== 'running') return 0;
    meter.getByteTimeDomainData(samples);
    let power = 0;
    for (const s of samples) power += ((s - 128) / 128) ** 2;
    level = level * 0.63 + 0.37 * Math.min(1, Math.sqrt(power / samples.length) * 2.4);
    return level;
  }

  function step(x, y, strong, side) {
    if (started === null) return;
    const event = { time: Math.max(0, (performance.now() - started) / 1000), x, y, strong, side };
    if (event.time < clipLength / 1000) steps.push(event);
    if (context?.state === 'running') playStep(context, mix, noise, context.currentTime, event);
  }

  // Include the decay of footsteps just before each encoded section.
  async function renderClip(rate, duration, from = 0) {
    const preroll = Math.min(from, 200);
    const offset = (from - preroll) / 1000;
    const end = (from + duration) / 1000;
    const events = steps.filter((event) => event.time >= offset && event.time < end);
    const phrase = await prepare();
    if (!phrase) throw Error('Música no disponible');
    const ctx = new Offline(1, Math.round((rate * (preroll + duration)) / 1000), rate);
    playScore(ctx, ctx.destination, phrase, offset);
    const grain = noise || (noise = makeNoise(ctx));
    for (const event of events) playStep(ctx, ctx.destination, grain, event.time - offset, event);
    const buffer = await ctx.startRendering();
    const samples = buffer.getChannelData(0).subarray(Math.round((rate * preroll) / 1000));
    return Int16Array.from(samples, (value) => Math.round(32767 * Math.max(-1, Math.min(1, value))));
  }

  function close() {
    started = null;
    steps.length = 0;
    request?.abort();
    pending = request = null;
    if (music) {
      music.stop();
      music.disconnect();
    }
    recording?.stream.getTracks().forEach((track) => track.stop());
    if (context) {
      context.onstatechange = null;
      if (context.state !== 'closed') context.close().catch(() => {});
    }
    context = mix = monitor = recording = music = noise = meter = null;
    level = 0;
    failed = false;
    onChange();
  }

  return {
    prepare,
    unlock,
    toggle,
    step,
    pulse,
    renderClip,
    close,
    supported: Boolean(Audio),
    start(now) {
      started = now;
      play();
    },
    recordingTrack: () =>
      music && context?.state === 'running' ? recording?.stream.getAudioTracks()[0] : null,
    audible: () => context?.state === 'running' && !muted,
    failed: () => failed,
  };
}
