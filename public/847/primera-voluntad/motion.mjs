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
// ground its roll. Contact paths always come from the measured finite segments.
export function readFloor(lines, w, h) {
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
      };
    }
  const paths = edges.map((e) => {
    const start = { x: e.x, y: e.y },
      end = { x: e.x + e.dx, y: e.y + e.dy };
    // Start at the near end of a receding edge, or the left end of a level one.
    return (Math.abs(e.dy) > e.len * 0.16 ? start.y < end.y : start.x > end.x)
      ? { a: end, b: start }
      : { a: start, b: end };
  });
  if (best) return { ...best, paths };
  const edge = edges[0];
  return {
    kind: 'edge',
    vanish: paths[0].b,
    near: paths[0].a,
    paths,
    spread: clamp(edge.len * 0.46, 0.2 * w, 0.55 * w),
    angle: crossEdge ? angle : clamp(Math.atan(edge.dy / (edge.dx || 0.001)), -0.35, 0.35),
  };
}

function nearest(path, x, y) {
  const dx = path.b.x - path.a.x,
    dy = path.b.y - path.a.y;
  const t = clamp(((x - path.a.x) * dx + (y - path.a.y) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  return { t, distance: Math.hypot(x - path.a.x - dx * t, y - path.a.y - dy * t) };
}

// Compare finite, overlapping edges after compensating for camera motion.
// Two sides of a hallway can be parallel without being the same path.
function matchError(prior, next, size) {
  const dx = prior.b.x - prior.a.x,
    dy = prior.b.y - prior.a.y;
  const ex = next.b.x - next.a.x,
    ey = next.b.y - next.a.y;
  const len = Math.hypot(dx, dy),
    other = Math.hypot(ex, ey);
  if (!len || !other) return Infinity;
  const sine = Math.abs(dx * ey - dy * ex) / (len * other);
  const mx = (next.a.x + next.b.x - prior.a.x - prior.b.x) / 2,
    my = (next.a.y + next.b.y - prior.a.y - prior.b.y) / 2;
  const perpendicular = Math.abs(dx * my - dy * mx) / len;
  const along = Math.abs(dx * mx + dy * my) / len;
  if (sine > 0.29 || perpendicular > Math.max(4, size * 0.027) || along > (len + other) * 0.45)
    return Infinity;
  return perpendicular + sine * size * 0.15 + 0.03 * along;
}

function copyPath(path) {
  return { a: { ...path.a }, b: { ...path.b } };
}
const maxDepth = 3.25;
const depthRange = 1 - 1 / maxDepth;

export class SignMotion {
  constructor(floor, width, height, gentle = false) {
    this.width = width;
    this.height = height;
    this.gentle = gentle;
    this.path = copyPath(floor.paths[0]);
    this.target = copyPath(this.path);
    this.floor = {
      angle: floor.angle,
      near: { ...floor.near },
      vanish: { ...floor.vanish },
      confidence: floor.kind === 'convergence' ? 1 : 0,
    };
    this.ground = { ...this.floor, near: { ...floor.near }, vanish: { ...floor.vanish } };
    this.depth = 1.48;
    this.direction = 1;
    this.spin = 0.08;
    this.travel = this.tilt = this.energy = this.railTime = this.lift = 0;
    this.magnification = 1;
    this.hop = this.pending = null;
    this.project();
  }

  observe(floor, now) {
    const size = Math.min(this.width, this.height);
    let matched = null,
      error = Infinity;
    for (const path of floor.paths) {
      const score = matchError(this.target, path, size);
      if (score < error) {
        matched = path;
        error = score;
      }
    }
    this.ground = {
      angle: floor.angle,
      near: floor.near,
      vanish: floor.vanish,
      confidence: floor.kind === 'convergence' ? 1 : 0,
    };
    if (matched) {
      const a = this.target.a,
        b = this.target.b;
      const opposite =
        (b.x - a.x) * (matched.b.x - matched.a.x) + (b.y - a.y) * (matched.b.y - matched.a.y) < 0;
      this.target = copyPath(opposite ? { a: matched.b, b: matched.a } : matched);
    }
    // After a stretch on one edge, a nearby junction is an invitation to hop.
    // A new path must recur in a second reading; a single flicker cannot move the wheel.
    let next = null,
      best = matched ? size * 0.12 : Infinity;
    const fraction = (1 - 1 / this.depth) / depthRange;
    const atEnd = fraction < 0.23 || fraction > 0.77;
    if (!matched || (!this.hop && this.railTime > 1.65 && (atEnd || this.railTime > 3.3))) {
      for (const path of floor.paths) {
        if (path === matched || (matched && Number.isFinite(matchError(matched, path, size)))) continue;
        const { distance } = nearest(path, this.x, this.y);
        if (distance < best) {
          next = path;
          best = distance;
        }
      }
    }
    if (!next) {
      this.pending = null;
      return Boolean(matched);
    }
    if (
      !this.pending ||
      !Number.isFinite(matchError(this.pending.path, next, size)) ||
      now - this.pending.last > 370
    ) {
      this.pending = { path: copyPath(next), since: now, last: now };
      return Boolean(matched);
    }
    this.pending.last = now;
    this.pending.path = copyPath(next);
    if (now - this.pending.since < (matched ? 120 : 160)) return Boolean(matched);

    const { t, distance } = nearest(next, this.x, this.y);
    this.hop = {
      from: { x: this.x, y: this.y },
      age: 0,
      duration: clamp(0.31 + distance / size, 0.31, 0.95),
      height: this.gentle ? 0 : clamp(this.radius * 0.75 + distance * 0.14, 5, size * 0.1),
    };
    this.path = copyPath(next);
    this.target = copyPath(next);
    this.depth = 1 / (1 - t * depthRange);
    this.direction = t > 0.5 ? -1 : 1;
    this.pending = null;
    this.railTime = 0;
    return true;
  }

  movePaths(transform) {
    for (const path of [this.path, this.target, this.pending?.path]) {
      if (!path) continue;
      path.a = transform(path.a);
      path.b = transform(path.b);
    }
    if (this.hop) this.hop.from = transform(this.hop.from);
    for (const floor of [this.floor, this.ground]) {
      floor.near = transform(floor.near);
      floor.vanish = transform(floor.vanish);
    }
  }

  carry(change) {
    this.movePaths((p) => carryPoint(p.x, p.y, change, this.width, this.height));
    const roll = Math.atan2(change.b, change.a),
      zoom = Math.hypot(change.a, change.b);
    this.floor.angle = clamp(this.floor.angle + roll, -0.55, 0.55);
    this.ground.angle = clamp(this.ground.angle + roll, -0.55, 0.55);
    this.magnification = clamp(this.magnification * zoom, 0.67, 1.65);
    this.tilt = clamp(this.tilt + roll + change.dx * 0.8, -0.55, 0.55);
    this.energy = clamp(
      this.energy + 2 * Math.hypot(change.dx, change.dy) + Math.abs(roll) + Math.abs(zoom - 1),
      0,
      1
    );
    this.project();
  }

  resize(w, h) {
    this.movePaths((p) => ({ x: (p.x * w) / this.width, y: (p.y * h) / this.height }));
    this.width = w;
    this.height = h;
    this.project();
  }

  rebound(hit) {
    const { a, b } = this.path;
    const normal = (b.x - a.x) * hit.nx + (b.y - a.y) * hit.ny;
    if (Math.abs(normal) > 1) this.direction = normal > 0 ? 1 : -1;
  }

  project() {
    const { a, b } = this.path;
    const size = Math.min(this.width, this.height);
    const t = (1 - 1 / this.depth) / depthRange;
    this.x = mix(a.x, b.x, t);
    this.y = mix(a.y, b.y, t);
    this.lift = 0;
    if (this.hop) {
      const u = Math.min(1, this.hop.age / this.hop.duration),
        ease = u * u * (3 - 2 * u);
      this.x = mix(this.hop.from.x, this.x, ease);
      this.y = mix(this.hop.from.y, this.y, ease);
      this.lift = this.hop.height * Math.sin(Math.PI * u);
    }
    const slope = clamp(Math.abs(b.y - a.y) / (0.45 * this.height), 0, 1);
    const floorDepth = clamp(
      (this.y - this.floor.vanish.y) /
        Math.max(this.height * 0.16, this.floor.near.y - this.floor.vanish.y),
      0.25,
      1.08
    );
    const scale = mix(mix(0.63, 1 / this.depth, slope), floorDepth, this.floor.confidence);
    // Shrink near the crop instead of shifting the foot off the measured line.
    this.radius = clamp(
      Math.min(
        size * 0.135 * this.magnification * scale,
        this.x / 1.28,
        (this.width - this.x) / 1.28,
        this.y / 2.45
      ),
      3,
      size * 0.19
    );
    this.yaw = 0.4 + 0.36 * Math.sin(this.travel * 0.76) + this.tilt * 0.7;
    this.pitch = -0.13 + 0.12 * Math.sin(this.travel * 0.83) + this.floor.angle * 0.16;
  }

  advance(dt) {
    const follow = 1 - Math.exp(-dt * 10);
    for (const end of ['a', 'b']) {
      this.path[end].x = mix(this.path[end].x, this.target[end].x, follow);
      this.path[end].y = mix(this.path[end].y, this.target[end].y, follow);
    }
    this.floor.angle = mix(this.floor.angle, this.ground.angle, follow);
    for (const end of ['near', 'vanish']) {
      this.floor[end].x = mix(this.floor[end].x, this.ground[end].x, follow);
      this.floor[end].y = mix(this.floor[end].y, this.ground[end].y, follow);
    }
    this.floor.confidence = mix(this.floor.confidence, this.ground.confidence, 1 - Math.exp(-dt * 3));
    this.energy *= Math.exp(-dt * 2.5);
    this.tilt *= Math.exp(-dt * 2);
    this.magnification = mix(this.magnification, 1, 1 - Math.exp(-dt * 0.5));
    this.railTime += dt;
    if (this.hop) {
      this.hop.age += dt;
      if (this.hop.age >= this.hop.duration) this.hop = null;
    }
    const before = this.depth;
    this.depth = clamp(before + this.direction * (this.gentle ? 0.58 : 0.88) * dt, 1, maxDepth);
    const turned =
      (this.depth === maxDepth && this.direction > 0) || (this.depth === 1 && this.direction < 0);
    if (turned) this.direction *= -1;
    const delta = this.depth - before;
    this.travel += Math.abs(delta);
    this.spin += delta * (this.gentle ? 1.1 : 2.8);
    this.project();
    return turned;
  }
}
