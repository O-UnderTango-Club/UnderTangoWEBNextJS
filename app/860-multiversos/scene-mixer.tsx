import { useCallback, useEffect, useRef, useState } from "react";

type Clip = { id: number; scene: string; buffer: AudioBuffer; muted: boolean; volume: number };
type Voice = { gain: GainNode; source: AudioBufferSourceNode };

export function SceneMixer({scene, pitch, input, master, paused}: {
  scene?: string; pitch: number; input: GainNode | null; master: GainNode | null; paused: boolean;
}) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const voices = useRef(new Map<number, Voice>());
  const serial = useRef(0);
  const mounted = useRef(false);
  const tone = useRef<OscillatorNode | null>(null);
  const stopTone = useCallback(() => { tone.current?.stop(); tone.current = null; }, []);
  const finish = useCallback(() => {
    const active = recorder.current;
    if (active?.state === "recording") active.stop();
  }, []);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; finish(); stopTone(); };
  }, [finish, stopTone]);
  useEffect(() => () => { finish(); stopTone(); }, [scene, input, paused, finish, stopTone]);

  const play = useCallback(() => {
    if (!input || !scene || paused || tone.current) return;
    const ctx = input.context;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.frequency.value = pitch;
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.14, ctx.currentTime, 0.007);
    osc.connect(gain).connect(input);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    tone.current = osc;
    osc.start();
  }, [input, scene, paused, pitch]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "KeyP" && !e.repeat && !e.ctrlKey && !e.altKey && !e.metaKey &&
        !(e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable=true]"))) play();
    };
    const up = (e: KeyboardEvent) => { if (e.code === "KeyP") stopTone(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    window.addEventListener("blur", stopTone);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", stopTone); };
  }, [play, stopTone]);

  function record() {
    if (recorder.current) { finish(); return; }
    if (!scene || !input || paused) return;
    const ctx = input.context as AudioContext;
    const stream = ctx.createMediaStreamDestination();
    let take: MediaRecorder;
    try { take = new MediaRecorder(stream.stream); take.start(); }
    catch { stream.stream.getTracks().forEach(t => t.stop()); setMessage("Este navegador no pudo iniciar la grabación."); return; }
    const id = ++serial.current;
    const chunks: Blob[] = [];
    take.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    take.onstop = async () => {
      input.disconnect(stream);
      stream.stream.getTracks().forEach(t => t.stop());
      recorder.current = null;
      if (!mounted.current) return;
      setRecording(false);
      try {
        const bytes = await new Blob(chunks, {type:take.mimeType}).arrayBuffer();
        const decoder = new OfflineAudioContext(2, 1, ctx.sampleRate);
        const buffer = await decoder.decodeAudioData(bytes);
        if (mounted.current) setClips(all => [...all, {id, scene, buffer, volume:75, muted:false}]);
      } catch { if (mounted.current) setMessage("La toma fue demasiado corta o no pudo leerse. Volvé a grabar."); }
    };
    input.connect(stream);
    recorder.current = take;
    setMessage(""); setRecording(true);
  }

  useEffect(() => {
    const active = voices.current;
    return () => { for (const v of active.values()) { v.source.stop(); v.source.disconnect(); v.gain.disconnect(); } active.clear(); };
  }, [master]);
  useEffect(() => {
    if (!master) return;
    const ctx = master.context;
    for (const [id,v] of voices.current) if (!clips.some(c => c.id === id)) {
      v.source.stop(); v.source.disconnect(); v.gain.disconnect(); voices.current.delete(id);
    }
    for (const clip of clips) {
      let voice = voices.current.get(clip.id);
      if (!voice) {
        const source = ctx.createBufferSource(), gain = ctx.createGain();
        gain.gain.value = 0;
        source.buffer = clip.buffer; source.loop = true;
        source.connect(gain).connect(master); source.start();
        voice = {source,gain}; voices.current.set(clip.id,voice);
      }
      voice.gain.gain.setTargetAtTime(clip.muted ? 0 : clip.volume / 100, ctx.currentTime, 0.012);
    }
  }, [master,clips]);

  if (!scene && !clips.length && !message) return null;
  return <div className="scene-mixer" role="region" aria-label="Lupera de objetos sonoros">
    <div className="scene-mixer-tools">
      <button disabled={!scene || paused} onClick={record} aria-pressed={recording}>{recording ? "Cerrar loop" : "Grabar sonido"}</button>
      <button disabled={!scene || paused} aria-label="Tocar sonido de escena" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); play(); }}
        onPointerUp={stopTone} onLostPointerCapture={stopTone} onKeyDown={e => { if (e.key === " " || e.key === "Enter") play(); }}
        onKeyUp={stopTone}>Tocar · P</button>
      {message && <small role="status">{message}</small>}
    </div>
    {clips.map(clip => <div className="scene-mixer-row" key={clip.id}>
      <span>#{clip.id} · {clip.scene} · {clip.buffer.duration.toFixed(1)} s</span>
      <button aria-pressed={clip.muted} onClick={() => setClips(all => all.map(c => c.id === clip.id ? {...c,muted:!c.muted} : c))}>{clip.muted ? "Activar" : "Mutear"}</button>
      <input aria-label={"Volumen del sonido " + clip.id} type="range" min="0" max="100" value={clip.volume}
        onChange={e => { const volume = Number(e.target.value); setClips(all => all.map(c => c.id === clip.id ? {...c,volume} : c)); }} />
      <button aria-label={"Eliminar sonido " + clip.id} onClick={() => setClips(all => all.filter(c => c.id !== clip.id))}>×</button>
    </div>)}
  </div>;
}
