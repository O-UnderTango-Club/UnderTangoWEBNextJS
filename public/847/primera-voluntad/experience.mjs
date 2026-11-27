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
import { soundscape } from './footsteps.mjs?v=ronda14';

import { RollingSign, ShowBoard, collide, tiltFromRest } from './stage-physics.mjs?v=ronda14';
import { invitation, layoutBoard, paintBoard } from './show-board.mjs?v=ronda14';
import { SceneClip } from './clip.mjs?v=ronda14';
import { touchesTray, settlePrize } from './prize-goal.mjs?v=cruce';
import { showPrize } from './prize.mjs?v=meta-visible';
import { roundPhase, secondsLeft } from './timing.mjs?v=ronda14';

const get = (id) => document.getElementById(id);
const stage = get('stage'),
  feed = get('feed'),
  surface = get('surface'),
  scene = get('scene');
const camera = get('camera'),
  demo = get('demo'),
  sound = get('sound'),
  stop = get('stop'),
  speaker = get('speaker'),
  tiltButton = get('tilt');
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
const pad = get('steer-pad'),
  target = get('prize-target'),
  gift = get('open-secret'),
  countdown = get('countdown'),
  restart = get('restart');
let goal, seating = null, pointer = null, baseline = null;

function positionPrize() {
  if (!layout || !stage.clientWidth) return;
  target.style.width = board.width + 'px';
  target.style.left = (view.left + view.width - view.right) / 2 + 'px';
  const rect = target.getBoundingClientRect(), space = stage.getBoundingClientRect();
  goal = {
    x: rect.left - space.left + rect.width / 2,
    width: rect.width,
    lipHeight: rect.height - 1,
    bottom: rect.bottom - space.top - 1,
  };
  view.bottom = view.height - goal.bottom;
  board.confine(view);
  if (seating) settlePrize(board, goal, seating, 0);
}
function checkLanding() {
  if (!goal || !touchesTray(board, goal)) return;
  seating = {
    offsetX: board.x - goal.x, offsetY: board.y - (goal.bottom - board.height / 2),
    angle: board.angle, progress: 0,
  };
  pad.hidden = true;
}
function updateRound(now) {
  const seconds = sceneStart === null ? null : secondsLeft(sceneStart, now);
  const state = seconds === null ? 'waiting' : roundPhase(seconds, Boolean(seating), clip.state);
  if (seconds !== null && countdown.textContent !== String(seconds)) countdown.textContent = String(seconds);
  if (state === stage.dataset.round) return;
  stage.dataset.round = state;
  const finished = state === 'won' || state === 'lost';
  const ready = finished && clip.state === 'ready';
  countdown.hidden = seconds === null || finished;
  clipTools.hidden = save.hidden = share.hidden = !ready;
  gift.hidden = state !== 'won';
  restart.hidden = state !== 'lost';
  if (state !== 'playing') pad.hidden = true;
  if (state === 'caught') status.textContent = 'El cartel llegó a la bandeja.';
  if (state === 'won') status.textContent = 'Tocá el regalo para abrirlo.';
  if (state === 'lost') status.textContent = 'Se terminó el tiempo. Tocá la flecha para volver a jugar.';
}

function updateClip(current) {
  clipError.hidden = current.state !== 'unavailable';
  if (current.state === 'ready') {
    save.href = current.url;
    save.download = current.file.name;
  } else {
    save.removeAttribute('href');
  }
  updateRound(performance.now());
}
share.addEventListener('click', async () => {
  if (sharing || clip.state !== 'ready') return;
  if (!clip.canShare()) {
    save.click();
    status.textContent = 'Guardá el video y compartilo desde tus archivos.';
    return;
  }
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
let sceneStart = null,
  lastLineAt = 0,
  lastMark = 0,
  lastStep = 0,
  side = 1;
const marks = [];
let attitude = null;
function applyTilt() {
  if (!attitude) return;
  // Mobile WebKit can expose a desktop screen angle even while the handset viewport is portrait.
  const degrees = Number.isFinite(window.orientation)
    ? window.orientation
    : (window.screen.orientation?.angle ?? 0);
  if (!baseline) {
    baseline = attitude;
    board.panX = board.panY = 0;
  }
  const gravity = tiltFromRest(baseline, attitude, degrees);
  board.gravity = gravity;
}
function measureTilt({ beta, gamma }) {
  if (!Number.isFinite(beta) || !Number.isFinite(gamma)) return;
  attitude = { beta, gamma };
  applyTilt();
  tiltButton.hidden = true;
}
function listenToTilt() {
  if (!window.DeviceOrientationEvent) return;
  window.addEventListener('deviceorientation', measureTilt);
  window.screen.orientation?.addEventListener?.('change', applyTilt);
  window.addEventListener('orientationchange', applyTilt);
  tiltButton.disabled = false;
  tiltButton.hidden = typeof window.DeviceOrientationEvent.requestPermission !== 'function';
}
tiltButton.addEventListener('click', async () => {
  const session = generation;
  tiltButton.disabled = true;
  try {
    const result = await window.DeviceOrientationEvent.requestPermission();
    if (session === generation && result !== 'granted')
      status.textContent = 'El cartel sigue el movimiento visible en la cámara.';
  } catch {
    if (session === generation)
      status.textContent = 'El cartel sigue el movimiento visible en la cámara.';
  } finally {
    if (session === generation) tiltButton.hidden = true;
  }
});

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
  const priorWidth = width, priorHeight = height;
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
  positionPrize();
  if (motion) {
    motion.resize(w, h);
    body.x *= w / priorWidth;
    body.y *= h / priorHeight;
    body.keepInPlay(view);
  }
  previous = null;
  marks.length = 0;
  textureTime = -1;
  nextRead = nextLines = 0;
}

function stopInput() {
  generation++;
  window.removeEventListener('deviceorientation', measureTilt);
  window.screen.orientation?.removeEventListener?.('change', applyTilt);
  window.removeEventListener('orientationchange', applyTilt);
  tiltButton.hidden = true;
  attitude = baseline = pointer = null;
  pad.hidden = true;
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  feed.pause();
  feed.srcObject = null;
}
function resetRound() {
  sceneStart = null;
  seating = motion = previous = body = pointer = null;
  nextRead = nextLines = 0;
  textureTime = -1;
  side = 1;
  hits.length = marks.length = 0;
  pad.hidden = caption.hidden = true;
  board = new ShowBoard();
  if (layout) board.fit(view, layout);
  applyTilt();
  clip.reset();
}
function release() {
  stopInput();
  cancelAnimationFrame(frame);
  mode = null;
  resetRound();
  feed.hidden = scene.hidden = tools.hidden = true;
  sample.width = sample.height = texture.width = texture.height = 0;
  ctx?.clearRect(0, 0, width, height);
  audio.close();
}
function end(message, complete = false) {
  release();
  finish.hidden = !complete;
  phase('idle', message);
}
function startRound(now) {
  sceneStart = lastMark = lastStep = now;
  audio.start(now);
  get('cue-meta').textContent = 'Show de arte generativo · ' + invitation.city;
  get('cue-title').textContent = invitation.text;
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
      if (mode === 'camera' && stage.dataset.round === 'playing') board.carry(change);
      motion?.carry(change);
      carryMarks(marks, change, width, height);
    }
  }
  previous = current;
  lastRead = now;
  if (now < nextLines) return;
  nextLines = now + 135;
  const ground = readFloor(visibleLines(current), width, height);
  if (!ground) {
    if (motion) motion.pending = null;
    return;
  }
  if (!motion) {
    motion = new SignMotion(ground, width, height, gentle.matches);
    body = new RollingSign(motion);
    lastLineAt = now;
    phase(
      'ground',
      mode === 'demo' ? 'Escena de muestra, sin cámara.' : 'El Ø sigue el movimiento de tu encuadre.'
    );
  } else if (motion.observe(ground, now)) {
    lastLineAt = now;
    if (stage.dataset.phase === 'search') phase('ground', 'El Ø sigue el movimiento de tu encuadre.');
  }
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
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
  if (sceneStart === null) return;
  updateRound(now);
  const withinTime = secondsLeft(sceneStart, now) > 0;
  if (motion && lost > 900 && stage.dataset.phase === 'ground') phase('search', hint);
  let turned = false;
  while (dt > 0) {
    const step = Math.min(dt, 1 / 90);
    if (motion) {
      const playing = withinTime && !seating;
      if (playing) board.advance(view, step, gentle.matches);
      if (lost < 500 && motion.advance(step)) turned = true;
      body.advance(motion, step, playing ? board : null);
      body.keepInPlay(view);
      const hit = playing ? collide(body, board, now) : null;
      body.keepInPlay(view);
      if (playing) {
        board.confine(view);
        checkLanding();
      }
      if (hit) {
        hits.push(hit);
        motion.rebound(hit);
        turned = true;
      }
    }
    if (seating && seating.progress < 1) settlePrize(board, goal, seating, step);
    dt -= step;
  }
  const beat = motion ? audio.pulse() : 0;
  if (motion) {
    if (lost < 900 && (turned || now - lastStep > 460 + 100 * motion.depth)) {
      lastStep = now;
      side *= -1;
      addMark(marks, body, now, true, side);
      if (board.allowsFootstep(now) && body.lift < body.radius * 0.18)
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
    ctx.globalAlpha = lost < 900 ? 1 : 0.65;
    drawField(ctx, body, now, beat);
    ctx.restore();
  }
  if (mode === 'demo' && withinTime && !seating) {
    pad.hidden = false;
    pad.style.width = board.width + 'px';
    pad.style.height = board.height + 'px';
    pad.style.transform = 'translate(' + (board.x - board.width / 2) + 'px,' +
      (board.y - board.height / 2) + 'px) rotate(' + board.angle + 'rad)';
  }
  paintBoard(ctx, board, layout, art, now);
  // Keep the solid defender visible in front when the plate meets it.
  if (body) drawSign(ctx, body, beat, now, elapsed);
  if (clip.state === 'idle') clip.begin(surface, audio, sceneStart);
  else if (clip.state === 'preparing') clip.paint(surface, now);
}
function openSecret() {
  if (gift.hidden || (mode !== 'camera' && mode !== 'demo')) return;
  cancelAnimationFrame(frame);
  const id = crypto.randomUUID();
  history.pushState(null, '', './premio.html#' + id);
  mode = 'prize';
  stopInput();
  get('game').hidden = true;
  showPrize(id, clipTools);
  get('prize').querySelector('.prize-extras').append(sound);
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
      nextRead = now + 40;
      if (isDemo) drawDemo(ink, width, height, sceneStart ? (now - sceneStart) / 1000 : 0, 1);
      try {
        analyze(source, crop, now);
      } catch {
        end('No se pudo leer la imagen. Podés reintentar o elegir Ver sin cámara.');
        return;
      }
    }
    now = performance.now();
    if (motion && sceneStart === null) startRound(now);
    render(source, crop, now, dt);
  }
  frame = requestAnimationFrame(animate);
}
function startFrames() {
  frameAt = performance.now();
  tools.hidden = false;
  listenToTilt();
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
  end('Experiencia cerrada. Podés volver a empezar.', sceneStart !== null);
}
gift.addEventListener('click', openSecret);
restart.addEventListener('click', () => {
  if (stage.dataset.round !== 'lost') return;
  resetRound();
  frameAt = performance.now();
  audio.unlock();
  phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : hint);
});
pad.addEventListener('pointerdown', (event) => {
  if (mode !== 'demo' || pointer || event.button !== 0) return;
  pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  pad.setPointerCapture(event.pointerId);
  audio.unlock();
});
pad.addEventListener('pointermove', (event) => {
  if (pointer?.id !== event.pointerId) return;
  board.steer((event.clientX - pointer.x) / (width * 1.25),
    (event.clientY - pointer.y) / (height * 1.95));
  pointer.x = event.clientX;
  pointer.y = event.clientY;
});
pad.addEventListener('lostpointercapture', () => { pointer = null; });
pad.addEventListener('keydown', (event) => {
  const dx = Math.min(18, width * 0.04) / (width * 1.25);
  const dy = 0.055;
  const delta = { ArrowLeft: [-dx, 0], ArrowRight: [dx, 0], ArrowUp: [0, -dy], ArrowDown: [0, dy] }[event.key];
  if (!delta || mode !== 'demo' || stage.dataset.round !== 'playing') return;
  event.preventDefault();
  board.steer(...delta);
});
addEventListener('popstate', () => {
  if (get('prize')) location.reload();
});
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
if (typeof ResizeObserver === 'function') {
  new ResizeObserver(resize).observe(stage);
} else addEventListener('resize', resize);
document.fonts
  ?.load('800 20px Uberlin')
  .then(() => {
    if (ctx && layout) {
      layout = layoutBoard(ctx, view);
      board.fit(view, layout);
      positionPrize();
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
