import type { TimbreScene } from "./extended-scenes";

export function createTimbreRack(output: GainNode) {
  const clock = output.context;
  const input = clock.createGain();
  const limiter = clock.createDynamicsCompressor();
  limiter.threshold.value = -15;
  limiter.knee.value = 16;
  limiter.ratio.value = 5;
  limiter.attack.value = 0.008;
  limiter.release.value = 0.22;
  limiter.connect(output);

  function createEffect(scene: TimbreScene) {
    const nodes: AudioNode[] = [];
    const oscillators: OscillatorNode[] = [];
    const use = <T extends AudioNode>(node: T) => { nodes.push(node); return node; };
    const dry = use(clock.createGain());
    const wet = use(clock.createGain());
    const source = use(clock.createGain());
    wet.gain.value = 0;
    input.connect(dry).connect(limiter);
    input.connect(source);
    wet.connect(limiter);

    const modulate = (target: AudioParam, rate: number, depth: number) => {
      const lfo = use(clock.createOscillator());
      const level = use(clock.createGain());
      lfo.frequency.value = rate;
      level.gain.value = depth;
      lfo.connect(level).connect(target);
      lfo.start();
      oscillators.push(lfo);
    };
    const feedback = (from: AudioNode, to: AudioNode, level: number) => {
      const gain = use(clock.createGain());
      gain.gain.value = level;
      from.connect(gain).connect(to);
    };

    switch (scene) {
      case 20:
      case 22: {
        const harmonics = scene === 20;
        const shaper = use(clock.createWaveShaper());
        const removeDc = use(clock.createBiquadFilter());
        source.gain.value = harmonics ? 1.7 : 3;
        shaper.curve = Float32Array.from({ length: 4097 }, (_, index) => {
          const x = index / 2048 - 1;
          return harmonics ? 0.72 * x + 0.55 * x * x + 0.23 * x * x * x : 0.58 * Math.tanh(2.7 * x);
        });
        shaper.oversample = "2x";
        removeDc.type = "highpass";
        removeDc.frequency.value = 28;
        source.connect(shaper).connect(removeDc).connect(wet);
        break;
      }
      case 21: {
        const filter = use(clock.createBiquadFilter());
        filter.type = "lowpass";
        filter.frequency.value = 580;
        filter.Q.value = 6;
        modulate(filter.frequency, 0.42, 400);
        source.connect(filter).connect(wet);
        break;
      }
      case 23:
      case 24: {
        const amplitude = use(clock.createGain());
        const ring = scene === 24;
        amplitude.gain.value = ring ? 0 : 0.55;
        modulate(amplitude.gain, ring ? 84 : 4.2, ring ? 0.85 : 0.45);
        source.connect(amplitude).connect(wet);
        break;
      }
      case 25:
      case 26:
      case 28: {
        const delay = use(clock.createDelay(1));
        if (scene === 25) {
          delay.delayTime.value = 0.018;
          modulate(delay.delayTime, 0.68, 0.004);
        } else if (scene === 26) {
          delay.delayTime.value = 0.0022;
          feedback(delay, delay, 0.37);
          modulate(delay.delayTime, 0.39, 0.0016);
        } else {
          delay.delayTime.value = 0.29;
          feedback(delay, delay, 0.39);
        }
        source.connect(delay).connect(wet);
        break;
      }
      case 27: {
        let previous: AudioNode = source;
        for (const frequency of [320, 520, 820, 1280]) {
          const filter = use(clock.createBiquadFilter());
          filter.type = "allpass";
          filter.frequency.value = frequency;
          filter.Q.value = 0.9;
          modulate(filter.frequency, 0.43, frequency * 0.58);
          previous.connect(filter);
          previous = filter;
        }
        previous.connect(wet);
        break;
      }
      case 29: {
        const convolver = use(clock.createConvolver());
        const length = Math.floor(clock.sampleRate * 1.85);
        const impulse = clock.createBuffer(2, length, clock.sampleRate);
        let seed = 2026;
        for (let channel = 0; channel < 2; channel++) {
          const samples = impulse.getChannelData(channel);
          for (let i = 0; i < length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            samples[i] = (seed / 0x80000000 - 1) * (1 - i / length) ** 3;
          }
        }
        convolver.buffer = impulse;
        source.connect(convolver).connect(wet);
        break;
      }
      case 31: case 42: case 62: case 45: case 60: case 61: case 30: {
        const left = use(clock.createDelay(1));
        const right = use(clock.createDelay(1));
        const stereo = use(clock.createChannelMerger(2));
        left.delayTime.value = 0.23;
        right.delayTime.value = 0.31;
        source.connect(left);
        feedback(left, right, 0.55);
        feedback(right, left, 0.58);
        left.connect(stereo, 0, 0);
        right.connect(stereo, 0, 1);
        stereo.connect(wet);
        break;
      }
    }

    return {
      scene,
      mix(value: number) {
        const tail = scene >= 28;
        dry.gain.setTargetAtTime(1 - value * (tail ? 0.12 : 0.76), clock.currentTime, 0.018);
        wet.gain.setTargetAtTime(value * (tail ? 0.67 : 0.82), clock.currentTime, 0.018);
      },
      dispose() {
        input.disconnect(dry);
        input.disconnect(source);
        if (clock.state !== "closed") oscillators.forEach((oscillator) => oscillator.stop());
        nodes.forEach((node) => node.disconnect());
      },
    };
  }

  let effect: ReturnType<typeof createEffect> | undefined;
  return {
    input,
    select(scene: TimbreScene, amount: number) {
      if (effect?.scene !== scene) {
        effect?.dispose();
        effect = createEffect(scene);
      }
      effect.mix(amount / 100);
    },
    close() {
      effect?.dispose();
      limiter.disconnect();
    },
  };
}
