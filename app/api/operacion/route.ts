import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

const TABLES = {
  cases: "tblguHWSAk4wyfNjQ",
  operations: "tblQFmoJzid2gHXye",
  movements: "tblKWLeZFRESXmf3J",
};

const CASE = {
  title: "fldTyP9DE3ANVtoBN",
  date: "fldSJbBMWvCqlS5ug",
  type: "fld7YVhJfdCVTW3qs",
  status: "fldg1ACirYXB01d3E",
  department: "fldqVEZX7bAsvgx07",
};

const OP = {
  title: "fldSGXB8XfFf9WLqi",
  type: "fldwKzHDtnBYQm9uQ",
  client: "fldvIhTzpwEM8FRJN",
  date: "fldcg5cZLRlzJ2LfV",
  status: "fldXxFYuINwyltnYG",
  product: "fldbCocHydizhg5l3",
  payment: "fldqxVSN9qy0xmGG8",
  audiovisual: "fld5Gx4ySEcAIfTQB",
};

const MOVE = {
  title: "fldkd2PPDuXuKn2HL",
  date: "fldZbgKdtogC67t7r",
  type: "fldYHPt7kcADT5nWs",
  amount: "fldkN6UyUgdCmu7EU",
  currency: "fldDINOVhxRdLRAtX",
  status: "fldDb8usr8F6nWmnm",
  concept: "fldDr6kwEcfsBjU5s",
  operation: "fldMtsir3PIhVUNhx",
};

const DEPT = {
  system: "rec495T0JUt4khVlH",
  shows: "reciHbGXE0mOxsObm",
  classes: "recnX6yVz2HDfhlrM",
  music: "recSO8NzsCFvwA8xG",
};

type Money = { currency: string; income: number; expense: number; margin: number | null };
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

const moduleDefinitions = [
  { key: "shows", name: "Shows y experiencias", target: 12000, role: "Motor de caja actual", description: "Shows, hoteles, eventos, propuestas artísticas y experiencias en vivo." },
  { key: "classes", name: "Clases y turismo", target: 3500, role: "Servicio de baja inversión", description: "Clases privadas y grupales, turismo, hoteles, agencias y experiencias de aprendizaje." },
  { key: "production", name: "Producción escénica + técnica", target: 2500, role: "Servicio modular", description: "Puesta en escena, formatos, coordinación técnica, escenografía y proveedores especializados." },
  { key: "programming", name: "Programación y tecnología", target: 2000, role: "Motor escalable en validación", description: "Web, automatizaciones, software, prototipos y Sistema UnderTango." },
  { key: "marketing", name: "Marketing", target: 1500, role: "Servicio modular", description: "Comunicación, campañas, presencia digital, contenido y medición de resultados." },
  { key: "audiovisual", name: "Audiovisual", target: 1000, role: "Capacidad coordinada", description: "Registro, video, piezas audiovisuales y coordinación con realizadores externos." },
  { key: "music", name: "Música y regalías", target: 1000, role: "Activo e IP", description: "Repertorio, arreglos, grabaciones, licencias, regalías y desarrollo musical." },
  { key: "network", name: "Red UnderTango · facilitación", target: 750, role: "Motor escalable futuro", description: "Conectar demanda con artistas y especialistas validados, coordinando la relación y el resultado." },
  { key: "fashion", name: "Moda", target: 750, role: "Producto complementario", description: "Vestuario, diseño, productos físicos y extensiones de marca." },
  { key: "capital", name: "Capital y participación privada", target: null, role: "Infraestructura de crecimiento", description: "Conversaciones privadas de participación y capital. No forma parte de la meta de facturación comercial.", privateNote: "Los movimientos financieros internos, deudas y caja no se publican. Esta vista sólo expone importes cuando están vinculados a una operación comercial concreta." },
] as const;

const snapshot: Record<string, Entry[]> = {
  shows: [
    { id: "shopping-china-1508", date: "2026-08-15", kind: "operación", title: "Shopping China — show de tango", client: "Shopping China", status: "Realizada", payment: "Pagado", money: [{ currency: "USD", income: 200, expense: 100, margin: 100 }] },
    { id: "howard-johnson-1508", date: "2026-08-15", kind: "operación", title: "Howard Johnson Paraguay — show en terraza", client: "Hotel Howard Johnson Paraguay", status: "Realizada", payment: "Pagado", money: [{ currency: "PYG", income: 500000, expense: 0, margin: null }] },
    { id: "pueblito-1208", date: "2026-08-12", kind: "operación", title: "El Pueblito — show", client: "El Pueblito", status: "Realizada", money: [{ currency: "ARS", income: 50000, expense: 0, margin: null }] },
  ],
  classes: [
    { id: "nordicos-2108", date: "2026-08-07", kind: "caso", title: "Clase para grupo nórdico — 21/08", status: "En conversación", detail: "Caso comercial registrado para una clase grupal turística." },
    { id: "academia-1808", date: "2026-08-18", kind: "operación", title: "Ensayo / trabajo de Academia", status: "Realizada" },
  ],
  production: [
    { id: "producto-saxo", date: "2026-08-11", kind: "caso", title: "Producto estrella — saxofón + dupla de tango", status: "En desarrollo" },
  ],
  programming: [
    { id: "elitros-tech", date: "2026-08-10", kind: "caso", title: "Startup Ø UnderTango — ÉLITROS / arquitectura digital", status: "En conversación" },
    { id: "panel-artistas", date: "2026-08-11", kind: "caso", title: "Panel de artistas conectado a la operación", status: "En conversación" },
  ],
  marketing: [
    { id: "panoramic-collab", date: "2026-08-17", kind: "caso", title: "Panoramic Rooftop — colaboración en publicación", status: "Confirmado" },
  ],
  audiovisual: [
    { id: "youtube-shows", date: "2026-08-11", kind: "caso", title: "Migración de videos de shows a YouTube embebido", status: "En conversación" },
  ],
  music: [
    { id: "repertorio-rudy", date: "2026-08-14", kind: "caso", title: "Gira Europea 2027 — primer nodo artístico en Londres", status: "Nuevo" },
    { id: "producto-saxo-musica", date: "2026-08-11", kind: "caso", title: "Desarrollo musical del formato saxofón + dupla", status: "En desarrollo" },
  ],
  network: [
    { id: "bajo-fuego", date: "2026-08-05", kind: "caso", title: "Sistema Bajo Fuego — red internacional de artistas", status: "En conversación" },
  ],
  fashion: [],
  capital: [],
};

function val(fields: Record<string, any>, id: string) {
  return fields?.[id];
}

function text(value: any) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function linkedIds(value: any): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

async function readTable(tableId: string) {
  if (!AIRTABLE_TOKEN) throw new Error("AIRTABLE_TOKEN missing");
  const records: any[] = [];
  let offset = "";
  do {
    const qs = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    if (offset) qs.set("offset", offset);
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Airtable ${tableId} responded ${response.status}`);
    const data = await response.json();
    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);
  return records;
}

function keywordModules(input: string) {
  const s = input.toLowerCase();
  const keys = new Set<string>();
  if (/producci|puesta|técnic|tecnic|escenograf|producto estrella/.test(s)) keys.add("production");
  if (/marketing|publicaci|comunicaci|presencia digital|reputaci|campaña|campana|contenido/.test(s)) keys.add("marketing");
  if (/audiovisual|video|youtube|registro visual|filmaci/.test(s)) keys.add("audiovisual");
  if (/red |red internacional|sistema bajo fuego|facilitaci|matching|artistas/.test(s)) keys.add("network");
  if (/moda|vestuario|indumentaria|ropa|diseño de producto físico/.test(s)) keys.add("fashion");
  return [...keys];
}

function modulesForCase(record: any) {
  const fields = record.fields || {};
  const departments = linkedIds(val(fields, CASE.department));
  const keys = new Set<string>();
  if (departments.includes(DEPT.shows)) keys.add("shows");
  if (departments.includes(DEPT.classes)) keys.add("classes");
  if (departments.includes(DEPT.music)) keys.add("music");
  if (departments.includes(DEPT.system)) keys.add("programming");
  keywordModules(text(val(fields, CASE.title))).forEach((key) => keys.add(key));
  return [...keys];
}

function modulesForOperation(record: any) {
  const fields = record.fields || {};
  const type = text(val(fields, OP.type)).toLowerCase();
  const combined = `${text(val(fields, OP.title))} ${text(val(fields, OP.product))}`;
  const keys = new Set<string>();
  if (type.includes("show")) keys.add("shows");
  if (type.includes("clase")) keys.add("classes");
  if (type.includes("ensayo")) keys.add("music");
  if (/83[øØ]/.test(combined)) keys.add("classes");
  keywordModules(combined).forEach((key) => keys.add(key));
  return [...keys];
}

function safeCommercialMovement(record: any) {
  const fields = record.fields || {};
  if (!linkedIds(val(fields, MOVE.operation)).length) return false;
  const combined = `${text(val(fields, MOVE.title))} ${text(val(fields, MOVE.concept))}`.toLowerCase();
  if (/cambio|crédito|credito|préstamo|prestamo|deuda|saldo inicial|comida|supermercado/.test(combined)) return false;
  return text(val(fields, MOVE.status)).toLowerCase() === "confirmado";
}

function financialsByOperation(movements: any[]) {
  const map = new Map<string, Map<string, { income: number; expense: number }>>();
  movements.filter(safeCommercialMovement).forEach((record) => {
    const fields = record.fields || {};
    const opIds = linkedIds(val(fields, MOVE.operation));
    const currency = text(val(fields, MOVE.currency));
    const amount = Number(val(fields, MOVE.amount) || 0);
    const type = text(val(fields, MOVE.type)).toLowerCase();
    if (!currency || !amount || (!type.includes("ingreso") && !type.includes("egreso"))) return;
    opIds.forEach((opId) => {
      if (!map.has(opId)) map.set(opId, new Map());
      const byCurrency = map.get(opId)!;
      const row = byCurrency.get(currency) || { income: 0, expense: 0 };
      if (type.includes("ingreso")) row.income += amount;
      if (type.includes("egreso")) row.expense += amount;
      byCurrency.set(currency, row);
    });
  });

  const result = new Map<string, Money[]>();
  map.forEach((currencies, opId) => {
    result.set(opId, [...currencies.entries()].map(([currency, value]) => ({
      currency,
      income: value.income,
      expense: value.expense,
      margin: value.income > 0 && value.expense > 0 ? value.income - value.expense : null,
    })));
  });
  return result;
}

function sortEntries(entries: Entry[]) {
  return entries.sort((a, b) => (b.date || "").localeCompare(a.date || "") || b.id.localeCompare(a.id)).slice(0, 18);
}

async function buildLiveModules(): Promise<Module[]> {
  const [cases, operations, movements] = await Promise.all([
    readTable(TABLES.cases),
    readTable(TABLES.operations),
    readTable(TABLES.movements),
  ]);
  const finances = financialsByOperation(movements);
  const entries: Record<string, Entry[]> = Object.fromEntries(moduleDefinitions.map((module) => [module.key, []]));

  operations.forEach((record) => {
    const fields = record.fields || {};
    const title = text(val(fields, OP.product)) || text(val(fields, OP.title)) || "Operación";
    const entry: Entry = {
      id: record.id,
      date: text(val(fields, OP.date)) || undefined,
      kind: "operación",
      title,
      client: text(val(fields, OP.client)) || undefined,
      status: text(val(fields, OP.status)) || undefined,
      payment: text(val(fields, OP.payment)) || undefined,
      audiovisual: Boolean(text(val(fields, OP.audiovisual)) && !/no previsto|no especificado/i.test(text(val(fields, OP.audiovisual)))),
      money: finances.get(record.id),
    };
    modulesForOperation(record).forEach((key) => entries[key]?.push(entry));
  });

  cases.forEach((record) => {
    const fields = record.fields || {};
    const entry: Entry = {
      id: record.id,
      date: text(val(fields, CASE.date)) || undefined,
      kind: "caso",
      title: text(val(fields, CASE.title)) || "Caso",
      status: text(val(fields, CASE.status)) || undefined,
      detail: text(val(fields, CASE.type)) || undefined,
    };
    modulesForCase(record).forEach((key) => entries[key]?.push(entry));
  });

  return moduleDefinitions.map((definition) => ({
    ...definition,
    entries: sortEntries(entries[definition.key] || []),
  }));
}

function buildSnapshotModules(): Module[] {
  return moduleDefinitions.map((definition) => ({
    ...definition,
    entries: sortEntries([...(snapshot[definition.key] || [])]),
  }));
}

export async function GET() {
  try {
    const modules = await buildLiveModules();
    return NextResponse.json({
      modules,
      live: true,
      source: "airtable",
      updatedAt: new Date().toISOString(),
      coverage: {
        structuredSince: "2026-08-04",
        note: "El registro estructurado comenzó en agosto de 2026. Algunas operaciones de julio fueron cargadas retrospectivamente; por eso esta vista no representa la totalidad del año 2026.",
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.warn("Operación viva usa snapshot seguro:", error);
    return NextResponse.json({
      modules: buildSnapshotModules(),
      live: false,
      source: "snapshot",
      updatedAt: new Date().toISOString(),
      coverage: {
        structuredSince: "2026-08-04",
        note: "El registro estructurado comenzó en agosto de 2026 y esta vista está mostrando una instantánea de respaldo.",
      },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  }
}
