import { useEffect, useRef } from "react";
import { useTempo } from "./tempo";

type Sample = { at: number; notes: readonly number[] };
export const createVisualHistory = (): Sample[] => [];
const windowMs = 5000;

export function appendVisualNotes(history: Sample[], notes: readonly number[]) {
  const at = performance.now();
  while (history.length > 1 && history[1].at <= at - windowMs) history.shift();
  history.push({at, notes});
}

const hz = new Intl.NumberFormat("es-AR", {maximumFractionDigits: 2, useGrouping: false});
export function LiveChordTimeline({histories, live, compact = false}: {
  histories: Sample[][]; live: readonly number[]; compact?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const sources = useRef(histories);
  sources.current = histories;
  const {bpm} = useTempo();
  useEffect(() => {
    const node = canvas.current, pen = node?.getContext("2d");
    if (!node || !pen) return;
    let frame = 0;
    const paint = (now: number) => {
      const w = node.clientWidth, h = node.clientHeight;
      const scale = Math.min(devicePixelRatio || 1, 2);
      if (node.width !== Math.round(w*scale) || node.height !== Math.round(h*scale)) {
        node.width = Math.round(w*scale); node.height = Math.round(h*scale);
      }
      pen.setTransform(scale,0,0,scale,0,0);
      pen.clearRect(0,0,w,h);
      const x = (at:number) => w*(1+(at-now)/windowMs);
      const beat = 60000/bpm;
      pen.fillStyle = "#524564";
      for(let t=Math.ceil((now-windowMs)/beat)*beat;t<=now;t+=beat) pen.fillRect(x(t),0,1,h);
      for(const history of sources.current) {
        while(history.length>1 && history[1].at<=now-windowMs) history.shift();
        for(let i=0;i<history.length;i++){
          const {at, notes}=history[i], end=history[i+1]?.at ?? now;
          if(end<now-windowMs) continue;
          for(const frequency of notes){
            const pitch=Math.log2(frequency/111);
            const y=9+(h-20)*(1-Math.min(1,Math.max(0,(pitch+2)/9)));
            const left=Math.max(0,x(at));
            pen.fillStyle="hsl("+((pitch*87+220)%360)+" 90% 77%)";
            pen.fillRect(left,y,Math.max(2,x(end)-left),2);
            if(x(end)-left>28) pen.fillText(hz.format(frequency),left+2,y-2);
          }
        }
      }
      frame=requestAnimationFrame(paint);
    };
    frame=requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  },[bpm]);
  const sounding = live.length ? live.map(n=>hz.format(n)).join(", ")+" Hz" : "Silencio";
  return <div className={"zero-loop-timeline"+(compact?" extended-loop-timeline":"")} role="group" aria-label="Frecuencias y silencios en el tiempo">
    <div className="zero-loop-readout"><div><span>Sonando</span><span data-loop-sounding>{sounding}</span></div></div>
    <div className="zero-loop-plot"><canvas ref={canvas} aria-hidden="true" style={{width:"100%",height:"100%",display:"block"}} /></div>
  </div>;
}
