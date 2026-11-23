import { useEffect, useRef } from "react";

// Pablo Cieslik, Ø - Ensayo sobre las 10 dimensiones de la consciencia, §§10, 11 y 14.
const passages = [
  ["El punto es el", "primer elemento", "mayor que la nada."],
  ["nada separa", "al punto", "de sí mismo"],
  ["El punto existe", "únicamente", "cuando es pensado."],
];
const refrain = ["Seguimos", "de", "pie"];
const climax = [refrain, passages[0], refrain, passages[1], refrain, passages[2]];

// Five rows cut from solid square strokes. Narrow glyphs retain their own advance.
const alphabet: Record<string, string> = {
  A:"1111/1001/1111/1001/1001", C:"1111/1000/1000/1000/1111",
  D:"1110/1001/1001/1001/1110", E:"1111/1000/1110/1000/1111",
  G:"1111/1000/1011/1001/1111", I:"1/0/1/1/1",
  L:"100/100/100/100/111", M:"11111/10101/10101/10101/10101",
  N:"1111/1001/1001/1001/1001", O:"1111/1001/1001/1001/1111",
  P:"1111/1001/1111/1000/1000", Q:"11110/10010/10010/11110/00011",
  R:"1111/1001/1111/1010/1001", S:"1111/1000/1111/0001/1111",
  T:"11111/00100/00100/00100/00100", U:"1001/1001/1001/1001/1111",
  X:"10001/01010/00100/01010/10001", Y:"10001/01010/00100/00100/00100", ".":"0/0/0/0/1", " ":"00/00/00/00/00",
};
function buildLine(line: string) {
  let width = 0;
  const path = new Path2D();
  for (const char of line.toUpperCase()) {
    const [base, accent] = char.normalize("NFD");
    const rows = alphabet[base].split("/");
    rows.forEach((row, y) => {
      for (const run of row.matchAll(/1+/g)) path.rect(width + run.index!, y, run[0].length, 1.007);
    });
    if (accent) {
      path.moveTo(width, -.22); path.lineTo(width + .72, -1.25);
      path.lineTo(width + 1.6, -1.25); path.lineTo(width + .78, -.22); path.closePath();
    }
    width += rows[0].length + .72;
  }
  return { path, width: width - .72 };
}

type Props = {
  scene: 42 | 62;
  clock: AudioContext;
  output: GainNode | null;
  analyser: { current: AnalyserNode | null };
  attack: { current: { count: number; velocity: number; frequency: number } };
  beginsAt: number;
  paused: boolean;
};

export function TypeProjection({scene, clock, output, analyser, attack, beginsAt, paused}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const quiet = scene === 42;
  useEffect(() => {
    if (!quiet || !output) return;
    const envelope = clock.createGain();
    const now = clock.currentTime;
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(.026, now + 1.8);
    envelope.connect(output);
    const voices = [111, 166.5].map(frequency => {
      const osc = clock.createOscillator();
      osc.frequency.value = frequency;
      osc.connect(envelope);
      osc.start();
      return osc;
    });
    return () => {
      const stopAt = clock.currentTime + .12;
      envelope.gain.cancelAndHoldAtTime(clock.currentTime);
      envelope.gain.linearRampToValueAtTime(0, stopAt);
      for (const osc of voices) {
        osc.onended = () => { osc.disconnect(); envelope.disconnect(); };
        osc.stop(stopAt);
      }
    };
  }, [clock, output, quiet]);

  useEffect(() => {
    const el = canvas.current;
    const ink = el?.getContext("2d", {alpha:false});
    if (!el || !ink) return;
    const words = quiet ? passages : climax;
    const plates = words.map(lines => lines.map(buildLine));
    const bins = new Uint8Array(512);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const travel = reduced ? .13 : 1;
    const dwell = quiet ? 14 : 5.5;
    let frame = 0, previous = -1, previousPlate = -1, low = 0, high = 0, onset = 0, pitch = 0;
    let seen = attack.current.count;
    const draw = () => {
      const time = Math.max(0, clock.currentTime - beginsAt);
      const dt = Math.min(.1, Math.max(0, time - previous));
      previous = time;
      const w = el.clientWidth, h = el.clientHeight;
      const dpr = Math.min(devicePixelRatio, 1.7);
      if (el.width !== Math.round(w*dpr) || el.height !== Math.round(h*dpr)) {
        el.width = Math.round(w*dpr); el.height = Math.round(h*dpr);
      }
      ink.setTransform(dpr,0,0,dpr,0,0);
      ink.fillStyle = "#08090c";
      ink.fillRect(0,0,w,h);
      analyser.current?.getByteFrequencyData(bins);
      const bass = ((bins[1]+bins[2]+bins[3]+bins[4])/1020)**2;
      let sheen = 0;
      for (let i=30; i<160; i++) sheen += bins[i];
      low += (bass-low)*(1-Math.exp(-dt*(quiet ? 3 : 14)));
      high += (Math.min(1,sheen/(130*130))-high)*(1-Math.exp(-dt*8));
      if (seen !== attack.current.count) {
        seen = attack.current.count; onset = attack.current.velocity;
        pitch = Math.log2(Math.max(1,attack.current.frequency)/111);
      }
      onset *= Math.exp(-dt*(quiet ? 1.7 : 3.8));
      const force = Math.min(1, low + high*.45 + onset*.7);
      const hue = quiet ? 172 + high*34 + onset*14 : 204 + 103*high + 36*onset + 11*pitch;
      const phase = time*(quiet ? .42 : 1.7);
      const spacing = Math.max(6,Math.min(16,w/95));
      const n = Math.max(1,Math.ceil(h/spacing));
      for(let j=0; j<=n; j++) {
        const depth = j/n;
        const y = h*(.58*depth+.42*depth*depth);
        const step = spacing*(.68+.64*depth);
        const ripple = Math.sin(depth*10-phase);
        const shift = travel*ripple*(quiet ? 1.5+low*3 : 4+force*13);
        const dot = Math.max(1,step*(.12+.055*depth+.05*force));
        ink.fillStyle = `hsl(${hue} ${12+force*40}% ${22+depth*16+9*ripple+high*17}%)`;
        ink.beginPath();
        for(let x=w/2-Math.ceil(w/(2*step)+2)*step; x<w+step; x+=step) {
          const crest = Math.sin((x-w/2)/Math.max(1,w)*9+phase-depth*5);
          ink.rect(x+shift,y+travel*crest*step*(quiet ? .06+low*.14 : .15+force*.65),dot,dot);
        }
        ink.fill();
      }
      const plateIndex = Math.floor(time/dwell)%plates.length;
      const lines = plates[plateIndex];
      if (previousPlate !== plateIndex) {
        el.setAttribute("aria-label",words[plateIndex].join(" ")); previousPlate = plateIndex;
      }
      const maxWidth = Math.max(...lines.map(line=>line.width));
      const cellX = Math.min(w*(quiet ? .76 : .85)/maxWidth, h*.060);
      const cellY = Math.min(h*(quiet ? .46 : .66)/20,cellX*1.85);
      const beatSize = 1+travel*(quiet ? .027 : .11)*low;
      const local = time%dwell;
      const fade = Math.min(1,(local+.15)/(quiet ? 1.15 : .3),(dwell-local)/(quiet ? 1 : .3));
      ink.globalAlpha = .18+.82*Math.max(0,fade);
      lines.forEach((line,index) => {
        const wave = Math.sin(phase+index*1.3);
        const sway = travel*wave*cellX*(quiet ? .06+.23*force : .16+1.7*force);
        ink.save();
        ink.translate(w/2+sway,h/2+(index-1)*cellY*7.4);
        ink.transform(1,0,travel*wave*(quiet ? .013+.016*force : .025+.12*force),1,0,0);
        ink.scale(cellX*beatSize,cellY*(1+(beatSize-1)*1.6));
        ink.translate(-line.width/2,-2.5);
        ink.fillStyle = `hsl(${hue+index*6} 79% ${35+force*21}%)`;
        ink.save(); ink.translate(.11+force*(quiet ? .14 : .56),.14+high*.19); ink.fill(line.path); ink.restore();
        ink.fillStyle = `hsl(${hue+index*6} ${quiet ? 16+high*26 : 22+force*65}% ${96-force*(quiet ? 8 : 23)}%)`;
        ink.fill(line.path);
        ink.restore();
      });
      ink.globalAlpha = 1;
      if (!paused) frame=requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [analyser, attack, beginsAt, clock, paused, quiet]);
  return <canvas className="type-projection" ref={canvas} role="img" aria-label={(quiet ? passages[0] : refrain).join(" ")} />;
}
