import {useEffect, useRef} from "react";
import {useProjectionSignals} from "./projection-signals";

const rhythm = {
  34: [[0,4,8,12],[4,12],[2,6,10,14]],
  64: [[0,4,8,12],[4,12],[2,6,10,14]],
  66: [[0,4,8,11,14],[4,12],[0,2,4,6,8,10,12,14]],
  67: [[0,3,6,10],[4,12],[0,2,4,6,8,10,12,14]],
  72: [[0,4,8,12],[3,6,11,14],[0,2,4,6,8,10,12,14]],
} as const;

export const REFERENCE_VISUALS = {
  31:"Anillos ópticos y puntos concéntricos",
  34:"El compás se dibuja por capas",
  41:"Silueta en contraluz y halo de colores",
  45:"Espiral óptica de discos",
  51:"Retícula de calor",
  52:"Disco de tramas desplazadas",
  54:"Muaré de dos discos rayados",
  58:"Primeras brasas",
  59:"Ascenso del fuego",
  60:"Ignición y brasas",
  62:"Para seguir de pie… seguí de pie",
  64:"Geometría del pulso House",
  66:"Pentágono Jersey Club",
  67:"Polígono asimétrico Detroit",
  72:"Síncopa en el círculo",
  89:"El registro de sala se funde a negro",
  91:"El giro de la carta",
  92:"Manual de causa y efecto cerrado",
  93:"Se abre el Manual de causa y efecto",
  96:"Rostro antes de la elección",
  97:"El mismo rostro cambia al recibir el eco",
  100:"El Carro espera la elección",
  101:"El Carro toma una dirección",
  104:"La Torre se agrieta y queda un punto",
} as const;
export type ReferenceScene=keyof typeof REFERENCE_VISUALS;
export function hasReferenceVisual(scene:number|null):scene is ReferenceScene {
  return scene!==null && Object.prototype.hasOwnProperty.call(REFERENCE_VISUALS,scene);
}

const turn=Math.PI*2;
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const rise=(n:number)=>{ const x=clamp(n); return x*x*(3-2*x); };
const grain=(i:number)=>{const n=Math.sin(i*91.71+27.13)*43758.5453;return n-Math.floor(n);};
const ink=["#efba6c","#f684aa","#72d6e5"];
type Drawing=CanvasRenderingContext2D;
type Color="#78c4ef"|"#f7c378"|"#b29bed";
type Frame={t:number;p:number;b:number;low:number;mid:number;high:number;hit:number;reduced:boolean};
type Choice={color:Color;direction?:-1|0|1};
const circle=(g:Drawing,x:number,y:number,r:number)=>{g.beginPath();g.arc(x,y,r,0,turn);};
function line(g:Drawing,points:readonly (readonly [number,number])[],closed=false) {
  g.beginPath();
  points.forEach(([x,y],i)=>i ? g.lineTo(x,y) : g.moveTo(x,y));
  if(closed)g.closePath();
}
function label(g:Drawing,text:string,y:number,size:number,color:string,width:number,serif=false) {
  g.font=`650 ${size}px ${serif ? "Georgia, serif" : "system-ui, sans-serif"}`;
  g.fillStyle=color;g.textAlign="center";g.textBaseline="middle";g.fillText(text,0,y,width);
}

function drawRhythm(g:Drawing,scene:keyof typeof rhythm,f:Frame,r:number) {
  const step=(f.b%4)*4, angle=(n:number)=>n*turn/16-Math.PI/2;
  const point=(n:number,radius:number):[number,number]=>[Math.cos(angle(n))*radius,Math.sin(angle(n))*radius];
  const bands=[f.low,f.mid,f.high];
  const outer=r*.90;
  for(let i=0;i<16;i++){
    const [x,y]=point(i,outer);
    circle(g,x,y,i%4===0 ? 2.8 : 1.5);
    g.fillStyle=i%4===0 ? "#afc7c9" : "#516467";g.fill();
  }
  const radii=[r*.43,r*.64,r*.83];
  const groups=rhythm[scene];
  groups.forEach((steps,index)=>{
    const shown=scene===34 ? rise((f.p-index*.18)*7) : 1;
    if(!shown)return;
    const radius=radii[index], color=ink[index];
    circle(g,0,0,radius);g.strokeStyle=color;g.globalAlpha=.17*shown;g.lineWidth=1;g.stroke();
    const vertices=steps.map(n=>point(n,radius));
    g.globalAlpha=.14*shown;
    line(g,vertices,steps.length>2);g.fillStyle=color;if(steps.length>2)g.fill();
    g.globalAlpha=(.56+.36*bands[index])*shown;g.lineWidth=1.6;g.stroke();
    steps.forEach((n,i)=>{
      const elapsed=(step-n+16)%16;
      const accent=Math.exp(-elapsed*4)*(.62+.38*bands[index]);
      const [x,y]=vertices[i];
      circle(g,x,y,3.1+accent*7);g.fill();
      if(accent>.02){
        g.globalAlpha=accent*.35*shown;circle(g,x,y,9+accent*14);g.fill();
        g.globalAlpha=(.56+.36*bands[index])*shown;
      }
    });
  });
  g.globalAlpha=.76;g.strokeStyle="#eefaf1";g.lineWidth=1;
  line(g,[[0,0],point(f.reduced ? Math.floor(step/4)*4 : step,outer)]);g.stroke();
  circle(g,0,0,3.2);g.fillStyle="#ecfff9";g.fill();
}

function drawOptics(g:Drawing,scene:31|45|52|54,f:Frame,r:number) {
  if(scene===31||scene===45){
    const spiral=scene===45;
    for(let band=0;band<6;band++){
      const base=r*(.21+band*.135)*(1+f.low*.13);
      const count=12+band*5;
      const spin=(f.reduced ? .14 : 1)*f.t*(band%2 ? -.24 : .24)/(1+band*.16);
      if(!spiral){
        circle(g,0,0,base);g.strokeStyle="#81c9c875";g.lineWidth=1;g.stroke();
      }
      for(let j=0;j<count;j++){
        const a=j/count*turn+spin+band*.35;
        const offset=spiral ? Math.sin(a*2+band*.9-f.t*.65)*r*.042 : 0;
        const dot=(.025+band*.004)*r;
        const x=Math.cos(a)*(base+offset),y=Math.sin(a)*(base+offset);
        g.save();
        g.translate(x,y);
        g.rotate(a+Math.PI/2);
        g.fillStyle=ink[(j+band)%ink.length];
        g.globalAlpha=(.44+.46*f.high)*rise(f.p*6+.25-band*.07);
        g.beginPath();
        g.ellipse(0,0,dot*(spiral?2.05:1.15),dot*.61,0,0,turn);
        g.fill();
        g.restore();
      }
    }
    circle(g,0,0,r*.06);g.fillStyle="#edf8f0";g.fill();
    return;
  }
  const moire=scene===54;
  const diameter=r*(moire ? .72 : .88);
  const colors=moire ? ["#36c6dc","#e155ae"] : ["#55bccc","#d75ea0","#edb26a"];
  colors.forEach((color,i)=>{
    g.save();
    g.translate(moire ? (i-.5)*r*.48 : 0,moire ? (i-.5)*r*.23 : 0);
    g.rotate((moire ? .76+i*.15 : .69+i*.11) + f.t*(moire ? [.23,.183][i] : [.28,-.18,.11][i])*(f.reduced?.12:1) + f.hit*.11);
    circle(g,0,0,diameter);
    g.clip();g.globalCompositeOperation="screen";g.globalAlpha=moire ? .55 : .47;
    g.fillStyle=color;
    const space=r*(moire ? .093 : .118);
    for(let x=-diameter*1.1;x<diameter*1.1;x+=space) {
      g.fillRect(x,-diameter,space*(.32+.12*f.mid),diameter*2);
    }
    g.restore();
    circle(g,moire ? (i-.5)*r*.48 : 0,moire ? (i-.5)*r*.23 : 0,diameter);
    g.strokeStyle=color;g.globalAlpha=.40;g.lineWidth=1;g.stroke();g.globalAlpha=1;
  });
}

const fireColors=["#101418","#233739","#35605c","#2f8774","#59ac8f","#9dc197","#efb370","#ffce84","#ffedbc"];
function drawFire(g:Drawing,scene:51|58|59|60,f:Frame,w:number,h:number) {
  const cell=Math.max(6,Math.ceil(Math.min(w,h)/39));
  const cols=Math.ceil(w/cell), rows=Math.ceil(h/cell);
  const tick=Math.floor(f.t*(f.reduced ? 6 : 18));
  const crest=scene===51 ? .42 : scene===58 ? .07+.12*rise(f.p) : scene===59 ? .19+.45*rise(f.p) : .24+.59*Math.exp(-f.p*4);
  const heat=(crest+.24*f.low+.18*f.hit)*rows;
  for(let row=0;row<rows;row++){
    const y=h/2-(row+1)*cell;
    for(let col=0;col<cols;col++){
      const position=col/cols;
      const x=-w/2+col*cell;
      const drift=Math.floor(Math.sin(row*.22+tick*.06)*row*.16);
      const root=grain((col+drift)*7+Math.floor(tick-row*.8)*11);
      const focus=scene===58 ? Math.exp(-Math.pow((position-.5)*5,2)) : .73+.28*Math.sin(position*Math.PI);
      const rough=.54+root*.67;
      const temperature=clamp((1-row/Math.max(1,heat*focus*rough))*(.78+root*.28));
      const level=Math.floor(temperature*(fireColors.length-1));
      if(scene===51 || level>0){
        g.globalAlpha=scene===51 ? .24+.74*temperature : .75+.25*temperature;
        g.fillStyle=fireColors[level];g.fillRect(x,y,cell-1,cell-1);
      }
      if(scene===51 && level>2 && cols>=22 && (row+col)%3===0){
        g.globalAlpha=.63;
        g.save();g.translate(x+cell*.5,0);
        label(g,String(Math.round(temperature*36)),y+cell*.5,cell*.62,"#17262a",cell);
        g.restore();
      }
    }
  }
}

function drawContraluz(g:Drawing,f:Frame,r:number) {
  for(let i=0;i<7;i++){
    const orbit=r*(.48+i*.062), shift=f.t*(f.reduced ? .045 : .35);
    g.beginPath();
    g.ellipse(0,0,orbit,orbit*.69,shift+i*.49,0,turn);
    g.strokeStyle=`hsla(${i*48+170+f.high*34},75%,62%,.62)`;
    g.lineWidth=r*(.025+.035*f.high);g.stroke();
  }
  g.scale(r,r);g.fillStyle="#090b12";g.strokeStyle="#677a93";g.lineWidth=.008;
  // One dark rider and a prismatic silhouette retain the reference's simultaneous moods.
  g.beginPath();
  g.moveTo(-.75,.39);g.quadraticCurveTo(-.51,.09,-.18,.13);
  g.quadraticCurveTo(.22,.17,.38,-.16);g.lineTo(.63,-.48);g.lineTo(.58,-.21);
  g.quadraticCurveTo(.80,-.14,.74,-.03);g.lineTo(.52,.04);g.quadraticCurveTo(.40,.27,.14,.42);
  g.lineTo(.29,.63);g.lineTo(.14,.64);g.lineTo(-.13,.43);g.lineTo(-.33,.46);g.lineTo(-.48,.67);
  g.lineTo(-.62,.67);g.lineTo(-.51,.40);g.quadraticCurveTo(-.68,.48,-.75,.39);g.fill();g.stroke();
  g.beginPath();
  g.moveTo(-.26,.31);g.quadraticCurveTo(-.35,-.09,-.21,-.34);g.quadraticCurveTo(-.05,-.57,.12,-.31);
  g.lineTo(.0,-.12);g.quadraticCurveTo(.05,.06,.29,.17);g.lineTo(.2,.36);g.closePath();
  g.fill();g.stroke();
  g.strokeStyle="#0a0a12";g.lineWidth=.034;line(g,[[.23,.25],[.35,-.62]]);g.stroke();
  g.beginPath();g.moveTo(.37,-.61);g.quadraticCurveTo(.23,-.81,-.02,-.61);g.quadraticCurveTo(.19,-.68,.37,-.55);g.fill();
}

function drawText(g:Drawing,f:Frame,w:number,h:number) {
  const size=Math.min(w*.093,h*.16);
  const p=clamp((f.p-.19)/.57);
  const visibility=rise(p*12)*(1-rise((p-.84)*7));
  if(!visibility)return;
  const set=rise(p*7), reply=rise((p-.39)*7);
  g.globalAlpha=visibility*.96;g.fillStyle="#11151f";
  g.beginPath();g.roundRect(-w*.43,-h*.28,w*.86,h*.56,12);g.fill();
  g.globalAlpha=set*visibility;
  label(g,"Para seguir de pie…",reply ? -h*.15 : -h*.05,size*.78,"#c6d8d7",w*.85,true);
  g.globalAlpha=reply*visibility;
  label(g,"…seguí de pie.",h*.06+(1-reply)*h*.06,size,"#f0c277",w*.85);
  g.strokeStyle="#77b6b6";g.lineWidth=2;
  line(g,[[-w*.26,h*.25],[w*.26*rise((p-.59)*5),h*.25]]);g.stroke();
}

function drawCard(g:Drawing,f:Frame,r:number,color:Color) {
  g.scale(r,r);
  const width=.62*(.08+.92*Math.abs(Math.cos(f.t*(f.reduced?.37:1.1))));
  g.fillStyle="#241d32";g.strokeStyle=color;g.lineWidth=.013;
  g.beginPath();g.roundRect(-width*.5,-.63,width,1.26,.045);g.fill();g.stroke();
  g.strokeStyle="#f5dfb4";g.lineWidth=.012;
  line(g,[[-width*.30,.36],[width*.21,-.36]]);g.stroke();
  g.beginPath();g.ellipse(0,0,width*.28,.25,0,0,turn);g.stroke();
}

function drawBook(g:Drawing,scene:92|93,f:Frame,r:number,color:Color) {
  g.scale(r,r);
  g.rotate(-.10*(1-rise(f.p*4)));
  const open=scene===92 ? .035*Math.sin(f.t*1.6) : rise(f.p*3.4);
  g.fillStyle="#c6a67a";g.fillRect(-.54,-.59,1.12,.20);
  g.fillStyle="#dfbd86";g.beginPath();g.roundRect(-.13,-.62,open*.97+.10,1.25,.025);g.fill();
  g.fillStyle="#e5c28e";g.globalAlpha=open;
  g.strokeStyle=color;g.lineWidth=.023;
  for(let i=0;i<4;i++){circle(g,.36,0,.10+i*.08+f.hit*.04);g.stroke();}
  g.globalAlpha=1;
  const cover=.57*(1-.77*open);
  g.fillStyle="#25251f";g.strokeStyle="#af8c62";g.lineWidth=.017;
  g.beginPath();g.roundRect(-cover-.07,-.57,cover*2,1.19,.04);g.fill();g.stroke();
  g.save();g.translate(-.07,0);g.globalAlpha=1-open*.80;
  label(g,"Manual de",-.13,.14,"#ead2a7",cover*1.7,true);
  label(g,"causa y efecto",.085,.14,"#ead2a7",cover*1.7,true);
  label(g,"Ø",.37,.14,color,cover*1.7);
  g.restore();
}

function drawFace(g:Drawing,scene:96|97,f:Frame,r:number,color:Color) {
  g.scale(r,r);
  const smile=scene===97 ? rise(f.p*3) : 0;
  g.fillStyle="#24232d";g.strokeStyle=color;g.lineWidth=.026;
  g.beginPath();g.ellipse(0,0,.47,.60,0,0,turn);g.fill();g.stroke();
  g.strokeStyle="#f2d5a6";
  const open=.065+.048*smile;
  [-1,1].forEach(sign=>{
    g.beginPath();
    g.moveTo(sign*.10,-.14);
    g.quadraticCurveTo(sign*.22,-.13-open,sign*.33,-.14);
    g.stroke();
    g.fillStyle=color;
    g.beginPath();
    g.ellipse(sign*.245,-.04+(.27*(f.t*.7%1))*(1-smile),.020,.045,0,0,turn);
    g.globalAlpha=(1-smile)*.7;g.fill();g.globalAlpha=1;
  });
  g.beginPath();g.moveTo(-.22,.22-.08*smile);
  g.quadraticCurveTo(0,.10+.31*smile,.22,.22-.08*smile);g.stroke();
  if(smile>.1){
    g.globalAlpha=smile*.65;g.fillStyle=color;
    circle(g,-.31,.10,.038);g.fill();circle(g,.31,.10,.038);g.fill();
  }
}

function drawChariot(g:Drawing,scene:100|101,f:Frame,r:number,choice:Choice) {
  g.scale(r,r);
  const travel=scene===101 ? rise(f.p*1.35)*(choice.direction ?? 0) : .012*Math.sin(f.t*2);
  if(scene===101 && choice.direction===0){
    const depth=1+rise(f.p)*.27;
    g.scale(depth,depth);
  }
  g.translate(travel*(f.reduced?.16:.62),0);
  g.fillStyle="#392e43";g.strokeStyle=choice.color;g.lineWidth=.023;
  line(g,[[-.6,-.12],[.5,-.12],[.33,.38],[-.48,.38]],true);g.fill();g.stroke();
  line(g,[[-.44,-.12],[-.44,-.53],[.36,-.53],[.36,-.12]]);g.stroke();
  circle(g,-.04,-.37,.11);g.stroke();
  line(g,[[-.25,-.13],[-.17,-.24],[.09,-.24],[.19,-.13]]);g.stroke();
  [-1,1].forEach(sign=>{
    const heel=sign*.27;
    circle(g,heel,.41,.18);g.fill();g.stroke();
    for(let i=0;i<7;i++){
      const a=i*turn/7+travel*6;
      line(g,[[heel,.41],[heel+Math.cos(a)*.16,.41+Math.sin(a)*.16]]);g.stroke();
    }
    const prow=sign*(.71+.05*Math.sin(f.t*4+sign));
    g.globalAlpha=choice.direction===sign ? 1 : .61;
    line(g,[[sign*.45,.06],[prow,.12],[prow+sign*.09,-.06]]);
    g.stroke();g.globalAlpha=1;
    line(g,[[prow-sign*.08,.21],[prow+sign*.07,.17],[prow+sign*.15,.29],[prow-sign*.09,.31]],true);g.fill();g.stroke();
  });
}

function drawTower(g:Drawing,f:Frame,r:number,color:Color) {
  const breakAt=.28, collapse=rise((f.p-breakAt)*2.5), last=rise((f.p-.65)*5);
  g.scale(r,r);
  g.globalAlpha=1-last;
  const crumbled=[[0,-.61,.58],[-.31,-.42,.26],[.31,-.42,.26],[0,-.2,.59],[-.28,.0,.29],[.27,.0,.30],[0,.20,.67],[-.29,.42,.30],[.28,.42,.31]];
  crumbled.forEach(([x,y,width],i)=>{
    const drop=collapse*(.30+grain(i+6)*.75);
    g.save();g.translate(x+(grain(i+85)-.5)*collapse*1.6,y+drop);
    g.rotate((grain(i+50)-.5)*collapse*4);
    g.fillStyle=i%2 ? "#66574d" : "#93785e";g.strokeStyle="#e9cf9b";g.lineWidth=.009;
    g.fillRect(-width/2,-.092,width,.184);g.strokeRect(-width/2,-.092,width,.184);g.restore();
  });
  const bolt=rise((f.p-.14)*9)*(1-rise((f.p-.34)*8));
  if(bolt>0){
    g.strokeStyle=color;g.globalAlpha=bolt*.84;g.lineWidth=.028;
    line(g,[[.33,-.81],[.19,-.59],[.34,-.58],[.02,-.26],[.11,-.19],[-.06,.11],[.12,.25]]);g.stroke();
  }
  g.globalAlpha=last;
  circle(g,0,0,.022+.012*f.hit);g.fillStyle=color;g.fill();
}

export function ReferenceVisual({scene,clock,beginsAt,duration,paused,choice}:{
  scene:ReferenceScene;clock:AudioContext;beginsAt:number;duration:number;paused:boolean;choice?:Choice;
}) {
  const surface=useRef<HTMLCanvasElement>(null);
  const signals=useProjectionSignals();
  const color=choice?.color ?? "#78c4ef", direction=choice?.direction;
  useEffect(()=>{
    const canvas=surface.current;
    const g=canvas?.getContext("2d");
    if(!canvas || !g)return;
    const view=canvas, context=g;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pending=0, previous=-Infinity;
    function paint(timestamp:number) {
      if(!paused)pending=requestAnimationFrame(paint);
      if(timestamp-previous<(reduced ? 80 : 28))return;
      previous=timestamp;
      const w=view.clientWidth,h=view.clientHeight;
      if(!w||!h)return;
      const dpr=Math.min(window.devicePixelRatio||1,1.5,1500/Math.max(w,h));
      const width=Math.max(1,Math.round(w*dpr)),height=Math.max(1,Math.round(h*dpr));
      if(view.width!==width || view.height!==height){view.width=width;view.height=height;}
      context.setTransform(width/w,0,0,height/h,0,0);context.clearRect(0,0,w,h);
      const t=Math.max(0,clock.currentTime-beginsAt);
      const p=clamp(t/Math.max(.1,duration));
      const {low,mid,high,rms,attack,beats}=signals.current;
      const f:Frame={t,p,b:beats,low,mid,high,hit:Math.max(attack,Math.min(.7,rms*2)),reduced};
      const vote=scene===92||scene===96||scene===100;
      const side=scene===31||scene===45;
      const r=side ? Math.min(w*.20,h*.34) : Math.min(w,h)*(scene===34 ? .36 : vote ? .18 : scene>=90 ? .32 : .40);
      context.save();
      const x=side ? w*.76 : vote || scene===91 ? w*.72 : w*.5;
      const y=vote || scene===91 ? h*.27 : scene>=90 ? h*.44 : h*.5;
      context.translate(x,y);
      if(scene===34||scene===64||scene===66||scene===67||scene===72)drawRhythm(context,scene,f,r);
      else if(scene===31||scene===45||scene===52||scene===54)drawOptics(context,scene,f,r);
      else if(scene===51||scene===58||scene===59||scene===60)drawFire(context,scene,f,w,h*.98);
      else if(scene===41)drawContraluz(context,f,r);
      else if(scene===62)drawText(context,f,w,h);
      else if(scene===89){
        const black=rise((t-Math.min(14.2,duration*.75))/Math.max(.6,Math.min(2.8,duration*.23)));
        context.fillStyle=`rgba(6,8,12,${black})`;context.fillRect(-w/2,-h*.5,w,h);
      }
      else if(scene===91)drawCard(context,f,r*.46,color);
      else if(scene===92||scene===93)drawBook(context,scene,f,r,color);
      else if(scene===96||scene===97)drawFace(context,scene,f,r,color);
      else if(scene===100||scene===101)drawChariot(context,scene,f,r,{color,direction});
      else if(scene===104)drawTower(context,f,r,color);
      context.restore();
    }
    const resize=new ResizeObserver(()=>{if(paused){previous=-Infinity;paint(performance.now());}});
    resize.observe(view);
    paint(performance.now());
    return ()=>{cancelAnimationFrame(pending);resize.disconnect();};
  },[beginsAt,clock,color,direction,duration,paused,scene,signals]);
  return <canvas className="reference-visual" data-reference-scene={scene} role="img" aria-label={REFERENCE_VISUALS[scene]} ref={surface}/>;
}
