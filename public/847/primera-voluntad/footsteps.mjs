// The soundtrack is an existing excerpt from the club's show score. Mix it
// with the synthesized footsteps in an output-only Web Audio graph.
const trackUrl = '/multiversos/repertorio-trance.mp3';

function seamlessLoop(ctx, clip) {
  const blend = Math.min(Math.round(clip.sampleRate * 0.055), Math.floor(clip.length / 6));
  const length = clip.length - blend;
  const loop = ctx.createBuffer(clip.numberOfChannels, length, clip.sampleRate);
  for (let channel = 0; channel < clip.numberOfChannels; channel++) {
    const src = clip.getChannelData(channel),
      dest = loop.getChannelData(channel);
    dest.set(src.subarray(blend));
    for (let i = 0; i < blend; i++) {
      const t = (i + 1) / blend;
      dest[length - blend + i] = src[clip.length - blend + i] * (1 - t) + src[i] * t;
    }
  }
  return loop;
}

export function soundscape(onChange) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  let context = null,
    noise = null,
    muted = false,
    playing = false,
    failed = false;
  let request = null,
    music = null,
    meter = null,
    level = 0;
  const samples = new Uint8Array(128);
  function disconnect() {
    if (request) request.abort();
    request = null;
    if (music) {
      music.stop();
      music.disconnect();
      music = null;
    }
    meter = null;
    noise = null;
    level = 0;
    failed = false;
    const prev = context;
    context = null;
    if (prev) {
      prev.onstatechange = null;
      if (prev.state !== 'closed') prev.close().catch(() => {});
    }
    onChange();
  }
  async function startMusic() {
    const ctx = context;
    if (!ctx || !playing || muted || music || request || failed || ctx.state !== 'running') return;
    const pending = new AbortController();
    request = pending;
    try {
      const response = await fetch(trackUrl, { signal: pending.signal });
      if (!response.ok) throw Error('Música no disponible');
      const clip = await ctx.decodeAudioData(await response.arrayBuffer());
      if (context !== ctx || pending.signal.aborted) return;
      const source = ctx.createBufferSource(),
        gain = ctx.createGain();
      source.buffer = seamlessLoop(ctx, clip);
      source.loop = true;
      meter = ctx.createAnalyser();
      meter.fftSize = 256;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.31, ctx.currentTime + 0.65);
      source.connect(meter);
      meter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      music = source;
    } catch {
      if (context === ctx && !pending.signal.aborted) failed = true;
    } finally {
      if (request === pending) {
        request = null;
        onChange();
      }
    }
  }
  function unlock() {
    if (muted || !Audio) return;
    try {
      if (!context) {
        context = new Audio();
        context.onstatechange = () => {
          startMusic();
          onChange();
        };
        noise = context.createBuffer(1, Math.ceil(context.sampleRate * 0.16), context.sampleRate);
        const data = noise.getChannelData(0);
        let prior = 0;
        for (let i = 0; i < data.length; i++) {
          prior = (prior + 0.55 * (Math.random() * 2 - 1)) / 1.5;
          data[i] = prior;
        }
      }
      if (context.state !== 'running')
        context
          .resume()
          .then(startMusic)
          .catch(() => {});
      else startMusic();
      onChange();
    } catch {
      disconnect();
    }
  }
  function toggle() {
    if (failed) {
      failed = false;
      unlock();
      return;
    }
    if (context?.state === 'running' && !muted) {
      muted = true;
      disconnect();
    } else {
      muted = false;
      unlock();
    }
  }
  function pulse() {
    if (!meter || context?.state !== 'running') return 0;
    meter.getByteTimeDomainData(samples);
    let power = 0;
    for (const s of samples) power += ((s - 128) / 128) ** 2;
    level = level * 0.63 + 0.37 * Math.min(1, Math.sqrt(power / samples.length) * 2.4);
    return level;
  }
  function step(x, y, strong, side) {
    if (!context || context.state !== 'running' || muted) return;
    const t = context.currentTime;
    const pan = context.createStereoPanner?.();
    if (pan) {
      pan.pan.value = Math.max(-0.85, Math.min(0.85, (x - 0.5) * 1.7));
      pan.connect(context.destination);
    }
    const out = pan || context.destination;
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

  return {
    unlock,
    toggle,
    step,
    pulse,
    supported: Boolean(Audio),
    start() {
      playing = true;
      unlock();
    },
    close() {
      playing = false;
      disconnect();
    },
    audible: () => context?.state === 'running' && !muted,
    failed: () => failed,
  };
}
