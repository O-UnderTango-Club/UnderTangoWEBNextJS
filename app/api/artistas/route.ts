import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const TABLE_ID = process.env.AIRTABLE_TEAM_TABLE_ID || "tbluFrYO90nEQl7Vg";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

const F = {
  name: "fldDBIrQUVnfvsFdj",
  role: "fld2Hfdy0nCvLTek5",
  locality: "fldkzwOQP0OO7BpET",
  skills: "fldrf8Xr6IPh8emPn",
};

type Artist = {
  id: string;
  name: string;
  role: string;
  locality?: string;
  skills: string[];
};

const snapshot: Artist[] = [
  { id: "recFMitnpLxghJdvs", name: "Araceli Maizal", role: "Bailarín/a", skills: ["Tango escenario", "Tango salón"] },
  { id: "recHugYuGxhUvu5TY", name: "Evayan Behr", role: "Bailarín/a", locality: "Foz do Iguaçu", skills: ["Tango escenario", "Tango salón"] },
  { id: "recg3KhsWCZlFa1HE", name: "Thays Andrade", role: "Bailarín/a", skills: ["Tango escenario"] },
  { id: "recij7H725y9wBOdr", name: "Paloma Apostolaqui", role: "Bailarín/a", skills: ["Tango escenario", "Tango salón"] },
  { id: "recksFCaUypAhUhrS", name: "Luján Rojas", role: "Docente", skills: ["Tango escenario", "Tango salón", "Docencia"] },
  { id: "recmhrbJ2HyYqb1mb", name: "Morena Servián", role: "Bailarín/a", skills: ["Tango escenario"] },
  { id: "recyChHWySFQPVzR7", name: "Pablo Cieslik", role: "Producción", locality: "Puerto Iguazú", skills: ["Piano", "Tango escenario", "Tango salón", "Docencia", "Producción"] },
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

function normalize(record: any): Artist {
  const f = record.fields || {};
  return {
    id: record.id,
    name: f[F.name] || "Integrante",
    role: cleanSelect(f[F.role]) || "Artista",
    locality: f[F.locality] || "",
    skills: cleanMultiSelect(f[F.skills]),
  };
}

async function readAirtable(): Promise<Artist[]> {
  if (!AIRTABLE_TOKEN) throw new Error("AIRTABLE_TOKEN missing");

  const qs = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
  const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Airtable responded ${response.status}`);
  const data = await response.json();

  return (data.records || [])
    .map(normalize)
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
