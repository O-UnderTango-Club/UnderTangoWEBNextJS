"use client";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { FINANCE_FIELDS as F, financeText, financeLinks, decimalCents, centsDecimal, isObject, parseFinanceSnapshot,
  type FinanceCell, type FinanceReceipt, type FinanceRecord, type FinanceSnapshot, type FinanceTable } from "../../../src/lib/finance-model";
import { buildFinanceSubmission, financeWarnings, formatFinanceAmount, newFinanceDraft, parsePendingFinance, retainFinanceAttempt, verifyFinanceReadback,
  type FinanceDraft, type FinanceSubmission } from "../../../src/lib/finance-workflow";
import css from "./finance.module.css";

type Data = FinanceSnapshot & { actor:string; readOnly:boolean };
const pendingKey = "undertango.finance.pending.v1";
const title = (table: FinanceTable) => table === "obligations" ? "Obligaciones" : "Movimientos";
class ApiError extends Error { constructor(message:string,public status=503,public code="connection",public uncertain=false) { super(message); } }
async function api(submission?: FinanceSubmission): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch("/api/panel/finance",{method:submission ? "POST" : "GET",credentials:"same-origin",cache:"no-store",
      headers:submission ? {"Content-Type":"application/json"} : {},...(submission ? {body:JSON.stringify(submission)} : {}),signal:AbortSignal.timeout(25000)});
  } catch { throw new ApiError(submission ? "No pudimos confirmar el envío. Reintentá el mismo envío para evitar duplicados." : "No se pudo conectar. Volvé a actualizar.",503,"connection",!!submission); }
  let value: unknown;
  try { value = await response.json(); }
  catch { throw new ApiError("La respuesta no pudo verificarse.",503,"response",!!submission); }
  if (!response.ok) {
    throw new ApiError(isObject(value) && typeof value.error === "string" ? value.error : "No se pudo completar la operación.",response.status,
      isObject(value) && typeof value.code === "string" ? value.code : "request",!!submission && (!isObject(value) || value.uncertain === true || response.status >= 500));
  }
  return value;
}
function checkedReceipt(value: unknown, requestId:string): FinanceReceipt {
  if (!isObject(value) || value.ok !== true || value.requestId !== requestId || typeof value.id !== "string" || !value.id
    || typeof value.revision !== "string" || !/^(0|[1-9]\d*)$/.test(value.revision) || !Array.isArray(value.ids)
    || value.ids[0] !== value.id || value.ids.some(id => typeof id !== "string") || new Set(value.ids).size !== value.ids.length
    || !Number.isInteger(value.balanceUpdates) || value.ids.length !== (value.balanceUpdates as number) + 1
    || typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt))) throw new ApiError("El comprobante no pudo verificarse. Conservamos este envío para reintentarlo.",503,"receipt",true);
  return value as FinanceReceipt;
}
function referenceName(data:FinanceSnapshot, group:keyof Pick<FinanceSnapshot,"obligations"|"movements"|"contacts"|"cases"|"operations">, id:string) {
  const row = data[group].find(r => r.id === id);
  if (!row) return "Vínculo no disponible";
  return "fields" in row ? financeText(row,group as FinanceTable,"name") || "Sin nombre" : row.name || "Sin nombre";
}
function cellLabel(value:FinanceCell, table:FinanceTable, fieldId:string, data:FinanceSnapshot) {
  const field = Object.values(F[table]).find(f => f.id === fieldId);
  if (!field) return "Campo no disponible";
  if (Array.isArray(value)) return value.map(id => referenceName(data,field.target!,id)).join(" · ") || "Sin vínculos";
  if (field.type === "amount") return formatFinanceAmount(value);
  return value === null || value === "" ? "No informado" : value;
}

export default function Finance() {
  const [data,setData] = useState<Data>();
  const [loading,setLoading] = useState(true), [busy,setBusy] = useState(false);
  const [error,setError] = useState(""), [notice,setNotice] = useState("");
  const [needsAccess,setNeedsAccess] = useState(false);
  const [table,setTable] = useState<FinanceTable>("obligations");
  const [query,setQuery] = useState(""), [currency,setCurrency] = useState(""), [status,setStatus] = useState("");
  const [onlyIssues,setOnlyIssues] = useState(false), [limit,setLimit] = useState(30);
  const [draft,setDraft] = useState<FinanceDraft>();
  const [pending,setPending] = useState<FinanceSubmission | null>(null);
  const sending = useRef(false), reading = useRef(false), loadedPending = useRef(false);
  const refresh = useCallback(async () => {
    if (reading.current) return null;
    reading.current = true; setLoading(true);
    try {
      const raw = await api();
      if (!isObject(raw) || typeof raw.actor !== "string" || !raw.actor) throw new Error("No se pudo verificar el acceso.");
      const value:Data = {...parseFinanceSnapshot(raw,raw.readOnly === true),actor:raw.actor,readOnly:raw.readOnly === true};
      setData(value); setError(""); setNeedsAccess(false);
      if (!loadedPending.current) {
        loadedPending.current = true;
        try {
          const saved = sessionStorage.getItem(pendingKey);
          if (saved) {
            const restored = parsePendingFinance(JSON.parse(saved),value.actor);
            if (restored) setPending(restored);
            else setError("Existe un envío anterior que no pudimos interpretar. No lo repetiremos automáticamente; revisá los registros antes de continuar.");
          }
        } catch { setError("No se pudo consultar el estado del último envío de este navegador."); }
      }
      return value;
    } catch (e) { setData(undefined); setNeedsAccess(e instanceof ApiError && (e.status === 401 || e.status === 403)); setError(e instanceof Error ? e.message : "No se pudieron consultar las finanzas."); return null; }
    finally { reading.current = false; setLoading(false); }
  },[]);
  useEffect(() => { void refresh(); },[refresh]);
  const send = async (submission:FinanceSubmission) => {
    if (!data || data.readOnly || sending.current) throw new ApiError("El registro no está habilitado en esta vista.",409,"disabled");
    if (pending && JSON.stringify(pending) !== JSON.stringify(submission)) throw new ApiError("Primero hay que resolver el envío anterior.",409,"pending");
    const recovering = !!pending;
    sending.current = true; setBusy(true); setError("");
    try {
      // Persist the exact intent BEFORE sending; reloads must retain its ID.
      try { sessionStorage.setItem(pendingKey,JSON.stringify({v:1,actor:data.actor,submission})); }
      catch { throw new ApiError("No pudimos conservar el identificador del envío en este navegador. No se envió ningún cambio.",400,"storage"); }
      setPending(submission);
      const receipt = checkedReceipt(await api(submission),submission.requestId);
      setPending(null); try { sessionStorage.removeItem(pendingKey); } catch { /* An old receipt can safely be recovered again. */ }
      setDraft(undefined); setNotice(`Guardado en Supabase. Comprobante ${receipt.requestId}. Actualizando la lectura…`);
      const updated = await refresh();
      if (updated) {
        try {
          const state = verifyFinanceReadback(updated,submission,receipt);
          setNotice(`Guardado confirmado en Supabase. ${state === "verified" ? "Datos y saldos releídos correctamente." : "La lectura ya incluye cambios posteriores."} Comprobante ${receipt.requestId}.`);
        } catch (e) { setNotice(`El guardado tiene comprobante ${receipt.requestId}, pero falta revisar la lectura. No vuelvas a crear la operación.`); setError(e instanceof Error ? e.message : "Lectura pendiente de revisión."); }
      } else setNotice(`Guardado con comprobante ${receipt.requestId}. Falta actualizar la vista; no vuelvas a crear la operación.`);
      return receipt;
    } catch (e) {
      const failure = e instanceof ApiError ? e : new ApiError("No se pudo confirmar el envío. Conservamos su identificador para verificarlo.",503,"unexpected",true);
      if (!retainFinanceAttempt(failure,recovering)) { setPending(null); try { sessionStorage.removeItem(pendingKey); } catch { /* Safe exact retry remains recoverable. */ } }
      setError(e instanceof Error ? e.message : "No se pudo completar el envío."); throw e;
    } finally { sending.current = false; setBusy(false); }
  };

  const today = new Date().toLocaleDateString("sv-SE",{timeZone:"America/Argentina/Cordoba"});
  const [year,setYear] = useState(Number(today.slice(0,4)));
  const [entry,setEntry] = useState<"Ingreso"|"Egreso"|null>(null);
  const [shown,setShown] = useState(8);
  const years = data ? [...new Set(data.movements.map(r => Number((financeText(r,"movements","date") || "").slice(0,4))).filter(Number.isInteger).filter(n => n > 2000))].sort((a,b) => b-a) : [];
  const movements = data ? data.movements.filter(r => (financeText(r,"movements","date") || "").startsWith(String(year)))
    .sort((a,b) => (financeText(b,"movements","date") || "").localeCompare(financeText(a,"movements","date") || "") || b.id.localeCompare(a.id)) : [];
  const totals = new Map<string,{income:bigint;expense:bigint}>();
  for (const row of movements) {
    if (financeText(row,"movements","status") !== "Confirmado") continue;
    const amount = financeText(row,"movements","amount"), currency = financeText(row,"movements","currency"), kind = financeText(row,"movements","type");
    if (!amount || !currency || !["Ingreso","Egreso"].includes(kind || "")) continue;
    const group = totals.get(currency) || {income:BigInt(0),expense:BigInt(0)};
    if (kind === "Ingreso") group.income += decimalCents(amount); else group.expense += decimalCents(amount);
    totals.set(currency,group);
  }
  const display = (value:bigint,currency:string) => formatFinanceAmount(centsDecimal(value),currency);
  const column = (kind:"Ingreso"|"Egreso") => {
    const rows = movements.filter(r => financeText(r,"movements","type") === kind);
    return <section className={css.ledgerColumn} aria-label={kind === "Ingreso" ? "Últimos ingresos" : "Últimos egresos"}>
      <div className={css.columnHeader}><h2>{kind === "Ingreso" ? "Ingresos" : "Egresos"}</h2><button type="button" className={css.primary} disabled={data?.readOnly || !!pending || busy} onClick={() => setEntry(kind)}>+ Agregar {kind.toLocaleLowerCase()}</button></div>
      <p className={css.small}>{rows.length} movimientos del año, del más reciente al más antiguo.</p>
      <div className={css.ledgerList}>{rows.slice(0,shown).map(row => {
        const state = financeText(row,"movements","status");
        return <article className={css.ledgerRow} key={row.id}>
          <div><time>{financeText(row,"movements","date") || "Sin fecha"}</time><strong>{financeText(row,"movements","name") || "Sin nombre"}</strong><span className={css.small}>{financeText(row,"movements","concept") || ""}</span></div>
          <div className={css.ledgerRight}><b>{formatFinanceAmount(financeText(row,"movements","amount"),financeText(row,"movements","currency"))}</b><span className={state === "Confirmado" ? css.confirmed : css.unconfirmed}>{state || "Sin confirmar"}</span><button type="button" disabled={!!pending || busy} onClick={() => setDraft(newFinanceDraft("movements",data!,row))}>Ver / editar</button></div>
        </article>;
      })}</div>
      {!rows.length ? <p className={css.empty}>Todavía no hay {kind.toLocaleLowerCase()}s registrados en {year}.</p> : null}
      {rows.length > shown ? <button type="button" onClick={() => setShown(n => n+10)}>Ver más {kind.toLocaleLowerCase()}s</button> : null}
    </section>;
  };
  return <main className={css.finance}>
    <header className={css.header}><div><a href="/panel-de-control">← Panel de control</a><p className={css.eyebrow}>Ø UnderTango · finanzas privadas</p><h1>Ingresos y egresos</h1><p>Movimientos registrados, ordenados por fecha.</p></div><button type="button" disabled={loading || busy || !!draft || !!entry || !!pending} onClick={() => void refresh()}>{loading ? "Actualizando…" : "Actualizar"}</button></header>
    {notice ? <p className={css.notice} role="status">{notice}</p> : null}
    {error ? <p className={css.error} role="alert">{error}</p> : null}
    {loading && !data ? <p role="status">Leyendo movimientos…</p> : null}
    {!data && !loading ? <section className={css.empty}><h2>{needsAccess ? "Ingresar a Finanzas" : "No pudimos cargar los movimientos"}</h2><p>{needsAccess ? "Ingresá desde el panel de control con tu acceso habitual." : "Probá de nuevo con Actualizar."}</p><a href="/panel-de-control">Abrir panel de control</a></section> : null}
    {data ? <>
      <div className={css.context}><span>Supabase · {data.movements.length} movimientos conservados</span><span>Lectura {new Date(data.updatedAt).toLocaleString("es-AR",{timeZone:"America/Argentina/Cordoba"})}</span></div>
      {data.readOnly ? <p className={css.warning}>Vista de solo lectura.</p> : null}
      {pending ? <section className={css.pending}><h2>Envío pendiente de confirmación</h2><p>Reintentá el mismo envío para evitar duplicados.</p><Review submission={pending} data={data}/><button type="button" className={css.primary} disabled={busy || data.readOnly} onClick={() => void send(pending).catch(() => {})}>Reintentar el mismo envío</button></section> : null}
      <div className={css.yearBar}><label>Año <select value={year} onChange={e => {setYear(Number(e.target.value));setShown(8);}}>{[...new Set([year,...years])].sort((a,b)=>b-a).map(y => <option key={y} value={y}>{y}</option>)}</select></label><p className={css.small}>Solo los movimientos confirmados, con fecha e importe, entran en el resultado. Cada moneda se calcula por separado.</p></div>
      <section className={css.result} aria-label="Resultado anual"><h2>Resultado {year}</h2>{totals.size ? <div className={css.resultGrid}>{[...totals.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([currency,t]) => <div className={css.resultCard} key={currency}><h3>{currency}</h3><dl><div><dt>Ingresos</dt><dd>{display(t.income,currency)}</dd></div><div><dt>Egresos</dt><dd>{display(t.expense,currency)}</dd></div><div className={css.net}><dt>Resultado</dt><dd>{display(t.income-t.expense,currency)}</dd></div></dl></div>)}</div> : <p>No hay movimientos confirmados con importe para {year}.</p>}<p className={css.small}>Resultado = ingresos menos egresos registrados. No representa el efectivo disponible ni incluye un saldo inicial.</p></section>
      <div className={css.ledger}>{column("Ingreso")}{column("Egreso")}</div>
      {entry ? <QuickEntry kind={entry} data={data} today={today} busy={busy} locked={busy || !!pending} send={send} onClose={() => {if (!busy && !pending) setEntry(null);}}/> : null}
      {draft ? <Editor key={`${draft.table}:${draft.id || "new"}`} initial={draft} data={data} busy={busy} locked={busy || !!pending} pending={pending} send={send} onClose={() => {if (!busy && !pending) setDraft(undefined);}}/> : null}
    </> : null}
  </main>;
}

function QuickEntry({kind,data,today,busy,locked,send,onClose}:{kind:"Ingreso"|"Egreso";data:Data;today:string;busy:boolean;locked:boolean;send:(s:FinanceSubmission)=>Promise<FinanceReceipt>;onClose:()=>void}) {
  const [name,setName] = useState(""),[date,setDate] = useState(today),[amount,setAmount] = useState(""),[currency,setCurrency] = useState("ARS"),[concept,setConcept] = useState("");
  const [prepared,setPrepared] = useState<FinanceSubmission>(),[error,setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {const d=dialog.current;d?.showModal();const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{d?.close();document.body.style.overflow=old;};},[]);
  function review(e:FormEvent) {
    e.preventDefault();
    try {
      const duplicate=data.movements.find(r => financeText(r,"movements","name")?.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase()
        && financeText(r,"movements","date") === date && financeText(r,"movements","type") === kind);
      if (duplicate) throw new Error("Ya existe un movimiento con este nombre y fecha. Revisalo en la lista antes de agregar otro.");
      const draft=newFinanceDraft("movements",data);
      draft.values[F.movements.name.id]=name.trim(); draft.values[F.movements.date.id]=date;
      draft.values[F.movements.type.id]=kind; draft.values[F.movements.amount.id]=amount;
      draft.values[F.movements.currency.id]=currency; draft.values[F.movements.status.id]="Confirmado";
      draft.values[F.movements.concept.id]=concept.trim() || null;
      setPrepared(buildFinanceSubmission(draft,data,crypto.randomUUID()));setError("");
    } catch(e) {setError(e instanceof Error ? e.message : "Revisá los datos.");}
  }
  return <dialog ref={dialog} className={css.dialog} aria-label={`Agregar ${kind.toLocaleLowerCase()}`} onCancel={e => {e.preventDefault();if(!locked)onClose();}}><form onSubmit={review}>
    <div className={css.dialogHeader}><h2>Agregar {kind.toLocaleLowerCase()}</h2><button type="button" disabled={locked} onClick={onClose}>Cerrar</button></div>
    <p className={css.small}>Registrá únicamente dinero que efectivamente ingresó o salió. Las obligaciones pendientes no van acá.</p>
    {!prepared ? <fieldset className={css.fields} disabled={locked}><legend className={css.srOnly}>Datos del movimiento</legend><div className={css.formGrid}>
      <label className={css.full}>Concepto breve<input required value={name} maxLength={200} onChange={e=>setName(e.target.value)} placeholder="Ej.: Wish — pago saxofonista"/></label>
      <label>Fecha<input required type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
      <label>Importe<input required inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="400,00"/></label>
      <label>Moneda<select value={currency} onChange={e=>setCurrency(e.target.value)}>{F.movements.currency.choices!.map(c=><option key={c}>{c}</option>)}</select></label>
      <label className={css.full}>Detalle opcional<textarea value={concept} maxLength={2000} onChange={e=>setConcept(e.target.value)} rows={3}/></label>
    </div></fieldset> : <><h3>Revisar antes de guardar</h3><Review submission={prepared} data={data}/></>}
    {error ? <p className={css.error} role="alert">{error}</p> : null}
    <footer>{prepared ? <button type="button" disabled={locked} onClick={()=>setPrepared(undefined)}>Corregir</button> : null}
      {prepared ? <button type="button" className={css.primary} disabled={locked} onClick={() => void send(prepared).then(onClose).catch(e=>setError(e instanceof Error?e.message:"No se pudo guardar."))}>Confirmar y guardar</button>
        : <button type="submit" className={css.primary} disabled={locked}>Revisar {kind.toLocaleLowerCase()}</button>}</footer>
  </form></dialog>;
}

function Review({submission,data}:{submission:FinanceSubmission;data:FinanceSnapshot}) {
  const change = submission.change;
  return <div className={css.review}><h3>{change.record.create ? "Nuevo registro" : "Campos que se modificarán"}</h3><dl>{Object.entries(change.record.fields).map(([id,value]) => <div key={id}><dt>{Object.values(F[change.record.table]).find(f => f.id === id)?.label || "Campo"}</dt><dd>{cellLabel(value,change.record.table,id,data)}</dd></div>)}</dl>
    {change.balances?.length ? <><h3>Saldos aprobados expresamente</h3>{change.balances.map(b => <p key={b.id}>{referenceName(data,"obligations",b.id)}: {formatFinanceAmount(b.oldBalance)} → {formatFinanceAmount(b.newBalance)} · {b.state}</p>)}<p>{change.balanceReason}</p></> : <p>No se recalcularán saldos de otras obligaciones.</p>}
    {change.duplicateReason ? <p>Operación distinta de una coincidencia: {change.duplicateReason}</p> : null}
  </div>;
}
function LinkField({label,options,value,onChange,disabled}:{label:string;options:{id:string;name:string}[];value:string[];onChange:(v:string[])=>void;disabled:boolean}) {
  const [query,setQuery] = useState("");
  const choices = options.filter(o => !value.includes(o.id) && o.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  function move(index:number,delta:number) { const next=[...value]; [next[index],next[index+delta]]=[next[index+delta],next[index]]; onChange(next); }
  return <fieldset className={css.links} disabled={disabled}><legend>{label}</legend><ol>{value.map((id,index) => <li key={id}><span>{options.find(o => o.id === id)?.name || "Vínculo no disponible"}</span>{!disabled ? <div className={css.order}><button type="button" aria-label={`Subir ${options.find(o => o.id === id)?.name}`} disabled={index === 0} onClick={() => move(index,-1)}>↑</button><button type="button" aria-label={`Bajar ${options.find(o => o.id === id)?.name}`} disabled={index === value.length-1} onClick={() => move(index,1)}>↓</button><button type="button" onClick={() => onChange(value.filter(v => v !== id))}>Quitar vínculo</button></div> : null}</li>)}</ol>
    {!value.length ? <p className={css.small}>Sin vínculos.</p> : null}
    {!disabled ? <><input aria-label={`Buscar ${label.toLocaleLowerCase()} para vincular`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar para vincular…"/><select aria-label={`Vincular ${label.toLocaleLowerCase()}`} value="" disabled={value.length >= 30} onChange={e => {if(e.target.value)onChange([...value,e.target.value]);}}><option value="">Elegir un registro…</option>{choices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}</select></> : null}
  </fieldset>;
}
function Editor({initial,data,busy,locked,pending,send,onClose}:{initial:FinanceDraft;data:Data;busy:boolean;locked:boolean;pending:FinanceSubmission|null;send:(s:FinanceSubmission)=>Promise<FinanceReceipt>;onClose:()=>void}) {
  const [draft,setDraft] = useState(initial), [prepared,setPrepared] = useState<FinanceSubmission>();
  const [error,setError] = useState(""), [duplicate,setDuplicate] = useState(false), [conflict,setConflict] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {const d=dialog.current; d?.showModal();const old=document.body.style.overflow;document.body.style.overflow="hidden";return()=>{d?.close();document.body.style.overflow=old;};},[]);
  function value(id:string,next:FinanceCell) {setDraft(d => ({...d,values:{...d.values,[id]:next}}));setError("");}
  function review(e:FormEvent) {e.preventDefault();try {setPrepared(buildFinanceSubmission(draft,data,crypto.randomUUID()));setError("");}catch(e){setError(e instanceof Error ? e.message : "Revisá los campos.");}}
  async function confirm(submission:FinanceSubmission) {
    try {await send(submission);} catch(e) {setError(e instanceof Error ? e.message : "No se pudo completar el envío.");if(e instanceof ApiError && !e.uncertain){setPrepared(undefined);setDuplicate(e.code === "duplicate");setConflict(e.code === "conflict");}}
  }
  const links = draft.table === "movements" ? draft.values[F.movements.obligations.id] as string[] : [];
  const disabled = locked || !!prepared || conflict || data.readOnly;
  const name = String(draft.values[F[draft.table].name.id] || "").toLocaleLowerCase().trim();
  const matches = !draft.id && name.length > 2 ? data[draft.table].filter(r => (financeText(r,draft.table,"name") || "").toLocaleLowerCase().includes(name)).slice(0,6) : [];
  return <dialog ref={dialog} className={css.dialog} aria-labelledby="finance-editor-title" onCancel={e => {e.preventDefault();if(!locked)onClose();}}><form onSubmit={review}>
    <div className={css.dialogHeader}><div><p className={css.eyebrow}>{title(draft.table)}</p><h2 id="finance-editor-title">{data.readOnly ? "Detalle del registro" : draft.id ? "Editar registro" : "Registrar operación"}</h2></div><button type="button" disabled={locked} onClick={onClose}>Cerrar</button></div>
    <p className={css.small}>Un campo vacío significa «no informado», no cero. Los vínculos y notas que no cambies se conservarán.</p>
    {matches.length ? <aside className={css.warning}><strong>Ya existen registros con un nombre parecido</strong><ul>{matches.map(r => <li key={r.id}>{financeText(r,draft.table,"name")} · {formatFinanceAmount(financeText(r,draft.table,draft.table === "obligations" ? "balance" : "amount"),financeText(r,draft.table,"currency"))}</li>)}</ul><p>Revisalos antes de crear otro registro.</p></aside> : null}
    <fieldset disabled={disabled} className={css.fields}><legend className={css.srOnly}>Datos de la operación</legend><div className={css.formGrid}>{Object.entries(F[draft.table]).filter(([,f]) => f.type !== "links").map(([name,field]) => {
      const current = draft.values[field.id]; const text = typeof current === "string" ? current : "";
      const long = ["concept","notes","nextAction"].includes(name);
      return <label key={field.id} className={long || name === "name" ? css.full : ""}>{field.label}{field.type === "select" ? <select value={text} onChange={e => value(field.id,e.target.value || null)}><option value="">No informado</option>{text && !field.choices!.includes(text) ? <option value={text} disabled>{text} · valor registrado</option> : null}{field.choices!.filter(c => draft.id || !(name === "type" && c === "Saldada")).map(c => <option key={c}>{c}</option>)}</select> : long ? <textarea rows={name === "notes" ? 5 : 3} value={text} onChange={e => value(field.id,e.target.value)} maxLength={20000}/> : <input type={field.type === "date" ? "date" : "text"} inputMode={field.type === "amount" ? "decimal" : undefined} value={text} onChange={e => value(field.id,e.target.value)} placeholder={field.type === "amount" ? "Sin separadores de miles: 1234,50" : undefined} maxLength={20000}/>}</label>;
    })}</div></fieldset>
    <details className={css.details} open={draft.table === "movements"}><summary>Vínculos y orden de los registros</summary>{Object.entries(F[draft.table]).filter(([,f]) => f.type === "links").map(([,field]) => <LinkField key={field.id} label={field.label} options={data[field.target!].map(r => ({id:r.id,name:referenceName(data,field.target!,r.id)}))} value={draft.values[field.id] as string[]} onChange={next => value(field.id,next)} disabled={disabled || field.readOnly === true}/>)}</details>
    {draft.table === "movements" && links.length ? <fieldset className={css.balanceSection} disabled={disabled}><legend>Actualización de saldos: opcional y explícita</legend><p>No descontamos este importe de cada obligación. Marcá únicamente los saldos que revisaste e indicá su nuevo valor.</p>{links.map(id => {
      const o=data.obligations.find(r => r.id === id)!;const approval=draft.balances[id];const old=financeText(o,"obligations","balance");
      const update=(patch:Partial<NonNullable<typeof approval>>) => setDraft(d => ({...d,balances:{...d.balances,[id]:{...(d.balances[id] || {enabled:false,newBalance:old,state:financeText(o,"obligations","status") || "En revisión"}),...patch}}}));
      return <div key={id} className={css.balanceRow}><label className={css.checkbox}><input type="checkbox" checked={approval?.enabled || false} onChange={e => update({enabled:e.target.checked})}/>Actualizar saldo de {financeText(o,"obligations","name")}</label><p>Saldo anterior: {formatFinanceAmount(old,financeText(o,"obligations","currency"))}</p>{financeText(o,"obligations","currency") !== draft.values[F.movements.currency.id] ? <p className={css.issues}>La moneda no coincide con la del movimiento. No se hará ninguna conversión automática.</p> : null}{approval?.enabled ? <div className={css.formGrid}><label>Saldo nuevo<input inputMode="decimal" value={approval.newBalance || ""} onChange={e => update({newBalance:e.target.value})}/></label><label>Estado nuevo<select value={approval.state} onChange={e => update({state:e.target.value})}>{F.obligations.status.choices!.map(s => <option key={s}>{s}</option>)}</select></label></div> : null}</div>;
    })}{Object.values(draft.balances).some(b => b.enabled) ? <label>Explicación de la distribución<textarea value={draft.balanceReason} maxLength={1000} onChange={e => setDraft(d => ({...d,balanceReason:e.target.value}))}/></label> : null}</fieldset> : null}
    {duplicate ? <fieldset className={css.warning} disabled={disabled}><legend>Posible duplicado detectado</legend><p>Preferí editar el registro existente. Si comprobaste que esta es otra operación, explicá la diferencia para autorizar su creación.</p><label>Por qué es una operación distinta<textarea value={draft.duplicateReason} maxLength={1000} onChange={e => setDraft(d => ({...d,duplicateReason:e.target.value}))}/></label></fieldset> : null}
    {prepared ? <><h2>Revisar antes de guardar</h2><Review submission={prepared} data={data}/></> : null}
    {pending ? <p className={css.warning} role="status">El envío conserva su identificador. Si se perdió la respuesta, reintentá el mismo envío; no cambies los datos todavía.</p> : null}
    {error ? <p className={css.error} role="alert">{error}</p> : null}
    <footer>{prepared && !locked ? <button type="button" onClick={() => setPrepared(undefined)}>Volver a corregir</button> : null}{conflict ? <p>Cerrá este formulario y actualizá los datos antes de preparar otro cambio.</p> : null}
      {!data.readOnly && !conflict ? pending ? <button type="button" className={css.primary} disabled={busy} onClick={() => void confirm(pending)}>Reintentar el mismo envío</button> : prepared ? <button type="button" className={css.primary} disabled={locked} onClick={() => void confirm(prepared)}>Confirmar y guardar en Supabase</button> : <button type="submit" className={css.primary} disabled={locked}>Revisar cambios</button> : null}</footer>
  </form></dialog>;
}
