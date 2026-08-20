"use client";

import { useEffect, useMemo, useState } from "react";
import "./operacion.css";

type Money = {
  currency: string;
  income: number;
  expense: number;
  margin: number | null;
};

type Entry = {
  id: string;
  date?: string;
  kind: "operación" | "caso" | "sistema";
  title: string;
  detail?: string;
  status?: string;
  client?: string;
  payment?: string;
  audiovisual?: boolean;
  money?: Money[];
};

type Module = {
  key: string;
  name: string;
  target: number | null;
  role: string;
  description: string;
  entries: Entry[];
  privateNote?: string;
};

type Payload = {
  modules: Module[];
  live: boolean;
  source: string;
  updatedAt: string;
  coverage: {
    structuredSince: string;
    note: string;
  };
};

const melia2026 = [
  { month: "Enero", amount: 1665000, invoice: "Factura C 69" },
  { month: "Febrero", amount: 1480000, invoice: "Factura C 70" },
  { month: "Marzo", amount: 1665000, invoice: "Factura C 72" },
  { month: "Abril", amount: 1480000, invoice: "Factura C 75" },
  { month: "Mayo", amount: 1850000, invoice: "Factura C 76" },
  { month: "Junio", amount: 1332000, invoice: "Factura C 77" },
] as const;

const meliaDocumentedTotal = melia2026.reduce((total, month) => total + month.amount, 0);
const meliaMonthlyAverage = Math.round(meliaDocumentedTotal / melia2026.length);

function usd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "PYG" ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${new Intl.NumberFormat("es-AR").format(value)}`;
  }
}

function dateLabel(value?: string) {
  if (!value) return "Fecha no registrada";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function FinanceRow({ row }: { row: Money }) {
  const marginValue = row.margin ?? (row.income > 0 ? row.income - row.expense : null);
  const marginPercent = row.income > 0 && marginValue != null
    ? Math.round((marginValue / row.income) * 100)
    : null;

  return (
    <div className="op-money-row">
      {row.income > 0 && <span><small>Cobrado registrado</small><b>{money(row.income, row.currency)}</b></span>}
      {(row.income > 0 || row.expense > 0) && (
        <span><small>Gasto directo registrado</small><b>{money(row.expense, row.currency)}</b></span>
      )}
      <span>
        <small>Margen bruto registrado</small>
        <b>
          {marginValue == null
            ? "Aún no determinable"
            : `${money(marginValue, row.currency)}${marginPercent == null ? "" : ` · ${marginPercent}%`}`}
        </b>
      </span>
    </div>
  );
}

function ModuleCard({ module, index }: { module: Module; index: number }) {
  const operations = module.entries.filter((entry) => entry.kind === "operación").length;
  const cases = module.entries.filter((entry) => entry.kind === "caso").length;

  return (
    <details className="op-module" open={index === 0}>
      <summary>
        <div className="op-module-main">
          <span className="op-module-index">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <p>{module.role}</p>
            <h2>{module.name}</h2>
            <span>{module.description}</span>
          </div>
        </div>
        <div className="op-module-stats">
          {module.target != null && <div><small>Meta base 2027</small><strong>{usd(module.target)}</strong></div>}
          <div><small>Registros visibles</small><strong>{module.entries.length}</strong></div>
          <div><small>Operaciones / casos</small><strong>{operations} / {cases}</strong></div>
        </div>
        <span className="op-open-label">Abrir módulo</span>
      </summary>

      <div className="op-module-body">
        {module.privateNote && <div className="op-private-note">{module.privateNote}</div>}

        {!module.entries.length ? (
          <div className="op-empty">
            <strong>Todavía no hay evidencia estructurada suficiente.</strong>
            <p>Eso también es información: este módulo necesita producir y registrar su primer resultado verificable.</p>
          </div>
        ) : (
          <div className="op-timeline">
            {module.entries.map((entry) => (
              <article className="op-entry" key={`${module.key}-${entry.id}`}>
                <div className="op-entry-date">{dateLabel(entry.date)}</div>
                <div className="op-entry-content">
                  <div className="op-entry-topline">
                    <span className={`op-kind op-kind-${entry.kind}`}>{entry.kind}</span>
                    {entry.status && <span className="op-status">{entry.status}</span>}
                    {entry.payment && <span className="op-payment">Pago: {entry.payment}</span>}
                    {entry.audiovisual && <span className="op-evidence">Registro audiovisual</span>}
                  </div>
                  <h3>{entry.title}</h3>
                  {entry.client && <p><strong>Cliente / lugar:</strong> {entry.client}</p>}
                  {entry.detail && <p>{entry.detail}</p>}
                  {entry.money?.map((row) => <FinanceRow row={row} key={`${entry.id}-${row.currency}`} />)}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}

export default function OperacionPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/operacion", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("No se pudo leer la operación");
        return response.json();
      })
      .then((payload: Payload) => active && setData(payload))
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  const visibleRecords = useMemo(
    () => data?.modules.reduce((total, module) => total + module.entries.length, 0) || 0,
    [data],
  );

  return (
    <main className="op-page">
      <header className="op-hero">
        <div className="op-shell">
          <nav className="op-nav">
            <a href="/">Ø UnderTango</a>
            <a href="/elitros">ÉLITROS</a>
          </nav>
          <p className="op-kicker">Ø UNDERTANGO · MEMORIA OPERATIVA</p>
          <h1>Operación viva 2026</h1>
          <p className="op-lede">
            Un prototipo para que el trabajo no se pierda. Cada módulo reúne lo que se hizo, cuándo, para quién, qué
            resultado quedó y —cuando el registro financiero alcanza— cuánto se cobró, qué gasto directo se vinculó y qué margen
            puede demostrarse.
          </p>

          <div className="op-headline-grid">
            <article><span>Referencia 2025</span><strong>≈ USD 13K</strong><p>Base prudente conocida, concentrada principalmente en shows.</p></article>
            <article><span>Caso base 2027</span><strong>USD 25K</strong><p>La meta se reparte entre módulos y cada uno debe producir evidencia propia.</p></article>
            <article>
              <span>Registro visible</span>
              <strong>{data ? visibleRecords : "…"}</strong>
              <p>{!data ? "Cargando memoria operativa…" : data.live ? "Lectura directa desde Airtable." : "Instantánea segura construida desde los registros de Airtable."}</p>
            </article>
          </div>
        </div>
      </header>

      <section className="op-shell op-intro">
        <div>
          <p className="op-eyebrow">Por qué el registro empieza tarde</p>
          <h2>2026 no está completo: el sistema estructurado empezó a implementarse en agosto.</h2>
        </div>
        <p>
          {data?.coverage.note || "Estamos conectando la operación histórica con una estructura nueva. Algunas actividades anteriores ya fueron cargadas retrospectivamente y otras todavía no."}
          {" "}Por eso esta página es una <strong>memoria operativa en construcción</strong>, no un balance contable del año.
        </p>
      </section>

      <section className="op-shell op-history">
        <div className="op-history-heading">
          <div>
            <p className="op-eyebrow">Base documental · enero a junio 2026</p>
            <h2>Antes del registro estructurado ya había una operación recurrente medible.</h2>
          </div>
          <p>
            Las facturas emitidas a Gran Meliá Iguazú permiten reconstruir un <strong>piso documental</strong> de la facturación
            del primer semestre. No representa toda la facturación de UnderTango: todavía faltan reconstruir otros shows y
            servicios realizados en esos meses.
          </p>
        </div>

        <div className="op-history-summary">
          <article>
            <span>Piso documentado ene–jun</span>
            <strong>{money(meliaDocumentedTotal, "ARS")}</strong>
            <p>Sólo facturación Gran Meliá documentada mediante facturas emitidas.</p>
          </article>
          <article>
            <span>Promedio mensual documentado</span>
            <strong>{money(meliaMonthlyAverage, "ARS")}</strong>
            <p>Promedio de seis meses; no se usa para inventar meses posteriores.</p>
          </article>
        </div>

        <div className="op-history-months" aria-label="Facturación mensual Gran Meliá enero a junio 2026">
          {melia2026.map((month) => (
            <div key={month.month}>
              <span>{month.month}</span>
              <strong>{money(month.amount, "ARS")}</strong>
              <small>{month.invoice}</small>
            </div>
          ))}
        </div>

        <p className="op-history-note">
          <strong>Lectura correcta:</strong> esto es facturación emitida y documentada, no una estimación de caja total. La
          etapa recurrente de Gran Meliá está documentada hasta junio de 2026; julio no se completa por promedio. A medida
          que reconstruyamos otros clientes, este piso histórico irá creciendo sin perder trazabilidad.
        </p>
      </section>

      <section className="op-shell op-privacy">
        <strong>Qué se publica y qué no.</strong>
        <p>
          Se muestran hechos comerciales y productivos útiles para demostrar ejecución. Los ingresos y gastos directos sólo
          aparecen cuando están vinculados a una operación concreta. Caja interna, créditos, deudas y obligaciones privadas
          quedan fuera de esta vista pública.
        </p>
      </section>

      <section className="op-shell op-modules" aria-label="Módulos de UnderTango">
        <div className="op-section-heading">
          <p className="op-eyebrow">Módulos</p>
          <h2>Hacé clic para ver qué está pasando en cada parte de UnderTango.</h2>
          <p>Lo importante no es que todos estén igual de llenos. Lo importante es saber cuáles ya producen evidencia y cuáles necesitan su primer hito.</p>
        </div>

        {error && (
          <div className="op-error">No pudimos cargar el tablero en este momento. El registro sigue conservado en el sistema operativo.</div>
        )}

        {!data && !error && <div className="op-loading">Leyendo registros estructurados…</div>}

        {data?.modules.map((module, index) => <ModuleCard module={module} index={index} key={module.key} />)}
      </section>

      <section className="op-shell op-next">
        <p className="op-eyebrow">Próxima evolución</p>
        <h2>Plan → operación → evidencia → aprendizaje.</h2>
        <p>
          Este es el primer prototipo. La evolución natural es que cada venta y cada proyecto nazcan vinculados a su módulo,
          de modo que facturación, gastos directos, material audiovisual, cliente y resultado se acumulen automáticamente sin tener
          que reconstruir la historia meses después.
        </p>
        <a href="/elitros">Volver al tablero de ÉLITROS →</a>
      </section>

      <footer className="op-footer">
        <div className="op-shell">
          <span>Ø UnderTango · Operación viva</span>
          <span>{data ? `Actualizado: ${new Date(data.updatedAt).toLocaleString("es-AR")}` : "Registro en construcción"}</span>
        </div>
      </footer>
    </main>
  );
}
