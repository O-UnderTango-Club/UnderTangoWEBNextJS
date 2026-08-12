import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const TABLE_ID = process.env.AIRTABLE_OPERATIONS_TABLE_ID || "tblQFmoJzid2gHXye";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

const F = {
  type: "fldwKzHDtnBYQm9uQ",
  place: "fldvIhTzpwEM8FRJN",
  date: "fldcg5cZLRlzJ2LfV",
  time: "fldMrZjbAWilpyilY",
  status: "fldXxFYuINwyltnYG",
  product: "fldbCocHydizhg5l3",
};

type PublicEvent = {
  id: string;
  type: string;
  place: string;
  date: string;
  time: string;
  status: string;
  title: string;
};

const PUBLIC_TYPES = new Set(["Show", "Clase", "Producción"]);
const PUBLIC_STATUSES = new Set(["Confirmada", "En preparación"]);

const snapshot: PublicEvent[] = [
  {
    id: "fallback-el-pueblito-2026-08-12",
    type: "Show",
    place: "El Pueblito",
    date: "2026-08-12",
    time: "21:00",
    status: "Confirmada",
    title: "Show de tango",
  },
  {
    id: "fallback-howard-johnson-2026-08-14",
    type: "Show",
    place: "Hotel Howard Johnson Paraguay",
    date: "2026-08-14",
    time: "21:00",
    status: "Confirmada",
    title: "Show en terraza",
  },
  {
    id: "fallback-festa-nacoes-2026-08-15",
    type: "Show",
    place: "Festa das Nações · Foz do Iguaçu",
    date: "2026-08-15",
    time: "17:00–18:15",
    status: "Confirmada",
    title: "Show de tango benéfico",
  },
  {
    id: "fallback-wish-2026-08-23",
    type: "Show",
    place: "Hotel Wish · Foz do Iguaçu",
    date: "2026-08-23",
    time: "13:30–14:00",
    status: "Confirmada",
    title: "Saxofón + dupla de tango",
  },
  {
    id: "fallback-bernardo-2026-08-29",
    type: "Show",
    place: "Bernardo de Irigoyen",
    date: "2026-08-29",
    time: "Hora a confirmar",
    status: "Confirmada",
    title: "Ø Tango Rave · banda + tango",
  },
  {
    id: "fallback-amerian-2026-10-03",
    type: "Show",
    place: "Hotel Amérian",
    date: "2026-10-03",
    time: "≈21:00",
    status: "Confirmada",
    title: "Show de tango + músico",
  },
];

function selectName(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : "";
  }
  return "";
}

function todayInArgentina(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function normalize(record: any): PublicEvent {
  const fields = record.fields || {};
  const type = selectName(fields[F.type]);
  const status = selectName(fields[F.status]);

  return {
    id: record.id,
    type,
    status,
    place: fields[F.place] || "Lugar a confirmar",
    date: fields[F.date] || "",
    time: fields[F.time] || "Hora a confirmar",
    title: fields[F.product] || type || "Actividad UnderTango",
  };
}

function publicOnly(events: PublicEvent[]): PublicEvent[] {
  const today = todayInArgentina();

  return events
    .filter((event) => event.date >= today)
    .filter((event) => PUBLIC_TYPES.has(event.type))
    .filter((event) => PUBLIC_STATUSES.has(event.status))
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

async function readAirtable(): Promise<PublicEvent[]> {
  if (!AIRTABLE_TOKEN) throw new Error("AIRTABLE_TOKEN missing");

  const records: any[] = [];
  let offset = "";

  do {
    const qs = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    if (offset) qs.set("offset", offset);

    const response = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${qs.toString()}`,
      {
        headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
        cache: "no-store",
      },
    );

    if (!response.ok) throw new Error(`Airtable responded ${response.status}`);

    const data = await response.json();
    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return publicOnly(records.map(normalize));
}

export async function GET() {
  try {
    const events = await readAirtable();
    return NextResponse.json(
      {
        events,
        source: "airtable",
        live: true,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.warn("Calendar API is using the public snapshot fallback:", error);
    return NextResponse.json(
      {
        events: publicOnly(snapshot),
        source: "snapshot",
        live: false,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
