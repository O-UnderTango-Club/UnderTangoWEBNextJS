"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { departments } from "../central/departments";
import type { Board } from "../../src/lib/panel-model";
import styles from "./control.module.css";

type Task = Board["tasks"][number];
type Data = { tasks: Task[]; fronts: Board["fronts"]; assignments: { id: string; department: string | null }[]; updatedAt: string };
type Mode = "overview" | "urgent" | "dates" | "priority";
const colors = ["#cf8369", "#d4aa58", "#8bb0a2", "#948bc1", "#c17891", "#7ba9c1", "#a9ad6e", "#d39b6a", "#a4a7d7", "#83b8af"];
const stages: Record<string, string> = { ready: "Disponible", recurring: "Recurrente", doing: "En curso", scheduled: "Programada", waiting: "En espera" };
const frontNames = ["Primario", "Secundario", "Terciario"];
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Cordoba", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
function daysLeft(value: string) { return Math.round((Date.parse(`${value.slice(0, 10)}T00:00:00Z`) - Date.parse(`${today()}T00:00:00Z`)) / 86400000); }
function dateLabel(value: string) { if (!value) return "Sin fecha l�mite"; const d = daysLeft(value); return `${new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })}${d < 0 ? " � vencida" : d === 0 ? " � hoy" : ""}`; }
const high = (t: Task) => /alta|urgente|cr[i�]tica/i.test(t.priority || "");
const urgent = (t: Task) => !!t.due && daysLeft(t.due) <= 7;

type Face = { points: [number, number][]; code: string; depth: number; color: string };
function Sphere({ selected, choose, counts }: { selected: string | null; choose: (s: string) => void; counts: Record<string, number> }) {
  const canvas = useRef<HTMLCanvasElement>(null), faces = useRef<Face[]>([]), drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [rotation, setRotation] = useState({ x: -0.15, y: 0.12 });
  useEffect(() => {
    const el = canvas.current; if (!el) return;
    const draw = () => {
      const rect = el.getBoundingClientRect(), size = Math.max(1, Math.round(rect.width)), ratio = Math.min(window.devicePixelRatio || 1, 2);
      el.width = size * ratio; el.height = size * ratio; const ctx = el.getContext("2d"); if (!ctx) return;
      ctx.scale(ratio, ratio); const r = size * 0.39, center = size / 2;
      const project = (lat: number, lon: number): [number, number, number] => {
        const X = Math.cos(lat) * Math.sin(lon), Y = Math.sin(lat), Z = Math.cos(lat) * Math.cos(lon);
        const x = X * Math.cos(rotation.y) + Z * Math.sin(rotation.y), z = Z * Math.cos(rotation.y) - X * Math.sin(rotation.y);
        const y = Y * Math.cos(rotation.x) - z * Math.sin(rotation.x), depth = Y * Math.sin(rotation.x) + z * Math.cos(rotation.x);
        return [center + x * r, center - y * r, depth];
      };
      const list: Face[] = [];
      // The first nine sectors retain the 3�3 order of � Central; 89 is the transverse band.
      departments.forEach((dept, index) => {
        const row = Math.floor(index / 3), col = index % 3;
        const latTop = index === 9 ? -1.04 : 1.19 - row * 0.74, latBottom = index === 9 ? -1.48 : latTop - 0.67;
        const lonStart = index === 9 ? -Math.PI : -Math.PI + col * 2 * Math.PI / 3 + 0.025;
        const lonEnd = index === 9 ? Math.PI : lonStart + 2 * Math.PI / 3 - 0.05;
        for (let a = 0; a < 7; a++) for (let b = 0; b < (index === 9 ? 24 : 14); b++) {
          const n = index === 9 ? 24 : 14, la = latBottom + (latTop - latBottom) * a / 7, lb = latBottom + (latTop - latBottom) * (a + 1) / 7;
          const lo = lonStart + (lonEnd - lonStart) * b / n, lp = lonStart + (lonEnd - lonStart) * (b + 1) / n;
          const p = [project(la, lo), project(la, lp), project(lb, lp), project(lb, lo)];
          const depth = p.reduce((sum, v) => sum + v[2], 0) / 4;
          if (depth > 0.035) list.push({ points: p.map(v => [v[0], v[1]]), code: dept.number, depth, color: colors[index] });
        }
      });
      list.sort((a, b) => a.depth - b.depth); faces.current = list;
      ctx.shadowColor = "#d9a947"; ctx.shadowBlur = 24; ctx.beginPath(); ctx.arc(center, center, r * 1.03, 0, Math.PI * 2); ctx.strokeStyle = "#a57c3c55"; ctx.lineWidth = 1; ctx.stroke(); ctx.shadowBlur = 0;
      list.forEach(face => { ctx.beginPath(); face.points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.globalAlpha = selected && selected !== face.code ? .48 : .45 + face.depth * .5; ctx.fillStyle = face.color; ctx.fill(); ctx.strokeStyle = face.color; ctx.lineWidth = .65; ctx.stroke(); }); ctx.globalAlpha = 1;
      departments.forEach((dept,index) => {
        const row = Math.floor(index / 3), col = index % 3, lat = index === 9 ? -1.23 : .855 - row * .74;
        const lon = index === 9 ? 0 : -Math.PI + (col + .5) * 2 * Math.PI / 3;
        const [x,y,z] = project(lat,lon); if (z < .18) return;
        ctx.globalAlpha = Math.min(1, z * 2); ctx.textAlign = "center"; ctx.fillStyle = "#fff9eb"; ctx.font = `700 ${Math.max(14,size*.04)}px sans-serif`; ctx.fillText(dept.number,x,y-2); ctx.font = `500 ${Math.max(11,size*.025)}px sans-serif`; ctx.fillText(`${counts[dept.number] || 0} acciones`,x,y+16); ctx.globalAlpha = 1;
      });
    };
    draw(); const observer = new ResizeObserver(draw); observer.observe(el); return () => observer.disconnect();
  }, [rotation, selected, counts]);
  const start = (e: PointerEvent<HTMLCanvasElement>) => { drag.current = { x: e.clientX, y: e.clientY, moved: false }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent<HTMLCanvasElement>) => { const d = drag.current; if (!d) return; const dx=e.clientX-d.x, dy=e.clientY-d.y; if (Math.abs(dx)+Math.abs(dy)>1) d.moved=true; d.x=e.clientX; d.y=e.clientY; setRotation(v=>({x:Math.max(-1.2,Math.min(1.2,v.x+dy*.008)),y:v.y+dx*.008})); };
  const end = (e: PointerEvent<HTMLCanvasElement>) => { const d=drag.current; if (d && !d.moved) { const el=e.currentTarget, box=el.getBoundingClientRect(), ctx=el.getContext("2d"); if (ctx) { const x=(e.clientX-box.left)*el.width/box.width,y=(e.clientY-box.top)*el.height/box.height; for (const f of [...faces.current].reverse()) { ctx.beginPath(); f.points.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py)); ctx.closePath(); if(ctx.isPointInPath(x,y)){choose(f.code);break;} } } } drag.current=null; };
  return <canvas ref={canvas} className={styles.canvas} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>{drag.current=null;}} aria-hidden="true" />;
}

export default function Control() {
  const [data,setData]=useState<Data>(), [error,setError]=useState(""), [loading,setLoading]=useState(true), [selected,setSelected]=useState<string|null>(null), [mode,setMode]=useState<Mode>("overview"), [showRest,setShowRest]=useState(false);
  const refresh=useCallback(async()=>{setLoading(true);try {const r=await fetch("/api/central-control",{credentials:"same-origin",cache:"no-store"});const v=await r.json();if(!r.ok)throw new Error(v.error||"No se pudo actualizar.");setData(v);setError("");}catch(e){setData(undefined);setError(e instanceof Error?e.message:"No se pudo conectar.");}finally{setLoading(false);}},[]);
  useEffect(()=>{void refresh();},[refresh]);
  useEffect(()=>{const update=()=>{if(document.visibilityState==="visible")void refresh();};const timer=window.setInterval(update,120000);document.addEventListener("visibilitychange",update);window.addEventListener("online",update);return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",update);window.removeEventListener("online",update);};},[refresh]);
  const { actions, counts }=useMemo(()=>{const map=new Map((data?.assignments||[]).map(x=>[x.id,x.department])); const actions=(data?.tasks||[]).filter(t=>!t.isGroup&&!['done','cancelled'].includes(t.stage)).map(t=>({ ...t, department:map.get(t.id)||null }));const counts:Record<string,number>={};for(const t of actions)counts[t.department||"unassigned"]=(counts[t.department||"unassigned"]||0)+1;return { actions,counts };},[data]);
  const filtered=actions.filter(t=>(!selected||(selected==="unassigned"?!t.department:t.department===selected))&&(mode==="overview"||mode==="urgent"&&urgent(t)||mode==="dates"&&!!t.due||mode==="priority"&&high(t)));
  const sorted=[...filtered].sort((a,b)=>{if(mode==="urgent"||mode==="dates")return (a.due||"9999").localeCompare(b.due||"9999")||a.name.localeCompare(b.name,"es");return frontNames.indexOf(a.front)-frontNames.indexOf(b.front)||(a.rank||9999)-(b.rank||9999)||a.name.localeCompare(b.name,"es");});
  const highlighted=new Set((data?.fronts||[]).flatMap(f=>f.tasks));
  const highlightedMembers=new Set((data?.tasks||[]).filter(t=>t.isGroup&&highlighted.has(t.id)&&t.nextId).map(t=>t.nextId));
  const preferred=mode==="overview"?sorted.filter(t=>highlighted.has(t.id)||highlightedMembers.has(t.id)):sorted;
  const rest=mode==="overview"?sorted.filter(t=>!preferred.includes(t)):[];
  const selectedDept=departments.find(d=>d.number===selected);
  const choose=(code:string)=>{setSelected(code);setShowRest(false);};
  const card=(t:typeof actions[number])=><article className={styles.card} key={t.id}><div className={styles.cardTop}><span>{t.department?`${t.department} � ${departments.find(d=>d.number===t.department)?.keyword||"Departamento"}`:"Sin departamento"}</span><span>{stages[t.stage]||t.stage}</span></div><h3>{t.name}</h3><div className={styles.meta}><span className={urgent(t)?styles.warn:""}>{dateLabel(t.due)}</span>{t.priority&&<span>Prioridad {t.priority.toLowerCase()}</span>}<span>{t.front}{t.rank?` � ${t.rank}`:""}</span></div>{t.owner&&<p className={styles.owner}>{t.owner}</p>}{t.stage==="waiting"&&t.blockers.length>0&&<p className={styles.owner}>Espera: {t.blockers.join(", ")}</p>}{t.issues.length>0&&<p className={styles.warn}>Revisar: {t.issues.join(" � ")}</p>}</article>;
  return <main className={styles.main}><header className={styles.header}><a href="/panel-de-control">� UnderTango � Panel de control</a><button onClick={()=>void refresh()} disabled={loading}>{loading?"Actualizando.":"Actualizar"}</button></header><section className={styles.intro}><p className={styles.eyebrow}>Una mirada para empezar</p><h1>Central de <em>control</em></h1><p>Todo el sistema a la vista. Eleg� un departamento y descubr� por d�nde avanzar.</p></section>
    {error&&<div className={styles.message} role="alert"><strong>No pudimos abrir la informaci�n.</strong><p>{error}</p><a href="/panel-de-control">Abrir el panel de control</a></div>}
    {data&&<><div className={styles.workspace}><section className={styles.orbit} aria-label="Departamentos de UnderTango"><div className={styles.orbitHead}><div><span className={styles.eyebrow}>� Sistema operativo</span><h2>Explor� la esfera</h2></div><span>{actions.length} acciones abiertas</span></div><Sphere selected={selected} choose={choose} counts={counts}/><p className={styles.hint}>Arrastr� para girar � Toc� un sector para abrirlo</p><div className={styles.departmentList} aria-label="Elegir departamento">{departments.map((d,i)=><button key={d.number} className={selected===d.number?styles.chosen:""} onClick={()=>choose(d.number)} aria-pressed={selected===d.number}><span style={{background:colors[i]}} />{d.number} {d.keyword}<b>{counts[d.number]||0}</b></button>)}<button className={selected==="unassigned"?styles.chosen:""} onClick={()=>choose("unassigned")} aria-pressed={selected==="unassigned"}><span className={styles.gray}/>Sin departamento<b>{counts.unassigned||0}</b></button></div></section>
    <section className={styles.detail} aria-live="polite"><div className={styles.detailTop}><div><p className={styles.eyebrow}>{selectedDept?`Departamento ${selectedDept.number}`:selected==="unassigned"?"Pendientes de clasificaci�n":"Visi�n general"}</p><h2>{selectedDept?.title|| (selected==="unassigned"?"Sin departamento":"Todo UnderTango")}</h2></div>{selected&&<button onClick={()=>setSelected(null)}>Ver todo</button>}</div><p className={styles.description}>{selectedDept?.description||"Eleg� una perspectiva para ordenar las acciones abiertas."}</p><div className={styles.tabs} role="group" aria-label="Perspectiva de acciones">{([["overview","Para avanzar"],["urgent","Urgentes"],["dates","Con fecha l�mite"],["priority","Prioridad alta"]] as [Mode,string][]).map(([id,label])=><button key={id} aria-pressed={mode===id} className={mode===id?styles.active:""} onClick={()=>{setMode(id);setShowRest(false);}}>{label}</button>)}</div><p className={styles.viewNote}>{mode==="overview"?"Hasta tres acciones ejecutables por frente, seg�n el orden del panel. El resto queda disponible debajo.":mode==="urgent"?"Vencidas o con fecha l�mite dentro de los pr�ximos 7 d�as, incluidas las que est�n en espera.":mode==="dates"?"Todas las acciones con fecha l�mite, ordenadas por fecha.":"Acciones marcadas con prioridad alta, independientemente de su fecha."}</p><div className={styles.cards}>{(mode==="overview"?preferred:sorted).map(card)}{!(mode==="overview"?preferred:sorted).length&&<p className={styles.empty}>{mode==="overview"?"No hay acciones ejecutables de los primeros puestos en esta selecci�n.":"No hay acciones que coincidan con esta vista."}</p>}</div>{rest.length>0&&<div className={styles.more}><button onClick={()=>setShowRest(!showRest)} aria-expanded={showRest}>{showRest?"Ocultar":"Ver"} otras {rest.length} acciones abiertas</button>{showRest&&<div className={styles.cards}>{rest.map(card)}</div>}</div>}<a className={styles.panelLink} href="/panel-de-control">Abrir el panel para editar acciones</a></section></div><footer className={styles.footer}>Datos de Supabase � Actualizado {new Date(data.updatedAt).toLocaleString("es-AR",{timeZone:"America/Argentina/Cordoba",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</footer></>}
  </main>;
}

