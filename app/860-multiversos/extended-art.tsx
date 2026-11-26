import { useEffect, useLayoutEffect, useRef } from "react";
import { temperedFrequency, type ExtendedScene } from "./extended-scenes";

const BACH_PORTRAIT = "/multiversos/bach-haussmann.jpg";
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const CORNERS = [-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as const)));
const CUBE_EDGES = CORNERS.flatMap((_, index) => [1, 2, 4].map((bit) => index ^ bit).filter((other) => index < other).map((other) => [index, other] as const));

function makeFractal() {
  const cubes: { x: number; y: number; z: number; size: number; depth: number; root: number }[] = [];
  const split = (x: number, y: number, z: number, size: number, depth: number, root: number) => {
    cubes.push({ x, y, z, size, depth, root });
    if (depth === 3) return;
    for (const [dx, dy, dz] of CORNERS) split(x + 0.94 * size * dx, y + 0.94 * size * dy, z + 0.94 * size * dz, size * 0.34, depth + 1, root);
  };
  for (let root = 0; root < 3; root++) split((root - 1) * 1.85, 0, 0, 0.58, 0, root);
  return cubes;
}

function makeSpherePoints(count: number) {
  let seed = 78259;
  const random = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return (seed + 1) / 4294967297;
  };
  return Array.from({ length: count }, () => {
    const values = Array.from({ length: 6 }, () => Math.sqrt(-2 * Math.log(random())) * Math.cos(2 * Math.PI * random()));
    const norm = Math.hypot(...values);
    return values.map((dimension) => dimension / norm);
  });
}

const FRACTAL = makeFractal();
const SPHERE_POINTS = makeSpherePoints(FRACTAL.length);
const COLORS = ["#d3b3ff", "#8ef0e8", "#ffc287"];

function drawFractal(context: CanvasRenderingContext2D, width: number, height: number, progress: number, time: number) {
  context.clearRect(0, 0, width, height);
  const expansion = smooth(progress / 0.68);
  const morph = smooth((progress - 0.49) / 0.31);
  const radius = Math.min(width * 0.31, height * 0.285);
  const centerX = width * 0.5, centerY = height * (0.48 - morph * 0.065);
  const unit = Math.min(width / 5.75, height * 0.28) / (1 + 2.8 * expansion);
  const turn = time * 0.13;
  const yaw = 0.53 + expansion * 0.27;
  const cos = Math.cos(yaw), sin = Math.sin(yaw);
  const project = (x: number, y: number, z: number) => [x * cos - z * sin, 0.45 * (x * sin + z * cos) - 0.83 * y];
  const local = CORNERS.map(([x, y, z]) => project(x, y, z));
  const sphereCos = Math.cos(turn), sphereSin = Math.sin(turn);
  const visibleDepth = Math.min(3, Math.floor(expansion * 3.8));

  if (morph > 0.02) {
    context.strokeStyle = `rgba(201, 185, 255, ${0.42 * morph})`;
    context.lineWidth = 1;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    context.stroke();
    context.beginPath();
    context.ellipse(centerX, centerY, radius * 0.43, radius, turn * 0.43, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.ellipse(centerX, centerY, radius, radius * 0.40, -turn * 0.38, 0, Math.PI * 2);
    context.stroke();
  }

  for (const [index, cube] of FRACTAL.entries()) {
    if (morph === 0 && cube.depth > visibleDepth) continue;
    const [x, y] = project(cube.x, cube.y, cube.z);
    const [a, b, c, d, e, f] = SPHERE_POINTS[index];
    const sphereX = (a * sphereCos + d * sphereSin) * radius;
    const sphereY = (b * sphereCos + e * sphereSin) * radius;
    const depth = c * sphereCos + f * sphereSin;
    const px = centerX + (1 - morph) * x * unit + morph * sphereX;
    const py = centerY + (1 - morph) * y * unit + morph * sphereY;
    if (morph < 0.99) {
      const alpha = (cube.depth ? smooth(expansion * 3.8 - cube.depth + 0.4) : 1) * (1 - morph);
      const scale = cube.size * unit * (1 - 0.72 * morph);
      context.globalAlpha = alpha * (0.9 - cube.depth * 0.14);
      context.strokeStyle = COLORS[cube.root];
      context.lineWidth = cube.depth === 0 ? 1.6 : 0.8;
      context.beginPath();
      for (const [from, to] of CUBE_EDGES) {
        context.moveTo(px + local[from][0] * scale, py + local[from][1] * scale);
        context.lineTo(px + local[to][0] * scale, py + local[to][1] * scale);
      }
      context.stroke();
    }
    if (morph > 0) {
      context.globalAlpha = morph * (0.22 + (depth + 1) * 0.26);
      context.fillStyle = COLORS[cube.root];
      context.fillRect(px, py, 1.35 + depth * 0.45, 1.35 + depth * 0.45);
    }
  }
  context.globalAlpha = 1;
}

export function ExtendedArt({ scene, clock, beginsAt, seconds, paused, a4 }: {
  scene: ExtendedScene; clock: AudioContext; beginsAt: number; seconds: number; paused: boolean; a4: number;
}) {
  const art = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const panel = art.current;
    if (!panel || scene === 19) return;
    const image = canvas.current;
    const draw = image?.getContext("2d");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let width = 0, height = 0;
    const paint = () => {
      const elapsed = Math.max(0, clock.currentTime - beginsAt);
      const progress = clamp(elapsed / Math.max(1, seconds));
      if (draw) drawFractal(draw, width, height, reduced ? 1 : progress, reduced ? 0 : elapsed);
      panel.style.setProperty("--extended-reveal", `${scene === 16 ? smooth((progress - 0.63) / 0.22) : smooth((progress - 0.15) / 0.56)}`);
      if (scene === 17) {
        const flash = smooth((progress - 0.31) / 0.065) * (1 - smooth((progress - 0.41) / 0.13));
        panel.style.setProperty("--bach-visibility", `${reduced ? 0.58 : 0.94 * flash}`);
      }
      if (!paused && (progress < 1 || scene === 16 && !reduced)) frame = window.requestAnimationFrame(paint);
    };
    const resize = () => {
      window.cancelAnimationFrame(frame);
      width = panel.clientWidth;
      height = panel.clientHeight;
      if (image && draw) {
        const density = Math.min(2, window.devicePixelRatio || 1);
        image.width = width * density;
        image.height = height * density;
        draw.setTransform(density, 0, 0, density, 0, 0);
      }
      paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(panel);
    resize();
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); };
  }, [beginsAt, clock, paused, scene, seconds]);

  if (scene === 19) return <div className="extended-timbre-cue"><p>Ahora trabajemos el timbre.</p></div>;
  if (scene === 16) return <div className="extended-fractal" data-extended-scene={scene} ref={art}>
    <canvas ref={canvas} role="img" aria-label="Cubos fractales que se alejan y se reúnen en la proyección de una esfera de seis dimensiones" />
    <div className="extended-condition">
      <p>Vibración</p>
      <h2>Condición inicial</h2>
      <span>La sexta dimensión es las condiciones necesarias para que todas las dimensiones de abajo sucedan.</span>
    </div>
  </div>;
  return <div className="extended-tuning" data-extended-scene={scene} ref={art}>
    <div className="extended-tuning-orbit extended-orbit-left" aria-hidden="true" />
    <div className="extended-tuning-orbit extended-orbit-right" aria-hidden="true" />
    <figure className="extended-bach">
      <img src={BACH_PORTRAIT} alt="Retrato de Johann Sebastian Bach por Elias Gottlob Haussmann" />
      <figcaption>Johann Sebastian Bach</figcaption>
    </figure>
    <div className="extended-tuning-bridge">
      <div><h2>Multiversos</h2><p>111 · 222 · 333 Hz</p></div>
      <div className="extended-a4"><span>La4</span><strong>{a4} Hz</strong></div>
      <div><h2>Temperamento igual</h2><p>12 semitonos por octava</p></div>
    </div>
  </div>;
}

export function useExtendedArtAudio(scene: ExtendedScene | null, clock: AudioContext | null, beginsAt: number, seconds: number, a4: number,
  outputRef: { current: GainNode | null }) {
  useEffect(() => {
    const output = outputRef.current;
    if (!output || !clock || (scene !== 16 && scene !== 17)) return;
    const bus = clock.createGain();
    bus.connect(output);
    const oscillators: OscillatorNode[] = [];
    const availableAt = clock.currentTime + 0.012;
    const time = Math.max(seconds, 1);
    const tone = (frequency: number, from: number, to: number, volume: number) => {
      const at = Math.max(beginsAt + time * from, availableAt), end = beginsAt + time * to;
      if (end - at < 0.012) return;
      const oscillator = clock.createOscillator();
      const level = clock.createGain();
      const ramp = Math.min(0.45, (end - at) * 0.20);
      oscillator.frequency.value = frequency;
      level.gain.setValueAtTime(0, at);
      level.gain.linearRampToValueAtTime(volume, at + ramp);
      level.gain.setValueAtTime(volume, end - ramp);
      level.gain.linearRampToValueAtTime(0, end);
      oscillator.connect(level).connect(bus);
      oscillator.onended = () => { oscillator.disconnect(); level.disconnect(); };
      oscillator.start(at);
      oscillator.stop(end + 0.01);
      oscillators.push(oscillator);
    };
    if (scene === 16) {
      tone(111, 0.06, 0.98, 0.075);
      tone(222, 0.32, 0.97, 0.035);
    } else {
      [111, 222, 333].forEach((frequency, index) => tone(frequency, 0.05 + index * 0.082, 0.39, 0.062));
      tone(a4, 0.34, 0.94, 0.096);
      tone(temperedFrequency(73, a4), 0.54, 0.94, 0.052);
      tone(temperedFrequency(76, a4), 0.64, 0.94, 0.052);
    }
    return () => {
      bus.disconnect();
      if (clock.state !== "closed") oscillators.forEach((oscillator) => oscillator.stop());
    };
  }, [a4, beginsAt, clock, outputRef, scene, seconds]);
}
