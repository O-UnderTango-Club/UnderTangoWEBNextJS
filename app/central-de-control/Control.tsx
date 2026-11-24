"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { departments } from "../central/departments";
import { centralActionView, daysUntil, isOpenAction, type CentralMode } from "../../src/lib/central-actions";
import { ALL_DAYS, validWeekdays, type Board } from "../../src/lib/panel-model";
import WeekdayPicker from "../panel-de-control/WeekdayPicker";
import styles from "./control.module.css";

type Task = Board["tasks"][number];
type ActionOperation = "finish" | "doneToday" | "weekdays";
type DayEditor = { id: string; value: number; initial: number; revision: string; snapshotRevision: string };
type LatestChange = { requestId: string; taskId: string; operation: ActionOperation };
type Data = {
  tasks: Task[];
  fronts: Board["fronts"];
  assignments: { id: string; department: string | null }[];
  revisions: Record<string, string>;
  snapshotRevision: string;
  readOnly: boolean;
  updatedAt: string;
  latestChange: LatestChange | null;
};
type Intent =
  | { operation: ActionOperation; requestId: string; taskId: string; revision: string; snapshotRevision: string; weekdays?: number }
  | { operation: "undo"; requestId: string; originalId: string };

class RequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function controlRequest(intent?: Intent) {
  const response = await fetch("/api/central-control", {
    credentials: "same-origin",
    cache: "no-store",
    ...(intent && { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(intent) }),
  });
  const value = await response.json();
  if (!response.ok) throw new RequestError(value.error || "No se pudo guardar el cambio.", response.status);
  return value;
}
const colors = ["#cf8369", "#d4aa58", "#8bb0a2", "#948bc1", "#c17891", "#7ba9c1", "#a9ad6e", "#d39b6a", "#a4a7d7", "#83b8af"];
const stages: Record<Task["stage"], string> = { ready: "Disponible", recurring: "Recurrente", doing: "En curso", scheduled: "Programada", waiting: "En espera", done: "Finalizada", cancelled: "Cancelada" };
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Cordoba", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
function dateLabel(value: string, day: string) { if (!value) return "Sin fecha límite"; const d = daysUntil(value, day); return `${new Date(`${value.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-AR", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" })}${d < 0 ? " · vencida" : d === 0 ? " · hoy" : ""}`; }

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
      // The first nine sectors retain the 3×3 order of Ø Central; 89 is the transverse band.
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
  const [data, setData] = useState<Data>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [mode, setMode] = useState<CentralMode>("overview");
  const [showRest, setShowRest] = useState(false);
  const [openedGroup, setOpenedGroup] = useState<string | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [dayEditor, setDayEditor] = useState<DayEditor | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [changeError, setChangeError] = useState("");
  const refreshInFlight = useRef(false);
  const saveInFlight = useRef(false);
  const retryIntent = useRef<Intent | undefined>(undefined);
  const messageRef = useRef<HTMLParagraphElement>(null);

  const refresh = useCallback(async (afterSave = false) => {
    if (refreshInFlight.current || (saveInFlight.current && !afterSave)) return;
    refreshInFlight.current = true;
    setLoading(true);
    try {
      setData(await controlRequest());
      setError("");
    } catch (cause) {
      if (cause instanceof RequestError && [401, 403].includes(cause.status)) setData(undefined);
      setError(cause instanceof Error ? cause.message : "No se pudo conectar.");
    } finally {
      refreshInFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const update = () => { if (document.visibilityState === "visible") void refresh(); };
    const timer = window.setInterval(update, 120000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("online", update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("online", update);
    };
  }, [refresh]);

  async function save(operation: ActionOperation | "undo", task?: Task) {
    if (!data || data.readOnly || refreshInFlight.current || saveInFlight.current) return;
    const last = data.latestChange;
    const retry = retryIntent.current;
    let intent: Intent;
    if (operation === "undo") {
      if (!last) return;
      intent = retry?.operation === "undo" && retry.originalId === last.requestId
        ? retry : { operation, originalId: last.requestId, requestId: crypto.randomUUID() };
    } else {
      if (!task || !data.revisions[task.id] || (operation === "finish" && task.baseStage === "recurring")) return;
      const edit = operation === "weekdays" ? dayEditor : null;
      if (operation === "weekdays" && (!edit || edit.id !== task.id || !validWeekdays(edit.value))) return;
      const revision = edit?.revision ?? data.revisions[task.id];
      const snapshotRevision = edit?.snapshotRevision ?? data.snapshotRevision;
      intent = retry?.operation === operation && retry.taskId === task.id && retry.weekdays === edit?.value
        && (!edit || (retry.revision === revision && retry.snapshotRevision === snapshotRevision))
        ? retry : { operation, taskId: task.id, revision, snapshotRevision, requestId: crypto.randomUUID(), ...(edit && { weekdays: edit.value }) };
    }

    saveInFlight.current = true;
    retryIntent.current = intent;
    setSaving(true);
    setNotice("");
    setChangeError("");
    try {
      const receipt = await controlRequest(intent);
      if (receipt.ok !== true || receipt.requestId !== intent.requestId) throw new Error("Volvé a intentar para recuperar la confirmación del cambio.");
      retryIntent.current = undefined;
      setArmed(null);
      setDayEditor(null);
      setOpened(null);
      setNotice(operation === "weekdays" ? `Días de «${task?.name}» guardados.` : operation === "undo" ? "Último cambio deshecho." : operation === "finish" ? `«${task?.name}» quedó finalizada.` : `«${task?.name}» queda para su próximo día habilitado.`);
      await refresh(true);
      messageRef.current?.focus();
    } catch (cause) {
      setChangeError(cause instanceof Error ? cause.message : "No se pudo confirmar el cambio. Volvé a intentar.");
      if (cause instanceof RequestError && cause.status < 500) {
        retryIntent.current = undefined;
        setArmed(null);
        if (cause.status === 409) setDayEditor(null);
        await refresh(true);
      }
    } finally {
      setSaving(false);
      saveInFlight.current = false;
    }
  }

  const day = today();
  const { visible, rest, total, counts, departmentById } = useMemo(() => centralActionView(
    data?.tasks || [], data?.assignments || [], data?.fronts || [], selected, mode, day,
  ), [data, selected, mode, day]);
  const selectedDept=departments.find(d=>d.number===selected);
  const choose = (code: string | null) => {
    setDayEditor(null);
    setSelected(code);
    setShowRest(false);
    setOpenedGroup(null);
    setOpened(null);
    setArmed(null);
  };
  const locked = loading || saving || !!error || !!data?.readOnly;
  const card = (task: Task, members: Task[] = [], due = task.due, otherDays: Task[] = []): ReactNode => {
    const expanded = (task.isGroup ? openedGroup : opened) === task.id;
    const confirming = armed === task.id;
    const recurring = task.baseStage === "recurring";
    const description = task.description.trim();
    const eligibleToday = ["ready", "recurring", "doing"].includes(task.stage)
      && !task.issues.length && !task.blockers.length;
    const department = departments.find(item => item.number === departmentById.get(task.id));
    const toggle = () => {
      setDayEditor(null);
      if (task.isGroup) {
        setOpenedGroup(expanded ? null : task.id);
        setOpened(null);
      } else {
        setOpened(expanded ? null : task.id);
      }
      setArmed(null);
    };
    return (
      <article className={styles.card} key={task.id} aria-label={task.isGroup ? `Grupo ${task.name}` : task.name}>
        <div className={styles.cardTop}>
          <span>{task.isGroup && "Grupo de acciones · "}{department ? `${department.number} · ${department.keyword}` : "Sin departamento"}</span>
          <span>{stages[task.stage]}{recurring && task.stage !== "recurring" ? " · recurrente" : ""}</span>
        </div>
        <h3>
          {isOpenAction(task) || description ? <button className={styles.actionTitle} type="button" aria-expanded={expanded} aria-controls={`controls-${task.id}`}
            onClick={toggle}>
            <span>{task.name}</span><span aria-hidden="true">{expanded ? "−" : "+"}</span>
          </button> : task.name}
        </h3>
        <div className={styles.meta}>
          {task.isGroup && <span>{members.length + otherDays.length} {members.length + otherDays.length === 1 ? "acción" : "acciones"} en el grupo</span>}
          <span className={due && daysUntil(due, day) <= 7 ? styles.warn : ""}>
            {due !== task.due && "Vence un paso · "}{dateLabel(due, day)}
          </span>
          {task.priority && <span>Prioridad {task.priority.toLowerCase()}</span>}
          {!task.groupId && <span>{task.front}{task.rank ? ` · ${task.rank}` : ""}</span>}
        </div>
        {task.owner && <p className={styles.owner}>{task.owner}</p>}
        {task.stage === "waiting" && task.blockers.length > 0 && <p className={styles.owner}>Espera: {task.blockers.join(", ")}</p>}
        {task.issues.length > 0 && <p className={styles.warn}>Revisar: {task.issues.join(" · ")}</p>}
        {expanded && isOpenAction(task) && (dayEditor?.id === task.id ? (
          <form className={styles.dayEditor} aria-label={`Editar días de ${task.name}`}
            onSubmit={event => { event.preventDefault(); void save("weekdays", task); }}>
            <WeekdayPicker value={dayEditor.value} department={department?.number ?? null} disabled={locked}
              onChange={value => setDayEditor({ ...dayEditor, value })}/>
            <div><button type="submit" disabled={locked || !validWeekdays(dayEditor.value) || dayEditor.value === dayEditor.initial}>Guardar días</button>
              <button type="button" disabled={saving} onClick={() => setDayEditor(null)}>Cancelar</button></div>
          </form>
        ) : <button className={styles.editDays} type="button" disabled={locked} onClick={() => {
          const value = task.weekdays ?? ALL_DAYS;
          setArmed(null);
          setDayEditor({id: task.id, value, initial: value, revision: data!.revisions[task.id], snapshotRevision: data!.snapshotRevision});
        }}>Editar días</button>)}
        {task.isGroup ? (
          <div id={`controls-${task.id}`} hidden={!expanded}>
            {expanded && (members.length ? (
              <ol className={styles.groupMembers} aria-label={`Acciones de ${task.name}`}>
                {members.map(member => <li key={member.id} value={member.groupOrder || undefined}>{card(member)}</li>)}
              </ol>
            ) : !otherDays.length && <p className={styles.owner}>Este grupo todavía no tiene acciones.</p>)}
            {expanded && otherDays.length > 0 && <details><summary>Pasos de otros días ({otherDays.length})</summary>
              <ol className={styles.groupMembers}>{otherDays.map(member => <li key={member.id} value={member.groupOrder || undefined}>{card(member)}</li>)}</ol>
            </details>}
          </div>
        ) : <div className={styles.actionControls} id={`controls-${task.id}`} hidden={!expanded}>
          {expanded && description && (
            <details className={styles.actionDetails}>
              <summary>Más información</summary>
              <p>{description.replace(/(?:\\r)?\\n/g, "\n")}</p>
            </details>
          )}
          {isOpenAction(task) && <>
            <button type="button" disabled={locked || !eligibleToday} onClick={() => void save("doneToday", task)}>
              Por hoy ya estamos
            </button>
            {!recurring && <button type="button" disabled={locked} data-confirming={confirming}
              onClick={() => confirming ? void save("finish", task) : setArmed(task.id)}>
              {confirming ? "Confirmar finalización" : "Finalizada"}
            </button>}
            {!eligibleToday && <p>El cierre por hoy está disponible para acciones que podés ejecutar ahora.</p>}
            {confirming && <p role="status">Tocá de nuevo para finalizar esta acción.</p>}
          </>}
        </div>}
      </article>
    );
  };
  const entryCard = ({ task, members, due, otherDays }: (typeof visible)[number]) => card(task, members, due, otherDays);
  return <main className={styles.main}><header className={styles.header}><a href="/panel-de-control">Ø UnderTango · Panel de control</a><button onClick={()=>void refresh()} disabled={loading || saving}>{loading?"Actualizando…":"Actualizar"}</button></header><section className={styles.intro}><p className={styles.eyebrow}>Una mirada para empezar</p><h1>Central de <em>control</em></h1><p>Todo el sistema a la vista. Elegí un departamento y descubrí por dónde avanzar.</p></section>
    {error&&<div className={styles.message} role="alert"><strong>No pudimos abrir la información.</strong><p>{error}</p><a href="/panel-de-control">Abrir el panel de control</a></div>}
    {data&&<><div className={styles.workspace}><section className={styles.orbit} aria-label="Departamentos de UnderTango"><div className={styles.orbitHead}><div><span className={styles.eyebrow}>Ø Sistema operativo</span><h2>Explorá la esfera</h2></div><span>{total} {total === 1 ? "acción o grupo abierto" : "acciones y grupos abiertos"}</span></div><Sphere selected={selected} choose={choose} counts={counts}/><p className={styles.hint}>Arrastrá para girar · Tocá un sector para abrirlo</p><div className={styles.departmentList} aria-label="Elegir departamento">{departments.map((d,i)=><button key={d.number} className={selected===d.number?styles.chosen:""} onClick={()=>choose(d.number)} aria-pressed={selected===d.number}><span style={{background:colors[i]}} />{d.number} {d.keyword}<b>{counts[d.number]||0}</b></button>)}<button className={selected==="unassigned"?styles.chosen:""} onClick={()=>choose("unassigned")} aria-pressed={selected==="unassigned"}><span className={styles.gray}/>Sin departamento<b>{counts.unassigned||0}</b></button></div></section>
    <section className={styles.detail}><div className={styles.detailTop}><div><p className={styles.eyebrow}>{selectedDept?`Departamento ${selectedDept.number}`:selected==="unassigned"?"Pendientes de clasificación":"Visión general"}</p><h2>{selectedDept?.title|| (selected==="unassigned"?"Sin departamento":"Todo UnderTango")}</h2></div>{selected&&<button onClick={()=>choose(null)}>Ver todo</button>}</div><p className={styles.description}>{selectedDept?.description||"Elegí una perspectiva para ordenar las acciones abiertas."}</p>
    {selectedDept?.number === "84" && selectedDept.link ? (
      <p><a href={selectedDept.link.href} style={{ color: "#ffbd9e", textDecoration: "underline" }}>{selectedDept.link.label} →</a></p>
    ) : null}
    <div className={styles.tabs} role="group" aria-label="Perspectiva de acciones">
      {([["overview","Para avanzar"],["urgent","Urgentes"],["dates","Con fecha límite"],["priority","Prioridad alta"]] as [CentralMode,string][]).map(([id,label]) => (
        <button key={id} aria-pressed={mode === id} className={mode === id ? styles.active : ""} onClick={() => {
          setMode(id); setShowRest(false); setOpenedGroup(null); setOpened(null); setArmed(null); setDayEditor(null);
        }}>{label}</button>
      ))}
    </div>
    <p className={styles.viewNote}>{mode === "overview" ? "Hasta tres acciones ejecutables por frente, según el orden del panel. El resto queda disponible debajo." : mode === "urgent" ? "Vencidas o con fecha límite dentro de los próximos 7 días, incluidas las que están en espera." : mode === "dates" ? "Todas las acciones con fecha límite, ordenadas por fecha." : "Acciones marcadas con prioridad alta, independientemente de su fecha."}</p>
    <div className={styles.cards}>
      {visible.map(entryCard)}
      {!visible.length && <p className={styles.empty}>{mode === "overview" ? "No hay acciones ejecutables de los primeros puestos en esta selección." : "No hay acciones que coincidan con esta vista."}</p>}
    </div>
    {rest.length > 0 && <div className={styles.more}>
      <button onClick={() => { setShowRest(!showRest); setOpened(null); setArmed(null); }} aria-expanded={showRest}>
        {showRest ? "Ocultar" : "Ver"} {rest.length === 1 ? "otra acción" : `otras ${rest.length} acciones`} del ranking
      </button>
      {showRest && <div className={styles.cards}>{rest.map(entryCard)}</div>}
    </div>}
    <a className={styles.panelLink} href="/panel-de-control">Abrir el panel de control</a></section></div><footer className={styles.footer}>
      <button type="button" className={styles.undo} disabled={locked || !data.latestChange}
        aria-label="Deshacer último cambio" title="Deshacer último cambio" onClick={() => void save("undo")}>
        <span aria-hidden="true">↶</span> Deshacer
      </button>
      <div>
        <p className={styles.feedback} ref={messageRef} tabIndex={-1} role="status">{saving ? "Guardando…" : notice}</p>
        {changeError && <p className={styles.warn} role="alert">{changeError}</p>}
        <small>Datos de Supabase · Actualizado {new Date(data.updatedAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Cordoba", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
      </div>
    </footer></>}
  </main>;
}
