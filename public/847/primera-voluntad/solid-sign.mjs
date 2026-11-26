// Beveled annulus and extruded slash. All faces are opaque; front, inner wall,
// bevel and back catch the light independently as the sign turns.
const points = [],
  faces = [];
function vertex(x, y, z) {
  points.push({ x, y, z, u: 0, v: 0, depth: 0 });
  return points.length - 1;
}
function quad(a, b, c, d, metal) {
  const p = points[a],
    q = points[b],
    r = points[c];
  const ux = q.x - p.x,
    uy = q.y - p.y,
    uz = q.z - p.z,
    vx = r.x - p.x,
    vy = r.y - p.y,
    vz = r.z - p.z;
  const x = uy * vz - uz * vy,
    y = uz * vx - ux * vz,
    z = ux * vy - uy * vx,
    len = Math.hypot(x, y, z);
  faces.push({
    indices: [a, b, c, d],
    nx: x / len,
    ny: y / len,
    nz: z / len,
    metal,
    order: 0,
    color: '',
  });
}
const profile = [
  [0.94, 0.235],
  [0.66, 0.235],
  [0.61, 0.165],
  [0.61, -0.15],
  [0.66, -0.22],
  [0.94, -0.22],
  [1, -0.15],
  [1, 0.16],
];
const sides = 42;
const rings = profile.map(([radius, z]) =>
  Array.from({ length: sides }, (_, i) => {
    const t = (2 * Math.PI * i) / sides;
    return vertex(radius * Math.cos(t), radius * Math.sin(t), z);
  })
);
for (let j = 0; j < rings.length; j++)
  for (let i = 0; i < sides; i++) {
    const k = (i + 1) % sides,
      next = (j + 1) % rings.length;
    quad(rings[j][i], rings[j][k], rings[next][k], rings[next][i], [0, 2, 1, 2, 1, 2, 1, 2][j]);
  }
const slash = [-0.175, 0.265].map((z) =>
  [
    [-1.21, -0.095],
    [1.21, -0.095],
    [1.21, 0.095],
    [-1.21, 0.095],
  ].map(([u, v]) => vertex(0.7071 * (u - v), 0.7071 * (u + v), z))
);
quad(...slash[1], 2);
quad(...[...slash[0]].reverse(), 1);
for (let i = 0; i < 4; i++) {
  const j = (i + 1) % 4;
  quad(slash[0][i], slash[0][j], slash[1][j], slash[1][i], 1);
}
// Hold each metal long enough to read in the clip, with soft transitions at both ends.
function smooth(value) {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
}
export function metalAt(ms) {
  const phase = (((ms % 14000) + 14000) % 14000) / 1000;
  const ivory = smooth((phase - 1.7) / 1.0) * (1 - smooth((phase - 4.0) / 1.1));
  const graphite = smooth((phase - 7.4) / 1.15) * (1 - smooth((phase - 10) / 1.15));
  return { hue: Math.floor(((ms * 0.018 + 202) % 360) / 4) * 4, ivory, graphite };
}
let paletteKey = '',
  ramps;
function updateMetal(elapsed) {
  const { hue, ivory, graphite } = metalAt(elapsed);
  const key = [hue, Math.round(ivory * 32), Math.round(graphite * 32)].join('/');
  if (key === paletteKey) return;
  paletteKey = key;
  const color = 1 - ivory - graphite;
  ramps = [0, 28, -19].map((offset, face) =>
    Array.from({ length: 48 }, (_, i) => {
      const t = i / 47;
      const chromatic = (face === 1 ? 15 : 24) + i * (face === 1 ? 1.03 : 1.42);
      const white = face === 1 ? 34 + 41 * t : 72 + 26 * t;
      const black = face === 2 ? 16 + 53 * t : (face === 1 ? 3 : 5) + 25 * t ** 2;
      return `hsl(${hue + offset},${color * (face === 1 ? 75 : 83)}%,${color * chromatic + ivory * white + graphite * black}%)`;
    })
  );
}

const spriteSize = 288,
  unit = 100;
let sprite,
  brush,
  lastRoll = Infinity,
  lastYaw = Infinity,
  lastPitch = Infinity,
  lastPaint = -Infinity,
  foot = 0;

// Perspective size and position are composited at the video frame rate. Only
// the small opaque mesh needs to be repainted when its lighting or pose changes.
export function drawSign(stage, m, level, now, elapsed) {
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = spriteSize;
    brush = sprite.getContext('2d');
  }
  const roll = m.spin + m.floor.angle * 0.55;
  const change = Math.abs(roll - lastRoll) + Math.abs(m.yaw - lastYaw) + Math.abs(m.pitch - lastPitch);
  if (change > 0.12 || (now - lastPaint > 45 && change > 0.014) || now - lastPaint > 180) {
    updateMetal(elapsed);
    brush.clearRect(0, 0, spriteSize, spriteSize);
    foot = paintMesh(brush, m.yaw, m.pitch, roll, level);
    lastRoll = roll;
    lastYaw = m.yaw;
    lastPitch = m.pitch;
    lastPaint = now;
  }
  const scale = m.radius / unit,
    side = spriteSize * scale;
  stage.drawImage(sprite, m.x - side / 2, m.y - m.lift - side / 2 - foot * scale, side, side);
}

function paintMesh(ctx, yaw, pitch, roll, level) {
  const cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cx = Math.cos(pitch),
    sx = Math.sin(pitch),
    cr = Math.cos(roll),
    sr = Math.sin(roll);
  // Roll in the sign's own plane, then tilt it in space.
  const xx = cy * cr,
    xy = -cy * sr,
    xz = sy;
  const yx = cx * sr + sx * sy * cr,
    yy = cx * cr - sx * sy * sr,
    yz = -sx * cy;
  const zx = sx * sr - cx * sy * cr,
    zy = sx * cr + cx * sy * sr,
    zz = cx * cy;
  let bottom = -Infinity;
  for (const p of points) {
    p.depth = zx * p.x + zy * p.y + zz * p.z;
    const scale = (unit * 5) / (5 - p.depth);
    p.u = (xx * p.x + xy * p.y + xz * p.z) * scale;
    p.v = -(yx * p.x + yy * p.y + yz * p.z) * scale;
    bottom = Math.max(bottom, p.v);
  }
  for (const f of faces) {
    const [a, b, c, d] = f.indices;
    f.order = points[a].depth + points[b].depth + points[c].depth + points[d].depth;
    const nx = xx * f.nx + xy * f.ny + xz * f.nz,
      ny = yx * f.nx + yy * f.ny + yz * f.nz,
      nz = zx * f.nx + zy * f.ny + zz * f.nz;
    const first = points[a];
    f.visible =
      nz * (5 - first.depth) >
      nx * (xx * first.x + xy * first.y + xz * first.z) +
        ny * (yx * first.x + yy * first.y + yz * first.z);
    if (!f.visible) continue;
    const diffuse = Math.max(0, -nx * 0.52 + ny * 0.58 + nz * 0.62);
    const shine = Math.pow(Math.max(0, -nx * 0.27 + ny * 0.38 + nz * 0.88), 14);
    const light = Math.max(
      0,
      Math.min(1, 0.12 + 0.62 * diffuse + 0.38 * shine + 0.07 * level + points[a].x * 0.035)
    );
    f.color = ramps[f.metal][Math.round(light * 47)];
  }
  faces.sort((a, b) => a.order - b.order);
  ctx.save();
  ctx.translate(spriteSize / 2, spriteSize / 2);
  ctx.lineWidth = 0.5;
  ctx.lineJoin = 'round';
  for (const f of faces) {
    if (!f.visible) continue;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const p = points[f.indices[i]];
      if (i === 0) ctx.moveTo(p.u, p.v);
      else ctx.lineTo(p.u, p.v);
    }
    ctx.closePath();
    ctx.fillStyle = f.color;
    ctx.fill();
    ctx.strokeStyle = f.color;
    ctx.stroke();
  }
  ctx.restore();
  return bottom;
}
