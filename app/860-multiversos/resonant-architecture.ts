export type ResonantFrame = {low:number; mid:number; high:number; attack:number; time:number; beat:number};
type Vec = [number,number,number];
type Face = {points:Vec[]; normal:Vec; shade:number[]};

/** Omit interior faces and bake corner occlusion on the exposed Menger lattice. */
function buildSponge(order:number):Face[] {
  const cells=3**order, unit=9/cells;
  const filled=(x:number,y:number,z:number)=>{
    if(x<0||y<0||z<0||x>=cells||y>=cells||z>=cells)return false;
    for(let step=0;step<order;step++){
      if(Number(x%3===1)+Number(y%3===1)+Number(z%3===1)>1)return false;
      x=Math.floor(x/3);y=Math.floor(y/3);z=Math.floor(z/3);
    }
    return true;
  };
  const faces:Face[]=[];
  for(let z=0;z<cells;z++)for(let y=0;y<cells;y++)for(let x=0;x<cells;x++){
    if(!filled(x,y,z))continue;
    const cell=[x,y,z];
    for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
      const outside:Vec=[x,y,z],normal:Vec=[0,0,0];
      outside[axis]+=sign;normal[axis]=sign;
      if(filled(...outside))continue;
      const u=(axis+1)%3,v=(axis+2)%3;
      const points:Vec[]=[],shade:number[]=[];
      for(const [du,dv] of [[0,0],[1,0],[1,1],[0,1]]){
        const corner:Vec=[...cell] as Vec;
        if(sign>0)corner[axis]++;
        corner[u]+=du;corner[v]+=dv;
        points.push(corner.map(c=>c*unit-4.5) as Vec);
        const flank:Vec=[...outside],other:Vec=[...outside],diagonal:Vec=[...outside];
        flank[u]+=du?1:-1;other[v]+=dv?1:-1;
        diagonal[u]=flank[u];diagonal[v]=other[v];
        const neighbors=Number(filled(...flank))+Number(filled(...other))+Number(filled(...diagonal));
        shade.push(1-neighbors*.135);
      }
      faces.push({points,normal,shade});
    }
  }
  return faces;
}

const vertexSource=`
attribute vec3 position, normal;
attribute float occlusion;
uniform vec3 eye;
uniform vec4 rotation;
uniform vec2 projection;
uniform float offsetZ;
varying vec3 world, surface;
varying float ao, depth;
void main(){
  world=position+vec3(0.,0.,offsetZ);surface=normal;ao=occlusion;
  vec3 d=world-eye;
  float x=rotation.y*d.x-rotation.x*d.z;
  float z=rotation.x*d.x+rotation.y*d.z;
  float y=rotation.w*d.y-rotation.z*z;
  depth=rotation.z*d.y+rotation.w*z;
  gl_Position=vec4(x*projection.x,y*projection.y,depth*1.004-.15,depth);
}`;
const fragmentSource=`
precision highp float;
uniform vec4 levels;
uniform float t;
uniform vec3 eye;
varying vec3 world,surface;
varying float ao,depth;
float grain(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.545);}
void main(){
  float key=clamp(.52+.39*dot(surface,normalize(vec3(-.55,.75,-.46))),0.,1.);
  float lichen=.5+.5*sin(world.z*2.3+world.y*3.+sin(world.x*3.2+world.z));
  vec2 uv=abs(surface.x)>.5?world.zy:abs(surface.y)>.5?world.xz:world.xy;
  float fleck=grain(floor(uv*51.));
  float patina=.84+.11*lichen+.095*fleck+.035*grain(floor(uv*160.));
  vec3 stone=mix(vec3(.13,.17,.28),vec3(.70,.77,.79),key)*patina;
  vec3 lamp=vec3(1.38*sin(t*.28),-1.65,.2+1.4*cos(t*.21));
  vec3 ray=lamp-world;
  float pool=(.45+.55*max(0.,dot(surface,normalize(ray))))/(1.+.105*dot(ray,ray));
  float violet=clamp(.16+pool*(.96+levels.y*.55+levels.w*.4)-world.y*.043,0.,.94);
  vec3 color=mix(stone,vec3(.32,.085,.94)*(.52+key*.74),violet);
  color+=pool*vec3(.14,.035,.34)*(1.+levels.x);
  vec3 blueRay=vec3(-2.4,2.,1.8)-world;
  color+=vec3(.02,.09,.11)*(1.+levels.z)/(1.+.13*dot(blueRay,blueRay));
  // The next two scales of the sponge are small enough to shade as carved
  // apertures. Oblique lighting gives their reveals a lip and a far wall.
  vec2 cell=fract((uv+4.5)*3.);
  for(int level=0;level<2;level++){
    vec2 local=cell-.5;
    float rim=max(abs(local.x),abs(local.y));
    float cavity=1.-smoothstep(.13,.175,rim);
    float wall=smoothstep(.035,.125,rim)*(.48+.44*dot(normalize(local+vec2(.001)),vec2(-.8,.6)));
    float resolvable=level==0?1.:clamp(1.1-depth*.09,0.,1.);
    color=mix(color,color*(.21+.52*wall)+vec3(.016,.01,.048),cavity*resolvable);
    color+=max(0.,1.-abs(rim-.173)*105.)*resolvable*vec3(.038,.038,.06);
    cell=fract(cell*3.);
  }
  color*=ao*ao;
  color=mix(color,vec3(.046,.035,.12),1.-exp(-max(0.,depth)*.046));
  gl_FragColor=vec4(color,1.);
}`;

function camera(f:ResonantFrame){
  const t=f.time;
  return {eye:[.56*Math.sin(t*.18),.16*Math.cos(t*.23),-3.46+.54*Math.sin(t*.25)+f.low*.23] as Vec,
    yaw:.47+.18*Math.sin(t*.16)+f.attack*.065,
    pitch:.19+.1*Math.sin(t*.23)-f.mid*.04, focal:1.4-f.low*.08+.017*Math.cos(f.beat*Math.PI*2)};
}

function buildGL(){
  const surface=document.createElement("canvas");
  const gl=surface.getContext("webgl",{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:false});
  if(!gl)return null;
  const compiled:WebGLShader[]=[];
  const program=gl.createProgram(),buffer=gl.createBuffer();
  const dispose=()=>{
    gl.deleteBuffer(buffer);gl.deleteProgram(program);
    compiled.forEach(shader=>gl.deleteShader(shader));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  if(!program||!buffer){dispose();return null;}
  for(const [kind,code] of [[gl.VERTEX_SHADER,vertexSource],[gl.FRAGMENT_SHADER,fragmentSource]] as const){
    const shader=gl.createShader(kind);
    if(!shader){dispose();return null;}
    compiled.push(shader);
    gl.shaderSource(shader,code);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){dispose();return null;}
    gl.attachShader(program,shader);
  }
  gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS)){dispose();return null;}
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  const faces=buildSponge(3),vertices=new Float32Array(faces.length*6*7);
  let p=0;
  for(const face of faces)for(const i of [0,1,2,0,2,3]){
    vertices.set(face.points[i],p);vertices.set(face.normal,p+3);vertices[p+6]=face.shade[i];p+=7;
  }
  gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.STATIC_DRAW);
  for(const [name,count,offset] of [["position",3,0],["normal",3,12],["occlusion",1,24]] as const){
    const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,count,gl.FLOAT,false,28,offset);
  }
  const uniform=(name:string)=>gl.getUniformLocation(program,name);
  const eye=uniform("eye"),rotation=uniform("rotation"),projection=uniform("projection"),levels=uniform("levels"),time=uniform("t"),offset=uniform("offsetZ");
  gl.enable(gl.DEPTH_TEST);gl.clearColor(.048,.037,.112,1);
  const vertexCount=p/7;
  return {dispose,draw(ctx:CanvasRenderingContext2D,w:number,h:number,f:ResonantFrame){
    if(gl.isContextLost())return false;
    const pixels=Math.min(ctx.canvas.width/w,1480/w,1120/h);
    const pw=Math.max(1,Math.round(w*pixels)),ph=Math.max(1,Math.round(h*pixels));
    if(surface.width!==pw||surface.height!==ph){surface.width=pw;surface.height=ph;gl.viewport(0,0,pw,ph);}
    const cam=camera(f);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform3f(eye,...cam.eye);
    gl.uniform4f(rotation,Math.sin(cam.yaw),Math.cos(cam.yaw),Math.sin(cam.pitch),Math.cos(cam.pitch));
    gl.uniform2f(projection,cam.focal*h/w,cam.focal);
    gl.uniform4f(levels,f.low,f.mid,f.high,f.attack);gl.uniform1f(time,f.time);
    // A second lattice continues through the windows at the far end of the gallery.
    for(const z of [0,9]){gl.uniform1f(offset,z);gl.drawArrays(gl.TRIANGLES,0,vertexCount);}
    ctx.drawImage(surface,0,0,w,h);return true;
  }};
}

type ScreenPoint = [number,number,number];
function clipNear(points:ScreenPoint[]){
  const out:ScreenPoint[]=[],near=.13;
  let a=points[points.length-1];
  for(const b of points){
    if((a[2]>=near)!==(b[2]>=near)){
      const u=(near-a[2])/(b[2]-a[2]);
      out.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,near]);
    }
    if(b[2]>=near)out.push(b);
    a=b;
  }
  return out;
}

export function makeArchitecture(){
  const gl=buildGL();let spare:Face[]|undefined;
  return {dispose:()=>gl?.dispose(),draw(ctx:CanvasRenderingContext2D,w:number,h:number,f:ResonantFrame){
    if(gl?.draw(ctx,w,h,f))return;
    spare??=buildSponge(2);
    const cam=camera(f),cy=Math.cos(cam.yaw),sy=Math.sin(cam.yaw),cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch);
    const polygons:{points:ScreenPoint[];color:string;depth:number}[]=[];
    ctx.fillStyle="#17102d";ctx.fillRect(0,0,w,h);
    for(const shift of [0,9])for(const {points,normal,shade} of spare){
      const a=points[0],dx=cam.eye[0]-a[0],dy=cam.eye[1]-a[1],dz=cam.eye[2]-a[2]-shift;
      if(normal[0]*dx+normal[1]*dy+normal[2]*dz<=0)continue;
      const view=points.map(([x,y,z]):ScreenPoint=>{
        x-=cam.eye[0];y-=cam.eye[1];z+=shift-cam.eye[2];
        const side=cy*x-sy*z,depth=sy*x+cy*z;
        return [side,cp*y-sp*depth,cp*depth+sp*y];
      });
      const near=clipNear(view);if(!near.length)continue;
      const screen=near.map(([x,y,z]):ScreenPoint=>[w*.5+x*h*cam.focal*.5/z,h*.5-y*h*cam.focal*.5/z,z]);
      if(screen.every(p=>p[0]<0)||screen.every(p=>p[0]>w)||screen.every(p=>p[1]<0)||screen.every(p=>p[1]>h))continue;
      const depth=near.reduce((sum,p)=>sum+p[2],0)/near.length;
      const shadeValue=(.61+.22*normal[1]-.22*normal[0]-.16*normal[2])*(.8+.2*shade[0]);
      const pool=.65+.35*Math.sin(a[0]*.7+a[1]*1.7+f.time*.22);
      const l=10+shadeValue*39/(1+depth*.034)+f.high*4;
      const color="hsl("+Math.round(239+pool*20)+","+Math.round(20+pool*51+f.mid*12)+"%,"+Math.round(l)+"%)";
      polygons.push({points:screen,depth,color});
    }
    polygons.sort((a,b)=>b.depth-a.depth);
    for(const {points,color} of polygons){
      ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
      ctx.fillStyle=color;ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=.5;ctx.stroke();
    }
  }};
}
