"use client";

import { useSavedSetting } from "./saved-setting";
import { PIANO_KEYS as computerPianoKeys, type CcBinding } from "./control-map";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";
import { frequencyPoint, OCTAVE_NOTES, ORIGINAL_NOTES, tuningAt, type FrequencyVector } from "./frequency-tuning";
import { sceneNoiseBuffers, scheduleContinuationAudio } from "./scene-audio";
import { collideIntoPitch, collisionTiming, loadQuestion, NOISE_KEYS, OPENING_QUESTION, pointTiming, speakQuestion, universeStrikeWeight, whiteOverture, WAVE_SECONDS, type PointStrike, type StrikeLog } from "./opening-sound";
import { openingFraction, CollisionReadout, OpeningProjection } from "./opening-projection";
import { CONTINUATION_SCENES, DEFAULT_PAIR, NOISE_COLORS, NOISE_IDS, type ContinuationScene, type NoiseColor, type NoisePair } from "./scene-cues";
import { ContinuationProjection } from "./scene-visuals";
import { FIRST_MIDI_NOTE, NOTE_SCENES, NOTE_SCENE_IDS, isNoteScene, type NoteScene, type PerformanceInput } from "./performance-notes";
import { PerformanceProjection, usePerformanceInput } from "./performance-view";
import { usePausedSceneOutput } from "./paused-scene-output";
import { useEarlyInstrument } from "./early-instrument";
import { LiveChordTimeline } from "./chord-loop-view";
import { EXTENDED_DEFAULT_SECONDS, EXTENDED_SCENES, isLiveSetScene, isTimbreScene, type ExtendedScene } from "./extended-scenes";
import { SHOW_OPENING, SHOW_SCENE_COUNT, SHOW_SCORE, SHOW_TRANSITIONS, type CodaScene } from "./show-score";
import { durationBounds, editShowDuration, resolveShowDurations } from "./show-durations";
import { previousSceneDurations } from "./previous-durations";
import { CodaProjection } from "./coda-projection";
import { ExtendedPerformanceControls, ExtendedPerformanceProjection, isPlayableExtendedScene, useExtendedPerformance } from "./extended-performance";
import { TypeProjection } from "./type-projection";
import { AudienceProjection } from "./audience-projection";
import { ScoreTrack, PrimeraVoluntad } from "./primera-voluntad";
import { hasReferenceVisual, ReferenceVisual } from "./reference-visuals";
import { ExtendedArt, useExtendedArtAudio } from "./extended-art";
import { protectPeaks, SPEAKER_CEILING } from "./peak-protection";
import { hasScoredTake } from "./layer-take";
import { useTempo, TempoProvider } from "./tempo";
import { SceneMixer } from "./scene-mixer";
import { SceneVideo, sceneFilms } from "./scene-video";
import { usesSceneKeyboard } from "./scene-instrument";
import { DjConsole } from "./dj-console";
import { DJ_CONTROL, herculesCommand, isInpulse200, type DjCommand } from "./dj-midi";
import { VOICE_CUES } from "./voice-loop";
import { ProjectionSignalContext, useProjectionSignals, useSceneSignals } from "./projection-signals";
import { StimulusBar } from "./stimulus-bar";
import { warmRecorder } from "./measure-recorder";
import { TransportMidiButton, useTransportMidi } from "./transport-midi";
import { MIDI_REASSIGNMENT, reassignMidi, type MidiReassignment } from "./midi-reassignment";
import { EXTENDED_STYLE } from "./extended-style";

import { monitorMidiInputs, type MidiInputLike, type MidiDevice } from "./midi-inputs";

const MASTER_FADER = -1;

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

type FrequencyPoint = [x: number, y: number];

const FREQUENCY_VIEW = { width: 640, height: 360, x: 320, y: 180, yaw: 0.64, tilt: 0.62, scale: 102 };
const FREQUENCY_STOP_YAW = FREQUENCY_VIEW.yaw + 1.72;
const FREQUENCY_TRAIL_TRAVEL = 580;
const FREQUENCY_TRAIL_TURN_SECONDS = SHOW_TRANSITIONS.trailTurn;
function scoreTime(seconds: number) {
  const rounded = Math.round(seconds);
  return Math.floor(rounded / 60) + ":" + String(rounded % 60).padStart(2, "0");
}

function ScoreStopwatch({ clock, beginsAt, offset, total, paused }: {
  clock: AudioContext | null; beginsAt: number; offset: number; total: number; paused: boolean;
}) {
  const [seconds, setSeconds] = useState(0);
  useLayoutEffect(() => {
    let timer: number | undefined;
    function update() {
      const now = clock?.currentTime ?? 0;
      const position = clock ? Math.min(total, offset + Math.max(0, now - beginsAt)) : 0;
      const whole = Math.floor(position);
      setSeconds(whole);
      if (clock && !paused && whole < total) {
        const nextTick = beginsAt + whole + 1 - offset;
        timer = window.setTimeout(update, Math.max(20, (nextTick - now) * 1000));
      }
    }
    update();
    return () => window.clearTimeout(timer);
  }, [clock, beginsAt, offset, total, paused]);
  return <span className="zero-stopwatch" role="timer" aria-label="Tiempo transcurrido de la obra">
    {scoreTime(seconds).padStart(5, "0")}
  </span>;
}

function temporalTrailFrame(progress: number, roll: number, width: number) {
  const travel = FREQUENCY_TRAIL_TRAVEL + .75 * Math.max(0, width - FREQUENCY_VIEW.width);
  // Move the inherited figure to the left, then keep the first sample there as the take grows rightward.
  const pivot = travel / 2 * smoothSceneLight(progress / .12);
  const extent = Math.max(pivot, travel * progress - pivot);
  const horizontalFit = (width / 2 - 28) / (180 + extent * Math.cos(roll));
  const verticalFit = 170 / (170 + extent * Math.sin(roll));
  return { travel, pivot, zoom: Math.min(1, horizontalFit, verticalFit) };
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
uniform float u_travel;
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
  point.x += a_sample.w * u_travel - u_pivot;
  point = rotate(point);
  gl_Position = vec4(point.xy * u_projection, -0.13 * point.z, 1.0);
  v_normal = rotate(camera(normal));
  v_hue = clamp(a_path.x / 6.2831853 * 0.86 + a_sample.w * 0.373, 0.0, 1.0);
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
  const travelLocation = gl.getUniformLocation(program, "u_travel");
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
    paint(count: number, progress: number, lift: number, spin: number, width: number) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      const roll = lift * Math.PI / 2;
      const frame = temporalTrailFrame(progress, roll, width);
      gl.uniform4f(rotation, Math.cos(roll), Math.sin(roll), Math.cos(spin), Math.sin(spin));
      gl.uniform1f(travelLocation, frame.travel / FREQUENCY_VIEW.scale);
      gl.uniform1f(pivot, frame.pivot / FREQUENCY_VIEW.scale);
      gl.uniform2f(projection,
        FREQUENCY_VIEW.scale * frame.zoom * 2 / width,
        FREQUENCY_VIEW.scale * frame.zoom * 2 / FREQUENCY_VIEW.height);
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
  const [viewWidth, setViewWidth] = useState(FREQUENCY_VIEW.width);
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
      instances.set([x / 111, y / 111, z / 111, phase], index * 4);
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, nextStamp = 0, raisedAt: number | null = null;
    let last = -Infinity, previousProgress = -1, previousTime = -1, resized = true;
    let width = FREQUENCY_VIEW.width;
    const resize = () => {
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * density));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * density));
      width = FREQUENCY_VIEW.height * canvas.width / canvas.height;
      setViewWidth(width);
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
      renderer.paint(visibleCount, current, lift, spin, width);
    };
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.dispose();
    };
  }, [clock, durationMs, frozenAtEnd, intervalMs]);

  const notes = tuningAt(progress).map((value) => FREQUENCY_FORMAT.format(value) + " Hz").join(" · ");
  const { travel, pivot, zoom } = temporalTrailFrame(progress, 0, viewWidth);
  const elapsed = Math.floor(progress * durationMs / 1000);
  const axisWidth = travel * progress * zoom * 100 / viewWidth;
  return <div className={unavailable ? "zero-frequency-space" : "zero-frequency-space zero-temporal-trail"}>
    {unavailable
      ? <><FrequencySpace opacity={1} yaw={FREQUENCY_STOP_YAW} /><p className="zero-trail-fallback" role="status">La estela rotatoria requiere WebGL 2.</p></>
      : <canvas ref={canvasRef} role="img" aria-label="Estela tridimensional de fotogramas opacos que se eleva y gira al completarse" />}
    {!unavailable && !frozenAtEnd && progress < 1 && axisWidth >= 6 && <div className="zero-trail-axis" aria-hidden="true"
      style={{ left: `${50 - pivot * zoom * 100 / viewWidth}%`, width: `${axisWidth}%` }}>
      <span>0 s · {ORIGINAL_NOTES.join(" · ")} Hz</span><span>{elapsed} s · {notes}</span>
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
const SCENE_TIME_DEFAULT_SAMPLE_MS = 250;

function smoothSceneLight(progress: number) {
  const t = Math.max(0, Math.min(1, progress));
  return t * t * (3 - 2 * t);
}

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
        if ((light.ambient === 0 && light.emission === 0) || (light.emission === 1 && light.wash === 1)) return;
        const scale = Math.min(width, height) * 0.315;
        const cy = Math.cos(yaw + drag.yaw), sy = Math.sin(yaw + drag.yaw);
        const cx = Math.cos(pitch + drag.pitch), sx = Math.sin(pitch + drag.pitch);
        context.translate(width / 2, height / 2);
        context.rotate(-roll);
        context.scale(scale, scale);
        const facing = Math.sign(cy * cx) || 1;
        for (let slice = 0; slice <= 16; slice++) {
          const z = facing * .145 * (slice / 8 - 1);
          context.save();
          context.transform(cy, -sx * sy, 0, cx, sy * z, sx * cy * z);
          const metal = slice === 16 ? 194 + 28 * Math.abs(cy * cx) : 85 + 52 * slice / 16;
          const silver = Math.round(metal * light.ambient * (1 - light.emission) + 255 * light.emission);
          context.fillStyle = `rgb(${silver}, ${silver}, ${silver})`;
          context.fill(outline, "evenodd");
          context.restore();
        }
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

function EmptySetScene({ durationMs, cue, paused }: {
  durationMs: number;
  cue: SceneZeroCue;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orientation = useRef<SceneZeroDrag>({ yaw: 0, pitch: 0 });
  const signals = useProjectionSignals();
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
      const wash = smoothSceneLight((progress - .72) / .24);
      const light = { ambient: smoothSceneLight((progress - .035) / .53), emission: wash, wash };
      const seconds = movementSeconds.current;
      // Independent periods make the trajectory vary without jumps or a short repeating cycle.
      const variation = (frequency: number, phase: number) => Math.sin(seconds * frequency + phase) - Math.sin(phase);
      renderer.paint(light, [
        -.66 + .63 * smoothSceneLight(progress / .6) + .20 * variation(.29, phaseY),
        .16 + .12 * variation(.31, phaseX),
        -.10 + .09 * variation(.24, phaseZ),
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
      if (progress < 1 && !paused) schedulePaint();
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
  }, [durationMs, cue, rotate, paused]);

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
      if (speed > 0) signals.current.gesture = 1;
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
      signals.current.gesture = 1;
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
type TunedVoice = { frequency: AudioParam; stop: (when: number) => void };

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

async function resumeAudioOutput(context: AudioContext) {
  await Promise.all([context.resume(), warmRecorder(context)]);
  const previousTime = context.currentTime;
  // Wait for the output to render on the recorder's audio thread before exposing the first beat.
  while (context.state === "running" && context.currentTime === previousTime) {
    await new Promise<void>(resolve => window.setTimeout(resolve, 12));
  }
}

function NoteComet({attack}: {attack: {current: {count:number; frequency:number; velocity:number}}}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const layer = canvas.current, pen = layer?.getContext("2d");
    if (!layer || !pen) return;
    let frame = 0, last = attack.current.count;
    const tails: {born:number; y:number; hue:number; strength:number}[] = [];
    function draw(now:number) {
      if (!layer || !pen) return;
      const w = layer.clientWidth, h = layer.clientHeight;
      if (layer.width !== w || layer.height !== h) { layer.width = w; layer.height = h; }
      pen.clearRect(0,0,w,h);
      const hit = attack.current;
      if (hit.count !== last) {
        last = hit.count;
        const pitch = Math.log2(Math.max(111, hit.frequency)/111);
        tails.push({born:now,y:.78-.09*pitch,hue:(pitch*110)%360,strength:hit.velocity});
      }
      while (tails.length && now-tails[0].born > 1600) tails.shift();
      for (const tail of tails) {
        const age = (now-tail.born)/1600;
        for (let i=31;i>=0;i--) {
          const t = age-i*.006;
          if (t<0) continue;
          const power = (1-age)*(1-i/33);
          const x = w*(.10+.82*t), y = h*(tail.y+.045*Math.sin(10*t+tail.hue));
          pen.fillStyle = 'hsla('+ (tail.hue+i*3) +',95%,60%,'+power+')';
          pen.beginPath(); pen.arc(x,y,1+power*(3+5*tail.strength),0,2*Math.PI); pen.fill();
        }
      }
      frame = requestAnimationFrame(draw);
    }
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  },[attack]);
  return <canvas ref={canvas} aria-hidden="true" style={{position:"absolute",bottom:"8%",left:0,width:"100%",height:"25%",pointerEvents:"none",zIndex:4}} />;
}

function OpeningFilm({cue, output, controls, strikes, inside, paused, finish}: {
  cue: SceneZeroCue; output: GainNode; controls: HTMLDivElement | null; strikes: StrikeLog;
  inside: boolean; paused: boolean; finish: () => void;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const envelope = useRef({fraction: 0, closing: false, elapsed: 0, filmTime: 0});
  const clock = cue.context;
  const filmCue = useMemo(() => ({context: clock, beginsAt: clock.currentTime - envelope.current.filmTime}), [clock]);
  useLayoutEffect(() => {
    const node = layer.current;
    if (!node) return;
    const state = envelope.current;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let last = performance.now(), frame = 0;
    const draw = (now: number) => {
      const dt = paused ? 0 : (now - last) / 1000;
      last = now;
      state.filmTime += dt;
      if (!state.closing && inside) state.fraction = openingFraction(strikes.current, still);
      if (!inside && !state.closing) {
        state.fraction = Math.min(1, state.fraction + dt / 8);
        node.style.clipPath = "circle(" + (Math.SQRT1_2 * 100 * state.fraction ** .78) + "% at center)";
      }
      if (state.fraction >= 1) state.closing = true;
      if (state.closing) {
        state.elapsed += dt;
        const t = Math.min(1, state.elapsed / 4);
        const scale = 1 - t * t;
        node.style.transform = "scale(" + scale + ")";
        node.style.opacity = String(1 - t ** 4);
        if (!inside) node.style.clipPath = "circle(" + (72 * state.fraction ** .78) + "% at center)";
        if (t === 1 || state.fraction === 0) { finish(); return; }
      }
      frame = requestAnimationFrame(draw);
    };
    draw(last);
    return () => cancelAnimationFrame(frame);
  }, [inside, paused, strikes, finish]);
  return <div ref={layer} style={{position:"absolute", inset:0, zIndex:-1, pointerEvents:"none"}}>
    <SceneVideo film={sceneFilms.get(1)!} cue={filmCue} output={output} controls={controls} paused={paused} />
  </div>;
}

function ModuleZero({ firstMidi, calibration, toggleCalibration, masterVolume, setMasterVolume, learnFader, learningFader, faderBinding, faderSignal, pianoRouting, connectMidi, midiConnection, midiInputs }: {
  firstMidi: number; calibration: boolean; toggleCalibration: () => void; masterVolume: number; setMasterVolume: (value: number) => void; learnFader: () => void; learningFader: boolean; faderBinding?: CcBinding; faderSignal: string;
  pianoRouting: { current: PerformanceInput | null };
  connectMidi: (rescan?: boolean) => Promise<void>;
  midiConnection: MidiConnection;
  midiInputs: MidiDevice[];
}) {
  const [stage, setStage] = useState<keyof typeof MODULE_ZERO_SCENE_BY_STAGE | ExtendedScene>("ready");
  const [scanState, setScanState] = useState<"idle" | "busy" | "done">("idle");
  const transportMidi = useTransportMidi(connectMidi);
  const faderLabel = learningFader ? "Cancelar asignación del fader" : faderBinding ? "Reasignar fader al volumen" : "Asignar fader al volumen";
  const activeScene = typeof stage === "number" ? stage : MODULE_ZERO_SCENE_BY_STAGE[stage];
  const noteScene = typeof activeScene === "string" && isNoteScene(activeScene) ? activeScene : null;
  const extendedScene = typeof stage === "number" ? stage : null;
  const extendedPlaying = isPlayableExtendedScene(extendedScene);
  const [showSubtitles, setShowSubtitles] = useSavedSetting("showSubtitles", false);
  const [djAutomatic, setDjAutomatic] = useSavedSetting("djScoreEnabled", true);
  const [showStopwatch, setShowStopwatch] = useSavedSetting("showStopwatch", false);
  const [filmControls, setFilmControls] = useState<HTMLDivElement | null>(null);
  const strikes = useRef<StrikeLog["current"]>({hits: [], energy: 0});
  const [voiceUnavailable, setVoiceUnavailable] = useState(false);

  const [savedSeconds, setSavedSeconds] = useSavedSetting<number[]>("sceneSeconds112", () => previousSceneDurations() ?? SHOW_SCORE.map(cue => cue.seconds));
  const {bpm: scoreBpm} = useTempo();
  const takeSeconds = 16 * 60 / scoreBpm;
  const durations = useMemo(() => resolveShowDurations(savedSeconds).map((seconds,scene) =>
    hasScoredTake(scene) ? Math.round(2*takeSeconds) : seconds), [savedSeconds,takeSeconds]);
  const [finishedTake,setFinishedTake] = useState<SceneZeroCue|null>(null);
  const limits = useMemo(() => durations.map((_,i) => durationBounds(i,durations)), [durations]);
  const [previousTimes] = useState(previousSceneDurations);
  const [restFraction, setRestFraction] = useSavedSetting("restFraction111", 0.4);
  const [splitNote, setSplitNote] = useSavedSetting("splitNote", FIRST_MIDI_NOTE);
  const [learningSplit, setLearningSplit] = useState(false);
  const editSeconds = (number: number, seconds: number) => setSavedSeconds(current =>
    editShowDuration(number, seconds, resolveShowDurations(current)));
  const [zeroSeconds, oneSeconds, twoSeconds, spaceSeconds] = durations;
  const timeSeconds = durations[4] - SHOW_TRANSITIONS.trailTurn;
  const restSeconds = Math.max(1, Math.min(durations[9] - 1, Math.round(durations[9] * restFraction)));
  const continuationSeconds = {cross: durations[5], sphere: durations[6], noise: durations[7], return: durations[8], breath: durations[9] - restSeconds};
  const noteSeconds = {ten: durations[10], eleven: durations[11], twelve: durations[12], thirteen: durations[13], fourteen: durations[14]};
  const extendedSeconds = useMemo(() => Object.fromEntries(EXTENDED_SCENES.map(number => [number, durations[number]])), [durations]);
  const [noisePair, setNoisePair] = useSavedSetting<NoisePair>("noisePair", DEFAULT_PAIR);
  const [playingNoisePair, setPlayingNoisePair] = useState<NoisePair>(DEFAULT_PAIR);
  const [timeSamplingMs, setTimeSamplingMs] = useSavedSetting("timeSamplingMs", SCENE_TIME_DEFAULT_SAMPLE_MS);
  const [crossSamplingMs, setCrossSamplingMs] = useSavedSetting("crossSamplingMs", 250);
  const [activeSamplingMs, setActiveSamplingMs] = useState(SCENE_TIME_DEFAULT_SAMPLE_MS);
  const [previewMode, setPreviewMode] = useState<ModuleZeroScene | null>(null);
  const [paused, setPaused] = useState(false);
  const [transportBusy, setTransportBusy] = useState(false);
  const [sceneSteps, setSceneSteps] = useState<(-1 | 1)[]>([]);
  const [cue, setCue] = useState<SceneZeroCue | null>(null);
  const [activeDurationMs, setActiveDurationMs] = useState(SCENE_ZERO_DEFAULT_SECONDS * 1000);
  const [scheduledRest, setScheduledRest] = useState<number>(SHOW_OPENING.rest);
  const previousDeadline = useRef<{cue: SceneZeroCue; seconds: number} | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const spiralAnalyser=useRef<AnalyserNode|null>(null);
  const roomAnalyser=useRef<AnalyserNode|null>(null);
  const countingTake = useRef(false);
  const sceneMonitor=useRef<WaveShaperNode|null>(null);
  const mixMaster = useRef<GainNode | null>(null);
  const outputRef = useRef<GainNode | null>(null);
  const masterVolumeRef = useRef(masterVolume);
  const audibleVolumeRef = useRef(masterVolume);
  const timersRef = useRef(new Set<number>());
  const waitingCues = useRef(new Set<() => void>());
  const pausedRef = useRef(false);
  const runRef = useRef(0);
  const learningSplitRef = useRef(false);
  const learnSplit = useCallback((note: number) => {
    if (!learningSplitRef.current || note < 1 || note > 127) return false;
    learningSplitRef.current = false;
    setLearningSplit(false);
    setSplitNote(note);
    return true;
  }, []);
  const scoreClock = cue?.context ?? null;
  const audition = usePausedSceneOutput(paused ? scoreClock : null, masterVolume);
  const manualOutput = activeScene && cue ? (paused ? audition : outputRef.current) : null;
  const extended = useExtendedPerformance(extendedScene, cue?.context ?? null, outputRef, pianoRouting, manualOutput, firstMidi);
  const liveAttack = extended.attack;
  const noteStrike = useCallback((frequency:number, time:number, velocity=.85) => {
    liveAttack.current={count:liveAttack.current.count+1,frequency,velocity};
  },[liveAttack]);
  const directionSeconds = extendedScene ? extendedSeconds[extendedScene] || (EXTENDED_DEFAULT_SECONDS[extendedScene] || 16) : 0;
  useExtendedArtAudio(extendedScene, cue?.context ?? null, cue?.beginsAt ?? 0, directionSeconds, extended.a4, outputRef);
  const earlyScene = typeof activeScene === "string" && !isNoteScene(activeScene) ? activeScene : null;
  const hitPoint = useCallback((hit: PointStrike) => {
    const previous = strikes.current;
    strikes.current = {
      hits: [...previous.hits.filter(p => p.clock === hit.clock && hit.time - p.time < WAVE_SECONDS).slice(-31), hit],
      energy: previous.energy + universeStrikeWeight(hit.velocity),
    };
    liveAttack.current = {count: liveAttack.current.count + 1, frequency: hit.frequency, velocity: hit.velocity};
  }, [liveAttack]);
  useLayoutEffect(() => { strikes.current = {hits: [], energy: 0}; }, [cue]);
  useLayoutEffect(() => { strikes.current.hits = []; }, [paused]);
  useEarlyInstrument(earlyScene, manualOutput, cue?.beginsAt ?? 0, activeDurationMs / 1000, playingNoisePair, scoreClock, pianoRouting, hitPoint);
  const noteInput = usePerformanceInput({
    firstMidi, scene: noteScene, ownsInput: noteScene !== null || stage === "preparing", splitNote, learnSplit,
    output: manualOutput, routing: pianoRouting, onStrike: noteStrike,
  });
  const enterNumberedScene = useCallback((mode: NumberedScene, context: AudioContext, asPreview: boolean, beginsAt = context.currentTime) => {
    setCue({ context, beginsAt });
    setPreviewMode(asPreview ? mode : null);
    setStage(mode);
  }, []);
  const nextTimedScene = extendedScene ? EXTENDED_SCENES[EXTENDED_SCENES.indexOf(extendedScene) + 1]
    : noteScene === "fourteen" ? 15 : noteScene ? NOTE_SCENES[noteScene].next
      : stage === "breath-hold" ? "ten" : null;
  const nextAfterSeconds = extendedScene ? extendedSeconds[extendedScene] : noteScene ? noteSeconds[noteScene] : activeDurationMs / 1000 + scheduledRest;

  useEffect(() => {
    if (noteScene !== "eleven") return;
    return () => {
      learningSplitRef.current = false;
      setLearningSplit(false);
    };
  }, [noteScene]);

  const stop = useCallback(() => {
    runRef.current++;
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current.clear();
    waitingCues.current.clear();
    const context = audioRef.current;
    audioRef.current = null;
    sceneMonitor.current = null;
    mixMaster.current = null;
    outputRef.current = null;
    if (context && context.state !== "closed") void context.close();
  }, []);

  const reset = useCallback(() => {
    stop();
    setCue(null);
    pausedRef.current = false;
    setPaused(false);
    setTransportBusy(false);
    setSceneSteps([]);
    setPreviewMode(null);
    setStage("ready");
  }, [stop]);

  useEffect(() => {
    const receive = (event: Event) => {
      const command = (event as CustomEvent<DjCommand>).detail;
      if (command.action === "scene") setSceneSteps(steps => [...steps, command.step]);
    };
    window.addEventListener(DJ_CONTROL, receive);
    return () => window.removeEventListener(DJ_CONTROL, receive);
  }, []);

  useEffect(() => {
    if ((!nextTimedScene && extendedScene !== 111) || nextAfterSeconds === 0 || !cue || paused) return;
    if (hasScoredTake(extendedScene)) {
      if(finishedTake === cue && nextTimedScene) enterNumberedScene(nextTimedScene,cue.context,previewMode!==null);
      return;
    }
    const deadline = cue.beginsAt + nextAfterSeconds;
    const edited = previousDeadline.current?.cue === cue && previousDeadline.current.seconds !== nextAfterSeconds;
    const nextBeginsAt = edited ? Math.max(deadline, cue.context.currentTime) : deadline;
    previousDeadline.current = {cue, seconds:nextAfterSeconds};
    let timer: number | undefined;
    const advance = () => {
      if (pausedRef.current || audioRef.current !== cue.context) return;
      const remaining = deadline - cue.context.currentTime;
      if (remaining > 0.005) timer = window.setTimeout(advance, Math.max(8, remaining * 1000));
      else if (nextTimedScene) enterNumberedScene(nextTimedScene, cue.context, previewMode !== null, nextBeginsAt);
      else reset();
    };
    advance();
    return () => window.clearTimeout(timer);
  }, [cue, finishedTake, enterNumberedScene, extendedScene, nextAfterSeconds, nextTimedScene, paused, previewMode, reset]);

  useEffect(() => () => stop(), [stop]);

  useEffect(() => {
    const volume = masterVolume;
    masterVolumeRef.current = volume;
    if (volume > 0) audibleVolumeRef.current = volume;


    const output = mixMaster.current;
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
  }, [masterVolume]);

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
      else await resumeAudioOutput(context);
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
    setScheduledRest(restSeconds);
    setVoiceUnavailable(false);
    setPreviewMode(previewOnly ? mode : null);
    setStage("preparing");
    try {
      const context = new AudioContext();
      audioRef.current = context;
      const masterOutput = context.createGain();
      const sceneMaster = context.createGain();
      sceneMaster.gain.value = masterVolumeRef.current / 100;
      masterOutput.connect(sceneMaster);
      const monitor = protectPeaks(sceneMaster, SPEAKER_CEILING);
      monitor.connect(context.destination);
      if (startPaused) await context.suspend();
      else await resumeAudioOutput(context);
      if (run !== runRef.current || audioRef.current !== context) return;
      sceneMonitor.current = monitor;
      mixMaster.current = sceneMaster;
      outputRef.current = masterOutput;

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
      const playTime = (bus: GainNode, time: number, voices: TunedVoice[]) => {
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
      const playSpatial = (bus: GainNode, time: number, voices: TunedVoice[]) => {
        showAt("space", time, () => enterDiagram("spatial", time, spaceSeconds));
        playTime(bus, time + spaceSeconds, voices);
      };
      const playHarmonics = (bus: GainNode, time: number, root: TunedVoice, harmonicSeconds: number) => {
        playModuleGong(context, masterOutput, time, 330, 0.58);
        playModuleGong(context, masterOutput, time + harmonicSeconds * HARMONIC_CUE.secondGong, 444, 0.55);
        const second = addTone(bus, 222, time + harmonicSeconds * HARMONIC_CUE.trace222, harmonicSeconds * (HARMONIC_CUE.crossFormed - HARMONIC_CUE.trace222));
        const third = addTone(bus, 333, time + harmonicSeconds * HARMONIC_CUE.trace333, harmonicSeconds * (HARMONIC_CUE.result - HARMONIC_CUE.trace333));
        atTime(time, () => setStage("harmonics"));
        playSpatial(bus, time + harmonicSeconds, [root, second, third]);
      };

      if (isContinuationScene(mode)) {
        setActiveSamplingMs(timeSamplingMs);
        playContinuation(mode, context.currentTime);
        return;
      }

      if (mode === "space" || mode === "time") {
        const time = context.currentTime + .07;
        const bus = createChordBus();
        const voices = ORIGINAL_NOTES.map(hz => addTone(bus, hz, time, .28));
        if (mode === "space") playSpatial(bus, time, voices);
        else playTime(bus, time, voices);
        return;
      }

      let voice: AudioBuffer | null = null;
      if (mode === "opening" || mode === "beacon") {
        try { voice = await loadQuestion(context); }
        catch { if (run === runRef.current) setVoiceUnavailable(true); }
        if (run !== runRef.current || audioRef.current !== context) return;
      }
      const enterOpening = (stage: "opening" | "question" | "two", time: number, seconds: number) => {
        setActiveDurationMs(seconds * 1000);
        setCue({context, beginsAt: time});
        setStage(stage);
      };
      if (mode === "opening" || mode === "beacon") sceneNoiseBuffers(context);
      let time = context.currentTime + .08;
      if (mode === "opening") {
        whiteOverture(masterOutput, time, zeroSeconds);
        showAt("opening", time, at => enterOpening("opening", at, zeroSeconds));
        time += zeroSeconds;
      }
      if (mode === "opening" || mode === "beacon") {
        if (voice) speakQuestion(masterOutput, voice, time, oneSeconds);
        showAt("beacon", time, at => enterOpening("question", at, oneSeconds));
        const gongAt = time + pointTiming(oneSeconds).gong;
        const releaseRoom = playSceneOneGong(context, masterOutput, gongAt);
        atTime(gongAt, () => setStage("one"));
        atTime(gongAt + 11.5, releaseRoom);
        time += oneSeconds;
      }
      showAt("line", time, at => enterOpening("two", at, twoSeconds));
      const chordBus = createChordBus();
      const root = collideIntoPitch(chordBus, time, twoSeconds);
      const harmonicOffset = collisionTiming(twoSeconds).harmonics;
      playHarmonics(chordBus, time + harmonicOffset, root, twoSeconds - harmonicOffset);
    } catch {
      if (run !== runRef.current) return;
      reset();
    }
  };

  const showObject = stage === "opening";
  const muted = masterVolume === 0;
  const soundAction = muted ? "Restaurar sonido" : "Silenciar sonido";
  const preparing = stage === "preparing";
  const ready = stage === "ready";
  const waitingForAudio = (preparing || (paused && transportBusy)) && !pausedRef.current && audioRef.current?.state === "suspended";
  const canPlayGeneral = waitingForAudio || (!preparing && !transportBusy);
  const playing = !ready && !preparing && !paused;
  const playLabel = playing ? "Pausar con Play" : paused ? "Reanudar" : "Reproducir";
  function playGeneral() {
    if (!canPlayGeneral) return;
    if (waitingForAudio) void audioRef.current?.resume().catch(() => {});
    else if (ready) {
      if (!audioRef.current) void start();
    } else void changePaused(!paused);
  }
  const breathing = stage === "breath-hold";
  const canStart = ready || breathing || noteScene !== null || extendedScene !== null || (previewMode !== null && !preparing);
  const light = !showObject && stage !== "ready" && !preparing;
  const question = stage === "question";
  const expression = stage === "vertical" || stage === "harmonics" || stage === "equation" || stage === "spatial" ||
    stage === "space" || stage === "temporal" || stage === "time";
  const continuation = activeScene && isContinuationScene(activeScene) ? activeScene : null;
  const splitLabel = MIDI_PITCH_NAMES[splitNote % 12] + (Math.floor(splitNote / 12) - 1);
  const restLabel = `${restSeconds} s`;
  const numberedControls = [
    {mode: "opening", title: "El conjunto vacío", id: "zero-duration"},
    {mode: "beacon", title: "La entidad mínima", id: "one-duration"},
    {mode: "line", title: "Del golpe al armónico", id: "line-duration"},
    {mode: "space", title: "Escena 2 → 3", id: "space-duration"},
    {mode: "time", title: "Escena 3 → 4", id: "time-duration"},
    ...CONTINUATION_SCENES.map(({mode, title}) => ({mode, title, id: `${mode}-duration`})),
    ...NOTE_SCENE_IDS.map(mode => ({mode, title: `Escena ${NOTE_SCENES[mode].number}`, id: `scene-${mode}`})),
    ...EXTENDED_SCENES.map(mode => ({mode, title: `Escena ${mode}`, id: `scene-${mode}`})),
  ] as const;
  const numberedMode = activeScene === "harmonics" ? "line" : activeScene;
  const sceneIndex = numberedControls.findIndex(control => control.mode === numberedMode);
  const sceneNumber = sceneIndex >= 0 ? SHOW_SCORE[sceneIndex].number : null;
  const queuePanelFollow = useRef<(interaction?: boolean) => void>(() => {});
  useLayoutEffect(() => {
    const list = settingsRef.current;
    if (!list) return;
    let timer: number | undefined;
    const follow = () => {
      timer = undefined;
      if (list.matches(":active")) return;
      const card = list.querySelector<HTMLElement>('[aria-current="step"]');
      if (!card) return;
      const top = list.getBoundingClientRect().top + list.clientTop + 10;
      const row = card.getBoundingClientRect();
      if (row.top < top - 1 || row.bottom > top + list.clientHeight - 20)
        list.scrollTop += row.top - top;
    };
    const restart = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(follow, 10000);
    };
    queuePanelFollow.current = interaction => { if (interaction || timer === undefined) restart(); };
    const panel = list.parentElement ?? list;
    const events = ["wheel", "scroll", "pointerdown", "pointermove", "pointerup", "keydown", "input", "focusin", "focusout"];
    for (const event of events) panel.addEventListener(event, restart, {passive:true, capture:true});
    return () => {
      window.clearTimeout(timer);
      queuePanelFollow.current = () => {};
      for (const event of events) panel.removeEventListener(event, restart, true);
    };
  }, []);
  useLayoutEffect(() => { if (sceneNumber !== null) queuePanelFollow.current(); }, [sceneNumber]);
  const [openingRun, setOpeningRun] = useState<{cue: SceneZeroCue; output: GainNode; generation: number} | null>(null);
  const openingGeneration = useRef(0);
  const finishOpeningFilm = useCallback(() => setOpeningRun(null), []);
  useLayoutEffect(() => {
    if (sceneNumber === 1 && cue && outputRef.current) setOpeningRun({cue, output: outputRef.current, generation: ++openingGeneration.current});
    else if (stage === "ready") setOpeningRun(null);
  }, [sceneNumber, cue, stage === "ready"]);
  const film = sceneNumber === null ? undefined : sceneFilms.get(sceneNumber);
  const filmLayer = sceneNumber !== 1 && film && cue && outputRef.current
    ? <SceneVideo key={sceneNumber} film={film} cue={cue} paused={paused} output={outputRef.current} controls={filmControls} />
    : null;
  const signals = useSceneSignals(sceneNumber,cue?.context ?? null,cue?.beginsAt ?? 0,paused,spiralAnalyser,roomAnalyser,liveAttack,hasReferenceVisual(sceneNumber));
  const sceneTitle = breathing ? "Plano 9" : numberedControls[sceneIndex]?.title;
  const liveSet = isLiveSetScene(extendedScene) ? extendedScene : null;
  const coda = extendedScene !== null && extendedScene >= 90 ? extendedScene as CodaScene : null;
  const extendedDark = coda !== null || extendedScene === 16 || extendedScene === 17 || isTimbreScene(extendedScene) || liveSet !== null;
  const totalSeconds = durations.reduce((sum, seconds) => sum + seconds, 0);
  const cueStarts = useMemo(() => {
    let start = 0;
    return durations.map(seconds => { const cue = start; start += seconds; return cue; });
  }, [durations]);
  const playMode = (mode: ModuleZeroScene, asPreview: boolean, startPaused = false) => {
    if ((typeof mode === "number" || isNoteScene(mode)) && (breathing || noteScene || extendedScene) && cue) {
      enterNumberedScene(mode, cue.context, asPreview);
      return;
    }
    void start(mode, asPreview, startPaused);
  };
  const moveScene = (index: number) => {
    queuePanelFollow.current(true);
    const scene = numberedControls[index];
    if (scene) playMode(scene.mode, previewMode !== null, paused);
  };
  useEffect(() => {
    if (!sceneSteps.length || preparing || transportBusy) return;
    setSceneSteps(steps => steps.slice(sceneSteps.length));
    // Several MIDI detents can arrive before React has rendered the new scene.
    const index = sceneSteps.reduce((at, step) =>
      Math.max(at < 0 ? -1 : 0, Math.min(numberedControls.length - 1, at + step)), sceneIndex);
    if (index !== sceneIndex && (stage !== "breath" || index < sceneIndex)) moveScene(index);
  });
  const harmonicPhase = stage === "harmonics" ? collisionTiming(activeDurationMs / 1000).harmonics : 0;
  const diagramCue = useMemo(() => cue && harmonicPhase ? {...cue, beginsAt: cue.beginsAt + harmonicPhase} : cue, [cue, harmonicPhase]);
  return <div role="region" aria-label="Módulo cero" className="zero-layout">
    <style>{`
      @keyframes zeroSpaceFade { from { opacity: 0; } to { opacity: 1; } }
      .zero-layout {
        display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr); width: 100%; height: 100dvh; margin: 0; padding: 0;
        background: #11131a; color: #f2f3f7; isolation: isolate;
        font-family: system-ui, sans-serif;
      }
      .zero-performance {
        display: grid; grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) fit-content(46%);
        min-width: 0; min-height: 0;
      }
      .zero-stage {
        position: relative; display: grid; place-items: center; min-width: 0; min-height: 0;
        grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr);
        width: 100%; height: 100%; padding: 0; border: 0; overflow: hidden; isolation: isolate;
        container: scene-display / size;
      }
      .scene-mixer { min-width:0; min-height:0; overflow:auto; overscroll-behavior:contain; background:#15151d; color:white; font: .76rem system-ui; }
      .scene-film { position:absolute; inset:0; z-index:-1; width:100%; height:100%; pointer-events:none; }
      .reference-visual {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
      .zero-stage > .reference-visual {z-index:-1;}
      .zero-stage > .reference-visual[data-reference-scene="62"] {z-index:1;}
      .zero-stage:has(>.reference-visual) .extended-instrument:is([data-extended-scene="31"],[data-extended-scene="45"]) .extended-generative {width:53%;}
      .live-set:has(>.reference-visual) > .live-set-drawing {opacity:.24;}
      .live-set:has(>.reference-visual[data-reference-scene="54"]) > canvas[data-resonant-scene] {opacity:.33;}
      .zero-stage > .reference-visual[data-reference-scene="60"] {z-index:1;mix-blend-mode:screen;opacity:.81;}
      .reference-visual[data-reference-scene="34"] {transform:translateX(23%);}
      .coda-stage > .reference-visual[data-reference-scene="91"] {opacity:.56;}
      .coda-stage:has(.coda-qr) > .reference-visual:is([data-reference-scene="92"],[data-reference-scene="96"],[data-reference-scene="100"]) {opacity:.78;}
      .coda-stage[data-reference-ballot] .coda-qr {width:min(100%,48cqh,30vw);margin-top:min(24cqh,13rem);}
      @container(max-width:430px){.coda-stage[data-reference-ballot] .coda-qr {width:min(100%,42cqh);}}
      .scene-film[hidden] { display:none; }
      .live-set:has(> .scene-film:not([hidden])) > canvas[data-resonant-scene] { mix-blend-mode:screen; }
      .scene-film-caption { margin:.65rem 0 .25rem; font-size:.82rem; }
      .scene-film-controls { display:flex; flex-wrap:wrap; align-items:center; gap:.35rem; margin:.35rem 0; }
      .zero-controls .scene-film-controls button { min-height:32px; padding:.25rem .5rem; font-size:.78rem; }
      .scene-mixer-tools,.scene-mixer-row { display:flex; align-items:center; gap:.5rem; padding:.24rem .55rem; flex-wrap:wrap; }
      .scene-mixer-tools .scene-record {color:#ff696f;font-size:1.15rem;line-height:1;min-width:2.5rem;}
      .scene-mixer-tools details[open] {display:flex;flex-wrap:wrap;gap:.4rem;align-items:center;}
      .scene-mixer-tools summary {cursor:pointer;}
      .scene-mixer-tools input[type=number] {width:4em;}
      .tempo-lights {display:flex;flex-wrap:wrap;align-items:center;row-gap:5px;max-width:100%;}
      .tempo-bar {display:inline-flex;align-items:center;gap:4px;padding:2px 6px;}
      .tempo-bar + .tempo-bar {border-inline-start:1px solid #9692a1;}
      .tempo-bar i {width:8px;height:8px;border-radius:50%;background:#565461;box-shadow:inset 0 0 0 1px #797581;}
      .tempo-bar i[data-current=true] {background:#ffe28d;box-shadow:0 0 0 1px #ffebaa,0 0 6px #ffc85b;}
      .tempo-bar i:first-child[data-current=true] {background:#fff;box-shadow:0 0 0 2px #ffdb82;}
      .scene-mixer-tools progress {width:5rem;}
      .scene-mixer-tools { position:sticky; top:0; background:#15151d; z-index:1; }
      .scene-mixer-tools:has(details[open]) { position:relative; }
      .sample-bank {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,auto);grid-auto-flow:column;container:sample-bank / inline-size;}
      .sample-bank > div {border:1px solid #44444f;min-width:0;}
      .sample-bank > [data-selected=true] {box-shadow:inset 0 0 0 2px #fbd27d;background:#332d25;}
      .sample-bank button.sample-empty {text-align:left;min-width:0;}
      .sample-empty {padding:.1rem .5rem;color:#92929e;font-variant-numeric:tabular-nums;}
      .sample-bank .scene-mixer-row {gap:2px;padding:3px;align-content:center;}
      .sample-bank .scene-mixer-row button {flex:none;display:grid;place-items:center;min-width:24px;height:24px;padding:0 .18rem;font:600 .68rem/1 system-ui;}
      .sample-mute svg {width:15px;height:15px;}
      .sample-info {flex:1 1 0;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.66rem;color:#c4c7d3;}
      .sample-wave {order:2;flex:0 0 100%;position:relative;min-width:0;height:12px;overflow:hidden;border:1px solid #4d4a5b;border-radius:3px;background:#100f17;}
      .sample-wave {background-image:linear-gradient(90deg,#676078 1px,transparent 1px),linear-gradient(90deg,#342f41 1px,transparent 1px);}
      .sample-wave canvas {display:block;width:100%;height:100%;}
      .sample-wave[data-muted] canvas {opacity:.45;}
      .sample-wave-cursor {position:absolute;inset:0;pointer-events:none;border-inline-start:1px solid #fbd27d;}
      .sample-wave[data-stopped] .sample-wave-cursor,.sample-wave-cursor:not([data-playback]) {visibility:hidden;}
      .sample-wave-cursor[data-playback=waiting] {border-inline-start-style:dashed;}
      .sample-wave-cursor[data-playback=paused],.sample-wave[data-muted] .sample-wave-cursor {border-inline-start-color:#a3a0ad;}
      .sample-bank .scene-mixer-row input {flex:1 1 3.5rem;min-width:2.5rem;max-width:7rem;height:20px;margin:0 2px;}
      @container sample-bank (max-width:57rem) {
        .sample-info {order:1;flex:1 0 100%;line-height:1.1;}
      }
      @container sample-bank (max-width:31rem) {
        .sample-bank .scene-mixer-row {align-content:start;}
        .sample-bank .scene-mixer-row input {flex-basis:2.5rem;}
      }
      .scene-mixer button { padding:.25rem .6rem; border:1px solid #737482; background:#252631; color:white; border-radius:4px; cursor:pointer; }
      .scene-mixer button[aria-pressed=true] { background:#664481; }
      @media(max-width:760px){.zero-stage:has(>.stimulus-bar)>.zero-subtitle {top:2.6rem;}}
      .zero-start, .zero-object { position: absolute; inset: 0; width: 100%; height: 100%; }
      .zero-start { border: 0; padding: 0; background: transparent; cursor: pointer; }
      .zero-object { cursor: grab; touch-action: none; }
      .zero-object:active { cursor: grabbing; }
      .zero-subtitle {
        position: absolute; inset-inline: 0; top: .5rem; z-index: 2;
        display: flex; justify-content: center; padding-inline: .5rem; pointer-events: none;
      }
      .zero-subtitle span {
        border: 1px solid #687184; border-radius: 4px; padding: .23rem .65rem;
        background: #191d25; color: #f2f3f7; font: 600 .75rem/1.25 system-ui, sans-serif;
        text-align: center;
      }
      .zero-scene-heading {
        position: absolute; inset-block-start: clamp(.8rem, 2.5vw, 2rem); inset-inline-start: clamp(.95rem, 3vw, 2.6rem);
        z-index: 2; display: flex; align-items: center; gap: .5rem; pointer-events: none; font-variant-numeric: tabular-nums;
      }
      .zero-scene-number {
        color: #191b22; font: 400 clamp(1.5rem, 3.25vw, 2.8rem)/1 Georgia, serif; font-variant-numeric: tabular-nums;
      }
      .zero-stopwatch {
        padding: .2em .48em; border-radius: .25rem; background: #191d25; color: #f2f3f7;
        font: 600 clamp(.76rem, 1.15vw, 1.1rem)/1.25 system-ui, sans-serif; font-variant-numeric: tabular-nums;
      }
      @container scene-display (max-width: 40rem) {
        .zero-stage:has(.zero-stopwatch) .stimulus-bar { max-width: calc(100% - 8rem); }
      }
      .opening-field { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; }
      .opening-rate {
        position:absolute; z-index:1; inset-inline:0; bottom:clamp(.45rem,4cqh,2rem); margin:0;
        color:#272936; text-align:center; font:600 clamp(.82rem,2.5cqh,1.25rem)/1.3 system-ui,sans-serif;
        font-variant-numeric:tabular-nums; pointer-events:none;
      }
      .opening-noises { display:flex; flex-wrap:wrap; gap:.3rem; margin:.4rem 0; }
      .opening-noises kbd { font:600 .72rem/1.4 system-ui; color:#cddafe; }
      .zero-controls .opening-noises button { min-height:32px; padding:.18rem .5rem; font-size:.73rem; touch-action:none; }
      .opening-cue { margin:.4rem 0 .6rem; font-size:.8rem; line-height:1.45; color:#d7dfef; }
      .zero-stage:has(.zero-object) .zero-scene-number { opacity:0; }
      .zero-question {
        position: absolute; top: 19%; width: min(87%, 900px); margin: 0; text-align: center;
        color: #111; font: 400 clamp(1.5rem, 3.5vw, 3.6rem)/1.3 Georgia, serif;
        text-shadow: 0 0 .12em #fff, 0 0 .28em #fff, 0 0 .5em #fff;
        animation: zeroSpaceFade .55s ease both;
      }
      .zero-point { width: clamp(8px, 1.05vw, 16px); aspect-ratio: 1; border-radius: 50%; background: #000; }
      .zero-harmonic-frame { position: relative; width: min(94%, 800px, 116dvh, 144cqh); aspect-ratio: 16 / 9; pointer-events: none; }
      .zero-harmonic-diagram, .zero-frequency-space, .zero-frequency-space canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
      .zero-temporal-trail { width:96cqw; left:50%; right:auto; transform:translateX(-50%); }
      .zero-note-scene[data-note-scene=ten] .zero-resting-sphere {
        transform: translateX(17%) scale(.90);
        animation: zeroSphereEntrance .5s ease-out both;
      }
      .zero-note-scene:is([data-note-scene=twelve], [data-note-scene=thirteen], [data-note-scene=fourteen]) .zero-resting-sphere {
        transform: translateX(-20%) scale(.78);
      }
      .zero-stage:has(>.zero-loop-timeline) {
        --scene-timeline-height: min(clamp(82px, 27cqh, 175px), 40cqh);
        --scene-timeline-gap: min(10px, 2cqh);
        grid-template-rows: minmax(0, 1fr) auto;
      }
      .zero-stage:has(>.zero-loop-timeline) > .zero-harmonic-frame {
        width: min(94%, 800px, calc((100cqh - var(--scene-timeline-height) - var(--scene-timeline-gap)) * 1.5));
      }
      .zero-stage > .zero-loop-timeline { height: var(--scene-timeline-height); margin-bottom: var(--scene-timeline-gap); }
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
      .zero-controls {position:relative;container:operator / size;}
      .dj-drawer {position:relative;margin-top:.4rem;color:#e5e9f3;font:500 .81rem/1.35 system-ui,sans-serif;}
      .dj-drawer summary {cursor:pointer;background:#202635;border:1px solid #414a5c;border-radius:.3rem;padding:.48rem .6rem;}
      .dj-sheet {position:absolute;z-index:9;bottom:calc(100% + 3px);inset-inline:calc(0px - var(--zero-controls-padding));box-sizing:border-box;
        max-height:min(74dvh,74cqh);overflow:auto;overscroll-behavior:contain;display:grid;gap:.45rem;padding:.7rem var(--zero-controls-padding);
        background:#151a26;border-block:1px solid #5c657b;box-shadow:0 -.3rem 1.1rem #06081177;}
      .dj-sheet label,.dj-deck {display:grid;gap:.28rem;min-width:0;}
      .dj-sheet select,.dj-sheet input[type=file] {width:100%;max-width:100%;min-width:0;font:inherit;color:inherit;}
      .dj-sheet select {background:#202635;padding:.35rem;border:1px solid #4c566b;border-radius:.25rem;}
      .dj-deck {border-top:2px solid #73cbbd;padding:.5rem 0 .2rem;}
      .dj-deck[data-side=B] {border-color:#bb9bee;}
      .dj-cross-labels {display:flex;justify-content:space-between;}
      .dj-sheet .dj-arm {display:flex;align-items:center;margin:.55rem 0;}
      .dj-entries fieldset {margin:.45rem 0;border:1px solid #414a5c;min-inline-size:0;}
      .dj-entry-fields {display:grid;grid-template-columns:minmax(0,1fr) 4.25rem 3rem;gap:.4rem;margin-top:.35rem;}
      .dj-entry-fields input {width:100%;min-width:0;}
      .dj-track {margin:0;font-size:.85rem;overflow-wrap:anywhere;}
      .dj-deck-head,.dj-transport {display:flex;align-items:center;gap:.35rem;flex-wrap:wrap;}
      .dj-deck-head strong {margin-right:auto;}.dj-transport output{font-size:.7rem;font-variant-numeric:tabular-nums;}
      .zero-controls .dj-deck button {padding:.1rem .5rem;min-height:28px;}
      .zero-controls .dj-deck input[type=range] {margin:.14rem 0;height:20px;}
      .zero-midi { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin-bottom: .65rem; }
      .zero-midi p { margin: 0; color: #dce6ff; font-size: .76rem; overflow-wrap: anywhere; }
      .zero-controls .zero-midi button { font-size: .75rem; padding: .25rem .55rem; }
      .zero-transport { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1.7fr) repeat(3,minmax(0,1fr)); gap: .25rem; }
      .zero-controls .zero-transport button { display: grid; place-items: center; min-width: 0; padding: 0; }
      .zero-general-play {display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px;}
      .zero-controls .zero-general-play .transport-midi-button {width:auto;padding:0 .3rem;font:600 .64rem/1 system-ui;}
      .zero-general-play .transport-midi-button[aria-pressed=true] {background:#664481;}
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
      .zero-controls button.zero-midi-icon { display:inline-grid; place-items:center; width:28px; height:28px; min-height:28px; padding:3px; border-radius:50%; }
      .zero-controls .zero-midi-icon svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      .zero-midi-icon[aria-pressed=true] { background:#65518f; }
      .zero-master-label output { margin-left:auto; }
      .zero-master-label output { color: #dce6ff; font-variant-numeric: tabular-nums; }
      .zero-settings {
        display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 1.15rem;
        min-height: 0; overflow: auto; overscroll-behavior: contain; overflow-anchor: none;
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
      .repertoire-cue { margin-top:.45rem; }
      .repertoire-cue label { display:flex; align-items:baseline; gap:.45rem; cursor:pointer; }
      .repertoire-cue input { flex:none; accent-color:#adc4ff; }
      .zero-controls .zero-master input { margin: .35rem 0 0; }
      .zero-scene-seconds {white-space:nowrap;font-size:.84rem;}
      .zero-scene-seconds input {width:4.5rem;padding:.35rem .25rem;color:inherit;background:#191d28;border:1px solid #4c5468;border-radius:4px;text-align:right;font:inherit;}
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
        .zero-harmonic-frame { width: min(94%, 800px, 76dvh, 144cqh); }
        .zero-controls {
          --zero-controls-padding: .75rem;
          grid-template-rows: minmax(7rem, 42%) auto; overflow: auto; overscroll-behavior: contain;
          border-left: 0; border-top: 1px solid #30333d;
        }
        .zero-scene { padding-top: 1rem; }
      }
      ${EXTENDED_STYLE}
    `}</style>
    <ProjectionSignalContext.Provider value={signals}><div className="zero-performance">
      <SceneMixer filmLayer={liveSet ? filmLayer : null} stageBackground={extendedDark ? "#130f20" : light ? "#fff" : "#000"} extendedDark={extendedDark}
        canPlayNote={!!manualOutput && (!!earlyScene || !!noteScene || extendedPlaying || usesSceneKeyboard(extendedScene) || !!coda)} connectMidi={connectMidi} transportMidi={transportMidi} playGeneral={playGeneral} pauseScene={()=>{if(!ready && !preparing)void changePaused(true);}} stopScene={reset} codaScene={coda} liveSet={liveSet}
        voiceScene={extendedScene === 31 || extendedScene === 89 ? extendedScene : null} cue={cue} seconds={directionSeconds}
        takeScene={extendedScene} onTakeComplete={setFinishedTake} countingTake={countingTake} roomAnalyser={roomAnalyser} analyser={liveSet || coda || extendedScene === 31 || extendedScene === 42 || extendedScene === 45 || extendedScene === 60 || extendedScene === 61 || extendedScene === 62 ? spiralAnalyser : undefined} monitor={sceneMonitor.current} ready={ready} startScene={()=>void start()} scene={activeScene ? sceneTitle : undefined} routing={pianoRouting} input={outputRef.current} master={mixMaster.current} paused={paused}>
      {openingRun && <OpeningFilm key={openingRun.generation} cue={cue ?? openingRun.cue} output={outputRef.current ?? openingRun.output}
        controls={filmControls} strikes={strikes} inside={sceneNumber === 1} paused={paused} finish={finishOpeningFilm} />}
      {!liveSet && !coda && filmLayer}
      {!liveSet && !coda && cue && hasReferenceVisual(sceneNumber) &&
        <ReferenceVisual scene={sceneNumber} clock={cue.context} beginsAt={cue.beginsAt} duration={durations[sceneNumber]} paused={paused}/>}
      {stage === "ready" && <button type="button" className="zero-start" onClick={() => void start()} aria-label="Iniciar la secuencia desde el módulo cero" />}
      {showObject && cue && <EmptySetScene durationMs={activeDurationMs} cue={cue} paused={paused} />}
      {(sceneNumber === 1 || stage === "two") && cue && <OpeningProjection scene={stage === "two" ? 2 : 1} cue={cue} seconds={activeDurationMs / 1000} strikes={strikes} />}
      {sceneNumber === 2 && cue && <CollisionReadout cue={cue} seconds={activeDurationMs / 1000} paused={paused} />}
      {question && <p className="zero-question" style={{ animationPlayState: paused ? "paused" : "running" }}>{OPENING_QUESTION}</p>}
      {expression && <HarmonicDiagram stage={stage as HarmonicStage} cue={diagramCue} durationMs={activeDurationMs - harmonicPhase * 1000}
        sampleIntervalMs={activeSamplingMs} />}
      {continuation && cue && <ContinuationProjection intervalMs={crossSamplingMs} scene={continuation} clock={cue.context} startsAt={cue.beginsAt}
        seconds={activeDurationMs / 1000} pair={playingNoisePair} hold={breathing}
        inheritedTrail={(continuation === "cross" || continuation === "sphere") &&
          <TemporalFrequencyTrail progress={1} durationMs={timeSeconds * 1000} intervalMs={activeSamplingMs} clock={cue.context} frozenAtEnd />} />}
      {noteScene && <PerformanceProjection scene={noteScene} paused={paused} clock={cue?.context ?? null}
        input={noteInput}
        beginsAt={cue?.beginsAt ?? 0} />}
      {noteScene === "fourteen" && <LiveChordTimeline histories={[noteInput.history]} live={noteInput.sounding} />}
      {!ready && <ScoreTrack file={"/multiversos/hardstyle.mp3"} title="Hardstyle" clock={cue?.context ?? null} output={outputRef.current}
        trigger={extendedScene === 39 || extendedScene === 60} fade={.08} />}
      {!ready && <ScoreTrack file={"/multiversos/electro.mp3"} title="Electro" clock={cue?.context ?? null} output={outputRef.current}
        trigger={extendedScene === 67} fade={4} />}
      {(sceneNumber === 14 || sceneNumber === 18) && <NoteComet key={sceneNumber} attack={liveAttack} />}
      {coda && cue && <CodaProjection filmLayer={filmLayer} scene={coda} clock={cue.context} beginsAt={cue.beginsAt} duration={extendedSeconds[coda]} output={manualOutput} paused={paused} routing={pianoRouting} />}
      {extendedScene && !liveSet && !coda && cue && (extendedScene === 42 || extendedScene === 62
        ? <TypeProjection scene={extendedScene} beginsAt={cue.beginsAt} clock={cue.context} paused={paused} output={outputRef.current} analyser={spiralAnalyser} attack={extended.attack} />
        : extendedScene === 61
        ? <AudienceProjection analyser={spiralAnalyser} attack={extended.attack} paused={paused} />
        : extendedScene === 60
        ? <PrimeraVoluntad key={cue.beginsAt} clock={cue.context} analyser={spiralAnalyser} attack={extended.attack} paused={paused}
            press={(id, index) => extended.press(id, extended.selected, index)} release={extended.release} />
        : extendedPlaying
        ? <ExtendedPerformanceProjection analyser={spiralAnalyser} performance={extended} scene={extendedScene} clock={cue.context} paused={paused} />
        : <ExtendedArt scene={extendedScene} clock={cue.context} beginsAt={cue.beginsAt} seconds={directionSeconds} a4={extended.a4} paused={paused} />)}
      {sceneNumber !== null && sceneNumber > 0 && !liveSet && !coda && sceneNumber !== 61 && <StimulusBar scene={sceneNumber} paused={paused}
        notes={noteScene ? noteInput.sounding : undefined} tuning={extended.a4}
        resting={breathing} interactiveObject={showObject} />}
      {(sceneNumber !== null || showStopwatch) && <div className="zero-scene-heading">
        {sceneNumber !== null && <div className="zero-scene-number" role="status" aria-label={`Escena ${sceneNumber}`}>{sceneNumber}</div>}
        {showStopwatch && <ScoreStopwatch clock={sceneNumber === null ? null : audioRef.current}
          beginsAt={cue?.beginsAt ?? 0} offset={cueStarts[sceneIndex] ?? 0} total={totalSeconds} paused={paused} />}
      </div>}
      {sceneNumber !== null && sceneNumber < 10 && <div className="zero-subtitle" role="status">{showSubtitles && sceneTitle && <span>{sceneTitle}</span>}</div>}
      </SceneMixer>
    </div></ProjectionSignalContext.Provider>
    <aside className="zero-controls" aria-label="Controles de las escenas">
      <div className="zero-settings" ref={settingsRef}>
        <div className="zero-scene">
          <h2>Duración de la obra</h2>
          <p><strong data-show-total={totalSeconds}>{scoreTime(totalSeconds)}</strong> · {SHOW_SCENE_COUNT} escenas · margen de 20:00 a 40:00</p>
          <details><summary>Ajustes de duración</summary>
            {sceneNumber !== null && sceneNumber < 10 && <p>La apertura ya está en marcha. Los cambios de las escenas 0–9 entran al volver a reproducirlas.</p>}
            <button type="button" onClick={() => {setSavedSeconds(SHOW_SCORE.map(cue => cue.seconds)); setRestFraction(.4);}}>Restablecer 30:00</button>
            {previousTimes && <button type="button" onClick={() => setSavedSeconds(previousTimes)}>Recuperar mis tiempos anteriores</button>}
          </details>
        </div>
        {numberedControls.map(({mode, id}, index) => {
          const isActive = mode === numberedMode;
          const score = SHOW_SCORE[index], seconds = durations[index];
          const sceneFilm = sceneFilms.get(score.number);
          const {min,max} = limits[index];
          return <div key={mode} className="zero-scene" role="region" data-scene={score.number} aria-labelledby={`${id}-title`}
            aria-current={isActive ? "step" : undefined}>
            <div className="zero-title">
              <h2 id={`${id}-title`}>Escena {score.number}</h2>
              {hasScoredTake(score.number) ? <span>4 compases · {takeSeconds.toLocaleString("es-AR",{maximumFractionDigits:2})} s de toma</span> : <label className="zero-scene-seconds"><input key={seconds} type="number" min={min} max={max}
                aria-label={`Segundos de la escena ${score.number}`} defaultValue={seconds}
                onBlur={event => {const field = event.currentTarget;
                  if (Number.isFinite(field.valueAsNumber)) {
                    const value = Math.min(max,Math.max(min,Math.round(field.valueAsNumber)));
                    field.value = String(value); editSeconds(score.number,value);
                  } else field.value = String(seconds);
                }} onKeyDown={event => {if(event.key === "Enter")event.currentTarget.blur();}} /> s</label>}
            </div>
            <small>{scoreTime(cueStarts[index])} · {score.title}</small>
            {sceneFilm && <>
              <p className="scene-film-caption">Fondo · {sceneFilm.clip.title}</p>
              {isActive && <div ref={setFilmControls} />}
            </>}
            {score.number === 70 && <p>Escenas 70–79 · trance psicomusical. Ajustá la entrada del deck en la pauta musical.</p>}
            {(mode === 31 || mode === 89) && <p><strong>Loop de voz.</strong> {VOICE_CUES[mode]}</p>}
            {!hasScoredTake(score.number) && <input id={id} type="range" min={min} max={max} step={1} value={seconds}
              aria-label={`Ajustar duración de la escena ${score.number}`} aria-valuetext={`${seconds} segundos`}
              onChange={event => editSeconds(score.number,event.currentTarget.valueAsNumber)} />}
            {mode === "opening" && <>
              <p className="opening-cue">Sostené una nota para sumar su ruido al blanco de la apertura.</p>
              <div className="opening-noises" role="group" aria-label="Cuatro colores de ruido">{NOISE_KEYS.map(({key, midi, label, note}) =>
                <button key={key} type="button" disabled={!isActive || !manualOutput} title={note + " · MIDI " + midi}
                  onPointerDown={event => {event.currentTarget.setPointerCapture(event.pointerId); pianoRouting.current?.computerNote("color-" + key, midi, true);}}
                  onLostPointerCapture={() => pianoRouting.current?.computerNote("color-" + key, midi, false)}
                  onKeyDown={event => {if ((event.key === " " || event.key === "Enter") && !event.repeat) {event.preventDefault(); pianoRouting.current?.computerNote("color-" + key, midi, true);}}}
                  onKeyUp={event => {if (event.key === " " || event.key === "Enter") {event.preventDefault(); pianoRouting.current?.computerNote("color-" + key, midi, false);}}}
                  onBlur={() => pianoRouting.current?.computerNote("color-" + key, midi, false)}><kbd>{key}</kbd> · {label}</button>)}</div>
            </>}
            {mode === "beacon" && <p className="opening-cue">Desde la pregunta, tocá el piano o las teclas A–K. Cada golpe de bombo abre una onda y revela el universo. En pausa también podés tocar.</p>}
            {mode === "beacon" && voiceUnavailable && <small role="status">La voz no se pudo cargar. La pregunta sigue en pantalla.</small>}
            {mode === "line" && <p className="opening-cue">Cada golpe deja un punto. Seguí el contador y escuchá cómo se juntan hasta formar la nota de 111 Hz. Podés acentuar el recorrido con el teclado.</p>}
            {mode === "time" && <>
              <div className="zero-sampling">
                <label htmlFor="time-sampling">Intervalo de muestreo</label>
                <output htmlFor="time-sampling">{timeSamplingMs} ms</output>
              </div>
              <input id="time-sampling" type="range" min={50} max={1000} step={25} value={timeSamplingMs}
                aria-valuetext={`${timeSamplingMs} milisegundos`} disabled={!canStart || previewMode === "time"}
                onChange={(event) => setTimeSamplingMs(Number(event.currentTarget.value))} />
            </>}
            {mode === "cross" && <label>Intervalo de la segunda línea · {crossSamplingMs} ms
              <input type="range" min={50} max={1000} step={25} value={crossSamplingMs}
                onChange={event => setCrossSamplingMs(event.currentTarget.valueAsNumber)} />
            </label>}
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
              <input id="rest-duration" type="range" min={1} max={seconds-1} step={1} value={restSeconds}
                aria-valuetext={restLabel} onChange={event => setRestFraction(event.currentTarget.valueAsNumber / seconds)} />
            </>}
            {typeof mode === "number" && mode < 90 && isActive && <ExtendedPerformanceControls performance={extended} scene={mode} paused={paused} />}
            {isActive && noteScene && noteScene !== "fourteen" && <div className="zero-scene-input">
              <p>{noteScene === "ten" ? "Usá cualquier tecla MIDI o 1–9 en la computadora. Después del tiempo elegido entra la escena 11."
                : noteScene === "eleven" ? "En la computadora, 1–4 para la nota grave y 5–9 para la aguda."
                  : noteScene === "thirteen" ? "MIDI · Teclas 1–9 frente, 10–18 derecha, 19–27 arriba."
                    : "Las primeras nueve teclas recorren 111 a 999 Hz. En la computadora, 1–9."}</p>
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
            {mode === "breath" && breathing && <button type="button" className="zero-continue" onClick={() => moveScene(10)}>Ir a escena 10</button>}
          </div>;
        })}
      </div>
      <div className="zero-control-bar" role="group" aria-label="Panel de control">
        <div id="zero-midi" className="zero-midi">
          <p role="status">{midiInputs.length ? `MIDI · ${midiInputs.map(({ name, status, signal }) => name + " · " + (status === "failed" ? "no se pudo abrir" : status === "opening" ? "abriendo…" : signal || "abierto, esperando señal")).join(" / ")}`
            : midiConnection === "checking" ? "Buscando piano MIDI… Podés usar el teclado."
              : midiConnection === "blocked" ? "Permiso MIDI bloqueado. Habilitá MIDI para este sitio y actualizá las entradas."
              : midiConnection === "unavailable" ? "MIDI no disponible en este navegador." : "Sin entradas MIDI · Teclado de la computadora listo"}</p>
          <button className="zero-midi-icon" type="button" title="Actualizar dispositivos MIDI" aria-label="Actualizar dispositivos MIDI" disabled={scanState === "busy"} onClick={async () => {
            setScanState("busy");
            try { await connectMidi(true); } finally { setScanState("done"); }
          }}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 5v6h-6M4 19v-6h6M5.3 8a7.5 7.5 0 0 1 12.4-2L20 9M4 15l2.3 3A7.5 7.5 0 0 0 19 16"/></svg></button>
          {scanState !== "idle" && <small role="status">{scanState === "busy" ? "Buscando…" : midiConnection === "blocked" ? "Permiso MIDI bloqueado" : midiConnection === "unavailable" ? "MIDI no disponible" : midiInputs.length + " entradas detectadas"}</small>}
        </div>
        <div className="zero-transport" role="group" aria-label="Reproducción">
          <button type="button" aria-label="Escena anterior" title="Escena anterior"
            disabled={sceneIndex <= 0 || preparing || transportBusy} onClick={() => moveScene(sceneIndex - 1)}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5h2v14H5zM19 5v14L8 12z" /></svg>
          </button>
          <div className="zero-general-play">
            <button type="button" aria-label={playLabel} title={playLabel}
              disabled={!canPlayGeneral} onClick={playGeneral}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d={playing ? "M5 4h4v16H5zm8 0h4v16h-4z" : "M7 4l14 8-14 8z"} /></svg>
            </button>
            <TransportMidiButton action="play" midi={transportMidi} />
          </div>
          <div className="zero-general-play">
            <button type="button" aria-label="Pausar" title="Pausar"
              disabled={ready || preparing || paused || transportBusy} onClick={() => void changePaused(true)}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg>
            </button>
            <TransportMidiButton action="pauseScene" midi={transportMidi} />
          </div>
          <div className="zero-general-play">
            <button type="button" aria-label="Detener" title="Stop general de escena" disabled={ready} onClick={reset}>
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5h14v14H5z" /></svg>
            </button>
            <TransportMidiButton action="stopScene" midi={transportMidi} />
          </div>
          <button type="button" aria-label="Escena siguiente" title="Escena siguiente"
            disabled={sceneIndex === numberedControls.length - 1 || stage === "breath" || preparing || transportBusy} onClick={() => moveScene(sceneIndex + 1)}>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M17 5h2v14h-2zM5 5l11 7-11 7z" /></svg>
          </button>
        </div>
        {transportMidi.learning && ["play","pauseScene","stopScene"].includes(transportMidi.learning) && <small role="status">{transportMidi.hint}</small>}
        <div className="zero-master">
          <button type="button" aria-label={soundAction} title={soundAction}
            onClick={() => setMasterVolume(muted ? audibleVolumeRef.current : 0)}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path fill="currentColor" d="M3 9h4l5-4v14l-5-4H3z" />
              <path fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"
                d={muted ? "m16 9 5 6m0-6-5 6" : "M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"} />
            </svg>
          </button>
          <div>
            <div className="zero-master-label">
              <label htmlFor="zero-master-volume">Volumen master</label>
              <button type="button" className="zero-midi-icon" title={faderLabel} aria-label={faderLabel} aria-pressed={learningFader} onClick={learnFader}><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="7"/><path d="m12 13 3-5M3 9l1 .5M7 3.5l.7 1.3M17 3.5l-.7 1.3M21 9l-1 .5"/></svg></button>
              <output htmlFor="zero-master-volume">{masterVolume}%</output>
            </div>
            <input id="zero-master-volume" type="range" min={0} max={100} step={1}
              value={masterVolume} aria-valuetext={`${masterVolume}%`}
              onChange={(event) => setMasterVolume(Number(event.currentTarget.value))} />
          </div>
        </div>
        {(learningFader || faderSignal) && <small role="status" style={{display:"block"}}>{faderSignal || "Esperando un movimiento MIDI del fader…"}</small>}
        <label className="zero-subtitle-toggle">
          Activar subtítulos
          <input type="checkbox" role="switch" checked={showSubtitles}
            onChange={(event) => setShowSubtitles(event.currentTarget.checked)} />
        </label>
        <label className="zero-subtitle-toggle">
          Mostrar cronómetro
          <input type="checkbox" role="switch" checked={showStopwatch}
            onChange={(event) => setShowStopwatch(event.currentTarget.checked)} />
        </label>
        <button type="button" aria-pressed={calibration} onClick={toggleCalibration}>
          {calibration ? "Tocá la tecla más grave · Cancelar" : "Tecla más grave de los cubos · MIDI " + firstMidi}
        </button>
        <DjConsole output={cue ? outputRef.current : null} inputs={midiInputs}
          scene={sceneNumber} cue={cue} seconds={durations[sceneNumber ?? 0]} paused={paused}
          automatic={djAutomatic} setAutomatic={setDjAutomatic}/>
        <a className={styles.organonLink} href="/860-multiversos/organon" target="_blank" rel="noopener">Órganon · Mapa de controles ↗</a>
        <a className={styles.materialLink} href="/860-multiversos/materiales.html" target="_blank" rel="noopener">Descargar material necesario para usar este dispositivo</a>
        {(preparing || paused) && <span className="zero-playback-status" role="status">{waitingForAudio ? "Tocá ▶ para habilitar el audio." : preparing ? "Preparando audio…" : "En pausa"}</span>}
      </div>
    </aside>
  </div>;
}

export default function Multiversos860Page() {
  const [midiInputs, setMidiInputs] = useState<MidiDevice[]>([]);
  const [midiConnection, setMidiConnection] = useState<MidiConnection>("checking");
  const [midiLearnFor, setMidiLearnFor] = useState<number | null>(null);
  const [firstMidi, setFirstMidi] = useSavedSetting("cubeFirstMidi", 36);
  const [calibration, setCalibration] = useState(false);
  const [masterVolume, setMasterVolume] = useSavedSetting("masterVolume", 100);
  const [faderSignal, setFaderSignal] = useState("");
  const [ccMap, setCcMap] = useSavedSetting<Record<number, CcBinding>>("ccMap", {});
  const midiAccessRef = useRef<MidiAccessLike | null>(null);
  const midiRequestRef = useRef<Promise<void> | null>(null);
  const midiMountedRef = useRef(false);

  const pianoRouting = useRef<PerformanceInput | null>(null);
  const midiLearnRef = useRef<number | null>(null);
  const ccMapRef = useRef(ccMap);
  ccMapRef.current = ccMap;
  midiLearnRef.current = midiLearnFor;
  const onMidiData = useRef<(port: MidiInputLike, data: ArrayLike<number>) => void>(() => {});
  const djHeld = useRef(new Set<string>());
  const [portMonitor] = useState(() => monitorMidiInputs(setMidiInputs,
    (port, data) => onMidiData.current(port, data),
    id => { for (const key of djHeld.current) if (JSON.parse(key)[0]===id) djHeld.current.delete(key);
      pianoRouting.current?.releaseMidi(id); window.dispatchEvent(new Event("860-midi-disconnect")); }));
  const refreshMidiInputs = useCallback((retry = false) => {
    const access = midiAccessRef.current;
    if (!access || !midiMountedRef.current) return;
    portMonitor.refresh(access.inputs.values(), retry);
    setMidiConnection("ready");
  }, [portMonitor]);

  const connectMidi = useCallback(async (rescan = false) => {
    const active = midiAccessRef.current;
    if (active) {
      active.onstatechange = () => refreshMidiInputs();
      refreshMidiInputs(rescan);
      return;
    }
    if (midiRequestRef.current) return midiRequestRef.current;
    if (!window.isSecureContext) {
      setMidiConnection("unavailable");
      return;
    }
    const requestAccess = (navigator as MidiNavigator).requestMIDIAccess;
    if (!requestAccess) {
      setMidiConnection("unavailable");
      return;
    }
    setMidiConnection("checking");
    const request = Promise.resolve().then(() => requestAccess.call(navigator, { sysex: false })).then((access) => {
      if (midiMountedRef.current) {

        midiAccessRef.current = access;
        access.onstatechange = () => refreshMidiInputs();
        refreshMidiInputs();
      }
    }).catch(() => {
      if (midiMountedRef.current) {
        setMidiConnection("blocked");
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
      portMonitor.close();
      if (midiAccessRef.current) {
        midiAccessRef.current.onstatechange = null;
      }
    };
  }, [connectMidi]);

  onMidiData.current = (input, data) => {
        const status = data[0] || 0;
        const first = data[1] || 0;
        const second = data[2] || 0;
        const kind = status & 0xf0;
        if (calibration && kind === 0x90 && second > 0 && !isInpulse200(input.name)) {
          setFirstMidi(first);
          setCalibration(false);
          return;
        }
        const piano = pianoRouting.current;
        const channel = status & 0x0f;
        const controlType = kind === 0xe0 ? "bend" : kind === 0xb0 && first < 120 ? "cc" :
          kind === 0x90 || kind === 0x80 ? "note" : null;
        const uniqueName = input.name && midiInputs.filter(p => p.name === input.name).length === 1 ? input.name : null;
        if ((status === 0xfa || status === 0xfb || status === 0xfc) && midiLearnRef.current === null) {
          // A transport can send Start from rest and Continue with the same Play button after a pause.
          const pulse = status === 0xfc ? "stopScene" : "play";
          const id = JSON.stringify([input.id,"transport",pulse]);
          const alias = uniqueName ? JSON.stringify(["name",uniqueName,"transport",pulse]) : "";
          window.dispatchEvent(new CustomEvent("860-record-midi",{cancelable:true,detail:{id,alias,on:true,pulse}}));
          return;
        }
        const fromPort = (binding?: CcBinding) => {
          if (!binding) return false;
          if (binding.inputId === input.id) return !binding.inputName || !input.name || binding.inputName === input.name;
          return !!uniqueName && uniqueName === binding.inputName;
        };
        const alias = uniqueName ? JSON.stringify(["name",uniqueName,channel,controlType,controlType==="bend"?0:first]) : "";
        if (controlType && midiLearnRef.current === null) {
          const id = JSON.stringify([input.id,channel,controlType,controlType==="bend"?0:first]);
          const masterFader = ccMapRef.current[MASTER_FADER];
          const reserved = !!masterFader && fromPort(masterFader) &&
            (controlType==="bend" ? masterFader.bendChannel===channel : controlType==="cc" && masterFader.cc===first &&
              (masterFader.ccChannel===undefined || masterFader.ccChannel===channel));
          const value = controlType==="bend"?(first+128*second)/16383:kind===0x80?0:second/127;
          if(!window.dispatchEvent(new CustomEvent("860-bank-midi",{cancelable:true,
            detail:{id,alias,value,type:controlType,reserved,label:(input.name||"MIDI")+" · "+(controlType==="bend"?"Pitch Bend":(controlType==="cc"?"CC ":"Nota ")+first)+" · canal "+(channel+1)}})))return;
        }
        if (midiLearnRef.current === null && (kind === 0x90 || kind === 0x80 || (kind === 0xb0 && first < 120))) {
          const id = JSON.stringify([input.id,channel,kind===0xb0?"cc":"note",first]);
          const event = new CustomEvent("860-record-midi",{cancelable:true,detail:{id,alias,on:kind!==0x80 && second>0}});
          if(!window.dispatchEvent(event)) return;
        }
        if (isInpulse200(input.name)) {
          if (midiLearnRef.current === null && herculesCommand(input.id,data,djHeld.current)) return;
          if (kind === 0x90 || kind === 0x80) return;
        }
        if (kind === 0x90 && second > 0) {
          if (midiLearnRef.current === MASTER_FADER) setFaderSignal((input.name || "MIDI") + " · Nota " + first + " recibida. Para volumen, mové un fader o Pitch Bend.");
          piano?.midiNote(input.id, channel, first, second / 127);
          return;
        }
        if (kind === 0x80 || (kind === 0x90 && second === 0)) {
          piano?.midiNote(input.id, channel, first, 0);
          return;
        }
        const master = ccMapRef.current[MASTER_FADER];
        const learning = midiLearnRef.current === MASTER_FADER;
        if (kind === 0xe0 && (learning || (fromPort(master) && master?.bendChannel === channel))) {
          if (learning) {
            reassignMidi({id:JSON.stringify([input.id,channel,"bend",0]),alias,owner:"master"});
            setCcMap(current => ({ ...current, [MASTER_FADER]: {inputId: input.id, inputName: input.name, cc: -1, bendChannel: channel} }));
            midiLearnRef.current = null;
            setMidiLearnFor(null);
          }
          const percent = Math.round((first + 128 * second) * 100 / 16383);
          setMasterVolume(percent);
          setFaderSignal(input.name + " · Pitch Bend · " + percent + "%");
          return;
        }
        if (kind === 0xb0) {
          if (first === 120 || first === 123) piano?.releaseMidi(input.id, channel);
          if (first >= 120) return;
          const waitingFor = midiLearnRef.current;
          const controlsMaster=fromPort(master) && master?.cc===first && (master.ccChannel===undefined || master.ccChannel===channel);
          if (learning || controlsMaster) {
            setMasterVolume(Math.round(second * 100 / 127));
            setFaderSignal(input.name + " · CC " + first + " · " + second + "/127");
          }
          if (waitingFor !== null) {
            reassignMidi({id:JSON.stringify([input.id,channel,"cc",first]),alias,owner:"master"});
            setCcMap((current) => {
              const next = { ...current };
              Object.keys(next).forEach((key) => {
                const binding = next[Number(key)];
                if (binding && fromPort(binding) && binding.cc === first) delete next[Number(key)];
              });
              next[waitingFor] = { inputId: input.id, inputName: input.name, cc: first, ccChannel: channel };
              ccMapRef.current = next;
              return next;
            });
            midiLearnRef.current = null;
            setMidiLearnFor(null);
            return;
          }
          if (first === 64 && !controlsMaster) piano?.sustainMidi?.(input.id, channel, second >= 64);
        }
      };


  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey ||
          (event.target instanceof Element && event.target.closest("input, select, textarea, [contenteditable=true]"))) return;
      const note = computerPianoKeys[event.key.toLowerCase()];
      if (note !== undefined) pianoRouting.current?.computerNote(event.code || event.key, note, true);
    };
    const up = (event: KeyboardEvent) => {
      const note = computerPianoKeys[event.key.toLowerCase()];
      if (note !== undefined) pianoRouting.current?.computerNote(event.code || event.key, note, false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    const reset = (event: Event) => { if ((event as CustomEvent).detail !== "synth") { midiLearnRef.current = null; setMidiLearnFor(null); } };
    const releaseMaster = (event: Event) => {
      const {id,alias,owner}=(event as CustomEvent<MidiReassignment>).detail;
      if (owner==="master") return;
      const binding=ccMapRef.current[MASTER_FADER];
      if (!binding) return;
      const [inputId,channel,type,number]=JSON.parse(id);
      const deviceName=alias ? JSON.parse(alias)[1] : undefined;
      const samePort=binding.inputName && deviceName ? binding.inputName===deviceName : binding.inputId===inputId;
      const sameControl=type==="cc" ? binding.cc===number && (binding.ccChannel===undefined || binding.ccChannel===channel)
        : type==="bend" && binding.cc===-1 && binding.bendChannel===channel;
      if (!samePort || !sameControl) return;
      setCcMap(current=>{
        const next={...current};
        delete next[MASTER_FADER];
        ccMapRef.current=next;
        return next;
      });
    };
    window.addEventListener("860-midi-learn", reset);
    window.addEventListener(MIDI_REASSIGNMENT,releaseMaster);
    return () => {
      window.removeEventListener("860-midi-learn",reset);
      window.removeEventListener(MIDI_REASSIGNMENT,releaseMaster);
    };
  }, [setCcMap]);
  const beginMidiLearn = (index: number) => {
    window.dispatchEvent(new CustomEvent("860-midi-learn",{detail:"synth"}));
    void connectMidi(true);
    midiLearnRef.current = index;
    setMidiLearnFor(index);
  };

  return (
    <main className={styles.console}>
      <h1 className={styles.scoreTitle}>860 Multiversos</h1>
      <TempoProvider><ModuleZero firstMidi={firstMidi} calibration={calibration} toggleCalibration={() => setCalibration(value => !value)} faderSignal={faderSignal} masterVolume={masterVolume} setMasterVolume={setMasterVolume} faderBinding={ccMap[MASTER_FADER]} learningFader={midiLearnFor === MASTER_FADER} learnFader={() => { if (midiLearnFor === MASTER_FADER) { midiLearnRef.current = null; setMidiLearnFor(null); } else { setFaderSignal(""); beginMidiLearn(MASTER_FADER); } }} pianoRouting={pianoRouting} connectMidi={connectMidi} midiConnection={midiConnection} midiInputs={midiInputs} /></TempoProvider>
      <div className={styles.horizon}>
        <span>LA FRONTERA ENTRE ESCUCHAR Y VER</span>
        <i />
        <span>ARRASTRÁ · TOCÁ · CONECTÁ</span>
      </div>

      <footer className={styles.footer}>
        <span><a href="/" aria-label="UnderTango Club, inicio">◆ UNDER TANGO CLUB</a> <i>/</i> 860 MULTIVERSOS</span>
        <span>{midiInputs.length > 0 ? "MIDI ACTIVO · " + midiInputs.length + " DISPOSITIVO(S)" : "PROTOTIPO SONORO · AUDIO Y VISUALES GENERATIVOS"}</span>
      </footer>
    </main>
  );
}
