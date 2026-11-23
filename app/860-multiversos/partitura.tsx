"use client";

import { useSavedSetting } from "./saved-setting";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";
import { frequencyPoint, OCTAVE_NOTES, ORIGINAL_NOTES, tuningAt, type FrequencyVector } from "./frequency-tuning";
import { scheduleContinuationAudio } from "./scene-audio";
import { CONTINUATION_SCENES, DEFAULT_PAIR, NOISE_COLORS, NOISE_IDS, type ContinuationScene, type NoiseColor, type NoisePair } from "./scene-cues";
import { ContinuationProjection } from "./scene-visuals";
import { FIRST_MIDI_NOTE, NOTE_SCENES, NOTE_SCENE_IDS, isNoteScene, type NoteScene, type PerformanceInput } from "./performance-notes";
import { PerformanceProjection, usePerformanceInput } from "./performance-view";
import { ChordLoopControls, ChordLoopTimeline, useChordLoop } from "./chord-loop-view";
import { EXTENDED_DEFAULT_SECONDS, EXTENDED_SCENES, isTimbreScene, type ExtendedScene } from "./extended-scenes";
import { ExtendedPerformanceControls, ExtendedPerformanceProjection, isPlayableExtendedScene, useExtendedPerformance } from "./extended-performance";
import { ExtendedArt, useExtendedArtAudio } from "./extended-art";
import { EXTENDED_STYLE } from "./extended-style";

type ControlDefinition = {
  number: string;
  name: string;
  role: string;
  unit: string;
};

type MidiInputLike = {
  id: string;
  name?: string;
  state?: string;
  onmidimessage: ((event: { data: ArrayLike<number> }) => void) | null;
};

type CcBinding = { inputId: string; cc: number };
type RecordedPattern = Array<number | null>;
type SceneSnapshot = {
  values?: number[];
  bpm?: number;
  steps?: boolean[];
  recordedNotes?: RecordedPattern;
  hasRecording?: boolean;
};
type ScenePreset = SceneSnapshot & {
  id: string;
  title: string;
  savedAt: number;
  values: number[];
  bpm: number;
  steps: boolean[];
  recordedNotes: RecordedPattern;
  hasRecording: boolean;
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

type MidiConnection = "checking" | "ready" | "blocked" | "unavailable";
type MidiDevice = { id: string; name: string };

type NoteVoice = {
  oscillator: OscillatorNode;
  sub: OscillatorNode;
  oscillatorEnvelope: GainNode;
  subEnvelope: GainNode;
};

type SoundEngine = {
  context: AudioContext;
  noteVoices: Map<number, NoteVoice>;
  sequenceOscillator: OscillatorNode;
  sequenceSub: OscillatorNode;
  noise: AudioBufferSourceNode;
  noiseGain: GainNode;
  oscillatorGain: GainNode;
  subGain: GainNode;
  sequenceOscillatorGain: GainNode;
  sequenceSubGain: GainNode;
  filter: BiquadFilterNode;
  envelope: GainNode;
  sequenceEnvelope: GainNode;
  bassRoomEnvelope: GainNode;
  rhythmBus: GainNode;
  rhythmNoise: AudioBuffer;
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
  sequenceActiveNotes: Map<number, number>;
};

const CONTROLS: ControlDefinition[] = [
  { number: "01", name: "NUBE", role: "ruido", unit: "RUIDO BLANCO" },
  { number: "02", name: "VCO", role: "oscilador", unit: "ONDA PRINCIPAL" },
  { number: "03", name: "SUB", role: "gravedad", unit: "SUBGRAVE" },
  { number: "04", name: "CORTE", role: "filtro", unit: "FRECUENCIA" },
  { number: "05", name: "Q", role: "resonancia", unit: "RESONANCIA" },
  { number: "06", name: "PULSO", role: "modulación", unit: "TREMOLACIÓN" },
  { number: "07", name: "DERIVA", role: "desafinación", unit: "MOVIMIENTO" },
  { number: "08", name: "ECO", role: "retardo", unit: "DELAY" },
  { number: "09", name: "ESPACIO", role: "reverberación", unit: "ROOM" },
];

const INITIAL_VALUES = [0.26, 0.68, 0.44, 0.58, 0.16, 0.18, 0.14, 0.24, 0.42];
// Frase provisional para la presentación: se puede modificar desde el secuenciador.
const INITIAL_STEPS = [true, true, true, false, true, true, true, false, true];
const PHRASES = [
  [0, 7, 12, 15, 7, 10, 14, 19, 15],
  [5, 12, 15, 19, 12, 8, 14, 17, 12],
  [3, 10, 15, 19, 10, 14, 17, 22, 14],
  [0, 12, 7, 15, 10, 14, 19, 17, 7],
];
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
  const names = ["DO", "DO#", "RE", "RE#", "MI", "FA", "FA#", "SOL", "SOL#", "LA", "LA#", "SI"];
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

function isScenePreset(value: unknown): value is ScenePreset {
  if (!value || typeof value !== "object") return false;
  const preset = value as Partial<ScenePreset>;
  return typeof preset.id === "string"
    && typeof preset.title === "string"
    && preset.title.trim().length > 0
    && typeof preset.savedAt === "number"
    && Array.isArray(preset.values) && preset.values.length === 9
    && preset.values.every((entry) => typeof entry === "number" && Number.isFinite(entry))
    && typeof preset.bpm === "number"
    && Array.isArray(preset.steps) && preset.steps.length === 9
    && preset.steps.every((entry) => typeof entry === "boolean")
    && Array.isArray(preset.recordedNotes) && preset.recordedNotes.length === 9
    && typeof preset.hasRecording === "boolean";
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
  const sequenceOscillator = context.createOscillator();
  sequenceOscillator.type = "sawtooth";
  sequenceOscillator.frequency.value = frequencyForNote(48);

  const sequenceSub = context.createOscillator();
  sequenceSub.type = "sine";
  sequenceSub.frequency.value = frequencyForNote(36);

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
  const sequenceOscillatorGain = context.createGain();
  const sequenceSubGain = context.createGain();
  const noiseGain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 4200;
  filter.Q.value = 1.5;

  const envelope = context.createGain();
  envelope.gain.value = 0.0001;
  const sequenceEnvelope = context.createGain();
  sequenceEnvelope.gain.value = 0.0001;
  const bassRoomEnvelope = context.createGain();
  bassRoomEnvelope.gain.value = 0.0001;
  const bassRoomFilter = context.createBiquadFilter();
  bassRoomFilter.type = "lowpass";
  bassRoomFilter.frequency.value = 380;
  const rhythmBus = context.createGain();
  rhythmBus.gain.value = 0.62;
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

  sequenceOscillator.connect(sequenceOscillatorGain);
  sequenceSub.connect(sequenceSubGain);
  noise.connect(noiseGain);
  oscillatorGain.connect(filter);
  subGain.connect(filter);
  noiseGain.connect(envelope);
  envelope.connect(filter);
  sequenceOscillatorGain.connect(sequenceEnvelope);
  sequenceSubGain.connect(sequenceEnvelope);
  sequenceSubGain.connect(bassRoomEnvelope);
  bassRoomEnvelope.connect(bassRoomFilter);
  bassRoomFilter.connect(room);
  sequenceEnvelope.connect(filter);
  filter.connect(tremolo);
  tremolo.connect(dry);
  dry.connect(compressor);
  tremolo.connect(delay);
  delay.connect(delayMix);
  delayMix.connect(compressor);
  tremolo.connect(room);
  room.connect(roomMix);
  roomMix.connect(compressor);
  rhythmBus.connect(compressor);
  compressor.connect(analyser);
  analyser.connect(output);
  output.connect(context.destination);

  sequenceOscillator.start();
  sequenceSub.start();
  noise.start();
  pulseLfo.start();
  driftLfo.start();

  return {
    context,
    noteVoices: new Map<number, NoteVoice>(),
    sequenceOscillator,
    sequenceSub,
    noise,
    noiseGain,
    oscillatorGain,
    subGain,
    sequenceOscillatorGain,
    sequenceSubGain,
    filter,
    envelope,
    sequenceEnvelope,
    bassRoomEnvelope,
    rhythmBus,
    rhythmNoise: noiseBuffer,
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
    sequenceActiveNotes: new Map<number, number>(),
  };
}

function smooth(parameter: AudioParam, value: number, context: AudioContext, time = 0.035) {
  const now = context.currentTime;
  parameter.cancelScheduledValues(now);
  parameter.setTargetAtTime(value, now, time);
}

type FrequencyPoint = [x: number, y: number];

const FREQUENCY_VIEW = { width: 640, height: 360, x: 320, y: 180, yaw: 0.64, tilt: 0.62, scale: 102 };
const FREQUENCY_STOP_YAW = FREQUENCY_VIEW.yaw + 1.72;
const FREQUENCY_TRAIL_TRAVEL = 380;
const FREQUENCY_TRAIL_TURN_SECONDS = 3;

function temporalTrailFrame(progress: number, roll: number) {
  const halfSpan = FREQUENCY_TRAIL_TRAVEL * progress / 2;
  const horizontalFit = (FREQUENCY_VIEW.width / 2 - 28) / (180 + halfSpan * Math.cos(roll));
  const verticalFit = 170 / (170 + halfSpan * Math.sin(roll));
  return { halfSpan, zoom: Math.min(1, horizontalFit, verticalFit) };
}
const FREQUENCY_FORMAT = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 });

const FREQUENCY_AXES: { hz: number; label: string; color: string; direction: FrequencyVector }[] = [
  { hz: 111, label: "X", color: "#345a9b", direction: [1, 0, 0] },
  { hz: 222, label: "Y", color: "#a25d94", direction: [0, 1, 0] },
  { hz: 333, label: "Z", color: "#26857e", direction: [0, 0, 1] },
];
const HARMONIC_CUE = {
  secondGong: 0.12,
  trace222: 0.17,
  crossFormed: 0.35,
  separate: 0.44,
  equation: 0.65,
  equals: 0.69,
  trace333: 0.75,
  result: 0.90,
};

function frequencyProject(x: number, y: number, z: number, yaw: number) {
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const ct = Math.cos(FREQUENCY_VIEW.tilt), st = Math.sin(FREQUENCY_VIEW.tilt);
  const horizontal = x * cs - y * sn, far = x * sn + y * cs;
  const vertical = far * ct + z * st, depth = -far * st + z * ct;
  const scale = FREQUENCY_VIEW.scale * 4.5 / (4.5 - depth);
  return { x: FREQUENCY_VIEW.x + horizontal * scale, y: FREQUENCY_VIEW.y - vertical * scale, z: depth };
}

function frequencyAxis(direction: FrequencyVector, yaw: number) {
  return [-1.38, 1.38].map((end) => frequencyProject(direction[0] * end, direction[1] * end, direction[2] * end, yaw));
}

function FrequencySpace({ opacity, yaw }: { opacity: number; yaw: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const yawRef = useRef(yaw);
  useEffect(() => { yawRef.current = yaw; }, [yaw]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    type Vec = { x: number; y: number; z: number };
    const cross = (a: Vec, b: Vec): Vec => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
    const normalise = (v: Vec): Vec => {
      const length = Math.hypot(v.x, v.y, v.z) || 1;
      return { x: v.x / length, y: v.y / length, z: v.z / length };
    };
    const segments = 180, sides = 8, radius = 0.065;
    const makeRings = (notes: FrequencyVector) => {
      const rings: Vec[][] = [];
      for (let i = 0; i <= segments; i++) {
        const t = i / segments * Math.PI * 2;
        const p = frequencyPoint(t, notes), prev = frequencyPoint(t - 0.002, notes), next = frequencyPoint(t + 0.002, notes);
        const tangent = normalise({ x: next.x - prev.x, y: next.y - prev.y, z: next.z - prev.z });
        const ref = Math.abs(tangent.z) > 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 };
        const n = normalise(cross(tangent, ref)), b = normalise(cross(tangent, n));
        const ring: Vec[] = [];
        for (let j = 0; j < sides; j++) {
          const a = 2 * Math.PI * j / sides, c = Math.cos(a) * radius, d = Math.sin(a) * radius;
          ring.push({ x: p.x + n.x * c + b.x * d, y: p.y + n.y * c + b.y * d, z: p.z + n.z * c + b.z * d });
        }
        rings.push(ring);
      }
      return rings;
    };
    const original = makeRings(ORIGINAL_NOTES);
    const paintTube = (ink: CanvasRenderingContext2D, rings: Vec[][], yaw: number) => {
      const projected = rings.map((ring) => ring.map((v) => frequencyProject(v.x, v.y, v.z, yaw)));
      const faces: Array<{ points: Array<{ x: number; y: number; z: number }>; depth: number; hue: number; light: number }> = [];
      for (let i = 0; i < segments; i++) {
        for (let j = 0; j < sides; j++) {
          const k = (j + 1) % sides;
          const points = [projected[i][j], projected[i + 1][j], projected[i + 1][k], projected[i][k]];
          const depth = points.reduce((sum, p) => sum + p.z, 0) / 4;
          const light = Math.max(28, Math.min(74, 48 + depth * 8 + Math.cos(j * 2 * Math.PI / sides) * 9));
          faces.push({ points, depth, hue: 210 + 50 * i / segments, light });
        }
      }
      faces.sort((a, b) => a.depth - b.depth);
      for (const face of faces) {
        ink.beginPath();
        ink.moveTo(face.points[0].x, face.points[0].y);
        for (let i = 1; i < face.points.length; i++) ink.lineTo(face.points[i].x, face.points[i].y);
        ink.closePath();
        ink.fillStyle = `hsl(${face.hue} 48% ${face.light}%)`;
        ink.fill();
      }
    };

    let frame = 0, last = 0, needsDraw = true;
    let previousYaw = NaN;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      context.setTransform(canvas.width / FREQUENCY_VIEW.width, 0, 0, canvas.height / FREQUENCY_VIEW.height, 0, 0);
      needsDraw = true;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (time: number) => {
      frame = window.requestAnimationFrame(draw);
      const yaw = yawRef.current;
      if (!needsDraw && (time - last < 34 || yaw === previousYaw)) return;
      last = time;
      previousYaw = yaw;
      needsDraw = false;
      context.clearRect(0, 0, FREQUENCY_VIEW.width, FREQUENCY_VIEW.height);
      context.lineWidth = 1;
      for (const axis of FREQUENCY_AXES) {
        const [tail, tip] = frequencyAxis(axis.direction, yaw);
        context.setLineDash([4, 6]);
        context.strokeStyle = axis.color + "77";
        context.beginPath();
        context.moveTo(tail.x, tail.y);
        context.lineTo(tip.x, tip.y);
        context.stroke();
        context.setLineDash([]);
      }

      paintTube(context, original, yaw);
      for (const axis of FREQUENCY_AXES) {
        const [, tip] = frequencyAxis(axis.direction, yaw);
        const left = tip.x < FREQUENCY_VIEW.x;
        const label = `${axis.label} · ${axis.hz} Hz`;
        const x = tip.x + (left ? -8 : 8), y = tip.y - 9;
        context.fillStyle = axis.color;
        context.beginPath();
        context.arc(tip.x, tip.y, 2.5, 0, Math.PI * 2);
        context.fill();
        context.font = "22px Georgia, serif";
        context.textAlign = left ? "right" : "left";
        context.lineWidth = 3;
        context.strokeStyle = "#fff";
        context.strokeText(label, x, y);
        context.fillText(label, x, y);
      }
    };
    frame = window.requestAnimationFrame(draw);
    return () => { window.cancelAnimationFrame(frame); observer.disconnect(); };
  }, []);

  return <div className="zero-frequency-space" style={{ opacity }} aria-hidden={opacity < 0.5}>
    <canvas ref={canvasRef} role="img" aria-label="Figura tridimensional de 111, 222 y 333 Hz en los ejes X, Y y Z" />
  </div>;
}

const TEMPORAL_TRAIL_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_path;
layout(location=1) in vec4 a_sample;
uniform vec4 u_camera;
uniform vec4 u_rotation;
uniform vec2 u_projection;
uniform float u_pivot;
out vec3 v_normal;
out float v_hue;

vec3 rotate(vec3 p) {
  float cr = u_rotation.x, sr = u_rotation.y;
  float cy = u_rotation.z, sy = u_rotation.w;
  vec3 upright = vec3(cr * p.x - sr * p.y, sr * p.x + cr * p.y, p.z);
  return vec3(cy * upright.x + sy * upright.z, upright.y, -sy * upright.x + cy * upright.z);
}

vec3 camera(vec3 p) {
  float yawed = p.x * u_camera.y + p.y * u_camera.x;
  return vec3(p.x * u_camera.x - p.y * u_camera.y,
    yawed * u_camera.z + p.z * u_camera.w, -yawed * u_camera.w + p.z * u_camera.z);
}

void main() {
  vec3 phase = a_sample.xyz * a_path.x + vec3(0.0, 0.7, 1.2);
  vec3 tangent = normalize(a_sample.xyz * cos(phase));
  vec3 ref = abs(tangent.z) > 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  vec3 left = normalize(cross(tangent, ref));
  vec3 normal = left * cos(a_path.y) + cross(tangent, left) * sin(a_path.y);
  vec3 point = camera(sin(phase) + 0.065 * normal);
  // Bake the capture perspective before translating the frame along the time axis.
  point.xy *= 4.5 / (4.5 - point.z);
  point.x += a_sample.w - u_pivot;
  point = rotate(point);
  gl_Position = vec4(point.xy * u_projection, -0.13 * point.z, 1.0);
  v_normal = rotate(camera(normal));
  v_hue = clamp(a_path.x / 6.2831853 * 0.86 + a_sample.w * 0.1, 0.0, 1.0);
}`;

const TEMPORAL_TRAIL_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 v_normal;
in float v_hue;
out vec4 fragColor;

void main() {
  vec3 normal = normalize(v_normal);
  vec3 key = normalize(vec3(-0.55, 0.74, 0.65));
  float diffuse = max(0.0, dot(normal, key));
  float fill = max(0.0, dot(normal, normalize(vec3(0.6, -0.45, 0.35))));
  float shine = pow(max(0.0, dot(normal, normalize(key + vec3(0, 0, 1)))), 28.0);
  vec3 pigment = mix(vec3(0.18, 0.39, 0.69), vec3(0.38, 0.27, 0.68), v_hue);
  fragColor = vec4(pigment * (0.58 + diffuse * 0.57 + fill * 0.15) + vec3(0.21 * shine), 1.0);
}`;

function createTemporalTrailRenderer(canvas: HTMLCanvasElement, sampleCount: number) {
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, depth: true });
  if (!gl) return;
  const program = gl.createProgram();
  const vertex = gl.createShader(gl.VERTEX_SHADER);
  const fragment = gl.createShader(gl.FRAGMENT_SHADER);
  const vao = gl.createVertexArray();
  const points = gl.createBuffer(), indices = gl.createBuffer(), samples = gl.createBuffer();
  if (!program || !vertex || !fragment || !vao || !points || !indices || !samples) return;
  gl.shaderSource(vertex, TEMPORAL_TRAIL_VERTEX_SHADER);
  gl.shaderSource(fragment, TEMPORAL_TRAIL_FRAGMENT_SHADER);
  gl.compileShader(vertex);
  gl.compileShader(fragment);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  const dispose = () => {
    gl.deleteVertexArray(vao);
    gl.deleteBuffer(points);
    gl.deleteBuffer(indices);
    gl.deleteBuffer(samples);
    gl.deleteProgram(program);
  };
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("No se pudo crear la estela tridimensional", gl.getProgramInfoLog(program));
    dispose();
    return;
  }

  const sides = sampleCount > 150 ? 5 : 8;
  // Keep every temporal sample. Dense settings use fewer surface facets per sample.
  const segments = Math.max(48, Math.min(180, Math.floor(210000 / (sampleCount * sides)) - 1));
  const grid = new Float32Array((segments + 1) * sides * 2);
  const triangles = new Uint16Array(segments * sides * 6);
  for (let i = 0; i <= segments; i++) {
    for (let side = 0; side < sides; side++) {
      const j = i * sides + side;
      grid[j * 2] = i / segments * 2 * Math.PI;
      grid[j * 2 + 1] = side / sides * 2 * Math.PI;
      if (i === segments) continue;
      const next = i * sides + (side + 1) % sides;
      triangles.set([j, j + sides, next, next, j + sides, next + sides], j * 6);
    }
  }

  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, points);
  gl.bufferData(gl.ARRAY_BUFFER, grid, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, samples);
  gl.bufferData(gl.ARRAY_BUFFER, (sampleCount + 1) * 16, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0, 0, 0, 0);
  gl.useProgram(program);
  gl.uniform4f(gl.getUniformLocation(program, "u_camera"),
    Math.cos(FREQUENCY_STOP_YAW), Math.sin(FREQUENCY_STOP_YAW), Math.cos(FREQUENCY_VIEW.tilt), Math.sin(FREQUENCY_VIEW.tilt));
  const rotation = gl.getUniformLocation(program, "u_rotation");
  const projection = gl.getUniformLocation(program, "u_projection");
  const pivot = gl.getUniformLocation(program, "u_pivot");

  return {
    upload(instances: Float32Array, from: number, to: number) {
      gl.bindBuffer(gl.ARRAY_BUFFER, samples);
      gl.bufferSubData(gl.ARRAY_BUFFER, from * 16, instances.subarray(from * 4, to * 4));
    },
    paint(count: number, progress: number, lift: number, spin: number) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      const roll = lift * Math.PI / 2;
      const { halfSpan, zoom } = temporalTrailFrame(progress, roll);
      gl.uniform4f(rotation, Math.cos(roll), Math.sin(roll), Math.cos(spin), Math.sin(spin));
      gl.uniform1f(pivot, halfSpan / FREQUENCY_VIEW.scale);
      gl.uniform2f(projection,
        FREQUENCY_VIEW.scale * zoom * 2 / FREQUENCY_VIEW.width,
        FREQUENCY_VIEW.scale * zoom * 2 / FREQUENCY_VIEW.height);
      gl.drawElementsInstanced(gl.TRIANGLES, triangles.length, gl.UNSIGNED_SHORT, 0, count);
    },
    dispose,
  };
}

function TemporalFrequencyTrail({ progress, durationMs, intervalMs, clock, frozenAtEnd = false }: {
  progress: number; durationMs: number; intervalMs: number; clock: AudioContext; frozenAtEnd?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { progressRef.current = progress; }, [progress]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sampleCount = Math.ceil(durationMs / intervalMs) + 1;
    const renderer = createTemporalTrailRenderer(canvas, sampleCount);
    if (!renderer) {
      setUnavailable(true);
      return;
    }
    const instances = new Float32Array((sampleCount + 1) * 4);
    const write = (index: number, phase: number) => {
      const [x, y, z] = tuningAt(phase);
      const shift = FREQUENCY_TRAIL_TRAVEL * phase / FREQUENCY_VIEW.scale;
      instances.set([x / 111, y / 111, z / 111, shift], index * 4);
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, nextStamp = 0, raisedAt: number | null = null;
    let last = -Infinity, previousProgress = -1, previousTime = -1, resized = true;
    const resize = () => {
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * density));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * density));
      resized = true;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    const draw = (now: number) => {
      frame = window.requestAnimationFrame(draw);
      const current = progressRef.current;
      const time = clock.currentTime;
      if (!resized && now - last < 32) return;
      if (!resized && current === previousProgress &&
        (frozenAtEnd || current === 0 || time === previousTime || (current === 1 && reduceMotion.matches))) return;
      resized = false;
      last = now;
      previousProgress = current;
      previousTime = time;
      const elapsed = current * durationMs;
      const firstWrite = nextStamp;
      while (nextStamp < sampleCount) {
        const at = Math.min(durationMs, nextStamp * intervalMs);
        if (at > elapsed) break;
        write(nextStamp++, at / durationMs);
      }
      const sampledAt = Math.min(durationMs, (nextStamp - 1) * intervalMs);
      const live = elapsed - sampledAt > 0.5;
      if (live) write(nextStamp, current);
      const visibleCount = nextStamp + Number(live);
      if (visibleCount > firstWrite) renderer.upload(instances, firstWrite, visibleCount);

      if (current === 1 && raisedAt === null) raisedAt = time;
      const seconds = raisedAt === null ? 0 : time - raisedAt;
      const stationary = frozenAtEnd || reduceMotion.matches;
      const lift = current < 1 ? 0 : stationary ? 1 : smoothSceneLight(seconds / FREQUENCY_TRAIL_TURN_SECONDS);
      const spin = lift * 0.26 + (stationary ? 0 : Math.max(0, seconds - FREQUENCY_TRAIL_TURN_SECONDS) * 0.34);
      renderer.paint(visibleCount, current, lift, spin);
    };
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
    };
  }, [clock, durationMs, frozenAtEnd, intervalMs]);

  const notes = tuningAt(progress).map((value) => FREQUENCY_FORMAT.format(value) + " Hz").join(" · ");
  const { halfSpan, zoom } = temporalTrailFrame(progress, 0);
  const elapsed = Math.floor(progress * durationMs / 1000);
  const axisHalfWidth = halfSpan * zoom * 100 / FREQUENCY_VIEW.width;
  return <div className="zero-frequency-space">
    {unavailable
      ? <><FrequencySpace opacity={1} yaw={FREQUENCY_STOP_YAW} /><p className="zero-trail-fallback" role="status">La estela rotatoria requiere WebGL 2.</p></>
      : <canvas ref={canvasRef} role="img" aria-label="Estela tridimensional de fotogramas opacos que se eleva y gira al completarse" />}
    {!frozenAtEnd && progress < 1 && axisHalfWidth >= 3 && <div className="zero-trail-axis" aria-hidden="true"
      style={{ left: `${50 - axisHalfWidth}%`, width: `${2 * axisHalfWidth}%` }}>
      <span>0 s</span><span>{elapsed} s</span>
    </div>}
    {!frozenAtEnd && <div className="zero-time-caption">
      <span>Cuarta dimensión: el tiempo</span>
      <small>{progress === 1 ? "La en tres octavas · " : ""}{notes}</small>
      <small>{elapsed} / {durationMs / 1000} s · {intervalMs} ms por muestra</small>
    </div>}
  </div>;
}

type HarmonicStage = "vertical" | "harmonics" | "equation" | "spatial" | "space" | "temporal" | "time";

function HarmonicDiagram({ stage, cue, durationMs, sampleIntervalMs }: {
  stage: HarmonicStage; cue: SceneZeroCue | null; durationMs: number; sampleIntervalMs: number;
}) {
  const [clock, setClock] = useState(0);
  useEffect(() => {
    if (!cue || (stage !== "harmonics" && stage !== "spatial" && stage !== "temporal")) return;
    let frame = 0;
    const tick = () => {
      const time = cue.context.currentTime;
      setClock(time);
      if ((time - cue.beginsAt) * 1000 < durationMs) frame = window.requestAnimationFrame(tick);
    };
    tick();
    return () => window.cancelAnimationFrame(frame);
  }, [stage, cue, durationMs]);

  const elapsed = cue ? (clock - cue.beginsAt) * 1000 / durationMs : 0;
  const progress = Math.max(0, Math.min(1, elapsed));
  const equation = stage === "vertical" ? 0 : stage === "harmonics" ? progress : 1;
  const temporal = stage === "temporal" ? progress : stage === "time" ? 1 : null;
  const spatial = stage === "spatial" ? progress : stage === "space" || temporal !== null ? 1 : 0;
  const ease = (value: number, start: number, end: number) => smoothSceneLight((value - start) / (end - start));
  const separate = ease(equation, HARMONIC_CUE.separate, HARMONIC_CUE.equation);
  const converge = ease(spatial, 0.12, 0.60);
  const figure = ease(spatial, 0.60, 1);
  const yaw = FREQUENCY_VIEW.yaw + (FREQUENCY_STOP_YAW - FREQUENCY_VIEW.yaw) * ease(spatial, 0.6, 1);
  const plus = ease(equation, HARMONIC_CUE.separate, HARMONIC_CUE.equation) * (1 - ease(spatial, 0, 0.2));
  const equals = ease(equation, HARMONIC_CUE.equals, HARMONIC_CUE.equals + 0.045) * (1 - ease(spatial, 0, 0.2));
  const trace222 = ease(equation, HARMONIC_CUE.trace222, HARMONIC_CUE.crossFormed);
  const trace333 = ease(equation, HARMONIC_CUE.trace333, HARMONIC_CUE.result);
  const showHarmonics = stage !== "vertical";
  const { x, y } = FREQUENCY_VIEW;
  const half = 68;
  const side = 166;

  const distance = half + (94 - half) * (1 - separate);
  const angle = separate * Math.PI / 2;
  const dx = Math.cos(angle) * distance, dy = -Math.sin(angle) * distance;
  const lines: { hz: number; a: FrequencyPoint; b: FrequencyPoint; label: FrequencyPoint; full: number }[] = [
    { hz: 111, a: [x - side * separate, y + half], b: [x - side * separate, y - half], label: [x - side * separate, y + half + 27], full: 1 },
    { hz: 222, a: [x - dx, y - dy], b: [x + dx, y + dy], label: [x + (distance + 55) * (1 - separate), y + (half + 27) * separate], full: trace222 },
    { hz: 333, a: [x + side, y + half], b: [x + side, y - half], label: [x + side, y + half + 27], full: trace333 },
  ];
  const lerp = (a: FrequencyPoint, b: FrequencyPoint, amount: number): FrequencyPoint =>
    [a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount];

  const diagramLabel = stage === "vertical" ? "Línea vertical de 111 Hz"
    : spatial > 0 ? "Cruce de las tres frecuencias en X, Y y Z"
    : equation >= HARMONIC_CUE.result ? "111 Hz más 222 Hz igual a 333 Hz"
    : "De la línea de 111 Hz a los ejes de 111 y 222 Hz";

  return <div className="zero-harmonic-frame">
    {figure < 1 && <svg className="zero-harmonic-diagram" role="img" aria-label={diagramLabel} viewBox="0 0 640 360"
      style={{ opacity: 1 - figure }} aria-hidden={figure >= 0.5}>
      <g fill="#111" stroke="#111" strokeWidth={2.6} strokeLinecap="round">
        {lines.map(({ hz, a, b, label, full }, index) => {
          const axis = FREQUENCY_AXES[index];
          const [tail, tip] = frequencyAxis(axis.direction, yaw);
          const start = lerp(a, [tail.x, tail.y], converge);
          const end = lerp(b, [tip.x, tip.y], converge);
          const midA = lerp(start, end, full * 0.5);
          const midB = lerp(end, start, full * 0.5);
          const color = converge >= 0.98 ? axis.color : "#111";
          const traced = index === 0 || (showHarmonics && full > 0);
          const firstDot = index === 1 ? 1 : ease(equation, HARMONIC_CUE.trace333 - 0.03, HARMONIC_CUE.trace333);
          const secondDot = index === 1 ? ease(equation, HARMONIC_CUE.secondGong, HARMONIC_CUE.secondGong + 0.018) : firstDot;
          const dotScale = 1 - ease(full, 0.6, 1);
          const text = index === 0 ? 1 : ease(full, 0.2, 0.84);
          return <g key={hz}>
            {traced && <path d={`M ${start.join(" ")} L ${midA.join(" ")} M ${end.join(" ")} L ${midB.join(" ")}`} stroke={color} fill="none" />}
            {showHarmonics && index > 0 && dotScale > 0 && <>
              <circle cx={start[0]} cy={start[1]} r={4.5} opacity={firstDot * dotScale} stroke="none" />
              <circle cx={end[0]} cy={end[1]} r={4.5} opacity={secondDot * dotScale} stroke="none" />
            </>}
            {text > 0 && <text x={label[0]} y={label[1]} opacity={text * (1 - converge)} textAnchor="middle"
              dominantBaseline="middle" stroke="none" fontSize={24} fontFamily="Georgia, serif">{hz} Hz</text>}
          </g>;
        })}
      </g>
      <g fill="#111" fontSize={42} fontFamily="Georgia, serif" textAnchor="middle" dominantBaseline="central">
        {plus > 0 && <text x={x - side / 2} y={y} opacity={plus}>+</text>}
        {equals > 0 && <text x={x + side / 2} y={y} opacity={equals}>=</text>}
      </g>
    </svg>}
    {temporal !== null && cue
      ? <TemporalFrequencyTrail progress={temporal} durationMs={durationMs} intervalMs={sampleIntervalMs} clock={cue.context} />
      : figure > 0 && <FrequencySpace opacity={figure} yaw={yaw} />}
  </div>;
}

type GlyphPoint = [number, number];
type GlyphSegment = GlyphPoint | [number, number, number, number, number, number];

// U+2205 from STIX Two Math (STIX Fonts Project, OFL 1.1), converted to Bézier coordinates.
// https://github.com/stipub/stixfonts/blob/master/source/STIXTwoMath.ufo/glyphs/uni2205.glif
const EMPTY_SET_OUTLINE: GlyphSegment[][] = [
  [
    [722, 597],
    [651, 597],
    [592, 529],
    [533, 570, 467, 597, 390, 597],
    [204, 597, 51, 443, 51, 258],
    [51, 168, 88, 82, 147, 21],
    [58, -81],
    [129, -81],
    [188, -14],
    [247, -57, 316, -81, 390, -81],
    [575, -81, 729, 71, 729, 258],
    [729, 347, 693, 430, 632, 493],
  ],
  [
    [589, 444],
    [635, 393, 661, 328, 661, 259],
    [661, 108, 539, -14, 390, -14],
    [333, -14, 278, 4, 232, 37],
  ],
  [
    [192, 72],
    [145, 121, 119, 188, 119, 259],
    [119, 408, 239, 529, 390, 529],
    [446, 529, 515, 507, 547, 477],
  ],
];

const SCENE_ZERO_DEFAULT_SECONDS = 8;
const SCENE_ONE_DEFAULT_SECONDS = 22;
const SCENE_LINE_DEFAULT_SECONDS = 15;
const SCENE_HARMONIC_DEFAULT_SECONDS = 18;
const SCENE_SPACE_DEFAULT_SECONDS = 7;
const SCENE_TIME_DEFAULT_SECONDS = 16;
const SCENE_TIME_DEFAULT_SAMPLE_MS = 250;
const SCENE_ONE_LIGHT_SHARE = 16 / 22;

function smoothSceneLight(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}
const SCENE_ZERO_MURMUR_ATTACK = Float32Array.from({ length: 129 }, (_, index) =>
  1 - (1 - index / 128) ** 2,
);

function emptySetContours() {
  const position = (x: number, y: number): GlyphPoint => [(x - 390) / 365, (y - 258) / 365];
  return EMPTY_SET_OUTLINE.map(([start, ...segments]) => {
    let [x, y] = start;
    const points = [position(x, y)];
    for (const segment of segments) {
      if (segment.length === 2) {
        [x, y] = segment;
        points.push(position(x, y));
        continue;
      }
      const [cx, cy, dx, dy, endX, endY] = segment;
      for (let step = 1; step <= 24; step++) {
        const t = step / 24, u = 1 - t;
        points.push(position(
          u ** 3 * x + 3 * u * u * t * cx + 3 * u * t * t * dx + t ** 3 * endX,
          u ** 3 * y + 3 * u * u * t * cy + 3 * u * t * t * dy + t ** 3 * endY,
        ));
      }
      x = endX;
      y = endY;
    }
    return points;
  });
}

function emptySetMesh(contours: GlyphPoint[][]) {
  const vertices: number[] = [];
  const halfDepth = 0.145;
  const bevel = 0.012;
  const put = ([x, y]: GlyphPoint, z: number, nx: number, ny: number, nz: number) =>
    vertices.push(x, y, z, nx, ny, nz);
  const quads = [0, 1, 2, 0, 2, 3];
  const caps = contours.map((points) => {
    const normals = points.map(([x, y], index): GlyphPoint => {
      const next = points[(index + 1) % points.length];
      const dx = next[0] - x, dy = next[1] - y;
      const length = Math.hypot(dx, dy);
      return [dy / length, -dx / length];
    });
    const inset = points.map(([x, y], index): GlyphPoint => {
      const [ax, ay] = normals[(index + points.length - 1) % points.length];
      const [bx, by] = normals[index];
      const miter = Math.min(2.5, 1 / Math.max(0.1, 1 + ax * bx + ay * by));
      return [x - bevel * miter * (ax + bx), y - bevel * miter * (ay + by)];
    });
    const smoothNormal = (index: number, edge: number): GlyphPoint => {
      const [x, y] = normals[edge];
      const [nx, ny] = normals[index];
      return x * nx + y * ny > 0.94 ? [x + nx, y + ny] : [x, y];
    };

    points.forEach((point, index) => {
      const next = (index + 1) % points.length;
      const left = smoothNormal((index + points.length - 1) % points.length, index);
      const right = smoothNormal(next, index);
      const outer = [point, points[next]];
      const inner = [inset[index], inset[next]];
      const edgeDepth = halfDepth - bevel;
      for (const face of [0, -1, 1]) {
        for (const vertex of quads) {
          const side = vertex === 0 || vertex === 3 ? 0 : 1;
          const top = vertex < 2 ? 1 : -1;
          const [nx, ny] = side === 0 ? left : right;
          const length = Math.hypot(nx, ny);
          if (face === 0) {
            put(outer[side], top * edgeDepth, nx / length, ny / length, 0);
          } else {
            put(top === 1 ? inner[side] : outer[side], face * (top === 1 ? halfDepth : edgeDepth), nx / length, ny / length, face * 0.88);
          }
        }
      }
    });
    return inset;
  });

  // Tessellate the front and back in horizontal strips, keeping both counters open.
  const levels = [...new Set(caps.flat().map(([, y]) => y))].sort((a, b) => a - b);
  const edges = caps.flatMap((points) => points.map(([x, y], i) => {
    const [nextX, nextY] = points[(i + 1) % points.length];
    return { low: Math.min(y, nextY), high: Math.max(y, nextY), xAt: (value: number) => x + (value - y) * (nextX - x) / (nextY - y) };
  }).filter(({ low, high }) => low < high));
  for (let i = 1; i < levels.length; i++) {
    const low = levels[i - 1], high = levels[i], mid = (low + high) * 0.5;
    const active = edges.filter((edge) => edge.low < mid && mid < edge.high)
      .sort((a, b) => a.xAt(mid) - b.xAt(mid));
    for (let edge = 0; edge + 1 < active.length; edge += 2) {
      const [left, right] = [active[edge], active[edge + 1]];
      const strip: GlyphPoint[] = [[left.xAt(low), low], [right.xAt(low), low], [right.xAt(high), high], [left.xAt(high), high]];
      for (const face of [-1, 1]) {
        for (const vertex of quads) put(strip[vertex], face * halfDepth, 0, 0, face);
      }
    }
  }
  return new Float32Array(vertices);
}

const EMPTY_SET_VERTEX_SHADER = `#version 300 es
precision highp float;
layout(location=0) in vec3 a_position;
layout(location=1) in vec3 a_normal;
uniform vec3 u_rotation;
uniform vec2 u_drag;
uniform vec2 u_projection;
out vec3 v_position;
out vec3 v_normal;
out vec3 v_local;

vec3 rotate(vec3 point, vec3 angles) {
  float cy = cos(angles.x), sy = sin(angles.x);
  float cx = cos(angles.y), sx = sin(angles.y);
  float cz = cos(angles.z), sz = sin(angles.z);
  vec3 yawed = vec3(cy * point.x + sy * point.z, point.y, -sy * point.x + cy * point.z);
  vec3 pitched = vec3(yawed.x, cx * yawed.y - sx * yawed.z, sx * yawed.y + cx * yawed.z);
  return vec3(cz * pitched.x - sz * pitched.y, sz * pitched.x + cz * pitched.y, pitched.z);
}

void main() {
  v_position = rotate(rotate(a_position, u_rotation), vec3(u_drag, 0.0));
  v_normal = rotate(rotate(a_normal, u_rotation), vec3(u_drag, 0.0));
  v_local = a_position;
  float depth = 4.3 - v_position.z;
  gl_Position = vec4(v_position.xy * u_projection, 1.004 * depth - 0.2004, depth);
}`;

const EMPTY_SET_FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec3 v_position;
in vec3 v_normal;
in vec3 v_local;
uniform float u_lamps[8];
uniform float u_background;
uniform float u_emission;
out vec4 fragColor;

const vec3 corners[8] = vec3[8](
  vec3(-1,  1,  1), vec3( 1, -1, -1),
  vec3( 1,  1,  1), vec3(-1, -1, -1),
  vec3(-1,  1, -1), vec3( 1, -1,  1),
  vec3( 1,  1, -1), vec3(-1, -1,  1)
);
const float power[8] = float[8](1.0, 0.75, 0.72, 0.56, 0.88, 0.64, 0.78, 0.53);

void main() {
  vec3 normal = normalize(v_normal);
  vec3 eye = normalize(vec3(0, 0, 4.3) - v_position);
  vec3 radiance = vec3(0.012 * u_background);
  for (int i = 0; i < 8; ++i) {
    vec3 lamp = 2.25 * corners[i];
    vec3 incoming = lamp - v_position;
    float distanceSquared = dot(incoming, incoming);
    vec3 light = normalize(incoming);
    float beam = smoothstep(0.93, 0.997, dot(light, normalize(lamp)));
    float intensity = u_lamps[i] * beam * power[i] * (15.2 / distanceSquared);
    float diffuse = max(0.0, dot(normal, light));
    vec3 halfway = normalize(light + eye);
    float highlight = max(0.0, dot(normal, halfway));
    float gloss = pow(highlight, 17.0) * 0.23 + pow(highlight, 72.0) * 0.31;

    // The spectrum travels across the coating as the viewing angle changes.
    float angle = dot(normal, eye);
    float groove = dot(v_local.xy, normalize(vec2(0.9, 0.42)));
    float phase = 9.0 * (dot(eye, normalize(vec3(-0.51, 0.27, 0.8))) - diffuse)
        + 4.8 * groove + float(i) * 0.95;
    vec3 spectrum = 0.52 + 0.48 * cos(phase + vec3(0.0, 2.094, 4.189));
    float band = pow(max(0.0, cos(phase * 0.38 + float(i) * 0.65)), 6.0);
    float grazing = 0.55 + 0.45 * (1.0 - angle);
    float film = grazing * (0.22 * pow(highlight, 13.0) + 1.25 * band * pow(highlight, 25.0));
    radiance += intensity * diffuse * (vec3(0.29 + gloss) + spectrum * film);
  }
  vec3 mapped = radiance / (1.0 + 0.43 * radiance);
  vec3 surface = pow(clamp(mapped, 0.0, 1.0), vec3(0.4545));
  fragColor = vec4(mix(surface, vec3(1.0), u_emission), 1);
}`;

type SceneZeroRotation = [yaw: number, pitch: number, roll: number];
type SceneZeroDrag = { yaw: number; pitch: number };
type EmptySetLight = { ambient: number; emission: number; wash: number };

function createEmptySetRenderer(canvas: HTMLCanvasElement) {
  const lampLevels = new Float32Array(8);
  const paintBackdrop = ({ ambient, emission, wash }: EmptySetLight) => {
    const spacing = 0.072;
    const ramp = 1 - spacing * (lampLevels.length - 1);
    let total = 0;
    for (let i = 0; i < lampLevels.length; i++) {
      lampLevels[i] = smoothSceneLight((ambient - i * spacing) / ramp);
      total += lampLevels[i];
    }
    const background = Math.max(total / lampLevels.length, wash);
    const gray = Math.round(background * 255);
    const base = `rgb(${gray}, ${gray}, ${gray})`;
    const halo = (0.11 * emission + 0.5 * wash) * (1 - background);
    const radius = Math.round(42 + 75 * wash);
    const gradient = halo > 0.002
      ? `radial-gradient(ellipse at center, rgba(255,255,255,${halo.toFixed(3)}) 0%, transparent ${radius}%), ${base}`
      : base;
    if (canvas.style.background !== gradient) canvas.style.background = gradient;
    return background;
  };

  const contours = emptySetContours();
  const gl = canvas.getContext("webgl2", { alpha: true, antialias: true, depth: true });
  if (!gl) {
    const context = canvas.getContext("2d");
    if (!context) return;
    const outline = new Path2D();
    for (const points of contours) {
      outline.moveTo(points[0][0], -points[0][1]);
      points.slice(1).forEach(([x, y]) => outline.lineTo(x, -y));
      outline.closePath();
    }
    return {
      paint(light: EmptySetLight, [yaw, pitch, roll]: SceneZeroRotation, drag: SceneZeroDrag) {
        const { width, height } = canvas;
        paintBackdrop(light);
        context.resetTransform();
        context.clearRect(0, 0, width, height);
        const scale = Math.min(width, height) * 0.315;
        context.translate(width / 2, height / 2);
        context.rotate(-roll);
        context.scale(scale * Math.cos(yaw + drag.yaw), scale * Math.cos(pitch + drag.pitch));
        const silver = Math.round(188 * light.ambient * (1 - light.emission) + 255 * light.emission);
        context.fillStyle = `rgb(${silver}, ${silver}, ${silver})`;
        context.fill(outline, "evenodd");
      },
      dispose() {},
    };
  }

  const program = gl.createProgram();
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  const buffer = gl.createBuffer();
  const array = gl.createVertexArray();
  if (!program || !vertexShader || !fragmentShader || !buffer || !array) return;
  gl.shaderSource(vertexShader, EMPTY_SET_VERTEX_SHADER);
  gl.shaderSource(fragmentShader, EMPTY_SET_FRAGMENT_SHADER);
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("No se pudo crear la iluminación de la escena 0", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteVertexArray(array);
    return;
  }

  const mesh = emptySetMesh(contours);
  gl.bindVertexArray(array);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.enable(gl.DEPTH_TEST);
  const rotation = gl.getUniformLocation(program, "u_rotation");
  const dragRotation = gl.getUniformLocation(program, "u_drag");
  const projection = gl.getUniformLocation(program, "u_projection");
  const lamps = gl.getUniformLocation(program, "u_lamps[0]");
  const backdrop = gl.getUniformLocation(program, "u_background");
  const emission = gl.getUniformLocation(program, "u_emission");
  gl.clearColor(0, 0, 0, 0);

  return {
    paint(light: EmptySetLight, angles: SceneZeroRotation, drag: SceneZeroDrag) {
      const { width, height } = canvas;
      const aspect = width / height;
      const background = paintBackdrop(light);
      gl.viewport(0, 0, width, height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (light.ambient === 0 && light.emission === 0) return;

      gl.useProgram(program);
      gl.bindVertexArray(array);
      gl.uniform3fv(rotation, angles);
      gl.uniform2f(dragRotation, drag.yaw, drag.pitch);
      gl.uniform2f(projection, 2.65 / Math.max(1, aspect), 2.65 * Math.min(1, aspect));
      gl.uniform1fv(lamps, lampLevels);
      gl.uniform1f(backdrop, background);
      gl.uniform1f(emission, light.emission);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 6);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(array);
      gl.deleteProgram(program);
    },
  };
}

type SceneZeroCue = { context: AudioContext; beginsAt: number };
type SceneZeroPointer = { id: number; x: number; y: number; movedAt: number };

const SCENE_ZERO_DRAG_SCALE = 0.009;
const SCENE_ZERO_COAST_SECONDS = 0.24;
const SCENE_ZERO_MAX_DRAG_SPEED = 3.8;

function EmptySetScene({ durationMs, beacon, cue, paused }: {
  durationMs: number;
  beacon: boolean;
  cue: SceneZeroCue;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orientation = useRef<SceneZeroDrag>({ yaw: 0, pitch: 0 });
  const movementSeconds = useRef(0);
  const phases = useRef<SceneZeroRotation | null>(null);
  const drag = useRef<SceneZeroPointer | null>(null);
  const velocity = useRef<SceneZeroDrag>({ yaw: 0, pitch: 0 });
  const automaticWeight = useRef(1);
  const redrawRef = useRef<() => void>(() => {});

  const rotate = useCallback((yaw: number, pitch: number) => {
    const turn = Math.PI * 2;
    orientation.current.yaw = (orientation.current.yaw + yaw) % turn;
    orientation.current.pitch = (orientation.current.pitch + pitch) % turn;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const renderer = createEmptySetRenderer(canvas);
    if (!renderer) return;

    const randomPhase = () => Math.random() * Math.PI * 2;
    const [phaseY, phaseX, phaseZ] = phases.current ??= [randomPhase(), randomPhase(), randomPhase()];
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;
    let previousFrame: number | null = null;
    const paint = () => {
      const elapsedMs = (cue.context.currentTime - cue.beginsAt) * 1000;
      const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
      const dimming = smoothSceneLight(progress * 2);
      const wash = smoothSceneLight(progress * 2 - 1);
      const light = beacon
        ? { ambient: 1 - dimming, emission: 0.5 * (dimming + wash), wash }
        : { ambient: progress, emission: 0, wash: 0 };
      const seconds = movementSeconds.current;
      // Independent periods make the trajectory vary without jumps or a short repeating cycle.
      const variation = (frequency: number, phase: number) => Math.sin(seconds * frequency + phase) - Math.sin(phase);
      renderer.paint(light, [
        -0.29 + 0.40 * seconds + 0.52 * variation(0.41, phaseY),
        0.13 + 0.23 * seconds + 0.57 * variation(0.53, phaseX),
        0.16 * seconds + 0.41 * variation(0.67, phaseZ),
      ], orientation.current);
      return progress;
    };
    const tick = () => {
      frame = null;
      const now = cue.context.currentTime;
      const autoRotate = !reduceMotion.matches && !drag.current;
      if (autoRotate && previousFrame !== null && now > previousFrame) {
        const elapsed = Math.min(0.06, now - previousFrame);
        const remaining = Math.exp(-elapsed / SCENE_ZERO_COAST_SECONDS);
        // Integrate the fading velocity so the coast is consistent at different frame rates.
        const travel = SCENE_ZERO_COAST_SECONDS * (1 - remaining);
        rotate(velocity.current.yaw * travel, velocity.current.pitch * travel);
        velocity.current.yaw *= remaining;
        velocity.current.pitch *= remaining;
        automaticWeight.current += (1 - remaining) * (1 - automaticWeight.current);
        movementSeconds.current += automaticWeight.current * elapsed;
      }
      previousFrame = now;
      const progress = paint();
      if (progress < 1 || (autoRotate && !beacon)) schedulePaint();
    };
    const schedulePaint = () => {
      if (frame === null) frame = window.requestAnimationFrame(tick);
    };
    const resize = () => {
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * density));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * density));
      paint();
    };
    resize();
    redrawRef.current = schedulePaint;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    reduceMotion.addEventListener("change", schedulePaint);
    schedulePaint();
    return () => {
      observer.disconnect();
      reduceMotion.removeEventListener("change", schedulePaint);
      if (frame !== null) window.cancelAnimationFrame(frame);
      renderer.dispose();
    };
  }, [beacon, durationMs, cue, rotate]);

  return <canvas ref={canvasRef} className="zero-object" role="img" tabIndex={0}
    aria-label="Conjunto vacío tridimensional. Arrastrá o usá las flechas para girarlo."
    onPointerDown={(event) => {
      if (paused || event.button !== 0 || drag.current) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, movedAt: event.timeStamp };
      velocity.current = { yaw: 0, pitch: 0 };
      automaticWeight.current = 0;
    }}
    onPointerMove={(event) => {
      const previous = drag.current;
      if (paused || previous?.id !== event.pointerId) return;
      const yaw = (event.clientX - previous.x) * SCENE_ZERO_DRAG_SCALE;
      const pitch = (event.clientY - previous.y) * SCENE_ZERO_DRAG_SCALE;
      const elapsed = Math.max(0.008, (event.timeStamp - previous.movedAt) / 1000);
      const speed = Math.hypot(yaw, pitch) / elapsed;
      const scale = Math.min(1, SCENE_ZERO_MAX_DRAG_SPEED / Math.max(speed, 0.001)) / elapsed;
      const response = 1 - Math.exp(-elapsed / 0.04);
      velocity.current.yaw += response * (yaw * scale - velocity.current.yaw);
      velocity.current.pitch += response * (pitch * scale - velocity.current.pitch);
      rotate(yaw, pitch);
      drag.current = { id: previous.id, x: event.clientX, y: event.clientY, movedAt: event.timeStamp };
      redrawRef.current();
    }}
    onPointerCancel={(event) => {
      if (drag.current?.id === event.pointerId) velocity.current = { yaw: 0, pitch: 0 };
    }}
    onLostPointerCapture={(event) => {
      const previous = drag.current;
      if (previous?.id !== event.pointerId) return;
      // An impulse dissipates if the pointer pauses before the button is released.
      const idle = Math.max(0, event.timeStamp - previous.movedAt);
      const retained = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : Math.exp(-idle / 85);
      velocity.current.yaw *= retained;
      velocity.current.pitch *= retained;
      drag.current = null;
      redrawRef.current();
    }}
    onKeyDown={(event) => {
      const direction: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
      };
      const step = direction[event.key];
      if (paused || !step) return;
      event.preventDefault();
      rotate(step[0] * .14, step[1] * .14);
      redrawRef.current();
    }} />;
}

function playSceneOneGong(context: AudioContext, output: AudioNode, beginsAt: number) {
  const bus = context.createGain();
  const room = context.createConvolver();
  const wet = context.createGain();
  room.buffer = makeRoomImpulse(context);
  wet.gain.value = 0.38;
  bus.connect(output);
  bus.connect(room).connect(wet).connect(output);

  // The low modes share the sea's 55 Hz reference, with inharmonic metal above them.
  const modes = [
    { hz: 110, peak: 0.105, attack: 0.045, decay: 8.1, pan: 0 },
    { hz: 164.6, peak: 0.054, attack: 0.16, decay: 6.8, pan: -0.27 },
    { hz: 218.2, peak: 0.037, attack: 0.027, decay: 5.5, pan: 0.32 },
    { hz: 295, peak: 0.027, attack: 0.012, decay: 4.2, pan: -0.5 },
    { hz: 417.7, peak: 0.018, attack: 0.008, decay: 3.6, pan: 0.48 },
    { hz: 592, peak: 0.012, attack: 0.006, decay: 2.5, pan: -0.37 },
    { hz: 788.5, peak: 0.009, attack: 0.005, decay: 1.3, pan: 0.42 },
  ];

  for (const { hz, peak, attack, decay, pan } of modes) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const stereo = context.createStereoPanner();
    stereo.pan.value = pan;
    oscillator.frequency.setValueAtTime(hz * 1.012, beginsAt);
    oscillator.frequency.setTargetAtTime(hz, beginsAt, 0.22);
    envelope.gain.setValueAtTime(0.0001, beginsAt);
    envelope.gain.exponentialRampToValueAtTime(peak, beginsAt + attack);
    envelope.gain.exponentialRampToValueAtTime(peak * 0.28, beginsAt + decay * 0.32);
    envelope.gain.exponentialRampToValueAtTime(0.0001, beginsAt + decay);
    oscillator.connect(envelope).connect(stereo).connect(bus);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      stereo.disconnect();
    };
    oscillator.start(beginsAt);
    oscillator.stop(beginsAt + decay + 0.05);
  }

  return () => {
    bus.disconnect();
    room.disconnect();
    wet.disconnect();
  };
}

function playModuleGong(context: AudioContext, output: AudioNode, time: number, root: number, strength = 1) {
  const partials = [1, 1.5, 2.08, 2.76, 4.1];
  const peaks = [0.16, 0.085, 0.045, 0.025, 0.012];
  partials.forEach((partial, index) => {
    const oscillator = context.createOscillator(), envelope = context.createGain();
    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = root * partial;
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(peaks[index] * strength, time + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 4.5 - index * 0.45);
    oscillator.connect(envelope).connect(output);
    oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(time);
    oscillator.stop(time + 4.6);
  });
}

type NumberedScene = NoteScene | ExtendedScene;
type ModuleZeroScene = "opening" | "beacon" | "line" | "harmonics" | "space" | "time" | ContinuationScene | NumberedScene;

const isContinuationScene = (stage: ModuleZeroScene): stage is ContinuationScene =>
  CONTINUATION_SCENES.some(({ mode }) => mode === stage);

const MODULE_ZERO_SCENE_BY_STAGE = {
  ready: null,
  preparing: null,
  opening: "opening",
  beacon: "beacon",
  question: "beacon",
  one: "beacon",
  two: "line",
  multiplying: "line",
  vertical: "line",
  harmonics: "harmonics",
  equation: "harmonics",
  spatial: "space",
  space: "space",
  temporal: "time",
  time: "time",
  cross: "cross",
  sphere: "sphere",
  noise: "noise",
  return: "return",
  breath: "breath",
  "breath-hold": "breath",
  ten: "ten",
  eleven: "eleven",
  twelve: "twelve",
  thirteen: "thirteen",
  fourteen: "fourteen",
} satisfies Record<string, ModuleZeroScene | null>;

const MIDI_PITCH_NAMES = ["Do", "Do♯", "Re", "Mi♭", "Mi", "Fa", "Fa♯", "Sol", "La♭", "La", "Si♭", "Si"];

function ModuleZero({ pianoRouting, connectMidi, midiConnection, midiInputs }: {
  pianoRouting: { current: PerformanceInput | null };
  connectMidi: () => Promise<void>;
  midiConnection: MidiConnection;
  midiInputs: MidiDevice[];
}) {
  const [stage, setStage] = useState<keyof typeof MODULE_ZERO_SCENE_BY_STAGE | ExtendedScene>("ready");
  const activeScene = typeof stage === "number" ? stage : MODULE_ZERO_SCENE_BY_STAGE[stage];
  const noteScene = typeof activeScene === "string" && isNoteScene(activeScene) ? activeScene : null;
  const extendedScene = typeof stage === "number" ? stage : null;
  const extendedPlaying = isPlayableExtendedScene(extendedScene);
  const [showSubtitles, setShowSubtitles] = useSavedSetting("showSubtitles", false);
  const [masterVolume, setMasterVolume] = useSavedSetting("masterVolume", 100);
  const [durationSeconds, setDurationSeconds] = useSavedSetting("durationSeconds", SCENE_ZERO_DEFAULT_SECONDS);
  const [oneSeconds, setOneSeconds] = useSavedSetting("oneSeconds", SCENE_ONE_DEFAULT_SECONDS);
  const [lineSeconds, setLineSeconds] = useSavedSetting("lineSeconds", SCENE_LINE_DEFAULT_SECONDS);
  const [harmonicSeconds, setHarmonicSeconds] = useSavedSetting("harmonicSeconds", SCENE_HARMONIC_DEFAULT_SECONDS);
  const [spaceSeconds, setSpaceSeconds] = useSavedSetting("spaceSeconds", SCENE_SPACE_DEFAULT_SECONDS);
  const [timeSeconds, setTimeSeconds] = useSavedSetting("timeSeconds", SCENE_TIME_DEFAULT_SECONDS);
  const [restSeconds, setRestSeconds] = useSavedSetting("restSeconds", 4);
  const [noteSeconds, setNoteSeconds] = useSavedSetting<Record<NoteScene, number>>("noteSeconds", { ten: 12, eleven: 12, twelve: 12, thirteen: 12, fourteen: 0 });
  const [extendedSeconds, setExtendedSeconds] = useSavedSetting("extendedSeconds", EXTENDED_DEFAULT_SECONDS);
  const [splitNote, setSplitNote] = useSavedSetting("splitNote", FIRST_MIDI_NOTE);
  const [learningSplit, setLearningSplit] = useState(false);
  const [continuationSeconds, setContinuationSeconds] = useSavedSetting<Record<ContinuationScene, number>>("continuationSeconds", () =>
    Object.fromEntries(CONTINUATION_SCENES.map(({ mode, seconds }) => [mode, seconds])) as Record<ContinuationScene, number>);
  const [noisePair, setNoisePair] = useSavedSetting<NoisePair>("noisePair", DEFAULT_PAIR);
  const [playingNoisePair, setPlayingNoisePair] = useState<NoisePair>(DEFAULT_PAIR);
  const [timeSamplingMs, setTimeSamplingMs] = useSavedSetting("timeSamplingMs", SCENE_TIME_DEFAULT_SAMPLE_MS);
  const [activeSamplingMs, setActiveSamplingMs] = useState(SCENE_TIME_DEFAULT_SAMPLE_MS);
  const [previewMode, setPreviewMode] = useState<ModuleZeroScene | null>(null);
  const [paused, setPaused] = useState(false);
  const [transportBusy, setTransportBusy] = useState(false);
  const [cue, setCue] = useState<SceneZeroCue | null>(null);
  const [activeDurationMs, setActiveDurationMs] = useState(SCENE_ZERO_DEFAULT_SECONDS * 1000);
  const [pulseCount, setPulseCount] = useState(0);
  const [pulseRate, setPulseRate] = useState(2);
  const audioRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const activeSceneRef = useRef<HTMLDivElement | null>(null);
  const outputRef = useRef<GainNode | null>(null);
  const masterVolumeRef = useRef(masterVolume);
  const audibleVolumeRef = useRef(masterVolume);
  const timersRef = useRef(new Set<number>());
  const waitingCues = useRef(new Set<() => void>());
  const pausedRef = useRef(false);
  const runRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const learningSplitRef = useRef(false);
  const learnSplit = useCallback((note: number) => {
    if (!learningSplitRef.current || note < 1 || note > 127) return false;
    learningSplitRef.current = false;
    setLearningSplit(false);
    setSplitNote(note);
    return true;
  }, []);
  const chordLoop = useChordLoop(noteScene === "fourteen" ? cue : null, outputRef);
  const extended = useExtendedPerformance(extendedScene, cue?.context ?? null, outputRef, pianoRouting, pausedRef);
  const directionSeconds = extendedScene ? extendedSeconds[extendedScene] || (EXTENDED_DEFAULT_SECONDS[extendedScene] || 16) : 0;
  useExtendedArtAudio(extendedScene, cue?.context ?? null, cue?.beginsAt ?? 0, directionSeconds, extended.a4, outputRef);
  const noteInput = usePerformanceInput({
    scene: noteScene, ownsInput: stage !== "ready" && !extendedPlaying, splitNote, learnSplit,
    clock: cue?.context ?? null, outputRef, pausedRef, routing: pianoRouting, onStrike: chordLoop.strike,
  });
  const enterNumberedScene = useCallback((mode: NumberedScene, context: AudioContext, asPreview: boolean) => {
    setCue({ context, beginsAt: context.currentTime });
    setPreviewMode(asPreview ? mode : null);
    setStage(mode);
  }, []);
  const nextTimedScene = extendedScene ? EXTENDED_SCENES[EXTENDED_SCENES.indexOf(extendedScene) + 1]
    : noteScene === "fourteen" ? 15 : noteScene ? NOTE_SCENES[noteScene].next
      : stage === "breath-hold" && restSeconds > 0 ? "ten" : null;
  const nextAfterSeconds = extendedScene ? extendedSeconds[extendedScene] : noteScene ? noteSeconds[noteScene] : activeDurationMs / 1000 + restSeconds;

  useEffect(() => {
    if (noteScene !== "eleven") return;
    return () => {
      learningSplitRef.current = false;
      setLearningSplit(false);
    };
  }, [noteScene]);

  const stop = useCallback(() => {
    runRef.current++;
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current.clear();
    waitingCues.current.clear();
    const context = audioRef.current;
    audioRef.current = null;
    outputRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }, []);

  const reset = useCallback(() => {
    stop();
    setCue(null);
    pausedRef.current = false;
    setPaused(false);
    setTransportBusy(false);
    setPreviewMode(null);
    setStage("ready");
  }, [stop]);

  useEffect(() => {
    if ((!nextTimedScene && extendedScene !== 45) || nextAfterSeconds === 0 || !cue || paused) return;
    const deadline = cue.beginsAt + nextAfterSeconds;
    let timer: number | undefined;
    const advance = () => {
      if (pausedRef.current || audioRef.current !== cue.context) return;
      const remaining = deadline - cue.context.currentTime;
      if (remaining > 0.005) timer = window.setTimeout(advance, Math.max(8, remaining * 1000));
      else if (nextTimedScene) enterNumberedScene(nextTimedScene, cue.context, previewMode !== null);
      else reset();
    };
    advance();
    return () => window.clearTimeout(timer);
  }, [cue, enterNumberedScene, extendedScene, nextAfterSeconds, nextTimedScene, paused, previewMode, reset]);

  useEffect(() => {
    window.addEventListener("multiversos-instrument-start", reset);
    return () => {
      window.removeEventListener("multiversos-instrument-start", reset);
      stop();
    };
  }, [reset, stop]);

  useEffect(() => {
    const settings = settingsRef.current;
    const current = activeSceneRef.current;
    if (!activeScene || !settings || !current) return;

    const revealScene = () => {
      const bounds = settings.getBoundingClientRect();
      const row = current.getBoundingClientRect();
      const inset = 10;
      const top = bounds.top + settings.clientTop + inset;
      const bottom = top + settings.clientHeight - 2 * inset;
      if (row.top >= top && row.bottom <= bottom) return;

      const alignTop = row.top < top || row.height > bottom - top;
      const offset = alignTop ? row.top - top : row.bottom - bottom;
      if (Math.abs(offset) < 1) return;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      settings.scrollTo({ top: settings.scrollTop + offset, behavior: reduceMotion ? "auto" : "smooth" });
    };

    const observer = new ResizeObserver(revealScene);
    observer.observe(settings);
    return () => observer.disconnect();
  }, [activeScene]);

  const changeMasterVolume = (volume: number) => {
    masterVolumeRef.current = volume;
    if (volume > 0) audibleVolumeRef.current = volume;
    setMasterVolume(volume);

    const output = outputRef.current;
    if (!output) return;
    const now = output.context.currentTime;
    const gain = output.gain;
    const previousGain = gain.value;
    gain.cancelScheduledValues(now);
    if (output.context.state === "running") {
      gain.setValueAtTime(previousGain, now);
      gain.linearRampToValueAtTime(volume / 100, now + 0.025);
    } else {
      gain.setValueAtTime(volume / 100, now);
    }
  };

  const changePaused = async (next: boolean) => {
    const context = audioRef.current;
    if (!context || pausedRef.current === next || transportBusy) return;
    const run = runRef.current;
    pausedRef.current = next;
    setTransportBusy(true);
    try {
      if (next) {
        noteInput.releaseAll();
        pianoRouting.current?.releaseAll?.();
        await context.suspend();
      }
      else await context.resume();
      if (run === runRef.current) setPaused(next);
    } catch {
      if (run === runRef.current) pausedRef.current = !next;
    } finally {
      if (run === runRef.current) {
        setTransportBusy(false);
        if (!pausedRef.current) {
          const ready = [...waitingCues.current];
          waitingCues.current.clear();
          ready.forEach((cue) => cue());
        }
      }
    }
  };

  const start = async (mode: ModuleZeroScene = "opening", previewOnly = false, startPaused = false) => {
    stop();
    const run = runRef.current;
    pausedRef.current = startPaused;
    setPaused(startPaused);
    setTransportBusy(false);
    setCue(null);
    const openingMs = durationSeconds * 1000;
    const oneMs = oneSeconds * 1000;
    const lightMs = oneMs * SCENE_ONE_LIGHT_SHARE;
    const oneStartsAt = mode === "opening" ? openingMs : 0;
    const questionMs = oneStartsAt + lightMs;
    const pointMs = oneStartsAt + oneMs;
    const lineStartsAt = mode === "line" ? 0 : pointMs + 2500;
    const gongLead = lineSeconds / 5;
    const rampSeconds = lineSeconds - gongLead;
    const fadeOutAt = lineStartsAt / 1000 + gongLead / 3;
    const showBeacon = mode === "beacon" || mode === "opening";
    const waveSeconds = lineStartsAt / 1000 + gongLead + 0.5;
    setPreviewMode(previewOnly ? mode : null);
    setStage("preparing");
    try {
      const context = new AudioContext();
      audioRef.current = context;
      const masterOutput = context.createGain();
      masterOutput.gain.value = masterVolumeRef.current / 100;
      masterOutput.connect(context.destination);
      outputRef.current = masterOutput;
      if (startPaused) await context.suspend();
      else await context.resume();
      if (run !== runRef.current || audioRef.current !== context) return;

      if (typeof mode === "number" || isNoteScene(mode)) {
        enterNumberedScene(mode, context, previewOnly);
        return;
      }

      const atTime = (time: number, action: (time: number) => void) => {
        const schedule = (delay: number) => {
          const timer = window.setTimeout(() => {
            timersRef.current.delete(timer);
            onTime();
          }, delay);
          timersRef.current.add(timer);
        };
        const onTime = () => {
          if (run !== runRef.current) return;
          if (pausedRef.current) {
            waitingCues.current.add(onTime);
            return;
          }
          const remaining = time - context.currentTime;
          if (remaining > 0.005) schedule(Math.max(8, remaining * 1000));
          else action(time);
        };
        onTime();
      };
      const showAt = (scene: ModuleZeroScene, time: number, show: (time: number) => void) => {
        if (mode === scene) show(time);
        else atTime(time, show);
      };
      const playContinuation = (first: ContinuationScene, time: number) => {
        const index = CONTINUATION_SCENES.findIndex(({ mode }) => mode === first);
        const timing = CONTINUATION_SCENES.slice(index).map(({ mode }) => ({
          scene: mode, seconds: continuationSeconds[mode],
        }));
        const pair = previewOnly && first === "noise" ? noisePair : DEFAULT_PAIR;
        setPlayingNoisePair(pair);
        const scenes = scheduleContinuationAudio(masterOutput, timing, time, pair);
        for (const { scene, startsAt, seconds } of scenes) {
          showAt(scene, startsAt, () => {
            setCue({ context, beginsAt: startsAt });
            setActiveDurationMs(seconds * 1000);
            setStage(scene);
          });
          if (scene === "breath") atTime(startsAt + seconds, () => setStage("breath-hold"));
        }
      };
      const createChordBus = () => {
        const output = context.createGain();
        output.gain.value = 0.8;
        output.connect(masterOutput);
        return output;
      };
      const addTone = (bus: GainNode, frequency: number, time: number, attack: number) => {
        const oscillator = context.createOscillator(), gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12, time + attack);
        oscillator.connect(gain).connect(bus);
        oscillator.start(time);
        return oscillator;
      };
      const enterDiagram = (stage: "harmonics" | "spatial" | "temporal", time: number, seconds: number) => {
        setCue({ context, beginsAt: time });
        setActiveDurationMs(seconds * 1000);
        setStage(stage);
      };
      const playTime = (bus: GainNode, time: number, voices: OscillatorNode[]) => {
        voices.forEach((voice, index) => {
          voice.frequency.setValueAtTime(ORIGINAL_NOTES[index], time);
          voice.frequency.exponentialRampToValueAtTime(OCTAVE_NOTES[index], time + timeSeconds);
        });
        showAt("time", time, () => {
          setActiveSamplingMs(timeSamplingMs);
          enterDiagram("temporal", time, timeSeconds);
        });
        atTime(time + timeSeconds, () => setStage("time"));
        {
          const continuationAt = time + timeSeconds + FREQUENCY_TRAIL_TURN_SECONDS;
          const end = continuationAt + 0.10;
          bus.gain.setValueAtTime(bus.gain.value, continuationAt);
          bus.gain.linearRampToValueAtTime(0, end);
          voices.forEach((voice) => voice.stop(end));
          playContinuation("cross", continuationAt);
        }
      };
      const playSpatial = (bus: GainNode, time: number, voices: OscillatorNode[]) => {
        showAt("space", time, () => enterDiagram("spatial", time, spaceSeconds));
        playTime(bus, time + spaceSeconds, voices);
      };
      const playHarmonics = (bus: GainNode, time: number, root: OscillatorNode) => {
        playModuleGong(context, masterOutput, time, 330, 0.58);
        playModuleGong(context, masterOutput, time + harmonicSeconds * HARMONIC_CUE.secondGong, 444, 0.55);
        const second = addTone(bus, 222, time + harmonicSeconds * HARMONIC_CUE.trace222, harmonicSeconds * (HARMONIC_CUE.crossFormed - HARMONIC_CUE.trace222));
        const third = addTone(bus, 333, time + harmonicSeconds * HARMONIC_CUE.trace333, harmonicSeconds * (HARMONIC_CUE.result - HARMONIC_CUE.trace333));
        showAt("harmonics", time, () => enterDiagram("harmonics", time, harmonicSeconds));
        playSpatial(bus, time + harmonicSeconds, [root, second, third]);
      };

      if (isContinuationScene(mode)) {
        setActiveSamplingMs(timeSamplingMs);
        playContinuation(mode, context.currentTime);
        return;
      }

      if (mode === "harmonics" || mode === "space" || mode === "time") {
        const time = context.currentTime + 0.07;
        const bus = createChordBus();
        if (mode === "harmonics") playHarmonics(bus, time, addTone(bus, 111, time, 0.28));
        else {
          const voices = ORIGINAL_NOTES.map((hz) => addTone(bus, hz, time, 0.28));
          if (mode === "space") playSpatial(bus, time, voices);
          else playTime(bus, time, voices);
        }
        return;
      }

      const render = new OfflineAudioContext(2, Math.ceil(context.sampleRate * waveSeconds), context.sampleRate);
      const buffer = render.createBuffer(2, render.sampleRate * 4, render.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const samples = buffer.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
      }
      const noise = render.createBufferSource(); noise.buffer = buffer; noise.loop = true;
      const filter = render.createBiquadFilter(); filter.type = "lowpass"; filter.frequency.value = 430;
      const breath = render.createGain(); breath.gain.value = 0.07;
      const drift = render.createOscillator(); drift.frequency.value = 0.09;
      const depth = render.createGain(); depth.gain.value = 0.035;
      drift.connect(depth); depth.connect(breath.gain);
      const tone = render.createOscillator(); tone.type = "sine"; tone.frequency.value = 55;
      const toneGain = render.createGain(); toneGain.gain.value = 0.035;
      const master = render.createGain(); master.gain.value = 0.55;
      noise.connect(filter); filter.connect(breath); breath.connect(master);
      tone.connect(toneGain); toneGain.connect(master); master.connect(render.destination);
      noise.start(); tone.start(); drift.start();
      const forward = await render.startRendering();
      if (run !== runRef.current || audioRef.current !== context) return;
      // Mantener el murmullo audible frente a los gongs sin alterar su textura.
      let sumSquares = 0, peak = 0;
      for (let channel = 0; channel < forward.numberOfChannels; channel++) {
        const samples = forward.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) {
          const sample = samples[i];
          sumSquares += sample * sample;
          peak = Math.max(peak, Math.abs(sample));
        }
      }
      const rms = Math.sqrt(sumSquares / (forward.length * forward.numberOfChannels));
      const boost = rms > 0 ? Math.min(5, 0.06 / rms, peak > 0 ? 0.6 / peak : 5) : 1;
      for (let channel = 0; channel < forward.numberOfChannels; channel++) {
        const samples = forward.getChannelData(channel);
        for (let i = 0; i < samples.length; i++) samples[i] *= boost;
      }
      const wave = (beginsAt: number) => {
        const source = context.createBufferSource(), gain = context.createGain();
        const color = context.createBiquadFilter();
        color.type = "lowpass";
        source.buffer = forward;
        gain.gain.value = 0;
        const attack = mode === "opening" ? durationSeconds : 0.06;
        gain.gain.setValueCurveAtTime(SCENE_ZERO_MURMUR_ATTACK, beginsAt, attack);
        gain.gain.setValueAtTime(1, beginsAt + fadeOutAt);
        gain.gain.linearRampToValueAtTime(0, beginsAt + waveSeconds);
        color.frequency.setValueAtTime(mode === "line" ? 700 : 18000, beginsAt);
        color.Q.setValueAtTime(mode === "line" ? 1.4 : 0.7, beginsAt);
        if (showBeacon) {
          color.frequency.setTargetAtTime(700, beginsAt + questionMs / 1000, 2);
          color.Q.setTargetAtTime(1.4, beginsAt + questionMs / 1000, 2);
        }
        source.connect(color); color.connect(gain); gain.connect(masterOutput);
        source.onended = () => { source.disconnect(); color.disconnect(); gain.disconnect(); };
        source.start(beginsAt);
        source.stop(beginsAt + waveSeconds);
      };

      const beginsAt = context.currentTime + 0.06;
      const atOffset = (offsetMs: number, action: (time: number) => void) => atTime(beginsAt + offsetMs / 1000, action);
      const beginLight = (time: number) => {
        setActiveDurationMs(lightMs);
        setCue({ context, beginsAt: time });
        setStage("beacon");
      };

      if (mode === "beacon") beginLight(beginsAt);
      else if (mode !== "line") {
        setActiveDurationMs(openingMs);
        setCue({ context, beginsAt });
        setStage("opening");
      }
      wave(beginsAt);

      if (showBeacon) {
        if (mode === "opening") atOffset(oneStartsAt, beginLight);
        atOffset(questionMs, () => setStage("question"));
        const disconnectGong = playSceneOneGong(context, masterOutput, beginsAt + pointMs / 1000);
        atOffset(pointMs, () => setStage("one"));
        atOffset(pointMs + 11500, disconnectGong);
      }

      const chordBus = createChordBus();
      const scheduleAcceleration = (beginning: number) => {
        const duration = rampSeconds;
        const percussionGain = context.createGain();
        percussionGain.gain.setValueAtTime(1, beginning);
        percussionGain.gain.setValueAtTime(1, beginning + duration * 0.75);
        percussionGain.gain.linearRampToValueAtTime(0, beginning + duration + 0.4);
        percussionGain.connect(masterOutput);
        const beat = context.createBuffer(1, Math.floor(context.sampleRate * 0.012), context.sampleRate);
        const samples = beat.getChannelData(0);
        for (let i = 0; i < samples.length; i++) {
          const time = i / context.sampleRate;
          samples[i] = (Math.sin(2 * Math.PI * 220 * time) * 0.65 + (Math.random() * 2 - 1) * 0.35) * Math.exp(-time * 450);
        }
        const hits: number[] = [];
        let position = 0;
        while (position < duration) {
          const rate = 2 * Math.pow(111 / 2, position / duration);
          hits.push(position);
          const source = context.createBufferSource(), gain = context.createGain();
          source.buffer = beat;
          gain.gain.value = 0.22 / Math.sqrt(Math.max(1, rate / 12));
          source.connect(gain); gain.connect(percussionGain);
          source.onended = () => { source.disconnect(); gain.disconnect(); };
          source.start(beginning + position);
          position += 1 / rate;
        }
        const pitch = context.createOscillator(), pitchGain = context.createGain();
        pitch.type = "sine";
        const pitchStart = beginning + duration * (2 / 3);
        pitch.frequency.setValueAtTime(2 * Math.pow(111 / 2, 2 / 3), pitchStart);
        pitch.frequency.exponentialRampToValueAtTime(111, beginning + duration);
        pitchGain.gain.setValueAtTime(0, pitchStart);
        pitchGain.gain.linearRampToValueAtTime(0.12, beginning + duration);
        pitch.connect(pitchGain); pitchGain.connect(chordBus);
        pitch.start(pitchStart);
        playHarmonics(chordBus, beginning + duration + 4, pitch);
        const draw = () => {
          if (run !== runRef.current || audioRef.current !== context) return;
          const elapsed = context.currentTime - beginning;
          let count = 0;
          while (count < hits.length && hits[count] <= elapsed) count++;
          setPulseCount(count);
          setPulseRate(2 * Math.pow(111 / 2, Math.min(1, Math.max(0, elapsed / duration))));
          if (elapsed >= duration) {
            setPulseRate(111); setStage("vertical"); frameRef.current = null;
            return;
          }
          frameRef.current = window.requestAnimationFrame(draw);
        };
        atOffset(lineStartsAt + gongLead * 1000, () => {
          setStage("multiplying");
          frameRef.current = window.requestAnimationFrame(draw);
        });
      };
      const gongAt = beginsAt + lineStartsAt / 1000;
      playModuleGong(context, masterOutput, gongAt, 330);
      showAt("line", gongAt, () => {
        setPulseCount(0);
        setPulseRate(2);
        setStage("two");
        scheduleAcceleration(gongAt + gongLead);
      });
    } catch {
      if (run !== runRef.current) return;
      reset();
    }
  };

  const showObject = stage === "opening" || stage === "beacon";
  const muted = masterVolume === 0;
  const soundAction = muted ? "Restaurar sonido" : "Silenciar sonido";
  const preparing = stage === "preparing";
  const ready = stage === "ready";
  const breathing = stage === "breath-hold";
  const canStart = ready || breathing || noteScene !== null || extendedScene !== null || (previewMode !== null && !preparing);
  const light = !showObject && stage !== "ready" && !preparing;
  const question = stage === "question";
  const dots = stage === "two" || stage === "multiplying";
  const expression = stage === "vertical" || stage === "harmonics" || stage === "equation" || stage === "spatial" ||
    stage === "space" || stage === "temporal" || stage === "time";
  const continuation = activeScene && isContinuationScene(activeScene) ? activeScene : null;
  const splitLabel = MIDI_PITCH_NAMES[splitNote % 12] + (Math.floor(splitNote / 12) - 1);
  const restLabel = restSeconds === 0 ? "Hasta avanzar" : `${restSeconds} s`;
  const sceneControls = [
    { mode: "opening", title: "Escena Ø → {}", id: "zero-duration", label: "Duración de la transición de luz y sonido", duration: durationSeconds, min: 1, max: 30, setDuration: setDurationSeconds },
    { mode: "beacon", title: "Escena {} → 0", id: "one-duration", label: "Duración de la escena de conjunto vacío a cero", duration: oneSeconds, min: 6, max: 60, setDuration: setOneSeconds },
    { mode: "line", title: "Escena 0 → 1", id: "line-duration", label: "Duración de la escena de cero a uno", duration: lineSeconds, min: 6, max: 60, setDuration: setLineSeconds },
    { mode: "harmonics", title: "Escena 1 → 2", id: "harmonic-duration", label: "Duración de la escena de uno a dos", duration: harmonicSeconds, min: 6, max: 60, setDuration: setHarmonicSeconds },
    { mode: "space", title: "Escena 2 → 3", id: "space-duration", label: "Duración de la escena de dos a tres", duration: spaceSeconds, min: 3, max: 30, setDuration: setSpaceSeconds },
    { mode: "time", title: "Escena 3 → 4", id: "time-duration", label: "Duración de la escena de tres a cuatro", duration: timeSeconds, min: 4, max: 60, setDuration: setTimeSeconds },
    ...CONTINUATION_SCENES.map(({ mode, title }) => ({
      mode, title, id: `${mode}-duration`, label: `Duración de ${title.toLowerCase()}`,
      duration: continuationSeconds[mode], min: 4, max: 60,
      setDuration: (seconds: number) => setContinuationSeconds((current) => ({ ...current, [mode]: seconds })),
    })),
    ...NOTE_SCENE_IDS.map((mode) => {
      const number = NOTE_SCENES[mode].number;
      const control = { mode, title: `Escena ${number}`, id: `scene-${mode}` };
      return { ...control, label: `Duración de la escena ${number}`, duration: noteSeconds[mode], min: mode === "fourteen" ? 0 : 1, max: 120,
        setDuration: (seconds: number) => setNoteSeconds((current) => ({ ...current, [mode]: seconds })) };
    }),
    ...EXTENDED_SCENES.map((mode) => ({ mode, title: `Escena ${mode}`, id: `scene-${mode}`, label: `Duración de la escena ${mode}`,
      duration: extendedSeconds[mode], min: 0, max: 120,
      setDuration: (seconds: number) => setExtendedSeconds((current) => ({ ...current, [mode]: seconds })),
    })),
  ] as const;
  const sceneIndex = sceneControls.findIndex(({ mode }) => mode === activeScene);
  const sceneTitle = breathing ? "Plano 9" : sceneControls[sceneIndex]?.title;
  const sceneNumber = extendedScene ?? (noteScene ? NOTE_SCENES[noteScene].number : null);
  const extendedDark = extendedScene === 16 || extendedScene === 17 || isTimbreScene(extendedScene);
  const playMode = (mode: ModuleZeroScene, asPreview: boolean, startPaused = false) => {
    if ((typeof mode === "number" || isNoteScene(mode)) && (breathing || noteScene || extendedScene) && cue) {
      enterNumberedScene(mode, cue.context, asPreview);
      return;
    }
    void start(mode, asPreview, startPaused);
  };
  const moveScene = (offset: number) => {
    const scene = sceneControls[Math.max(0, sceneIndex) + offset];
    if (scene) playMode(scene.mode, previewMode !== null, paused);
  };
  const pointPosition = (index: number) => {
    let n = index, fraction = 0, scale = 0.5;
    while (n > 0) { fraction += (n % 2) * scale; n = Math.floor(n / 2); scale *= 0.5; }
    return 10 + 180 * fraction;
  };
  return <div role="region" aria-label="Módulo cero" className="zero-layout">
    <style>{`
      @keyframes zeroSpaceFade { from { opacity: 0; } to { opacity: 1; } }
      .zero-layout {
        display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr); width: 100%; height: 100dvh; margin: 0; padding: 0;
        background: #11131a; color: #f2f3f7; isolation: isolate;
        font-family: system-ui, sans-serif;
      }
      .zero-stage {
        position: relative; display: grid; place-items: center; min-width: 0; min-height: 0;
        width: 100%; padding: 0; border: 0; overflow: hidden; isolation: isolate;
      }
      .zero-start, .zero-object { position: absolute; inset: 0; width: 100%; height: 100%; }
      .zero-start { border: 0; padding: 0; background: transparent; cursor: pointer; }
      .zero-object { cursor: grab; touch-action: none; }
      .zero-object:active { cursor: grabbing; }
      .zero-subtitle {
        position: absolute; inset-inline: 0; bottom: .5rem; z-index: 2;
        display: flex; justify-content: center; padding-inline: .5rem; pointer-events: none;
      }
      .zero-subtitle span {
        border: 1px solid #687184; border-radius: 4px; padding: .23rem .65rem;
        background: #191d25; color: #f2f3f7; font: 600 .75rem/1.25 system-ui, sans-serif;
        text-align: center;
      }
      .zero-scene-number {
        position: absolute; inset-block-start: clamp(.8rem, 2.5vw, 2rem); inset-inline-start: clamp(.95rem, 3vw, 2.6rem);
        z-index: 2; color: #191b22; font: 400 clamp(1.5rem, 3.25vw, 2.8rem)/1 Georgia, serif;
        font-variant-numeric: tabular-nums; pointer-events: none;
      }
      .zero-stage:has(.zero-subtitle span) .zero-harmonic-frame:has(.zero-time-caption) {
        translate: 0 clamp(-4rem, calc((100dvh - 880px) / 5), 0px);
      }
      .zero-question {
        position: absolute; width: min(87%, 900px); margin: 0; text-align: center;
        color: #111; font: 400 clamp(1.5rem, 3.5vw, 3.6rem)/1.3 Georgia, serif;
        animation: zeroSpaceFade .55s ease both;
      }
      .zero-point { width: clamp(8px, 1.05vw, 16px); aspect-ratio: 1; border-radius: 50%; background: #000; }
      .zero-harmonic-frame { position: relative; width: min(94%, 800px, 116dvh); aspect-ratio: 16 / 9; pointer-events: none; }
      .zero-harmonic-diagram, .zero-frequency-space, .zero-frequency-space canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      .zero-note-scene[data-note-scene=ten] .zero-resting-sphere {
        transform: translateX(17%) scale(.90);
        animation: zeroSphereEntrance .5s ease-out both;
      }
      .zero-note-scene:is([data-note-scene=twelve], [data-note-scene=thirteen], [data-note-scene=fourteen]) .zero-resting-sphere {
        transform: translateX(-20%) scale(.78);
      }
      .zero-stage:has([data-note-scene=fourteen]) { grid-template-rows: minmax(0, 1fr) auto; }
      .zero-loop-timeline {
        --loop-beat-width: clamp(7rem, 15vw, 12.5rem); --loop-playhead: 25%; --loop-ruler-height: 1.4rem;
        display: grid; grid-template-rows: auto minmax(0, 1fr); grid-row: 2;
        width: min(92%, 800px); height: clamp(113px, 23dvh, 205px); margin-bottom: clamp(.65rem, 2.4dvh, 1.6rem);
        z-index: 1; overflow: hidden; border: 1px solid #433a60; border-radius: 5px; background: #1b1530;
        color: #eee9fb; font: .74rem/1.15 system-ui, sans-serif; font-variant-numeric: tabular-nums;
      }
      .zero-loop-readout {
        display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .9rem;
        padding: .42rem .65rem; background: #231b38; border-bottom: 1px solid #47395d;
      }
      .zero-loop-readout > div { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: baseline; gap: .4rem; min-width: 0; }
      .zero-loop-readout > div > span:first-child { color: #c1b6d2; }
      .zero-loop-readout-value { white-space: nowrap; min-width: 0; overflow-x: auto; scrollbar-width: none; }
      .zero-loop-plot {
        position: relative; overflow: hidden; min-width: 0;
        background: repeating-linear-gradient(0deg, #c1a9f110 0 1px, transparent 1px 10px), linear-gradient(#1b1530, #211533);
      }
      .zero-loop-track {
        position: absolute; inset-block: 0; left: var(--loop-playhead); display: flex; width: max-content;
        transform: translateX(calc(-1 * var(--loop-beat-width) * var(--loop-position, 2)));
      }
      .zero-loop-playhead {
        position: absolute; z-index: 3; inset-block: 0; left: var(--loop-playhead); width: 1px;
        background: #e2d7fc; translate: -50% 0; pointer-events: none; box-shadow: 0 0 8px #c8a4ff80;
      }
      .zero-loop-playhead::before {
        content: ""; position: absolute; top: 0; left: 50%; translate: -50% 0; width: 9px; height: 6px;
        background: #e2d7fc; clip-path: polygon(0 0, 100% 0, 50% 100%);
      }
      .zero-loop-beat {
        position: relative; flex: 0 0 var(--loop-beat-width); width: var(--loop-beat-width);
        box-shadow: inset 1px 0 #b69de641;
      }
      .zero-loop-beat[aria-current=true] { background: #b69de612; box-shadow: inset 1px 0 #d7c7fb; }
      .zero-loop-card {
        display: flex; align-items: center; gap: .45rem; height: var(--loop-ruler-height); padding-inline: .55rem;
        border-bottom: 1px solid #b69de633; color: #d5c9e8;
      }
      .zero-loop-count { flex: none; color: #f2eafd; font-weight: 600; }
      .zero-loop-traces, .zero-loop-pitches, .zero-loop-lights {
        position: absolute; inset: var(--loop-ruler-height) 0 .32rem; pointer-events: none;
      }
      .zero-loop-traces { width: 100%; height: calc(100% - var(--loop-ruler-height) - .32rem); z-index: 1; overflow: visible; filter: drop-shadow(0 0 2px #dfbbff50); }
      .zero-loop-traces path { fill: none; stroke-width: 1.3px; stroke-linecap: round; }
      .zero-loop-pitches { z-index: 2; }
      .zero-loop-pitches span {
        position: absolute; left: .55rem; translate: 0 calc(-100% - 2px); font-size: .68rem; text-shadow: 0 0 4px #12101b;
      }
      .zero-loop-light {
        position: absolute; left: 50%; width: 6px; height: 6px; translate: -50% -50%; border-radius: 50%;
        background: currentColor; box-shadow: 0 0 6px currentColor, 0 0 13px currentColor;
      }
      @media (max-width: 760px) and (max-height: 660px) {
        .zero-note-scene[data-note-scene=fourteen] { width: min(94%, 57dvh); }
        .zero-loop-timeline { height: clamp(88px, 20dvh, 118px); }
      }
      @media (max-width: 490px) {
        .zero-loop-readout { gap: .45rem; padding-inline: .45rem; }
        .zero-loop-readout > div { gap: .3rem; }
        .zero-loop-readout-value { height: 2.3em; overflow: auto; white-space: normal; }
      }
      @keyframes zeroSphereEntrance { from { transform: translateX(0) scale(1); } }
      .zero-note-bank {
        position: absolute; top: 50%; transform: translateY(-50%); display: grid;
        align-items: center; gap: clamp(.2rem, .75vw, .75rem); pointer-events: auto;
      }
      [data-note-scene=ten] .zero-note-bank { left: 6%; right: 55%; justify-items: center; }
      [data-note-scene=eleven] .zero-note-bank { left: 3%; right: 3%; grid-template-columns: 1fr 1fr; }
      [data-note-scene=eleven] .zero-note-key { justify-self: start; }
      [data-note-scene=eleven] .zero-note-key:last-child { justify-self: end; }
      .zero-cube-area { position: absolute; top: 50%; left: 51%; right: 2%; height: 0; }
      .zero-cube { position: absolute; top: 0; left: 50%; width: 100%; translate: -50% -50%; transform-style: preserve-3d; }
      .zero-cube-face {
        display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: center;
        gap: clamp(.2rem, .75vw, .75rem); pointer-events: auto; backface-visibility: hidden;
      }
      .zero-cube-right, .zero-cube-top { display: none; }
      .zero-cube[data-folding] .zero-cube-face {
        align-items: stretch; gap: clamp(2px, .45vw, 6px); padding: clamp(2px, .55vw, 7px);
        box-shadow: inset 0 0 0 1px #777f9e;
      }
      .zero-cube[data-folding] .zero-cube-front {
        position: absolute; inset: 0; transform: translateZ(calc(var(--cube-depth) * .5));
        background: rgb(227 232 249 / var(--cube-color));
      }
      .zero-cube[data-show-sides=true] .zero-cube-right {
        display: grid; position: absolute; top: 50%; left: 100%; width: var(--cube-depth); height: 100%;
        translate: -50% -50%; transform: rotateY(90deg); background: #e6e3f5;
      }
      .zero-cube[data-show-sides=true] .zero-cube-top {
        display: grid; position: absolute; top: 0; left: 50%; width: 100%; height: var(--cube-depth); translate: -50% -50%;
        transform: rotateX(90deg); backface-visibility: hidden; background: #f1f3fa; box-shadow: inset 0 0 0 1px #777f9e;
      }
      .zero-note-key {
        display: grid; justify-items: center; align-content: center; min-width: 0; min-height: 44px;
        gap: .3rem; padding: clamp(.2rem, 1vw, .65rem); border: 1px solid transparent; border-radius: 5px;
        color: #161821; background: transparent; cursor: pointer; font: inherit; touch-action: none; user-select: none;
      }
      .zero-cube-face .zero-note-key { border-color: #b8becd; background: #fafafe; }
      .zero-cube-right .zero-note-key { border-color: #b8afd0; background: #f6f2fc; }
      .zero-cube-top .zero-note-key { border-color: #b7c1d5; background: #f7f9ff; }
      .zero-cube[data-folding] .zero-note-key { min-height: 0; padding: 1px; gap: .1rem; }
      .zero-cube[data-folding] .zero-note-hz { font-size: clamp(.56rem, 1.26vw, 1rem); }
      .zero-cube[data-folding] .zero-note-key kbd { font-size: clamp(.5rem, .72vw, .66rem); }
      @media (max-width: 480px) { .zero-cube[data-folding] .zero-note-hz small { display: none; } }
      .zero-note-key:not(:disabled):hover { border-color: #797c99; }
      .zero-note-key[data-sounding=true] { color: #47339e; background: #eae5ff; border-color: #8171bf; }
      .zero-note-key:disabled { cursor: default; }
      .zero-note-glyph { position: relative; height: clamp(27px, 11vw, 116px); width: 2px; margin: .3rem 1.1rem .6rem; background: currentColor; }
      .zero-note-glyph::before, .zero-note-glyph::after {
        content: ""; position: absolute; left: 50%; translate: -50% 0; width: clamp(12px, 1.5vw, 20px); height: 2px; background: currentColor;
      }
      .zero-note-glyph::before { top: 0; }
      .zero-note-glyph::after { bottom: 0; }
      .zero-note-hz { white-space: nowrap; font-size: clamp(.68rem, 1.5vw, 1.2rem); font-variant-numeric: tabular-nums; }
      .zero-note-hz small { font-size: .74em; }
      .zero-note-key kbd { color: #545b70; font-size: clamp(.58rem, .90vw, .78rem); }
      @media (prefers-reduced-motion: reduce) { .zero-note-scene[data-note-scene=ten] .zero-resting-sphere { animation: none; } }
      .zero-trail-axis {
        position: absolute; bottom: 4%; display: flex; justify-content: space-between;
        border-top: 1px solid #abb7cd; color: #46516b; padding-top: .3rem;
        font: .73rem/1.25 system-ui, sans-serif;
      }
      .zero-trail-axis span:first-child { transform: translateX(-50%); }
      .zero-trail-axis span:last-child { transform: translateX(50%); }
      .zero-trail-fallback { position: absolute; inset: auto 0 0; text-align: center; color: #46516b; }
      .zero-time-caption {
        position: absolute; top: 104%; left: 0; width: 100%; display: grid; gap: .35rem;
        text-align: center; color: #17191e; font: 400 clamp(1rem, 2.4vw, 2.1rem)/1.2 Georgia, serif;
      }
      .zero-time-caption small { font: 400 clamp(.68rem, 1.35vw, .95rem)/1.3 system-ui, sans-serif; font-variant-numeric: tabular-nums; }
      .zero-time-caption small:last-child { color: #46516b; }
      .zero-controls {
        --zero-controls-padding: clamp(.75rem, 2.2vw, 2.5rem);
        display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto;
        min-height: 0; overflow: hidden; padding: 0; border-left: 1px solid #30333d;
      }
      .zero-control-bar { padding: .85rem var(--zero-controls-padding) .4rem; border-top: 1px solid #30333d; }
      .zero-midi { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin-bottom: .65rem; }
      .zero-midi p { margin: 0; color: #dce6ff; font-size: .76rem; overflow-wrap: anywhere; }
      .zero-controls .zero-midi button { font-size: .75rem; padding: .25rem .55rem; }
      .zero-transport { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .25rem; }
      .zero-controls .zero-transport button { display: grid; place-items: center; min-width: 0; padding: 0; }
      .zero-transport svg { width: min(70%, 1.2rem); height: auto; fill: currentColor; }
      .zero-master {
        display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center;
        gap: .6rem; margin-top: .65rem;
      }
      .zero-controls .zero-master button { display: grid; place-items: center; width: 2.5rem; padding: 0; }
      .zero-controls .zero-master button:hover { background: #3b4660; }
      .zero-master button svg { width: 1.2rem; height: 1.2rem; }
      .zero-master-label {
        display: flex; align-items: baseline; justify-content: space-between; flex-wrap: wrap;
        gap: .1rem .35rem; font-size: .8rem;
      }
      .zero-master-label output { color: #dce6ff; font-variant-numeric: tabular-nums; }
      .zero-settings {
        display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 1.15rem;
        min-height: 0; overflow: auto; overscroll-behavior: contain;
        padding: 1rem var(--zero-controls-padding); scrollbar-color: #5d6476 #11131a;
      }
      .zero-scene { padding-top: 1.4rem; border-top: 1px solid #30333d; }
      .zero-settings .zero-scene:first-child { padding-top: 0; border-top: 0; }
      .zero-scene[aria-current=step] {
        border-radius: .35rem; border-top-color: transparent; background: #25324c;
        box-shadow: 0 0 0 .42rem #25324c, 0 0 0 calc(.42rem + 1px) #819bd6,
          0 0 1rem rgba(142, 169, 233, .23);
      }
      .zero-subtitle-toggle {
        display: flex; justify-content: space-between; align-items: center; gap: .5rem;
        min-height: 44px; font-size: .875rem; cursor: pointer;
      }
      .zero-subtitle-toggle input {
        appearance: none; flex: none; margin: 0;
        width: 2.25rem; height: 1.25rem; border: 1px solid #8991a4; border-radius: 1rem;
        background: radial-gradient(circle at .5625rem 50%, #f2f3f7 .35rem, transparent .4rem), #303542;
        cursor: pointer;
      }
      .zero-subtitle-toggle input:checked {
        background: radial-gradient(circle at calc(100% - .5625rem) 50%, #131b2b .35rem, transparent .4rem), #adc4ff;
      }
      .zero-layout .zero-subtitle-toggle input:focus-visible { outline-offset: 3px; }
      .zero-title { display: flex; justify-content: space-between; gap: .4rem; align-items: baseline; }
      .zero-title h2 { margin: 0; font: 400 clamp(1rem, 1.7vw, 1.7rem)/1.15 Georgia, serif; white-space: nowrap; }
      .zero-title output { color: #e5e9f9; font-size: .78rem; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .zero-controls input[type=range] { display: block; width: 100%; margin: .75rem 0 .85rem; accent-color: #adc4ff; }
      .zero-controls .zero-master input { margin: .35rem 0 0; }
      .zero-sampling { display: flex; justify-content: space-between; gap: .4rem; align-items: baseline; font-size: .75rem; }
      .zero-sampling output { color: #e5e9f9; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .zero-noise-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem; margin: 0 0 .75rem; padding: 0; border: 0; min-width: 0; }
      .zero-noise-pair legend { margin-bottom: .42rem; font-size: .75rem; }
      .zero-noise-pair label { display: grid; gap: .3rem; min-width: 0; font-size: .75rem; }
      .zero-noise-pair select {
        min-width: 0; min-height: 40px; border: 1px solid #424958; border-radius: 6px;
        padding: .32rem; background: #202533; color: #f2f3f7; font: inherit;
      }
      .zero-controls button {
        border: 1px solid #424958; border-radius: 6px; min-height: 44px; padding: .55rem .6rem;
        background: #202533; color: #f2f3f7; font: inherit; cursor: pointer;
      }
      .zero-controls .zero-play { background: #dce6ff; color: #131b2b; border-color: transparent; width: 100%; }
      .zero-controls .zero-continue { width: 100%; margin-top: .45rem; }
      .zero-controls .zero-transport button:enabled:hover { background: #3b4660; }
      .zero-controls button:disabled { opacity: .55; cursor: default; }
      .zero-playback-status { display: block; color: #dce6ff; font-size: .75rem; margin: 0 0 .4rem; }
      .zero-scene-input { margin: .65rem 0; font: 400 .75rem/1.5 system-ui, sans-serif; }
      .zero-scene-input p { margin: .4rem 0; }
      .zero-scene-input button { width: 100%; }
      .zero-loop-controls { min-width: 0; margin: .7rem 0; padding: 0; border: 0; font-size: .78rem; }
      .zero-loop-controls legend { padding: 0; margin-bottom: .55rem; color: #e5e9f9; }
      .zero-loop-options, .zero-loop-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem; }
      .zero-loop-options label { display: grid; align-content: space-between; gap: .3rem; color: #e5e9f9; }
      .zero-loop-options :is(input, select) {
        width: 100%; min-width: 0; min-height: 38px; padding: .3rem .4rem; border: 1px solid #626c83;
        border-radius: 5px; background: #202533; color: #f2f3f7; font: inherit; color-scheme: dark;
      }
      .zero-loop-presets { margin-top: .4rem; }
      .zero-controls .zero-loop-presets button { min-height: 36px; padding: .25rem; }
      .zero-loop-presets button[aria-pressed=true] { border-color: #a7b0ed; background: #3b4660; }
      .zero-loop-status { margin: .65rem 0 .4rem; color: #dce6ff; font-variant-numeric: tabular-nums; }
      .zero-loop-record { width: 100%; }
      .zero-layout :focus-visible { outline: 2px solid #a8c3ff; outline-offset: -3px; }
      @media (min-width: 761px) and (max-width: 950px) {
        .zero-controls { --zero-controls-padding: .75rem; }
        .zero-title h2 { font-size: .96rem; }
        .zero-title output { font-size: .69rem; }
      }
      @media (max-width: 760px) {
        .zero-layout { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 3fr) minmax(0, 2fr); }
        .zero-harmonic-frame { width: min(94%, 800px, 76dvh); }
        .zero-controls { --zero-controls-padding: .75rem; border-left: 0; border-top: 1px solid #30333d; }
        .zero-scene { padding-top: 1rem; }
      }
      ${EXTENDED_STYLE}
    `}</style>
    <div className="zero-stage" role="group" aria-label="Proyección del módulo cero" data-extended-dark={extendedDark ? "true" : undefined}
      style={{background:extendedDark ? "#130f20" : light ? "#fff" : "#000"}}>
      {stage === "ready" && <button type="button" className="zero-start" onClick={() => void start()} aria-label="Iniciar la secuencia desde el módulo cero" />}
      {showObject && cue && <EmptySetScene durationMs={activeDurationMs} beacon={stage === "beacon"} cue={cue} paused={paused} />}
      {question && <p className="zero-question" style={{ animationPlayState: paused ? "paused" : "running" }}>¿Cuál es la entidad mínima capaz de ser imaginada?</p>}
      {stage === "one" && <span role="img" aria-label="Punto negro" className="zero-point" />}
      {dots && <svg aria-hidden="true" viewBox="0 0 200 40" style={{position:"absolute",width:"clamp(80px, 10vw, 180px)",height:"auto",overflow:"visible",transform:`rotate(${stage === "multiplying" ? 90 * Math.max(0, Math.min(1, Math.log(pulseRate / 2) / Math.log(111 / 2))) : 0}deg)`,pointerEvents:"none"}}>
        <circle cx="10" cy="20" r="10" fill="#000" /><circle cx="190" cy="20" r="10" fill="#000" />
        {stage === "multiplying" && Array.from({length:pulseCount}, (_, index) => <circle key={index} cx={pointPosition(index + 1)} cy="20" r="1.5" fill="#000" />)}
      </svg>}
      {expression && <HarmonicDiagram stage={stage as HarmonicStage} cue={cue} durationMs={activeDurationMs}
        sampleIntervalMs={activeSamplingMs} />}
      {continuation && cue && <ContinuationProjection scene={continuation} clock={cue.context} startsAt={cue.beginsAt}
        seconds={activeDurationMs / 1000} pair={playingNoisePair} hold={breathing}
        inheritedTrail={(continuation === "cross" || continuation === "sphere") &&
          <TemporalFrequencyTrail progress={1} durationMs={timeSeconds * 1000} intervalMs={activeSamplingMs} clock={cue.context} frozenAtEnd />} />}
      {noteScene && <PerformanceProjection scene={noteScene} paused={paused} clock={cue?.context ?? null}
        input={chordLoop.frame ? { ...noteInput, sounding: [...noteInput.sounding, ...chordLoop.frame.sounding] } : noteInput}
        beginsAt={cue?.beginsAt ?? 0} />}
      {chordLoop.frame && cue && <ChordLoopTimeline clock={cue.context} frame={chordLoop.frame} paused={paused} live={noteInput.sounding} />}
      {extendedScene && cue && (extendedPlaying
        ? <ExtendedPerformanceProjection performance={extended} scene={extendedScene} clock={cue.context} paused={paused} />
        : <ExtendedArt scene={extendedScene} clock={cue.context} beginsAt={cue.beginsAt} seconds={directionSeconds} a4={extended.a4} paused={paused} />)}
      {stage === "multiplying" && <span aria-live="off" style={{position:"absolute",bottom:showSubtitles ? "max(8%, 3rem)" : "8%",color:"#333",fontFamily:"monospace",fontSize:"clamp(12px, 1vw, 16px)",letterSpacing:".08em",pointerEvents:"none"}}>{pulseRate < 10 ? pulseRate.toFixed(1) : Math.round(pulseRate)} PERCUSIONES / SEGUNDO</span>}
      {sceneNumber !== null ? <div className="zero-scene-number" role="status" aria-label={`Escena ${sceneNumber}`}>{sceneNumber}</div>
        : <div className="zero-subtitle" role="status">{showSubtitles && sceneTitle && <span>{sceneTitle}</span>}</div>}
    </div>
    <aside className="zero-controls" aria-label="Controles de las escenas">
      <div className="zero-settings" ref={settingsRef}>
        {sceneControls.map((control) => {
          const { mode, title, id, duration } = control;
          const seconds = duration === 0 ? (mode === 45 ? "Hasta detener" : "Hasta avanzar") : `${duration} ${duration === 1 ? "segundo" : "segundos"}`;
          const isActive = mode === activeScene;
          return <div key={mode} className="zero-scene" role="region" aria-labelledby={`${id}-title`}
            ref={isActive ? activeSceneRef : undefined} aria-current={isActive ? "step" : undefined}>
            <div className="zero-title">
              <h2 id={`${id}-title`}>{title}</h2>
              <output htmlFor={id}>{seconds}</output>
            </div>
            <input id={id} aria-label={control.label} type="range" min={control.min} max={control.max} step={1} value={control.duration}
              aria-valuetext={seconds} disabled={!canStart}
              onChange={(event) => control.setDuration(Number(event.currentTarget.value))} />
            {mode === "time" && <>
              <div className="zero-sampling">
                <label htmlFor="time-sampling">Intervalo de muestreo</label>
                <output htmlFor="time-sampling">{timeSamplingMs} ms</output>
              </div>
              <input id="time-sampling" type="range" min={50} max={1000} step={25} value={timeSamplingMs}
                aria-valuetext={`${timeSamplingMs} milisegundos`} disabled={!canStart || previewMode === "time"}
                onChange={(event) => setTimeSamplingMs(Number(event.currentTarget.value))} />
            </>}
            {mode === "noise" && <fieldset className="zero-noise-pair">
              <legend>Enlace para la prueba individual</legend>
              {(["from", "to"] as const).map((side) => <label key={side}>
                {side === "from" ? "Ruido de origen" : "Ruido de llegada"}
                <select value={noisePair[side]} disabled={!canStart || previewMode === mode} onChange={(event) => {
                  const next = event.currentTarget.value as NoiseColor;
                  setNoisePair((current) => {
                    const other = side === "from" ? "to" : "from";
                    return { ...current, [side]: next, [other]: next === current[other] ? current[side] : current[other] };
                  });
                }}>
                  {NOISE_IDS.map((id) => <option key={id} value={id}>{NOISE_COLORS[id].label}</option>)}
                </select>
              </label>)}
            </fieldset>}
            {mode === "breath" && <>
              <div className="zero-sampling">
                <label htmlFor="rest-duration">Respiro en el plano 9</label>
                <output htmlFor="rest-duration">{restLabel}</output>
              </div>
              <input id="rest-duration" type="range" min={0} max={60} step={1} value={restSeconds}
                aria-valuetext={restLabel} disabled={!canStart} onChange={(event) => setRestSeconds(Number(event.currentTarget.value))} />
            </>}
            {mode === "fourteen" && <ChordLoopControls loop={chordLoop} active={isActive} paused={paused} />}
            {typeof mode === "number" && isActive && <ExtendedPerformanceControls performance={extended} scene={mode} paused={paused} />}
            {isActive && noteScene && noteScene !== "fourteen" && <div className="zero-scene-input">
              <p>{noteScene === "ten" ? "Usá cualquier tecla MIDI o 1–9 en la computadora. Después del tiempo elegido entra la escena 11."
                : noteScene === "eleven" ? "En la computadora, 1–4 para la nota grave y 5–9 para la aguda."
                  : noteScene === "thirteen" ? "La cara derecha se toca con Mayús y 1–9 o de Do5 a La♭5 por MIDI. Para la superior, tocá las celdas o usá de Do6 a La♭6."
                    : "En la computadora, 1–9. En el piano MIDI, de Do4 a La♭4."}</p>
              {noteScene === "eleven" && midiInputs.length > 0 && <>
                <p role="status">{learningSplit ? "Tocá la primera tecla de la zona aguda." : `Corte MIDI en ${splitLabel}. Desde ahí suenan 999 Hz.`}</p>
                <button type="button" disabled={paused} onClick={() => {
                  learningSplitRef.current = !learningSplit;
                  setLearningSplit(!learningSplit);
                }}>{learningSplit ? "Cancelar cambio" : "Cambiar tecla de corte"}</button>
              </>}
            </div>}
            {previewMode !== null && isActive && !preparing
              ? <button type="button" className="zero-play" onClick={reset}>Detener prueba</button>
              : <button type="button" className="zero-play" disabled={!canStart} onClick={() => playMode(mode, true)}>Probar escena</button>}
            {mode === "time" && <button type="button" className="zero-continue" disabled={!canStart}
              onClick={() => void start("time")}>Reproducir desde 3 → 4</button>}
            {mode === "return" && <button type="button" className="zero-continue" disabled={!canStart}
              onClick={() => void start("return")}>Reproducir desde 7 → 8</button>}
            {mode === "breath" && breathing && <button type="button" className="zero-continue" onClick={() => moveScene(1)}>Ir a escena 10</button>}
          </div>;
        })}
      </div>
      <div className="zero-control-bar" role="group" aria-label="Panel de control">
        <div id="zero-midi" className="zero-midi">
          <p role="status">{midiInputs.length ? `MIDI activo · ${midiInputs.map(({ name }) => name).join(", ")}`
            : midiConnection === "checking" ? "Buscando piano MIDI… Podés usar el teclado."
              : "Teclado de la computadora listo"}</p>
          {midiConnection === "blocked" && <button type="button" onClick={() => void connectMidi()}>Habilitar MIDI</button>}
        </div>
        <div className="zero-transport" role="group" aria-label="Reproducción">
          <button type="button" aria-label="Escena anterior" title="Escena anterior"
            disabled={sceneIndex <= 0 || preparing || transportBusy} onClick={() => moveScene(-1)}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5h2v14H5zM19 5v14L8 12z" /></svg>
          </button>
          <button type="button" aria-label={paused ? "Reanudar" : "Reproducir"} title={paused ? "Reanudar" : "Reproducir"}
            disabled={preparing || transportBusy || (!ready && !paused)}
            onClick={() => ready ? void start() : void changePaused(false)}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 4l14 8-14 8z" /></svg>
          </button>
          <button type="button" aria-label="Pausar" title="Pausar"
            disabled={ready || preparing || paused || transportBusy} onClick={() => void changePaused(true)}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
          </button>
          <button type="button" aria-label="Detener" title="Detener" disabled={ready} onClick={reset}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5h14v14H5z" /></svg>
          </button>
          <button type="button" aria-label="Escena siguiente" title="Escena siguiente"
            disabled={sceneIndex === sceneControls.length - 1 || stage === "breath" || preparing || transportBusy} onClick={() => moveScene(1)}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M17 5h2v14h-2zM5 5l11 7-11 7z" /></svg>
          </button>
        </div>
        <div className="zero-master">
          <button type="button" aria-label={soundAction} title={soundAction}
            onClick={() => changeMasterVolume(muted ? audibleVolumeRef.current : 0)}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 9h4l5-4v14l-5-4H3z" />
              <path fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"
                d={muted ? "m16 9 5 6m0-6-5 6" : "M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"} />
            </svg>
          </button>
          <div>
            <div className="zero-master-label">
              <label htmlFor="zero-master-volume">Volumen master</label>
              <output htmlFor="zero-master-volume">{masterVolume}%</output>
            </div>
            <input id="zero-master-volume" type="range" min={0} max={100} step={1}
              value={masterVolume} aria-valuetext={`${masterVolume}%`}
              onChange={(event) => changeMasterVolume(Number(event.currentTarget.value))} />
          </div>
        </div>
        <label className="zero-subtitle-toggle">
          Activar subtítulos
          <input type="checkbox" role="switch" checked={showSubtitles}
            onChange={(event) => setShowSubtitles(event.currentTarget.checked)} />
        </label>
        {(preparing || paused) && <span className="zero-playback-status" role="status">{preparing ? "Preparando audio…" : "En pausa"}</span>}
      </div>
    </aside>
  </div>;
}

function playRhythm(engine: SoundEngine, step: number, cycle: number, section: number) {
  const { context, rhythmBus, rhythmNoise } = engine;
  const now = context.currentTime;
  const kickSteps = section % 2 === 0 ? [0, 4, 7] : [0, 3, 6];
  if (kickSteps.includes(step)) {
    const kick = context.createOscillator();
    const gain = context.createGain();
    kick.type = "sine";
    kick.frequency.setValueAtTime(135, now);
    kick.frequency.exponentialRampToValueAtTime(46, now + 0.13);
    gain.gain.setValueAtTime(step === 0 ? 0.48 : 0.30, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
    kick.connect(gain);
    gain.connect(rhythmBus);
    kick.onended = () => { kick.disconnect(); gain.disconnect(); };
    kick.start(now);
    kick.stop(now + 0.24);
  }
  const snare = step === 2 || step === 6 || (cycle % 5 === 4 && step === 8);
  const hat = step % 2 === 1 || (cycle % 2 === 1 && step === 8);
  if (snare || hat) {
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const length = snare ? 0.13 : 0.045;
    noise.buffer = rhythmNoise;
    filter.type = snare ? "bandpass" : "highpass";
    filter.frequency.value = snare ? 1800 : 7000;
    gain.gain.setValueAtTime(snare ? 0.15 : 0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + length);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(rhythmBus);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
    noise.start(now);
    noise.stop(now + length + 0.01);
  }
}

function updateLiveVoiceLevels(engine: SoundEngine) {
  const voices = Array.from(engine.activeNotes.entries());
  const count = Math.max(1, voices.length);
  let loudestVelocity = 0;
  for (const [note, velocity] of voices) {
    const voice = engine.noteVoices.get(note);
    if (!voice) continue;
    const level = (0.38 * velocity) / Math.sqrt(count);
    smooth(voice.oscillatorEnvelope.gain, level, engine.context, 0.012);
    smooth(voice.subEnvelope.gain, level, engine.context, 0.012);
    loudestVelocity = Math.max(loudestVelocity, velocity);
  }
  smooth(engine.envelope.gain, loudestVelocity > 0 ? 0.38 * loudestVelocity : 0.0001, engine.context, loudestVelocity > 0 ? 0.012 : 0.08);
}

function retireNoteVoice(engine: SoundEngine, voice: NoteVoice) {
  const stopAt = engine.context.currentTime + 0.22;
  smooth(voice.oscillatorEnvelope.gain, 0.0001, engine.context, 0.035);
  smooth(voice.subEnvelope.gain, 0.0001, engine.context, 0.035);
  voice.oscillator.stop(stopAt);
  voice.sub.stop(stopAt);
  window.setTimeout(() => {
    engine.driftDepth.disconnect(voice.oscillator.detune);
    voice.oscillator.disconnect();
    voice.sub.disconnect();
    voice.oscillatorEnvelope.disconnect();
    voice.subEnvelope.disconnect();
  }, 260);
}

function applyControl(engine: SoundEngine, index: number, value: number, bpm: number) {
  const context = engine.context;
  if (index === 0) smooth(engine.noiseGain.gain, value * 0.34, context);
  if (index === 1) {
    smooth(engine.oscillatorGain.gain, value * 0.72, context);
    smooth(engine.sequenceOscillatorGain.gain, value * 0.72, context);
  }
  if (index === 2) {
    smooth(engine.subGain.gain, value * 0.48, context);
    smooth(engine.sequenceSubGain.gain, value * 0.48, context);
  }
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
  const [values, setValues] = useSavedSetting<number[]>("values", INITIAL_VALUES);
  const [bpm, setBpm] = useSavedSetting("bpm", 106);
  const [steps, setSteps] = useSavedSetting<boolean[]>("steps", INITIAL_STEPS);
  const [recordedNotes, setRecordedNotes] = useSavedSetting<RecordedPattern>("recordedNotes", Array(9).fill(null));
  const [hasRecording, setHasRecording] = useSavedSetting("hasRecording", false);
  const [isRecording, setIsRecording] = useState(false);
  const [sequenceRun, setSequenceRun] = useState(0);
  const [activeStep, setActiveStep] = useState(-1);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isSequencing, setIsSequencing] = useState(false);
  const [audioActive, setAudioActive] = useState(false);
  const [audioMessage, setAudioMessage] = useState("AUDIO EN ESPERA");
  const [midiInputs, setMidiInputs] = useState<MidiDevice[]>([]);
  const [midiConnection, setMidiConnection] = useState<MidiConnection>("checking");
  const [midiMessage, setMidiMessage] = useState("BUSCANDO MIDI");
  const [midiLearnFor, setMidiLearnFor] = useState<number | null>(null);
  const [ccMap, setCcMap] = useSavedSetting<Record<number, CcBinding>>("ccMap", {});
  const [activeNote, setActiveNote] = useState<number | null>(null);
  const [heldNotes, setHeldNotes] = useState<number[]>([]);
  const [presets, setPresets] = useState<ScenePreset[]>([]);
  const [presetNameDraft, setPresetNameDraft] = useState("");
  const [presetFormOpen, setPresetFormOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const valuesRef = useRef(values);
  const bpmRef = useRef(bpm);
  const stepsRef = useRef(steps);
  const recordedNotesRef = useRef<RecordedPattern>(recordedNotes);
  const hasRecordingRef = useRef(hasRecording);
  const isRecordingRef = useRef(false);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingStepDurationRef = useRef((60_000 / 106) / 2);
  const recordingTimeoutRef = useRef<number | null>(null);
  const activeStepRef = useRef(activeStep);
  const phraseIndexRef = useRef(0);
  const sequenceCursorRef = useRef(0);
  const engineRef = useRef<SoundEngine | null>(null);
  const midiAccessRef = useRef<MidiAccessLike | null>(null);
  const midiRequestRef = useRef<Promise<void> | null>(null);
  const midiMountedRef = useRef(false);
  const connectedMidiIds = useRef(new Set<string>());
  const pianoRouting = useRef<PerformanceInput | null>(null);
  const midiLearnRef = useRef<number | null>(null);
  const ccMapRef = useRef(ccMap);
  const activeNoteRef = useRef<number | null>(null);
  const pressedNotesRef = useRef(new Set<number>());
  const presetsRef = useRef(presets);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  valuesRef.current = values;
  bpmRef.current = bpm;
  stepsRef.current = steps;
  activeStepRef.current = activeStep;
  ccMapRef.current = ccMap;
  midiLearnRef.current = midiLearnFor;
  activeNoteRef.current = activeNote;
  presetsRef.current = presets;

  const ensureAudio = useCallback(async () => {
    if (!engineRef.current || engineRef.current.context.state !== "running") window.dispatchEvent(new Event("multiversos-instrument-start"));
    let engine = engineRef.current;
    if (!engine) {
      engine = createSoundEngine();
      engineRef.current = engine;
      valuesRef.current.forEach((value, index) => applyControl(engine as SoundEngine, index, value, bpmRef.current));
    }
    if (engine.context.state !== "running") await engine.context.resume();
    setAudioActive(true);
    setAudioMessage("AUDIO LISTO · VCA ABIERTO AL TECLADO");
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
    pressedNotesRef.current.add(note);
    const activate = () => {
      const engine = engineRef.current;
      if (!engine || !pressedNotesRef.current.has(note)) return;
      const safeVelocity = clamp(velocity);
      let voice = engine.noteVoices.get(note);
      if (!voice) {
        const oscillator = engine.context.createOscillator();
        oscillator.type = "sawtooth";
        oscillator.frequency.value = frequencyForNote(note);
        const sub = engine.context.createOscillator();
        sub.type = "sine";
        sub.frequency.value = frequencyForNote(note - 12);
        const oscillatorEnvelope = engine.context.createGain();
        const subEnvelope = engine.context.createGain();
        oscillatorEnvelope.gain.value = 0.0001;
        subEnvelope.gain.value = 0.0001;
        oscillator.connect(oscillatorEnvelope);
        oscillatorEnvelope.connect(engine.oscillatorGain);
        sub.connect(subEnvelope);
        subEnvelope.connect(engine.subGain);
        engine.driftDepth.connect(oscillator.detune);
        oscillator.start();
        sub.start();
        voice = { oscillator, sub, oscillatorEnvelope, subEnvelope };
        engine.noteVoices.set(note, voice);
      }
      engine.activeNotes.set(note, safeVelocity);
      updateLiveVoiceLevels(engine);
      setActiveNote(note);
      setHeldNotes(Array.from(engine.activeNotes.keys()));
    };
    const engine = engineRef.current;
    if (engine?.context.state === "running") {
      activate();
      return;
    }
    void ensureAudio().then(activate).catch(() => {
      pressedNotesRef.current.delete(note);
      setAudioMessage("NO SE PUDO INICIAR EL AUDIO");
    });
  }, [ensureAudio]);

  const releaseNote = useCallback((note: number) => {
    pressedNotesRef.current.delete(note);
    const engine = engineRef.current;
    if (!engine) {
      setHeldNotes([]);
      setActiveNote(null);
      return;
    }
    const voice = engine.noteVoices.get(note);
    engine.activeNotes.delete(note);
    engine.noteVoices.delete(note);
    if (voice) retireNoteVoice(engine, voice);
    updateLiveVoiceLevels(engine);
    const remaining = Array.from(engine.activeNotes.keys());
    setHeldNotes(remaining);
    setActiveNote(remaining.length > 0 ? remaining[remaining.length - 1] : null);
  }, []);

  const startSequenceNote = useCallback((note: number, velocity = 0.86) => {
    void ensureAudio().then(() => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.sequenceActiveNotes.set(note, clamp(velocity));
      smooth(engine.sequenceOscillator.frequency, frequencyForNote(note), engine.context, 0.016);
      smooth(engine.sequenceSub.frequency, frequencyForNote(note - 12), engine.context, 0.018);
      smooth(engine.sequenceEnvelope.gain, 0.38 * clamp(velocity), engine.context, 0.012);
      smooth(engine.bassRoomEnvelope.gain, 0.55 * clamp(velocity), engine.context, 0.015);
    }).catch(() => setAudioMessage("NO SE PUDO INICIAR EL AUDIO"));
  }, [ensureAudio]);

  const releaseSequenceNote = useCallback((note: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.sequenceActiveNotes.delete(note);
    const remaining = Array.from(engine.sequenceActiveNotes.entries());
    if (remaining.length > 0) {
      const [lastNote, velocity] = remaining[remaining.length - 1];
      smooth(engine.sequenceOscillator.frequency, frequencyForNote(lastNote), engine.context, 0.025);
      smooth(engine.sequenceSub.frequency, frequencyForNote(lastNote - 12), engine.context, 0.025);
      smooth(engine.sequenceEnvelope.gain, 0.38 * velocity, engine.context, 0.02);
      smooth(engine.bassRoomEnvelope.gain, 0.55 * velocity, engine.context, 0.02);
    } else {
      smooth(engine.sequenceEnvelope.gain, 0.0001, engine.context, 0.1);
      smooth(engine.bassRoomEnvelope.gain, 0.0001, engine.context, 0.18);
    }
  }, []);

  const captureNote = useCallback((note: number) => {
    const startedAt = recordingStartedAtRef.current;
    const stepDuration = recordingStepDurationRef.current;
    if (!isRecordingRef.current || startedAt === null || stepDuration <= 0) return;
    const elapsed = performance.now() - startedAt;
    if (elapsed >= stepDuration * 9) return;
    const index = Math.round(elapsed / stepDuration) % 9;
    const nextPattern = recordedNotesRef.current.slice();
    nextPattern[index] = note;
    recordedNotesRef.current = nextPattern;
    setRecordedNotes(nextPattern);
    if (!stepsRef.current[index]) {
      const nextSteps = stepsRef.current.slice();
      nextSteps[index] = true;
      stepsRef.current = nextSteps;
      setSteps(nextSteps);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    if (recordingTimeoutRef.current !== null) {
      window.clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    recordingStartedAtRef.current = null;
    hasRecordingRef.current = true;
    setHasRecording(true);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
      return;
    }
    void ensureAudio().then(() => {
      const emptyPattern: RecordedPattern = Array(9).fill(null);
      recordedNotesRef.current = emptyPattern;
      setRecordedNotes(emptyPattern);
      hasRecordingRef.current = false;
      setHasRecording(false);
      recordingStepDurationRef.current = (60_000 / bpmRef.current) / 2;
      recordingStartedAtRef.current = performance.now();
      sequenceCursorRef.current = 0;
      isRecordingRef.current = true;
      setIsRecording(true);
      setIsSequencing(true);
      setSequenceRun((current) => current + 1);
      recordingTimeoutRef.current = window.setTimeout(stopRecording, recordingStepDurationRef.current * 9);
    }).catch(() => setAudioMessage("NO SE PUDO INICIAR EL AUDIO"));
  }, [ensureAudio, stopRecording]);

  const toggleAudio = useCallback(() => {
    const engine = engineRef.current;
    if (engine && engine.context.state === "running") {
      pressedNotesRef.current.clear();
      engine.activeNotes.clear();
      const voices = Array.from(engine.noteVoices.values());
      engine.noteVoices.clear();
      voices.forEach((voice) => retireNoteVoice(engine, voice));
      engine.sequenceActiveNotes.clear();
      smooth(engine.sequenceEnvelope.gain, 0.0001, engine.context, 0.04);
      smooth(engine.bassRoomEnvelope.gain, 0.0001, engine.context, 0.04);
      smooth(engine.envelope.gain, 0.0001, engine.context, 0.04);
      if (isRecordingRef.current) stopRecording();
      setIsSequencing(false);
      setHeldNotes([]);
      setActiveStep(-1);
      void engine.context.suspend().then(() => {
        setAudioActive(false);
        setActiveNote(null);
        setAudioMessage("AUDIO EN PAUSA");
      });
      return;
    }
    void ensureAudio().then(() => {
      setSequenceRun((current) => current + 1);
      setIsSequencing(true);
    }).catch(() => setAudioMessage("NO SE PUDO INICIAR EL AUDIO"));
  }, [ensureAudio, stopRecording]);

  const refreshMidiInputs = useCallback(() => {
    const access = midiAccessRef.current;
    if (!access || !midiMountedRef.current) return;
    const inputs = Array.from(access.inputs.values()).filter((input) => input.state !== "disconnected").map((input) => ({
      id: input.id,
      name: input.name || "Entrada MIDI",
    }));
    const ids = new Set(inputs.map(({ id }) => id));
    for (const id of connectedMidiIds.current) {
      if (!ids.has(id)) pianoRouting.current?.releaseMidi(id);
    }
    connectedMidiIds.current = ids;
    setMidiInputs(inputs);
    setMidiConnection("ready");
    setMidiMessage(inputs.length > 0 ? "MIDI LISTO · " + inputs.length + " ENTRADA(S)" : "CONECTÁ EL CASIO O LOS FADERS USB");
  }, []);

  const connectMidi = useCallback(async () => {
    const active = midiAccessRef.current;
    if (active) {
      active.onstatechange = refreshMidiInputs;
      refreshMidiInputs();
      return;
    }
    if (midiRequestRef.current) return midiRequestRef.current;
    if (!window.isSecureContext) {
      setMidiConnection("unavailable");
      setMidiMessage("MIDI NECESITA UN CONTEXTO SEGURO");
      return;
    }
    const requestAccess = (navigator as MidiNavigator).requestMIDIAccess;
    if (!requestAccess) {
      setMidiConnection("unavailable");
      setMidiMessage("MIDI NO ESTÁ DISPONIBLE EN ESTE NAVEGADOR");
      return;
    }
    setMidiConnection("checking");
    const request = Promise.resolve().then(() => requestAccess.call(navigator, { sysex: false })).then((access) => {
      if (midiMountedRef.current) {
        midiAccessRef.current = access;
        access.onstatechange = refreshMidiInputs;
        refreshMidiInputs();
      }
    }).catch(() => {
      if (midiMountedRef.current) {
        setMidiConnection("blocked");
        setMidiMessage("PERMISO MIDI NO CONCEDIDO");
      }
    }).finally(() => {
      midiRequestRef.current = null;
    });
    midiRequestRef.current = request;
    return request;
  }, [refreshMidiInputs]);

  useEffect(() => {
    midiMountedRef.current = true;
    void connectMidi();
    return () => {
      midiMountedRef.current = false;
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
      }
    };
  }, [connectMidi]);

  useEffect(() => {
    const access = midiAccessRef.current;
    if (!access || midiInputs.length === 0) return;
    const inputs = Array.from(access.inputs.values()).filter((input) => input.state !== "disconnected");
    const handlers = inputs.map((input) => {
      const onMessage = (event: { data: ArrayLike<number> }) => {
        const status = event.data[0] || 0;
        const first = event.data[1] || 0;
        const second = event.data[2] || 0;
        const kind = status & 0xf0;
        const piano = pianoRouting.current;
        const channel = status & 0x0f;
        if (kind === 0x90 && second > 0) {
          if (piano) piano.midiNote(input.id, channel, first, second / 127);
          else {
            captureNote(first);
            startNote(first, second / 127);
          }
          return;
        }
        if (kind === 0x80 || (kind === 0x90 && second === 0)) {
          if (piano) piano.midiNote(input.id, channel, first, 0);
          else releaseNote(first);
          return;
        }
        if (kind === 0xb0) {
          if (first === 120 || first === 123) piano?.releaseMidi(input.id, channel);
          const waitingFor = midiLearnRef.current;
          if (waitingFor !== null) {
            setCcMap((current) => {
              const next = { ...current };
              Object.keys(next).forEach((key) => {
                const binding = next[Number(key)];
                if (binding && binding.inputId === input.id && binding.cc === first) delete next[Number(key)];
              });
              next[waitingFor] = { inputId: input.id, cc: first };
              ccMapRef.current = next;
              return next;
            });
            midiLearnRef.current = null;
            setMidiLearnFor(null);
            setMidiMessage("FADER " + CONTROLS[waitingFor].number + " · " + (input.name || "ENTRADA MIDI") + " · CC " + first);
            return;
          }
          const mappedIndex = Object.keys(ccMapRef.current).find((key) => {
            const binding = ccMapRef.current[Number(key)];
            return binding?.inputId === input.id && binding.cc === first;
          });
          if (mappedIndex !== undefined) updateControl(Number(mappedIndex), second / 127);
        }
      };
      input.onmidimessage = onMessage;
      return { input, onMessage };
    });
    return () => {
      handlers.forEach(({ input, onMessage }) => {
        if (input.onmidimessage === onMessage) input.onmidimessage = null;
      });
    };
  }, [captureNote, midiInputs, releaseNote, startNote, updateControl]);

  useEffect(() => {
    const keyMap: Record<string, number> = {
      a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66,
      g: 67, y: 68, h: 69, u: 70, j: 71, k: 72,
    };
    const held = new Set<string>();
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const key = event.key.toLowerCase();
      const note = keyMap[key];
      if (note === undefined || held.has(key) || event.repeat) return;
      const piano = pianoRouting.current;
      if (piano) {
        if (target?.closest("input, select, textarea, [contenteditable=true]") || event.altKey || event.ctrlKey || event.metaKey) return;
        piano.computerNote(event.code || key, note, true);
        return;
      }
      if (target && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(target.tagName)) return;
      held.add(key);
      captureNote(note);
      startNote(note);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const note = keyMap[key];
      if (note === undefined) return;
      const wasHeld = held.delete(key);
      const piano = pianoRouting.current;
      piano?.computerNote(event.code || key, note, false);
      if (!piano || wasHeld) releaseNote(note);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [captureNote, releaseNote, startNote]);

  useEffect(() => {
    if (!isSequencing) {
      setActiveStep(-1);
      return;
    }
    const duration = (60_000 / bpmRef.current) / 2;
    const tick = () => {
      const cursor = sequenceCursorRef.current;
      const step = cursor % 9;
      const cycle = Math.floor(cursor / 9);
      const section = Math.floor(cycle / 10) % PHRASES.length;
      if (!hasRecordingRef.current && !isRecordingRef.current && section !== phraseIndexRef.current) {
        phraseIndexRef.current = section;
        setPhraseIndex(section);
      }
      setActiveStep(step);
      const engine = engineRef.current;
      if (engine && engine.context.state === "running") playRhythm(engine, step, cycle, section);
      if (stepsRef.current[step]) {
        const note = hasRecordingRef.current ? recordedNotesRef.current[step] : 48 + PHRASES[phraseIndexRef.current][step];
        if (note !== null) {
          startSequenceNote(note, 0.9);
          window.setTimeout(() => releaseSequenceNote(note), Math.max(100, duration * 0.72));
        }
      }
      sequenceCursorRef.current = cursor + 1;
    };
    tick();
    const timer = window.setInterval(tick, duration);
    return () => {
      window.clearInterval(timer);
      const engine = engineRef.current;
      if (engine) {
        engine.sequenceActiveNotes.clear();
        smooth(engine.sequenceEnvelope.gain, 0.0001, engine.context, 0.04);
        smooth(engine.bassRoomEnvelope.gain, 0.0001, engine.context, 0.04);
      }
    };
  }, [bpm, isSequencing, sequenceRun, releaseSequenceNote, startSequenceNote]);

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
      if (recordingTimeoutRef.current !== null) window.clearTimeout(recordingTimeoutRef.current);
    };
  }, []);

  const handleBpmChange = (nextBpm: number) => {
    bpmRef.current = nextBpm;
    setBpm(nextBpm);
    const engine = engineRef.current;
    if (engine) applyControl(engine, 7, valuesRef.current[7], nextBpm);
  };

  useEffect(() => {
    try {
      const savedPresets = localStorage.getItem("860-multiversos-presets");
      if (savedPresets) {
        const parsed: unknown = JSON.parse(savedPresets);
        if (Array.isArray(parsed)) {
          const validPresets = parsed.filter(isScenePreset);
          if (validPresets.length > 0) {
            presetsRef.current = validPresets;
            setPresets(validPresets);
            return;
          }
        }
      }
      const savedScene = localStorage.getItem("860-multiversos-escena");
      const legacy = savedScene ? JSON.parse(savedScene) as SceneSnapshot : {};
      const initialPreset: ScenePreset = {
        id: "preset-timbre-captura-860",
        title: "Timbre de la captura",
        savedAt: Date.now(),
        values: Array.isArray(legacy.values) && legacy.values.length === 9
          ? legacy.values.map((value) => clamp(value))
          : INITIAL_VALUES.slice(),
        bpm: typeof legacy.bpm === "number" ? Math.min(150, Math.max(70, legacy.bpm)) : 106,
        steps: Array.isArray(legacy.steps) && legacy.steps.length === 9
          ? legacy.steps.map((step) => step === true)
          : INITIAL_STEPS.slice(),
        recordedNotes: Array.isArray(legacy.recordedNotes) && legacy.recordedNotes.length === 9
          ? legacy.recordedNotes.map((note) => typeof note === "number" && Number.isInteger(note) && note >= 0 && note <= 127 ? note : null)
          : Array(9).fill(null),
        hasRecording: legacy.hasRecording === true,
      };
      const initialPresets = [initialPreset];
      localStorage.setItem("860-multiversos-presets", JSON.stringify(initialPresets));
      presetsRef.current = initialPresets;
      setPresets(initialPresets);
    } catch {
      const fallback: ScenePreset = {
        id: "preset-timbre-captura-860",
        title: "Timbre de la captura",
        savedAt: Date.now(),
        values: INITIAL_VALUES.slice(),
        bpm: 106,
        steps: INITIAL_STEPS.slice(),
        recordedNotes: Array(9).fill(null),
        hasRecording: false,
      };
      presetsRef.current = [fallback];
      setPresets([fallback]);
    }
  }, []);

  const beginMidiLearn = (index: number) => {
    midiLearnRef.current = index;
    setMidiLearnFor(index);
    setMidiMessage("MOVÉ EL FADER PARA ASIGNAR " + CONTROLS[index].number);
  };

  const toggleStep = (index: number) => {
    setSteps((current) => {
      const next = current.slice();
      next[index] = !next[index];
      stepsRef.current = next;
      return next;
    });
  };

  const applyScene = (scene: SceneSnapshot) => {
    if (Array.isArray(scene.values) && scene.values.length === 9) {
      scene.values.forEach((value, index) => updateControl(index, clamp(value)));
    }
    if (typeof scene.bpm === "number" && Number.isFinite(scene.bpm)) {
      handleBpmChange(Math.min(150, Math.max(70, scene.bpm)));
    }
    if (Array.isArray(scene.steps) && scene.steps.length === 9 && scene.steps.every((step) => typeof step === "boolean")) {
      const nextSteps = scene.steps.slice();
      setSteps(nextSteps);
      stepsRef.current = nextSteps;
    }
    const restoredPattern: RecordedPattern = Array.isArray(scene.recordedNotes) && scene.recordedNotes.length === 9
      ? scene.recordedNotes.map((note) => typeof note === "number" && Number.isInteger(note) && note >= 0 && note <= 127 ? note : null)
      : Array(9).fill(null);
    const restoredHasRecording = scene.hasRecording === true
      && Array.isArray(scene.recordedNotes)
      && scene.recordedNotes.length === 9;
    recordedNotesRef.current = restoredPattern;
    setRecordedNotes(restoredPattern);
    hasRecordingRef.current = restoredHasRecording;
    setHasRecording(restoredHasRecording);
  };

  const openPresetForm = () => {
    setPresetNameDraft("");
    setPresetFormOpen(true);
  };

  const saveNamedPreset = () => {
    const title = presetNameDraft.trim();
    if (!title) {
      setSavedMessage("ESCRIBÍ UN NOMBRE PARA EL PRESET");
      return;
    }
    const preset: ScenePreset = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      title,
      savedAt: Date.now(),
      values: valuesRef.current.slice(),
      bpm: bpmRef.current,
      steps: stepsRef.current.slice(),
      recordedNotes: recordedNotesRef.current.slice(),
      hasRecording: hasRecordingRef.current,
    };
    const next = [preset, ...presetsRef.current];
    try {
      localStorage.setItem("860-multiversos-presets", JSON.stringify(next));
      localStorage.setItem("860-multiversos-escena", JSON.stringify(preset));
      presetsRef.current = next;
      setPresets(next);
      setPresetFormOpen(false);
      setPresetNameDraft("");
      setSavedMessage("PRESET GUARDADO · " + title.toUpperCase());
      window.setTimeout(() => setSavedMessage(""), 2400);
    } catch {
      setSavedMessage("NO SE PUDO GUARDAR EL PRESET");
    }
  };

  const restoreScene = () => {
    try {
      const saved = localStorage.getItem("860-multiversos-escena");
      if (!saved) {
        setSavedMessage("TODAVÍA NO HAY ESCENA GUARDADA");
        window.setTimeout(() => setSavedMessage(""), 1800);
        return;
      }
      const scene = JSON.parse(saved) as SceneSnapshot;
      applyScene(scene);
      setSavedMessage("ESCENA RECUPERADA");
      window.setTimeout(() => setSavedMessage(""), 1800);
    } catch {
      setSavedMessage("NO SE PUDO RECUPERAR");
    }
  };

  const loadPreset = (preset: ScenePreset) => {
    applyScene(preset);
    setSavedMessage("PRESET CARGADO · " + preset.title.toUpperCase());
    window.setTimeout(() => setSavedMessage(""), 2400);
  };


  const recordedCount = recordedNotes.filter((note) => note !== null).length;

  return (
    <main className={styles.console}>
      <ModuleZero pianoRouting={pianoRouting} connectMidi={connectMidi} midiConnection={midiConnection} midiInputs={midiInputs} />
      <header className={styles.topbar}>
        <a className={styles.brand} href="/" aria-label="UnderTango Club, inicio">
          <span className={styles.brandMark}>&#9670;</span>
          <span className={styles.brandText}>UNDER TANGO CLUB<small>LABORATORIO SONORO</small></span>
        </a>
        <div className={styles.topbarRight}>
          <span className={styles.liveDot} />
          <span className={styles.topbarCode}>PROYECTO 860 <b>·</b> EXPERIMENTO 01</span>
        </div>
      </header>

      <div className={styles.world} aria-label="Espacio visual generativo">
        <canvas ref={canvasRef} className={styles.canvas} aria-label="Constelación visual que reacciona al sonido" role="img" />
        <div className={styles.worldShade} />
        <div className={styles.worldTopline}>
          <span>RUIDO <i>+</i> VCO / VCA <i>+</i> FILTRO</span>
          <span className={styles.worldState}><b /> SÍNTESIS EN TIEMPO REAL</span>
        </div>
        <div className={styles.worldTitle}>
          <p className={styles.eyebrow}>UNA MÁQUINA PARA ABRIR UNIVERSOS</p>
          <h1><span>860</span><br />MULTIVERSOS</h1>
          <p className={styles.worldDescription}>Mové una frecuencia.<br />Mirá qué mundo aparece.</p>
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
        <span>ARRASTRÁ · TOCÁ · CONECTÁ</span>
      </div>

      <section className={styles.deck} aria-labelledby="deck-heading">
        <div className={styles.deckHeader}>
          <div>
            <p className={styles.eyebrow}>CONTROL DE SÍNTESIS <span>·</span> 09 CANALES</p>
            <h2 id="deck-heading">El tablero <em>multiversal.</em></h2>
            <p className={styles.deckIntro}>Cada fader abre una dimensión. Arrancamos con la arquitectura que ya probamos y seguimos afinando el mapa.</p>
          </div>
          <div className={styles.sceneActions}>
            <span className={styles.savedMessage} aria-live="polite">{savedMessage}</span>
            <button type="button" className={styles.textButton} onClick={restoreScene}>RECUPERAR</button>
            <button type="button" className={styles.textButton} onClick={openPresetForm}>GUARDAR ESCENA</button>
          </div>
        </div>

        <div className={styles.controlBay}>
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
                    aria-label={"Dimensión " + control.number + ": " + control.name}
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
                    {midiLearnFor === index ? "MOVÉ" : "APRENDER"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className={styles.presetPanel} aria-labelledby="preset-heading">
          <div className={styles.presetHeader}>
            <div>
              <p className={styles.eyebrow}>MEMORIA DE TIMBRES</p>
              <h3 id="preset-heading">Presets <span>{String(presets.length).padStart(2, "0")}</span></h3>
            </div>
          </div>
          {presetFormOpen && (
            <form
              className={styles.presetForm}
              onSubmit={(event) => {
                event.preventDefault();
                saveNamedPreset();
              }}
            >
              <label htmlFor="preset-title">TÍTULO DE LA ESCENA</label>
              <input
                id="preset-title"
                type="text"
                maxLength={40}
                value={presetNameDraft}
                onChange={(event) => setPresetNameDraft(event.target.value)}
                placeholder="Ej. Nube de madrugada"
                autoFocus
              />
              <div className={styles.presetFormActions}>
                <button type="button" className={styles.textButton} onClick={() => setPresetFormOpen(false)}>CANCELAR</button>
                <button type="submit" className={styles.presetSaveButton}>GUARDAR</button>
              </div>
            </form>
          )}
          <div className={styles.presetList} aria-live="polite">
            {presets.map((preset) => (
              <article className={styles.presetItem} key={preset.id}>
                <div className={styles.presetItemInfo}>
                  <strong>{preset.title}</strong>
                  <small>{preset.bpm} BPM <i>·</i> 9 FADERS</small>
                </div>
                <button type="button" className={styles.presetLoadButton} onClick={() => loadPreset(preset)}>CARGAR</button>
              </article>
            ))}
          </div>
          <p className={styles.presetHint}>Guarda y recupera el timbre, tempo y secuencia de cada escena.</p>
        </aside>
        </div>

        <div className={styles.playSurface}>
          <div className={styles.sequencePanel}>
            <div className={styles.sequenceHeader}>
              <div>
                <p className={styles.eyebrow}>RELOJ / FRASE CÍCLICA</p>
                <h3>Secuencia <em>de nueve.</em></h3>
              </div>
              <div className={styles.sequenceActions}>
                <button
                  type="button"
                  className={isRecording ? styles.stopButton : styles.sequenceButton}
                  onClick={startRecording}
                  aria-pressed={isRecording}
                >
                  {isRecording ? "PARAR REC" : "GRABAR"}
                </button>
                <button
                  type="button"
                  className={isSequencing ? styles.stopButton : styles.sequenceButton}
                  onClick={() => {
                    if (isSequencing) {
                      if (isRecordingRef.current) stopRecording();
                      setIsSequencing(false);
                    } else {
                      void ensureAudio().then(() => {
                        setSequenceRun((current) => current + 1);
                        setIsSequencing(true);
                      });
                    }
                  }}
                >
                  {isSequencing ? "DETENER" : "INICIAR"}
                </button>
              </div>
            </div>
            <div className={styles.steps} aria-label="Secuenciador de nueve pasos">
              {steps.map((enabled, index) => {
                const note = hasRecording || isRecording ? recordedNotes[index] : enabled ? 48 + PHRASES[phraseIndex][index] : null;
                return (
                  <button
                    type="button"
                    key={index}
                    className={[styles.step, enabled ? styles.stepEnabled : "", activeStep === index ? styles.stepCurrent : ""].filter(Boolean).join(" ")}
                    onClick={() => toggleStep(index)}
                    aria-label={"Paso " + (index + 1) + (enabled ? ", activo" : ", apagado") + (note === null ? "" : ", nota " + noteName(note))}
                    aria-pressed={enabled}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small className={styles.stepNote}>{note === null ? "—" : noteName(note)}</small>
                    <i />
                  </button>
                );
              })}
            </div>
            <p className={styles.recordStatus} aria-live="polite">
              {isRecording
                ? "REC · " + recordedCount + (recordedCount === 1 ? " NOTA" : " NOTAS") + " · TOCÁ EN LOS 9 PASOS"
                : hasRecording
                  ? "BUCLE GRABADO · " + recordedCount + (recordedCount === 1 ? " NOTA" : " NOTAS") + " · " + (isSequencing ? "EN LOOP" : "INICIÁ PARA REPRODUCIR")
                  : "GRABAR CAPTURA UNA VUELTA DE 9 PASOS Y LA REPITE"}
            </p>
            <div className={styles.tempoRow}>
              <span>70</span>
              <input
                type="range"
                min="70"
                max="150"
                value={bpm}
                onChange={(event) => handleBpmChange(Number(event.target.value))}
                aria-label="Tempo en pulsos por minuto"
                disabled={isRecording}
              />
              <span>150</span>
              <strong>{bpm}<small> BPM</small></strong>
            </div>
          </div>

          <div className={styles.keyboardPanel}>
            <div className={styles.keyboardHeader}>
              <div>
                <p className={styles.eyebrow}>ENTRADA EXTERNA</p>
                <h3>Casio + faders <em>/ MIDI.</em></h3>
              </div>
              {midiConnection === "blocked" && <a href="#zero-midi" className={styles.connectButton}>PERMISO MIDI</a>}
            </div>
            <p className={styles.midiMessage} aria-live="polite">{midiMessage}</p>
            {midiInputs.length > 0 && (
              <div className={styles.midiDevices} aria-label="Entradas MIDI conectadas">
                <span className={styles.midiDevicesLabel}>ENTRADAS ACTIVAS</span>
                {midiInputs.map((input) => (
                  <span className={styles.midiDevice} key={input.id}>{input.name}</span>
                ))}
              </div>
            )}
            <div className={styles.keybed} aria-label="Teclado virtual de una octava">
              {PIANO_KEYS.map((key) => (
                <button
                  type="button"
                  key={key.note}
                  className={[
                    styles.pianoKey,
                    key.black ? styles.blackKey : styles.whiteKey,
                    heldNotes.includes(key.note) ? styles.keyPressed : "",
                  ].filter(Boolean).join(" ")}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    captureNote(key.note);
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
            <p className={styles.keyboardHint}>Casio y faders USB MIDI, o probá con A W S E D F T G Y H U J K.</p>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>&#9670; UNDER TANGO CLUB <i>/</i> 860 MULTIVERSOS</span>
        <span>{midiInputs.length > 0 ? "MIDI ACTIVO · " + midiInputs.length + " DISPOSITIVO(S)" : "PROTOTIPO SONORO · AUDIO Y VISUALES GENERATIVOS"}</span>
      </footer>
    </main>
  );
}
