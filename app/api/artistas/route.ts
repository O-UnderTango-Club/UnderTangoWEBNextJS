import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const TEAM_TABLE_ID = process.env.AIRTABLE_TEAM_TABLE_ID || "tbluFrYO90nEQl7Vg";
const OPERATIONS_TABLE_ID = process.env.AIRTABLE_OPERATIONS_TABLE_ID || "tblQFmoJzid2gHXye";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

const F = {
  name: "fldDBIrQUVnfvsFdj",
  role: "fld2Hfdy0nCvLTek5",
  locality: "fldkzwOQP0OO7BpET",
  skills: "fldrf8Xr6IPh8emPn",
  availability: "fldt71Awea8GIz8Bo",
  operations: "fldate8N0oPn89ilp",
};

const OF = {
  name: "fldSGXB8XfFf9WLqi",
  date: "fldcg5cZLRlzJ2LfV",
  time: "fldMrZjbAWilpyilY",
  status: "fldXxFYuINwyltnYG",
  place: "fldvIhTzpwEM8FRJN",
  product: "fldbCocHydizhg5l3",
};

type Commitment = {
  id: string;
  name: string;
  date?: string;
  time?: string;
  place?: string;
  product?: string;
  status?: string;
};

type Artist = {
  id: string;
  name: string;
  role: string;
  locality?: string;
  skills: string[];
  availability?: string;
  commitments: Commitment[];
};

const snapshot: Artist[] = [
  { id: "recyChHWySFQPVzR7", name: "Pablo Cieslik", role: "Producción", locality: "Puerto Iguazú", skills: ["Piano", "Tango escenario", "Tango salón", "Docencia", "Producción"], commitments: [
    { id: "recXH429Zk7rKAXhS", name: "Festa das Nações", date: "2026-08-15", time: "17:00", place: "Foz do Iguaçu", status: "Confirmada" },
    { id: "rec0zwOt6bhJUUeY4", name: "Show Bernardo de Irigoyen", date: "2026-08-29", place: "Bernardo de Irigoyen", status: "Confirmada" },
  ] },
  { id: "recMUp57DK1Y4HGux", name: "Eva Janberg", role: "Bailarín/a", skills: ["Tango escenario", "Tango salón"], availability: "No disponible del 22/08/2026 al 25/08/2026 inclusive.", commitments: [] },
  { id: "recFMitnpLxghJdvs", name: "Araceli Maizal", role: "Bailarín/a", skills: ["Tango escenario", "Tango salón"], commitments: [] },
  { id: "recHugYuGxhUvu5TY", name: "Evayan Behr", role: "Bailarín/a", locality: "Foz do Iguaçu", skills: ["Tango escenario", "Tango salón"], availability: "No disponible del 22/08/2026 al 25/08/2026 inclusive.", commitments: [
    { id: "recXH429Zk7rKAXhS", name: "Festa das Nações", date: "2026-08-15", time: "17:00", place: "Foz do Iguaçu", status: "Confirmada" },
  ] },
  { id: "recg3KhsWCZlFa1HE", name: "Thays Andrade", role: "Bailarín/a", skills: ["Tango escenario"], commitments: [
    { id: "recvVtYz1UedtkUhD", name: "Hotel Wish", date: "2026-08-23", time: "13:30–14:00", place: "Foz do Iguaçu", status: "Confirmada" },
    { id: "rec0zwOt6bhJUUeY4", name: "Show Bernardo de Irigoyen", date: "2026-08-29", place: "Bernardo de Irigoyen", status: "Confirmada" },
  ] },
  { id: "recij7H725y9wBOdr", name: "Paloma Apostolaqui", role: "Bailarín/a", skills: ["Tango escenario", "Tango salón"], availability: "Pausada para nuevas fechas hasta nuevo aviso.", commitments: [] },
  { id: "recksFCaUypAhUhrS", name: "Luján Rojas", role: "Docente", skills: ["Tango escenario", "Tango salón", "Docencia"], availability: "No disponible del 17/08/2026 al 31/08/2026 inclusive.", commitments: [] },
  { id: "recmhrbJ2HyYqb1mb", name: "Morena Servián", role: "Bailarín/a", skills: ["Tango escenario"], commitments: [] },
];

function cleanSelect(value: any): string {
  if (typeof value === "string") return value;
  if (value && typeof value.name === "string") return value.name;
  return "";
}

function cleanMultiSelect(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(cleanSelect).filter(Boolean);
}

function cleanLinks(value: any): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => typeof item === "string" ? item : item?.id)
    .filter(Boolean);
}

async function fetchTable(tableId: string) {
  const qs = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Airtable responded ${response.status}`);
  const data = await response.json();
  return data.records || [];
}

async function readAirtable(): Promise<Artist[]> {
  if (!AIRTABLE_TOKEN) throw new Error("AIRTABLE_TOKEN missing");

  const [teamRecords, operationRecords] = await Promise.all([
    fetchTable(TEAM_TABLE_ID),
    fetchTable(OPERATIONS_TABLE_ID),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const operations = new Map<string, Commitment>();

  for (const record of operationRecords) {
    const f = record.fields || {};
    const date = f[OF.date] || "";
    if (date && date < today) continue;
    operations.set(record.id, {
      id: record.id,
      name: f[OF.name] || f[OF.product] || "Compromiso",
      date,
      time: f[OF.time] || "",
      place: f[OF.place] || "",
      product: f[OF.product] || "",
      status: cleanSelect(f[OF.status]),
    });
  }

  return teamRecords
    .map((record: any): Artist => {
      const f = record.fields || {};
      const operationIds = cleanLinks(f[F.operations]);
      const commitments = operationIds
        .map((id) => operations.get(id))
        .filter(Boolean) as Commitment[];
      commitments.sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"));

      return {
        id: record.id,
        name: f[F.name] || "Integrante",
        role: cleanSelect(f[F.role]) || "Artista",
        locality: f[F.locality] || "",
        skills: cleanMultiSelect(f[F.skills]),
        availability: f[F.availability] || "",
        commitments,
      };
    })
    .filter((person: Artist) => person.role !== "Programación")
    .sort((a: Artist, b: Artist) => {
      const aPablo = a.name === "Pablo Cieslik" ? -1 : 0;
      const bPablo = b.name === "Pablo Cieslik" ? -1 : 0;
      return aPablo - bPablo || a.role.localeCompare(b.role) || a.name.localeCompare(b.name);
    });
}

export async function GET() {
  try {
    const artists = await readAirtable();
    return NextResponse.json(
      { artists, source: "airtable", live: true, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.warn("Artists API is using Airtable snapshot fallback:", error);
    return NextResponse.json(
      { artists: snapshot, source: "snapshot", live: false, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
