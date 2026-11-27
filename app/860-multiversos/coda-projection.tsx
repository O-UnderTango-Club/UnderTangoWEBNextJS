import {useEffect,useState,type CSSProperties,type ReactNode} from "react";
import {atmosphereLabel, INKS, isRound, questionFor, remainingSeconds, ROUNDS, winnerLabel} from "./coda-ballot";
import type {useHostedBallot} from "./coda-host";
import {StimulusBar} from "./stimulus-bar";
import {hasReferenceVisual, ReferenceVisual} from "./reference-visuals";
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
.zero-stage:has(>.coda-stage){background:#05060a!important;}
.zero-stage:has(>.coda-stage) .zero-scene-number{color:#ede9df;}
.coda-stage{container-type:size;isolation:isolate;position:relative;grid-row:1;min-height:0;height:100%;width:100%;overflow:hidden;color:#f0ede8;background:#06080c;}
.coda-field{position:absolute;inset:0;opacity:var(--coda-light);transition:opacity 2s;overflow:hidden;}
.coda-field::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 72% 67%,color-mix(in srgb,var(--coda-color) 33%, transparent),transparent 68%);}
.coda-wave{position:absolute;left:65%;top:68%;width:75cqw;height:36cqh;border:1.4px solid var(--coda-color);border-radius:50%;transform:translate(-50%,-50%);filter:drop-shadow(0 0 4px var(--coda-color));animation:coda-ripple var(--coda-period) linear infinite;}
@keyframes coda-ripple{from{transform:translate(-50%,-50%) scale(.08);opacity:.8}to{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
.coda-copy{position:absolute;left:8%;bottom:18%;right:8%;display:grid;gap:clamp(8px,2cqh,18px);}
.coda-stage h2,.coda-stage p{margin:0;color:inherit;}
.coda-stage h2{font-family:inherit;font-weight:400;line-height:1.04;letter-spacing:-.035em;font-size:clamp(1.8rem,6.3cqw,6.9rem);}
.coda-stage small,.coda-stage p{font:500 clamp(.8rem,1.75cqw,1.5rem)/1.45 system-ui,sans-serif;}
.coda-meta{color:var(--coda-color);}
.coda-invite{position:absolute;inset:9% 7%;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.85fr);align-items:center;gap:6%;}
.coda-invite[data-has-qr=false]{grid-template-columns:minmax(0,1fr);}
.coda-ballot-copy{min-width:0;display:grid;gap:clamp(6px,2.6cqh,21px);}
.coda-qr{display:block;width:min(100%,65cqh,34vw);background:white;justify-self:center;line-height:0;border:5px solid white;border-radius:3px;}
.coda-qr img{width:100%;aspect-ratio:1;object-fit:contain;image-rendering:pixelated;}
.coda-finish{color:#aaa7a2;}
@media(prefers-reduced-motion:reduce){.coda-wave{animation:none;opacity:.3;transform:translate(-50%,-50%) scale(.85)}}
@container(max-width:430px){.coda-invite{inset:17% 5% 6%;gap:3%;grid-template-columns:1fr 1fr;}.coda-stage h2{font-size:clamp(1.4rem,7cqw,2.1rem)}.coda-qr{width:min(100%,48cqh);}}
`;
const motionSeconds={movido:5.2,tranquilo:13,romantico:9.3} as const;
type Props={ballot:ReturnType<typeof useHostedBallot>;scene:number;clock:AudioContext;beginsAt:number;duration:number;output:GainNode|null;paused:boolean;routing:{current:PerformanceInput|null};filmLayer:ReactNode};
export function CodaProjection(props:Props) {
  const {scene,paused}=props;
  const {session,state,atmosphere,issue,clockOffset}=props.ballot;
  const [,redraw]=useState(0);
  useEffect(()=>{
    if(!state?.open)return;
    const timer=window.setInterval(()=>redraw(n=>n+1),300);
    return ()=>clearInterval(timer);
  },[state?.open]);
  useCodaInstrument(scene,atmosphere,props.output,paused,props.routing);
  const period=motionSeconds[atmosphere.groove];
  const question=questionFor(scene);
  const title=SHOW_SCORE.find(cue=>cue.number===scene)?.title;
  const invite=scene<=ROUNDS[0] || isRound(scene);
  const vote=state?.scene===scene && isRound(scene);
  const seconds=state && vote ? remainingSeconds(state,clockOffset) : 0;
  const currentResult=state && state.scene!==null && scene===state.scene+1 && !state.open;
  const direction=scene===101 ? ({azul:-1, ambar:1, violeta:0} as const)[atmosphere.color] : undefined;
  const result=state?.winner && winnerLabel(state.scene,state.winner);
  const label=atmosphereLabel(atmosphere);
  const credit=credits[scene];
  const join=session && scene<=ROUNDS[0]?"/860-multiversos/votar?s="+session:null;
  return <div className="coda-stage" data-reference-ballot={isRound(scene) || undefined} data-scene={scene} data-color={atmosphere.color} data-sound={atmosphere.sound} data-groove={atmosphere.groove}
    style={{"--coda-color":INKS[atmosphere.color],"--coda-period":period+"s","--coda-light":.06+.68*((111-scene)/21)} as CSSProperties}>
    <style>{style}</style>
    {props.filmLayer}
    {hasReferenceVisual(scene) &&
      <ReferenceVisual scene={scene} clock={props.clock} beginsAt={props.beginsAt} duration={props.duration}
        paused={paused} choice={{color:INKS[atmosphere.color],direction}}/>}
    <StimulusBar scene={scene} paused={paused} ballot={state && (!isRound(scene) || vote) ? {
      open:vote && state.open, total:state.total,
      choice:state.open ? null : label,
    } : null} />
    <div className="coda-field" aria-hidden="true">{Array.from({length:5},(_,i)=><i key={i} className="coda-wave" style={{animationDelay:(-i*period/5)+"s",animationPlayState:paused?"paused":"running"}}/>)}</div>
    {invite?<div className="coda-invite" data-has-qr={!!join}>
      <div className="coda-ballot-copy">
        <small className="coda-meta">{isRound(scene)?`Votación ${ROUNDS.indexOf(scene)+1} de ${ROUNDS.length}`:"La elección del público"}</small>
        <h2>{question?.title??title}</h2>
        <p>{issue?"La votación está sin conexión. Reintentando…":!session?"Preparando la votación…":
          vote&&seconds>0?`${join?"Escaneá una vez y votá":"Votá en la misma página"} · ${seconds} s`:vote?"Ronda cerrada":question?"Abriendo la ronda…":"Escaneá una vez y dejá la página abierta."}</p>
        {vote && state && <small>{state.total} {state.total===1?"voto":"votos"}</small>}
      </div>
      {join && <a className="coda-qr" href={join} target="_blank" rel="noreferrer" aria-label="Abrir votación del público">
        <img src={"/860-multiversos/votar/qr?s="+session} alt="QR de votación de esta función" width={330} height={330}/>
      </a>}
    </div>:<div className={"coda-copy"+(scene>=109?" coda-finish":"")}>
      {credit && <small className="coda-meta">{credit[0]}</small>}
      <h2>{credit?credit[1]:title}</h2>
      {currentResult && <p>{result?`La sala eligió ${result} · ${state.total} ${state.total===1?"voto":"votos"}`:"Ronda sin votos · continúa la atmósfera"}</p>}
      {scene===101 && <small className="coda-meta">{label}</small>}
    </div>}
  </div>;
}
