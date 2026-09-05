import { createHash } from "node:crypto";
import { deviceActor } from "./panel-access";
import { BASE, TABLES, F, Snapshot, Raw, Stage, board, closed, classify, projectOpen, taskProjects, validateTask } from "./panel-model";

export class PanelError extends Error { constructor(message: string, public status=400) { super(message); } }
export async function authorize(request: Request) {
  const device = deviceActor(request);
  if (device) return device;
  const token=request.headers.get("authorization");
  if(!token?.startsWith("Bearer ") || token.length>10000) throw new PanelError("Ingresá para abrir el panel.",401);
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key) throw new PanelError("El acceso privado necesita configuración.",503);
  let response: Response;
  try { response=await fetch(`${url}/auth/v1/user`,{headers:{apikey:key,Authorization:token},cache:"no-store",signal:AbortSignal.timeout(12000)}); }
  catch { throw new PanelError("No se pudo verificar tu sesión. Volvé a intentar.",503); }
  if(!response.ok) throw new PanelError("La sesión venció. Volvé a ingresar.",401);
  const user=await response.json();
  const allowed=(process.env.PANEL_ALLOWED_EMAILS||"pablocieslik@gmail.com").split(",").map(x=>x.trim().toLowerCase());
  if(!user.email_confirmed_at||!allowed.includes(String(user.email||"").toLowerCase())) throw new PanelError("Esta cuenta no tiene acceso al panel.",403);
  return user.email as string;
}
let lastRequest=0;
let queue: Promise<unknown>=Promise.resolve();
async function airtable(table: string, query="", options: RequestInit={}) {
  const token=process.env.AIRTABLE_PANEL_TOKEN||process.env.AIRTABLE_TOKEN;
  if(!token) throw new PanelError("Falta conectar Airtable al servidor del panel. No se muestran datos antiguos.",503);
  const run=async()=>{
    const delay=Math.max(0,250-(Date.now()-lastRequest));
    if(delay) await new Promise(r=>setTimeout(r,delay));
    lastRequest=Date.now();
    let response: Response;
    try { response=await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID||BASE}/${table}${query}`,{...options,headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},cache:"no-store",signal:AbortSignal.timeout(20000)}); }
    catch { throw new PanelError("No se pudo confirmar la respuesta de Airtable. Actualizá antes de reintentar el cambio.",503); }
    if(!response.ok) throw new PanelError(response.status===429?"Airtable necesita una pausa. Esperá 30 segundos y actualizá.":response.status===403?"La conexión de Airtable no tiene el permiso necesario.":"Airtable no pudo completar la operación. Actualizá antes de reintentar.",503);
    return response.json();
  };
  const result=queue.then(run,run); queue=result.catch(()=>{}); return result;
}
async function list(table: string, fields: string[]) {
  let offset=""; const rows: Raw[]=[];
  do {
    const qs=new URLSearchParams({pageSize:"100",returnFieldsByFieldId:"true"});
    fields.forEach(f=>qs.append("fields[]",f));
    if(offset) qs.set("offset",offset);
    const data=await airtable(table,`?${qs}`); rows.push(...data.records); offset=data.offset||"";
  } while(offset);
  return rows;
}
let cached: Snapshot|undefined, loading: Promise<Snapshot>|undefined;
export async function snapshot(fresh=false): Promise<Snapshot> {
  if(!fresh&&cached&&Date.now()-Date.parse(cached.updatedAt)<90000) return cached;
  if(!fresh&&loading) return loading;
  const read=async()=>{
    const projects=await list(TABLES.projects,Object.values(F.projects));
    const tasks=await list(TABLES.tasks,Object.values(F.tasks).filter(x=>x!==F.tasks.result));
    const events=await list(TABLES.events,Object.values(F.events));
    const cases=await list(TABLES.cases,Object.values(F.cases));
    cached={projects,tasks,events,cases,updatedAt:new Date().toISOString()}; return cached;
  };
  loading=read(); try{return await loading;}finally{loading=undefined;}
}
export function revision(record: Raw) {
  return createHash("sha256").update(JSON.stringify(Object.entries(record.fields).sort(([a],[b])=>a.localeCompare(b)))).digest("hex");
}
export function responseBoard(data: Snapshot) {
  return {...board(data),revisions:Object.fromEntries([...data.projects,...data.tasks,...data.events].map(r=>[r.id,revision(r)]))};
}
const states: Record<Stage,[string,string|null]>={ready:["Pendiente","Acción inmediata"],doing:["En curso","En acción"],waiting:["En espera","En espera"],catalog:["Pendiente","Por revisar"],done:["Hecho","Terminada"],cancelled:["Cancelado",null]};
function text(value: unknown,max=500) { if(typeof value!=="string"||value.length>max) throw new PanelError(`Texto inválido (máximo ${max} caracteres).`); return value.trim(); }
function refs(value: unknown, rows: Raw[]) {
  if(!Array.isArray(value)||value.length>30||value.some(id=>typeof id!=="string"||!rows.some(r=>r.id===id))) throw new PanelError("Revisá los registros vinculados.");
  return [...new Set(value)];
}
function doc(value: unknown) {
  const v=text(value,1000); if(!v) return null;
  let url:URL; try{url=new URL(v);}catch{throw new PanelError("Usá un enlace válido de Google Drive o Docs.");}
  if(url.protocol!=="https:"||!["docs.google.com","drive.google.com"].includes(url.hostname)) throw new PanelError("El documento debe estar en Google Drive o Docs.");
  return v;
}
let writeQueue: Promise<unknown>=Promise.resolve();
export function mutate(input: any, actor: string) {
  const work=()=>performMutation(input,actor);
  const result=writeQueue.then(work,work); writeQueue=result.catch(()=>{}); return result;
}
async function performMutation(input: any, actor: string) {
  if(!input||!["task","project","event"].includes(input.kind)) throw new PanelError("Operación desconocida.");
  const data=await snapshot(true), kind=input.kind as "task"|"project"|"event";
  const rows=kind==="task"?data.tasks:kind==="project"?data.projects:data.events;
  const table=kind==="task"?TABLES.tasks:kind==="project"?TABLES.projects:TABLES.events;
  const current=input.id?rows.find(r=>r.id===input.id):undefined;
  if(input.id&&!current) throw new PanelError("El registro ya no está disponible.",404);
  if(current&&input.revision!==revision(current)) throw new PanelError("El registro cambió desde que lo abriste. Cerrá el editor, actualizá y revisá el cambio.",409);
  const change=input.changes;
  if(!change||typeof change!=="object"||Array.isArray(change)) throw new PanelError("Cambio inválido.");
  const fields: Record<string,any>={};
  const rankChanges: {id:string;fields:Record<string,any>}[]=[];
  if(kind==="task") {
    const allowed=["name","owner","priority","due","stage","reason","doc","order","projects","cases","dependencies","events","evidence"];
    if(Object.keys(change).some(k=>!allowed.includes(k))) throw new PanelError("Campo no editable.");
    for(const k of ["name","owner","reason"] as const) if(k in change) fields[F.tasks[k]]=text(change[k],k==="reason"?1000:250);
    if("doc" in change) fields[F.tasks.doc]=doc(change.doc);
    if("priority" in change) {if(!["Alta","Media","Baja"].includes(change.priority)) throw new PanelError("Prioridad inválida."); fields[F.tasks.priority]=change.priority;}
    if("due" in change){const d=text(change.due,10); if(d&&(!/^\d{4}-\d{2}-\d{2}$/.test(d)||new Date(d).toISOString().slice(0,10)!==d))throw new PanelError("Fecha inválida.");fields[F.tasks.due]=d||null;}
    if("order" in change){if(!Number.isInteger(change.order)||change.order<0||change.order>9999)throw new PanelError("El orden debe ser un entero positivo."); fields[F.tasks.order]=change.order||null;}
    for(const [key,records] of [["projects",data.projects],["cases",data.cases],["dependencies",data.tasks],["events",data.events]] as const) if(key in change)fields[F.tasks[key]]=refs(change[key],records);
    let stage:Stage=change.stage;
    if(stage&&!states[stage])throw new PanelError("Estado inválido.");
    if(!current&&!stage) stage="catalog";
    if(stage){[fields[F.tasks.status],fields[F.tasks.gate]]=states[stage];}
    const candidate={id:current?.id||"new",fields:{...current?.fields,...fields}};
    const target=stage||classify(candidate,{...data,tasks:data.tasks.filter(t=>t.id!==candidate.id).concat(candidate)}).stage;
    validateTask(candidate,data,target);
    const evidence="evidence" in change?text(change.evidence,1500):"";
    if((stage==="done"||stage==="cancelled")&&!evidence)throw new PanelError(stage==="done"?"Registrá brevemente el resultado para finalizar.":"Registrá por qué se descarta.");
    if(evidence){
      const original=current?await airtable(table,`/${current.id}?returnFieldsByFieldId=true`):undefined;
      fields[F.tasks.result]=[original?.fields[F.tasks.result],`${new Date().toISOString()} · ${actor}\n${evidence}`].filter(Boolean).join("\n\n");
    }
    if(!current&&data.tasks.some(t=>!closed(t)&&String(t.fields[F.tasks.name]).trim().toLowerCase()===String(candidate.fields[F.tasks.name]).toLowerCase()))throw new PanelError("Ya existe una acción abierta con ese nombre. Buscala para continuar.",409);
  } else if(kind==="project") {
    if(!current) throw new PanelError("Los proyectos se crean en Airtable; aquí podés ordenar los existentes.");
    if(Object.keys(change).some(k=>!["front","rank","status","doc"].includes(k)))throw new PanelError("Campo no editable.");
    if("doc" in change)fields[F.projects.doc]=doc(change.doc);
    const front=change.front||current.fields[F.projects.front],rank=change.rank??current.fields[F.projects.rank];
    if("front" in change||"rank" in change) {
      if(!["Primario","Secundario","Terciario"].includes(front)||!Number.isInteger(rank)||rank<1)throw new PanelError("Elegí un frente y una posición positiva.");
      const ordered=(group:string)=>data.projects.filter(p=>p.id!==current.id&&projectOpen(p)&&p.fields[F.projects.front]===group).sort((a,b)=>(Number(a.fields[F.projects.rank])||9999)-(Number(b.fields[F.projects.rank])||9999)||a.id.localeCompare(b.id));
      const destination=ordered(front),position=Math.min(rank,destination.length+1);destination.splice(position-1,0,current);
      fields[F.projects.front]=front;fields[F.projects.rank]=position;
      const recordRanks=(group:Raw[])=>group.forEach((p,i)=>{if(p.id!==current.id&&p.fields[F.projects.rank]!==i+1)rankChanges.push({id:p.id,fields:{[F.projects.rank]:i+1}});});
      recordRanks(destination);if(current.fields[F.projects.front]!==front)recordRanks(ordered(current.fields[F.projects.front]));
    }
    if("status" in change){
      if(!["Activo","En espera","Completado","Archivado"].includes(change.status))throw new PanelError("Estado de proyecto inválido.");
      if(["Completado","Archivado"].includes(change.status)&&data.tasks.some(t=>!closed(t)&&taskProjects(t,data).includes(current.id)))throw new PanelError("Primero resolvé o reasigná las acciones abiertas del proyecto.");
      fields[F.projects.status]=change.status;
    }
  } else {
    if(Object.keys(change).some(k=>!["name","type","status","evidence"].includes(k)))throw new PanelError("Campo no editable.");
    if("name" in change) fields[F.events.name]=text(change.name,250);
    if("type" in change){if(!["Material","Respuesta","Pago","Fecha","Aprobación","Entrega","Disponibilidad","Otro"].includes(change.type))throw new PanelError("Tipo inválido.");fields[F.events.type]=change.type;}
    if("status" in change){if(!["Esperando","Ocurrido","Descartado"].includes(change.status))throw new PanelError("Estado inválido.");fields[F.events.status]=change.status;}
    if("evidence" in change)fields[F.events.evidence]=text(change.evidence,1500);
    if(change.status==="Ocurrido"){
      if(!fields[F.events.evidence]) throw new PanelError("Registrá qué evidencia confirma que ocurrió.");
      fields[F.events.occurred]=current?.fields[F.events.occurred]||new Date().toISOString();
    }
    if(!current){
      if(!fields[F.events.name])throw new PanelError("Nombrá el hecho que estás esperando.");
      if(data.events.some(e=>String(e.fields[F.events.name]).trim().toLowerCase()===String(fields[F.events.name]).toLowerCase()))throw new PanelError("Ese evento ya existe. Seleccionalo para reutilizarlo.",409);
      fields[F.events.key]=`PANEL-${crypto.randomUUID()}`;
      fields[F.events.status]||="Esperando";
    }
  }
  if(!Object.keys(fields).length)throw new PanelError("No hay cambios para guardar.");
  const saved=await airtable(table,current?`/${current.id}?returnFieldsByFieldId=true`:"?returnFieldsByFieldId=true",{method:current?"PATCH":"POST",body:JSON.stringify({fields,typecast:false})});
  cached=undefined;
  for(let i=0;i<rankChanges.length;i+=10){
    try{await airtable(table,"?returnFieldsByFieldId=true",{method:"PATCH",body:JSON.stringify({records:rankChanges.slice(i,i+10),typecast:false})});}
    catch{throw new PanelError("La posición cambió, pero la reordenación pudo quedar incompleta. Actualizá y revisá las posiciones repetidas en Por catalogar.",503);}
  }
  // Read back the affected row: a successful response is never replaced by an optimistic local state.
  const verified=await airtable(table,`/${saved.id}?returnFieldsByFieldId=true`);
  return {ok:true,id:verified.id,savedAt:new Date().toISOString()};
}
