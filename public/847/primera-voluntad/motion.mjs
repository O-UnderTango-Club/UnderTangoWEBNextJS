import { sameLine } from './line-detector.mjs';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const mix = (a, b, t) => a + (b - a) * t;
const copyEdge = ({ a, b }) => ({ a: { ...a }, b: { ...b } });

function rail(edge, width, height) {
  const x = edge.a.x * width, y = edge.a.y * height;
  const dx = (edge.b.x - edge.a.x) * width, dy = (edge.b.y - edge.a.y) * height;
  const length = Math.hypot(dx, dy);
  const tx = dx / length, ty = dy / length;
  const radius = Math.min(.081 * Math.min(width, height), .145 * length);
  let nx = ty, ny = -tx;
  const mx = x + dx / 2, my = y + dy / 2;
  if (ny > 0 || (Math.abs(ny) < .12 && nx * (width / 2 - mx) < 0)) {
    nx = -nx;
    ny = -ny;
  }
  if (mx + nx * radius * 1.5 < 0 || mx + nx * radius * 1.5 > width ||
      my + ny * radius * 1.5 < 0 || my + ny * radius * 1.5 > height) {
    nx = -nx;
    ny = -ny;
  }
  return { x, y, dx, dy, tx, ty, length, nx, ny, radius };
}

export class SignMotion {
  constructor(line, width, height, gentle = false) {
    this.edge = copyEdge(line);
    this.target = copyEdge(line);
    this.width = width;
    this.height = height;
    this.gentle = gentle;
    this.phase = 'roll';
    this.fraction = .5;
    this.spin = 0;
    this.tumble = .32;
    this.guide = rail(line, width, height);
    const { ty, tx } = this.guide;
    this.direction = Math.abs(ty) > .065 ? Math.sign(ty) :
      ((line.a.x + line.b.x) / 2 <= .5 ? 1 : -1) * (Math.sign(tx) || 1);
    this.speed = this.direction * .39;
    this.tilt = 2 * ty * tx;
    this.placeOnEdge();
  }

  observe(line) {
    const { width, height, target } = this;
    if (this.phase === 'roll') {
      if (!sameLine(target, line, width, height)) return;
      // The detector can report the endpoints in either order as the phone rotates.
      const dot = (line.b.x - line.a.x) * (target.b.x - target.a.x) * width ** 2 +
        (line.b.y - line.a.y) * (target.b.y - target.a.y) * height ** 2;
      this.target = dot < 0 ? { a: line.b, b: line.a } : line;
    }
    const { tx, ty } = rail(line, width, height);
    this.tilt = 2 * tx * ty;
  }

  resize(width, height) {
    this.x *= width / this.width;
    this.y *= height / this.height;
    if (this.phase === 'flight') {
      this.vx *= width / this.width;
      this.vy *= height / this.height;
    }
    this.width = width;
    this.height = height;
    this.guide = rail(this.edge, width, height);
    this.radius = this.guide.radius;
    if (this.phase === 'roll') this.placeOnEdge();
  }

  placeOnEdge() {
    const g = this.guide;
    this.radius = g.radius;
    this.x = g.x + this.fraction * g.dx;
    this.y = g.y + this.fraction * g.dy;
  }

  advance(dt) {
    return this.phase === 'roll' ? this.roll(dt) : this.fly(dt);
  }

  roll(dt) {
    const follow = 1 - Math.exp(-16 * dt);
    for (const end of ['a', 'b']) {
      this.edge[end].x = mix(this.edge[end].x, this.target[end].x, follow);
      this.edge[end].y = mix(this.edge[end].y, this.target[end].y, follow);
    }
    this.guide = rail(this.edge, this.width, this.height);
    const g = this.guide;
    if (Math.abs(g.ty) > .065) this.direction = Math.sign(g.ty);
    this.speed = mix(this.speed, this.direction * (.39 + .17 * Math.abs(g.ty)), 1 - Math.exp(-9 * dt));
    const last = this.fraction;
    this.fraction = clamp(last + this.speed * dt, 0, 1);
    this.spin += (this.fraction - last) * g.length / g.radius * (g.tx * -g.ny + g.ty * g.nx);
    this.placeOnEdge();
    if (this.fraction > 0 && this.fraction < 1) return false;

    this.phase = 'flight';
    const pace = Math.hypot(this.width, this.height) * (this.gentle ? .48 : .81);
    const sign = this.fraction ? 1 : -1;
    this.vx = (-sign * g.tx * .78 + g.nx * .65) * pace;
    this.vy = (-sign * g.ty * .78 + g.ny * .65) * pace;
    this.x = clamp(this.x + g.nx * g.radius, g.radius, this.width - g.radius);
    this.y = clamp(this.y + g.ny * g.radius, g.radius, this.height - g.radius);
    this.twist = sign;
    return true;
  }

  fly(dt) {
    const { width, height, radius } = this;
    const pace = Math.hypot(width, height) * (this.gentle ? .48 : .81);
    this.vx = clamp(this.vx + this.tilt * .85 * pace * dt, -pace, pace);
    this.vy = clamp(this.vy + .29 * pace * dt, -pace, pace);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    let hit = false;
    if ((this.x <= radius && this.vx < 0) || (this.x >= width - radius && this.vx > 0)) {
      this.vx = -this.vx;
      hit = true;
    }
    if ((this.y <= radius && this.vy < 0) || (this.y >= height - radius && this.vy > 0)) {
      this.vy = -Math.sign(this.vy) * Math.max(Math.abs(this.vy), .42 * pace);
      hit = true;
    }
    this.x = clamp(this.x, radius, width - radius);
    this.y = clamp(this.y, radius, height - radius);
    if (hit) this.twist *= -1;
    this.spin += dt * this.twist * (this.gentle ? 2.3 : 7.8);
    this.tumble += dt * (this.gentle ? .9 : 4.8);
    return hit;
  }
}
