// Shared presentation/validation metadata. No credentials or server imports.
export type FinanceTable = "obligations" | "movements";
export type FinanceCell = string | null | string[];
export type FinanceRecord = { id: string; version: string; fields: Record<string, FinanceCell> };
export type FinanceReference = { id: string; name: string | null };
export type FinanceChange = {
  record: { table: FinanceTable; id: string | null; create: boolean; fields: Record<string, FinanceCell> };
  balances?: { id: string; oldBalance: string | null; newBalance: string | null; state: string }[];
  balanceReason?: string; duplicateReason?: string;
};
export type FinanceReceipt = { ok: true; id: string; ids: string[]; requestId: string; revision: string; balanceUpdates: number; savedAt: string };
export type FinanceSnapshot = {
  contract: 1; status: "staged" | "validated" | "active"; revision: string; updatedAt: string;
  obligations: FinanceRecord[]; movements: FinanceRecord[];
  contacts: FinanceReference[]; cases: FinanceReference[]; operations: FinanceReference[];
};
type Field = { id: string; label: string; type: "text" | "date" | "amount" | "select" | "links";
  choices?: readonly string[]; target?: keyof Pick<FinanceSnapshot,"obligations" | "movements" | "contacts" | "cases" | "operations">; readOnly?: boolean };
export const FINANCE_FIELDS: Record<FinanceTable, Record<string, Field>> = {
  obligations: {
    name: { id: "fldTyZmuXoFysSWDz", label: "Obligación", type: "text" },
    type: { id: "fldsQRvXiJqEDwpQ7", label: "Tipo", type: "select", choices: ["Por cobrar", "Por pagar", "Saldada"] },
    concept: { id: "fldVKVA6Qv50uXFON", label: "Concepto", type: "text" },
    originalAmount: { id: "fldSQgRtIBF8lf0EH", label: "Importe original", type: "amount" },
    currency: { id: "fld1d4ZilO9HE4xfk", label: "Moneda", type: "select", choices: ["BRL", "ARS", "USD", "R$"] },
    balance: { id: "fldLK5IhLNJnaupRS", label: "Saldo actual", type: "amount" },
    status: { id: "fldpVOPqM6JMfpgWh", label: "Estado", type: "select", choices: ["Pendiente", "Parcial", "Saldada", "En revisión"] },
    originDate: { id: "fld8CzxJmRPItsBfD", label: "Fecha de origen", type: "date" },
    dueDate: { id: "fldBJga4d04ADmfXO", label: "Vencimiento", type: "date" },
    followUpDate: { id: "fldzNN01DonCW0ivs", label: "Próximo seguimiento", type: "date" },
    nextAction: { id: "fldPjh1CwrJYfC7iR", label: "Próxima acción", type: "text" },
    notes: { id: "fldluVZWHtA7z956Y", label: "Notas", type: "text" },
    contacts: { id: "fldvufwivbUnORLYz", label: "Contrapartes", type: "links", target: "contacts" },
    cases: { id: "fldyxqsAglrqNKSuZ", label: "Casos", type: "links", target: "cases" },
    operations: { id: "fldjn9WEEkziGM2um", label: "Operaciones", type: "links", target: "operations" },
    movements: { id: "fldXDqH4s4TalYImF", label: "Movimientos vinculados", type: "links", target: "movements", readOnly: true },
  },
  movements: {
    name: { id: "fldkd2PPDuXuKn2HL", label: "Movimiento", type: "text" },
    date: { id: "fldZbgKdtogC67t7r", label: "Fecha", type: "date" },
    type: { id: "fldYHPt7kcADT5nWs", label: "Tipo", type: "select", choices: ["Ingreso", "Egreso"] },
    amount: { id: "fldkN6UyUgdCmu7EU", label: "Importe", type: "amount" },
    currency: { id: "fldDINOVhxRdLRAtX", label: "Moneda", type: "select", choices: ["BRL", "ARS", "USD", "PYG"] },
    status: { id: "fldDb8usr8F6nWmnm", label: "Estado", type: "select", choices: ["Confirmado", "Pendiente"] },
    concept: { id: "fldDr6kwEcfsBjU5s", label: "Concepto", type: "text" },
    method: { id: "fldexwHDkIcXt7iYE", label: "Medio de pago", type: "text" },
    notes: { id: "fldB8IAROG4406jRp", label: "Notas", type: "text" },
    country: { id: "fld18iGEughC5os4a", label: "País comercial", type: "select", choices: ["Argentina", "Brasil", "Paraguay", "Reino Unido", "Regional / multinacional", "Otro"] },
    obligations: { id: "fldgiA3WB0D1sH5Sw", label: "Obligaciones", type: "links", target: "obligations" },
    contacts: { id: "fldew9d8ogxgMvLgL", label: "Contrapartes", type: "links", target: "contacts" },
    cases: { id: "fldVHLvgqjTrJOngF", label: "Casos", type: "links", target: "cases" },
    operations: { id: "fldMtsir3PIhVUNhx", label: "Operaciones", type: "links", target: "operations" },
  },
};
export function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
export function financeText(row: FinanceRecord, table: FinanceTable, name: string): string | null {
  const value = row.fields[FINANCE_FIELDS[table][name].id];
  return typeof value === "string" ? value : null;
}
export function financeLinks(row: FinanceRecord, table: FinanceTable, name: string): string[] {
  const value = row.fields[FINANCE_FIELDS[table][name].id];
  return Array.isArray(value) ? value : [];
}
const decimal = /^-?(0|[1-9]\d*)(?:\.(\d{1,2}))?$/;
export function decimalCents(value: string): bigint {
  if (!decimal.test(value)) throw new Error("Importe decimal inválido.");
  const negative = value.startsWith("-");
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  const cents = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  return negative ? -cents : cents;
}
export function centsDecimal(value: bigint): string {
  const absolute = value < BigInt(0) ? -value : value;
  return `${value < BigInt(0) ? "-" : ""}${absolute / BigInt(100)}.${String(absolute % BigInt(100)).padStart(2, "0")}`;
}
export function amountInput(value: unknown): string | null {
  if (value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Escribí el importe sin separadores de miles.");
  const normalized = value.trim().replace(",", ".");
  if (!/^(0|[1-9]\d{0,14})(?:\.\d{1,2})?$/.test(normalized)) throw new Error("Usá un importe positivo o cero, con hasta dos decimales y sin separadores de miles.");
  return centsDecimal(decimalCents(normalized));
}
export function validFinanceDate(value: string): boolean {
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Strictly validate the complete private read contract, including reciprocal links.
export function parseFinanceSnapshot(value: unknown, allowStaged = false): FinanceSnapshot {
  const invalid = () => new Error("La lectura financiera está incompleta o no pudo verificarse.");
  if (!isObject(value) || value.contract !== 1 || typeof value.revision !== "string" || !/^(0|[1-9]\d*)$/.test(value.revision)
    || !["staged", "validated", "active"].includes(String(value.status)) || (!allowStaged && value.status !== "active")
    || typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) throw invalid();
  const groups = ["obligations", "movements", "contacts", "cases", "operations"] as const;
  const identifiers: Record<string, Set<string>> = {};
  for (const group of groups) {
    const rows = value[group];
    if (!Array.isArray(rows)) throw invalid();
    const ids = new Set<string>(); identifiers[group] = ids;
    for (const row of rows) {
      if (!isObject(row) || typeof row.id !== "string" || !row.id || row.id.length > 80 || ids.has(row.id)) throw invalid();
      ids.add(row.id);
      if (group === "contacts" || group === "cases" || group === "operations") {
        if (row.name !== null && typeof row.name !== "string") throw invalid();
        continue;
      }
      if (typeof row.version !== "string" || !/^[1-9]\d*$/.test(row.version) || !isObject(row.fields)) throw invalid();
      const metadata = Object.values(FINANCE_FIELDS[group]);
      if (Object.keys(row.fields).length !== metadata.length) throw invalid();
      for (const field of metadata) {
        const cell = row.fields[field.id];
        if (field.type === "links") {
          if (!Array.isArray(cell) || cell.some(id => typeof id !== "string") || new Set(cell).size !== cell.length) throw invalid();
        } else if (cell !== null) {
          if (typeof cell !== "string") throw invalid();
          if (field.type === "amount" && !decimal.test(cell)) throw invalid();
          if (field.type === "date" && !validFinanceDate(cell)) throw invalid();
          if (field.type === "select" && !field.choices?.includes(cell)) throw invalid();
        }
      }
    }
  }
  const snapshot = value as unknown as FinanceSnapshot;
  for (const table of ["obligations", "movements"] as const) {
    for (const row of snapshot[table]) {
      for (const field of Object.values(FINANCE_FIELDS[table]).filter(f => f.type === "links")) {
        if ((row.fields[field.id] as string[]).some(id => !identifiers[field.target!].has(id))) throw invalid();
      }
    }
  }
  const obligationEdges = new Set(snapshot.obligations.flatMap(o => financeLinks(o,"obligations","movements").map(id => `${o.id}:${id}`)));
  const movementEdges = new Set(snapshot.movements.flatMap(m => financeLinks(m,"movements","obligations").map(id => `${id}:${m.id}`)));
  if (obligationEdges.size !== movementEdges.size || [...obligationEdges].some(edge => !movementEdges.has(edge))) throw invalid();
  return snapshot;
}

export type FinanceTotal = { table: FinanceTable; currency: string | null; type: string | null; status: string | null; records: number; unknown: number; knownSubtotal: string | null };
export function financeTotals(snapshot: FinanceSnapshot): FinanceTotal[] {
  const totals = new Map<string, FinanceTotal & { cents: bigint; known: number }>();
  for (const table of ["obligations", "movements"] as const) {
    for (const row of snapshot[table]) {
      const currency = financeText(row,table,"currency"), type = financeText(row,table,"type"), status = financeText(row,table,"status");
      const key = JSON.stringify([table,currency,type,status]);
      const group = totals.get(key) || { table,currency,type,status,records:0,unknown:0,knownSubtotal:null,cents:BigInt(0),known:0 };
      const value = financeText(row,table,table === "obligations" ? "balance" : "amount");
      group.records++;
      if (value === null) group.unknown++; else { group.cents += decimalCents(value); group.known++; }
      totals.set(key,group);
    }
  }
  return [...totals.values()].map(({cents,known,...group}) => ({...group,knownSubtotal:known ? centsDecimal(cents) : null}));
}
