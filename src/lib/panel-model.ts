export const BASE = "appJwwHP1Wkoxo54q";
export const TABLES = { projects: "tblf6DZBViGbvxRzS", tasks: "tblnmNNkFemgOlOlw", events: "tblQhjY5HpSlMPCpp", cases: "tblguHWSAk4wyfNjQ" };
export const F = {
  projects: { name:"fldChULRkd1GrXY3w", status:"fldcypAILEecLnLGQ", front:"fldy1wMKKlc6TRvmf", rank:"fldGtRBM8QYXGZQPd", purpose:"fldrApFZcuzKj3Gax", doc:"fldiMnJUvRox1quBE" },
  tasks: { name:"fldLO5zuV38eu576D", description:"fldlv5rjVOU4TLjD5", owner:"fldi6lt4W8IAlBlAm", status:"fldLXBjnEHgHDJvX0", priority:"fldkWFX5EzySkDrLi", due:"fldixmckZrFiyJ6xd", result:"fldn1XmmTwRDnzQDd", cases:"fldazeCmB0kKeC56A", projects:"fldOCm8x8sOWDNlw6", events:"fldFwHCG8zQkO2gHv", gate:"fldh7b5L9hg89tle4", reason:"fldnNMs1CYSffH0Cc", trigger:"fldcTRjO3pX2hy60N", dependencies:"fldoqev0eaVgZVt6G", order:"fldZCklniYktPL5NA", doc:"fldZfQfRxnxZD2WZI" },
  events: { key:"fldDFsxIuKAGvzCW8", name:"fldnJbUExwp1QxEet", status:"fldYDOPJvKg4RAkSo", type:"fld03HgdmMkrXQsz9", occurred:"fldwIQR5BHirvuLLD", evidence:"fldap8xuzZwCpqouP" },
  cases: { name:"fldTyP9DE3ANVtoBN", projects:"fldCd5XSjO7ySQYoj" }
};
export const FRONTS = ["Primario", "Secundario", "Terciario"];
export function frontPosition(front: string, rank: number) {
  const group = FRONTS.indexOf(front) + 1;
  return group && Number.isInteger(rank) && rank > 0 && rank !== 9999 ? `${group}.${rank}` : "Sin posición";
}
export type Raw = { id: string; fields: Record<string, any> };
export type Snapshot = { projects: Raw[]; tasks: Raw[]; events: Raw[]; cases: Raw[]; updatedAt: string };
export type Stage = "ready" | "doing" | "waiting" | "catalog" | "done" | "cancelled";
const s = (v: unknown): string => typeof v === "string" ? v : "";
const links = (v: unknown): string[] => Array.isArray(v) ? v.filter(x => typeof x === "string") : [];
const unique = (v: string[]) => [...new Set(v)];
export function projectOpen(p: Raw) { return !["Completado", "Archivado"].includes(p.fields[F.projects.status]); }
export function closed(t: Raw) { return ["Hecho", "Cancelado"].includes(t.fields[F.tasks.status]); }
export function cycleFrom(id: string, tasks: Raw[]): boolean {
  const map = new Map(tasks.map(t => [t.id, links(t.fields[F.tasks.dependencies])]));
  const walk = (node: string, path: Set<string>): boolean => {
    if (path.has(node)) return true;
    const next = new Set(path); next.add(node);
    return (map.get(node) || []).some(dep => walk(dep, next));
  };
  return walk(id, new Set());
}
export function taskProjects(t: Raw, data: Snapshot) {
  return unique([...links(t.fields[F.tasks.projects]), ...links(t.fields[F.tasks.cases]).flatMap(id => links(data.cases.find(c=>c.id===id)?.fields[F.cases.projects]))]);
}
export function classify(t: Raw, data: Snapshot): { stage: Stage; issues: string[]; blockers: string[]; released: boolean } {
  const f=t.fields, issues: string[]=[], blockers: string[]=[];
  if (closed(t)) return {stage:f[F.tasks.status]==="Hecho"?"done":"cancelled",issues,blockers,released:false};
  const gate=s(f[F.tasks.gate]), status=s(f[F.tasks.status]);
  const deps=links(f[F.tasks.dependencies]), events=links(f[F.tasks.events]);
  const projects=taskProjects(t,data), caseIds=links(f[F.tasks.cases]);
  if (!s(f[F.tasks.name]).trim()) issues.push("Falta el nombre de la acción");
  if (!projects.length && !caseIds.length) issues.push("Vincular a un proyecto o caso");
  if (caseIds.some(id=>!data.cases.some(c=>c.id===id))) issues.push("Caso vinculado no encontrado");
  if (projects.length && !data.projects.some(p=>projects.includes(p.id)&&projectOpen(p))) issues.push("Sólo vinculada a proyectos cerrados");
  if (!gate || gate==="Por revisar") issues.push("Definir la acción y su estado");
  const expected: Record<string,string>={"Acción inmediata":"Pendiente","En acción":"En curso","En espera":"En espera"};
  if (gate && gate!=="Por revisar" && expected[gate]!==status) issues.push("Estados incompatibles en Seguimientos");
  if (gate==="En espera" && !deps.length && !events.length) issues.push("Espera sin dependencia vinculada");
  if (cycleFrom(t.id,data.tasks)) issues.push("Dependencias circulares");
  for (const id of deps) {
    const dep=data.tasks.find(x=>x.id===id);
    if (!dep) issues.push("Dependencia no encontrada");
    else if (dep.fields[F.tasks.status]==="Cancelado") issues.push(`Revisar dependencia descartada: ${dep.fields[F.tasks.name]}`);
    else if (dep.fields[F.tasks.status]!=="Hecho") blockers.push(s(dep.fields[F.tasks.name]));
  }
  for (const id of events) {
    const event=data.events.find(x=>x.id===id);
    if (!event) issues.push("Evento vinculado no encontrado");
    else if (event.fields[F.events.status]==="Descartado") issues.push(`Revisar evento descartado: ${event.fields[F.events.name]}`);
    else if (event.fields[F.events.status]!=="Ocurrido" || !s(event.fields[F.events.evidence]).trim() || !event.fields[F.events.occurred]) blockers.push(s(event.fields[F.events.name]));
  }
  const released=gate==="En espera" && !!(deps.length+events.length) && !blockers.length && !issues.length;
  const stage: Stage=issues.length?"catalog":blockers.length?"waiting":gate==="En acción"?"doing":"ready";
  return {stage,issues,blockers,released};
}
export function board(data: Snapshot) {
  const projects=data.projects.map(p=>({id:p.id,name:s(p.fields[F.projects.name]),status:s(p.fields[F.projects.status]),front:s(p.fields[F.projects.front]),rank:Number(p.fields[F.projects.rank])||9999,purpose:s(p.fields[F.projects.purpose]).slice(0,500),doc:s(p.fields[F.projects.doc]),open:projectOpen(p)}));
  const tasks=data.tasks.map(t=>{
    const f=t.fields;
    return {id:t.id,name:s(f[F.tasks.name]),description:s(f[F.tasks.description]).slice(0,1200),owner:s(f[F.tasks.owner]),priority:s(f[F.tasks.priority]),due:s(f[F.tasks.due]),reason:s(f[F.tasks.reason]).slice(0,1000),trigger:s(f[F.tasks.trigger]).slice(0,600),doc:s(f[F.tasks.doc]),order:Number(f[F.tasks.order])||0,status:s(f[F.tasks.status]),gate:s(f[F.tasks.gate]),projectIds:taskProjects(t,data),directProjectIds:links(f[F.tasks.projects]),caseIds:links(f[F.tasks.cases]),dependencies:links(f[F.tasks.dependencies]),eventIds:links(f[F.tasks.events]),...classify(t,data)};
  });
  const priorityProject=(ids:string[])=>projects.filter(p=>ids.includes(p.id)&&p.open&&FRONTS.includes(p.front)).sort((a,b)=>FRONTS.indexOf(a.front)-FRONTS.indexOf(b.front)||a.rank-b.rank||a.id.localeCompare(b.id))[0];
  tasks.sort((a,b)=>{
    const pa=priorityProject(a.projectIds),pb=priorityProject(b.projectIds);
    return (pa?FRONTS.indexOf(pa.front):9)-(pb?FRONTS.indexOf(pb.front):9)||(pa?.rank||9999)-(pb?.rank||9999)||(a.order||9999)-(b.order||9999)||a.name.localeCompare(b.name,"es")||a.id.localeCompare(b.id);
  });
  const usedProjects=new Set<string>();
  const fronts=FRONTS.map(name=>({name,tasks:tasks.filter(t=>{
    const p=priorityProject(t.projectIds);
    if(t.stage!=="ready"||p?.front!==name||!Number.isInteger(p.rank)||p.rank<1||p.rank>3||usedProjects.has(p.id)) return false;
    usedProjects.add(p.id); return true;
  }).slice(0,3).map(t=>t.id)}));
  const projectIssues=projects.filter(p=>p.open).flatMap(p=>{
    const reasons=[];
    if(!FRONTS.includes(p.front)) reasons.push("Asignar frente");
    if(p.rank===9999||p.rank<1||!Number.isInteger(p.rank)) reasons.push("Asignar posición");
    if(projects.some(q=>q.open&&q.id!==p.id&&q.front===p.front&&q.rank===p.rank)) reasons.push("Posición repetida en el frente");
    if(!tasks.some(t=>t.projectIds.includes(p.id)&&!["done","cancelled"].includes(t.stage))) reasons.push("Definir próximo paso");
    return reasons.length?[{id:p.id,reasons}]:[];
  });
  return {updatedAt:data.updatedAt,projects,tasks,fronts,projectIssues,events:data.events.map(e=>({id:e.id,name:s(e.fields[F.events.name]),status:s(e.fields[F.events.status]),type:s(e.fields[F.events.type]),evidence:s(e.fields[F.events.evidence]),occurred:s(e.fields[F.events.occurred])})),cases:data.cases.map(c=>({id:c.id,name:s(c.fields[F.cases.name])}))};
}
export type Board = ReturnType<typeof board>;
export function projectActionSummary(projectId: string, tasks: Board["tasks"]) {
  const open = tasks.filter(t=>t.projectIds.includes(projectId)&&!["done","cancelled"].includes(t.stage));
  const ready = open.filter(t=>t.stage==="ready").length;
  const counts = ([ ["catalog","por catalogar"], ["waiting","en espera"], ["doing","en curso"] ] as const)
    .map(([stage,label])=>{const count=open.filter(t=>t.stage===stage).length;return count?`${count} ${label}`:"";}).filter(Boolean);
  return {
    open: open.length,
    ready,
    text: ready?`${ready} ${ready===1?"acción inmediata":"acciones inmediatas"}`:open.length?`Sin acción inmediata: ${counts.join(" · ")}.`:"Falta definir una próxima acción.",
    issues: ready?[]:unique(open.flatMap(t=>t.issues)).slice(0,3)
  };
}
export function validateTask(t: Raw, data: Snapshot, stage: Stage) {
  if(!s(t.fields[F.tasks.name]).trim()) throw new Error("Escribí una acción concreta.");
  if(cycleFrom(t.id,data.tasks.filter(x=>x.id!==t.id).concat(t))) throw new Error("La dependencia crea un ciclo.");
  if(["catalog","done","cancelled"].includes(stage)) return;
  const check=classify(t,{...data,tasks:data.tasks.filter(x=>x.id!==t.id).concat(t)});
  if(check.issues.length) throw new Error(check.issues.join(". "));
  if(["ready","doing"].includes(stage)&&check.blockers.length) throw new Error("Todavía hay dependencias pendientes. Usá En espera.");
  if(stage==="waiting"&&!check.blockers.length) throw new Error("Las dependencias ya están resueltas. La acción está disponible.");
}
