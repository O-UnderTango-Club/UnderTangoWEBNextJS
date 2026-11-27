import { carryPoint } from './camera-motion.mjs';

const tau = 2 * Math.PI;

export function visibleCrop(sourceWidth, sourceHeight, width, height) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const w = width / scale,
    h = height / scale;
  return { x: (sourceWidth - w) / 2, y: (sourceHeight - h) / 2, w, h };
}

export function addMark(marks, motion, now, step, side) {
  const last = marks.at(-1);
  if (last && now - last.born < 35) {
    if (step) {
      last.step = true;
      last.side = side;
    }
    return;
  }
  const speed = Math.hypot(motion.vx, motion.vy);
  let angle = speed > 3 ? Math.atan2(motion.vy, motion.vx) : (last?.angle ?? 0);
  // Keep the two hems of the ribbon on their respective sides during a reversal.
  if (last && Math.cos(angle - last.angle) < 0) angle += Math.PI;
  const bend = last ? Math.sin(angle - last.angle) : 0;
  marks.push({
    x: motion.x,
    y: motion.y,
    radius: motion.radius,
    angle,
    bend,
    spin: motion.spin,
    pressure: Math.min(1, speed / (3 * motion.radius) + motion.energy * 0.28),
    step,
    side,
    born: now,
  });
  // Keep fine detail near the wheel and one older point per half-second.
  for (let i = marks.length - 2; i > 0; i--) {
    if (now - marks[i].born > 1600 && marks[i].born - marks[i - 1].born < 500)
      marks.splice(i, 1);
  }
  while (marks.length && now - marks[0].born > 22000) marks.shift();
}

function smoothPath(ctx, points, join = false) {
  const first = points[0];
  if (join) ctx.lineTo(first.x, first.y);
  else ctx.moveTo(first.x, first.y);
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1];
    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
  }
  const last = points.at(-1);
  ctx.lineTo(last.x, last.y);
}

// The width and twist come from the sign's angular motion, speed and turns.
// The ribbons sample the floor underneath, then fine strands cross their folds.
export function drawWake(ctx, source, crop, width, height, marks, now, body) {
  const gentle = body.gentle,
    lifetime = 22000;
  while (marks.length && now - marks[0].born > lifetime) marks.shift();
  if (marks.length < 2) return;
  const last = marks.at(-1);
  const knots = [
    ...marks,
    { ...last, x: body.x, y: body.y, radius: body.radius, spin: body.spin, born: now, step: false },
  ];
  const spine = knots.map((m, i) => {
    const age = (now - m.born) / lifetime;
    const bloom = Math.sin(Math.PI * Math.min(1, age * 1.3));
    const taper = Math.min(1, i / 2, (1 - age) * 5);
    const span =
      m.radius *
      taper *
      (0.22 + bloom * (gentle ? 0.64 : 1.15) + 0.48 * m.pressure + 0.45 * Math.abs(m.bend));
    return {
      x: m.x,
      y: m.y,
      nx: -Math.sin(m.angle) * span,
      ny: Math.cos(m.angle) * span,
      phase: m.spin * 1.65 + age * 3.8 + m.bend * 1.4,
    };
  });
  const strand = (lane) =>
    spine.map((k) => {
      const wave =
        lane * 0.29 + 0.8 * Math.sin(k.phase + lane * 1.95) + 0.14 * Math.sin(2.3 * k.phase + lane);
      return { x: k.x + k.nx * wave, y: k.y + k.ny * wave };
    });
  const left = strand(-1),
    right = strand(1);
  const head = spine.at(-1),
    tail = spine[0];
  const hue = (now * 0.018 + 156 + last.bend * 30) % 360;
  const pigment = ctx.createLinearGradient(tail.x, tail.y, head.x + 0.01, head.y);
  pigment.addColorStop(0, `hsla(${hue + 92},86%,57%,.03)`);
  pigment.addColorStop(0.36, `hsla(${hue + 55},92%,63%,.44)`);
  pigment.addColorStop(0.72, `hsla(${hue},95%,67%,.56)`);
  pigment.addColorStop(1, `hsla(${hue - 28},96%,81%,.3)`);

  ctx.save();
  ctx.beginPath();
  smoothPath(ctx, left);
  smoothPath(ctx, right.slice().reverse(), true);
  ctx.closePath();
  ctx.save();
  ctx.clip();
  const shift = last.radius * (gentle ? 0.16 : 0.49);
  ctx.globalAlpha = gentle ? 0.42 : 0.67;
  ctx.drawImage(
    source,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    -Math.sin(last.angle) * shift,
    Math.cos(last.angle) * shift,
    width,
    height
  );
  ctx.restore();
  ctx.fillStyle = pigment;
  ctx.fill();
  // A fine dark edge preserves the folds over bright tiles as well as in shadow.
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(27,16,62,.23)';
  ctx.stroke();
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'screen';
  const lanes = gentle ? [-1, 0, 1] : [-1, -0.55, 0.05, 0.62, 1];
  for (const lane of lanes) {
    const points = lane === -1 ? left : lane === 1 ? right : strand(lane);
    ctx.beginPath();
    smoothPath(ctx, points);
    ctx.lineWidth = Math.abs(lane) === 1 ? 1.65 : 0.85;
    ctx.strokeStyle = `hsla(${hue + 48 * lane},95%,${Math.abs(lane) === 1 ? 82 : 72}%,.66)`;
    ctx.stroke();
  }
  ctx.restore();

  // Footfalls unwind into curved barbs. Their opening angle follows each turn.
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.lineCap = 'round';
  for (const m of marks) {
    if (!m.step) continue;
    const age = (now - m.born) / lifetime;
    const bloom = Math.sin(age * Math.PI);
    const r = m.radius * (0.35 + 1.6 * bloom) * (0.85 + 0.28 * m.pressure);
    ctx.save();
    ctx.translate(m.x, m.y);
    ctx.rotate(m.angle + m.bend * bloom * 0.5);
    ctx.scale(r, r * m.side);
    ctx.globalAlpha = (1 - age) ** 1.5 * (gentle ? 0.47 : 0.84);
    const branches = gentle ? 3 : 6;
    ctx.beginPath();
    for (let j = 0; j < branches; j++) {
      const s = j / branches,
        curl = 0.52 + 0.34 * Math.sin(m.spin + s + age * 3);
      ctx.moveTo(-s * 0.55, s * 0.16);
      ctx.bezierCurveTo(
        -0.35 - s * 0.8,
        0.45 + s,
        0.25 - s * 0.9,
        1.02 + s * 0.55,
        0.46 - s * 0.93,
        curl + s * 0.77
      );
    }
    ctx.lineWidth = 0.95 / Math.max(1, r);
    ctx.strokeStyle = `hsl(${hue + 35 * m.side + age * 40},94%,79%)`;
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
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

export function drawField(ctx, m, now, level) {
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
    const incident = Math.atan2(hit.ny, hit.nx);
    // The reflected front folds along the axis of the collision.
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * tau;
      const phase = a - incident;
      const ripple =
        1 + fade * (0.12 * Math.cos(3 * phase + age * 4) + 0.065 * Math.sin(7 * phase - age * 3));
      const dist = r * ripple * (0.88 + 0.12 * Math.cos(phase));
      const x = hit.x + dist * Math.cos(a),
        y = hit.y + dist * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.clip();
    const zoom = 1 + fade * (gentle ? 0.08 : 0.25);
    ctx.globalAlpha = fade * 0.75;
    const reach = r * 1.2,
      sampleR = reach / zoom;
    ctx.drawImage(
      source,
      crop.x + ((hit.x - sampleR) * crop.w) / view.width,
      crop.y + ((hit.y - sampleR) * crop.h) / view.height,
      (sampleR * 2 * crop.w) / view.width,
      (sampleR * 2 * crop.h) / view.height,
      hit.x - reach,
      hit.y - reach,
      reach * 2,
      reach * 2
    );
    const wave = ctx.createRadialGradient(hit.x, hit.y, 0, hit.x, hit.y, r);
    wave.addColorStop(0, 'transparent');
    wave.addColorStop(0.57, 'hsla(' + hue + ',98%,44%,.15)');
    wave.addColorStop(0.84, 'hsla(' + (hue + 52) + ',99%,57%,.76)');
    wave.addColorStop(1, 'hsla(' + hue + ',100%,77%,.32)');
    ctx.globalCompositeOperation = 'color';
    ctx.fillStyle = wave;
    ctx.fillRect(hit.x - reach, hit.y - reach, reach * 2, reach * 2);
    ctx.globalCompositeOperation = 'screen';
    ctx.lineWidth = Math.max(1.2, size * 0.006 * fade);
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
      const curl = 0.2 + 0.24 * Math.sin(age * 4 + i);
      ctx.bezierCurveTo(
        hit.x + Math.cos(a + curl) * (n + r * 0.19),
        hit.y + Math.sin(a + curl) * (n + r * 0.19),
        hit.x + Math.cos(a + curl * 1.5) * (n + r * 0.34),
        hit.y + Math.sin(a + curl * 1.5) * (n + r * 0.34),
        hit.x + Math.cos(a + curl * 1.7) * (n + r * 0.23),
        hit.y + Math.sin(a + curl * 1.7) * (n + r * 0.23)
      );
      ctx.lineWidth = 0.75 + 0.38 * (i % 3);
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
