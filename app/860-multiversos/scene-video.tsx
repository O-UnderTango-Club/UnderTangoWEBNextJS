import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clips from "./scene-videos.json";

type Film = typeof clips[number];
type Placement = Film["uses"][number];
export type SceneFilm = { clip: Film; use: Placement };
export const sceneFilms = new Map<number, SceneFilm>();
for (const clip of clips) {
  for (const use of clip.uses) sceneFilms.set(use.scene, { clip, use });
}

type Props = {
  film: SceneFilm;
  cue: { context: AudioContext; beginsAt: number };
  paused: boolean;
  output: GainNode;
  controls: HTMLDivElement | null;
};

export function SceneVideo({ film, cue, paused, output, controls }: Props) {
  const { clip, use } = film;
  const media = useRef<HTMLVideoElement>(null);
  const graph = useRef<{ source: MediaElementAudioSourceNode; gain: GainNode } | null>(null);
  const hold = useRef<{ frame: number | null; skipped: number }>({ frame: null, skipped: 0 });
  const [frozen, setFrozen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [audible, setAudible] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [audioError, setAudioError] = useState(false);

  useLayoutEffect(() => {
    const video = media.current!;
    return () => {
      video.muted = true;
      video.pause();
      graph.current?.source.disconnect();
      graph.current?.gain.disconnect();
      graph.current = null;
    };
  }, []);

  useEffect(() => {
    const video = media.current!;
    const { context, beginsAt } = cue;
    let active = true, starting = false;
    function sync() {
      if (!Number.isFinite(video.duration) || !video.duration || video.error) return;
      if (hold.current.frame !== null) {
        if (!video.paused) video.pause();
        return;
      }
      const time = context.currentTime - beginsAt - hold.current.skipped;
      const elapsed = Math.max(0, time);
      const position = use.loop ? elapsed % video.duration : Math.min(elapsed, video.duration);
      if (Math.abs(video.currentTime - position) > .18 && !video.seeking) video.currentTime = position;
      if (paused || time < 0 || context.state !== "running" || (!use.loop && elapsed >= video.duration)) {
        if (!video.paused) video.pause();
      } else if (video.paused && !starting && !blocked) {
        starting = true;
        void video.play().catch((error: DOMException) => {
          if (!active || error.name === "AbortError") return;
          if (error.name === "NotAllowedError") setBlocked(true);
          else setUnavailable(true);
        }).finally(() => { starting = false; });
      }
    }
    video.addEventListener("loadedmetadata", sync);
    video.addEventListener("canplay", sync);
    context.addEventListener("statechange", sync);
    sync();
    const timer = paused || frozen || blocked || unavailable ? undefined : window.setInterval(sync, 400);
    return () => {
      active = false;
      window.clearInterval(timer);
      context.removeEventListener("statechange", sync);
      video.removeEventListener("loadedmetadata", sync);
      video.removeEventListener("canplay", sync);
    };
  }, [cue, paused, frozen, blocked, unavailable, use.loop]);

  function toggleFreeze() {
    const now = cue.context.currentTime;
    if (hold.current.frame === null) {
      hold.current.frame = media.current?.currentTime ?? 0;
      media.current?.pause();
      setFrozen(true);
    } else {
      hold.current.skipped = now - cue.beginsAt - hold.current.frame;
      hold.current.frame = null;
      setFrozen(false);
    }
  }

  function toggleSound() {
    const video = media.current;
    if (!video || !clip.audio || output.context !== cue.context) return;
    try {
      if (!graph.current) {
        const gain = cue.context.createGain();
        gain.gain.value = 0;
        const source = cue.context.createMediaElementSource(video);
        source.connect(gain).connect(output);
        graph.current = { source, gain };
      }
      const enable = !audible;
      graph.current.gain.gain.setTargetAtTime(enable ? .40 : 0, cue.context.currentTime, .015);
      video.muted = !enable;
      setAudible(enable);
      setAudioError(false);
    } catch {
      video.muted = true;
      setAudible(false);
      setAudioError(true);
    }
  }

  return <>
    <video ref={media} className="scene-film" src={clip.src} hidden={hidden || unavailable} muted={!audible}
      loop={use.loop} playsInline preload="auto" aria-hidden="true" disablePictureInPicture
      style={{ objectFit: use.fit === "contain" ? "contain" : "cover", opacity: use.opacity }}
      onError={() => setUnavailable(true)} />
    {controls && createPortal(<div className="scene-film-controls" role="group" aria-label="Controles del video de fondo">
      {unavailable ? <>
        <span role="status">No se pudo cargar el video.</span>
        <button type="button" onClick={() => { setUnavailable(false); setBlocked(false); media.current?.load(); }}>Reintentar video</button>
      </> : <>
        {blocked && <button type="button" onClick={() => { void media.current?.play().then(() => setBlocked(false)).catch(() => setBlocked(true)); }}>Habilitar reproducción del video</button>}
        <button type="button" onClick={toggleFreeze}>{frozen ? "Reanudar imagen" : "Pausar imagen"}</button>
        <button type="button" onClick={() => setHidden(value => !value)}>{hidden ? "Mostrar imagen" : "Ocultar imagen"}</button>
        {clip.audio ? <button type="button" onClick={toggleSound}>{audible ? "Silenciar audio del clip" : "Activar audio del clip"}</button> : <small>Sin pista de audio</small>}
        {audioError && <small role="status">No se pudo conectar el audio del video al máster.</small>}
      </>}
    </div>, controls)}
  </>;
}
