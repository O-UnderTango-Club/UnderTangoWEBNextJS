import { WebClip } from './webm.mjs';
import { PhotoClip } from './quicktime.mjs';

export const clipLength = 20000;
const avcFormats = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2'];
const otherFormats = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4', ''];

// Only this fixed-size copy of the finished scene and the artwork's own sound
// enter the recorder. Rotating the phone cannot resize a codec mid-recording.
export class SceneClip {
  constructor(onChange) {
    this.onChange = onChange;
    this.state = 'idle';
    this.url = null;
    this.file = null;
    this.recorder = null;
    this.timer = 0;
  }
  setState(state) {
    this.state = state;
    this.onChange(this);
  }
  stopTracks() {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
  disposeCapture() {
    clearTimeout(this.timer);
    this.stopTracks();
    this.encoder?.close();
    this.encoder = this.canvas = this.ink = null;
  }
  reset() {
    const active = this.recorder;
    this.recorder = null;
    if (active && active.state !== 'inactive') active.stop();
    this.disposeCapture();
    if (this.url) URL.revokeObjectURL(this.url);
    this.file = this.url = null;
    this.setState('idle');
  }
  complete(file) {
    this.disposeCapture();
    if (!file?.size) return this.setState('unavailable');
    this.file = file;
    this.url = URL.createObjectURL(file);
    this.setState('ready');
  }
  async begin(source, audio, now) {
    if (this.state !== 'idle') return;
    this.started = performance.now();
    this.setState('preparing');
    try {
      this.canvas = document.createElement('canvas');
      this.ink = this.canvas.getContext('2d', { alpha: false });
      this.size(source, 960);
      this.paint(source, now);
      const canvas = this.canvas,
        native = window.MediaRecorder && canvas.captureStream;
      if (native && this.native(source, audio, avcFormats)) return;
      this.stopTracks();
      this.size(source, 840);
      const portable = await WebClip.supports(canvas.width, canvas.height).catch(() => false);
      if (canvas !== this.canvas) return;
      if (portable) {
        try {
          this.startFrames(source, audio, WebClip);
          return;
        } catch {
          /* Try the remaining encoders. */
        }
      }
      if (native && this.native(source, audio, otherFormats)) return;
      this.startFrames(source, audio, PhotoClip);
    } catch {
      this.complete(null);
    }
  }
  size(source, longest) {
    const scale = Math.min(1, longest / Math.max(source.width, source.height));
    this.canvas.width = Math.max(2, Math.round((source.width * scale) / 2) * 2);
    this.canvas.height = Math.max(2, Math.round((source.height * scale) / 2) * 2);
    this.nextFrame = 0;
  }
  native(source, audio, formats) {
    try {
      this.stream = this.canvas.captureStream(24);
      const track = audio.recordingTrack();
      if (track) this.stream.addTrack(track.clone());
    } catch {
      return false;
    }
    for (const mimeType of formats) {
      if (mimeType && MediaRecorder.isTypeSupported && !MediaRecorder.isTypeSupported(mimeType))
        continue;
      try {
        const active = new MediaRecorder(this.stream, {
          ...(mimeType ? { mimeType } : {}),
          videoBitsPerSecond: 2400000,
          audioBitsPerSecond: 96000,
        });
        const chunks = [];
        this.recorder = active;
        active.ondataavailable = ({ data }) => {
          if (this.recorder === active && data.size) chunks.push(data);
        };
        active.onerror = () => {
          if (this.recorder !== active) return;
          this.recorder = null;
          clearTimeout(this.timer);
          if (active.state !== 'inactive') active.stop();
          // Some encoders advertise support and reject their first frame.
          if (performance.now() - this.started < 800) {
            try {
              this.startFrames(source, audio, PhotoClip);
              return;
            } catch {
              /* Report failure below. */
            }
          }
          this.complete(null);
        };
        active.onstop = () => {
          if (this.recorder !== active) return;
          this.recorder = null;
          if (!chunks.length) return this.complete(null);
          const type = (active.mimeType || chunks[0].type).split(';')[0];
          const ext = type.includes('mp4') ? 'mp4' : 'webm';
          this.complete(new File(chunks, 'primera-voluntad-20s.' + ext, { type }));
        };
        active.start(1000);
        this.timer = setTimeout(() => {
          if (this.recorder === active && active.state !== 'inactive') active.stop();
        }, clipLength);
        this.setState('preparing');
        return true;
      } catch {
        this.recorder = null;
      }
    }
    return false;
  }
  startFrames(source, audio, Encoder) {
    this.stopTracks();
    this.size(source, Encoder === WebClip ? 840 : 720);
    const encoder = (this.encoder = new Encoder(this.canvas, audio, clipLength, this.started));
    this.paint(source, performance.now());
    this.timer = setTimeout(
      async () => {
        let file = null;
        try {
          file = await encoder.finish();
        } catch {
          /* Unsupported JPEG encoder. */
        }
        if (this.encoder === encoder) this.complete(file);
      },
      Math.max(0, clipLength - (performance.now() - this.started))
    );
    this.setState('preparing');
  }
  paint(source, now) {
    if (!this.canvas || now < this.nextFrame) return;
    this.nextFrame = now + (this.encoder instanceof PhotoClip ? 66 : this.encoder ? 48 : 1000 / 25);
    const w = this.canvas.width,
      h = this.canvas.height;
    const fit = Math.min(w / source.width, h / source.height);
    const dw = source.width * fit,
      dh = source.height * fit;
    this.ink.fillStyle = '#101018';
    this.ink.fillRect(0, 0, w, h);
    this.ink.drawImage(source, (w - dw) / 2, (h - dh) / 2, dw, dh);
    this.encoder?.frame(now);
  }
  canShare() {
    try {
      return Boolean(this.file && navigator.canShare?.({ files: [this.file] }));
    } catch {
      return false;
    }
  }
}
