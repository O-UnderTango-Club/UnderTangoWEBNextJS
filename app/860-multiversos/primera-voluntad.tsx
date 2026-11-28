import { useEffect, useRef } from "react";

type Props = {
  clock: AudioContext;

  analyser: { current: AnalyserNode | null };
  attack: { current: { count: number; frequency: number; velocity: number } };
  paused: boolean;
  press: (id: string, index: number) => void;
  release: (id: string) => void;
};

export function PrimeraVoluntad({ clock, analyser, attack, paused, press, release }: Props) {
  const frame = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = frame.current;
    if (!el || paused) return;
    const spectrum = new Uint8Array(512);
    let previous = clock.currentTime, seen = attack.current.count, impulse = 0, bass = 0, hue = 0, raf = 0;
    const paint = () => {
      const dt = Math.min(0.1, clock.currentTime - previous);
      previous = clock.currentTime;
      if (analyser.current) analyser.current.getByteFrequencyData(spectrum);
      const target = ((spectrum[1] + spectrum[2] + spectrum[3]) / 765) ** 3;
      bass += (target - bass) * (1 - Math.exp(-dt * (target > bass ? 22 : 6)));
      const note = attack.current;
      if (note.count !== seen) {
        impulse = Math.max(0.3, note.velocity);
        hue = Math.log2(note.frequency / 111) * 24;
        seen = note.count;
      }
      impulse *= Math.exp(-dt * 2.8);
      el.style.setProperty("--pulse", String(bass * 0.68 + impulse * 0.32));
      el.style.setProperty("--strike", String(impulse));
      el.style.setProperty("--tone", hue * impulse + "deg");
      raf = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(raf);
  }, [clock, analyser, attack, paused]);

  return <div className="voluntad-stage">
    <button className="voluntad-poster" type="button" ref={frame} aria-label="Tocar Primera voluntad"
      onPointerDown={event => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        const rect = event.currentTarget.getBoundingClientRect();
        const fraction = (event.clientX - rect.left) / rect.width;
        press("poster:" + event.pointerId, Math.max(0, Math.min(26, Math.floor(fraction * 27))));
      }}
      onLostPointerCapture={event => release("poster:" + event.pointerId)}
      onClick={event => { if (event.detail === 0) { press("poster:key", 12); window.setTimeout(() => release("poster:key"), 180); } }}>
      <img src="/multiversos/primera-voluntad.png" alt="Multiversos 2026. Ø Primera voluntad. Pablo Cieslik y UnderTango Club. 2 de diciembre en La Cabaña de los Muñecos." draggable={false} />
      <img className="voluntad-resonance" src="/multiversos/primera-voluntad.png" alt="" draggable={false} />
    </button>

  </div>;
}
