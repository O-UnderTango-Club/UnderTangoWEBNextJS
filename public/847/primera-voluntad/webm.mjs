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
function opusHead() {
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

export class WebClip {
  static async supports(width, height) {
    if (!window.VideoEncoder || !window.AudioEncoder || !window.VideoFrame || !window.AudioData)
      return false;
    const [video, audio] = await Promise.all([
      VideoEncoder.isConfigSupported(this.videoConfig(width, height)),
      AudioEncoder.isConfigSupported(this.audioConfig()),
    ]);
    return video.supported && audio.supported;
  }
  static videoConfig(width, height) {
    return { codec: 'vp8', width, height, bitrate: 1600000, framerate: 20, latencyMode: 'realtime' };
  }
  static audioConfig() {
    return { codec: 'opus', sampleRate: 48000, numberOfChannels: 1, bitrate: 80000 };
  }
  constructor(canvas, audio, duration, start) {
    this.canvas = canvas;
    this.duration = duration;
    this.start = start;
    this.packets = [];
    this.lastKey = -Infinity;
    this.hasVideo = false;
    this.sound = audio;
    this.audioUntil = 0;
    const failed = (error) => {
      this.error = error;
    };
    try {
      this.video = new VideoEncoder({ output: (chunk) => this.packet(1, chunk), error: failed });
      this.video.configure(WebClip.videoConfig(canvas.width, canvas.height));
      this.audioHead = opusHead();
      this.audio = new AudioEncoder({
        output: (chunk, meta) => {
          const desc = meta?.decoderConfig?.description;
          if (desc && desc.byteLength >= 19) this.audioHead = new Uint8Array(desc).slice();
          this.packet(2, chunk);
        },
        error: failed,
      });
      this.audio.configure(WebClip.audioConfig());
    } catch (error) {
      this.close();
      throw error;
    }
  }
  packet(track, chunk) {
    const time = Math.max(0, Math.round(chunk.timestamp / 1000));
    if (time >= this.duration) return;
    const data = new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    this.packets.push({ track, time, key: chunk.type === 'key', data });
    if (track === 1) this.hasVideo = true;
  }
  // Encode completed sections during the performance so only the tail remains at 15 s.
  queueAudio(until) {
    if (until <= this.audioUntil || this.audioPending) return;
    const from = this.audioUntil;
    this.audioPending = this.sound
      .renderClip(48000, until - from, from)
      .then((pcm) => {
        if (this.audio.state === 'closed') return;
        this.encodeSound(pcm, from);
        this.audioUntil = until;
      })
      .catch((error) => {
        this.error = error;
      })
      .finally(() => {
        this.audioPending = null;
      });
  }
  encodeSound(pcm, from) {
    for (let start = 0; start < pcm.length; start += 960) {
      const block = new AudioData({
        format: 's16',
        sampleRate: 48000,
        numberOfFrames: Math.min(960, pcm.length - start),
        numberOfChannels: 1,
        timestamp: from * 1000 + Math.round((start * 1e6) / 48000),
        data: pcm.subarray(start, start + 960),
      });
      try {
        this.audio.encode(block);
      } finally {
        block.close();
      }
    }
  }
  frame(now) {
    if (this.error) return;
    const elapsed = Math.max(0, now - this.start);
    try {
      const complete = Math.min(this.duration, Math.floor(elapsed / 2000) * 2000);
      this.queueAudio(complete);
      if (elapsed >= this.duration || this.video.encodeQueueSize > 2) return;
      const ms = this.lastKey === -Infinity ? 0 : elapsed;
      const key = ms - this.lastKey >= 1200;
      const frame = new VideoFrame(this.canvas, { timestamp: Math.round(ms * 1000) });
      try {
        this.video.encode(frame, { keyFrame: key });
      } finally {
        frame.close();
      }
      if (key) this.lastKey = ms;
    } catch (error) {
      this.error = error;
    }
  }
  async finish() {
    if (this.error) throw this.error;
    await this.audioPending;
    if (this.error) throw this.error;
    this.queueAudio(this.duration);
    await this.audioPending;
    if (this.error) throw this.error;
    await Promise.all([this.video.flush(), this.audio?.flush()]);
    if (!this.hasVideo) throw Error('Sin cuadros para guardar');
    return webmFile(this.packets, this.canvas.width, this.canvas.height, this.duration, this.audioHead);
  }
  close() {
    if (this.video && this.video.state !== 'closed') this.video.close();
    if (this.audio && this.audio.state !== 'closed') this.audio.close();
    this.packets = [];
  }
}
