import { longestLine } from './line-detector.mjs';
import { SignMotion } from './motion.mjs';
import { visibleCrop, drawSign, drawWake, addMark, drawDemo } from './scene.mjs';
import { footsteps } from './footsteps.mjs';

const get = id => document.getElementById(id);
const stage = get('stage'), feed = get('feed'), surface = get('surface'), scene = get('scene');
const camera = get('camera'), demo = get('demo'), sound = get('sound'), stop = get('stop');
const status = get('status'), finish = get('finish');
const ctx = surface.getContext('2d'), ink = scene.getContext('2d');
const sample = document.createElement('canvas');
const sampler = sample.getContext('2d', { willReadFrequently: true });
const refraction = document.createElement('canvas');
const refractionInk = refraction.getContext('2d');
const gentle = matchMedia('(prefers-reduced-motion: reduce)');
const audio = footsteps(updateSound);
const searchHint = 'Buscando un borde. Probá con el canto de una mesa o una puerta bien iluminada.';

let generation = 0, mode = null, stream = null, motion = null, frame = 0;
let width = 1, height = 1, previousTime = 0, nextSample = 0, videoTime = -1;
let textureTime = -1, flightStarted = 0;
let sceneStart = 0, lean = 1, lastMark = 0, lastStep = 0, side = -1;
const marks = [];

function updateSound() {
  sound.hidden = !mode || !audio.supported;
  sound.textContent = audio.audible() ? 'Silenciar pasos' : 'Activar sonido';
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
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h || (w === width && h === height)) return;
  const reframe = Math.abs((w / h) / (width / height) - 1) > .3;
  width = w;
  height = h;
  const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(1800000 / (w * h)));
  surface.width = Math.round(w * ratio);
  surface.height = Math.round(h * ratio);
  ctx?.setTransform(surface.width / w, 0, 0, surface.height / h, 0, 0);
  scene.width = w;
  scene.height = h;
  if (motion?.phase === 'roll' && reframe) {
    motion = null;
    phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : searchHint);
  } else {
    motion?.resize(w, h);
  }
  marks.length = 0;
  textureTime = -1;
  nextSample = 0;
}

function release() {
  generation++;
  cancelAnimationFrame(frame);
  mode = motion = null;
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  feed.pause();
  feed.srcObject = null;
  feed.hidden = scene.hidden = true;
  sample.width = sample.height = refraction.width = refraction.height = 0;
  ctx?.clearRect(0, 0, width, height);
  marks.length = 0;
  audio.close();
}

function end(message, complete = false) {
  release();
  finish.hidden = !complete;
  phase(complete ? 'done' : 'idle', message);
}

function readLine(source, crop) {
  const scale = 192 / Math.max(width, height);
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  if (sample.width !== w || sample.height !== h) {
    sample.width = w;
    sample.height = h;
  }
  sampler.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  return longestLine(sampler.getImageData(0, 0, w, h));
}

// Decode the visible frame once for all the lenses, rather than pulling video
// pixels separately for every strip left behind by the moving sign.
function refreshTexture(source, crop, stamp) {
  if (stamp === textureTime && refraction.width) return;
  const scale = Math.min(1, 768 / Math.max(width, height));
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  if (refraction.width !== w || refraction.height !== h) {
    refraction.width = w;
    refraction.height = h;
  }
  refractionInk.drawImage(source, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  textureTime = stamp;
}

function animate(now) {
  let dt = Math.min(.25, Math.max(0, (now - previousTime) / 1000));
  previousTime = now;
  const isDemo = mode === 'demo';
  const source = isDemo ? scene : feed;
  const sw = isDemo ? scene.width : feed.videoWidth, sh = isDemo ? scene.height : feed.videoHeight;
  if (sw && sh && (isDemo || feed.readyState >= 2)) {
    const crop = visibleCrop(sw, sh, width, height);
    if (now >= nextSample && (isDemo || videoTime !== feed.currentTime)) {
      nextSample = now + 95;
      videoTime = feed.currentTime;
      if (isDemo) drawDemo(ink, width, height, (now - sceneStart) / 1000, lean);
      let line;
      try { line = readLine(source, crop); }
      catch {
        end('No se pudo leer la imagen. Podés volver a intentar o elegir Ver sin cámara.');
        return;
      }
      if (line && !motion) {
        motion = new SignMotion(line, width, height, gentle.matches);
        dt = 0;
        phase('roll', isDemo ? 'El Ø rueda en la escena de muestra.' : 'El Ø rueda con tu encuadre.');
      } else if (line) {
        motion.observe(line);
      }
    }
    if (motion) {
      let hit = false;
      while (dt > 0) {
        const slice = Math.min(dt, 1 / 45);
        if (motion.advance(slice)) hit = true;
        dt -= slice;
      }
      if (motion.phase === 'flight') {
        if (stage.dataset.phase !== 'flight') {
          phase('flight', 'El Ø rebota.');
          flightStarted = now;
        } else if (now - flightStarted >= 4200) {
          end('La experiencia terminó.', true);
          return;
        }
      }
      if (motion.phase === 'flight' && ((hit && now - lastStep >= 115) || now - lastStep > 330)) {
        lastStep = now;
        side *= -1;
        addMark(marks, motion, now, true, side);
        audio.step(motion.x / width, motion.y / height, hit, side);
      }
      if (now - lastMark >= (gentle.matches ? 165 : 90)) {
        lastMark = now;
        addMark(marks, motion, now, false, side);
      }
      ctx.clearRect(0, 0, width, height);
      refreshTexture(source, crop, isDemo ? nextSample : feed.currentTime);
      drawWake(ctx, refraction, {x:0, y:0, w:refraction.width, h:refraction.height}, width, height, marks, now, gentle.matches);
      drawSign(ctx, motion);
    }
  }
  frame = requestAnimationFrame(animate);
}

function startFrames() {
  previousTime = sceneStart = performance.now();
  videoTime = textureTime = -1;
  nextSample = lastStep = lastMark = 0;
  side = -1;
  phase('search', mode === 'demo' ? 'Escena de muestra, sin cámara.' : searchHint);
  frame = requestAnimationFrame(animate);
}

async function enter(selected) {
  release();
  finish.hidden = true;
  if (!ctx || !ink || !sampler || !refractionInk) {
    end('Este navegador no puede dibujar la experiencia.');
    return;
  }
  mode = selected;
  const current = generation;
  phase('permission', selected === 'camera' ? 'Esperando permiso para usar la cámara…' : 'Escena de muestra, sin cámara.');
  resize();
  window.scrollTo(0, 0);
  if (selected === 'demo') {
    lean = Math.random() < .5 ? -1 : 1;
    scene.hidden = false;
    audio.unlock();
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
      acquired.getTracks().forEach(track => track.stop());
      return;
    }
    stream = acquired;
    for (const track of stream.getVideoTracks()) {
      track.addEventListener('ended', () => {
        if (current === generation) end('La cámara se cerró. Podés volver a empezar.');
      }, { once: true });
    }
    feed.muted = true;
    feed.srcObject = acquired;
    feed.hidden = false;
    await feed.play();
    if (current === generation) startFrames();
  } catch {
    if (current === generation) end('No se pudo abrir la cámara. Podés reintentar o elegir Ver sin cámara.');
  }
}

camera.addEventListener('click', () => enter('camera'));
demo.addEventListener('click', () => enter('demo'));
stop.addEventListener('click', () => end('Experiencia cerrada. Podés volver a empezar.'));
sound.addEventListener('click', audio.toggle);
// A tap unlocks output on browsers that require a gesture. It never places the Ø.
stage.addEventListener('click', () => { if (mode) audio.unlock(); });
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
