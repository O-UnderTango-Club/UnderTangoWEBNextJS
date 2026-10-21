"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

type ControlDefinition = {
  number: string;
  name: string;
  role: string;
  unit: string;
};

type MidiInputLike = {
  id: string;
  name?: string;
  onmidimessage: ((event: { data: ArrayLike<number> }) => void) | null;
};

type MidiAccessLike = {
  inputs: {
    values: () => IterableIterator<MidiInputLike>;
    get: (id: string) => MidiInputLike | undefined;
  };
  onstatechange: (() => void) | null;
};

type MidiNavigator = Navigator & {
  requestMIDIAccess?: (options?: { sysex?: boolean }) => Promise<MidiAccessLike>;
};

type SoundEngine = {
  context: AudioContext;
  oscillator: OscillatorNode;
  sub: OscillatorNode;
  noise: AudioBufferSourceNode;
  noiseGain: GainNode;
  oscillatorGain: GainNode;
  subGain: GainNode;
  filter: BiquadFilterNode;
  envelope: GainNode;
  tremolo: GainNode;
  pulseLfo: OscillatorNode;
  pulseDepth: GainNode;
  driftLfo: OscillatorNode;
  driftDepth: GainNode;
  delay: DelayNode;
  delayFeedback: GainNode;
  delayMix: GainNode;
  roomMix: GainNode;
  analyser: AnalyserNode;
  activeNotes: Map<number, number>;
};

const CONTROLS: ControlDefinition[] = [
  { number: "01", name: "NUBE", role: "ruido", unit: "RUIDO BLANCO" },
  { number: "02", name: "VCO", role: "oscilador", unit: "ONDA PRINCIPAL" },
  { number: "03", name: "SUB", role: "gravedad", unit: "SUBGRAVE" },
  { number: "04", name: "CORTE", role: "filtro", unit: "FRECUENCIA" },
  { number: "05", name: "Q", role: "resonancia", unit: "RESONANCIA" },
  { number: "06", name: "PULSO", role: "modulaci�n", unit: "TREMOLACI�N" },
  { number: "07", name: "DERIVA", role: "desafinaci�n", unit: "MOVIMIENTO" },
  { number: "08", name: "ECO", role: "retardo", unit: "DELAY" },
  { number: "09", name: "ESPACIO", role: "reverberaci�n", unit: "ROOM" },
];

const INITIAL_VALUES = [0.26, 0.68, 0.32, 0.58, 0.16, 0.18, 0.14, 0.15, 0.24];
const INITIAL_STEPS = [true, false, true, false, false, true, false, true, false];
const STEP_NOTES = [0, 3, 5, 7, 10, 12, 15, 17, 19];
const PIANO_KEYS = [
  { note: 60, label: "C", black: false },
  { note: 61, label: "C#", black: true },
  { note: 62, label: "D", black: false },
  { note: 63, label: "D#", black: true },
  { note: 64, label: "E", black: false },
  { note: 65, label: "F", black: false },
  { note: 66, label: "F#", black: true },
  { note: 67, label: "G", black: false },
  { note: 68, label: "G#", black: true },
  { note: 69, label: "A", black: false },
  { note: 70, label: "A#", black: true },
  { note: 71, label: "B", black: false },
  { note: 72, label: "C", black: false },
];

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function noteName(note: number) {
  const names = ["DO", "DO?", "RE", "RE?", "MI", "FA", "FA?", "SOL", "SOL?", "LA", "LA?", "SI"];
  return names[note % 12] + (Math.floor(note / 12) - 1);
}

function frequencyForNote(note: number) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function readoutFor(index: number, value: number) {
  if (index === 3) {
    const hz = 120 + value * value * 11_000;
    return hz > 1000 ? (hz / 1000).toFixed(1) + " kHz" : Math.round(hz) + " Hz";
  }
  if (index === 4) return "Q " + (0.4 + value * 11).toFixed(1);
  if (index === 5) return (0.5 + value * 7.5).toFixed(1) + " Hz";
  if (index === 6) return Math.round(value * 24) + " ct";
  return Math.round(value * 100) + "%";
}

function makeRoomImpulse(context: AudioContext) {
  const seconds = 2.1;
  const length = Math.floor(context.sampleRate * seconds);
  const impulse = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let sample = 0; sample < length; sample += 1) {
      const fade = Math.pow(1 - sample / length, 2.8);
      data[sample] = (Math.random() * 2 - 1) * fade * 0.34;
    }
  }
  return impulse;
}

function createSoundEngine(): SoundEngine {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  oscillator.type = "sawtooth";
  oscillator.frequency.value = frequencyForNote(48);

  const sub = context.createOscillator();
  sub.type = "sine";
  sub.frequency.value = frequencyForNote(36);

  const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let sample = 0; sample < noiseData.length; sample += 1) {
    noiseData[sample] = Math.random() * 2 - 1;
  }
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const oscillatorGain = context.createGain();
  const subGain = context.createGain();
  const noiseGain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4200;
  filter.Q.value = 1.5;

  const envelope = context.createGain();
  envelope.gain.value = 0.0001;
  const tremolo = context.createGain();
  tremolo.gain.value = 1;

  const pulseLfo = context.createOscillator();
  pulseLfo.type = "sine";
  pulseLfo.frequency.value = 1.8;
  const pulseDepth = context.createGain();
  pulseDepth.gain.value = 0;
  pulseLfo.connect(pulseDepth);
  pulseDepth.connect(tremolo.gain);

  const driftLfo = context.createOscillator();
  driftLfo.type = "sine";
  driftLfo.frequency.value = 0.2;
  const driftDepth = context.createGain();
  driftDepth.gain.value = 0;
  driftLfo.connect(driftDepth);
  driftDepth.connect(oscillator.detune);

  const dry = context.createGain();
  dry.gain.value = 0.88;

  const delay = context.createDelay(1.5);
  delay.delayTime.value = 0.28;
  const delayFeedback = context.createGain();
  delayFeedback.gain.value = 0.2;
  const delayMix = context.createGain();
  delayMix.gain.value = 0;
  delay.connect(delayFeedback);
  delayFeedback.connect(delay);

  const room = context.createConvolver();
  room.buffer = makeRoomImpulse(context);
  const roomMix = context.createGain();
  roomMix.gain.value = 0;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -15;
  compressor.knee.value = 18;
  compressor.ratio.value = 7;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.22;
  const analyser = context.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.78;
  const output = context.createGain();
  output.gain.value = 0.56;

  oscillator.connect(oscillatorGain);
  sub.connect(subGain);
  noise.connect(noiseGain);
  oscillatorGain.connect(filter);
  subGain.connect(filter);
  noiseGain.connect(filter);
  filter.connect(envelope);
  envelope.connect(tremolo);
  tremolo.connect(dry);
  dry.connect(compressor);
  tremolo.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(compressor);
  tremolo.connect(room);
  room.connect(roomMix);
  roomMix.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(output);
  output.connect(context.destination);

  oscillator.start();
  sub.start();
  noise.start();
  pulseLfo.start();
  driftLfo.start();

  return {
    context,
    oscillator,
    sub,
    noise,
    noiseGain,
    oscillatorGain,
    subGain,
    filter,
    envelope,
    tremolo,
    pulseLfo,
    pulseDepth,
    driftLfo,
    driftDepth,
    delay,
    delayFeedback,
    delayMix,
    roomMix,
    analyser,
    activeNotes: new Map<number, number>(),
  };
}

function smooth(parameter: AudioParam, value: number, context: AudioContext, time = 0.035) {
  const now = context.currentTime;
  parameter.cancelScheduledValues(now);
  parameter.setTargetAtTime(value, now, time);
}

function applyControl(engine: SoundEngine, index: number, value: number, bpm: number) {
  const context = engine.context;
  if (index === 0) smooth(engine.noiseGain.gain, value * 0.34, context);
  if (index === 1) smooth(engine.oscillatorGain.gain, value * 0.72, context);
  if (index === 2) smooth(engine.subGain.gain, value * 0.48, context);
  if (index === 3) smooth(engine.filter.frequency, 120 + value * value * 11_000, context);
  if (index === 4) smooth(engine.filter.Q, 0.4 + value * 11, context);
  if (index === 5) {
    smooth(engine.pulseLfo.frequency, 0.5 + value * 7.5, context);
    smooth(engine.pulseDepth.gain, value * 0.46, context);
  }
  if (index === 6) {
    smooth(engine.driftLfo.frequency, 0.08 + value * 0.72, context);
    smooth(engine.driftDepth.gain, value * 24, context);
  }
  if (index === 7) {
    smooth(engine.delay.delayTime, (60 / bpm) * 0.75, context);
    smooth(engine.delayMix.gain, value * 0.5, context);
    smooth(engine.delayFeedback.gain, 0.12 + value * 0.34, context);
  }
  if (index === 8) smooth(engine.roomMix.gain, value * 0.54, context);
}

export default function Multiversos860Page() {
  const [values, setValues] = useState<number[]>(INITIAL_VALUES);
  const [bpm, setBpm] = useState(106);
  const [steps, setSteps] = useState<boolean[]>(INITIAL_STEPS);
  const [activeStep, setActiveStep] = useState(-1);
  const [isSequencing, setIsSequencing] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [audioMessage, setAudioMessage] = useState("AUDIO EN ESPERA");
  const [midiInputs, setMidiInputs] = useState<Array<{ id: string; name: string }>>([]);
  const [midiInputId, setMidiInputId] = useState("");
  const [midiMessage, setMidiMessage] = useState("MIDI SIN CONECTAR");
  const [midiLearnFor, setMidiLearnFor] = useState<number | null>(null);
  const [ccMap, setCcMap] = useState<Record<number, number>>({});
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [savedMessage, setSavedMessage] = useState("");

  const valuesRef = useRef(values);
  const bpmRef = useRef(bpm);
  const stepsRef = useRef(steps);
  const activeStepRef = useRef(activeStep);
  const engineRef = useRef<SoundEngine | null>(null);
  const midiAccessRef = useRef<MidiAccessLike | null>(null);
  const midiLearnRef = useRef<number | null>(null);
  const ccMapRef = useRef(ccMap);
  const activeNoteRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  valuesRef.current = values;
  bpmRef.current = bpm;
  stepsRef.current = steps;
  activeStepRef.current = activeStep;
  ccMapRef.current = ccMap;
  midiLearnRef.current = midiLearnFor;
  activeNoteRef.current = activeNote;

  const ensureAudio = useCallback(async () => {
    let engine = engineRef.current;
    if (!engine) {
      engine = createSoundEngine();
      engineRef.current = engine;
      valuesRef.current.forEach((value, index) => applyControl(engine as SoundEngine, index, value, bpmRef.current));
    }
    if (engine.context.state !== "running") await engine.context.resume();
    setAudioActive(true);
    setAudioMessage("AUDIO LISTO � VCA ABIERTO AL TECLADO");
  }, []);

  const updateControl = useCallback((index: number, nextValue: number) => {
    const next = clamp(nextValue);
    const updated = valuesRef.current.slice();
    updated[index] = next;
    valuesRef.current = updated;
    setValues(updated);
    const engine = engineRef.current;
    if (engine) applyControl(engine, index, next, bpmRef.current);
  }, []);

  const startNote = useCallback((note: number, velocity = 0.86) => {
    void ensureAudio().then(() => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.activeNotes.set(note, clamp(velocity));
      smooth(engine.oscillator.frequency, frequencyForNote(note), engine.context, 0.016);
      smooth(engine.sub.frequency, frequencyForNote(note - 12), engine.context, 0.018);
      smooth(engine.envelope.gain, 0.38 * clamp(velocity), engine.context, 0.012);
      setActiveNote(note);
    }).catch(() => {
      setAudioMessage("NO SE PUDO INICIAR EL AUDIO");
    });
  }, [ensureAudio]);

  const releaseNote = useCallback((note: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.activeNotes.delete(note);
    const remaining = Array.from(engine.activeNotes.entries());
    if (remaining.length > 0) {
      const [lastNote, velocity] = remaining[remaining.length - 1];
      smooth(engine.oscillator.frequency, frequencyForNote(lastNote), engine.context, 0.025);
      smooth(engine.sub.frequency, frequencyForNote(lastNote - 12), engine.context, 0.025);
      smooth(engine.envelope.gain, 0.38 * velocity, engine.context, 0.02);
      setActiveNote(lastNote);
    } else {
      smooth(engine.envelope.gain, 0.0001, engine.context, 0.1);
      setActiveNote(null);
    }
  }, []);

  const toggleAudio = useCallback(() => {
    const engine = engineRef.current;
    if (engine && engine.context.state === "running") {
      engine.activeNotes.clear();
      smooth(engine.envelope.gain, 0.0001, engine.context, 0.04);
      void engine.context.suspend().then(() => {
        setAudioActive(false);
        setActiveNote(null);
        setAudioMessage("AUDIO EN PAUSA");
      });
      return;
    }
    void ensureAudio().catch(() => setAudioMessage("NO SE PUDO INICIAR EL AUDIO"));
  }, [ensureAudio]);

  const connectMidi = useCallback(async () => {
    if (!window.isSecureContext) {
      setMidiMessage("MIDI NECESITA UNA CONEXI�N HTTPS");
      return;
    }
    const requestAccess = (navigator as MidiNavigator).requestMIDIAccess;
    if (!requestAccess) {
      setMidiMessage("MIDI NO EST� DISPONIBLE EN ESTE NAVEGADOR");
      return;
    }
    try {
      const access = await requestAccess.call(navigator, { sysex: false });
      midiAccessRef.current = access;
      const refreshInputs = () => {
        const inputs = Array.from(access.inputs.values()).map((input) => ({
          id: input.id,
          name: input.name || "Entrada MIDI",
        }));
        setMidiInputs(inputs);
        setMidiInputId((current) => inputs.some((input) => input.id === current) ? current : (inputs[0]?.id || ""));
        setMidiMessage(inputs.length > 0 ? "MIDI LISTO � " + inputs.length + " ENTRADA(S)" : "CONECT� EL CASIO O LOS FADERS USB");
      };
      access.onstatechange = refreshInputs;
      refreshInputs();
    } catch {
      setMidiMessage("PERMISO MIDI NO CONCEDIDO");
    }
  }, []);

  useEffect(() => {
    const input = midiAccessRef.current?.inputs.get(midiInputId);
    if (!input) return;
    const onMessage = (event: { data: ArrayLike<number> }) => {
      const status = event.data[0] || 0;
      const first = event.data[1] || 0;
      const second = event.data[2] || 0;
      const kind = status & 0xf0;
      if (kind === 0x90 && second > 0) {
        startNote(first, second / 127);
        return;
      }
      if (kind === 0x80 || (kind === 0x90 && second === 0)) {
        releaseNote(first);
        return;
      }
      if (kind === 0xb0) {
        const waitingFor = midiLearnRef.current;
        if (waitingFor !== null) {
          setCcMap((current) => {
            const next = { ...current };
            Object.keys(next).forEach((key) => {
              if (next[Number(key)] === first) delete next[Number(key)];
            });
            next[waitingFor] = first;
            ccMapRef.current = next;
            return next;
          });
          midiLearnRef.current = null;
          setMidiLearnFor(null);
          setMidiMessage("FADER " + CONTROLS[waitingFor].number + " VINCULADO � CC " + first);
          return;
        }
        const mappedIndex = Object.keys(ccMapRef.current).find((key) => ccMapRef.current[Number(key)] === first);
        if (mappedIndex !== undefined) updateControl(Number(mappedIndex), second / 127);
      }
    };
    input.onmidimessage = onMessage;
    return () => {
      if (input.onmidimessage === onMessage) input.onmidimessage = null;
    };
  }, [midiInputId, releaseNote, startNote, updateControl]);

  useEffect(() => {
    const keyMap: Record<string, number> = {
      a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66,
      g: 67, y: 68, h: 69, u: 70, j: 71, k: 72,
    };
    const held = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      const key = event.key.toLowerCase();
      const note = keyMap[key];
      if (note === undefined || held.has(key) || event.repeat) return;
      held.add(key);
      startNote(note);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const note = keyMap[key];
      if (note === undefined) return;
      held.delete(key);
      releaseNote(note);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [releaseNote, startNote]);

  useEffect(() => {
    if (!isSequencing) {
      setActiveStep(-1);
      return;
    }
    let cursor = 0;
    const duration = (60_000 / bpmRef.current) / 2;
    const tick = () => {
      const step = cursor % 9;
      setActiveStep(step);
      if (stepsRef.current[step]) {
        const note = 48 + STEP_NOTES[step];
        startNote(note, 0.9);
        window.setTimeout(() => releaseNote(note), Math.max(100, duration * 0.72));
      }
      cursor += 1;
    };
    tick();
    const timer = window.setInterval(tick, duration);
    return () => window.clearInterval(timer);
  }, [bpm, isSequencing, releaseNote, startNote]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    let animation = 0;
    let width = 0;
    let height = 0;
    let pixelRatio = 1;
    const samples = new Uint8Array(1024);
    const stars = Array.from({ length: 116 }, (_, index) => ({
      x: ((index * 0.61803398875) % 1),
      y: ((index * 0.41421356237) % 1),
      size: 0.5 + ((index * 7) % 10) / 10,
      phase: index * 0.71,
    }));
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = bounds.width;
      height = bounds.height;
      canvas.width = Math.max(1, Math.floor(width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };
    const draw = () => {
      const time = performance.now() / 1000;
      const engine = engineRef.current;
      let rms = 0;
      if (engine) {
        engine.analyser.getByteTimeDomainData(samples);
        let total = 0;
        for (let index = 0; index < samples.length; index += 1) {
          const sample = (samples[index] - 128) / 128;
          total += sample * sample;
        }
        rms = Math.sqrt(total / samples.length);
      }
      const currentValues = valuesRef.current;
      const motion = Math.min(1, 0.08 + rms * 7 + currentValues.reduce((sum, item) => sum + item, 0) * 0.028 + (activeNoteRef.current !== null ? 0.15 : 0));
      context.clearRect(0, 0, width, height);
      const backdrop = context.createLinearGradient(0, 0, width, height);
      backdrop.addColorStop(0, "#090b13");
      backdrop.addColorStop(0.48, "#10101d");
      backdrop.addColorStop(1, "#160d17");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, width, height);

      for (const star of stars) {
        const twinkle = 0.2 + (Math.sin(time * 0.8 + star.phase) + 1) * 0.22;
        context.globalAlpha = twinkle;
        context.fillStyle = star.phase % 2 > 1 ? "#d1f6ea" : "#e4c8ea";
        context.beginPath();
        context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      const centerX = width * 0.68;
      const centerY = height * 0.54;
      const base = Math.min(width, height) * 0.2;
      const pulse = 1 + motion * 0.13 + Math.sin(time * 1.7) * 0.018;
      for (let ring = 0; ring < 7; ring += 1) {
        const radiusX = base * (1.12 + ring * 0.29) * pulse;
        const radiusY = base * (0.48 + ring * 0.17) * pulse;
        context.beginPath();
        context.ellipse(centerX, centerY, radiusX, radiusY, -0.31 + ring * 0.025 + Math.sin(time * 0.09) * 0.03, 0, Math.PI * 2);
        context.strokeStyle = ring % 2 === 0 ? "rgba(129, 226, 218, " + (0.18 - ring * 0.012) + ")" : "rgba(220, 109, 185, " + (0.16 - ring * 0.01) + ")";
        context.lineWidth = ring === 0 ? 1.6 : 0.8;
        context.stroke();
      }

      const centerGlow = context.createRadialGradient(centerX, centerY, 2, centerX, centerY, base * (1.65 + motion));
      centerGlow.addColorStop(0, "rgba(245, 192, 125, " + (0.3 + motion * 0.23) + ")");
      centerGlow.addColorStop(0.36, "rgba(181, 91, 190, 0.12)");
      centerGlow.addColorStop(1, "rgba(39, 44, 87, 0)");
      context.fillStyle = centerGlow;
      context.fillRect(centerX - base * 2.2, centerY - base * 2.2, base * 4.4, base * 4.4);

      for (let index = 0; index < 9; index += 1) {
        const value = currentValues[index] || 0;
        const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 9 + time * (index % 2 ? 0.018 : -0.012);
        const orbit = base * (1.35 + index * 0.16 + value * 0.54);
        const x = centerX + Math.cos(angle) * orbit * 1.35;
        const y = centerY + Math.sin(angle) * orbit * 0.58;
        const radius = 3 + value * 8 + motion * 2;
        context.beginPath();
        context.moveTo(centerX, centerY);
        context.lineTo(x, y);
        context.strokeStyle = "rgba(211, 213, 227, " + (0.06 + value * 0.22) + ")";
        context.lineWidth = 0.7 + value * 0.9;
        context.stroke();

        const hue = 168 + index * 19;
        const nodeGlow = context.createRadialGradient(x, y, 1, x, y, radius * 5);
        nodeGlow.addColorStop(0, "hsla(" + hue + ", 88%, 72%, " + (0.86 + value * 0.12) + ")");
        nodeGlow.addColorStop(0.22, "hsla(" + hue + ", 80%, 58%, " + (0.32 + value * 0.28) + ")");
        nodeGlow.addColorStop(1, "hsla(" + hue + ", 75%, 45%, 0)");
        context.fillStyle = nodeGlow;
        context.beginPath();
        context.arc(x, y, radius * 5, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = "#f2e9ef";
        context.beginPath();
        context.arc(x, y, radius * 0.43, 0, Math.PI * 2);
        context.fill();
        context.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
        context.fillStyle = "rgba(235, 231, 241, 0.78)";
        context.fillText("0" + (index + 1), x + 10, y - 8);
      }

      const coreRadius = base * (0.24 + motion * 0.16);
      const core = context.createRadialGradient(centerX - coreRadius * 0.3, centerY - coreRadius * 0.4, 1, centerX, centerY, coreRadius * 1.6);
      core.addColorStop(0, "#fff0cf");
      core.addColorStop(0.24, "#f5b887");
      core.addColorStop(0.61, "rgba(212, 98, 163, 0.82)");
      core.addColorStop(1, "rgba(69, 39, 97, 0.02)");
      context.fillStyle = core;
      context.beginPath();
      context.arc(centerX, centerY, coreRadius * 1.6, 0, Math.PI * 2);
      context.fill();

      const selectedStep = activeStepRef.current;
      if (selectedStep >= 0) {
        const scanAngle = -Math.PI / 2 + selectedStep * (Math.PI * 2 / 9);
        context.beginPath();
        context.arc(centerX, centerY, base * (1.12 + selectedStep * 0.29), scanAngle - 0.13, scanAngle + 0.13);
        context.strokeStyle = "rgba(255, 226, 168, 0.92)";
        context.lineWidth = 3;
        context.shadowBlur = 14;
        context.shadowColor = "#ffd08a";
        context.stroke();
        context.shadowBlur = 0;
      }

      animation = window.requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    draw();
    return () => {
      window.cancelAnimationFrame(animation);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (engine) void engine.context.close();
      const access = midiAccessRef.current;
      if (access) access.onstatechange = null;
    };
  }, []);

  const handleBpmChange = (nextBpm: number) => {
    bpmRef.current = nextBpm;
    setBpm(nextBpm);
    const engine = engineRef.current;
    if (engine) applyControl(engine, 7, valuesRef.current[7], nextBpm);
  };

  const beginMidiLearn = (index: number) => {
    midiLearnRef.current = index;
    setMidiLearnFor(index);
    setMidiMessage("MOV� EL FADER PARA ASIGNAR " + CONTROLS[index].number);
  };

  const toggleStep = (index: number) => {
    setSteps((current) => {
      const next = current.slice();
      next[index] = !next[index];
      stepsRef.current = next;
      return next;
    });
  };

  const saveScene = () => {
    try {
      localStorage.setItem("860-multiversos-escena", JSON.stringify({
        values: valuesRef.current,
        bpm: bpmRef.current,
        steps: stepsRef.current,
      }));
      setSavedMessage("ESCENA GUARDADA");
      window.setTimeout(() => setSavedMessage(""), 1800);
    } catch {
      setSavedMessage("NO SE PUDO GUARDAR");
    }
  };

  const restoreScene = () => {
    try {
      const saved = localStorage.getItem("860-multiversos-escena");
      if (!saved) {
        setSavedMessage("TODAV�A NO HAY ESCENA GUARDADA");
        window.setTimeout(() => setSavedMessage(""), 1800);
        return;
      }
      const scene = JSON.parse(saved) as { values?: number[]; bpm?: number; steps?: boolean[] };
      if (Array.isArray(scene.values) && scene.values.length === 9) {
        scene.values.forEach((value, index) => updateControl(index, clamp(value)));
      }
      if (typeof scene.bpm === "number") handleBpmChange(Math.min(150, Math.max(70, scene.bpm)));
      if (Array.isArray(scene.steps) && scene.steps.length === 9) {
        setSteps(scene.steps);
        stepsRef.current = scene.steps;
      }
      setSavedMessage("ESCENA RECUPERADA");
      window.setTimeout(() => setSavedMessage(""), 1800);
    } catch {
      setSavedMessage("NO SE PUDO RECUPERAR");
    }
  };

  const connectedInput = midiInputs.find((input) => input.id === midiInputId);

  return (
    <main className={styles.console}>
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="UnderTango Club, inicio">
          <span className={styles.brandMark}>�</span>
          <span className={styles.brandText}>UNDER TANGO CLUB<small>LABORATORIO SONORO</small></span>
        </a>
        <div className={styles.topbarRight}>
          <span className={styles.liveDot} />
          <span className={styles.topbarCode}>PROYECTO 860 <b>�</b> EXPERIMENTO 01</span>
        </div>
      </header>

      <div className={styles.world} aria-label="Espacio visual generativo">
        <canvas ref={canvasRef} className={styles.canvas} aria-label="Constelaci�n visual que reacciona al sonido" role="img" />
        <div className={styles.worldShade} />
        <div className={styles.worldTopline}>
          <span>RUIDO <i>+</i> VCO / VCA <i>+</i> FILTRO</span>
          <span className={styles.worldState}><b /> S�NTESIS EN TIEMPO REAL</span>
        </div>
        <div className={styles.worldTitle}>
          <p className={styles.eyebrow}>UNA M�QUINA PARA ABRIR UNIVERSOS</p>
          <h1><span>860</span><br />MULTIVERSOS</h1>
          <p className={styles.worldDescription}>Mov� una frecuencia.<br />Mir� qu� mundo aparece.</p>
          <div className={styles.worldActions}>
            <button type="button" className={styles.audioButton} onClick={toggleAudio}>
              <span className={audioActive ? styles.pauseIcon : styles.playIcon} />
              {audioActive ? "PAUSAR AUDIO" : "INICIAR AUDIO"}
            </button>
            <span className={styles.audioStatus}>{audioMessage}</span>
          </div>
        </div>
        <div className={styles.worldReadout}>
          <div><span>FRASE</span><strong>09</strong></div>
          <div><span>NOTA</span><strong>{activeNote === null ? "-" : noteName(activeNote)}</strong></div>
          <div><span>TEMPO</span><strong>{bpm}<small> BPM</small></strong></div>
        </div>
        <div className={styles.worldBottomline}>
          <span>01-09 / NUEVE DIMENSIONES SONORAS</span>
          <span>VISUAL / RESPUESTA DEL SISTEMA</span>
        </div>
      </div>

      <div className={styles.horizon}>
        <span>LA FRONTERA ENTRE ESCUCHAR Y VER</span>
        <i />
        <span>ARRASTR� � TOC� � CONECT�</span>
      </div>

      <section className={styles.deck} aria-labelledby="deck-heading">
        <div className={styles.deckHeader}>
          <div>
            <p className={styles.eyebrow}>CONTROL DE S�NTESIS <span>�</span> 09 CANALES</p>
            <h2 id="deck-heading">El tablero <em>multiversal.</em></h2>
            <p className={styles.deckIntro}>Cada fader abre una dimensi�n. Arrancamos con la arquitectura que ya probamos y seguimos afinando el mapa.</p>
          </div>
          <div className={styles.sceneActions}>
            <span className={styles.savedMessage} aria-live="polite">{savedMessage}</span>
            <button type="button" className={styles.textButton} onClick={restoreScene}>RECUPERAR</button>
            <button type="button" className={styles.textButton} onClick={saveScene}>GUARDAR ESCENA</button>
          </div>
        </div>

        <div className={styles.channelScroller} aria-label="Nueve faders sonoros">
          <div className={styles.channels}>
            {CONTROLS.map((control, index) => (
              <article className={styles.channel} key={control.number}>
                <div className={styles.channelTop}>
                  <span className={styles.channelNumber}>{control.number}</span>
                  <span className={styles.channelUnit}>{control.unit}</span>
                </div>
                <div className={styles.channelName}>{control.name}</div>
                <label className={styles.fader} aria-label={control.name + " - " + control.role}>
                  <span className={styles.faderTrack} />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={values[index]}
                    onChange={(event) => updateControl(index, Number(event.target.value))}
                    aria-label={"Dimensi�n " + control.number + ": " + control.name}
                  />
                  <span className={styles.faderTicks} aria-hidden="true" />
                </label>
                <div className={styles.channelReadout}>{readoutFor(index, values[index])}</div>
                <div className={styles.channelFooter}>
                  <span>{ccMap[index] === undefined ? "CC -" : "CC " + String(ccMap[index]).padStart(2, "0")}</span>
                  <button
                    type="button"
                    className={midiLearnFor === index ? styles.learnActive : styles.learnButton}
                    onClick={() => beginMidiLearn(index)}
                    aria-label={"Aprender fader MIDI para " + control.name}
                  >
                    {midiLearnFor === index ? "MOV�" : "APRENDER"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={styles.playSurface}>
          <div className={styles.sequencePanel}>
            <div className={styles.sequenceHeader}>
              <div>
                <p className={styles.eyebrow}>RELOJ / FRASE C�CLICA</p>
                <h3>Secuencia <em>de nueve.</em></h3>
              </div>
              <button
                type="button"
                className={isSequencing ? styles.stopButton : styles.sequenceButton}
                onClick={() => {
                  if (isSequencing) setIsSequencing(false);
                  else void ensureAudio().then(() => setIsSequencing(true));
                }}
              >
                {isSequencing ? "DETENER" : "? INICIAR"}
              </button>
            </div>
            <div className={styles.steps} aria-label="Secuenciador de nueve pasos">
              {steps.map((enabled, index) => (
                <button
                  type="button"
                  key={index}
                  className={[styles.step, enabled ? styles.stepEnabled : "", activeStep === index ? styles.stepCurrent : ""].filter(Boolean).join(" ")}
                  onClick={() => toggleStep(index)}
                  aria-label={"Paso " + (index + 1) + (enabled ? ", activo" : ", apagado")}
                  aria-pressed={enabled}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <i />
                </button>
              ))}
            </div>
            <div className={styles.tempoRow}>
              <span>70</span>
              <input
                type="range"
                min="70"
                max="150"
                value={bpm}
                onChange={(event) => handleBpmChange(Number(event.target.value))}
                aria-label="Tempo en pulsos por minuto"
              />
              <span>150</span>
              <strong>{bpm}<small> BPM</small></strong>
            </div>
          </div>

          <div className={styles.keyboardPanel}>
            <div className={styles.keyboardHeader}>
              <div>
                <p className={styles.eyebrow}>ENTRADA EXTERNA</p>
                <h3>Casio <em>/ MIDI.</em></h3>
              </div>
              <button type="button" className={styles.connectButton} onClick={() => void connectMidi()}>
                CONECTAR MIDI
              </button>
            </div>
            <p className={styles.midiMessage} aria-live="polite">{midiMessage}</p>
            {midiInputs.length > 0 && (
              <label className={styles.deviceSelect}>
                ENTRADA
                <select value={midiInputId} onChange={(event) => setMidiInputId(event.target.value)}>
                  {midiInputs.map((input) => <option key={input.id} value={input.id}>{input.name}</option>)}
                </select>
              </label>
            )}
            <div className={styles.keybed} aria-label="Teclado virtual de una octava">
              {PIANO_KEYS.map((key) => (
                <button
                  type="button"
                  key={key.note}
                  className={[
                    styles.pianoKey,
                    key.black ? styles.blackKey : styles.whiteKey,
                    activeNote === key.note ? styles.keyPressed : "",
                  ].filter(Boolean).join(" ")}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    startNote(key.note, 0.9);
                  }}
                  onPointerUp={() => releaseNote(key.note)}
                  onPointerCancel={() => releaseNote(key.note)}
                  onLostPointerCapture={() => releaseNote(key.note)}
                  aria-label={"Tocar " + noteName(key.note)}
                >
                  <span>{key.label}</span>
                </button>
              ))}
            </div>
            <p className={styles.keyboardHint}>Casio por USB MIDI, o prob� con A W S E D F T G Y H U J K.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>� UNDER TANGO CLUB <i>/</i> 860 MULTIVERSOS</span>
        <span>{connectedInput ? "ENTRADA ACTIVA � " + connectedInput.name : "PROTOTIPO SONORO � AUDIO Y VISUALES GENERATIVOS"}</span>
      </footer>
    </main>
  );
}
