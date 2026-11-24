import {useEffect,useRef} from "react";
import {makeArchitecture,type ResonantFrame} from "./resonant-architecture";

type Point = [number,number];
type Vec = [number,number,number];
type Scene = 44|54|78;
type Painter=(ctx:CanvasRenderingContext2D,w:number,h:number,f:ResonantFrame)=>void;
const TAU=Math.PI*2;
const limit=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const hash=(n:number)=>{const k=Math.sin(n*127.1+54.72)*43758.5453;return k-Math.floor(k);};
const hsla=(h:number,s:number,l:number,a=1)=>"hsla("+Math.round(h)+","+s+"%,"+Math.round(l)+"%,"+a+")";

function glow(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){
  const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
}

const stones=Array.from({length:108},(_,i)=>({
  a:i%6*TAU/6+.24*(hash(i+14)-.5),depth:(i+.5)/108,
  tint:hash(i+8)*TAU,tilt:hash(i+112)*TAU,size:.73+hash(i+19)*.5,
}));

// A double-ended, irregular cut. The two belts produce different transmitted
// and reflected colors even when neighbouring stones share the same orientation.
const cut:Vec[]=[[.20,-1.05,.13],[-.16,.96,-.12]];
for(let belt=0;belt<2;belt++)for(let i=0;i<6;i++){
  const angle=i*TAU/6+(belt?.18:0);
  cut.push([Math.cos(angle)*(belt?.50:.55),belt?.31:-.32,Math.sin(angle)*(belt?.36:.45)]);
}
const facets:number[][]=[];
for(let i=0;i<6;i++){
  const j=(i+1)%6;
  facets.push([0,2+i,2+j],[2+i,8+i,8+j],[2+i,8+j,2+j],[1,8+j,8+i]);
}
function stone(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,angle:number,spin:number,color:number,high:number){
  const ca=Math.cos(angle),sa=Math.sin(angle),cs=Math.cos(spin),ss=Math.sin(spin);
  const projected=cut.map(([u,v,z]):Vec=>{
    const dx=u*cs+z*ss,dz=-u*ss+z*cs,dy=v*.94-dz*.24;
    return [x+(dx*ca-dy*sa)*r,y+(dx*sa+dy*ca)*r,dz*.97+v*.24];
  });
  const sorted=facets.map(indices=>({indices,depth:indices.reduce((sum,i)=>sum+projected[i][2],0)})).sort((a,b)=>a.depth-b.depth);
  for(const {indices,depth} of sorted){
    const [a,b,c]=indices.map(i=>projected[i]);
    if(depth<-.18)continue;
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=(b[2]-a[2])*r;
    const ux=c[0]-a[0],uy=c[1]-a[1],uz=(c[2]-a[2])*r;
    let nx=dy*uz-dz*uy,ny=dz*ux-dx*uz,nz=dx*uy-dy*ux;
    const unit=Math.hypot(nx,ny,nz)||1,sign=nz<0?-1:1;
    nx=nx*sign/unit;ny=ny*sign/unit;nz=nz*sign/unit;
    const facing=limit((-.57*nx-.48*ny+.61*nz+1)*.5,0,1);
    const hue=(213+48*nx-56*ny+color*9+360)%360;
    const refraction=limit(facing*.63+.3*Math.sin(color*.85+nz*5.7),0,1);
    const luster=12+facing*39+high*7;
    const bright=ny<-.13 && nx<.77 || (nx<-.69 && nz>.39);
    const fill=ctx.createLinearGradient(a[0],a[1],(b[0]+c[0])*.5+.001,(b[1]+c[1])*.5);
    fill.addColorStop(0,bright?hsla(42+refraction*20,77,78+high*8):hsla(hue+30,50,luster+14));
    fill.addColorStop(.18,bright?hsla(27+color*2,97,63):hsla(hue-10,69,luster+3));
    if(bright)fill.addColorStop(.34,hsla(21+refraction*18,78,46+high*5));
    fill.addColorStop(.47,hsla(hue-15,50,luster*.65));fill.addColorStop(.70,hsla(hue-29,69,luster+3));
    fill.addColorStop(.78,hsla(hue-40,48,luster+16));fill.addColorStop(.87,hsla(hue-44,59,luster-7));
    fill.addColorStop(1,hsla(hue-48-refraction*23,61,luster*.49));
    ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.closePath();
    ctx.fillStyle=fill;ctx.fill();
    if(r>7){
      ctx.save();ctx.clip();
      // The reflected strip bends independently at each cut, like a light box
      // reflected across a piece of polished glass.
      const sweep=.37*Math.sin(spin+nx*1.8+ny*.58),normalAngle=angle+nx*.8;
      const ux=Math.cos(normalAngle),uy=Math.sin(normalAngle);
      const reflect=ctx.createLinearGradient(x-ux*r*.68,y-uy*r*.68,x+ux*r*.68,y+uy*r*.68);
      const peak=.52+sweep,energy=limit(.20+.84*Math.pow(facing,2)+high*.16,0,1);
      reflect.addColorStop(0,"rgba(0,10,22,0)");
      reflect.addColorStop(Math.max(.005,peak-.15),"rgba(0,16,24,0)");
      reflect.addColorStop(peak-.035,"rgba(92,212,220,"+energy*.53+")");
      reflect.addColorStop(peak,bright?"rgba(255,245,202,"+energy+")":"rgba(206,245,255,"+energy*.88+")");
      reflect.addColorStop(peak+.033,"rgba(143,172,250,"+energy*.54+")");
      reflect.addColorStop(Math.min(.995,peak+.105),"rgba(4,16,32,0)");reflect.addColorStop(1,"rgba(4,16,32,0)");
      ctx.fillStyle=reflect;ctx.fillRect(x-r*1.25,y-r*1.25,r*2.5,r*2.5);
      ctx.restore();
    }
    ctx.lineWidth=.55;ctx.strokeStyle=hsla(hue,36,bright?87:20,bright?.57:.46);ctx.stroke();
  }
}
function crystalMaterial(){
  const colors=4,angles=20,width=150,height=232,reference=103;
  const tiles=new Map<number,HTMLCanvasElement>();
  function bake(color:number,angle:number){
    const tile=document.createElement("canvas");tile.width=width;tile.height=height;
    const g=tile.getContext("2d")!;
    stone(g,width*.5,height*.5,reference,0,angle*TAU/angles,color*1.69,.38);
    tiles.set(color*angles+angle,tile);return tile;
  }
  // Seed four materials immediately; fill the remaining orientations over subsequent frames.
  for(let color=0;color<colors;color++)bake(color,color*5);
  let cursor=0;
  return {
    prepare(){
      const until=performance.now()+2.3;
      while(cursor<colors*angles && performance.now()<until){
        const color=cursor%colors,angle=(Math.floor(cursor/colors)*7+color*5)%angles;cursor++;
        if(!tiles.has(color*angles+angle))bake(color,angle);
      }
    },
    paint(ctx:CanvasRenderingContext2D,x:number,y:number,r:number,rotation:number,spin:number,colorPhase:number,high:number){
      const color=Math.min(colors-1,Math.floor(colorPhase/TAU*colors)),phase=((spin/TAU%1)+1)%1*angles;
      const index=Math.floor(phase),blend=phase-index;
      let base=tiles.get(color*angles+index);
      for(let d=1;!base&&d<=angles;d++)base=tiles.get(color*angles+(index+d)%angles);
      if(!base)return;
      const next=tiles.get(color*angles+(index+1)%angles);
      const scale=r/reference,tw=width*scale,th=height*scale;
      ctx.save();ctx.translate(x,y);ctx.rotate(rotation);
      ctx.drawImage(base,-tw*.5,-th*.5,tw,th);
      if(next&&r>9){ctx.globalAlpha=blend;ctx.drawImage(next,-tw*.5,-th*.5,tw,th);}
      if(high>.025 && r>4){
        ctx.globalCompositeOperation="lighter";ctx.globalAlpha=high*.54;
        ctx.drawImage(base,-tw*.5,-th*.5,tw,th);ctx.globalCompositeOperation="source-over";
      }
      // Grazing highlights ride across the belt when the high band opens.
      const glint=(.35+.65*high)*Math.max(0,Math.cos(spin*2.1+colorPhase));
      if(glint>.18&&r>7){
        ctx.globalAlpha=glint*.85;ctx.strokeStyle="#e4fffb";ctx.lineWidth=Math.max(.65,r*.017);
        ctx.beginPath();ctx.moveTo(-r*.26,-r*.39);ctx.quadraticCurveTo(-r*.1,-r*.60,r*.16,-r*.97);ctx.stroke();
      }
      ctx.restore();
    }
  };
}
function makeCrystals():Painter {
  const material=crystalMaterial();
  return (ctx,w,h,f)=>{
  material.prepare();
  const t=f.time,cx=w*(.51+.014*Math.sin(t*.24)),cy=h*(.51+.014*Math.cos(t*.19));
  const reach=Math.hypot(w*.55,h*.53),unit=Math.min(w,h);
  ctx.fillStyle="#05070f";ctx.fillRect(0,0,w,h);
  glow(ctx,cx,cy,unit*.72,"rgba(27,35,78,.66)");
  glow(ctx,w*.75,h*.28,unit*.63,"rgba(45,15,58,.23)");
  for(let i=0;i<100;i++){
    const x=hash(i*3+9)*w,y=hash(i*7+391)*h,r=.3+hash(i+16)*.8;
    ctx.fillStyle=hsla(198+i%51,55,70,.18+.20*hash(i+91));ctx.fillRect(x,y,r,r);
  }
  const phase=t*.082+.16*f.mid+.12*f.attack+.014*Math.sin(f.beat*TAU);
  for(const gem of stones){
    const d=gem.depth;
    const radius=reach*(.019+Math.pow(d,2.65)*1.16)*(1+.05*f.low);
    const theta=gem.a+phase+Math.log(d+.05)*2.09+Math.sin(t*.21+gem.tint)*.031;
    const x=cx+Math.cos(theta)*radius,y=cy+Math.sin(theta)*radius*.78;
    const r=(1.6+unit*.163*Math.pow(d,2.62))*gem.size*(1+f.low*.17+f.attack*.12);
    if(x+r<0||x-r>w||y+r<0||y-r>h)continue;
    const roll=theta+Math.PI*.57+Math.sin(gem.tilt+t*.3)*.47;
    material.paint(ctx,x,y,r,roll,gem.tilt+t*.40+f.mid*.73,gem.tint,f.high);
  }
  };
}

// The contours and cross strokes form an original, broken Ø. Their parallel
// inlaid ribbons keep the calligraphic gesture legible as the sound deforms it.
const strokes:{points:Point[];width:number;heat:number}[]=[
  {points:[[-.91,.29],[-.77,.14],[-.59,-.14],[-.46,-.31],[-.49,-.13],[-.65,.08],[-.52,.03]],width:.071,heat:.45},
  {points:[[-.86,.10],[-.73,.055],[-.63,-.11],[-.49,-.17],[-.36,-.22]],width:.035,heat:.48},
  {points:[[-.59,.25],[-.46,.04],[-.31,-.15],[-.41,.015],[-.38,.09],[-.27,.15],[-.22,.24]],width:.068,heat:.53},
  {points:[[-.40,-.04],[-.24,-.16],[-.09,-.19],[-.15,-.09],[-.30,.01],[-.18,.05],[-.11,.14],[-.18,.23]],width:.088,heat:.70},
  {points:[[-.23,.05],[-.09,.15],[.04,.205],[.17,.12],[.26,-.055],[.22,-.18],[.11,-.24],[-.025,-.19],[-.095,-.055],[-.08,.08],[.00,.14]],width:.086,heat:.85},
  {points:[[.10,.22],[.07,.09],[.14,-.07],[.21,-.27],[.28,-.34]],width:.092,heat:1},
  {points:[[.18,-.04],[.32,-.12],[.45,-.26],[.52,-.33],[.46,-.15],[.37,-.04],[.48,.02],[.59,.13],[.66,.23]],width:.072,heat:.73},
  {points:[[.36,.19],[.48,.045],[.65,-.13],[.86,-.23],[.77,-.13],[.62,.015],[.58,.10],[.70,.15],[.79,.24]],width:.071,heat:.55},
  {points:[[.50,-.06],[.66,-.11],[.79,-.18],[.94,-.23]],width:.031,heat:.55},
];
function samplePath(points:Point[]):Point[]{
  const result:Point[]=[];
  for(let j=0;j<points.length-1;j++){
    const a=points[Math.max(0,j-1)],b=points[j],c=points[j+1],d=points[Math.min(points.length-1,j+2)];
    for(let k=0;k<12;k++){
      const u=k/12;
      result.push([0,1].map(n=>.5*(2*b[n]+(-a[n]+c[n])*u+(2*a[n]-5*b[n]+4*c[n]-d[n])*u*u+
        (-a[n]+3*b[n]-3*c[n]+d[n])*u*u*u)) as Point);
    }
  }
  result.push(points[points.length-1]);return result;
}
const ink=strokes.map(stroke=>({...stroke,samples:samplePath(stroke.points)}));
function ribbon(ctx:CanvasRenderingContext2D,centers:Point[],normals:Point[],widths:number[],scale:number,offset:number){
  ctx.beginPath();
  for(const side of [1,-1]){
    for(let j=0;j<centers.length;j++){
      const i=side===1?j:centers.length-j-1;
      const d=widths[i]*(scale*side+offset),p=centers[i],n=normals[i];
      const x=p[0]+n[0]*d,y=p[1]+n[1]*d;
      if(j===0&&side===1)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
  }
  ctx.closePath();ctx.fill();
}
function makeFire():Painter {
 const atmosphere=document.createElement("canvas"),smoke=atmosphere.getContext("2d",{alpha:false})!;
 let paintedAt=-Infinity;
 return (ctx,w,h,f)=>{
  const t=f.time,scale=Math.min(w*.51,h*.93),cx=w*.49,cy=h*.52;
  // Suspended banks of smoke keep a still rhythm behind the sharp nib marks.
  const hazeScale=Math.min(1,400/w,300/h);
  const sw=Math.max(1,Math.round(w*hazeScale)),sh=Math.max(1,Math.round(h*hazeScale));
  const resize=sw!==atmosphere.width||sh!==atmosphere.height;
  if(resize){atmosphere.width=sw;atmosphere.height=sh;}
  if(resize||t-paintedAt>.085||t<paintedAt){
  paintedAt=t;
  smoke.setTransform(sw/w,0,0,sh/h,0,0);smoke.fillStyle="#0b040c";smoke.fillRect(0,0,w,h);
  for(let i=0;i<12;i++){
    const x=w*(hash(i+88)*1.28-.14+.037*Math.sin(t*.21+i)),y=h*(hash(i+21)*1.28-.14+.03*Math.cos(t*.29+i));
    const r=Math.min(w,h)*(.17+.34*hash(i+1));
    glow(smoke,x,y,r,i%3===0?"rgba(35,29,111,.58)":i%3===1?"rgba(131,7,29,.60)":"rgba(155,10,14,.56)");
  }
  for(let i=0;i<28;i++){
    const x=(i/27)*2.3-1.16,flow=Math.sin(x*4.8+t*.22)*.20+Math.sin(x*13+t*.32)*.04;
    glow(smoke,cx+x*scale,cy+(flow-.11)*scale,scale*(.13+.085*hash(i+66)),
      i%4===0?"rgba(42,19,118,.19)":"rgba(159,6,2,.18)");
  }
  glow(smoke,cx,cy,scale*.75,"rgba(125,12,1,"+(.23+.13*f.low)+")");
  // Broad emission is low frequency; composite it beneath the full-resolution fibers.
  for(const line of ink)for(let i=0;i<line.samples.length;i+=9){
    const [x,y]=line.samples[i];
    glow(smoke,cx+x*scale,cy+y*scale,scale*(line.heat>.95?.12:.074),
      line.heat>.95?"rgba(255,111,22,.26)":"rgba(233,29,3,.21)");
  }
  }
  ctx.drawImage(atmosphere,0,0,w,h);
  for(let j=0;j<ink.length;j++){
    const line=ink[j],widths:number[]=[],normals:Point[]=[];
    const centers:Point[]=line.samples.map(([x,y],k)=>{
      const u=k/(line.samples.length-1);
      const wobble=Math.sin(x*15+t*1.43+j)*.011+Math.sin(u*39-t*1.85+j)*(.004+.005*f.high)+Math.sin(u*87+t*.7+j)*.002;
      return [cx+(x+Math.sin(u*17+t*.71+j)*(.002+.008*f.attack))*scale,
        cy+(y+wobble+Math.sin(x*7-t*.65)*f.mid*.024)*scale];
    });
    for(let i=0;i<centers.length;i++){
      const u=i/(centers.length-1),prev=centers[Math.max(0,i-1)],next=centers[Math.min(centers.length-1,i+1)];
      const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
      normals.push([-dy/len,dx/len]);
      const nib=.94+.14*Math.sin(u*85+j-t*.9)+.12*Math.sin(u*183-j+t*.73);
      widths.push(scale*line.width*(.60+.014*Math.cos(f.beat*TAU))*Math.pow(Math.max(0,Math.sin(u*Math.PI)),.72)*
        (.64+.35*Math.cos(u*13+j)+.18*Math.sin(u*31.5+t))*nib*(1+f.low*.29+f.attack*.23));
    }
    const gradient=ctx.createLinearGradient(0,cy-scale*.36,0,cy+scale*.35);
    const hot=line.heat>.95;
    gradient.addColorStop(0,hot?"#fff8cb":"#ff5910");gradient.addColorStop(.28,hot?"#fffde8":"#fe3704");
    gradient.addColorStop(.54,hot?"#fffade":"#ed1905");gradient.addColorStop(.79,hot?"#fff1bb":"#a70515");gradient.addColorStop(1,hot?"#ffc274":"#eb190a");
    ctx.fillStyle=gradient;ctx.shadowColor="#ff8823";ctx.shadowBlur=hot?scale*.020:0;
    ribbon(ctx,centers,normals,widths,1,0);ctx.shadowBlur=0;
    for(let strand=0;strand<17;strand++){
      const offset=hash(j*31+strand)*1.8-.9;
      ctx.beginPath();
      const start=Math.floor(hash(strand+244)*centers.length*.6),length=Math.floor(centers.length*(.14+.28*hash(strand+71)));
      for(let k=start;k<Math.min(start+length,centers.length);k++){
        const f=(k-start)/length;
        const d=widths[k]*(offset+.13*Math.sin(k*.24+strand+t*.55)+.15*f);
        const p=centers[k],n=normals[k];const x=p[0]+n[0]*d,y=p[1]+n[1]*d;
        if(k===start)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.lineWidth=scale*(.001+.003*hash(strand+j));
      ctx.strokeStyle=hot?"rgba(255,203,78,.32)":strand%3?"rgba(255,134,19,.43)":"rgba(98,0,22,.36)";ctx.stroke();
    }
    // Small tapering flames grow out of the nib, in the direction of the local drag.
    for(let q=0;q<19;q++){
      const seed=137*j+q*17,which=hash(seed+34)>.5?1:-1;
      const i=limit(Math.floor((.10+.8*hash(seed+43))*centers.length),1,centers.length-2);
      const n=normals[i],p=centers[i],breadth=widths[i],spread=breadth*(.19+.54*hash(seed+76));
      const x=p[0]+n[0]*breadth*which*.88,y=p[1]+n[1]*breadth*which*.88;
      const length=scale*(.007+.035*hash(seed+8))*(.85+.37*Math.sin(t+seed))*(1+.40*f.high);
      const tipX=x+n[0]*spread*which+n[1]*length,tipY=y+n[1]*spread*which-n[0]*length-scale*.006;
      ctx.beginPath();ctx.moveTo(x-n[0]*breadth*.28*which,y-n[1]*breadth*.28*which);
      ctx.quadraticCurveTo(x+n[0]*spread*which,y+n[1]*spread*which,tipX,tipY);
      ctx.quadraticCurveTo(x+n[1]*length*.25,y-n[0]*length*.25,x,y);ctx.closePath();
      ctx.fillStyle=hot?"#ffe4a4":hash(seed+3)>.72?"#fc4a0b":"#df1d06";ctx.fill();
    }
  }
  for(let i=0;i<96;i++){
    const life=(hash(i+27)+t*(.038+.022*hash(i)))%1;
    const x=cx+scale*((hash(i+42)-.5)*1.76+.038*Math.sin(t*.8+i));
    const y=cy+scale*((hash(i+88)-.5)*.40-life*.30);
    const r=(.35+hash(i+54)*.95)*(1+f.high*.55);
    ctx.fillStyle=hsla(14+hash(i+55)*24,100,62,(1-life)*(.18+f.high*.47));ctx.fillRect(x,y,r,r);
  }
 };
}

const descriptions:Record<Scene,string>={44:"Espiral de cristales dicroicos",54:"Cámara fractal de interferencia",78:"Caligrafía de fuego"};

export function ResonantVisuals({scene,signals,paused}:{scene:Scene;signals:{current:ResonantFrame};paused:boolean}){
  const surface=useRef<HTMLCanvasElement|null>(null);
  const pausedRef=useRef(paused);
  pausedRef.current=paused;
  useEffect(()=>{
    const canvas=surface.current,ctx=canvas?.getContext("2d",{alpha:false});
    if(!canvas||!ctx)return;
    const architecture=scene===54?makeArchitecture():null;
    const paint=architecture?.draw??(scene===44?makeCrystals():makeFire());
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf=0,last=-Infinity,lastTime=signals.current.time,motionTime=lastTime*(media.matches ? .16 : 1);
    let du=0,dv=0,force=true;
    const size=new ResizeObserver(()=>{force=true;});size.observe(canvas);
    const draw=(now:number)=>{
      raf=requestAnimationFrame(draw);
      if(!force&&(document.hidden||pausedRef.current||now-last<(media.matches?82:32)))return;
      const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
      last=now;force=false;
      const density=Math.min(window.devicePixelRatio||1,1.6,1920/w,1400/h);
      const pw=Math.max(1,Math.round(w*density)),ph=Math.max(1,Math.round(h*density));
      if(pw!==du||ph!==dv){du=pw;dv=ph;canvas.width=pw;canvas.height=ph;}
      ctx.setTransform(pw/w,0,0,ph/h,0,0);
      const signal=signals.current,delta=Math.max(0,signal.time-lastTime);lastTime=signal.time;
      // The audio clock stops during transport pauses. Reduced motion uses the same score at a quieter speed.
      motionTime+=delta*(media.matches ? .16 : 1);
      paint(ctx,w,h,{...signal,time:motionTime});
    };
    draw(performance.now());
    return ()=>{cancelAnimationFrame(raf);size.disconnect();architecture?.dispose();};
  },[scene,signals]);
  return <canvas className="live-set-drawing" data-resonant-scene={scene} ref={surface} role="img" aria-label={descriptions[scene]} />;
}
