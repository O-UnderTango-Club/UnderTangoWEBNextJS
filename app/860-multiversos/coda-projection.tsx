import {useEffect,useState,type CSSProperties} from "react";
import {INKS, isRound, PALETTES, remainingSeconds, TIMBRES} from "./coda-ballot";
import {useHostedBallot} from "./coda-host";
import {useCodaInstrument} from "./coda-audio";
import {SHOW_SCORE} from "./show-score";
import type {PerformanceInput} from "./performance-notes";

const credits:Record<number,[string,string]> = {
  105:["Dirección e interpretación","Pablo Cieslik"],
  106:["Producción","Ø UnderTango Club"],
  107:["Gracias por recibirnos","La Cabaña de los Muñecos"],
  108:["A quienes escucharon y eligieron","Gracias"],
};
const style = `
.zero-stage:has(>.coda-stage){display:grid;grid-template-rows:minmax(0,1fr) fit-content(50%);background:#05060a!important;}
.zero-stage:has(>.coda-stage)>.scene-mixer{position:relative;grid-row:2;width:100%;max-height:100%;}
.zero-stage:has(>.coda-stage) .zero-scene-number{color:#ede9df;}
.coda-stage{container-type:size;isolation:isolate;position:relative;grid-row:1;min-height:0;height:100%;width:100%;overflow:hidden;color:#f0ede8;background:#06080c;}
.coda-field{position:absolute;inset:0;opacity:var(--coda-light);transition:opacity 2s;overflow:hidden;}
.coda-field::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 72% 67%,color-mix(in srgb,var(--coda-color) 33%, transparent),transparent 68%);}
.coda-wave{position:absolute;left:65%;top:68%;width:75cqw;height:36cqh;border:1.4px solid var(--coda-color);border-radius:50%;transform:translate(-50%,-50%);filter:drop-shadow(0 0 4px var(--coda-color));animation:coda-ripple 13s linear infinite;}
@keyframes coda-ripple{from{transform:translate(-50%,-50%) scale(.08);opacity:.8}to{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
.coda-copy{position:absolute;left:8%;bottom:18%;right:8%;display:grid;gap:clamp(8px,2cqh,18px);}
.coda-stage h2,.coda-stage p{margin:0;color:inherit;}
.coda-stage h2{font-family:inherit;font-weight:400;line-height:1.04;letter-spacing:-.035em;font-size:clamp(1.8rem,6.3cqw,6.9rem);}
.coda-stage small,.coda-stage p{font:500 clamp(.8rem,1.75cqw,1.5rem)/1.45 system-ui,sans-serif;}
.coda-meta{color:var(--coda-color);}
.coda-invite{position:absolute;inset:9% 7%;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.85fr);align-items:center;gap:6%;}
.coda-ballot-copy{min-width:0;display:grid;gap:clamp(6px,2.6cqh,21px);}
.coda-qr{display:block;width:min(100%,65cqh,34vw);background:white;justify-self:center;line-height:0;border:5px solid white;border-radius:3px;}
.coda-qr img{width:100%;aspect-ratio:1;object-fit:contain;image-rendering:pixelated;}
.coda-finish{color:#aaa7a2;}
@media(prefers-reduced-motion:reduce){.coda-wave{animation:none;opacity:.3;transform:translate(-50%,-50%) scale(.85)}}
@container(max-width:430px){.coda-invite{inset:17% 5% 6%;gap:3%;grid-template-columns:1fr 1fr;}.coda-stage h2{font-size:clamp(1.4rem,7cqw,2.1rem)}.coda-qr{width:min(100%,48cqh);}}
`;
type Props={scene:number;clock:AudioContext;beginsAt:number;duration:number;output:GainNode|null;paused:boolean;routing:{current:PerformanceInput|null}};
export function CodaProjection(props:Props) {
  const {scene,paused}=props;
  const {session,state,colorSound,issue,clockOffset}=useHostedBallot(props);
  const [,redraw]=useState(0);
  useEffect(()=>{
    if(!state?.open)return;
    const timer=window.setInterval(()=>redraw(n=>n+1),300);
    return ()=>clearInterval(timer);
  },[state?.open]);
  const selection=colorSound??{color:"azul",sound:"aire"};
  useCodaInstrument(scene,selection.sound,props.clock,props.output,paused,props.routing);
  const title=SHOW_SCORE.find(cue=>cue.number===scene)?.title;
  const invite=scene<=100 && (scene<=92 || isRound(scene) || scene===95 || scene===99);
  const vote=state?.scene===scene && isRound(scene);
  const seconds=state && vote ? remainingSeconds(state,clockOffset) : 0;
  const currentResult=state && state.scene!==null && scene===state.scene+1 && !state.open;
  const credit=credits[scene];
  const join=session?"/860-multiversos/votar?s="+session:null;
  return <div className="coda-stage" data-scene={scene} data-color={selection.color} data-sound={selection.sound}
    style={{"--coda-color":INKS[selection.color],"--coda-light":.06+.68*((111-scene)/21)} as CSSProperties}>
    <style>{style}</style>
    <div className="coda-field" aria-hidden="true">{Array.from({length:5},(_,i)=><i key={i} className="coda-wave" style={{animationDelay:(-i*2.6)+"s",animationPlayState:paused?"paused":"running"}}/>)}</div>
    {invite?<div className="coda-invite">
      <div className="coda-ballot-copy">
        <small className="coda-meta">{isRound(scene)?`Votación ${[92,96,100].indexOf(scene)+1} de 3`:"La elección del público"}</small>
        <h2>{isRound(scene)?"Color y sonido":title}</h2>
        <p>{issue?"La votación está sin conexión. Reintentando…":!session?"Preparando la votación…":
          vote&&seconds>0?`Escaneá y elegí · ${seconds} s`:vote?"Ronda cerrada":isRound(scene)?"Abriendo la ronda…":"Escaneá para participar desde tu teléfono."}</p>
        {vote && state && <small>{state.total} {state.total===1?"voto":"votos"}</small>}
      </div>
      {join && <a className="coda-qr" href={join} target="_blank" rel="noreferrer" aria-label="Abrir votación del público">
        <img src={"/860-multiversos/votar/qr?s="+session} alt="QR de votación de esta función" width={330} height={330}/>
      </a>}
    </div>:<div className={"coda-copy"+(scene>=109?" coda-finish":"")}>
      {credit && <small className="coda-meta">{credit[0]}</small>}
      <h2>{credit?credit[1]:title}</h2>
      {currentResult && <p>{state.winner?`${PALETTES[state.winner.color]} · ${TIMBRES[state.winner.sound]} · ${state.total} ${state.total===1?"voto":"votos"}`:"Ronda sin votos · continúa la atmósfera"}</p>}
    </div>}
  </div>;
}
