import { clipLength } from './timing.mjs?v=respuesta';
import { webmFile, opusHead } from './webm.mjs?v=toma14';
import { movieFile } from './quicktime.mjs?v=toma14';

const fps = 30, rate = 48000;


// Bind each of the 420 presentation times to a picture from the actual round.
export function pictureSequence(pictures, duration = clipLength) {
  const totalFrames = Math.round(duration * fps / 1000);
  if (pictures[0]?.at !== 0 || pictures.at(-1).at < duration - 100 ||
      pictures.some((p, i) => i && p.at - pictures[i - 1].at > 650))
    throw Error('La toma quedó incompleta');
  let index = 0;
  return Array.from({ length: totalFrames }, (_, i) => {
    if (i === totalFrames - 1) return pictures.at(-1).blob;
    const ms = i * 1000 / fps;
    while (index + 1 < pictures.length && pictures[index + 1].at <= ms) index++;
    return pictures[index].blob;
  });
}
function copyChunk(chunk) {
  const data = new Uint8Array(chunk.byteLength);
  chunk.copyTo(data);
  return data;
}
function configBytes(buffer) {
  return ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength).slice()
    : new Uint8Array(buffer).slice();
}
async function encodeVideo(sequence, config, capture) {
  const samples = [];
  let description, error, bitmap, prior;
  const encoder = new VideoEncoder({
    output(chunk, meta) {
      const desc = meta?.decoderConfig?.description;
      if (desc) description = configBytes(desc);
      samples.push({ data: copyChunk(chunk), time: Math.round(chunk.timestamp / 1000), key: chunk.type === 'key' });
    },
    error(reason) { error = reason; },
  });
  try {
    encoder.configure(config);
    for (let i = 0; i < sequence.length; i++) {
      if (error || capture.cancelled) throw error || Error('Toma cerrada');
      if (sequence[i] !== prior) {
        bitmap?.close();
        bitmap = await createImageBitmap(sequence[i]);
        prior = sequence[i];
      }
      const timestamp = Math.round(i * 1e6 / fps);
      const frame = new VideoFrame(bitmap, { timestamp, duration: Math.round((i + 1) * 1e6 / fps) - timestamp });
      try { encoder.encode(frame, { keyFrame: i % fps === 0 }); }
      finally { frame.close(); }
      if (encoder.encodeQueueSize >= 12) await encoder.flush();
    }
    await encoder.flush();
    // Baseline AVC has no reordered pictures. Reject truncated or dropped frames.
    if (error || samples.length !== sequence.length || samples.some((s, i) => Math.abs(s.time - i * 1000 / fps) > 1))
      throw error || Error('Secuencia de video incompleta');
    return { samples, description };
  } finally {
    bitmap?.close();
    if (encoder.state !== 'closed') encoder.close();
  }
}
async function encodeAudio(pcm, codec) {
  const config = { codec, sampleRate: rate, numberOfChannels: 1, bitrate: 96000 };
  if (!window.AudioEncoder || !window.AudioData || !(await AudioEncoder.isConfigSupported(config)).supported) return null;
  const samples = [];
  let description, error;
  const encoder = new AudioEncoder({
    output(chunk, meta) {
      if (meta?.decoderConfig?.description) description = configBytes(meta.decoderConfig.description);
      samples.push({ sample: Math.round(chunk.timestamp * rate / 1e6), data: copyChunk(chunk) });
    },
    error(reason) { error = reason; },
  });
  try {
    encoder.configure(config);
    const block = codec === 'opus' ? 960 : 1024;
    for (let i = 0; i < pcm.length; i += block) {
      const part = pcm.subarray(i, i + block);
      const frame = new AudioData({ format: 's16', sampleRate: rate, numberOfChannels: 1,
        numberOfFrames: part.length, timestamp: Math.round(i * 1e6 / rate), data: part });
      try { encoder.encode(frame); } finally { frame.close(); }
    }
    await encoder.flush();
    if (error) throw error;
    const valid = samples.filter(s => s.sample >= 0 && s.sample < pcm.length);
    if (!valid.length || valid[0].sample > block || valid.at(-1).sample + block < pcm.length - 1)
      return null;
    valid[0].sample = 0;
    return { config: description, samples: valid };
  } finally { if (encoder.state !== 'closed') encoder.close(); }
}
async function exportTake(capture, sound) {
  const duration = capture.duration;
  const sequence = pictureSequence(capture.pictures, duration);
  const { width, height } = capture.canvas;
  const pcm = await sound.renderClip(rate, duration);
  if (pcm.length !== rate * duration / 1000) throw Error('Pista incompleta');
  if (window.VideoEncoder && window.VideoFrame && window.createImageBitmap) {
    for (const codec of ['avc1.42001f', 'vp8']) {
      if (capture.cancelled) throw Error('Toma cerrada');
      const avc = codec !== 'vp8';
      const config = { codec, width, height, bitrate: 2200000, framerate: fps, latencyMode: 'quality',
        ...(avc ? { avc: { format: 'avc' } } : {}) };
      try {
        if (!(await VideoEncoder.isConfigSupported(config)).supported) continue;
        const audio = await encodeAudio(pcm, avc ? 'mp4a.40.2' : 'opus').catch(() => null);
        if (!avc && !audio) continue;
        const video = await encodeVideo(sequence, config, capture);
        if (avc && video.description) return movieFile(video.samples, width, height, duration, fps,
          video.description, audio?.config ? audio : { pcm }, rate);
        if (!avc) return webmFile([
          ...video.samples.map(s => ({ ...s, track: 1 })),
          ...audio.samples.map(s => ({ data: s.data, time: Math.round(s.sample * 1000 / rate), key: true, track: 2 })),
        ], width, height, duration, audio.config?.length >= 19 ? audio.config : opusHead());
      } catch {
        // The original pictures are still available if the device rejects a codec.
      }
    }
  }
  if (capture.cancelled) throw Error('Toma cerrada');
  const file = movieFile(sequence.map(data => ({ data })), width, height, duration, fps, null, { pcm }, rate);
  let offset = file.size - pcm.byteLength - sequence.reduce((bytes, image) => bytes + image.size, 0);
  capture.photoOffsets = [offset];
  for (const image of sequence) capture.photoOffsets.push(offset += image.size);
  return file;
}

export class SceneClip {
  constructor(onChange, persist) {
    this.onChange = onChange;
    this.persist = persist;
    this.state = 'idle';
  }
  setState(state) { this.state = state; this.onChange(this); }
  reset() {
    if (this.capture) this.capture.cancelled = true;
    this.capture = null;
    if (this.url) URL.revokeObjectURL(this.url);
    this.file = this.url = this.photoOffsets = null;
    this.setState('idle');
  }
  restore(file, photoOffsets = null) {
    this.file = file;
    this.photoOffsets = photoOffsets;
    this.url = URL.createObjectURL(file);
    this.setState('ready');
  }
  begin(source, audio, start) {
    const canvas = document.createElement('canvas'), scale = Math.min(1, 720 / Math.max(source.width, source.height));
    canvas.width = Math.max(2, Math.round(source.width * scale / 2) * 2);
    canvas.height = Math.max(2, Math.round(source.height * scale / 2) * 2);
    this.capture = { canvas, ink: canvas.getContext('2d', { alpha: false }), start, audio,
      duration: Infinity, pictures: [], last: -Infinity, pending: null, cancelled: false };
    this.setState('preparing');
    this.paint(source, start);
  }
  setDuration(duration) {
    if (this.capture) this.capture.duration = duration;
  }
  // Slow JPEG conversion may delay the round, but never consume unfilmed seconds.
  limitAdvance(elapsed) {
    const c = this.capture;
    return this.state === 'preparing' && c?.pending ? Math.min(elapsed, c.last + 200) : elapsed;
  }
  paint(source, now) {
    const c = this.capture;
    if (!c || c.pending || this.state !== 'preparing') return;
    const at = Math.min(c.duration, Math.max(0, now - c.start));
    const final = at === c.duration;
    if (!final && at - c.last < 50) return;
    c.last = at;
    const w = c.canvas.width, h = c.canvas.height, scale = Math.min(w / source.width, h / source.height);
    const dw = source.width * scale, dh = source.height * scale;
    c.ink.fillStyle = '#101018';
    c.ink.fillRect(0, 0, w, h);
    c.ink.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
    c.pending = new Promise(resolve => c.canvas.toBlob(resolve, 'image/jpeg', 0.83))
      .then(blob => {
        if (c.cancelled) return;
        if (!blob || blob.type !== 'image/jpeg') throw Error('Fotograma no disponible');
        c.pictures.push({ at, blob });
        if (final) return this.finish(c);
      })
      .catch(() => { if (this.capture === c) { this.capture = null; this.setState('unavailable'); } })
      .finally(() => { c.pending = null; });
  }
  async finish(c) {
    this.setState('encoding');
    const file = await exportTake(c, c.audio);
    if (this.capture !== c) return;
    await this.persist(file, c.photoOffsets);
    if (this.capture !== c) return;
    this.capture = null;
    this.restore(file, c.photoOffsets);
  }
  canShare() {
    try { return Boolean(this.file && navigator.canShare?.({ files: [this.file] })); }
    catch { return false; }
  }
}
