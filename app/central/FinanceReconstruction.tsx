"use client";

import { useEffect, useState } from "react";
import type { FinanceReport } from "../../src/lib/finance-report";
import css from "./finance-report.module.css";

type Report = { title: string; result: string; status: string; dashboard: FinanceReport };
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const money = (value: number, currency: string) => `${currency} ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(value)}`;
const short = (value: number) => new Intl.NumberFormat("es-AR", { notation: "compact", maximumFractionDigits: 2 }).format(value);
const date = (value: string) => value ? value.split("-").reverse().join("/") : "Sin fecha informada";

export default function FinanceReconstruction() {
  const [report, setReport] = useState<Report>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [currency, setCurrency] = useState("ARS");
  const [graphMode, setGraphMode] = useState<"collections" | "invoices">("collections");
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let active = true;
    setReport(undefined); setError("");
    async function read() {
      try {
        const response = await fetch("/api/panel/finance/reconstruction", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        if (response.status === 401 || response.status === 403) throw new Error("Este informe requiere el acceso privado del panel en este navegador.");
        if (!response.ok) throw new Error("No se pudo consultar el informe. Podés volver a intentar.");
        const value = await response.json();
        if (typeof value?.result !== "string" || value?.dashboard?.year !== 2026 || !Array.isArray(value.dashboard.invoices)) throw new Error("El informe no pudo verificarse.");
        if (active) setReport(value);
      } catch (error) {
        if (active) setError(error instanceof Error && error.name !== "AbortError" ? error.message : "La consulta tardó demasiado. Volvé a intentar.");
      } finally { clearTimeout(timeout); }
    }
    void read();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);

  const data = report?.dashboard;
  const customers = data?.customers.filter(row => row.currency === currency) || [];
  const leading = customers[0];
  const chartMonths = (graphMode === "collections" ? data?.collectionMonths : data?.months) || [];
  const maxMonth = Math.max(1, ...chartMonths.map(row => row.amounts[currency] || 0));
  const maxDebt = Math.max(1, ...(data?.financial.map(row => row.balance || 0) || []));

  return <div className={css.report}>
    <div className={css.topline}><span>Ø87 · Informe de situación</span><span>Privado · {data ? date(data.asOf) : "2026"}</span></div>
    {!data && !error && <p role="status">Leyendo los registros financieros…</p>}
    {error && <p role="alert" className={css.alert}>{error}</p>}
    {data && <>
      <header className={css.hero}>
        <p className={css.eyebrow}>Cómo leo la situación</p>
        <h4>Hay actividad documentada.<br />Falta cerrar la cuenta de caja.</h4>
        <p>Las facturas muestran trabajo real. Todavía no prueban cuánto se cobró, cuánto costó producirlo ni cuánto quedó disponible. Las obligaciones financieras registradas agregan presión: el paso inmediato es conciliar, antes de dar el año por cerrado.</p>
        <div className={css.statuses}><span>Facturación · parcial</span><span>Cobros · por conciliar</span><span>Rentabilidad · por determinar</span></div>
      </header>

      <div className={css.metrics}>
        <article><span>Servicios 2026 facturados</span><strong>{money(data.totals.ARS, "ARS")}</strong><small>Comprobantes encontrados en pesos</small></article>
        <article><span>Servicios 2026 facturados</span><strong>{money(data.totals.USD, "USD")}</strong><small>Se mantienen en su moneda</small></article>
        <article className={css.unknown}><span>Caja disponible</span><strong>Sin determinar</strong><small>Faltan saldos conciliados por cuenta</small></article>
        <article className={css.unknown}><span>Ganancia del año</span><strong>Sin determinar</strong><small>Faltan cobros y costos completos</small></article>
      </div>

      <section className={css.section} aria-labelledby="report-monthly-title">
        <div className={css.sectionHead}><div><p className={css.eyebrow}>01 · La actividad que podemos demostrar</p><h4 id="report-monthly-title">{graphMode === "collections" ? "Cobros por mes de recepción" : "Facturación por mes de servicio"}</h4></div><div className={css.switch} aria-label="Moneda del gráfico">{["ARS", "USD"].map(unit => <button key={unit} type="button" aria-pressed={currency === unit} onClick={() => setCurrency(unit)}>{unit}</button>)}</div></div>
        <div className={css.switch} aria-label="Contenido del gráfico"><button type="button" aria-pressed={graphMode === "collections"} onClick={() => setGraphMode("collections")}>Cobros</button><button type="button" aria-pressed={graphMode === "invoices"} onClick={() => setGraphMode("invoices")}>Facturación</button></div>
        <p className={css.caption}>{graphMode === "collections" ? "Cobros confirmados incluidos en este informe, por fecha de recepción. Pueden corresponder a deudas anteriores o a trabajos posteriores. Un mes sin registro no equivale a ingreso cero; este gráfico no es el saldo disponible." : "Cada barra corresponde al período trabajado. Un mes sin factura en esta revisión queda marcado como «sin documento», nunca como venta cero."}</p>
        <div className={css.chart} role="img" aria-label={`${graphMode === "collections" ? "Cobros confirmados" : "Facturación documentada"} por mes en ${currency}. Detalle accesible en la tabla siguiente.`}>
          {chartMonths.map((row, index) => { const value = row.amounts[currency]; return <div className={css.column} key={row.month}>
            <div className={css.barSpace}>{value === null ? <div className={css.missing}><span>{graphMode === "collections" ? "Sin reg." : "Sin doc."}</span></div> : <div className={css.bar} style={{ height: `${Math.max(3, value / maxMonth * 100)}%` }}><b>{short(value)}</b></div>}</div>
            <span>{monthNames[index]}</span>
          </div>; })}
        </div>
        <details className={css.details}><summary>Ver los importes del gráfico</summary><div className={css.tableWrap}><table><thead><tr><th>{graphMode === "collections" ? "Mes de cobro" : "Mes de servicio"}</th><th>ARS</th><th>USD</th></tr></thead><tbody>{chartMonths.map((row, index) => <tr key={row.month}><td>{monthNames[index]} 2026</td>{["ARS", "USD"].map(unit => <td key={unit}>{row.amounts[unit] === null ? "Sin registro en este informe" : money(row.amounts[unit]!, unit)}</td>)}</tr>)}</tbody></table></div></details>
        {graphMode === "invoices" && <div className={css.twoColumns}>
          <article className={css.insight}><h5>Una base muy concentrada</h5>{leading ? <><strong className={css.bigNumber}>{new Intl.NumberFormat("es-AR", { style: "percent", maximumFractionDigits: 1 }).format(leading.share)}</strong><p>de la facturación documentada en {currency} corresponde a <b>{leading.customer}</b>. Describe esta muestra, no toda la actividad de UnderTango.</p><div className={css.shares}>{customers.map((row, index) => <div key={row.customer}><span>{row.customer}</span><b>{money(row.amount, row.currency)}</b><i style={{ width: `${row.share * 100}%`, backgroundColor: index ? "#b99b65" : "#6c2838" }} /></div>)}</div></> : <p>Todavía no hay documentos para calcular esta distribución.</p>}</article>
          <article className={css.insight}><h5>Qué significa para 2027</h5><p>La muestra en pesos depende principalmente de un cliente. Conviene construir continuidad comercial y registrar el margen de cada proyecto; facturar más, por sí solo, no demuestra que quede más caja.</p><p>La ausencia de comprobantes en los últimos meses de la revisión pide recuperar documentación. No permite concluir que no hubo ventas.</p></article>
        </div>}
        {graphMode === "invoices" && data.prior.length > 0 && <p className={css.note}>Corte entre años: {data.prior.map(row => `${row.document}, ${money(row.amount, row.currency)}`).join("; ")} corresponde a servicios anteriores a 2026 y queda fuera de estos totales.</p>}
      </section>

      <section className={css.section} aria-labelledby="report-cash-title">
        <p className={css.eyebrow}>02 · Lo cobrado no es lo facturado</p><h4 id="report-cash-title">Cobros, pagos y honorarios asignados</h4>
        <div className={css.receipts}>{data.receipts.map(row => <article key={row.id} data-kind={row.type}><span>{date(row.date)} · {row.type === "Ingreso" ? "Recibido" : "Pagado"}</span><strong>{row.amount === null ? "Importe por verificar" : money(row.amount, row.currency)}</strong><h5>{row.title}</h5><p>{row.probableDebtCollection ? "Probable cobro de una deuda anterior. Falta identificar su imputación; no se cuenta como una venta nueva." : row.concept || "Concepto por completar."}</p></article>)}</div>
        {data.allocations.map(allocation => <article className={css.callout} key={`${allocation.operationId}-${allocation.currency}`}>
          <h5>{allocation.title}</h5><p>Distribución de los honorarios en {allocation.currency}. Los importes pendientes todavía no son pagos realizados.</p>
          <div className={css.tableWrap}><table><thead><tr><th>Honorario</th><th>Asignado</th><th>Pendiente</th><th>Estado</th></tr></thead><tbody>{allocation.payments.map(row => <tr key={row.id}><td>{row.title}</td><td>{row.amount === null ? "Sin determinar" : money(row.amount, allocation.currency)}</td><td>{row.balance === null ? "Sin determinar" : money(row.balance, allocation.currency)}</td><td>{row.status}</td></tr>)}</tbody></table></div>
          <p><b>Cobrado:</b> {allocation.received === null ? "Sin determinar" : money(allocation.received, allocation.currency)} · <b>Honorarios asignados:</b> {allocation.committed === null ? "Sin determinar" : money(allocation.committed, allocation.currency)}</p>
          <p className={css.note}><b>Remanente sin asignar tras honorarios: {allocation.unassigned === null ? "Sin determinar" : money(allocation.unassigned, allocation.currency)}.</b> Es la distribución de este cobro; no representa la caja total ni una ganancia final. Otros gastos, si los hubiera, se revisan por separado.</p>
        </article>)}
        {data.pataNegra.possibleAlreadyAllocated && <div className={css.callout}><h5>Evitar una doble resta en el cobro recuperado</h5><p>El importe original registrado ({money(data.pataNegra.original!, "ARS")}) menos el saldo registrado ({money(data.pataNegra.balance!, "ARS")}) coincide con la transferencia recuperada ({money(data.pataNegra.receipt!, "ARS")}). Es una señal de que podría estar ya imputada. La coincidencia numérica no confirma la conciliación.</p></div>}
        <p className={css.caption}>Incluye movimientos recuperados de documentos y cobros confirmados directamente por Pablo. No son todos los movimientos del año ni permiten calcular la caja de hoy.</p>
      </section>

      <section className={css.section} aria-labelledby="report-pressure-title">
        <p className={css.eyebrow}>03 · La presión que hay que revisar</p><h4 id="report-pressure-title">Obligaciones financieras registradas</h4>
        <p className={css.caption}>Saldos de registros distintos, con cortes documentales de agosto y septiembre. No se suman como deuda actual conciliada: hay que comprobar pagos, cargos y cambios posteriores.</p>
        <div className={css.debts}>{data.financial.map(row => <article key={row.id}><div><h5>{row.title}</h5><strong>{row.balance === null ? "Saldo desconocido" : money(row.balance, row.currency)}</strong></div><div className={css.debtTrack} aria-hidden="true"><i style={{ width: `${(row.balance || 0) / maxDebt * 100}%` }} /></div><p>{row.loan ? "Capital pendiente del préstamo; no es el importe de la cuota." : `Estado registrado: ${row.status}.`}{row.due && ` ${row.loan ? "Fecha de la cuota" : "Vencimiento registrado"}: ${date(row.due)}.`}{row.due && row.due < data.asOf && row.status !== "Saldada" && " Fecha pasada: verificar pago o regularización."}</p>{row.additionalCurrencyInText && <p className={css.note}>El resumen también incluye USD. Ese componente está en el detalle documental y no integra la barra en ARS.</p>}<details><summary>Consultar el detalle registrado</summary><p>{row.concept}</p></details></article>)}</div>
      </section>

      <section className={css.section} aria-labelledby="report-costs-title">
        <p className={css.eyebrow}>04 · Lo que todavía impide medir el resultado</p><h4 id="report-costs-title">Los costos están incompletos</h4>
        <div className={css.costBox}><strong>{money(data.policies.totals.ARS, "ARS")}</strong><span>{data.policies.count} pólizas recuperadas</span><p>Es un costo documental parcial. Faltan pagos a artistas, producción, transporte y otros gastos. No corresponde restar sólo estas pólizas a la facturación y llamar «ganancia» a la diferencia.</p></div>
        <div className={css.priorities}><h5>Mi orden de trabajo</h5><ol><li><strong>Conciliar caja y vencimientos.</strong> Cruzar extractos, pagos de septiembre y saldos por cuenta. Identificar los cobros de deuda sin duplicar descuentos.</li><li><strong>Completar los comprobantes de 2026.</strong> Recuperar el listado ARCA y las notas de crédito; cubrir los meses que faltan.</li><li><strong>Medir el margen de cada trabajo.</strong> Vincular factura, cobro y costo por proyecto. Esa es la base para decidir qué sostener y ampliar en 2027.</li></ol></div>
      </section>

      <details className={css.details}><summary>Fuentes y alcance · {data.invoices.length} facturas revisadas</summary><p>{data.scope} La facturación está expresada en importes nominales, sin conversión de moneda ni ajuste por inflación.</p><div className={css.tableWrap}><table><thead><tr><th>Comprobante</th><th>Cliente</th><th>Servicio</th><th>Importe</th></tr></thead><tbody>{data.invoices.map(row => <tr key={row.id}><td>{row.document}</td><td>{row.customer}</td><td>{date(row.serviceStart)} a {date(row.serviceEnd)}</td><td>{money(row.amount, row.currency)}</td></tr>)}</tbody></table></div><details><summary>Historial de la reconstrucción</summary><p className={css.history}>{report?.result}</p></details></details>
      {data.warnings.map(warning => <p className={css.alert} key={warning}>{warning}</p>)}
    </>}
    <footer className={css.actions}><button type="button" onClick={() => setAttempt(value => value + 1)}>Actualizar informe</button><a href="/panel-de-control/finanzas">Ver facturas y movimientos</a><a href="/panel-de-control">Panel de control</a></footer>
  </div>;
}
