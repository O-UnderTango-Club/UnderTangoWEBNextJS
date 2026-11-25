import { useEffect, useRef } from "react";
import { collisionBeat, collisionTiming, pointTiming, type StrikeLog } from "./opening-sound";

type Cue = { context: AudioContext; beginsAt: number };
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const ease = (n: number) => { const x = clamp(n); return x * x * (3 - 2 * x); };
const tau = 2 * Math.PI;

function dot(ink: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ink.beginPath(); ink.arc(x, y, radius, 0, tau); ink.fill();
}

function strike(ink: CanvasRenderingContext2D, size: number, age: number, strength: number, note: number, still: boolean) {
  if (age < 0 || age >= 1.45 || size === 0) return;
  const t = age / 1.45, tail = (1 - t) ** 1.65;
  const reach = size * (.15 + .22 * strength);
  ink.save();
  ink.rotate(note % 12 * tau / 12);
  ink.fillStyle = "#11131b";
  ink.globalAlpha = Math.min(1, tail * 2.6);
  dot(ink, 0, 0, size * (.009 + .012 * strength) * (1 - .8 * ease(t / .55)));
  if (!still) {
    for (let echo = 0; echo < 4; echo++) {
      const moment = t - echo * .047;
      if (moment <= 0) continue;
      const radius = reach * (1 - Math.exp(-2.1 * moment));
      ink.strokeStyle = echo === 0 ? "#282635" : "#747689";
      ink.lineWidth = Math.max(.65, size * .0018) * (1 - echo * .12);
      ink.globalAlpha = tail * (.82 - echo * .12);
      ink.beginPath();
      for (let step = 0; step <= 128; step++) {
        const a = tau * step / 128;
        const bend = 1 + (.055 + .16 * tail) * Math.sin(3 * a - t * 5 + note * .3) + .055 * Math.sin(7 * a + t * 9 + echo * .35);
        const x = radius * bend * Math.cos(a), y = radius * bend * Math.sin(a) * (.82 + .18 * t);
        if (step === 0) ink.moveTo(x, y); else ink.lineTo(x, y);
      }
      ink.closePath(); ink.stroke();
    }
    ink.lineWidth = .8; ink.strokeStyle = "#343442"; ink.globalAlpha = .54 * tail;
    for (let spoke = 0; spoke < 18; spoke++) {
      const a = tau * spoke / 18 + .14 * Math.sin(spoke * 3 + note);
      const r = reach * (1 - Math.exp(-2.9 * t)) * (.78 + .22 * Math.sin(spoke * 5 + .3));
      ink.beginPath(); ink.moveTo(r * .78 * Math.cos(a), r * .78 * Math.sin(a));
      ink.lineTo(r * Math.cos(a + .035), r * Math.sin(a + .035)); ink.stroke();
    }
  }
  ink.restore();
}

function collisions(ink: CanvasRenderingContext2D, w: number, h: number, elapsed: number, seconds: number, still: boolean) {
  const {lead, ramp, harmonics} = collisionTiming(seconds);
  const t = clamp((elapsed - lead) / ramp), turn = ease((t - .68) / .32);
  const beats = collisionBeat(elapsed - lead, ramp), index = Math.floor(beats), phase = beats - index;
  const span = Math.min(w * .31, h * .47, 330) * (1 - turn) + Math.min(w * .15, h * .19, 105) * turn;
  const r = Math.max(2, Math.min(w, h) * .009);
  ink.save(); ink.rotate(-Math.PI / 2 * turn);
  ink.fillStyle = "#13141b"; ink.globalAlpha = ease((elapsed + .02) / Math.max(.2, lead));
  dot(ink, -span, 0, r * (1 - .64 * turn)); dot(ink, span, 0, r * (1 - .64 * turn));
  if (elapsed >= lead) {
    const contact = (n: number) => (2 * ((.5 + n * .61803398875) % 1) - 1) * span * .91;
    const density = ease((t - .34) / .50);
    ink.strokeStyle = "#23232c"; ink.lineWidth = 1 + turn * 1.3;
    ink.globalAlpha = .11 + .89 * density; ink.beginPath();
    for (let i = 0; i <= 120; i++) {
      const x = i / 120;
      const wave = still ? 0 : Math.sin(tau * (x * (1 + t * 3) - (2 + t * 4) * elapsed));
      const y = wave * Math.sin(Math.PI * x) * .10 * span * (1 - turn) * (.22 + .78 * density);
      if (i === 0) ink.moveTo(-span, y); else ink.lineTo((2 * x - 1) * span, y);
    }
    ink.stroke();
    for (let n = Math.max(0, index - 7); n <= index && turn < 1; n++) {
      ink.globalAlpha = (1 - turn) * (.16 + .56 * (1 - (index - n) / 8)) * (1 - .5 * density);
      dot(ink, contact(n), 0, Math.max(1.2, r * .48));
    }
    if (!still && density < .98) {
      ink.globalAlpha = (1 - density) * (1 - phase);
      const radius = r * (1.1 + 2.7 * phase);
      ink.beginPath(); ink.ellipse(contact(index), 0, radius, radius * .82, 0, 0, tau); ink.stroke();
    }
  }
  ink.restore();
  if (elapsed >= lead + ramp) {
    ink.fillStyle = "#18191c"; ink.globalAlpha = ease((elapsed - lead - ramp) / (harmonics - lead - ramp));
    ink.font = Math.max(14, Math.min(28, h * .038)) + "px Georgia, serif";
    ink.textAlign = "center"; ink.fillText("111 Hz", 0, span + 28); ink.globalAlpha = 1;
  }
}

export function OpeningProjection({scene, cue, seconds, strikes}: { scene: 1 | 2; cue: Cue; seconds: number; strikes: StrikeLog }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current, ink = canvas?.getContext("2d");
    if (!canvas || !ink) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, width = 1, height = 1, ratio = 1;
    const timing = pointTiming(seconds);
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight; ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * ratio)); canvas.height = Math.max(1, Math.round(height * ratio));
    };
    const draw = () => {
      const elapsed = Math.max(0, cue.context.currentTime - cue.beginsAt), size = Math.min(width, height);
      ink.setTransform(ratio, 0, 0, ratio, 0, 0); ink.clearRect(0, 0, width, height); ink.translate(width / 2, height / 2);
      if (scene === 1) {
        const age = elapsed - timing.gong;
        if (age >= 0 && age < timing.fade) {
          ink.fillStyle = "#101116"; ink.globalAlpha = 1 - ease((age / timing.fade - .5) * 2);
          dot(ink, 0, 0, Math.max(4.5, size * .013)); ink.globalAlpha = 1;
        }
      } else collisions(ink, width, height, elapsed, seconds, motion.matches);
      for (const hit of strikes.current) {
        ink.save();
        if (scene === 2) ink.translate(Math.min(width * .28, height * .4) * ((hit.note % 13) / 6 - 1), 0);
        strike(ink, size * (scene === 2 ? .55 : 1), hit.clock.currentTime - hit.time, hit.velocity, hit.note, motion.matches);
        ink.restore();
      }
      frame = requestAnimationFrame(draw);
    };
    resize(); const observer = new ResizeObserver(resize); observer.observe(canvas); draw();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [scene, cue, seconds, strikes]);
  return <canvas ref={ref} className="opening-field" role="img"
    aria-label={scene === 1 ? "El primer punto y las ondas de cada golpe" : "Dos puntos y sus impactos hasta alcanzar 111 Hz"} />;
}
