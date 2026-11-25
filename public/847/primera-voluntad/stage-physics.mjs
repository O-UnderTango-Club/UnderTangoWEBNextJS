const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Floor estimates arrive in batches. The visible wheel has its own continuous
// position and velocity, so a new estimate cannot teleport the artwork.
export class RollingSign {
  constructor(route) {
    this.x = route.x;
    this.y = route.y;
    this.vx = this.vy = this.free = 0;
    this.radius = route.radius;
    this.spin = route.spin;
    this.yaw = route.yaw;
    this.pitch = route.pitch;
    this.floor = { angle: route.floor.angle };
    this.gentle = route.gentle;
    this.energy = this.travel = 0;
  }

  advance(route, dt) {
    const size = Math.min(route.width, route.height);
    const spring = this.free > 0 ? 9 : 55;
    const drag = this.free > 0 ? 2.7 : 14;
    this.free = Math.max(0, this.free - dt);
    const limit = size * (this.gentle ? 0.46 : 0.65);
    this.vx += ((route.x - this.x) * spring - drag * this.vx) * dt;
    this.vy += ((route.y - this.y) * spring - drag * this.vy) * dt;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > limit) {
      this.vx *= limit / speed;
      this.vy *= limit / speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const blend = 1 - Math.exp(-dt * 6);
    this.radius += (route.radius - this.radius) * blend;
    this.spin += (route.spin - this.spin) * blend;
    this.yaw += (route.yaw - this.yaw) * blend;
    this.pitch += (route.pitch - this.pitch) * blend;
    this.floor.angle += (route.floor.angle - this.floor.angle) * blend;
    this.energy = route.energy;
    this.travel = route.travel;
    this.x = clamp(this.x, this.radius * 1.18, route.width - this.radius * 1.18);
    this.y = clamp(this.y, this.radius * 2.3, route.height - this.radius * 0.08);
  }
}

export class ShowBoard {
  constructor() {
    this.x = this.y = this.vx = this.vy = 0;
    this.width = this.height = this.roll = this.lean = this.drift = this.angle = 0;
    this.spin = 0;
    this.lastHit = -Infinity;
  }

  carry(flow) {
    const turn = Math.atan2(flow.b, flow.a);
    if (Math.abs(turn) > 0.0018) this.roll = clamp(this.roll - turn, -0.84, 0.84);
    this.drift = clamp(this.drift + flow.dx * 1.6, -0.38, 0.38);
  }

  observe(angle) {
    // The transverse seams also give a phone that started tilted a horizon.
    this.roll += (clamp(-angle, -0.78, 0.78) - this.roll) * 0.035;
  }

  fit(view, layout) {
    const first = !this.width;
    this.width = layout.width;
    this.height = layout.height;
    if (first) {
      this.x = view.width / 2;
      this.y = view.top + this.height / 2 + 5;
    }
    this.confine(view);
  }

  confine(view) {
    const c = Math.abs(Math.cos(this.angle)),
      s = Math.abs(Math.sin(this.angle));
    const rx = (this.width * c + this.height * s) / 2;
    const ry = (this.height * c + this.width * s) / 2;
    this.x = clamp(this.x, view.left + rx, view.width - view.right - rx);
    this.y = clamp(this.y, view.top + ry, view.height - view.bottom - ry);
  }

  advance(view, dt, time, gentle) {
    this.lean += (clamp(this.roll * 3.5 + this.drift, -1, 1) - this.lean) * (1 - Math.exp(-3.1 * dt));
    this.drift *= Math.exp(-1.15 * dt);
    const { width: w, height: h } = view;
    const room = (w - view.left - view.right - this.width) / 2;
    const tx = (w + view.left - view.right) / 2 + this.lean * room;
    const ty = h * (0.325 + 0.3 * Math.abs(this.lean) + (gentle ? 0 : 0.024 * Math.sin(time * 0.51)));
    const k = gentle ? 3.0 : 5.1;
    this.vx += ((tx - this.x) * k - 3.8 * this.vx) * dt;
    this.vy += ((ty - this.y) * k - 3.9 * this.vy) * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.spin += ((0.115 * this.lean - this.angle) * 15 - this.spin * 6) * dt;
    this.angle += this.spin * dt;
    this.confine(view);
  }
}

// Circle against the same oriented rectangle that is drawn on screen and in the clip.
export function collide(sign, board, now) {
  const r = sign.radius * 1.04,
    c = Math.cos(board.angle),
    s = Math.sin(board.angle);
  const dx = sign.x - board.x,
    dy = sign.y - sign.radius - board.y;
  const u = dx * c + dy * s,
    v = dy * c - dx * s;
  const hw = board.width / 2,
    hh = board.height / 2;
  let px = clamp(u, -hw, hw),
    py = clamp(v, -hh, hh);
  let nx = u - px,
    ny = v - py;
  const dist = Math.hypot(nx, ny);
  if (dist >= r) return null;
  let depth = r - dist;
  if (dist > 0.0001) {
    nx /= dist;
    ny /= dist;
  } else if (hw - Math.abs(u) < hh - Math.abs(v)) {
    nx = u < 0 ? -1 : 1;
    ny = 0;
    px = nx * hw;
    depth += hw - Math.abs(u);
  } else {
    nx = 0;
    ny = v < 0 ? -1 : 1;
    py = ny * hh;
    depth += hh - Math.abs(v);
  }
  const wx = nx * c - ny * s,
    wy = nx * s + ny * c;
  const contactX = px * c - py * s,
    contactY = px * s + py * c;
  const relative =
    (sign.vx - board.vx + board.spin * contactY) * wx +
    (sign.vy - board.vy - board.spin * contactX) * wy;
  sign.x += wx * depth * 0.8;
  sign.y += wy * depth * 0.8;
  board.x -= wx * depth * 0.2;
  board.y -= wy * depth * 0.2;
  if (relative >= 0) return null;
  const impulse = Math.min(290, -1.62 * relative);
  sign.vx += wx * impulse * 0.8;
  sign.vy += wy * impulse * 0.8;
  board.vx -= wx * impulse * 0.2;
  board.vy -= wy * impulse * 0.2;
  board.spin -= clamp(
    (((contactX * wy - contactY * wx) * impulse) / (board.width ** 2 + board.height ** 2)) * 2.4,
    -0.62,
    0.62
  );
  if (relative > -9 || now - board.lastHit < 340) return null;
  board.lastHit = now;
  sign.free = 0.25;
  return {
    x: board.x + contactX,
    y: board.y + contactY,
    nx: wx,
    ny: wy,
    born: now,
    power: clamp(-relative / 180, 0.36, 1),
  };
}
