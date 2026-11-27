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
import { drawSign } from './solid-sign.mjs?v=toma14';
import { soundscape } from './footsteps.mjs?v=sonido';

import { RollingSign, ShowBoard, collide, constrainContact, tiltFromRest } from './stage-physics.mjs?v=festejo';
import { invitation, layoutBoard, paintBoard } from './show-board.mjs?v=ronda14';
import { photoReview } from './photo-review.mjs?v=toma14';
import { SceneClip } from './clip.mjs?v=toma14';
import { touchesTray, settlePrize } from './prize-goal.mjs?v=cruce';
import { showPrize } from './prize.mjs?v=toma14';
import { readTake, rememberTake, savedId, markReturn, returningFromApp } from './saved-take.mjs?v=toma14';
import { clipLength, roundPhase, secondsLeft } from './timing.mjs?v=festejo';

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
  enableSound = get('enable-sound');
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
function newClip() {
  return new SceneClip(updateClip, (file, offsets) => rememberTake(file, won, sourceMode, offsets));
}
let clip = newClip(), retryPending = false;
const clipTools = get('clip-tools'),
  save = get('save'),
  share = get('share'),
  clipError = get('clip-error'),
  player = get('recording'),
  watch = get('watch');
const photos = photoReview(player, get('replay-picture'));
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
let sourceMode = null, won = false, suspended = false, elapsedMs = 0, lastPictureAt = null;
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
  won = true;
  seating = {
    landedAt: elapsedMs, offsetX: board.x - goal.x, offsetY: board.y - (goal.bottom - board.height / 2),
    angle: board.angle, progress: 0,
  };
  pad.hidden = true;
}
function updateRound() {
  const seconds = sceneStart === null ? null : secondsLeft(0, elapsedMs);
  const state = seconds === null ? 'waiting' : roundPhase(seconds, won);
  const finished = state === 'won' || state === 'lost';
  const ready = finished && clip.state === 'ready';
  clipTools.hidden = save.hidden = share.hidden = !ready;
  watch.hidden = !ready || mode === 'review' || mode === 'prize';
  if (seconds !== null && countdown.textContent !== String(seconds)) countdown.textContent = String(seconds);
  if (state === stage.dataset.round) return;
  stage.dataset.round = state;
  countdown.hidden = seconds === null || finished;
  gift.hidden = state !== 'won';
  restart.hidden = state !== 'lost';
  if (state !== 'playing') pad.hidden = true;
  if (state === 'won') status.textContent = 'Tocá el regalo para abrirlo.';
  if (state === 'lost') status.textContent = 'Se terminó el tiempo. Tocá la flecha para volver a jugar.';
}

function updateClip(current) {
  if (retryPending && ['encoding', 'unavailable'].includes(current.state)) queueMicrotask(retry);
  if (mode === 'prize' && ['encoding','ready','unavailable'].includes(current.state)) cancelAnimationFrame(frame);
  get('previous-take').hidden = !savedId() || current.state === 'ready';
  clipError.hidden = current.state !== 'unavailable';
  if (current.state === 'ready') {
    save.href = current.url;
    save.download = current.file.name;
  } else {
    save.removeAttribute('href');
  }
  updateRound();
  if (current.state === 'ready' && suspended && !document.hidden) showRecording();
}
save.addEventListener('click', () => { if (mode !== 'prize') showRecording(); });
watch.addEventListener('click', () => {
  showRecording();
  player.play().catch(() => {});
});
share.addEventListener('click', async () => {
  if (sharing || clip.state !== 'ready') return;
  if (mode !== 'prize') showRecording();
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
// Start the game clock only after the live view has had a moment of its own.
const cameraIntroMs = 500;
let firstCameraFrameAt = null;
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
}
function listenToTilt() {
  if (!window.DeviceOrientationEvent) return;
  window.addEventListener('deviceorientation', measureTilt);
  window.screen.orientation?.addEventListener?.('change', applyTilt);
  window.addEventListener('orientationchange', applyTilt);
}

function updateSound() {
  const audible = audio.audible();
  const label = audio.failed()
    ? 'Reintentar música'
    : audible
      ? 'Silenciar música y pasos'
      : 'Activar música y pasos';
  sound.hidden = speaker.hidden = !mode || mode === 'review' || !audio.supported;
  enableSound.hidden = mode !== 'camera' || !stream || suspended || !audio.needsGesture();
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
  attitude = baseline = pointer = null;
  pad.hidden = true;
  if (stream) stream.getTracks().forEach((track) => track.stop());
  stream = null;
  feed.pause();
  feed.srcObject = null;
}
function resetRound() {
  retryPending = false;
  sceneStart = lastPictureAt = null;
  elapsedMs = 0;
  won = false;
  player.pause();
  photos.clear();
  player.removeAttribute('src');
  player.load();
  player.hidden = watch.hidden = true;
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
  suspended = false;
  mode = sourceMode = null;
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
  if (sceneStart === null) return;
  const elapsed = now - sceneStart,
    lost = performance.now() - lastLineAt;
  ctx.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
  updateRound();
  const withinTime = elapsedMs < clipLength;
  if (motion && lost > 900 && stage.dataset.phase === 'ground') phase('search', hint);
  let turned = false;
  while (dt > 0) {
    const step = Math.min(dt, 1 / 90);
    if (motion) {
      const playing = withinTime && !seating;
      if (playing) board.advance(view, step, gentle.matches);
      else if (seating && seating.progress < 1) settlePrize(board, goal, seating, step);
      if ((lost < 500 || mode === 'prize') && motion.advance(step)) turned = true;
      body.advance(motion, step, playing ? board : null);
      body.keepInPlay(view);
      const hit = collide(body, board, now, !playing);
      body.keepInPlay(view);
      if (playing) board.confine(view);
      constrainContact(body, board, view, !playing);
      if (playing) checkLanding();
      if (hit) {
        hits.push(hit);
        motion.rebound(hit);
        turned = true;
      }
    }
    dt -= step;
  }
  const beat = motion ? audio.pulse() : 0;
  if (motion) {
    if (lost < 900 && (turned || now - lastStep > 460 + 100 * motion.depth)) {
      lastStep = now;
      side *= -1;
      addMark(marks, body, now, true, side);
      if (board.allowsFootstep(now) && body.lift < body.radius * 0.18)
        audio.step(body.x / width, body.y / height, turned, side, elapsed);
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
  if (body) drawSign(ctx, body, beat, now, elapsed);
  if (seating) drawCelebration((elapsedMs - seating.landedAt) / 1000);
  if (clip.state === 'idle') clip.begin(surface, audio, sceneStart);
  else if (clip.state === 'preparing') clip.paint(surface, now);
}
function drawCelebration(t) {
  if (t < 0 || t > 2.6) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (2.6 - t) * 1.5);
  const size = Math.min(width, height);
  for (let i = 0; i < (gentle.matches ? 14 : 64); i++) {
    const age = t - (i % 3) * 0.12;
    if (age < 0) continue;
    const angle = (i * 2.4) % Math.PI;
    const speed = size * (0.48 + (i % 7) * 0.12) * (gentle.matches ? 0.45 : 1);
    ctx.save();
    ctx.translate(goal.x + Math.cos(angle) * speed * age,
      goal.bottom - Math.sin(angle) * speed * age + size * 0.33 * age * age);
    ctx.rotate(angle + age * (2 + i % 5));
    ctx.fillStyle = ['#ffce68','#80ffee','#ff86c9','#eef8ff'][i % 4];
    ctx.fillRect(-3, -1.5, 6 + i % 7, 3);
    ctx.restore();
  }
  ctx.restore();
}
function openSecret(id, pushEntry = true) {
  if (gift.hidden || mode === 'prize') return;
  player.pause();
  cancelAnimationFrame(frame);
  if (pushEntry) history.pushState(null, '', './premio.html#' + id);
  if (clip.state === 'preparing') {
    const source = mode === 'camera' ? feed : scene;
    if (mode === 'camera' && feed.videoWidth) {
      const crop = visibleCrop(feed.videoWidth, feed.videoHeight, width, height);
      ink.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
    }
  }
  enableSound.hidden = true;
  mode = 'prize';
  stopInput();
  if (clip.state === 'preparing') frame = requestAnimationFrame(animate);
  get('game').hidden = true;
  showPrize(id, clipTools);
  get('prize').querySelector('.prize-extras').append(sound);
  get('prize').querySelector('[data-return]')?.addEventListener('click', event => {
    event.preventDefault();
    history.back();
  });
}
function animate(now) {
  if (mode === 'prize' && !suspended && clip.state === 'preparing') {
    const delta = lastPictureAt === null ? 0 : Math.min(200, Math.max(0, now - lastPictureAt));
    elapsedMs = clip.limitAdvance(elapsedMs + delta);
    lastPictureAt = now;
    render(scene, visibleCrop(scene.width, scene.height, width, height), sceneStart + elapsedMs, Math.min(delta / 1000, 0.05));
    frame = requestAnimationFrame(animate);
    return;
  }
  if (suspended || (mode !== 'camera' && mode !== 'demo')) return;
  const dt = Math.min(0.05, Math.max(0, (now - frameAt) / 1000));
  frameAt = now;
  const isDemo = mode === 'demo',
    source = isDemo ? scene : feed;
  const sw = isDemo ? scene.width : feed.videoWidth,
    sh = isDemo ? scene.height : feed.videoHeight;
  const hasFrame = sw > 0 && sh > 0 && (isDemo || feed.readyState >= 2);
  if (hasFrame && !isDemo && firstCameraFrameAt === null) firstCameraFrameAt = now;
  if (hasFrame && (isDemo || now - firstCameraFrameAt >= cameraIntroMs)) {
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
    if (sceneStart !== null) {
      const delta = lastPictureAt === null ? 0 : Math.max(0, Math.min(200, now - lastPictureAt));
      elapsedMs = clip.limitAdvance(elapsedMs + delta);
      lastPictureAt = now;
      render(source, crop, sceneStart + elapsedMs, dt);
    }
  } else lastPictureAt = null;
  frame = requestAnimationFrame(animate);
}
function startFrames() {
  firstCameraFrameAt = null;
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
  mode = sourceMode = selected;
  await startInput(selected);
}
async function startInput(selected) {
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
    audio.enableLive();
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
    audio.enableLive();
    for (const track of stream.getVideoTracks())
      track.addEventListener(
        'ended',
        () => {
          if (current !== generation) return;
          if (clip.state === 'ready') showRecording();
          else if (document.hidden || clip.state === 'encoding') suspend();
          else end('La cámara se cerró. Podés volver a empezar.');
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
function rememberReviewPage() {
  const id = savedId();
  if (location.hash !== '#mi-video' || history.state?.primeraTake !== id)
    history.replaceState({ ...history.state, primeraTake: id }, '', '#mi-video');
}
function showRecording() {
  if (clip.state !== 'ready' || mode === 'prize') return;
  cancelAnimationFrame(frame);
  stopInput();
  audio.pause();
  suspended = false;
  mode = 'review';
  feed.hidden = scene.hidden = pad.hidden = watch.hidden = true;
  const replayUrl = photos.source(clip);
  player.hidden = false;
  if (player.getAttribute('src') !== replayUrl) {
    player.src = replayUrl;
    player.load();
  } else if (!player.readyState) {
    // A mobile share sheet can suspend the initial metadata request.
    player.load();
  }
  phase('review', 'Tu video está listo para volver a verlo, guardarlo o compartirlo.');
  stop.hidden = sound.hidden = true;
  rememberReviewPage();
}
function dismiss() {
  if (clip.state === 'ready') { showRecording(); return; }
  end('Experiencia cerrada. Podés volver a empezar.', sceneStart !== null);
}
gift.addEventListener('click', () => openSecret(crypto.randomUUID()));
function retry() {
  if (stage.dataset.round !== 'lost') return;
  if (clip.state === 'preparing') { retryPending = true; return; }
  retryPending = false;
  if (clip.state === 'encoding') {
    const finishing = clip, source = sourceMode;
    finishing.persist = (file, offsets) => rememberTake(file, false, source, offsets);
    finishing.onChange = current => {
      if (current.state === 'ready') {
        URL.revokeObjectURL(current.url);
        get('previous-take').hidden = clip.state === 'ready';
      }
    };
    clip = newClip();
  }
  if (mode === 'review') { enter(sourceMode || 'camera'); return; }
  resetRound();
  frameAt = performance.now();
  audio.unlock();
  phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : hint);
}
restart.addEventListener('click', retry);
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
  if (get('prize') && !location.pathname.endsWith('/premio.html')) {
    get('game-dock').prepend(clipTools);
    stop.before(sound);
    get('prize').remove();
    get('game').hidden = false;
    document.title = 'Un Ø aparece · Primera voluntad';
    if (clip.state === 'ready') {
      mode = 'review';
      showRecording();
    } else {
      cancelAnimationFrame(frame);
      mode = sourceMode;
      lastPictureAt = null;
      startInput(mode);
    }
  } else if (location.pathname.endsWith('/premio.html') && mode !== 'prize') {
    // Forward navigation reuses the prize document and its existing round ID.
    openSecret(location.hash.slice(1), false);
  }
});
get('previous-take').addEventListener('click', async () => {
  const session = generation;
  const take = await readTake();
  if (!take || session !== generation) return;
  release();
  restoreTake(take);
});
function restoreTake(take) {
  sourceMode = take.source;
  won = take.won;
  sceneStart = 0;
  elapsedMs = clipLength;
  mode = 'review';
  clip.restore(take.file, take.photoOffsets);
  showRecording();
}
camera.addEventListener('click', () => enter('camera'));
demo.addEventListener('click', () => enter('demo'));
stop.addEventListener('click', dismiss);
get('dismiss').addEventListener('click', dismiss);
enableSound.addEventListener('click', audio.unlock);
sound.addEventListener('click', audio.toggle);
speaker.addEventListener('click', audio.toggle);
stage.addEventListener('click', (event) => {
  if ((mode === 'demo' || (mode === 'camera' && stream)) && !event.target.closest('button,a')) audio.unlock();
});
let leavingDocument = false;
addEventListener('pagehide', () => { leavingDocument = true; suspend(); });
addEventListener('pageshow', () => { leavingDocument = false; visibility(); });
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
function suspend() {
  if (!leavingDocument && clip.state === 'ready') {
    markReturn(true);
    if (mode !== 'prize') rememberReviewPage();
  }
  if (!mode || suspended) return;
  suspended = true;
  cancelAnimationFrame(frame);
  lastPictureAt = previous = null;
  player.pause();
  audio.pause();
  stopInput();
}
async function visibility() {
  if (document.hidden) { suspend(); return; }
  if (!opened) {
    opened = true;
    const session = generation;
    const navigation = performance.getEntriesByType('navigation')[0];
    const reload = navigation?.type === 'reload' && !document.wasDiscarded && !returningFromApp();
    const demoEntry = location.hash === '#sin-camara';
    const existing = !reload && !demoEntry ? await readTake(location.hash === '#mi-video') : null;
    if (session !== generation) return;
    get('previous-take').hidden = !savedId();
    markReturn(false);
    if (existing) {
      restoreTake(existing);
      return;
    }
    if (document.hidden) { opened = false; return; }
    enter(demoEntry ? 'demo' : 'camera');
  } else if (suspended) {
    markReturn(false);
    if (mode === 'prize') { suspended = false; if (clip.state === 'preparing') frame = requestAnimationFrame(animate); return; }
    if (clip.state === 'ready') { showRecording(); return; }
    if (clip.state === 'encoding') return;
    suspended = false;
    if (mode === 'camera' || mode === 'demo') startInput(mode);
  }
}
document.addEventListener('visibilitychange', visibility);
visibility();
