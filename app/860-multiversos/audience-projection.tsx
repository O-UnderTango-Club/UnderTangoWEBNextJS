import { useEffect, useRef, useState } from "react";
import { drawAsciiCamera } from "./ascii-camera";

type Props = {
  analyser: { current: AnalyserNode | null };
  attack?: { current: { count: number; velocity: number; frequency: number } };
  treatment?: "contour" | "ascii";
  paused: boolean;
};

const columns = 112;
const rows = 64;

export function AudienceProjection({ analyser, attack, paused, treatment = "contour" }: Props) {
  const camera = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Activando cámara…");
  const [live, setLive] = useState(false);
  const [retry, setRetry] = useState(false);

  useEffect(() => {
    const video = camera.current;
    if (!video) return;
    let active = true;
    let stream: MediaStream | undefined;
    setLive(false);
    setRetry(false);
    setStatus("Activando cámara…");
    const interrupted = () => {
      if (!active) return;
      setStatus("Se desconectó la cámara.");
      setLive(false);
      setRetry(true);
    };
    async function openCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
        });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        stream.getVideoTracks()[0].addEventListener("ended", interrupted);
        video!.srcObject = stream;
        await video!.play();
        if (active) { setLive(true); setStatus(""); }
      } catch (error) {
        if (!active) return;
        stream?.getTracks().forEach(track => track.stop());
        setStatus(error instanceof DOMException && error.name === "NotAllowedError"
          ? "Habilitá la cámara en los permisos del navegador." : "No se pudo abrir la cámara del público.");
        setRetry(true);
      }
    }
    void openCamera();
    return () => {
      active = false;
      stream?.getVideoTracks().forEach(track => track.removeEventListener("ended", interrupted));
      stream?.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    };
  }, [attempt]);

  useEffect(() => {
    const video = camera.current;
    if (!video || !live) return;
    if (paused) video.pause();
    else void video.play().catch(() => { setStatus("No se pudo reanudar la cámara."); setRetry(true); });
  }, [live, paused]);

  useEffect(() => {
    const video = camera.current, surface = overlay.current;
    const ink = surface?.getContext("2d");
    if (!video || !surface || !ink || paused || !live) return;
    if (treatment === "ascii") return drawAsciiCamera(video, surface, analyser);
    const sampler = document.createElement("canvas");
    sampler.width = columns; sampler.height = rows;
    const pixels = sampler.getContext("2d", { willReadFrequently: true });
    if (!pixels) return;
    const previous = new Uint8Array(columns * rows);
    const bins = new Uint8Array(512);
    let raf = 0, last = 0, bass = 0, treble = 0, impulse = 0, seen = attack?.current.count ?? 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 32 || video.readyState < 2 || !video.videoWidth) return;
      const dt = Math.min(.1, (now - last) / 1000);
      last = now;
      const width = surface.clientWidth, height = surface.clientHeight;
      if (!width || !height) return;
      // Use the same centered crop as the underlying video so every contour follows a real body.
      const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
      const sw = width / scale, sh = height / scale;
      pixels.drawImage(video, (video.videoWidth - sw) / 2, (video.videoHeight - sh) / 2, sw, sh, 0, 0, columns, rows);
      const rgb = pixels.getImageData(0, 0, columns, rows).data;
      if (surface.width !== width || surface.height !== height) { surface.width = width; surface.height = height; }
      analyser.current?.getByteFrequencyData(bins);
      const low = ((bins[1] + bins[2] + bins[3]) / 765) ** 2;
      let high = 0;
      for (let i = 24; i < 140; i++) high += bins[i];
      bass += (low - bass) * (1 - Math.exp(-dt * 9));
      treble += (high / (116 * 255) - treble) * (1 - Math.exp(-dt * 8));
      if (attack && attack.current.count !== seen) { seen = attack.current.count; impulse = attack.current.velocity; }
      impulse *= Math.exp(-dt * 3);
      const force = Math.min(1, bass + treble + impulse);
      video.style.filter = `saturate(${1 + force * .85}) contrast(${1 + bass * .12})`;
      const dx = width / columns, dy = height / rows;
      ink.clearRect(0, 0, width, height);
      ink.lineWidth = Math.max(1, dx * .25);
      for (let band = 0; band < 3; band++) {
        ink.beginPath();
        const hue = (185 + band * 52 + treble * 120 + impulse * 65) % 360;
        ink.strokeStyle = `hsla(${hue},100%,68%,${.12 + force * .7})`;
        for (let y = 1 + band; y < rows; y += 3) {
          for (let x = 1; x < columns; x++) {
            const index = y * columns + x, p = index * 4;
            const luminance = (rgb[p] + 2 * rgb[p + 1] + rgb[p + 2]) / 4;
            const motion = Math.abs(luminance - previous[index]);
            previous[index] = luminance;
            const gradientX = (rgb[p + 1] - rgb[p - 3]);
            const gradientY = (rgb[p + 1] - rgb[p - columns * 4 + 1]);
            if (Math.abs(gradientX) + Math.abs(gradientY) + motion * force < 48) continue;
            const length = (reduceMotion ? .6 : .75 + force * 2.8) * dx;
            const magnitude = Math.max(1, Math.hypot(gradientX, gradientY));
            ink.moveTo(x * dx, y * dy);
            ink.lineTo(x * dx - gradientY / magnitude * length, y * dy + gradientX / magnitude * length);
          }
        }
        ink.stroke();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyser, attack, live, paused, treatment]);

  return <div className="audience-projection" aria-label="Proyección del público">
    <video ref={camera} muted playsInline aria-label="Cámara del público" style={treatment === "ascii" ? {opacity:0} : undefined}/>
    <canvas ref={overlay} aria-hidden="true" />
    {status && <div className="audience-camera-status" role="status">{status}
      {retry && <button type="button" onClick={() => setAttempt(value => value + 1)}>Reintentar cámara</button>}
    </div>}
  </div>;
}
