import { financeText, decimalCents, validFinanceDate, type FinanceRecord, type FinanceSnapshot, type FinanceTable } from "./finance-model";

const cohort = "reconstruccion-2026-20260909";
const value = (row: FinanceRecord, table: FinanceTable, field: string) => financeText(row, table, field) || "";
function amount(row: FinanceRecord, table: FinanceTable, field: string): number | null {
  const text = financeText(row, table, field);
  return text === null ? null : Number(decimalCents(text)) / 100;
}
const sum = (values: number[]) => Math.round(values.reduce((total, item) => total + Math.round(item * 100), 0)) / 100;
const loanId = "rec9ica43Vt335GZE";
const financialIds = ["rec01oU0MlGTFyRtJ", loanId, "recw6xFxEwTDSU1ry", "recS5VveCDAo3PDGe", "rec8sxL6gM5qASuTL", "rec9SafLaL1OmTRpo"];

/** A documented cohort, not a general ledger or an estimate of current cash. */
export function buildFinanceReport(snapshot: FinanceSnapshot, asOf = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Cordoba" }).format(new Date())) {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const invoices = snapshot.obligations.flatMap(row => {
    const notes = value(row, "obligations", "notes");
    if (!notes.includes(cohort) || !value(row, "obligations", "name").startsWith("Factura ")) return [];
    const key = notes.match(/Clave documental: ([^.]+)\./)?.[1];
    const period = notes.match(/Servicio (\d{4}-\d{2}-\d{2}) a (\d{4}-\d{2}-\d{2})/);
    const total = amount(row, "obligations", "originalAmount");
    if (!key || !period || !validFinanceDate(period[1]) || !validFinanceDate(period[2]) || period[1] > period[2] || total === null) { warnings.push("Hay una factura sin clave, período o importe completo; queda fuera de los gráficos."); return []; }
    if (seen.has(key)) { warnings.push("Se encontró una copia de un comprobante; se cuenta una sola vez."); return []; }
    seen.add(key);
    const customer = notes.match(/Receptor: (.*?), identificador fiscal/)?.[1] || "Receptor por verificar";
    const label = /Gran Meliá/i.test(customer) ? "Gran Meliá" : customer;
    const document = value(row, "obligations", "name").split(" — ")[0];
    return [{ id: row.id, key, document, customer: label, serviceStart: period[1], serviceEnd: period[2],
      issued: value(row, "obligations", "originDate"), currency: value(row, "obligations", "currency"), amount: total,
      status: value(row, "obligations", "status"), balance: amount(row, "obligations", "balance") }];
  }).sort((a, b) => a.serviceStart.localeCompare(b.serviceStart) || a.document.localeCompare(b.document));
  const annual = invoices.filter(row => row.serviceStart.startsWith("2026-") && row.serviceEnd.startsWith("2026-"));
  const prior = invoices.filter(row => row.serviceEnd < "2026-01-01");
  const crossYear = invoices.filter(row => row.serviceStart <= "2026-12-31" && row.serviceEnd >= "2026-01-01" && !annual.includes(row));
  if (crossYear.length) warnings.push("Hay servicios que cruzan ejercicios; no se distribuyen entre años sin revisión.");
  const totals = Object.fromEntries(["ARS", "USD"].map(currency => [currency, sum(annual.filter(row => row.currency === currency).map(row => row.amount))]));
  const currentMonth = asOf.startsWith("2026-") ? Number(asOf.slice(5, 7)) : asOf > "2026-12-31" ? 12 : 0;
  const months = Array.from({ length: currentMonth }, (_, index) => {
    const month = `2026-${String(index + 1).padStart(2, "0")}`;
    const rows = annual.filter(row => row.serviceStart.startsWith(month) && row.serviceEnd.startsWith(month));
    return { month, count: rows.length, amounts: Object.fromEntries(["ARS", "USD"].map(currency => {
      const matching = rows.filter(row => row.currency === currency);
      return [currency, matching.length ? sum(matching.map(row => row.amount)) : null];
    })) };
  });
  if (annual.some(row => row.serviceStart.slice(0, 7) !== row.serviceEnd.slice(0, 7))) warnings.push("Hay facturas de varios meses: integran el año, pero no se asignan a un mes por estimación.");
  const customers = [...new Set(annual.map(row => `${row.currency}|${row.customer}`))].map(key => {
    const [currency, customer] = key.split("|");
    const total = sum(annual.filter(row => row.currency === currency && row.customer === customer).map(row => row.amount));
    return { customer, currency, amount: total, share: totals[currency] ? total / totals[currency] : 0 };
  }).sort((a, b) => b.amount - a.amount);
  const policies = snapshot.obligations.filter(row => value(row, "obligations", "notes").includes(cohort) && value(row, "obligations", "name").startsWith("Póliza ") && /Clave documental: [^.]+:POLIZA:/.test(value(row, "obligations", "notes")));
  const policyTotals = Object.fromEntries(["ARS", "USD"].map(currency => [currency, sum(policies.filter(row => value(row, "obligations", "currency") === currency).flatMap(row => {
    const total = amount(row, "obligations", "originalAmount"); return total === null ? [] : [total];
  }))]));
  const receipts = snapshot.movements.filter(row => value(row, "movements", "notes").includes(cohort) && value(row, "movements", "status") === "Confirmado").map(row => ({
    id: row.id, title: value(row, "movements", "name"), probableDebtCollection: row.id === "sb-bc732d30-2ccf-4a32-aa99-7f62fc3f18e4", date: value(row, "movements", "date"), type: value(row, "movements", "type"),
    amount: amount(row, "movements", "amount"), currency: value(row, "movements", "currency"), concept: value(row, "movements", "concept"),
  }));
  const financial = snapshot.obligations.filter(row => financialIds.includes(row.id)).map(row => ({
    id: row.id, title: value(row, "obligations", "name").split(" — ").slice(0, 2).join(" · "), currency: value(row, "obligations", "currency"),
    balance: amount(row, "obligations", "balance"), due: value(row, "obligations", "dueDate"), status: value(row, "obligations", "status"),
    concept: value(row, "obligations", "concept"), loan: row.id === loanId,
    additionalCurrencyInText: /\bUSD\b/.test(value(row, "obligations", "concept")) && value(row, "obligations", "currency") !== "USD",
  }));
  const pataNegra = snapshot.obligations.find(row => row.id === "rec0X5lBD5d0y4LLU");
  const nabila = receipts.find(row => row.id === "sb-bc732d30-2ccf-4a32-aa99-7f62fc3f18e4");
  const original = pataNegra ? amount(pataNegra, "obligations", "originalAmount") : null;
  const balance = pataNegra ? amount(pataNegra, "obligations", "balance") : null;
  const difference = original !== null && balance !== null ? Math.round((original - balance) * 100) / 100 : null;
  return { year: 2026, asOf, readAt: snapshot.updatedAt, revision: snapshot.revision, scope: "Documentos recuperados en la revisión del 09/09/2026; cobertura parcial.",
    invoices, annual, prior, totals, months, customers, policies: { count: policies.length, totals: policyTotals }, receipts, financial,
    pataNegra: { original, balance, receipt: nabila?.amount ?? null, possibleAlreadyAllocated: !!pataNegra && value(pataNegra, "obligations", "currency") === "ARS" && difference !== null && difference > 0 && nabila?.amount === difference && nabila.currency === "ARS" },
    warnings: [...new Set(warnings)], cash: null, profit: null };
}
export type FinanceReport = ReturnType<typeof buildFinanceReport>;
