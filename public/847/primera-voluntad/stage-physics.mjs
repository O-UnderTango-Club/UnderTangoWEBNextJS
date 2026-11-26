const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Floor estimates arrive in batches. The visible wheel has its own continuous
// position and velocity, so a new estimate cannot teleport the artwork.
export class RollingSign {
  constructor(route) {
    this.x = route.x;
    this.y = route.y;
    this.vx = this.vy = this.free = 0;
    this.radius = route.radius;
    this.lift = route.lift || 0;
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
    this.radius += (Math.max(route.radius, size * 0.048) - this.radius) * blend;
    this.lift += ((route.lift || 0) - this.lift) * (1 - Math.exp(-dt * 15));
    this.spin += (route.spin - this.spin) * blend;
    this.yaw += (route.yaw - this.yaw) * blend;
    this.pitch += (route.pitch - this.pitch) * blend;
    this.floor.angle += (route.floor.angle - this.floor.angle) * blend;
    this.energy = route.energy;
    this.travel = route.travel;
    this.x = clamp(this.x, this.radius * 1.18, route.width - this.radius * 1.18);
    this.y = clamp(this.y, this.radius * 2.3, route.height - this.radius * 0.08);
  }

  keepInPlay(view) {
    const min = Math.min(view.width, view.height);
    this.radius = Math.max(this.radius, min * 0.048);
    this.x = clamp(this.x, this.radius * 1.18, view.width - this.radius * 1.18);
    this.y = clamp(this.y, this.lift + this.radius * 2.2, view.height - view.bottom + this.radius * 0.55);
  }
}

// Gravity projected onto the current screen, including landscape and inverted holds.
export function screenGravity(beta, gamma, screenAngle = 0) {
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return null;
  const rad = Math.PI / 180,
    pitch = beta * rad,
    roll = gamma * rad,
    angle = screenAngle * rad;
  const gx = Math.cos(pitch) * Math.sin(roll),
    gy = Math.sin(pitch);
  const x = gx * Math.cos(angle) + gy * Math.sin(angle);
  const y = -gx * Math.sin(angle) + gy * Math.cos(angle);
  // On a level phone there is no downhill edge. Give the plate a small, slow
  // settling motion which changes direction when the phone turns face-down.
  const level = Math.max(0, 1 - Math.hypot(gx, gy) / 0.45);
  return { x, y: y + 0.18 * level * Math.cos(pitch) * Math.cos(roll) };
}

// Measure pitch and roll relative to the first pose. Projecting the new gravity
// vector on that pose's tangent axes also works when starting nearly upright.
export function tiltFromRest(rest, current, screenAngle = 0) {
  const rad = Math.PI / 180;
  const pitch = current.beta * rad, reference = rest.beta * rad;
  const roll = (current.gamma - rest.gamma) * rad, angle = screenAngle * rad;
  const forward = Math.cos(pitch) * Math.cos(roll);
  const x = Math.cos(pitch) * Math.sin(roll);
  const y = Math.sin(pitch) * Math.cos(reference) - forward * Math.sin(reference);
  const facing = Math.sin(pitch) * Math.sin(reference) + forward * Math.cos(reference);
  // A flat, overturned handset settles toward its new lower edge.
  const inverted = Math.max(0, -facing) * 0.2 * Math.cos(pitch) * Math.cos(current.gamma * rad);
  const gain = v => Math.sign(v) * clamp((Math.abs(v) - 0.024) * 3.2, 0, 1);
  return {
    x: gain(x * Math.cos(angle) + (y + inverted) * Math.sin(angle)),
    y: gain((y + inverted) * Math.cos(angle) - x * Math.sin(angle)),
  };
}

export class ShowBoard {
  constructor() {
    this.x = this.y = this.vx = this.vy = 0;
    this.width = this.height = this.angle = this.spin = 0;
    this.panX = this.panY = this.landingSpeed = 0;
    this.gravity = null;
    this.restY = Infinity;
    this.restAngle = 0;
    this.rebounding = false;
    this.panVx = this.panVy = 0;
    this.lastContact = this.lastHit = -Infinity;
  }

  allowsFootstep(now) {
    return now - this.lastContact > 260;
  }

  carry(flow) {
    // Image travel is opposite to handset travel. Without a tilt sensor only
    // motion between consecutive images steers the plate; a still image stops it.
    const dx = Math.abs(flow.dx) > 0.0025 ? -flow.dx : 0;
    const dy = Math.abs(flow.dy) > 0.0035 ? -flow.dy : 0;
    const turn = Math.atan2(flow.b, flow.a);
    const roll = !this.gravity && Math.abs(turn) > 0.004 ? clamp(-turn * 0.65, -0.12, 0.12) : 0;
    this.steer(this.gravity && Math.abs(this.gravity.x) > 0.08 ? 0 : dx + roll,
      this.gravity ? 0 : dy * 0.68);
  }

  steer(x, y) {
    if (Math.abs(x) + Math.abs(y) < 0.0018) return;
    // Drop the pending displacement on a reversal so the first new frame counts.
    if (x * this.panX < 0) this.panX = 0;
    if (y * this.panY < 0) this.panY = 0;
    this.panX = clamp(this.panX + x, -0.22, 0.22);
    this.panY = clamp(this.panY + y, -0.22, 0.22);
  }

  fit(view, layout) {
    this.restY = Infinity;
    if (!this.width) {
      // Start off the centre of the tray so the descent also needs a lateral correction.
      this.x = view.left + layout.width / 2 + (view.width - view.left - view.right - layout.width) * 0.14;
      this.y = view.top + layout.height / 2 + 5;
    } else if (this.viewWidth !== view.width || this.viewHeight !== view.height) {
      this.x *= view.width / this.viewWidth;
      this.y *= view.height / this.viewHeight;
      this.panX = this.panY = 0;
    }
    this.viewWidth = view.width;
    this.viewHeight = view.height;
    this.width = layout.width;
    this.height = layout.height;
    this.confine(view);
  }

  confine(view, checkLanding = false) {
    // A wheel pushing or tilting a plate against the upper edge cannot make it
    // descend on a stationary phone. Allow rotation again as soon as there is room.
    const reachY = (this.width * Math.abs(Math.sin(this.angle)) + this.height * Math.abs(Math.cos(this.angle))) / 2;
    if (view.top + reachY > this.restY) {
      this.angle = this.restAngle;
      this.spin = 0;
    }
    const c = Math.abs(Math.cos(this.angle)),
      s = Math.abs(Math.sin(this.angle));
    const rx = (this.width * c + this.height * s) / 2,
      ry = (this.height * c + this.width * s) / 2;
    const x = clamp(this.x, view.left + rx, view.width - view.right - rx);
    const floorY = view.height - view.bottom - ry;
    const y = clamp(this.y, view.top + ry, Math.min(this.restY, floorY));
    if (checkLanding && this.y > floorY && this.vy + this.panVy > 0)
      this.landingSpeed = this.vy + this.panVy;
    if ((this.x - x) * this.vx > 0) this.vx = 0;
    if ((this.y - y) * this.vy > 0) this.vy = 0;
    this.x = x;
    this.y = y;
  }

  advance(view, dt, gentle) {
    const gx = this.gravity?.x || 0, gy = this.gravity?.y || 0;
    this.restY = gy > 0 || this.panY > 0.00015 ? Infinity : this.y;
    this.restAngle = this.angle;
    this.landingSpeed = 0;
    if (!gy && this.vy > 0) this.vy = 0;
    const response = 7;
    const ease = 1 - Math.exp(-dt * response),
      panEase = 1 - Math.exp(-dt * 32);
    const dx = this.panX * panEase,
      dy = this.panY * panEase;
    this.panX -= dx;
    this.panY -= dy;
    const pace = gentle ? 0.62 : 1;
    const targetVx = Math.min(340, view.width * 0.54) * pace * gx;
    const targetVy = Math.min(320, view.height * 0.40) * pace * gy;
    const changeX = (targetVx - this.vx) * ease, changeY = (targetVy - this.vy) * ease;
    this.panVx = dx * view.width * 1.25 / dt;
    this.panVy = dy * view.height * 1.95 / dt;
    this.vx += changeX;
    this.x += (targetVx + this.panVx) * dt - changeX / response;
    if (this.rebounding && this.vy < 0 && targetVy > this.vy) {
      // A hard strike earns its upward arc even if the phone is still tipped
      // down. Sideways steering stays live and the player can ease the next landing.
      const acceleration = Math.min(880, view.height * 0.72 + 245);
      const next = Math.min(0, targetVy, this.vy + acceleration * dt);
      this.panVy = Math.min(0, this.panVy);
      this.y += ((this.vy + next) / 2 + this.panVy) * dt;
      this.vy = next;
      if (next === 0) this.rebounding = false;
    } else {
      this.rebounding = false;
      this.vy += changeY;
      this.y += (targetVy + this.panVy) * dt - changeY / response;
    }
    this.spin += ((0.12 * gx - this.angle) * 16 - this.spin * 8) * dt;
    this.angle += this.spin * dt;
    this.confine(view, true);
  }
}

// Circle against the same oriented rectangle that is drawn on screen and in the clip.
export function collide(sign, board, now) {
  const r = sign.radius * 1.04,
    c = Math.cos(board.angle),
    s = Math.sin(board.angle);
  const dx = sign.x - board.x,
    dy = sign.y - (sign.lift || 0) - sign.radius - board.y;
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
  board.lastContact = now;
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
    (sign.vx - board.vx - board.panVx + board.spin * contactY) * wx +
    (sign.vy - board.vy - board.panVy - board.spin * contactX) * wy;
  // The body braces a head-on descent. Canting the plate or shoving it sideways
  // sends the wheel along its rail and gives the player a way around it.
  const underneath = wy > 0.45;
  const sliding = Math.abs(board.vx + board.panVx) > 46 || Math.abs(board.angle) > 0.105;
  const wheelShare = underneath ? (sliding ? 0.72 : 0.10) : 0.80;
  sign.x += wx * depth * wheelShare;
  sign.y += wy * depth * (wy < 0 ? 1 : wheelShare);
  board.x -= wx * depth * (1 - wheelShare);
  if (wy > 0) board.y -= wy * depth * (1 - wheelShare);
  if (relative >= 0) return null;
  const impulse = Math.min(310, -1.65 * relative);
  sign.vx += wx * impulse * wheelShare;
  sign.vy += wy * impulse * (wy < 0 ? 1 : wheelShare);
  board.vx -= wx * impulse * (1 - wheelShare);
  if (wy > 0) board.vy -= wy * impulse * (1 - wheelShare);
  if (underneath && !sliding && relative < -85) {
    board.vy = Math.min(board.vy, -Math.min(270, -relative * 0.92));
    board.rebounding = true;
  }
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
