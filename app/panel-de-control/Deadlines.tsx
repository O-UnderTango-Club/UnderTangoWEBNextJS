"use client";
import { useState } from "react";
import { DEADLINE_KINDS, deadlineDate, deadlineWindow, safeDeadlineUrl, type DeadlineItem, type DeadlineSnapshot } from "../../src/lib/panel-deadlines";
import css from "./panel.module.css";

type Props = { data?: DeadlineSnapshot; error?: string; refreshing: boolean; onRefresh: () => void; onOpenTask: (id: string) => void };
export default function Deadlines({data,error,refreshing,onRefresh,onOpenTask}: Props) {
  const [days,setDays] = useState("90");
  const [limit,setLimit] = useState(10);
  const [showConditional,setShowConditional] = useState(true);
  const window = data ? deadlineWindow(data,days === "all" ? null : Number(days)) : {upcoming:[],overdue:[]};
  const upcoming = window.upcoming.filter(item => showConditional || item.kind !== "conditional");
  function itemRow(item: DeadlineItem) {
    const url = safeDeadlineUrl(item.url);
    return <li key={item.id} className={css.deadlineItem} data-kind={item.kind}>
      <div className={css.deadlineDate}><time dateTime={item.date}>{deadlineDate(item.date)}</time>
        {item.date === data?.today && <span className={css.badge}>Hoy</span>}
      </div>
      <h3>{item.title}</h3>
      {item.time && <p className={css.deadlineTime}>{item.time}</p>}
      <div className={css.deadlineMeta}>
        <span className={css.deadlineKind} data-kind={item.kind}>{DEADLINE_KINDS[item.kind]}</span>
        <span>{item.status}</span>
        <span className={item.priority === "Alta" || item.priority === "Crítica" ? css.deadlinePriority : undefined}>{item.priority ? "Prioridad " + item.priority : "Sin prioridad asignada"}</span>
      </div>
      {(item.detail || item.taskId || url) && <details className={css.deadlineDetail}><summary>Ver detalle</summary>
        {item.detail && <p>{item.detail}</p>}
        <div className={css.actions}>{item.taskId && <button className={css.linkButton} onClick={()=>onOpenTask(item.taskId!)}>Abrir acción</button>}
          {url && <a href={url} target="_blank" rel="noreferrer">Ver fuente ↗</a>}</div>
      </details>}
    </li>;
  }
  return <aside className={css.deadlines} aria-labelledby="deadlines-title" aria-busy={refreshing}>
    <header className={css.deadlinesHeader}><span className={css.brand}>Qué se viene</span><h2 id="deadlines-title">Próximos deadlines</h2>
      <p>Entregas, encuentros y shows · fechas de Córdoba</p></header>
    {error ? <div className={css.error} role="alert"><p>{error}</p><p>La agenda no está verificada. Los frentes siguen disponibles.</p>
      <button className={css.button} disabled={refreshing} onClick={onRefresh}>Reintentar</button></div> : !data ? <p role="status">Cargando fechas…</p> : <>
      <div className={css.deadlineFilters}><label>Ver fechas<select value={days} onChange={event=>{setDays(event.target.value);setLimit(10);}}>
        <option value="30">Próximos 30 días</option><option value="90">Próximos 90 días</option><option value="all">Todas las próximas</option>
      </select></label>
      <label className={css.deadlineCheckbox}><input type="checkbox" checked={showConditional} onChange={event=>{setShowConditional(event.target.checked);setLimit(10);}}/>Incluir condicionales</label></div>
      <p className={css.muted} aria-live="polite">{upcoming.length} fechas próximas{refreshing ? " · actualizando…" : ""}</p>
      {window.overdue.length>0 && <details className={css.overdue}><summary>{window.overdue.length} vencimientos anteriores sin cerrar</summary><p className={css.muted}>Revisar el estado; no implica que la entrega no se haya realizado.</p><ol className={css.deadlineList}>{window.overdue.map(itemRow)}</ol></details>}
      {upcoming.length ? <ol className={css.deadlineList}>{upcoming.slice(0,limit).map(itemRow)}</ol> : <p className={css.empty}>No hay fechas registradas en este período con estos filtros.</p>}
      {upcoming.length>limit && <button className={css.button} onClick={()=>setLimit(n=>n+10)}>Ver más fechas ({upcoming.length-limit})</button>}
      <p className={css.deadlineFootnote}>Supabase · lectura {new Date(data.updatedAt).toLocaleTimeString("es-AR",{timeZone:"America/Argentina/Cordoba",hour:"2-digit",minute:"2-digit"})}. Las fechas tentativas o condicionales no confirman contratación.</p>
    </>}
  </aside>;
}

