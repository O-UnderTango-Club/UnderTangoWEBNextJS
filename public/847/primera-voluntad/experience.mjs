import { longestLine, sameLine } from './line-detector.mjs';

const DETECTION_DELAY = 3000;
const SAMPLE_INTERVAL = 150;
const END_PAUSE = 1500;
const SAMPLE_SIZE = 192;
const colors = ['#f5adff', '#80ffd7', '#8aa7ff'];
const SEARCH_HINT = 'Buscando una recta. Probá con el borde bien iluminado de una mesa o de una puerta.';
const get = id => document.getElementById(id);
const stage = get('stage'), surface = get('surface'), feed = get('feed');
const demoScene = get('scene'), finish = get('finish'), status = get('status');
const camera = get('camera'), demo = get('demo'), stop = get('stop');
const ctx = surface.getContext('2d');
const sample = document.createElement('canvas');
const sampler = sample.getContext('2d', { willReadFrequently: true });
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

let phase = 'idle', stream = null, generation = 0, timer = 0, frame = 0;
let width = 1, height = 1, demoEdge = null;
let candidate = null, detectedAt = 0, previousVideoTime = -1, previousSampleAt = 0;
let route = null, progress = 0;

// The original particle torus and diagonal, in model coordinates.
const particles = [];
function addParticle(x, y, z, band, side) {
  particles.push([x, y, z, band, Math.sin(band * 3.2 + side), Math.cos(band * 5 + side)]);
}
for (let ring = 0; ring < 92; ring++) {
  for (let side = 0; side < 9; side++) {
    const a = ring * 2 * Math.PI / 92, b = side * 2 * Math.PI / 9;
    addParticle((1 + .18 * Math.cos(b)) * Math.cos(a), (1 + .18 * Math.cos(b)) * Math.sin(a),
      .18 * Math.sin(b), ring, side);
  }
}
for (let i = 0; i < 85; i++) {
  for (let j = 0; j < 3; j++) {
    const x = -1.07 + 2.14 * i / 84, y = -.04 + .04 * j;
    addParticle(x * Math.cos(.75) - y * Math.sin(.75), x * Math.sin(.75) + y * Math.cos(.75),
      .055 + .03 * j, i, j + 10);
  }
}

function say(message) {
  if (status.textContent !== message) status.textContent = message;
}

function cancelAnimation() {
  clearTimeout(timer);
  cancelAnimationFrame(frame);
}

function releaseCamera() {
  if (stream) {
    for (const track of stream.getTracks()) track.stop();
    stream = null;
  }
  feed.pause();
  feed.srcObject = null;
  feed.hidden = true;
  stop.hidden = true;
  sample.width = sample.height = 0;
}

function drawIdle() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(197, 201, 220, .48)';
  for (let i = 0; i < 47; i++) ctx.fillRect(i * 79.13 % width, i * 29.79 % height, i % 9 === 0 ? 2 : 1, 1);
}

function reset(message = 'Elegí cómo querés entrar.') {
  generation++;
  cancelAnimation();
  phase = 'idle';
  releaseCamera();
  candidate = route = demoEdge = null;
  demoScene.hidden = true;
  camera.disabled = false;
  finish.hidden = true;
  stage.classList.remove('altered');
  if (ctx) drawIdle();
  say(message);
}

function drawDemoScene() {
  demoScene.width = width;
  demoScene.height = height;
  const ink = demoScene.getContext('2d');
  const sky = ink.createLinearGradient(0, 0, width, height);
  sky.addColorStop(0, '#151931');
  sky.addColorStop(.65, '#35345a');
  sky.addColorStop(1, '#51566b');
  ink.fillStyle = sky;
  ink.fillRect(0, 0, width, height);

  const left = .08 * width, right = .92 * width;
  const firstY = demoEdge[0] * height, lastY = demoEdge[1] * height;
  ink.beginPath();
  ink.moveTo(left, firstY);
  ink.lineTo(right, lastY);
  ink.lineTo(right, lastY + .045 * height);
  ink.lineTo(left, firstY + .045 * height);
  ink.closePath();
  ink.fillStyle = '#84999b';
  ink.fill();
  ink.beginPath();
  ink.moveTo(left, firstY);
  ink.lineTo(right, lastY);
  ink.strokeStyle = '#d3e4cf';
  ink.lineWidth = 2;
  ink.stroke();
}

function resize() {
  const nextWidth = Math.max(1, surface.clientWidth), nextHeight = Math.max(1, surface.clientHeight);
  const aspectChanged = Math.abs((nextWidth / nextHeight) / (width / height) - 1) > .04;
  width = nextWidth;
  height = nextHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  surface.width = Math.round(width * dpr);
  surface.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (phase === 'idle') drawIdle();
  if (demoEdge) drawDemoScene();
  if (aspectChanged && (phase === 'search' || phase === 'roll' || phase === 'rest')) beginSearch();
  else if (route && (phase === 'roll' || phase === 'rest')) {
    route = makeRoute(route.line);
    drawPosition(progress);
  }
}

// Sample exactly the centered object-fit: cover crop shown by the video element.
function readVisibleFrame(source, sourceWidth, sourceHeight) {
  const w = Math.max(1, Math.round(SAMPLE_SIZE * width / Math.max(width, height)));
  const h = Math.max(1, Math.round(SAMPLE_SIZE * height / Math.max(width, height)));
  if (sample.width !== w || sample.height !== h) {
    sample.width = w;
    sample.height = h;
  }
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const sw = width / scale, sh = height / scale;
  sampler.drawImage(source, (sourceWidth - sw) / 2, (sourceHeight - sh) / 2, sw, sh, 0, 0, w, h);
  return sampler.getImageData(0, 0, w, h);
}

function drawGuide(line) {
  ctx.beginPath();
  ctx.moveTo(line.a.x * width, line.a.y * height);
  ctx.lineTo(line.b.x * width, line.b.y * height);
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(9, 18, 32, .48)';
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(183, 246, 218, .88)';
  ctx.stroke();
}

function searching() {
  candidate = null;
  ctx.clearRect(0, 0, width, height);
  say(demoEdge ? 'Escena de muestra, sin cámara.' : SEARCH_HINT);
}

function scan() {
  if (phase !== 'search') return;
  const now = performance.now();
  const ready = demoEdge || (feed.readyState >= 2 && feed.videoWidth && feed.videoHeight && feed.currentTime !== previousVideoTime);
  if (now - previousSampleAt > 650) searching();
  if (ready) {
    previousSampleAt = now;
    previousVideoTime = feed.currentTime;
    let line;
    try {
      const pixels = demoEdge ? readVisibleFrame(demoScene, width, height)
        : readVisibleFrame(feed, feed.videoWidth, feed.videoHeight);
      line = longestLine(pixels);
    } catch {
      reset('No se pudo leer la imagen. Podés intentar de nuevo o elegir Ver sin cámara.');
      return;
    }
    if (!line) {
      searching();
    } else {
      if (!candidate || !sameLine(candidate, line, width, height)) {
        candidate = line;
        detectedAt = performance.now();
      }
      ctx.clearRect(0, 0, width, height);
      drawGuide(line);
      say(demoEdge ? 'Escena de muestra. El código encontró su borde.' : 'Encontré una recta. Sostené el encuadre tres segundos.');
      if (now - detectedAt >= DETECTION_DELAY) {
        startRoll(line);
        return;
      }
    }
  }
  timer = setTimeout(scan, SAMPLE_INTERVAL);
}

function beginSearch() {
  cancelAnimation();
  phase = 'search';
  route = null;
  previousVideoTime = -1;
  previousSampleAt = performance.now();
  stage.classList.remove('altered');
  searching();
  scan();
}

function makeRoute(line) {
  const a = { x: line.a.x * width, y: line.a.y * height };
  const b = { x: line.b.x * width, y: line.b.y * height };
  const dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
  const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  // Roll downhill. On a level edge, the framing selects the end nearer the center.
  const end = Math.abs(dy) > .06 * length ? (a.y > b.y ? a : b)
    : (Math.abs(a.x - width / 2) < Math.abs(b.x - width / 2) ? a : b);
  let nx = dy / length, ny = -dx / length;
  if (ny > 0 || (Math.abs(ny) < .15 && nx * (width / 2 - middle.x) < 0)) {
    nx = -nx;
    ny = -ny;
  }
  const radius = Math.min(.11 * Math.min(width, height), .16 * length);
  // On an edge against the frame, keep the symbol on the visible side.
  if (middle.x + nx * radius * 1.4 < 0 || middle.x + nx * radius * 1.4 > width ||
      middle.y + ny * radius * 1.4 < 0 || middle.y + ny * radius * 1.4 > height) {
    nx = -nx;
    ny = -ny;
  }
  const vx = end.x - middle.x, vy = end.y - middle.y;
  const distance = Math.hypot(vx, vy);
  return {
    line, middle, end, nx, ny, radius,
    turn: Math.sign(vx * -ny + vy * nx) * distance / radius,
    duration: Math.min(3200, Math.max(1600, 5200 * distance / Math.max(width, height))),
  };
}

function drawPosition(fraction) {
  const { line, middle, end, nx, ny, radius } = route;
  const x = middle.x + fraction * (end.x - middle.x), y = middle.y + fraction * (end.y - middle.y);
  const turn = route.turn * fraction * (reducedMotion.matches ? .25 : 1);
  const c = Math.cos(turn), s = Math.sin(turn);
  const yaw = .35 + .18 * Math.sin(turn), cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cx = Math.cos(-.14), sx = Math.sin(-.14);
  let minProjection = Infinity, footX = 0, footY = 0;
  const scatter = reducedMotion.matches ? 0 : radius * .18 * Math.max(0, 1 - fraction / .12);
  const dots = particles.map(([mx, my, mz, band, offsetX, offsetY]) => {
    const ox = mx * cy + mz * sy, oz = -mx * sy + mz * cy;
    const oy = -(my * cx - oz * sx), depth = my * sx + oz * cx;
    const scale = radius * 4 / (4 - depth);
    const px = (ox * c - oy * s) * scale + scatter * offsetX;
    const py = (ox * s + oy * c) * scale + scatter * offsetY;
    const size = Math.max(.75, radius * .023 * (1 + depth * .45));
    // Pin the actual outermost projected particle to the contact point.
    const projection = px * nx + py * ny - size;
    if (projection < minProjection) {
      minProjection = projection;
      footX = px - nx * size;
      footY = py - ny * size;
    }
    return { px, py, depth, size, band };
  });
  ctx.clearRect(0, 0, width, height);
  drawGuide(line);
  stage.style.setProperty('--x', (100 * x / width) + '%');
  stage.style.setProperty('--y', (100 * y / height) + '%');
  dots.sort((p, q) => p.depth - q.depth);
  for (const dot of dots) {
    ctx.globalAlpha = Math.min(.98, .62 + dot.depth * .35);
    ctx.fillStyle = colors[Math.floor(dot.band % 9 / 3)];
    ctx.beginPath();
    ctx.arc(x + dot.px - footX, y + dot.py - footY, dot.size, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function startRoll(line) {
  phase = 'roll';
  route = makeRoute(line);
  sample.width = sample.height = 0;
  stage.classList.add('altered');
  say('El Ø rueda sobre el borde.');
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / route.duration);
    progress = t * t * (3 - 2 * t);
    drawPosition(progress);
    if (t < 1) {
      frame = requestAnimationFrame(tick);
      return;
    }
    phase = 'rest';
    say('El Ø descansa en el extremo.');
    timer = setTimeout(() => {
      phase = 'done';
      releaseCamera();
      camera.disabled = false;
      finish.hidden = false;
      say(finish.querySelector('h2').textContent);
    }, END_PAUSE);
  }
  tick(start);
}

camera.addEventListener('click', async () => {
  reset();
  const request = generation;
  phase = 'permission';
  camera.disabled = true;
  stop.hidden = false;
  say('Esperando permiso para usar la cámara…');
  try {
    if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Error('Cámara no disponible');
    const next = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 960 }, height: { ideal: 720 } },
      audio: false,
    });
    if (request !== generation) {
      next.getTracks().forEach(track => track.stop());
      return;
    }
    stream = next;
    for (const track of stream.getVideoTracks()) {
      track.addEventListener('ended', () => {
        if (request === generation) reset('La cámara se cerró. Podés volver a empezar o elegir Ver sin cámara.');
      }, { once: true });
    }
    feed.srcObject = stream;
    feed.hidden = false;
    stage.scrollIntoView({ block: 'center' });
    await feed.play();
    if (request === generation) beginSearch();
  } catch {
    if (request === generation) reset('No se pudo abrir la cámara. Podés ver la experiencia sin cámara.');
  }
});

demo.addEventListener('click', () => {
  reset();
  const slope = (.12 + Math.random() * .18) * (Math.random() < .5 ? -1 : 1);
  demoEdge = [.59 - slope / 2, .59 + slope / 2];
  demoScene.hidden = false;
  drawDemoScene();
  stage.scrollIntoView({ block: 'center' });
  beginSearch();
});
stop.addEventListener('click', () => reset('Cámara cerrada. Podés volver a empezar.'));
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (stream || phase === 'permission')) reset('Cámara cerrada al cambiar de pestaña.');
});
addEventListener('pagehide', () => reset());
if (!ctx || !sampler) {
  camera.disabled = demo.disabled = true;
  say('Este navegador no puede dibujar la experiencia.');
} else {
  resize();
  if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(stage);
  else addEventListener('resize', resize);
}
