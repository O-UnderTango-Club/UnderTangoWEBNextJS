import { sameLine } from './line-detector.mjs';
import { carryPoint } from './camera-motion.mjs';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;

function segment(line, w, h) {
  const x = line.a.x * w,
    y = line.a.y * h,
    dx = (line.b.x - line.a.x) * w,
    dy = (line.b.y - line.a.y) * h;
  return { line, x, y, dx, dy, len: Math.hypot(dx, dy), bottom: Math.max(y, y + dy) };
}

// Two receding seams determine a vanishing point. Transverse edges give the
// ground its roll. With just one edge, use its midpoint as an artistic anchor.
export function readFloor(lines, w, h, prior = null) {
  if (!lines.length) return null;
  const edges = lines.map((l) => segment(l, w, h));
  const rails = edges.filter(
    (e) => Math.abs(e.dy) > 0.12 * h && Math.abs(e.dy) > 0.24 * e.len && e.bottom > 0.42 * h
  );
  const crossEdge = edges.find((e) => Math.abs(e.dy) < 0.4 * e.len && e.bottom > 0.3 * h);
  const angle = crossEdge ? Math.atan(crossEdge.dy / crossEdge.dx) : 0;
  let best = null,
    bestScore = 0;
  for (let i = 0; i < rails.length; i++)
    for (let j = i + 1; j < rails.length; j++) {
      const l = rails[i],
        r = rails[j],
        det = l.dx * r.dy - l.dy * r.dx;
      if (Math.abs(det) < 0.105 * l.len * r.len) continue;
      const t = ((r.x - l.x) * r.dy - (r.y - l.y) * r.dx) / det;
      const x = l.x + t * l.dx,
        y = l.y + t * l.dy;
      if (
        x < -0.48 * w ||
        x > 1.48 * w ||
        y < -0.38 * h ||
        y > 0.63 * h ||
        y > Math.min(l.bottom, r.bottom) - 0.16 * h
      )
        continue;
      const frontY = clamp(Math.max(l.bottom, r.bottom), 0.7 * h, 0.91 * h);
      const x1 = l.x + (l.dx * (frontY - l.y)) / l.dy,
        x2 = r.x + (r.dx * (frontY - r.y)) / r.dy;
      const separation = Math.abs(x2 - x1);
      if (
        separation < 0.19 * w ||
        separation > 2.0 * w ||
        Math.max(x1, x2) < 0.1 * w ||
        Math.min(x1, x2) > 0.9 * w
      )
        continue;
      let support = 0;
      for (const e of rails) {
        const miss = Math.abs((x - e.x) * e.dy - (y - e.y) * e.dx) / e.len;
        if (miss < Math.max(w, h) * 0.027) support += e.len;
      }
      const score = support + 0.22 * (l.len + r.len) + 0.18 * Math.min(w, separation);
      if (score <= bestScore) continue;
      bestScore = score;
      best = {
        kind: 'convergence',
        vanish: { x, y },
        near: { x: clamp((x1 + x2) / 2, 0.14 * w, 0.86 * w), y: frontY },
        spread: clamp(separation * 0.66, 0.22 * w, 0.64 * w),
        angle,
        line: lines[0],
      };
    }
  if (best) return best;
  const edge = edges.find((e) => prior && sameLine(prior, e.line, w, h)) || edges[0];
  const mid = { x: edge.x + edge.dx / 2, y: edge.y + edge.dy / 2 };
  const upper = edge.dy > 0 ? { x: edge.x, y: edge.y } : { x: edge.x + edge.dx, y: edge.y + edge.dy };
  const vanish = {
    x: clamp(mix(mid.x, upper.x, 0.8), 0, w),
    y: clamp(Math.min(upper.y, mid.y - 0.21 * h), -0.1 * h, 0.67 * h),
  };
  return {
    kind: 'edge',
    vanish,
    near: {
      x: clamp(mid.x + 0.48 * (mid.x - vanish.x), 0.12 * w, 0.88 * w),
      y: clamp(mid.y + 0.48 * (mid.y - vanish.y), 0.3 * h, 0.93 * h),
    },
    spread: clamp(edge.len * 0.46, 0.2 * w, 0.55 * w),
    angle: crossEdge ? angle : clamp(Math.atan(edge.dy / (edge.dx || 0.001)), -0.35, 0.35),
    line: edge.line,
  };
}

function copyFloor(floor) {
  return { ...floor, near: { ...floor.near }, vanish: { ...floor.vanish } };
}

export class SignMotion {
  constructor(floor, width, height, gentle = false) {
    this.width = width;
    this.height = height;
    this.gentle = gentle;
    this.floor = copyFloor(floor);
    this.target = copyFloor(floor);
    this.depth = 1.48;
    this.direction = 1;
    this.lane = 0;
    this.lateral = 0.12;
    this.push = 0;
    this.tilt = 0;
    this.energy = 0;
    this.magnification = 1;
    this.spin = 0.08;
    this.travel = 0;
    this.vx = 0;
    this.vy = 0;
    this.project();
  }

  observe(floor) {
    this.target = copyFloor(floor);
  }

  carry(change) {
    const w = this.width,
      h = this.height,
      roll = Math.atan2(change.b, change.a);
    const zoom = Math.hypot(change.a, change.b);
    for (const floor of [this.floor, this.target]) {
      floor.near = carryPoint(floor.near.x, floor.near.y, change, w, h);
      floor.vanish = carryPoint(floor.vanish.x, floor.vanish.y, change, w, h);
      floor.spread = clamp(floor.spread * zoom, 0.14 * w, 0.88 * w);
      floor.angle = clamp(floor.angle + roll, -0.55, 0.55);
    }
    this.magnification = clamp(this.magnification * zoom, 0.67, 1.65);
    this.tilt = clamp(this.tilt + roll + change.dx * 0.8, -0.55, 0.55);
    this.lateral = clamp(this.lateral + change.dx * 3 + roll * 0.6, -0.7, 0.7);
    this.push = clamp(this.push - 3 * (zoom - 1) + 1.6 * change.dy, -0.9, 0.9);
    this.energy = clamp(
      this.energy + 2 * Math.hypot(change.dx, change.dy) + Math.abs(roll) + Math.abs(zoom - 1),
      0,
      1
    );
    this.project();
  }

  resize(w, h) {
    for (const floor of [this.floor, this.target]) {
      for (const point of [floor.near, floor.vanish]) {
        point.x *= w / this.width;
        point.y *= h / this.height;
      }
      floor.spread *= w / this.width;
    }
    this.width = w;
    this.height = h;
    this.project();
  }

  project() {
    const { near, vanish, angle, spread } = this.floor;
    const offset = this.lane * spread,
      inv = 1 / this.depth;
    this.radius = clamp(
      Math.min(this.width, this.height) * 0.135 * this.magnification * inv,
      5,
      0.19 * Math.min(this.width, this.height)
    );
    this.x = clamp(
      vanish.x + (near.x + offset * Math.cos(angle) - vanish.x) * inv,
      1.35 * this.radius,
      this.width - 1.35 * this.radius
    );
    this.y = clamp(
      vanish.y + (near.y + offset * Math.sin(angle) - vanish.y) * inv,
      2.45 * this.radius,
      this.height - 0.24 * this.radius
    );
    this.yaw = 0.4 + 0.36 * Math.sin(this.travel * 0.76) + this.tilt * 0.7;
    this.pitch = -0.13 + 0.12 * Math.sin(this.travel * 0.83) + angle * 0.16;
  }

  advance(dt) {
    const follow = 1 - Math.exp(-dt * 9);
    const f = this.floor,
      t = this.target;
    for (const name of ['near', 'vanish']) {
      f[name].x = mix(f[name].x, t[name].x, follow);
      f[name].y = mix(f[name].y, t[name].y, follow);
    }
    f.spread = mix(f.spread, t.spread, follow);
    f.angle = mix(f.angle, t.angle, follow);
    this.push *= Math.exp(-dt * 3);
    this.tilt *= Math.exp(-dt * 2);
    this.energy *= Math.exp(-dt * 2.5);
    this.magnification = mix(this.magnification, 1, 1 - Math.exp(-dt * 0.5));
    const maxDepth = 2.65 + clamp(f.spread / this.width, 0, 0.85);
    const pace = (this.gentle ? 0.55 : 0.85) * (0.83 + (0.38 * f.spread) / this.width);
    const before = this.depth,
      x = this.x,
      y = this.y;
    this.depth = clamp(this.depth + (this.direction * pace + this.push) * dt, 1, maxDepth);
    let turned = false;
    if ((this.depth >= maxDepth && this.direction > 0) || (this.depth <= 1 && this.direction < 0)) {
      this.direction *= -1;
      turned = true;
    }
    const desired = clamp(f.angle * 0.65 + this.direction * 0.13, -0.38, 0.38);
    this.lateral = mix(this.lateral, desired, 1 - Math.exp(-dt * 1.7));
    this.lane = clamp(this.lane + this.lateral * dt, -0.52, 0.52);
    this.travel += Math.abs(this.depth - before);
    this.spin += (this.depth - before) * (this.gentle ? 0.85 : 2.1) + dt * this.lateral;
    this.project();
    if (dt > 0) {
      this.vx = (this.x - x) / dt;
      this.vy = (this.y - y) / dt;
    }
    return turned;
  }
}
