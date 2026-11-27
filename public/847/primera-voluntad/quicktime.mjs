import { clipName } from './timing.mjs';

// Shared ISO base media boxes for indexed AVC/AAC and QuickTime exports.
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

function sampleTables(sizes, offset, times, keys) {
  const runs = [];
  for (const delta of times) {
    if (runs.length && runs[runs.length - 1] === delta) runs[runs.length - 2]++;
    else runs.push(1, delta);
  }
  return [
    full('stts', 0, u32(runs.length / 2, ...runs)),
    full('stsc', 0, u32(1, 1, sizes.length, 1)),
    full('stsz', 0, u32(0, sizes.length, ...sizes)),
    full('stco', 0, u32(1, offset)),
    ...(keys ? [full('stss', 0, u32(keys.length, ...keys))] : []),
  ];
}

function descriptor(tag, ...parts) {
  const data = join(...parts);
  // The three AAC descriptors here contain only a short AudioSpecificConfig.
  if (data.length > 127) throw Error('Configuración AAC demasiado larga');
  return join(Uint8Array.of(tag, data.length), data);
}

export function movieFile(video, width, height, duration, fps, avc, sound, rate) {
  const aac = sound.config;
  const ftyp = aac ? box('ftyp', ascii('isom'), u32(512), ascii('isomiso2avc1mp41'))
                   : box('ftyp', ascii('qt  '), u32(0), ascii('qt  '));
  const videoEntry = box(avc ? 'avc1' : 'jpeg', zeros(6), u16(1), zeros(16), u16(width, height),
    u32(72 * 65536, 72 * 65536, 0), u16(1), zeros(32), u16(24, 0xffff),
    ...(avc ? [box('avcC', avc)] : []));
  const sampleCount = Math.round(rate * duration / 1000);
  const audioFormat = [zeros(6), u16(1), zeros(8), u16(1, 16, 0, 0), u32(rate * 65536)];
  const audioEntry = aac ? box('mp4a', ...audioFormat, full('esds', 0,
    descriptor(3, u16(2), zeros(1), descriptor(4, Uint8Array.of(0x40, 0x15), zeros(3),
      u32(96000, 96000), descriptor(5, aac)), descriptor(6, Uint8Array.of(2)))))
    : box('sowt', ...audioFormat);
  const videoData = video.map(s => s.data), videoSizes = videoData.map(d => d.size ?? d.byteLength);
  const audioData = aac ? sound.samples.map(s => s.data) : [sound.pcm];
  const videoBytes = videoSizes.reduce((a, b) => a + b, 0);
  const audioBytes = audioData.reduce((n, d) => n + d.byteLength, 0);
  function moov(offset) {
    const vt = track(1, width, height, duration, videoEntry,
      sampleTables(videoSizes, offset, video.map(() => 1),
        avc ? video.flatMap((s, i) => s.key ? [i + 1] : []) : null), fps, video.length);
    const at = offset + videoBytes;
    const audioTables = aac ? sampleTables(audioData.map(d => d.byteLength), at,
      sound.samples.map((s, i) => (sound.samples[i + 1]?.sample ?? sampleCount) - s.sample))
      : [full('stts', 0, u32(1, sampleCount, 1)), full('stsc', 0, u32(1, 1, sampleCount, 1)),
         full('stsz', 0, u32(2, sampleCount)), full('stco', 0, u32(1, at))];
    const hdr = full('mvhd', 0, u32(0, 0, 1000, duration, 65536), u16(256), zeros(10), matrix, zeros(24), u32(3));
    return box('moov', hdr, vt, track(2, 0, 0, duration, audioEntry, audioTables, rate, sampleCount));
  }
  const header = moov(ftyp.length + moov(0).length + 8);
  const ext = aac ? 'mp4' : 'mov';
  return new File([ftyp, header, u32(8 + videoBytes + audioBytes), ascii('mdat'), ...videoData, ...audioData],
    clipName(duration, ext), { type: aac ? 'video/mp4' : 'video/quicktime' });
}
