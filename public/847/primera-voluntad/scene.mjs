const tau = Math.PI * 2;
const colors = ['#f5adff', '#80ffd7', '#8aa7ff'];
const particles = [];
const layers = Array.from({ length: 15 }, () => []);

function particle(x, y, z, band) {
  particles.push({ x, y, z, color: Math.floor(band % 9 / 3), px: 0, py: 0, depth: 0, size: 1 });
}

// The original particle torus and the diagonal through its center.
for (let ring = 0; ring < 92; ring++) {
  for (let side = 0; side < 9; side++) {
    const a = ring * tau / 92, b = side * tau / 9;
    particle((1 + .18 * Math.cos(b)) * Math.cos(a), (1 + .18 * Math.cos(b)) * Math.sin(a), .18 * Math.sin(b), ring);
  }
}
for (let i = 0; i < 85; i++) {
  for (let j = 0; j < 3; j++) {
    const x = -1.07 + 2.14 * i / 84, y = -.04 + .04 * j;
    particle(x * Math.cos(.75) - y * Math.sin(.75), x * Math.sin(.75) + y * Math.cos(.75), .055 + .03 * j, i);
  }
}

export function drawSign(ctx, motion) {
  const rolling = motion.phase === 'roll';
  const yaw = rolling ? .35 + .18 * Math.sin(motion.spin) : motion.tumble;
  const pitch = rolling ? -.14 : -.14 + .55 * Math.sin(motion.tumble);
  const c = Math.cos(motion.spin), s = Math.sin(motion.spin);
  const cy = Math.cos(yaw), sy = Math.sin(yaw), cx = Math.cos(pitch), sx = Math.sin(pitch);
  const { nx, ny } = motion.guide;
  let minProjection = Infinity, footX = 0, footY = 0;
  for (const layer of layers) layer.length = 0;
  for (const p of particles) {
    const ox = p.x * cy + p.z * sy, oz = -p.x * sy + p.z * cy;
    const oy = -(p.y * cx - oz * sx);
    p.depth = p.y * sx + oz * cx;
    const scale = motion.radius * 4 / (4 - p.depth);
    p.px = (ox * c - oy * s) * scale;
    p.py = (ox * s + oy * c) * scale;
    p.size = Math.max(.75, motion.radius * .025 * (1 + p.depth * .45));
    const depthBand = Math.max(0, Math.min(4, Math.floor((p.depth + 1.25) * 2)));
    layers[depthBand * 3 + p.color].push(p);
    const projection = p.px * nx + p.py * ny - p.size;
    if (rolling && projection < minProjection) {
      minProjection = projection;
      footX = p.px - nx * p.size;
      footY = p.py - ny * p.size;
    }
  }
  // Paint by depth and color so the mobile compositor only fills fifteen paths.
  for (let i = 0; i < layers.length; i++) {
    ctx.globalAlpha = .36 + .15 * Math.floor(i / 3);
    ctx.fillStyle = colors[i % 3];
    ctx.beginPath();
    for (const p of layers[i]) {
      const x = motion.x + p.px - footX, y = motion.y + p.py - footY;
      ctx.moveTo(x + p.size, y);
      ctx.arc(x, y, p.size, 0, tau);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function visibleCrop(sourceWidth, sourceHeight, width, height) {
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const w = width / scale, h = height / scale;
  return { x: (sourceWidth - w) / 2, y: (sourceHeight - h) / 2, w, h };
}

export function addMark(marks, motion, now, step, side) {
  const { guide, phase, radius } = motion;
  const angle = phase === 'roll' ? Math.atan2(guide.ty, guide.tx) : Math.atan2(motion.vy, motion.vx);
  const offset = step ? radius * .34 * side : 0;
  marks.push({
    x: motion.x - Math.sin(angle) * offset, y: motion.y + Math.cos(angle) * offset,
    radius: radius * (step ? 1.55 : 1.03), angle, side, step, born: now,
    lifetime: (step ? 880 : 470) * (motion.gentle ? .75 : 1),
  });
  if (marks.length > 12) marks.shift();
}

// Pull displaced strips from the currently visible camera crop, only under the
// logo's trail. The video used by the detector always stays untouched.
export function drawWake(ctx, source, crop, width, height, marks, now, gentle) {
  while (marks.length && now - marks[0].born > marks[0].lifetime) marks.shift();
  for (const m of marks) {
    const age = (now - m.born) / m.lifetime;
    if (age >= 1) continue;
    const fade = 1 - age, r = m.radius * (1 + .22 * age);
    const c = Math.cos(m.angle), s = Math.sin(m.angle);
    ctx.save();
    ctx.beginPath();
    if (m.step) {
      ctx.ellipse(m.x + .20*r*c, m.y + .20*r*s, .57*r, .29*r, m.angle, 0, tau);
      ctx.moveTo(m.x - .55*r*c + .23*r, m.y - .55*r*s);
      ctx.ellipse(m.x - .55*r*c, m.y - .55*r*s, .23*r, .23*r, 0, 0, tau);
    } else {
      ctx.ellipse(m.x, m.y, r, .72*r, m.angle, 0, tau);
    }
    ctx.clip();
    const stretch = 1 + (gentle ? .08 : .23) * fade;
    const left = m.x - r, top = m.y - r;
    const strip = r / 4;
    ctx.globalAlpha = fade * (gentle ? .58 : .90);
    for (let row = 0; row < 8; row++) {
      const bend = Math.sin((row + .5) * Math.PI / 8) * Math.sin(.7 * row + 5 * age + m.side) * r * fade * (gentle ? .10 : .32);
      const sx = crop.x + (m.x - r / stretch + bend) * crop.w / width;
      const sy = crop.y + (m.y + (row * strip - r) / stretch) * crop.h / height;
      ctx.drawImage(source, sx, sy, 2*r*crop.w/(width*stretch), (strip+1)*crop.h/(height*stretch),
        left, top + row * strip, 2*r, strip+1);
    }
    ctx.globalAlpha = fade * (m.step ? .23 : .12);
    ctx.fillStyle = m.side > 0 ? '#7cffd6' : '#c097ff';
    ctx.fillRect(left, top, 2*r, 2*r);
    ctx.restore();
  }
}

export function drawDemo(ctx, width, height, seconds, lean) {
  const sky = ctx.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, '#172333');
  sky.addColorStop(.55, '#48616a');
  sky.addColorStop(1, '#cc977d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  const glow = ctx.createRadialGradient(.72*width, .24*height, 0, .72*width, .24*height, .23*width);
  glow.addColorStop(0, '#e9ccb4'); glow.addColorStop(1, '#e9ccb400');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  const rise = (.12 * lean + .04 * Math.sin(seconds * .85)) * width;
  const plane = ctx.createLinearGradient(0, height*.52, width*.5, height);
  plane.addColorStop(0, '#202c3c'); plane.addColorStop(.65, '#4e435a'); plane.addColorStop(1, '#b78986');
  ctx.beginPath();
  ctx.moveTo(0, height*.59 - rise); ctx.lineTo(width, height*.59 + rise);
  ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();
  ctx.fillStyle = plane; ctx.fill();
}
