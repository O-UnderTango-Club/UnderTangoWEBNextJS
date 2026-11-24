import { useEffect, useRef } from "react";
import { AudienceProjection } from "./audience-projection";
import { useTempo } from "./tempo";
import { ResonantVisuals } from "./resonant-visuals";
import { useProjectionSignals } from "./projection-signals";
import { StimulusBar } from "./stimulus-bar";

type MeterRef = {current: AnalyserNode | null};
type LiveSetProps = {
  scene: number;
  title: string;
  analyser: MeterRef;
  paused: boolean;
  meter: number;
  bars: number;
  bpm: number;
  position: number;
  recording: boolean;
  waiting: boolean;
  countIn: number | null;
  canCountRecord: boolean;
  onCountRecord: () => void;
  room: boolean;
  roomBusy: boolean;
  onRoom: () => void;
};

function SoundDrawing({scene, analyser, paused, bpm}: Pick<LiveSetProps,"scene"|"analyser"|"paused"|"bpm">) {
  const surface = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = surface.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || paused) return;
    const bins = new Uint8Array(512), wave = new Uint8Array(1024);
    wave.fill(128);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0, previous = -100, low = 0;
    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      if (now - previous < (reduceMotion ? 95 : 32)) return;
      previous = now;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5, 1600/w);
      const pixelsW = Math.max(1, Math.round(w*scale)), pixelsH = Math.max(1, Math.round(h*scale));
      if (canvas.width !== pixelsW || canvas.height !== pixelsH) {canvas.width = pixelsW; canvas.height = pixelsH;}
      ctx.setTransform(pixelsW/w,0,0,pixelsH/h,0,0);
      const node = analyser.current;
      if (node) {node.getByteFrequencyData(bins);node.getByteTimeDomainData(wave);}
      else {bins.fill(0);wave.fill(128);}
      low += (((bins[1]+bins[2]+bins[3]+bins[4])/1020)-low)*.32;
      const phase = node && !reduceMotion ? node.context.currentTime*bpm/60 : 0;
      ctx.clearRect(0,0,w,h);
      const cyan = scene < 40, tango = scene >= 80;
      const hue = cyan ? 151 + (scene-32)*7 : tango ? 30 : 177 + ((scene-63)*17)%110;
      const color = (alpha: number, shift=0) => "hsla("+((hue+shift)%360)+",78%,68%,"+alpha+")";
      if (scene >= 70 && scene <= 79) {
        const centerY = h*.52, span = Math.hypot(w,h)*.57;
        const points = 6 + (scene-70)%4;
        const rotation = phase*.032;
        for(let ring=0; ring<24; ring++){
          const depth = ((ring + (phase*.38)%1)/24);
          const radius = span*depth*depth;
          ctx.beginPath();
          for(let point=0;point<=points;point++) {
            const angle = 2*Math.PI*(point%points)/points + rotation + depth*(1.4+low*.3);
            const v = bins[2 + (point%points)*5 + ring]/255;
            const reach = radius*(1+.18*v);
            const x = w*.5 + Math.cos(angle)*reach, y = centerY + Math.sin(angle)*reach*.83;
            if (point===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
          }
          ctx.strokeStyle = color(.17+depth*.45+low*.16,ring*2.5);
          ctx.lineWidth = .7 + depth*1.5;
          ctx.stroke();
        }
      } else if(tango && scene < 88) {
        // The paired diagonals open like the bellows of a bandoneon.
        const folds = 19, width = w*(.61+.19*low);
        for(let k=0; k<=folds; k++){
          const x = w/2-width/2+width*k/folds;
          const band = bins[2+k*3]/255, inset = Math.sin(k/folds*Math.PI)*h*.11;
          const top = h*.28-inset-band*h*.08, bottom=h*.83+inset*.5;
          ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);
          if(k<folds)ctx.lineTo(x+width/folds,top);
          ctx.lineWidth = k%2===0?1.7:.8; ctx.strokeStyle=color(.25+band*.65,k*.7);ctx.stroke();
        }
      } else {
        const quiet = scene >= 88;
        const baseY = quiet ? h*.64 : cyan ? h*.67 : h*.53;
        const bands = quiet ? 1 : cyan ? 7 : 20;
        for(let band=0; band<bands; band++){
          const y = baseY+(band-(bands-1)/2)*(cyan ? h*.026 : h*.032);
          ctx.beginPath();
          for(let i=0;i<=180;i++){
            const fraction=i/180, x=w*fraction;
            const sample=(wave[Math.min(wave.length-1,Math.floor((i*4+band*13)%wave.length))]-128)/128;
            const bin=bins[1+Math.min(199,Math.floor(fraction*fraction*199))]/255;
            const arc=Math.sin(fraction*Math.PI);
            const offset= quiet ? sample*h*.32 : cyan
              ? (sample*.36 - bin*(1-band/bands))*h*.21*arc
              : (sample*.2+bin*Math.sin(fraction*Math.PI*4+band*.35+phase*.13))*h*.22*arc;
            if(i===0)ctx.moveTo(x,y+offset);else ctx.lineTo(x,y+offset);
          }
          ctx.lineWidth = quiet ? 1.4 : .9;
          ctx.strokeStyle = quiet ? (scene===88 ? "#c9b8a0" : "#9fabae") : color(.21+.46*(1-band/bands),band*1.9);
          ctx.stroke();
        }
      }
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  },[analyser,bpm,paused,scene]);
  return <canvas ref={surface} className="live-set-drawing" aria-hidden="true" />;
}

const style = `
.zero-stage:has(>.live-set) {display:grid;grid-template-rows:minmax(0,1fr) fit-content(50%);background:#080a11 !important;}
.zero-stage:has(>.live-set) > .scene-mixer {position:relative;grid-row:2;width:100%;max-height:100%;}
.zero-stage:has(>.live-set) .zero-scene-number {color:#e6e7e9;}
.live-set {position:relative;grid-row:1;width:100%;height:100%;min-height:0;overflow:hidden;isolation:isolate;container-type:size;color:#e3eceb;background:radial-gradient(ellipse at 58% 67%,#142025 0,#0b1116 52%,#06080b 95%);font-family:inherit;}
.live-set[data-family=psy] {background:radial-gradient(ellipse at 50% 52%,#1d1029 0,#0c101b 47%,#06070c 95%);}
.live-set[data-family=tango] {color:#f0dfcb;background:radial-gradient(ellipse at 50% 53%,#2c1d1a,#0e0b0c 72%);}
.live-set[data-family=cierre] {color:#e0d6c5;background:#0e0e10;}
.live-set .live-set-drawing,.live-set>.audience-projection {position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}
.live-set>.audience-projection button {pointer-events:auto;}
.live-set-heading {position:absolute;left:clamp(1.5rem,7%,7rem);top:clamp(2.6rem,12%,6.5rem);max-width:85%;color:inherit;font-size:clamp(1.7rem,5.6cqw,5.4rem);line-height:1.02;letter-spacing:-.035em;}
.live-set[data-scene="68"] .live-set-heading {top:auto;bottom:4%;font-size:clamp(1rem,2.4cqw,2rem);background:#070b10d9;padding:.18em .35em;}
.live-set[data-resonant] .live-set-heading {top:auto;bottom:clamp(.7rem,3%,2rem);left:clamp(.7rem,3%,2rem);max-width:52%;font-size:clamp(.86rem,1.55cqw,1.45rem);text-shadow:0 1px 5px #000,0 1px 12px #000;pointer-events:none;}
.live-set-center {position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:clamp(.2rem,1.25cqh,1rem);text-align:center;pointer-events:none;}
.live-set-center strong {font-family:system-ui,sans-serif;font-size:clamp(3rem,min(30cqh,24cqw),12rem);line-height:.94;letter-spacing:-.06em;font-weight:650;font-variant-numeric:tabular-nums;color:#eefff9;}
.live-set-center small,.live-set-count {font:500 clamp(.72rem,1.8cqw,1rem)/1.3 system-ui,sans-serif;}
.live-set-count {border:1px solid #909f9a;background:#0b1315d9;color:#e7f2ed;border-radius:3px;padding:.4em .85em;pointer-events:auto;cursor:pointer;}
.live-set-count:disabled {opacity:.6;cursor:default;}
.live-beats {display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.42rem;max-width:85%;}
.live-beats span {display:flex;gap:3px;padding-right:.36rem;border-right:1px solid #637070;}
.live-beats span:last-child {padding:0;border:0;}
.live-beats i {width:clamp(4px,.62cqw,9px);height:4px;background:#647372;}
.live-beats i[data-active=true] {background:#b5ffdc;box-shadow:0 0 7px #77ffc4;}
.live-set-note {position:absolute;left:clamp(1.5rem,7%,7rem);top:clamp(5.5rem,30%,15rem);font:400 clamp(.85rem,2.1cqw,1.4rem)/1.3 system-ui,sans-serif;}
.live-set-tempo {position:absolute;bottom:clamp(.55rem,3%,1.5rem);right:clamp(.65rem,3%,2rem);display:flex;align-items:center;gap:.5rem;font:500 .78rem/1.15 system-ui,sans-serif;font-variant-numeric:tabular-nums;}
.live-set-tempo .live-set-count {font-size:inherit;}
@container(max-height:250px){.live-set-heading{top:1.5rem;font-size:1.45rem;}.live-set-center{gap:.22rem;}.live-set-center strong{font-size:3rem;}}
`;

export function LiveSetProjection(props: LiveSetProps) {
  const {scene,title,analyser,paused,meter,bars,bpm,position,countIn} = props;
  const {setBpm,locked} = useTempo();
  const signals=useProjectionSignals();
  const resonant=scene===44 || scene===54 || scene===78;
  const suggestedBpm = scene>=70 && scene<=79 ? 144 : scene>=80 && scene<=87 ? 112 : null;
  const layers = scene >= 32 && scene <= 39;
  const family = scene >= 88 ? "cierre" : scene >= 80 ? "tango" : scene >= 70 ? "psy" : layers ? "capas" : "estilos";
  const pulse = position%meter+1, bar = Math.floor(position/meter)+1;
  return <div className="live-set" data-scene={scene} data-family={family} data-resonant={resonant || undefined} role="group" aria-label={title}>
    <style>{style}</style>
    {scene===68 ? <AudienceProjection analyser={analyser} paused={paused} treatment="ascii" />
      : resonant ? <ResonantVisuals scene={scene} signals={signals} paused={paused} />
      : <SoundDrawing scene={scene} analyser={analyser} paused={paused} bpm={bpm} />}
    {scene!==68 && <StimulusBar scene={scene} paused={paused} room={scene===89 && props.room} />}
    <div className="live-set-heading">{scene===88 ? "El último café" : title}</div>
    {layers && <div className="live-set-center">
      <strong aria-label={countIn!==null ? "Cuenta de entrada "+countIn : "Pulso "+pulse}>{countIn ?? pulse}</strong>
      <small>{countIn!==null ? "Cuenta de entrada" : (props.recording ? "Grabando · " : props.waiting ? "En espera · " : "")+"Compás "+bar+" / "+bars} · {bpm} BPM</small>
      <div className="live-beats" aria-hidden="true">{Array.from({length:bars},(_,b)=><span key={b}>{Array.from({length:meter},(_,p)=><i key={p} data-active={b*meter+p===position}/>)}</span>)}</div>
      <button type="button" className="live-set-count" onClick={props.onCountRecord} disabled={!props.canCountRecord || countIn!==null || paused}>● Grabar con cuenta</button>
    </div>}
    {scene===88 && <div className="live-set-note">Piano y voz</div>}
    {scene===89 && <div className="live-set-note">
      <button type="button" className="live-set-count" disabled={props.roomBusy} aria-pressed={props.room} onClick={props.onRoom}>
        {props.room ? "Desactivar micrófono de sala" : "Activar micrófono de sala"}
      </button>
    </div>}
    {suggestedBpm!==null && <div className="live-set-tempo">
      <span>{bpm} BPM</span>
      {bpm!==suggestedBpm && <button type="button" className="live-set-count" disabled={locked}
        onClick={()=>setBpm(suggestedBpm)}>Usar {suggestedBpm} BPM</button>}
    </div>}
  </div>;
}
