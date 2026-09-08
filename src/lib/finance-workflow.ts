// Pure browser/server-safe form helpers. Never contain credentials or transports.
import { FINANCE_FIELDS as F, amountInput, decimalCents, centsDecimal, financeText, financeLinks,
  isObject, validFinanceDate, type FinanceCell, type FinanceChange, type FinanceReceipt,
  type FinanceRecord, type FinanceSnapshot, type FinanceTable } from "./finance-model";

export type FinanceSubmission = { requestId: string; revision: string; change: FinanceChange };
export function retainFinanceAttempt(error:{uncertain:boolean;code:string}, recovering:boolean) {
  // A lost response followed by expired authentication is NOT proof of rollback.
  return error.uncertain || recovering && !["duplicate","conflict"].includes(error.code);
}
export type BalanceApproval = { enabled: boolean; newBalance: string | null; state: string };
export type FinanceDraft = {
  table: FinanceTable; id: string | null; revision: string;
  initial: Record<string,FinanceCell>; values: Record<string,FinanceCell>;
  balances: Record<string,BalanceApproval>; balanceReason: string; duplicateReason: string;
};
export function newFinanceDraft(table: FinanceTable, snapshot: FinanceSnapshot, record?: FinanceRecord): FinanceDraft {
  const values = record ? structuredClone(record.fields) : Object.fromEntries(Object.values(F[table]).map(f => [f.id,f.type === "links" ? [] : null]));
  if (!record) values[F[table].status.id] = table === "obligations" ? "En revisión" : "Pendiente";
  return { table,id:record?.id || null,revision:snapshot.revision,initial:record ? structuredClone(values) : {},values,balances:{},balanceReason:"",duplicateReason:"" };
}
export function buildFinanceSubmission(draft: FinanceDraft, snapshot: FinanceSnapshot, requestId: string): FinanceSubmission {
  if (snapshot.revision !== draft.revision) throw new Error("Los datos cambiaron. Cerrá el formulario y revisá la lectura actualizada.");
  const fields: Record<string,FinanceCell> = {};
  for (const field of Object.values(F[draft.table])) {
    if (field.readOnly) continue;
    const value = draft.values[field.id];
    if (draft.id && JSON.stringify(value) === JSON.stringify(draft.initial[field.id])) continue;
    if (field.type === "amount") fields[field.id] = amountInput(value);
    else if (field.type === "links") {
      if (!Array.isArray(value) || value.length > 30 || new Set(value).size !== value.length
        || value.some(id => !snapshot[field.target!].some(r => r.id === id))) throw new Error(`Revisá los vínculos de ${field.label}.`);
      fields[field.id] = [...value];
    } else {
      if (value !== null && typeof value !== "string") throw new Error(`Revisá ${field.label}.`);
      const normalized = value === "" ? null : value;
      if (normalized !== null && field.type === "date" && !validFinanceDate(normalized)) throw new Error(`Revisá la fecha de ${field.label}.`);
      if (normalized !== null && field.type === "select" && !field.choices?.includes(normalized)) throw new Error(`Revisá ${field.label}.`);
      if (typeof normalized === "string" && normalized.length > 20000) throw new Error(`${field.label} supera el máximo de texto permitido.`);
      fields[field.id] = normalized;
    }
  }
  const values = { ...draft.initial,...fields };
  const text = (name: string) => values[F[draft.table][name].id] as string | null;
  const changed = (...names: string[]) => !draft.id || names.some(name => F[draft.table][name].id in fields);
  if (changed("name") && !text("name")?.trim()) throw new Error("Escribí un nombre que permita reconocer la operación.");
  if (changed("type") && (!text("type") || draft.table === "obligations" && text("type") === "Saldada")) throw new Error("Elegí el tipo de operación. Saldada es un estado, no un tipo nuevo.");
  if (changed("status") && !text("status")) throw new Error("Elegí el estado de la operación.");
  if (draft.table === "movements" && changed("status","amount","date","currency","type") && text("status") === "Confirmado"
    && (!text("date") || !text("currency") || !text("type") || text("amount") === null || decimalCents(text("amount")!) <= BigInt(0))) {
    throw new Error("Para confirmar un movimiento completá fecha, moneda, tipo e importe mayor que cero.");
  }
  if (draft.table === "obligations") {
    if (changed("status","currency","originalAmount","balance") && text("status") !== "En revisión"
      && (!text("currency") || text("originalAmount") === null || text("balance") === null)) throw new Error("Si falta moneda o importe, conservá el estado En revisión.");
    if (changed("status","balance") && text("status") === "Saldada" && (text("balance") === null || decimalCents(text("balance")!) !== BigInt(0))) throw new Error("Una obligación saldada debe tener saldo cero indicado expresamente.");
  }
  const change: FinanceChange = { record:{table:draft.table,id:draft.id,create:!draft.id,fields} };
  if (draft.duplicateReason.trim()) {
    if (draft.duplicateReason.trim().length < 12 || draft.duplicateReason.length > 1000) throw new Error("Explicá por qué esta es una operación distinta (al menos 12 caracteres).");
    change.duplicateReason = draft.duplicateReason;
  }
  const selected = Object.entries(draft.balances).filter(([,b]) => b.enabled);
  if (selected.length) {
    if (draft.table !== "movements" || text("status") !== "Confirmado") throw new Error("Solo un movimiento confirmado puede actualizar saldos.");
    if (draft.balanceReason.trim().length < 5 || draft.balanceReason.length > 1000) throw new Error("Explicá cómo se distribuye el movimiento entre los saldos que aprobaste.");
    const links = values[F.movements.obligations.id] as string[];
    change.balances = selected.map(([id,b]) => {
      const obligation = snapshot.obligations.find(o => o.id === id);
      if (!obligation || !links.includes(id)) throw new Error("Uno de los saldos aprobados ya no corresponde a una obligación vinculada.");
      if (!F.obligations.status.choices!.includes(b.state)) throw new Error("Elegí el estado nuevo de cada obligación.");
      const next = amountInput(b.newBalance);
      if (b.state === "Saldada" && (next === null || decimalCents(next) !== BigInt(0))) throw new Error("Para saldar una obligación indicá cero como saldo nuevo.");
      if (next === null && b.state !== "En revisión") throw new Error("Un saldo desconocido requiere estado En revisión.");
      return { id,oldBalance:financeText(obligation,"obligations","balance"),newBalance:next,state:b.state };
    });
    change.balanceReason = draft.balanceReason;
    // Relation-only touch is explicit and preserves order if only balances change.
    if (!Object.keys(fields).length) fields[F.movements.obligations.id] = [...links];
  }
  if (!Object.keys(fields).length) throw new Error("No hay cambios para guardar.");
  return { requestId,revision:draft.revision,change };
}
export function financeWarnings(row: FinanceRecord, table: FinanceTable, snapshot: FinanceSnapshot): string[] {
  const warnings: string[] = [];
  if (!financeText(row,table,"currency")) warnings.push("Moneda pendiente de información");
  if (financeText(row,table,table === "obligations" ? "balance" : "amount") === null) warnings.push(table === "obligations" ? "Saldo no informado (no equivale a cero)" : "Importe no informado");
  if (table === "obligations" && financeText(row,table,"originalAmount") === null) warnings.push("Importe original no informado");
  if (table === "obligations" && financeText(row,table,"type") === "Saldada") warnings.push("Tipo histórico: falta distinguir por cobrar o por pagar");
  if (table === "movements") {
    if (financeText(row,table,"status") === "Confirmado" && !financeText(row,table,"date")) warnings.push("Confirmado en el origen sin fecha: revisar");
    const linked = financeLinks(row,table,"obligations");
    if (linked.length > 1) warnings.push("Varias obligaciones: el importe no se descuenta automáticamente");
    if (linked.some(id => financeText(snapshot.obligations.find(o => o.id === id)!,"obligations","currency") !== financeText(row,table,"currency"))) warnings.push("Etiquetas de moneda diferentes entre movimiento y obligación");
  }
  return warnings;
}
export function formatFinanceAmount(value: string | null, currency?: string | null) {
  if (value === null) return "No informado";
  const [whole,fraction] = centsDecimal(decimalCents(value)).split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g,".")},${fraction}${currency ? ` ${currency}` : ""}`;
}
export function verifyFinanceReadback(snapshot: FinanceSnapshot, submission: FinanceSubmission, receipt: FinanceReceipt) {
  if (receipt.requestId !== submission.requestId || BigInt(snapshot.revision) < BigInt(receipt.revision)) throw new Error("La lectura todavía no confirma este comprobante.");
  const record = snapshot[submission.change.record.table].find(r => r.id === receipt.id);
  if (!record) throw new Error("El comprobante existe, pero no se encontró el registro al actualizar.");
  // A later revision may legitimately include another operator's newer changes.
  if (snapshot.revision !== receipt.revision) return "newer";
  for (const [id,value] of Object.entries(submission.change.record.fields)) {
    const field = Object.values(F[submission.change.record.table]).find(f => f.id === id)!;
    const read = record.fields[id];
    const equal = field.type === "amount" && typeof value === "string" && typeof read === "string"
      ? decimalCents(value) === decimalCents(read) : JSON.stringify(value) === JSON.stringify(read);
    if (!equal) throw new Error("El comprobante se recibió, pero la lectura del registro necesita revisión.");
  }
  for (const balance of submission.change.balances || []) {
    const obligation = snapshot.obligations.find(r => r.id === balance.id);
    if (!obligation || financeText(obligation,"obligations","status") !== balance.state
      || amountInput(financeText(obligation,"obligations","balance")) !== balance.newBalance) throw new Error("El saldo guardado necesita revisión de lectura.");
  }
  return "verified";
}
export function parsePendingFinance(value: unknown, actor: string): FinanceSubmission | null {
  if (!isObject(value) || value.v !== 1 || value.actor !== actor || !isObject(value.submission)) return null;
  const s = value.submission;
  if (typeof s.requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.requestId)
    || typeof s.revision !== "string" || !/^(0|[1-9]\d*)$/.test(s.revision) || !isObject(s.change) || !isObject(s.change.record)
    || !["obligations","movements"].includes(String(s.change.record.table)) || !isObject(s.change.record.fields)) return null;
  return s as FinanceSubmission;
}
