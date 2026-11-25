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
    radius: radius * (step ? 1.55 : 1.03),
    angle,
    side,
    step,
    born: now,
    lifetime: (step ? 1350 : 640) * (motion.gentle ? 0.75 : 1),
  });
  if (marks.length > 14) marks.shift();
}

// Pull displaced strips from the currently visible camera crop, only under the
// logo's trail. The video used by the detector always stays untouched.
export function drawWake(ctx, source, crop, width, height, marks, now, gentle) {
  while (marks.length && now - marks[0].born > marks[0].lifetime) marks.shift();
  for (const m of marks) {
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
    const stretch = 1 + (gentle ? 0.08 : 0.23) * fade;
    const left = m.x - r,
      top = m.y - r;
    const strip = r / 4;
    ctx.globalAlpha = fade * (gentle ? 0.58 : 0.9);
    for (let row = 0; row < 8; row++) {
      const bend =
        Math.sin(((row + 0.5) * Math.PI) / 8) *
        Math.sin(0.7 * row + 5 * age + m.side) *
        r *
        fade *
        (gentle ? 0.1 : 0.32);
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
    ctx.globalAlpha = fade * (m.step ? 0.23 : 0.12);
    ctx.fillStyle = m.side > 0 ? '#7cffd6' : '#c097ff';
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
  const energy = Math.min(1, 0.24 + level * 0.5 + m.energy * 0.8);
  const halo = r * (1.8 + energy * 0.55);
  const glow = ctx.createRadialGradient(m.x, m.y - r * 0.6, 0, m.x, m.y - r * 0.6, halo);
  glow.addColorStop(0, 'rgba(147,105,255,.28)');
  glow.addColorStop(0.5, 'rgba(88,85,233,.15)');
  glow.addColorStop(1, 'rgba(38,184,231,0)');
  ctx.globalAlpha = m.gentle ? 0.45 : 1;
  ctx.fillStyle = glow;
  ctx.fillRect(m.x - halo, m.y - r * 0.6 - halo, halo * 2, halo * 2);
  if (!m.gentle) {
    for (let i = 0; i < 9; i++) {
      const a = (i * tau) / 9 + time * (0.32 + energy * 0.22),
        shell = r * (1.23 + 0.38 * Math.sin(a * 2 + m.travel));
      const x = m.x + Math.cos(a) * shell,
        y = m.y - r + Math.sin(a) * r * 0.62;
      const size = (0.018 + 0.018 * energy) * r * (1 + 0.4 * Math.sin(a + time));
      ctx.globalAlpha = 0.25 + 0.48 * energy;
      ctx.fillStyle = i % 3 ? '#c3a8ff' : '#9bffef';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.75, size), 0, tau);
      ctx.fill();
    }
  }
  ctx.restore();
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
