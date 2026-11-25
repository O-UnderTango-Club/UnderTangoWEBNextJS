import { luminance, visibleLines } from './line-detector.mjs';
import { cameraMotion } from './camera-motion.mjs';
import { readFloor, SignMotion } from './motion.mjs';
import {
  visibleCrop,
  drawWake,
  drawField,
  addMark,
  carryMarks,
  drawDemo,
  drawImpacts,
} from './scene.mjs';
import { drawSign } from './solid-sign.mjs';
import { soundscape } from './footsteps.mjs';

import { RollingSign, ShowBoard, collide } from './stage-physics.mjs';
import { announcements, cueAt, layoutBoard, paintBoard } from './show-board.mjs';
import { SceneClip } from './clip.mjs';
import { introMs } from './timing.mjs';

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
const ctx = surface.getContext('2d', { alpha: false }),
  ink = scene.getContext('2d');
const sample = document.createElement('canvas'),
  sampler = sample.getContext('2d', { willReadFrequently: true });
const texture = document.createElement('canvas'),
  textureInk = texture.getContext('2d');
const gentle = matchMedia('(prefers-reduced-motion: reduce)');
const audio = soundscape(updateSound);
const hint =
  'Buscando un borde. Probá con dos juntas del piso o con los costados de un pasillo bien iluminado.';
const clip = new SceneClip(updateClip);
const clipTools = get('clip-tools'),
  save = get('save'),
  share = get('share'),
  clipError = get('clip-error');
const art = new Image();
art.src = '/847/primera-voluntad.svg';
const view = { width: 1, height: 1, left: 10, top: 10, right: 10, bottom: 68 };
let body = null,
  board = new ShowBoard(),
  layout,
  sharing = false;
const hits = [];
function updateClip(current) {
  const ready = current.state === 'ready';
  clipTools.hidden = save.hidden = !ready;
  share.hidden = !ready || !current.canShare();
  clipError.hidden = current.state !== 'unavailable';
  if (ready) {
    save.href = current.url;
    save.download = current.file.name;
  } else {
    save.removeAttribute('href');
  }
}
share.addEventListener('click', async () => {
  if (sharing || !clip.canShare()) return;
  sharing = true;
  try {
    await navigator.share({ files: [clip.file], title: 'Ø Primera voluntad' });
  } catch (error) {
    if (error.name !== 'AbortError')
      status.textContent = 'Podés descargar el archivo con Guardar video.';
  } finally {
    sharing = false;
    if (document.hidden && mode) end('Experiencia cerrada al cambiar de pestaña.');
  }
});

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
  cueIndex = -1;
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
  const ratio = Math.min(devicePixelRatio || 1, 1.1, Math.sqrt(820000 / (w * h)));
  surface.width = Math.round(w * ratio);
  surface.height = Math.round(h * ratio);
  ctx?.setTransform(surface.width / w, 0, 0, surface.height / h, 0, 0);
  scene.width = w;
  scene.height = h;
  const style = getComputedStyle(stage);
  Object.assign(view, {
    width: w,
    height: h,
    top: 2 + parseFloat(style.paddingTop),
    left: 2 + parseFloat(style.paddingLeft),
    right: 5 + parseFloat(style.paddingRight),
    bottom: 58 + parseFloat(style.paddingBottom),
  });
  layout = layoutBoard(ctx, view);
  board.fit(view, layout);
  if (motion && changedAspect) {
    body = null;
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
  mode = motion = previous = body = null;
  clip.reset();
  board = new ShowBoard();
  if (layout) board.fit(view, layout);
  hits.length = 0;
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
  audio.close();
}
function end(message, complete = false) {
  release();
  finish.hidden = !complete;
  phase('idle', message);
}
function showWords(elapsed) {
  const next = cueAt(elapsed);
  if (next === cueIndex || next < 0) return;
  cueIndex = next;
  const cue = announcements[next];
  get('cue-meta').textContent = 'Show de arte generativo · ' + cue.city;
  get('cue-title').textContent = cue.text;
  caption.dataset.cue = String(next);
  caption.hidden = tools.hidden = false;
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
  if (previous && now - lastRead < 550) {
    const change = cameraMotion(previous, current);
    if (change) {
      board.carry(change);
      motion?.carry(change);
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
  if (ground.kind === 'convergence') {
    lastPairAt = now;
    board.observe(ground.angle);
  }
  if (!motion) {
    motion = new SignMotion(ground, width, height, gentle.matches);
    body = new RollingSign(motion);
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
function render(source, crop, now, dt) {
  const elapsed = now - sceneStart,
    lost = now - lastLineAt;
  showWords(elapsed);
  if (motion && lost > 1900) {
    motion = body = null;
    marks.length = 0;
    phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : hint);
  }
  let turned = false;
  while (dt > 0) {
    const step = Math.min(dt, 1 / 90);
    if (cueIndex >= 0) board.advance(view, step, elapsed / 1000, gentle.matches);
    if (motion) {
      if (motion.advance(step)) turned = true;
      body.advance(motion, step);
      const hit = cueIndex >= 0 && lost < 900 ? collide(body, board, now) : null;
      if (hit) {
        hits.push(hit);
        if (Math.abs(hit.ny) > 0.35) motion.direction = hit.ny > 0 ? -1 : 1;
        motion.lateral += hit.nx * 0.24;
        turned = true;
      }
    }
    dt -= step;
  }
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
  if (motion) {
    const beat = audio.pulse();
    if (lost < 900 && (turned || now - lastStep > 460 + 100 * motion.depth)) {
      lastStep = now;
      side *= -1;
      addMark(marks, body, now, true, side);
      audio.step(body.x / width, body.y / height, turned, side);
    }
    if (now - lastMark >= (gentle.matches ? 160 : 83)) {
      lastMark = now;
      addMark(marks, body, now, false, side);
    }
    refreshTexture(source, crop, nextRead);
    drawWake(
      ctx,
      texture,
      { x: 0, y: 0, w: texture.width, h: texture.height },
      width,
      height,
      marks,
      now,
      body
    );
    drawImpacts(
      ctx,
      texture,
      { x: 0, y: 0, w: texture.width, h: texture.height },
      view,
      hits,
      now,
      gentle.matches
    );
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1900 - lost) / 900);
    drawField(ctx, body, now, beat);
    drawSign(ctx, body, beat, now);
    ctx.restore();
  }
  if (cueIndex >= 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (elapsed - introMs) / 140);
    paintBoard(ctx, board, layout, cueIndex, art, now);
    ctx.restore();
  }
  if (clip.state === 'idle') clip.begin(surface, audio, now);
  else if (clip.state === 'preparing') clip.paint(surface, now);
}
function animate(now) {
  const dt = Math.min(0.05, Math.max(0, (now - frameAt) / 1000));
  frameAt = now;
  const isDemo = mode === 'demo',
    source = isDemo ? scene : feed;
  const sw = isDemo ? scene.width : feed.videoWidth,
    sh = isDemo ? scene.height : feed.videoHeight;
  if (sw && sh && (isDemo || feed.readyState >= 2)) {
    const crop = visibleCrop(sw, sh, width, height);
    if (now >= nextRead) {
      nextRead = now + 63;
      if (isDemo) drawDemo(ink, width, height, sceneStart ? (now - sceneStart) / 1000 : 0, lean);
      try {
        analyze(source, crop, now);
      } catch {
        end('No se pudo leer la imagen. Podés reintentar o elegir Ver sin cámara.');
        return;
      }
    }
    if (!sceneStart) {
      now = performance.now();
      sceneStart = lastMark = lastStep = now;
      audio.start(now);
    }
    render(source, crop, now, dt);
  }
  frame = requestAnimationFrame(animate);
}
function startFrames() {
  frameAt = performance.now();
  sceneStart = 0;
  textureTime = -1;
  lastMark = lastStep = sceneStart;
  nextRead = nextLines = 0;
  lastPairAt = -Infinity;
  side = 1;
  phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : hint);
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
  audio.prepare();
  phase(
    'permission',
    selected === 'camera' ? 'Esperando permiso para usar la cámara…' : 'Escena de muestra, sin cámara.'
  );
  resize();
  window.scrollTo(0, 0);
  if (selected === 'demo') {
    audio.unlock();
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
  if (mode && !event.target.closest('button,a')) audio.unlock();
});
addEventListener('pagehide', () => end('Experiencia cerrada. Podés volver a empezar.'));
if (typeof ResizeObserver === 'function') new ResizeObserver(resize).observe(stage);
else addEventListener('resize', resize);
document.fonts
  ?.load('800 20px Uberlin')
  .then(() => {
    if (ctx && layout) {
      layout = layoutBoard(ctx, view);
      board.fit(view, layout);
    }
  })
  .catch(() => {});
let opened = false;
function visibility() {
  if (document.hidden) {
    if (mode && !sharing) end('Experiencia cerrada al cambiar de pestaña.');
  } else if (!opened) {
    opened = true;
    enter(location.hash === '#sin-camara' ? 'demo' : 'camera');
  }
}
document.addEventListener('visibilitychange', visibility);
visibility();
