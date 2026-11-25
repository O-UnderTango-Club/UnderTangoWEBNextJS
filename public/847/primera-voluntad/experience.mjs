import { luminance, visibleLines } from './line-detector.mjs';
import { cameraMotion } from './camera-motion.mjs';
import { readFloor, SignMotion } from './motion.mjs';
import { visibleCrop, drawWake, drawField, addMark, carryMarks, drawDemo } from './scene.mjs';
import { drawSign } from './solid-sign.mjs';
import { soundscape } from './footsteps.mjs';

const get = (id) => document.getElementById(id);
const stage = get('stage'),
  feed = get('feed'),
  surface = get('surface'),
  scene = get('scene');
const camera = get('camera'),
  demo = get('demo'),
  sound = get('sound'),
  stop = get('stop'),
  speaker = get('speaker');
const caption = get('cue'),
  tools = get('stage-tools'),
  status = get('status'),
  finish = get('finish');
const ctx = surface.getContext('2d'),
  ink = scene.getContext('2d');
const sample = document.createElement('canvas'),
  sampler = sample.getContext('2d', { willReadFrequently: true });
const texture = document.createElement('canvas'),
  textureInk = texture.getContext('2d');
const gentle = matchMedia('(prefers-reduced-motion: reduce)');
const audio = soundscape(updateSound);
const hint =
  'Buscando un borde. Probá con dos juntas del piso o con los costados de un pasillo bien iluminado.';
const cues = [
  [2600, 'Ø Primera voluntad', 'Este 2 de diciembre'],
  [10000, 'Ø Primera voluntad · Pablo Cieslik', 'Show de arte generativo'],
  [18200, 'Festival Multiversos · Puerto Iguazú', 'La Cabaña de los Muñecos'],
  [27500, 'Show de arte generativo · Puerto Iguazú', finish.querySelector('h2').textContent],
];

let generation = 0,
  mode = null,
  stream = null,
  motion = null,
  frame = 0;
let width = 1,
  height = 1,
  previous = null,
  textureTime = -1,
  frameAt = 0,
  lastRead = 0,
  nextRead = 0,
  nextLines = 0;
let sceneStart = 0,
  lastLineAt = 0,
  lastPairAt = 0,
  lastMark = 0,
  lastStep = 0,
  side = 1,
  lean = 1,
  cueIndex = -1,
  nextDrift = 0;
const marks = [];

function updateSound() {
  const audible = audio.audible();
  const label = audio.failed()
    ? 'Reintentar música'
    : audible
      ? 'Silenciar música y pasos'
      : 'Activar música y pasos';
  sound.hidden = speaker.hidden = !mode || !audio.supported;
  sound.textContent = label;
  speaker.setAttribute('aria-label', label);
  speaker.setAttribute('aria-pressed', String(audible));
}
function phase(name, message) {
  stage.dataset.phase = name;
  status.textContent = message;
  camera.hidden = mode === 'camera';
  demo.textContent = mode === 'demo' ? 'Reiniciar muestra' : 'Ver sin cámara';
  stop.hidden = !mode;
  updateSound();
}

function resize() {
  const w = stage.clientWidth,
    h = stage.clientHeight;
  if (!w || !h || (w === width && h === height)) return;
  const changedAspect = Math.abs(w / h / (width / height) - 1) > 0.3;
  width = w;
  height = h;
  const ratio = Math.min(devicePixelRatio || 1, 1.75, Math.sqrt(1550000 / (w * h)));
  surface.width = Math.round(w * ratio);
  surface.height = Math.round(h * ratio);
  ctx?.setTransform(surface.width / w, 0, 0, surface.height / h, 0, 0);
  scene.width = w;
  scene.height = h;
  if (motion && changedAspect) {
    motion = null;
    phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : hint);
  } else motion?.resize(w, h);
  previous = null;
  marks.length = 0;
  textureTime = -1;
  nextRead = nextLines = 0;
}

function release() {
  generation++;
  cancelAnimationFrame(frame);
  mode = motion = previous = null;
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  feed.pause();
  feed.srcObject = null;
  feed.hidden = scene.hidden = true;
  sample.width = sample.height = texture.width = texture.height = 0;
  ctx?.clearRect(0, 0, width, height);
  marks.length = 0;
  caption.hidden = tools.hidden = true;
  cueIndex = -1;
  caption.style.removeProperty('--dx');
  caption.style.removeProperty('--dy');
  audio.close();
}
function end(message, complete = false) {
  release();
  finish.hidden = !complete;
  phase('idle', message);
}
function showWords(now) {
  const next = cueIndex + 1;
  if (next < cues.length && now - sceneStart >= cues[next][0]) {
    cueIndex = next;
    get('cue-meta').textContent = cues[next][1];
    get('cue-title').textContent = cues[next][2];
    caption.dataset.cue = String(next);
    caption.hidden = tools.hidden = false;
    if (!gentle.matches)
      caption.firstElementChild.animate?.(
        [
          { opacity: 0, transform: 'translateY(5px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 650, easing: 'ease-out' }
      );
    if (motion) addMark(marks, motion, now, true, -side);
  }
  if (motion && !caption.hidden && now >= nextDrift) {
    nextDrift = now + 85;
    const f = motion.floor;
    const x = gentle.matches
      ? 0
      : Math.max(-5, Math.min(5, (f.vanish.x / width - 0.5) * 10 + motion.tilt * 5));
    const y = gentle.matches ? 0 : Math.max(-4, Math.min(4, (f.vanish.y / height - 0.32) * 9));
    caption.style.setProperty('--dx', x.toFixed(1) + 'px');
    caption.style.setProperty('--dy', y.toFixed(1) + 'px');
  }
}
function analyze(source, crop, now) {
  const scale = 192 / Math.max(width, height),
    w = Math.max(1, Math.round(width * scale)),
    h = Math.max(1, Math.round(height * scale));
  if (sample.width !== w || sample.height !== h) {
    sample.width = w;
    sample.height = h;
    previous = null;
  }
  sampler.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  const current = luminance(sampler.getImageData(0, 0, w, h));
  if (motion && previous && now - lastRead < 550) {
    const change = cameraMotion(previous, current);
    if (change) {
      motion.carry(change);
      carryMarks(marks, change, width, height);
    }
  }
  previous = current;
  lastRead = now;
  if (now < nextLines) return;
  nextLines = now + 135;
  const ground = readFloor(visibleLines(current), width, height, motion?.target.line);
  if (!ground) return;
  lastLineAt = now;
  if (ground.kind === 'convergence') lastPairAt = now;
  if (!motion) {
    motion = new SignMotion(ground, width, height, gentle.matches);
    phase(
      'ground',
      mode === 'demo' ? 'Escena de muestra, sin cámara.' : 'El Ø sigue el movimiento de tu encuadre.'
    );
  } else if (ground.kind === 'convergence' || now - lastPairAt > 520) motion.observe(ground);
}
function refreshTexture(source, crop, stamp) {
  if (stamp === textureTime && texture.width) return;
  const scale = Math.min(1, 720 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale)),
    h = Math.max(1, Math.round(height * scale));
  if (texture.width !== w || texture.height !== h) {
    texture.width = w;
    texture.height = h;
  }
  textureInk.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  textureTime = stamp;
}
function renderMotion(source, crop, now, dt) {
  const lost = now - lastLineAt;
  if (lost > 1450) {
    motion = null;
    marks.length = 0;
    ctx.clearRect(0, 0, width, height);
    phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : hint);
    return;
  }
  let turned = false;
  while (dt > 0) {
    const step = Math.min(dt, 1 / 40);
    if (motion.advance(step)) turned = true;
    dt -= step;
  }
  const beat = audio.pulse();
  if (lost < 850 && (turned || now - lastStep > 460 + 100 * motion.depth)) {
    lastStep = now;
    side *= -1;
    addMark(marks, motion, now, true, side);
    audio.step(motion.x / width, motion.y / height, turned, side);
  }
  if (now - lastMark >= (gentle.matches ? 190 : 115)) {
    lastMark = now;
    addMark(marks, motion, now, false, side);
  }
  ctx.clearRect(0, 0, width, height);
  refreshTexture(source, crop, nextRead);
  drawWake(
    ctx,
    texture,
    { x: 0, y: 0, w: texture.width, h: texture.height },
    width,
    height,
    marks,
    now,
    gentle.matches
  );
  drawField(ctx, motion, marks, now, beat);
  ctx.save();
  ctx.globalAlpha = Math.min(1, (1450 - lost) / 550);
  drawSign(ctx, motion, beat, now);
  ctx.restore();
}
function animate(now) {
  const dt = Math.min(0.2, Math.max(0, (now - frameAt) / 1000));
  frameAt = now;
  const isDemo = mode === 'demo',
    source = isDemo ? scene : feed;
  const sw = isDemo ? scene.width : feed.videoWidth,
    sh = isDemo ? scene.height : feed.videoHeight;
  if (sw && sh && (isDemo || feed.readyState >= 2)) {
    const crop = visibleCrop(sw, sh, width, height);
    if (now >= nextRead) {
      nextRead = now + 63;
      if (isDemo) drawDemo(ink, width, height, (now - sceneStart) / 1000, lean);
      try {
        analyze(source, crop, now);
      } catch {
        end('No se pudo leer la imagen. Podés reintentar o elegir Ver sin cámara.');
        return;
      }
    }
    showWords(now);
    if (motion) renderMotion(source, crop, now, dt);
  }
  frame = requestAnimationFrame(animate);
}
function startFrames() {
  frameAt = sceneStart = performance.now();
  textureTime = -1;
  lastMark = lastStep = sceneStart;
  nextRead = nextLines = nextDrift = 0;
  lastPairAt = -Infinity;
  side = 1;
  phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : hint);
  audio.start();
  frame = requestAnimationFrame(animate);
}
async function enter(selected) {
  release();
  finish.hidden = true;
  if (!ctx || !ink || !sampler || !textureInk) {
    end('Este navegador no puede dibujar la experiencia.');
    return;
  }
  mode = selected;
  const current = generation;
  phase(
    'permission',
    selected === 'camera' ? 'Esperando permiso para usar la cámara…' : 'Escena de muestra, sin cámara.'
  );
  resize();
  window.scrollTo(0, 0);
  if (selected === 'demo') {
    scene.hidden = false;
    lean = Math.random() < 0.5 ? -1 : 1;
    startFrames();
    return;
  }
  try {
    if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Error('Cámara no disponible');
    const request = navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 960 }, height: { ideal: 720 } },
      audio: false,
    });
    audio.unlock();
    const acquired = await request;
    if (current !== generation) {
      acquired.getTracks().forEach((track) => track.stop());
      return;
    }
    stream = acquired;
    for (const track of stream.getVideoTracks())
      track.addEventListener(
        'ended',
        () => {
          if (current === generation) end('La cámara se cerró. Podés volver a empezar.');
        },
        { once: true }
      );
    feed.muted = true;
    feed.srcObject = acquired;
    feed.hidden = false;
    await feed.play();
    if (current === generation) startFrames();
  } catch {
    if (current === generation)
      end('No se pudo abrir la cámara. Podés reintentar o elegir Ver sin cámara.');
  }
}
function dismiss() {
  end('Experiencia cerrada. Podés volver a empezar.', cueIndex >= 0);
}
camera.addEventListener('click', () => enter('camera'));
demo.addEventListener('click', () => enter('demo'));
stop.addEventListener('click', dismiss);
get('dismiss').addEventListener('click', dismiss);
sound.addEventListener('click', audio.toggle);
speaker.addEventListener('click', audio.toggle);
stage.addEventListener('click', (event) => {
  if (mode && !event.target.closest('button')) audio.unlock();
});
addEventListener('pagehide', () => end('Experiencia cerrada. Podés volver a empezar.'));
if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(stage);
else addEventListener('resize', resize);
let opened = false;
function visibility() {
  if (document.hidden) {
    if (mode) end('Experiencia cerrada al cambiar de pestaña.');
  } else if (!opened) {
    opened = true;
    enter(location.hash === '#sin-camara' ? 'demo' : 'camera');
  }
}
document.addEventListener('visibilitychange', visibility);
visibility();
