import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const MOVEMENTS_TABLE_ID = process.env.AIRTABLE_MOVEMENTS_TABLE_ID || "tblKWLeZFRESXmf3J";
const OBLIGATIONS_TABLE_ID = process.env.AIRTABLE_OBLIGATIONS_TABLE_ID || "tblczu42CZiIPFbmV";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const FOOD_DAILY_BUDGET_ARS = Number(process.env.FOOD_DAILY_BUDGET_ARS || 20000);

const M = {
  name: "fldkd2PPDuXuKn2HL",
  date: "fldZbgKdtogC67t7r",
  type: "fldYHPt7kcADT5nWs",
  amount: "fldkN6UyUgdCmu7EU",
  currency: "fldDINOVhxRdLRAtX",
  status: "fldDb8usr8F6nWmnm",
  concept: "fldDr6kwEcfsBjU5s",
  medium: "fldexwHDkIcXt7iYE",
  notes: "fldB8IAROG4406jRp",
};

const O = {
  name: "fldTyZmuXoFysSWDz",
  type: "fldsQRvXiJqEDwpQ7",
  concept: "fldVKVA6Qv50uXFON",
  currency: "fld1d4ZilO9HE4xfk",
  balance: "fldLK5IhLNJnaupRS",
  status: "fldpVOPqM6JMfpgWh",
};

type Movement = {
  id: string;
  name: string;
  date: string;
  createdTime: string;
  type: "Ingreso" | "Egreso" | string;
  amount: number;
  currency: string;
  status: string;
  concept: string;
  medium: string;
  notes: string;
};

type Obligation = {
  id: string;
  name: string;
  type: string;
  concept: string;
  currency: string;
  balance: number;
  status: string;
};

const movementSnapshot: Movement[] = [
  {
    id: "recYqrb5dfILNAQMg",
    name: "Egreso — Supermercado — ARS 20.000 — 12/08/2026",
    date: "2026-08-12",
    createdTime: "2026-08-12T13:05:21.000Z",
    type: "Egreso",
    amount: 20000,
    currency: "ARS",
    status: "Confirmado",
    concept: "Compra en supermercado. Egreso del fondo de alimentación en efectivo.",
    medium: "Efectivo — caja mesa cocina",
    notes: "Saldo del fondo después de este movimiento: ARS 100.000.",
  },
  {
    id: "rechMFR0vPOxGkKjF",
    name: "Egreso — Comida — ARS 20.000 — 12/08/2026",
    date: "2026-08-12",
    createdTime: "2026-08-12T13:05:21.000Z",
    type: "Egreso",
    amount: 20000,
    currency: "ARS",
    status: "Confirmado",
    concept: "Gasto en comida. Egreso del fondo de alimentación en efectivo.",
    medium: "Efectivo — caja mesa cocina",
    notes: "Saldo del fondo después de este movimiento: ARS 80.000.",
  },
  {
    id: "recOCIzsJTze6iVdI",
    name: "Ingreso — Cambio desde BRL — ARS 120.000 — 11/08/2026",
    date: "2026-08-11",
    createdTime: "2026-08-12T13:10:27.000Z",
    type: "Ingreso",
    amount: 120000,
    currency: "ARS",
    status: "Confirmado",
    concept: "Ingreso en pesos argentinos proveniente del cambio de R$400 a ARS 300 por real.",
    medium: "Efectivo — caja mesa cocina",
    notes: "Crea el fondo inicial de alimentación de ARS 120.000.",
  },
  {
    id: "rec5uMWTuhi3lXUO1",
    name: "Egreso — Cambio a ARS — R$400 — 11/08/2026",
    date: "2026-08-11",
    createdTime: "2026-08-12T13:10:27.000Z",
    type: "Egreso",
    amount: 400,
    currency: "BRL",
    status: "Confirmado",
    concept: "Salida de R$400 para convertirlos a pesos argentinos.",
    medium: "Cambio de moneda",
    notes: "Tipo de cambio registrado: ARS 300 por BRL.",
  },
  {
    id: "recmp5UCBHhXkjlva",
    name: "Ingreso — Carlos Audibert — R$600 — 11/08/2026",
    date: "2026-08-11",
    createdTime: "2026-08-11T20:30:35.000Z",
    type: "Ingreso",
    amount: 600,
    currency: "BRL",
    status: "Confirmado",
    concept: "Pago recibido de Carlos Audibert a cuenta de su deuda.",
    medium: "Efectivo",
    notes: "R$200 quedaron para calle y R$400 se cambiaron a ARS.",
  },
];

const obligationSnapshot: Obligation[] = [
  {
    id: "recaWkKsAuvSnLGtC",
    name: "87Ø1 — Carlos Audibert — cuenta por cobrar",
    type: "Por cobrar",
    concept: "Deuda pendiente de Carlos Audibert con Ø UnderTango Club.",
    currency: "BRL",
    balance: 890,
    status: "Parcial",
  },
];

function normalizeMovement(record: any): Movement {
  const f = record.fields || {};
  return {
    id: record.id,
    name: f[M.name] || "Movimiento sin nombre",
    date: f[M.date] || "",
    createdTime: record.createdTime || "",
    type: f[M.type] || "",
    amount: typeof f[M.amount] === "number" ? f[M.amount] : 0,
    currency: f[M.currency] || "",
    status: f[M.status] || "",
    concept: f[M.concept] || "",
    medium: f[M.medium] || "",
    notes: f[M.notes] || "",
  };
}

function normalizeObligation(record: any): Obligation {
  const f = record.fields || {};
  return {
    id: record.id,
    name: f[O.name] || "Obligación sin nombre",
    type: f[O.type] || "",
    concept: f[O.concept] || "",
    currency: f[O.currency] || "",
    balance: typeof f[O.balance] === "number" ? f[O.balance] : 0,
    status: f[O.status] || "",
  };
}

async function readTable(tableId: string) {
  if (!AIRTABLE_TOKEN) throw new Error("AIRTABLE_TOKEN missing");

  const all: any[] = [];
  let offset = "";

  do {
    const qs = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    if (offset) qs.set("offset", offset);

    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Airtable responded ${response.status}`);

    const data = await response.json();
    all.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return all;
}

function summarize(movements: Movement[], obligations: Obligation[]) {
  const confirmed = movements.filter((movement) => movement.status === "Confirmado");
  const balancesMap = new Map<string, number>();

  for (const movement of confirmed) {
    if (!movement.currency) continue;
    const sign = movement.type === "Egreso" ? -1 : 1;
    balancesMap.set(movement.currency, (balancesMap.get(movement.currency) || 0) + sign * movement.amount);
  }

  const currencyOrder = ["ARS", "BRL", "USD"];
  const balances = Array.from(balancesMap.entries())
    .map(([currency, amount]) => ({ currency, amount }))
    .sort((a, b) => {
      const ai = currencyOrder.indexOf(a.currency);
      const bi = currencyOrder.indexOf(b.currency);
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || a.currency.localeCompare(b.currency);
    });

  const foodFund = confirmed
    .filter(
      (movement) =>
        movement.currency === "ARS" &&
        movement.medium.toLocaleLowerCase("es").includes("caja mesa cocina"),
    )
    .reduce((total, movement) => total + (movement.type === "Egreso" ? -movement.amount : movement.amount), 0);

  const receivableTotalsMap = new Map<string, number>();
  const receivables = obligations.filter((obligation) => obligation.type === "Por cobrar" && obligation.balance > 0);
  for (const obligation of receivables) {
    if (!obligation.currency) continue;
    receivableTotalsMap.set(
      obligation.currency,
      (receivableTotalsMap.get(obligation.currency) || 0) + obligation.balance,
    );
  }

  const receivableTotals = Array.from(receivableTotalsMap.entries()).map(([currency, amount]) => ({
    currency,
    amount,
  }));

  const recentMovements = [...movements]
    .sort((a, b) => {
      const dateDelta = (b.date || "").localeCompare(a.date || "");
      if (dateDelta) return dateDelta;
      return (b.createdTime || "").localeCompare(a.createdTime || "");
    })
    .slice(0, 14);

  return {
    balances,
    foodFund,
    foodDailyBudget: FOOD_DAILY_BUDGET_ARS,
    foodRunwayDays: FOOD_DAILY_BUDGET_ARS > 0 ? Math.max(0, Math.floor(foodFund / FOOD_DAILY_BUDGET_ARS)) : null,
    receivableTotals,
    receivables,
    recentMovements,
  };
}

export async function GET() {
  try {
    const [movementRecords, obligationRecords] = await Promise.all([
      readTable(MOVEMENTS_TABLE_ID),
      readTable(OBLIGATIONS_TABLE_ID),
    ]);

    const movements = movementRecords.map(normalizeMovement);
    const obligations = obligationRecords.map(normalizeObligation);

    return NextResponse.json(
      {
        ...summarize(movements, obligations),
        source: "airtable",
        live: true,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.warn("Finance API is using the Airtable snapshot fallback:", error);
    return NextResponse.json(
      {
        ...summarize(movementSnapshot, obligationSnapshot),
        source: "snapshot",
        live: false,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
