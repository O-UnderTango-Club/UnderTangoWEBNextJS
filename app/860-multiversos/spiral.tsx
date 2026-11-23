import { useEffect, useRef } from "react";

export function SpiralProjection({scene,clock,notes,attack,analyser}:{analyser:{current:AnalyserNode|null};attack:{current:{count:number;frequency:number;velocity:number}};scene:number;clock:AudioContext;notes:number[]}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const pitches=useRef(notes);
  useEffect(()=>{pitches.current=notes;},[notes]);
  useEffect(()=>{
    const surface=canvas.current;
    const ctx=surface?.getContext("2d");
    if(!surface || !ctx) return;
    let frame=0, phase=0, energy=0, last=clock.currentTime, previous="", seen=attack.current.count;
    const waveform=new Float32Array(1024);
    const spectrum=new Uint8Array(512);
    let loudness=0,brightness=0;
    const rings:number[]=[];
    const paint=()=>{
      const w=surface.clientWidth,h=surface.clientHeight,d=Math.min(devicePixelRatio,2);
      if(surface.width!==Math.round(w*d)||surface.height!==Math.round(h*d)){surface.width=Math.round(w*d);surface.height=Math.round(h*d);}
      ctx.setTransform(d,0,0,d,0,0);
      const time=clock.currentTime,dt=Math.min(.1,time-last);last=time;
      const keys=pitches.current, signature=keys.join(",");
      if(seen!==attack.current.count || (signature!==previous && keys.length)){energy=Math.max(.4,attack.current.velocity);if(scene===31)rings.push(time);} seen=attack.current.count;previous=signature;
      energy*=Math.exp(-dt*1.8);
      const meter=scene===45 && analyser.current;
      if(meter && dt>0){
        meter.getFloatTimeDomainData(waveform);
        meter.getByteFrequencyData(spectrum);
        let power=0,total=0,weighted=0;
        for(const sample of waveform)power+=sample*sample;
        for(let i=1;i<spectrum.length;i++){
          const weight=(spectrum[i]/255)**3;
          total+=weight;weighted+=weight*i;
        }
        const rms=Math.sqrt(power/waveform.length);
        const target=Math.min(1,Math.sqrt(Math.max(0,rms-.0008)*4));
        loudness+=(target-loudness)*(1-Math.exp(-dt*(target>loudness?28:6)));
        brightness=total ? Math.min(1,Math.log2(1+weighted/total)/6):0;
      }
      phase+=dt*(.48+loudness*2.4+energy*1.8+Math.min(keys.length,8)*.08);
      ctx.fillStyle=scene===45?"#fff":"#160f25";ctx.fillRect(0,0,w,h);
      const cell=Math.max(7,Math.min(w,h)/32), bound=Math.hypot(w,h)/2;
      if(scene===45){
        const pitch=keys.length?Math.log2(1+Math.max(...keys)/111):Math.log2(1+attack.current.frequency/111);
        for(let i=0;i<Math.ceil(((bound/cell+2)/.51)**2);i++){
          const a=Math.sqrt(i)*.51,r=cell*a*(1+.26*loudness+.22*energy);
          if(r>bound+cell)break;
          const theta=a-phase+Math.sin(a*.5-phase)*(.32*energy+.20*loudness);
          const x=Math.round((w/2+r*Math.cos(theta))/cell)*cell,y=Math.round((h/2+r*Math.sin(theta))/cell)*cell;
          const colored=Math.sin(a*7+pitch+brightness*4)>.1-.4*loudness;
          ctx.fillStyle=colored ? (loudness>.015 || energy>.04 ? `hsl(${318+brightness*36} 85% ${56+13*energy}% )` : "#ed43ba") : "#111016";
          const width=cell*(1+.65*loudness+.35*energy)-.5;
          ctx.fillRect(x,y,width,width);
          ctx.fillStyle="#fff";ctx.font=(cell*.55)+"px monospace";ctx.fillText(["0","#","Ø","∞"][i%4],x+1,y+cell*.76);
        }
      }else{
        while(rings.length && time-rings[0]>5)rings.shift();
        for(const age of [time%5,...rings.map(t=>time-t)]){
          ctx.strokeStyle="rgba(224,161,255,"+Math.max(0,1-age/5)+")";ctx.lineWidth=1+energy*3;ctx.beginPath();ctx.arc(w/2,h/2,2+age*bound/5,0,2*Math.PI);ctx.stroke();
        }
      }
      frame=requestAnimationFrame(paint);
    };paint();return ()=>cancelAnimationFrame(frame);
  },[clock,scene,attack,analyser]);
  return <canvas className="extended-generative" ref={canvas} role="img" aria-label={scene===45?"Espiral expansiva de celdas negras y fucsias":"Ondas concéntricas reactivas"} />;
}
