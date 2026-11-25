import { clipName } from './timing.mjs';

// QuickTime Photo-JPEG + mono PCM for browsers without a usable MediaRecorder.
// Every JPEG is independently seekable. Sample times come from the live animation.
const ascii = (text) => Uint8Array.from(text, (c) => c.charCodeAt(0));
const zeros = (n) => new Uint8Array(n);
function integers(bytes, values) {
  const out = new Uint8Array(bytes * values.length),
    view = new DataView(out.buffer);
  values.forEach((n, i) => (bytes === 2 ? view.setUint16(i * 2, n) : view.setUint32(i * 4, n)));
  return out;
}
const u16 = (...values) => integers(2, values);
const u32 = (...values) => integers(4, values);
function join(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.byteLength;
  }
  return out;
}
function box(name, ...parts) {
  return join(u32(8 + parts.reduce((n, p) => n + p.byteLength, 0)), ascii(name), ...parts);
}
const full = (name, flags, ...parts) => box(name, u32(flags), ...parts);
const matrix = u32(0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000);

function track(id, width, height, duration, entry, tables, scale, count) {
  const video = id === 1;
  const tkhd = full(
    'tkhd',
    7,
    u32(0, 0, id, 0, duration),
    zeros(8),
    u16(0, 0, video ? 0 : 256, 0),
    matrix,
    u32(width * 65536, height * 65536)
  );
  const header = full('mdhd', 0, u32(0, 0, scale, count), u16(0, 0));
  const handler = full('hdlr', 0, u32(0), ascii(video ? 'vide' : 'soun'), zeros(12), zeros(1));
  const media = video ? full('vmhd', 1, zeros(8)) : full('smhd', 0, zeros(4));
  const data = box('dinf', full('dref', 0, u32(1), full('url ', 1)));
  const stbl = box('stbl', full('stsd', 0, u32(1), entry), ...tables);
  return box('trak', tkhd, box('mdia', header, handler, box('minf', media, data, stbl)));
}

export function quickTimeFile(frames, width, height, duration, pcm, rate) {
  const ftyp = box('ftyp', ascii('qt  '), u32(0), ascii('qt  '));
  const times = [],
    sizes = [],
    offsets = [];
  let offset = ftyp.length + 8;
  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const delta = (frames[i + 1]?.at ?? duration) - frame.at;
    if (times.length && times[times.length - 1] === delta) times[times.length - 2]++;
    else times.push(1, delta);
    offsets.push(offset);
    sizes.push(frame.blob.size);
    offset += frame.blob.size;
  }
  const jpeg = box(
    'jpeg',
    zeros(6),
    u16(1),
    zeros(16),
    u16(width, height),
    u32(72 * 65536, 72 * 65536, 0),
    u16(1),
    zeros(32),
    u16(24, 0xffff)
  );
  const video = track(
    1,
    width,
    height,
    duration,
    jpeg,
    [
      full('stts', 0, u32(times.length / 2, ...times)),
      full('stsc', 0, u32(1, 1, 1, 1)),
      full('stsz', 0, u32(0, sizes.length, ...sizes)),
      full('stco', 0, u32(offsets.length, ...offsets)),
    ],
    1000,
    duration
  );
  const tracks = [video],
    media = frames.map((f) => f.blob);
  if (pcm) {
    const sound = box('sowt', zeros(6), u16(1), zeros(8), u16(1, 16, 0, 0), u32(rate * 65536));
    tracks.push(
      track(
        2,
        0,
        0,
        duration,
        sound,
        [
          full('stts', 0, u32(1, pcm.length, 1)),
          full('stsc', 0, u32(1, 1, pcm.length, 1)),
          full('stsz', 0, u32(2, pcm.length)),
          full('stco', 0, u32(1, offset)),
        ],
        rate,
        pcm.length
      )
    );
    media.push(pcm);
    offset += pcm.byteLength;
  }
  const movie = full(
    'mvhd',
    0,
    u32(0, 0, 1000, duration, 65536),
    u16(256),
    zeros(10),
    matrix,
    zeros(24),
    u32(3)
  );
  return new File(
    [ftyp, u32(offset - ftyp.length), ascii('mdat'), ...media, box('moov', movie, ...tracks)],
    clipName(duration, 'mov'),
    { type: 'video/quicktime' }
  );
}

export class PhotoClip {
  constructor(canvas, audio, duration, startTime) {
    this.canvas = canvas;
    this.duration = duration;
    this.frames = [];
    this.rate = 24000;
    this.startTime = startTime;
    this.sound = audio;
  }
  frame(now) {
    const at = this.frames.length ? Math.max(1, Math.round(now - this.startTime)) : 0;
    if (
      this.pending ||
      at >= this.duration ||
      (this.frames.length && at - this.frames[this.frames.length - 1].at < 66)
    )
      return;
    this.pending = new Promise((resolve) => this.canvas.toBlob(resolve, 'image/jpeg', 0.75))
      .then((blob) => {
        if (this.frames && blob && blob.type === 'image/jpeg') this.frames.push({ at, blob });
      })
      .catch(() => {})
      .finally(() => {
        this.pending = null;
      });
  }
  async finish() {
    const [pcm] = await Promise.all([this.sound.renderClip(this.rate, this.duration), this.pending]);
    if (!this.frames?.length) throw Error('Sin cuadros para guardar');
    return quickTimeFile(
      this.frames,
      this.canvas.width,
      this.canvas.height,
      this.duration,
      pcm,
      this.rate
    );
  }
  close() {
    this.frames = this.canvas = null;
  }
}
