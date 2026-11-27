import { clipLength } from './timing.mjs?v=respuesta';

// Stream the full master for the speakers. Decode its opening locally for the clip.
const trackUrl = './trance-psicomusical.mp3';

const musicGain = 0.31;

export function arrangeScore(ctx, music, duration) {
  const rate = music.sampleRate,
    length = Math.round((rate * duration) / 1000);
  const score = ctx.createBuffer(music.numberOfChannels, length, rate);
  for (let channel = 0; channel < music.numberOfChannels; channel++) {
    const src = music.getChannelData(channel),
      dest = score.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      dest[i] = (src[i] || 0) * Math.min(1, i / (rate * 0.1), (length - 1 - i) / (rate * 0.18));
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

function playScore(ctx, output, score) {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = score;
  gain.gain.value = musicGain;
  source.connect(gain);
  gain.connect(output);
  source.start(ctx.currentTime);
}

export function soundscape(onChange) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  let context, mix, monitor, player, musicNode, meter, noise;
  let score, pending, request, startingPlayer = false, paused = false;
  let started = null,
    muted = false,
    failed = false,
    level = 0;
  const steps = [];
  const samples = new Uint8Array(128);

  let live = false, blocked = false;
  function play() {
    if (paused || !player || !player.paused || startingPlayer || !live) return;
    startingPlayer = true;
    const current = player;
    current.play().catch(error => {
      if (current === player && error.name === 'NotAllowedError') blocked = true;
      if (current === player && error.name !== 'NotAllowedError' && error.name !== 'AbortError') failed = true;
    }).finally(() => {
      if (current === player) {
        startingPlayer = false;
        onChange();
      }
    });
  }

  function prepare() {
    if (score) return Promise.resolve(score);
    if (pending) return pending;
    const controller = new AbortController();
    request = controller;
    pending = (async () => {
      try {
        const response = await fetch('./musica-del-clip.mp3?v=respuesta', { signal: controller.signal });
        if (!response.ok || !Offline) throw Error('Música no disponible');
        const decoder = new Offline(1, 1, 48000);
        const decoded = await decoder.decodeAudioData(await response.arrayBuffer());
        if (controller.signal.aborted) return null;
        score = decoded;
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
    paused = false;
    try {
      if (!context) {
        context = new Audio();
        mix = context.createGain();
        monitor = context.createGain();
        monitor.gain.value = muted ? 0 : 1;
        mix.connect(monitor);
        monitor.connect(context.destination);
        player = document.createElement('audio');
        player.preload = 'auto';
        player.loop = true;
        player.playsInline = true;
        player.src = trackUrl;
        musicNode = context.createMediaElementSource(player);
        meter = context.createAnalyser();
        meter.fftSize = 256;
        const volume = context.createGain();
        volume.gain.value = musicGain;
        musicNode.connect(meter);
        meter.connect(volume);
        volume.connect(mix);
        player.onplaying = () => { blocked = failed = false; onChange(); };
        player.onerror = () => { failed = true; onChange(); };
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
      play();
      onChange();
    } catch {
      onChange();
    }
  }

  function toggle() {
    if (failed) {
      failed = false;
      player?.load();
      prepare();
      unlock();
      return;
    }
    muted = Boolean(context?.state === 'running' && player && !player.paused && !muted);
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

  function step(x, y, strong, side, elapsed) {
    if (started === null) return;
    const event = { time: Math.max(0, elapsed / 1000), x, y, strong, side };
    if (event.time < clipLength / 1000) steps.push(event);
    if (context?.state === 'running') playStep(context, mix, noise, context.currentTime, event);
  }

  async function renderClip(rate, duration) {
    const recordedSteps = steps.slice();
    const phrase = await prepare();
    if (!phrase) throw Error('Música no disponible');
    const ctx = new Offline(1, Math.round(rate * duration / 1000), rate);
    playScore(ctx, ctx.destination, arrangeScore(ctx, phrase, duration));
    const grain = noise || (noise = makeNoise(ctx));
    for (const event of recordedSteps) playStep(ctx, ctx.destination, grain, event.time, event);
    const buffer = await ctx.startRendering();
    const samples = buffer.getChannelData(0);
    return Int16Array.from(samples, (value) => Math.round(32767 * Math.max(-1, Math.min(1, value))));
  }

  function close() {
    live = blocked = false;
    started = null;
    steps.length = 0;
    request?.abort();
    pending = request = null;
    if (player) {
      player.onplaying = player.onerror = null;
      player.pause();
      player.removeAttribute('src');
      player.load();
      musicNode?.disconnect();
    }
    startingPlayer = false;
    if (context) {
      context.onstatechange = null;
      if (context.state !== 'closed') context.close().catch(() => {});
    }
    context = mix = monitor = player = musicNode = noise = meter = null;
    level = 0;
    failed = false;
    onChange();
  }

  return {
    prepare,
    resumeAt(seconds) {
      if (player && player.readyState >= 1) player.currentTime = seconds;
      unlock();
    },
    enableLive() { live = true; unlock(); },
    needsGesture: () => Boolean(live && !muted && !paused && (blocked || context?.state === 'suspended')),
    unlock,
    toggle,
    step,
    pulse,
    renderClip,
    close,
    pause() {
      paused = true;
      player?.pause();
      if (context?.state === 'running') context.suspend().catch(() => {});
    },
    supported: Boolean(Audio),
    start(now) {
      // Each replay begins a new take. Finishing the video never stops the master.
      if (started !== null && player) player.currentTime = 0;
      steps.length = 0;
      started = now;
      play();
    },
    audible: () => Boolean(player && !player.paused && context?.state === 'running' && !muted),
    failed: () => failed,
  };
}
