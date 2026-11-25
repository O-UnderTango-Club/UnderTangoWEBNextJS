import { carryPoint } from './camera-motion.mjs';

const tau = 2 * Math.PI;

export function visibleCrop(sourceWidth, sourceHeight, width, height) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const w = width / scale,
    h = height / scale;
  return { x: (sourceWidth - w) / 2, y: (sourceHeight - h) / 2, w, h };
}

export function addMark(marks, motion, now, step, side) {
  const { radius } = motion;
  const angle = Math.atan2(motion.vy, motion.vx);
  const offset = step ? radius * 0.34 * side : 0;
  marks.push({
    x: motion.x - Math.sin(angle) * offset,
    y: motion.y + Math.cos(angle) * offset,
    radius: radius * (step ? 2.1 : 1.7),
    angle,
    side,
    step,
    born: now,
    lifetime: (step ? 1650 : 920) * (motion.gentle ? 0.75 : 1),
  });
  if (marks.length > 14) marks.shift();
}

// Pull displaced strips from the currently visible camera crop, only under the
// logo's trail. The video used by the detector always stays untouched.
export function drawWake(ctx, source, crop, width, height, marks, now, gentle) {
  while (marks.length && now - marks[0].born > marks[0].lifetime) marks.shift();
  // Three fresh lenses bend pixels. Older marks keep their colored afterimage.
  const bendFrom = Math.max(0, marks.length - 3);
  for (const [i, m] of marks.entries()) {
    const age = (now - m.born) / m.lifetime;
    if (age >= 1) continue;
    const fade = 1 - age,
      r = m.radius * (1 + 0.22 * age);
    const c = Math.cos(m.angle),
      s = Math.sin(m.angle);
    ctx.save();
    ctx.beginPath();
    if (m.step) {
      ctx.ellipse(m.x + 0.2 * r * c, m.y + 0.2 * r * s, 0.57 * r, 0.29 * r, m.angle, 0, tau);
      ctx.moveTo(m.x - 0.55 * r * c + 0.23 * r, m.y - 0.55 * r * s);
      ctx.ellipse(m.x - 0.55 * r * c, m.y - 0.55 * r * s, 0.23 * r, 0.23 * r, 0, 0, tau);
    } else {
      ctx.ellipse(m.x, m.y, r, 0.72 * r, m.angle, 0, tau);
    }
    ctx.clip();
    const stretch = 1 + (gentle ? 0.12 : 0.43) * fade;
    const left = m.x - r,
      top = m.y - r;
    const strip = r / 2;
    ctx.globalAlpha = fade * (gentle ? 0.58 : 0.9);
    for (let row = 0; i >= bendFrom && row < 4; row++) {
      const bend =
        Math.sin(((row + 0.5) * Math.PI) / 4) *
        Math.sin(0.7 * row + 5 * age + m.side) *
        r *
        fade *
        (gentle ? 0.12 : 0.48);
      const sx = crop.x + ((m.x - r / stretch + bend) * crop.w) / width;
      const sy = crop.y + ((m.y + (row * strip - r) / stretch) * crop.h) / height;
      ctx.drawImage(
        source,
        sx,
        sy,
        (2 * r * crop.w) / (width * stretch),
        ((strip + 1) * crop.h) / (height * stretch),
        left,
        top + row * strip,
        2 * r,
        strip + 1
      );
    }
    ctx.globalAlpha = fade * (m.step ? 0.42 : 0.33);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'hsl(' + ((m.born * 0.021 + (m.side > 0 ? 128 : 245)) % 360) + ' 96% 59%)';
    ctx.fillRect(left, top, 2 * r, 2 * r);
    ctx.restore();
  }
}

export function carryMarks(marks, flow, width, height) {
  const roll = Math.atan2(flow.b, flow.a),
    zoom = Math.hypot(flow.a, flow.b);
  for (const m of marks) {
    const p = carryPoint(m.x, m.y, flow, width, height);
    m.x = p.x;
    m.y = p.y;
    m.angle += roll;
    m.radius = Math.min(0.35 * Math.min(width, height), m.radius * zoom);
  }
}

export function drawField(ctx, m, marks, now, level) {
  const r = m.radius,
    time = now / 1000;
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.floor.angle * 0.65);
  ctx.scale(1, 0.26);
  const shade = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.55);
  shade.addColorStop(0, 'rgba(9,6,23,.69)');
  shade.addColorStop(0.45, 'rgba(14,9,29,.34)');
  shade.addColorStop(1, 'rgba(14,9,29,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(-1.55 * r, -1.55 * r, 3.1 * r, 3.1 * r);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const mark of marks) {
    if (!mark.step) continue;
    const age = (now - mark.born) / mark.lifetime;
    if (age < 0 || age >= 1) continue;
    ctx.globalAlpha = (1 - age) ** 2 * (m.gentle ? 0.22 : 0.58);
    ctx.strokeStyle = mark.side > 0 ? '#94f6df' : '#a99aff';
    ctx.lineWidth = Math.max(1, mark.radius * 0.045 * (1 - age));
    ctx.beginPath();
    ctx.ellipse(
      mark.x,
      mark.y,
      mark.radius * (0.6 + 2.1 * age),
      mark.radius * (0.13 + 0.49 * age),
      m.floor.angle,
      0,
      tau
    );
    ctx.stroke();
  }
  const energy = Math.min(1, 0.32 + level * 0.65 + m.energy);
  const hue = (now * 0.018 + 188) % 360;
  const halo = r * (3.2 + energy);
  ctx.translate(m.x, m.y - r);
  const glow = ctx.createRadialGradient(0, 0, r * 0.25, 0, 0, halo);
  glow.addColorStop(0, 'hsla(' + hue + ',98%,67%,.8)');
  glow.addColorStop(0.38, 'hsla(' + (hue + 32) + ',96%,54%,.38)');
  glow.addColorStop(1, 'hsla(' + (hue + 75) + ',96%,50%,0)');
  ctx.globalAlpha = m.gentle ? 0.48 : 0.92;
  ctx.fillStyle = glow;
  ctx.fillRect(-halo, -halo, 2 * halo, 2 * halo);
  const count = m.gentle ? 2 : 4;
  for (let i = 0; i < count; i++) {
    const turn = time * (0.38 + i * 0.12) + i * 1.67;
    const shell = r * (1.38 + i * 0.35 + energy * 0.3);
    const angle = Math.sin(turn * 0.34 + i) * 0.65;
    ctx.lineWidth = Math.max(1.2, r * (0.065 - i * 0.009));
    ctx.strokeStyle = 'hsla(' + (hue + i * 38) + ',100%,78%,.9)';
    ctx.beginPath();
    ctx.ellipse(0, 0, shell, shell * 0.43, angle, turn, turn + 3.9);
    ctx.stroke();
    const ex = Math.cos(turn) * shell,
      ey = Math.sin(turn) * shell * 0.43;
    ctx.fillStyle = '#fff8e7';
    ctx.beginPath();
    ctx.arc(
      ex * Math.cos(angle) - ey * Math.sin(angle),
      ex * Math.sin(angle) + ey * Math.cos(angle),
      Math.max(1.4, r * 0.074),
      0,
      tau
    );
    ctx.fill();
  }
  ctx.restore();
}

// Refract the actual camera pixels through an expanding lens at each impact.
export function drawImpacts(ctx, source, crop, view, hits, now, gentle) {
  while (hits.length && now - hits[0].born >= 1550) hits.shift();
  const size = Math.min(view.width, view.height);
  for (const hit of hits) {
    const age = (now - hit.born) / 1550,
      fade = 1 - age;
    const r = size * (0.04 + (1 - fade ** 2) * (gentle ? 0.19 : 0.49)) * (0.7 + hit.power * 0.3);
    const hue = (hit.born * 0.026 + 185) % 360;
    ctx.save();
    ctx.beginPath();
    ctx.arc(hit.x, hit.y, r, 0, tau);
    ctx.clip();
    const zoom = 1 + fade * (gentle ? 0.08 : 0.25);
    ctx.globalAlpha = fade * 0.75;
    const sampleR = r / zoom;
    ctx.drawImage(
      source,
      crop.x + ((hit.x - sampleR) * crop.w) / view.width,
      crop.y + ((hit.y - sampleR) * crop.h) / view.height,
      (sampleR * 2 * crop.w) / view.width,
      (sampleR * 2 * crop.h) / view.height,
      hit.x - r,
      hit.y - r,
      r * 2,
      r * 2
    );
    const wave = ctx.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, r);
    wave.addColorStop(0, 'transparent');
    wave.addColorStop(0.57, 'hsla(' + hue + ',98%,44%,.15)');
    wave.addColorStop(0.84, 'hsla(' + (hue + 52) + ',99%,57%,.76)');
    wave.addColorStop(1, 'hsla(' + hue + ',100%,77%,.32)');
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = wave;
    ctx.fillRect(hit.x - r, hit.y - r, r * 2, r * 2);
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = Math.max(1.5, size * 0.014 * fade);
    ctx.strokeStyle = 'hsl(' + hue + ',100%,81%)';
    ctx.stroke();
    ctx.restore();
    if (gentle) continue;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = fade * fade;
    for (let i = 0; i < 15; i++) {
      const a = i * 2.39996 + hit.nx + hit.ny * 2;
      const n = r * (0.63 + 0.39 * Math.sin(i * 1.7 + hit.power));
      ctx.beginPath();
      ctx.moveTo(hit.x + Math.cos(a) * n, hit.y + Math.sin(a) * n);
      ctx.lineTo(hit.x + Math.cos(a) * (n + r * 0.18), hit.y + Math.sin(a) * (n + r * 0.18));
      ctx.lineWidth = 1.4 + (i % 3);
      ctx.strokeStyle = 'hsl(' + (hue + i * 8) + ',100%,76%)';
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function drawDemo(ctx, width, height, seconds, lean) {
  const horizon = height * (0.29 + 0.018 * Math.sin(seconds * 0.37));
  const vanish = width * (0.5 + 0.16 * lean * Math.sin(seconds * 0.43));
  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, '#191a3c');
  sky.addColorStop(0.45, '#765c7e');
  sky.addColorStop(1, '#d29a75');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const light = ctx.createRadialGradient(vanish, horizon, 0, vanish, horizon, width * 0.65);
  light.addColorStop(0, '#d5ada0');
  light.addColorStop(1, '#d5ada000');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, width, height);
  const colors = ['#263545', '#3d4a58', '#51485f', '#394653', '#4a5664'];
  const point = (col, z) => [
    vanish + ((col - 0.5) * width * 0.52) / z,
    horizon + (height - horizon) / z,
  ];
  for (let row = 14; row >= 0; row--) {
    const z = 0.78 + 0.35 * row,
      next = z + 0.35;
    const cols = Math.ceil(next * 2.4);
    for (let col = -cols; col <= cols; col++) {
      const a = point(col, z),
        b = point(col + 1, z),
        c = point(col + 1, next),
        d = point(col, next);
      ctx.fillStyle = colors[(((col * 17 + row * 7) % 5) + 5) % 5];
      ctx.beginPath();
      ctx.moveTo(...a);
      ctx.lineTo(...b);
      ctx.lineTo(...c);
      ctx.lineTo(...d);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(190,190,196,.56)';
      ctx.lineWidth = Math.max(0.7, 2.5 / z);
      ctx.stroke();
    }
  }
}
