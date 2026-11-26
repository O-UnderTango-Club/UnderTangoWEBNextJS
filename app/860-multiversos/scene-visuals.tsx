import { useEffect, useRef, type ReactNode } from "react";
import { frequencyPoint, type FrequencyVector } from "./frequency-tuning";
import {
  BREATH_CUE, CROSS_CUE, NOISE_COLORS, NOISE_CUE, noiseJourney, NOISE_IDS, RETURN_CUE, SCENE_SYMBOLS, SPHERE_CUE,
  crossTuningAt, sceneProgress, type ContinuationScene, type NoiseColor, type NoisePair,
} from "./scene-cues";

const WIDTH = 640, HEIGHT = 360, CENTER_X = WIDTH / 2, CENTER_Y = HEIGHT / 2;
const TRAIL_SPAN = 188, SPHERE_RADIUS = 104, FRAME_RADIUS = 121;

type Ink = CanvasRenderingContext2D;
type Point = { x: number; y: number };
type NoiseSphere = Point & { id: NoiseColor; radius: number };

const NOISE_ROWS = [183, 165, 174, 190];
const NOISE_SPHERES = NOISE_IDS.map((id, index) => ({ id, x: 105 + index * 143, y: NOISE_ROWS[index], radius: 43 }));
const SPHERE_BY_COLOR = Object.fromEntries(NOISE_SPHERES.map((item) => [item.id, item])) as Record<NoiseColor, NoiseSphere>;

const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;
const ease = (progress: number) => progress * progress * (3 - 2 * progress);

function frequencySymbol(ink: Ink, notes: FrequencyVector, center: Point, radius: number, yaw: number, alpha: number) {
  if (alpha <= 0) return;
  const cs = Math.cos(yaw), sn = Math.sin(yaw);
  const ct = Math.cos(0.62), st = Math.sin(0.62);
  const steps = 128;
  const path = Array.from({ length: steps + 1 }, (_, index) => {
    const p = frequencyPoint(index / steps * 2 * Math.PI, notes);
    const far = p.x * sn + p.y * cs;
    const z = -far * st + p.z * ct;
    const perspective = 4.5 / (4.5 - z);
    return {
      x: center.x + (p.x * cs - p.y * sn) * radius * perspective,
      y: center.y - (far * ct + p.z * st) * radius * perspective,
      z,
    };
  });
  const segments = path.slice(1).map((to, index) => ({ from: path[index], to, hue: 213 + (index / steps) * 47 }));
  segments.sort((a, b) => a.from.z + a.to.z - b.from.z - b.to.z);
  ink.save();
  ink.globalAlpha = alpha;
  ink.lineCap = "round";
  for (const { from, to, hue } of segments) {
    ink.beginPath();
    ink.moveTo(from.x, from.y);
    ink.lineTo(to.x, to.y);
    ink.lineWidth = Math.max(0.9, radius * (0.083 + 0.021 * to.z));
    ink.strokeStyle = `hsl(${hue} 45% ${49 + to.z * 16}%)`;
    ink.stroke();
  }
  ink.restore();
}

function crossTrail(ink: Ink, progress: number, alpha: number, count = 24) {
  if (alpha <= 0) return;
  const travel = sceneProgress(progress, CROSS_CUE.morph, CROSS_CUE.formed);
  const visible = sceneProgress(progress, 0, CROSS_CUE.enter);

  for (let index = 0; index <= Math.floor(travel * count); index++) {
    const position = index / count;
    frequencySymbol(ink, crossTuningAt(position), { x: lerp(CENTER_X - TRAIL_SPAN, CENTER_X + TRAIL_SPAN, position), y: CENTER_Y },
      28, 2.36, alpha * visible * (index === 0 ? 1 : 0.91));
  }
  const appear = sceneProgress(progress, CROSS_CUE.enter, CROSS_CUE.morph);
  if (travel < 1) {
    const x = lerp(CENTER_X - TRAIL_SPAN, CENTER_X + TRAIL_SPAN, travel);
    frequencySymbol(ink, crossTuningAt(travel), { x, y: CENTER_Y }, 28, 2.36 + appear * 0.27, alpha * appear);
  }
}

function frame(ink: Ink, center: Point, radius: number, alpha: number, flatten = 1) {
  if (alpha <= 0) return;
  ink.save();
  ink.globalAlpha = alpha;
  ink.beginPath();
  ink.rect(center.x - radius, center.y - radius * flatten, radius * 2, radius * 2 * flatten);
  ink.lineWidth = 1.35;
  ink.strokeStyle = "#4c5871";
  ink.stroke();
  ink.restore();
}

function sphere(ink: Ink, { x, y, radius, id }: NoiseSphere, alpha: number, yaw: number) {
  if (alpha <= 0 || radius <= 0) return;
  const { hue, saturation } = NOISE_COLORS[id];
  ink.save();
  ink.globalAlpha = alpha;
  const fill = ink.createRadialGradient(x - radius * 0.37, y - radius * 0.43, radius * 0.035, x, y, radius);
  fill.addColorStop(0, `hsl(${hue} ${saturation}% 99%)`);
  fill.addColorStop(0.51, `hsl(${hue} ${saturation}% ${id === "white" ? 94 : 81}%)`);
  fill.addColorStop(0.79, `hsl(${hue} ${saturation}% ${id === "white" ? 83 : 63}%)`);
  fill.addColorStop(1, `hsl(${hue} ${saturation}% ${id === "white" ? 68 : 42}%)`);
  ink.beginPath();
  ink.arc(x, y, radius, 0, Math.PI * 2);
  ink.fillStyle = fill;
  ink.fill();
  ink.lineWidth = 1.05;
  ink.strokeStyle = `hsl(${hue} ${saturation / 2}% 40% / 0.68)`;
  ink.stroke();
  ink.clip();

  const tilt = 0.34;
  const sinTilt = Math.sin(tilt), cosTilt = Math.cos(tilt);
  const project = (latitude: number, longitude: number) => {
    const px = Math.cos(latitude) * Math.sin(longitude + yaw);
    const py = Math.sin(latitude), pz = Math.cos(latitude) * Math.cos(longitude + yaw);
    return { x: x + radius * px, y: y - radius * (py * cosTilt - pz * sinTilt), front: pz * cosTilt + py * sinTilt >= 0 };
  };
  const trace = (sample: (amount: number) => ReturnType<typeof project>) => {
    let penDown = false;
    ink.beginPath();
    for (let i = 0; i <= 64; i++) {
      const point = sample(i / 64);
      if (point.front) {
        if (penDown) ink.lineTo(point.x, point.y);
        else ink.moveTo(point.x, point.y);
      }
      penDown = point.front;
    }
    ink.stroke();
  };
  ink.lineWidth = 0.72;
  ink.strokeStyle = `hsl(${hue} ${Math.max(10, saturation / 2)}% 42% / 0.23)`;
  for (let i = -2; i <= 2; i++) trace((t) => project(i * 0.32, Math.PI * 2 * t));
  for (let i = 0; i < 12; i++) trace((t) => project(Math.PI * (t - 0.5), i * Math.PI / 6));

  ink.fillStyle = `hsl(${hue} ${saturation}% 32% / 0.35)`;
  for (let i = 1; i <= 240; i++) {
    const latitude = Math.asin(2 * (i - 0.5) / 240 - 1);
    const point = project(latitude, i * 2.399963);
    if (point.front) ink.fillRect(point.x, point.y, 1.15, 1.15);
  }
  ink.restore();
}

function reveal(ink: Ink, progress: number, begins: number, ends: number) {
  const pull = ease(sceneProgress(progress, begins, ends));
  const center = { x: CENTER_X, y: CENTER_Y };
  sphere(ink, { ...center, id: "white", radius: lerp(428, SPHERE_RADIUS, Math.sqrt(pull)) },
    sceneProgress(progress, begins, begins + 0.16), lerp(-0.31, 0.2, pull));
  return pull;
}

function planeFrame(ink: Ink, progress: number, shownAt: number, pull: number) {
  const enclose = ease(sceneProgress(pull, 0.60, 1));
  const patch = lerp(113, 36, pull);
  const y = CENTER_Y - 61 * pull * (1 - enclose);
  frame(ink, { x: CENTER_X, y }, lerp(patch, FRAME_RADIUS, enclose),
    sceneProgress(progress, shownAt, shownAt + 0.22), lerp(1 - pull * 0.56, 1, enclose));
}

function soundGallery(ink: Ink, progress: number) {
  const gather = ease(sceneProgress(progress, SPHERE_CUE.gather, SPHERE_CUE.grouped));
  crossTrail(ink, 1, (1 - gather) ** 2);
  const pull = reveal(ink, progress, SPHERE_CUE.pullback, SPHERE_CUE.white);
  const size = lerp(1, 0.31, pull);
  for (const [index, symbol] of SCENE_SYMBOLS.entries()) {
    const origin = symbol.vertical
      ? { x: CENTER_X, y: CENTER_Y + lerp(102, -102, symbol.progress) }
      : { x: CENTER_X + lerp(-TRAIL_SPAN, TRAIL_SPAN, symbol.progress), y: CENTER_Y };
    const desired = { x: CENTER_X + ((index % 4) - 1.5) * 47 * size, y: CENTER_Y + (Math.floor(index / 4) - 1) * 55 * size - 61 * pull };
    const center = { x: lerp(origin.x, desired.x, gather), y: lerp(origin.y, desired.y, gather) };
    frequencySymbol(ink, symbol.notes, center, lerp(24, 14, gather) * size, 2.36 - gather * 1.3,
      gather * (1 - sceneProgress(pull, 0.62, 1)));
  }
  planeFrame(ink, progress, SPHERE_CUE.gather, pull);
}

function connection(ink: Ink, from: NoiseSphere, to: NoiseSphere, progress: number, alpha: number, inset = 0.62) {
  if (progress <= 0) return;
  const direction = Math.sign(to.x - from.x);
  const start = from.x + direction * from.radius * inset;
  const end = to.x - direction * to.radius * inset;
  const middle = { x: (start + end) / 2, y: Math.min(from.y, to.y) - 110 };
  const path = (t: number) => ({
    x: (1 - t) ** 2 * start + 2 * (1 - t) * t * middle.x + t * t * end,
    y: (1 - t) ** 2 * from.y + 2 * (1 - t) * t * middle.y + t * t * to.y,
  });
  const gradient = ink.createLinearGradient(start, from.y, end, to.y);
  gradient.addColorStop(0, `hsl(${NOISE_COLORS[from.id].hue} 50% 43%)`);
  gradient.addColorStop(1, `hsl(${NOISE_COLORS[to.id].hue} 76% 49%)`);
  ink.save();
  ink.globalAlpha = alpha;
  ink.strokeStyle = gradient;
  ink.lineWidth = 1.8;
  ink.beginPath();
  for (let i = 0; i <= 40; i++) {
    const point = path(progress * i / 40);
    if (i === 0) ink.moveTo(point.x, point.y);
    else ink.lineTo(point.x, point.y);
  }
  ink.stroke();
  const tip = path(progress);
  ink.fillStyle = gradient;
  ink.beginPath();
  ink.arc(tip.x, tip.y, 3.25, 0, Math.PI * 2);
  ink.fill();
  ink.restore();
}

function noiseField(ink: Ink, progress: number, pair: NoisePair) {
  const spread = ease(sceneProgress(progress, NOISE_CUE.spread, NOISE_CUE.spreadOut));
  const legs = noiseJourney(pair);
  const current = legs.find(leg => progress < leg.arrive) ?? legs[legs.length - 1];
  const linking = sceneProgress(progress, current.depart, current.arrive);
  frame(ink, { x: CENTER_X, y: CENTER_Y }, FRAME_RADIUS, 1 - spread);
  for (const leg of legs) {
    connection(ink, SPHERE_BY_COLOR[leg.from], SPHERE_BY_COLOR[leg.to],
      sceneProgress(progress, leg.depart, leg.arrive), 1, 0);
  }

  for (const item of NOISE_SPHERES) {
    const { id, x, y, radius } = item;
    const light = id === "white" ? 1 : spread;
    const emphasis = id === current.from ? 1 - linking : id === current.to ? linking : 0;
    const position = { x: lerp(CENTER_X, x, spread), y: lerp(CENTER_Y, y, spread) };
    const scale = id === "white" ? lerp(SPHERE_RADIUS, radius, spread) : lerp(9, radius, spread);
    sphere(ink, { id, ...position, radius: scale + 9 * emphasis * spread }, light, 0.2 + spread * (x / WIDTH - 0.5));
    ink.save();
    ink.globalAlpha = spread;
    ink.font = `${emphasis >= 0.5 ? 650 : 450} 14px system-ui, sans-serif`;
    ink.textAlign = "center";
    ink.fillStyle = "#272d3b";
    ink.fillText(NOISE_COLORS[id].label, x, y + radius + 31);
    ink.restore();
  }
}

function returnPlane(ink: Ink, gather: number, pull: number, pair: NoisePair) {
  if (gather < 1) {
    connection(ink, SPHERE_BY_COLOR[pair.from], SPHERE_BY_COLOR[pair.to], 1, 1 - gather);
  }
  for (const [index, item] of NOISE_SPHERES.entries()) {
    const width = lerp(1, 0.30, pull);
    const row = index < 2 ? -1 : 1;
    const x = CENTER_X + (index % 2 === 0 ? -1 : 1) * 48 * width;
    const y = CENTER_Y + row * 48 * width - 61 * pull;
    const position = { x: lerp(item.x, x, gather), y: lerp(item.y, y, gather) };
    ink.save();
    ink.translate(position.x, position.y);
    ink.scale(1, 1 - 0.60 * gather);
    sphere(ink, { id: item.id, x: 0, y: 0,
      radius: lerp(item.radius + (item.id === pair.to ? 9 : 0), 24 * width, gather) },
      1 - sceneProgress(pull, 0.47, 1), 0.2 + item.x / WIDTH - 0.5);
    ink.restore();
    if (gather < 1) {
      ink.save();
      ink.globalAlpha = 1 - gather;
      ink.font = "14px system-ui, sans-serif";
      ink.textAlign = "center";
      ink.fillStyle = "#272d3b";
      ink.fillText(NOISE_COLORS[item.id].label, position.x, position.y + item.radius + 31);
      ink.restore();
    }
  }
  planeFrame(ink, gather, 0.12, pull);
}

const DESCRIPTIONS: Record<ContinuationScene, string> = {
  cross: "Dos estelas de objetos tridimensionales forman una cruz",
  sphere: "Los objetos se reúnen en un cuadrado que se revela sobre una esfera",
  noise: "Esferas de ruido blanco, rosa, azul y marrón",
  return: "La unión de ruido blanco y rosa se reúne con las otras sonoridades en un plano",
  breath: "El plano revela una esfera blanca que queda quieta",
};

export function ContinuationProjection({ scene, startsAt, seconds, clock, pair, inheritedTrail, intervalMs, hold = false }: {
  scene: ContinuationScene; startsAt: number; seconds: number; clock: AudioContext; hold?: boolean;
  pair: NoisePair; inheritedTrail: ReactNode; intervalMs: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current, ink = canvas?.getContext("2d");
    if (!canvas || !ink) return;
    let animation = 0, last = -1;
    const draw = () => {
      const progress = hold ? 1 : sceneProgress(clock.currentTime, startsAt, startsAt + seconds);
      if (last === -1 || Math.abs(progress - last) * seconds > 1 / 32 || (progress === 1 && last < 1)) {
        last = progress;
        ink.clearRect(0, 0, WIDTH, HEIGHT);
        if (trailRef.current) {
          const opacity = scene === "cross" ? 1 : 1 - ease(sceneProgress(progress, SPHERE_CUE.gather, SPHERE_CUE.grouped));
          trailRef.current.style.opacity = String(opacity);
        }
        switch (scene) {
          case "cross": {
            const samples = Math.max(1, Math.round(seconds * (CROSS_CUE.formed - CROSS_CUE.morph) * 1000 / intervalMs));
            crossTrail(ink, progress, 1, samples);
            ink.fillStyle = "#353958";
            ink.font = "9px sans-serif";
            ink.textAlign = "center";
            for (const end of [0, 1]) ink.fillText(crossTuningAt(end).map(Math.round).join(" · ") + " Hz",
              CENTER_X + (2 * end - 1) * TRAIL_SPAN, CENTER_Y + 48);
            break;
          }
          case "sphere": soundGallery(ink, progress); break;
          case "noise": noiseField(ink, progress, pair); break;
          case "return": {
            const gather = ease(sceneProgress(progress, RETURN_CUE.gather, RETURN_CUE.grouped));
            returnPlane(ink, gather, 0, pair);
            break;
          }
          case "breath": {
            const pull = reveal(ink, progress, BREATH_CUE.pullback, BREATH_CUE.revealed);
            returnPlane(ink, 1, pull, pair);
            break;
          }
        }
      }
      if (progress < 1) animation = window.requestAnimationFrame(draw);
    };
    const resize = () => {
      window.cancelAnimationFrame(animation);
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * density));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * density));
      ink.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
      last = -1;
      draw();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      window.cancelAnimationFrame(animation);
      observer.disconnect();
    };
  }, [clock, hold, pair, scene, seconds, startsAt, intervalMs]);

  const label = hold ? "Esfera blanca en reposo" : scene === "noise"
    ? `${DESCRIPTIONS.noise}. Recorrido: ${[pair.from, ...noiseJourney(pair).map(leg => leg.to)].map(id => NOISE_COLORS[id].label).join(' → ')}` : DESCRIPTIONS[scene];
  return <div className="zero-harmonic-frame">
    {inheritedTrail && <div ref={trailRef} className="zero-frequency-space" aria-hidden="true">{inheritedTrail}</div>}
    <canvas ref={canvasRef} className="zero-harmonic-diagram" role="img" aria-label={label} />
  </div>;
}

export function RestingSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current, ink = canvas?.getContext("2d");
    if (!canvas || !ink) return;
    const resize = () => {
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(canvas.clientWidth * density));
      canvas.height = Math.max(1, Math.round(canvas.clientHeight * density));
      ink.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
      reveal(ink, 1, BREATH_CUE.pullback, BREATH_CUE.revealed);
      planeFrame(ink, 1, 0.12, 1);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  return <canvas ref={canvasRef} className="zero-harmonic-diagram zero-resting-sphere" role="img" aria-label="Esfera blanca en reposo" />;
}
