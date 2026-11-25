// Output only. Both the heel and the scrape are synthesized locally.
export function footsteps(onChange) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  let context = null, noise = null, muted = false;

  function close() {
    const previous = context;
    context = noise = null;
    if (previous) {
      previous.onstatechange = null;
      if (previous.state !== 'closed') previous.close().catch(() => {});
    }
    onChange();
  }

  function unlock() {
    if (muted || !Audio) return;
    try {
      if (!context) {
        context = new Audio();
        context.onstatechange = onChange;
        const size = Math.ceil(context.sampleRate * .16);
        noise = context.createBuffer(1, size, context.sampleRate);
        const data = noise.getChannelData(0);
        let prior = 0;
        for (let i = 0; i < size; i++) {
          prior = (prior + .55 * (Math.random() * 2 - 1)) / 1.5;
          data[i] = prior;
        }
      }
      if (context.state !== 'running') context.resume().catch(() => {});
      onChange();
    } catch { close(); }
  }

  function toggle() {
    if (context?.state === 'running' && !muted) {
      muted = true;
      close();
    } else {
      muted = false;
      unlock();
    }
  }

  function step(x, y, strong, side) {
    if (!context || context.state !== 'running' || muted) return;
    const t = context.currentTime;
    const pan = context.createStereoPanner?.();
    if (pan) {
      pan.pan.value = Math.max(-.85, Math.min(.85, (x - .5) * 1.7));
      pan.connect(context.destination);
    }
    const out = pan || context.destination;
    const heel = context.createOscillator(), thud = context.createGain();
    heel.frequency.setValueAtTime((side > 0 ? 132 : 109) + 20 * (1 - y), t);
    heel.frequency.exponentialRampToValueAtTime(43 + 12 * y, t + .12);
    thud.gain.setValueAtTime(.0001, t);
    thud.gain.exponentialRampToValueAtTime(strong ? .27 : .16, t + .008);
    thud.gain.exponentialRampToValueAtTime(.0001, t + .16);
    heel.connect(thud); thud.connect(out);
    const scrape = context.createBufferSource(), tone = context.createBiquadFilter(), grit = context.createGain();
    scrape.buffer = noise;
    tone.type = 'bandpass';
    tone.frequency.value = (side > 0 ? 1150 : 870) + 400 * (1 - y);
    tone.Q.value = .72;
    grit.gain.setValueAtTime(.0001, t);
    grit.gain.exponentialRampToValueAtTime(strong ? .35 : .23, t + .025);
    grit.gain.exponentialRampToValueAtTime(.0001, t + .15);
    scrape.connect(tone); tone.connect(grit); grit.connect(out);
    heel.onended = () => { heel.disconnect(); thud.disconnect(); };
    scrape.onended = () => { scrape.disconnect(); tone.disconnect(); grit.disconnect(); pan?.disconnect(); };
    heel.start(t); heel.stop(t + .16);
    scrape.start(t + .012); scrape.stop(t + .18);
  }

  return { unlock, toggle, step, close, supported: Boolean(Audio), audible: () => context?.state === 'running' && !muted };
}
