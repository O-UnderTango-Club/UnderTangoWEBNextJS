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
    this.liftSpeed = this.counterAt = 0;
    this.slipTime = this.escapeSide = 0;
    this.sinceCounter = Infinity;
    this.spin = route.spin;
    this.yaw = route.yaw;
    this.pitch = route.pitch;
    this.floor = { angle: route.floor.angle };
    this.gentle = route.gentle;
    this.energy = this.travel = 0;
  }

  // Follow the rail into the plate's path. Once the wheel leaps it is committed
  // to that point; an oblique shove can send it rolling back along the other side.
  advance(route, dt, board = null) {
    const size = Math.min(route.width, route.height);
    this.beforeX = this.x;
    this.beforeY = this.y - this.lift - this.radius;
    this.stepLimit = size * 2.4 * dt;
    this.sinceCounter += dt;
    this.slipTime = Math.max(0, this.slipTime - dt);
    const gap = board ? this.y - this.lift - 2 * this.radius - board.y - board.height / 2 : Infinity;
    const descending = board && (board.gravity?.y > 0.02 || board.vy + board.panVy > 2);
    const ahead = descending && board.y < this.y - this.lift &&
      Math.abs(board.x - this.x) < board.width / 2 + size * 0.30;
    const guard = ahead && !this.slipTime ? clamp((size * 0.55 - gap) / (size * 0.34), 0, 1) : 0;
    let targetX = route.x, targetY = route.y, arc = 0;
    if (guard || this.sinceCounter < 0.58 || (board && this.slipTime)) {
      const { a, b } = route.path, dx = b.x - a.x, dy = b.y - a.y;
      const length2 = dx * dx + dy * dy || 1;
      const fraction = (x, y) => clamp(((x - a.x) * dx + (y - a.y) * dy) / length2, 0, 1);
      const rail = fraction(route.x, route.y);
      let t = rail;
      if (board && this.slipTime) {
        t = fraction(board.x + this.escapeSide * (board.width / 2 + 2 * this.radius),
          board.y - board.height / 2 - this.radius);
      } else if (guard) {
        const aim = fraction(board.x + (board.vx + board.panVx) * 0.17,
          board.y + board.height / 2 + 2 * this.radius);
        t += (aim - rail) * guard * 0.94;
        if (this.sinceCounter >= 1.38 && guard > 0.36 && gap > -this.radius) {
          this.counterAt = aim;
          this.sinceCounter = 0;
        }
      }
      if (!this.slipTime && this.sinceCounter < 0.58) {
        arc = Math.sin(Math.PI * this.sinceCounter / 0.58) ** 2;
        t += (this.counterAt - t) * arc;
      }
      targetX += (t - rail) * dx;
      targetY += (t - rail) * dy;
    }
    if (board && this.slipTime > 0) {
      // A successful feint sends the wheel around the real end of the plate.
      const c = Math.cos(board.angle), s = Math.sin(board.angle);
      const r = this.radius * 1.04;
      const u = (this.x - board.x) * c + (this.y - this.lift - this.radius - board.y) * s;
      if (this.escapeSide * u >= board.width / 2 + r - 1) this.roundingEdge = true;
      const goalU = this.escapeSide * (board.width / 2 + r + 5);
      const goalV = (this.roundingEdge ? -1 : 1) * (board.height / 2 + r + 2);
      targetX = board.x + c * goalU - s * goalV;
      targetY = board.y + s * goalU + c * goalV + this.lift + this.radius;
    }
    const spring = this.slipTime ? 120 : this.free > 0 ? 9 : 55 + 42 * guard;
    const drag = this.free > 0 ? 2.7 : 14;
    this.free = Math.max(0, this.free - dt);
    const limit = size * ((this.gentle ? 0.46 : 0.65) + (this.slipTime ? 0.46 : 0.35 * guard));
    this.vx += ((targetX - this.x) * spring - drag * this.vx) * dt;
    this.vy += ((targetY - this.y) * spring - drag * this.vy) * dt;
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > limit) {
      this.vx *= limit / speed;
      this.vy *= limit / speed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const blend = 1 - Math.exp(-dt * 6);
    // The visible solid grows into the block, even at the far end of a rail.
    // Collision and artwork use this same radius.
    const radius = this.slipTime ? size * 0.046 : Math.max(route.radius, size * (0.066 + guard * 0.09));
    this.radius += (radius - this.radius) * (1 - Math.exp(-dt * (7 + 8 * guard)));
    const lift = (route.lift || 0) + arc * size * (this.gentle ? 0.07 : 0.155);
    const rise = (lift - this.lift) * (1 - Math.exp(-dt * 15));
    this.lift += rise;
    this.liftSpeed = dt > 0 ? rise / dt : 0;
    this.spin += (route.spin - this.spin) * blend;
    this.yaw += (route.yaw - this.yaw) * blend;
    this.pitch += (route.pitch - this.pitch) * blend;
    this.floor.angle += (route.floor.angle - this.floor.angle) * blend;
    this.energy = route.energy;
    this.travel = route.travel;
    const margin = this.radius * (this.slipTime ? 0.90 : 1.18);
    this.x = clamp(this.x, margin, route.width - margin);
    this.y = clamp(this.y, this.radius * 2.3, route.height - this.radius * 0.08);
  }

  keepInPlay(view) {
    const min = Math.min(view.width, view.height);
    this.radius = Math.max(this.radius, min * (this.slipTime ? 0.046 : 0.066));
    const margin = this.radius * (this.slipTime ? 0.90 : 1.18);
    this.x = clamp(this.x, margin, view.width - margin);
    this.y = clamp(this.y, this.lift + this.radius * 2.2, view.height - view.bottom + this.radius * 0.55);
    // A screen constraint must not snap a wheel from one face to another
    // while it is easing back in from the margin.
    if (this.stepLimit) {
      this.x = clamp(this.x, this.beforeX - this.stepLimit, this.beforeX + this.stepLimit);
      const center = this.y - this.lift - this.radius;
      this.y = clamp(center, this.beforeY - this.stepLimit, this.beforeY + this.stepLimit) + this.lift + this.radius;
    }
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
    this.panX = this.panY = this.driveX = 0;
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
    // Drop the pending displacement on a reversal so the first new frame counts.
    if (x * this.panX < 0) this.panX = 0;
    if (y * this.panY < 0) this.panY = 0;
    this.panX = clamp(this.panX + x, -0.22, 0.22);
    this.panY = clamp(this.panY + y, -0.22, 0.22);
  }

  fit(view, layout) {
    this.restY = Infinity;
    if (!this.width) {
      // Give the player room for a sideways approach to the first rail.
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

  confine(view) {
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
    if ((this.x - x) * this.vx > 0) this.vx = 0;
    if ((this.y - y) * this.vy > 0) this.vy = 0;
    this.x = x;
    this.y = y;
  }

  advance(view, dt, gentle) {
    const gx = this.gravity?.x || 0, gy = this.gravity?.y || 0;
    this.restY = gy > 0 || this.panY > 0.00002 ? Infinity : this.y;
    this.restAngle = this.angle;
    if (!gy && this.vy > 0) this.vy = 0;
    const response = 7;
    const ease = 1 - Math.exp(-dt * response),
      panEase = 1 - Math.exp(-dt * 32);
    // Consume a large optical shift or drag over several steps. A single
    // input event must not carry the plate through a small, distant wheel.
    const travel = Math.min(view.width, view.height) * 2.15 * dt;
    const maxX = travel / (view.width * 1.25), maxY = travel / (view.height * 1.95);
    const dx = clamp(this.panX * panEase, -maxX, maxX),
      dy = clamp(this.panY * panEase, -maxY, maxY);
    this.panX -= dx;
    this.panY -= dy;
    const pace = gentle ? 0.62 : 1;
    const targetVx = Math.min(340, view.width * 0.54) * pace * gx;
    const targetVy = Math.min(320, view.height * 0.40) * pace * gy;
    const changeX = (targetVx - this.vx) * ease, changeY = (targetVy - this.vy) * ease;
    this.panVx = dx * view.width * 1.25 / dt;
    this.panVy = dy * view.height * 1.95 / dt;
    this.driveX += (targetVx + this.panVx - this.driveX) * (1 - Math.exp(-dt * 18));
    this.vx += changeX;
    this.x += (targetVx + this.panVx) * dt - changeX / response;
    if (this.rebounding && this.vy < 0 && targetVy > this.vy) {
      // A hard strike earns its upward arc even if the phone is still tipped
      // down. Sideways steering stays live during the parry.
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
    this.confine(view);
  }
}

// Circle against the same oriented rectangle that is drawn on screen and in the clip.
function contact(sign, board) {
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
  return { wx, wy, depth, u, hw, contactX, contactY };
}

export function collide(sign, board, now, fixed = false) {
  const touch = contact(sign, board);
  if (!touch) return null;
  board.lastContact = now;
  const { wx, wy, depth, u, hw, contactX, contactY } = touch;
  if (fixed) {
    sign.x += wx * depth;
    sign.y += wy * depth;
    const into = sign.vx * wx + (sign.vy - (sign.liftSpeed || 0)) * wy;
    if (into < 0) { sign.vx -= 1.5 * into * wx; sign.vy -= 1.5 * into * wy; }
    return null;
  }
  const relative =
    (sign.vx - board.vx - board.panVx + board.spin * contactY) * wx +
    (sign.vy - (sign.liftSpeed || 0) - board.vy - board.panVy - board.spin * contactX) * wy;
  const underneath = wy > 0.45;
  const lateral = board.vx + board.panVx, descent = Math.max(0, board.vy + board.panVy);
  const cutting = board.driveX * lateral > 0 && Math.abs(board.driveX) > 63 &&
    Math.abs(lateral) > Math.max(65, descent * 0.66);
  const committed = sign.sinceCounter > 0.18 && sign.sinceCounter < 0.88;
  if (underneath && relative < -6 && !sign.slipTime && cutting && (committed || Math.abs(u) > hw * 0.73)) {
    sign.slipTime = 1.85;
    sign.roundingEdge = false;
    sign.escapeSide = -Math.sign(lateral);
    sign.vx += sign.escapeSide * Math.min(230, board.width * 0.76);
  }
  const yielding = sign.slipTime > 0;
  const wheelShare = underneath ? (yielding ? 0.97 : 0.015) : 0.80;
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
  if (underneath && !yielding && relative < -34 && now - board.lastHit >= 340) {
    board.panY = board.panVy = 0;
    board.vy = Math.min(board.vy, -clamp(-relative * 1.30, 158, 340));
    board.rebounding = true;
  }
  board.spin -= clamp(
    (((contactX * wy - contactY * wx) * impulse) / (board.width ** 2 + board.height ** 2)) * 2.4,
    -0.62,
    0.62
  );
  if (relative > -9 || now - board.lastHit < 340) return null;
  board.lastHit = now;
  sign.free = yielding ? 0.40 : 0.10;
  return {
    x: board.x + contactX,
    y: board.y + contactY,
    nx: wx,
    ny: wy,
    born: now,
    power: clamp(-relative / 180, 0.36, 1),
  };
}

// Resolve the part of a contact that the screen limits cancelled. Holding the
// plate at the tray or at timeout never turns off its solid surface.
export function constrainContact(sign, board, view, fixed) {
  let hit = contact(sign, board);
  if (!hit || hit.depth < 1e-7) return;
  if (!fixed) {
    board.x -= hit.wx * (hit.depth + 0.1);
    if (hit.wy > 0) board.y -= hit.wy * (hit.depth + 0.1);
    board.confine(view);
    hit = contact(sign, board);
  }
  if (hit) {
    // Use the side actually touched, even if that costs part of the screen
    // margin. Choosing the nearest free face can jump right through the plate.
    sign.x += hit.wx * (hit.depth + 0.05);
    sign.y += hit.wy * (hit.depth + 0.05);
  }
}
