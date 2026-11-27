import { clipName } from './timing.mjs';

// WebM with an explicit duration and a seek index. Codec frames are generated
// by the browser. Only the finished local file is offered for sharing.
const text = (value) => new TextEncoder().encode(value);
function integer(value, length = Math.max(1, Math.ceil(Math.log2(value + 1) / 8))) {
  const out = new Uint8Array(length);
  for (let i = length - 1; i >= 0; i--) {
    out[i] = value % 256;
    value = Math.floor(value / 256);
  }
  return out;
}
function lengthField(value) {
  let width = 1;
  while (value >= 2 ** (7 * width) - 1) width++;
  const out = integer(value, width);
  out[0] |= 1 << (8 - width);
  return out;
}
function element(id, ...parts) {
  const bytes = parts.reduce((n, p) => n + (p.size ?? p.byteLength), 0);
  return new Blob([integer(id), lengthField(bytes), ...parts]);
}
const number = (id, n, width) => element(id, integer(n, width));
const string = (id, s) => element(id, text(s));
function float(id, n) {
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, n);
  return element(id, view);
}
export function opusHead() {
  const head = new Uint8Array(19);
  head.set(text('OpusHead'));
  head[8] = 1;
  head[9] = 1;
  const view = new DataView(head.buffer);
  view.setUint16(10, 312, true);
  view.setUint32(12, 48000, true);
  return head;
}

export function webmFile(packets, width, height, duration, audioHead) {
  const ebml = element(
    0x1a45dfa3,
    number(0x4286, 1),
    number(0x42f7, 1),
    number(0x42f2, 4),
    number(0x42f3, 8),
    string(0x4282, 'webm'),
    number(0x4287, 4),
    number(0x4285, 2)
  );
  const info = element(
    0x1549a966,
    number(0x2ad7b1, 1000000),
    float(0x4489, duration),
    string(0x4d80, 'UnderTango'),
    string(0x5741, 'Primera voluntad')
  );
  const video = element(
    0xae,
    number(0xd7, 1),
    number(0x73c5, 1),
    number(0x83, 1),
    number(0x9c, 0),
    string(0x86, 'V_VP8'),
    number(0x23e383, 33333333),
    element(0xe0, number(0xb0, width), number(0xba, height))
  );
  const entries = [video];
  if (audioHead) {
    const preskip = audioHead[10] + 256 * audioHead[11];
    entries.push(
      element(
        0xae,
        number(0xd7, 2),
        number(0x73c5, 2),
        number(0x83, 2),
        number(0x9c, 0),
        string(0x86, 'A_OPUS'),
        element(0x63a2, audioHead),
        number(0x56aa, Math.round((preskip * 1e9) / 48000)),
        number(0x56bb, 80000000),
        element(0xe1, float(0xb5, 48000), number(0x9f, 1))
      )
    );
  }
  const tracks = element(0x1654ae6b, ...entries);
  const groups = [];
  let group;
  packets.sort((a, b) => a.time - b.time || a.track - b.track);
  for (const packet of packets) {
    if (!group || (packet.track === 1 && packet.key && packet.time - group.time > 500)) {
      group = { time: packet.time, blocks: [] };
      groups.push(group);
    }
    const delta = packet.time - group.time;
    group.blocks.push(
      element(
        0xa3,
        new Uint8Array([0x80 | packet.track, delta >> 8, delta & 255, packet.key ? 0x80 : 0]),
        packet.data
      )
    );
  }
  const clusters = groups.map((g) => element(0x1f43b675, number(0xe7, g.time), ...g.blocks));
  function makeCues(offset) {
    const points = groups.map((g, i) => {
      const entry = element(
        0xbb,
        number(0xb3, g.time),
        element(0xb7, number(0xf7, 1), number(0xf1, offset, 4))
      );
      offset += clusters[i].size;
      return entry;
    });
    return element(0x1c53bb6b, ...points);
  }
  const cues = makeCues(info.size + tracks.size + makeCues(0).size);
  return new File(
    [ebml, element(0x18538067, info, tracks, cues, ...clusters)],
    clipName(duration, 'webm'),
    { type: 'video/webm' }
  );
}
