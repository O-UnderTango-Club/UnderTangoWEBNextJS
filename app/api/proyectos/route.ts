import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const TABLE_ID = process.env.AIRTABLE_PROJECTS_TABLE_ID || "tblf6DZBViGbvxRzS";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

const F = {
  name: "fldChULRkd1GrXY3w",
  status: "fldcypAILEecLnLGQ",
  priority: "fldQEVUFZT4dtDlCD",
  horizon: "fldeDYEI0o78Q6nGB",
  areas: "fldr4SXQDM49FfkJF",
  purpose: "fldrApFZcuzKj3Gax",
  current: "fldvAlTbZGGByf7VO",
  nextAction: "fldrIyFBxDY9EVswS",
  targetDate: "fldHhLYPae82IABn2",
  progress: "fld2H3CK8lkOnywNs",
  order: "fldLt3tLBaTh4GE1R",
  parent: "fldH5FKttARA0ns6V",
};

type Project = {
  id: string;
  name: string;
  status: string;
  priority: string;
  horizon: string;
  areas: string[];
  purpose?: string;
  current?: string;
  nextAction?: string;
  targetDate?: string;
  progress?: number | null;
  order: number;
  parentIds?: string[];
};

const snapshot: Project[] = [
  { id: "recOcNfRACB7dhMvB", name: "Tablero central — Proyectos activos", status: "Activo", priority: "Crítica", horizon: "Hoy", areas: ["Web / Producto", "Programación", "Operaciones"], current: "V1 iniciada: Airtable ya tiene una entidad Proyectos y la web tiene acceso desde la navegación principal. Falta convertir esta pantalla en cockpit visual conectado en vivo.", nextAction: "Resolver sincronización web ↔ Airtable y evolucionar la visualización.", order: 1 },
  { id: "rec7aIDOrXab4Nii1", name: "Tango Rave / Show Bernardo de Irigoyen — 29/08", status: "Activo", priority: "Crítica", horizon: "Mes", areas: ["Shows", "Música", "Operaciones"], current: "Show confirmado. Stack electrónico validado con Casiotone, Keyland, VCV Rack y Hercules; estructura dramatúrgica y guía mobile en desarrollo.", nextAction: "Compartir avances con la banda, integrar al ensayo y cerrar técnica, formación, logística y audiovisual.", targetDate: "2026-08-29", order: 2 },
  { id: "recFHLH41XGCj4KRq", name: "Festa das Nações — Foz — 15/08", status: "Activo", priority: "Crítica", horizon: "Semana", areas: ["Shows", "Operaciones"], current: "Show benéfico confirmado para el sábado 15/08 a las 17:00 con Pablo Cieslik y Evayan Behr.", nextAction: "Confirmar llegada, duración, repertorio, vestuario, transporte, alimentación y registro audiovisual.", targetDate: "2026-08-15", order: 3 },
  { id: "recfRNJP3MiYGP96E", name: "Toshiba DJ lista para ensayo — 13/08", status: "Activo", priority: "Crítica", horizon: "Semana", areas: ["Programación", "Música", "Operaciones"], current: "Windows XP vuelve a arrancar. Objetivo: dos pistas, Hercules y un banco pequeño de samples.", nextAction: "Probar mouse, instalar VirtualDJ legacy y driver Hercules; luego probar dos pistas y samples.", targetDate: "2026-08-13", order: 4 },
  { id: "rec8SGHHKmKRGc38j", name: "Producto estrella — saxo + dupla de tango", status: "Activo", priority: "Alta", horizon: "Semana", areas: ["Shows", "Música", "Comercial"], current: "Dos clientes recientes recorrieron casi el mismo patrón de compra; hay una señal comercial real para potenciar el formato.", nextAction: "Diseñar una primera hipótesis y probarla en vivo; usar el 13/08 o el Hotel Wish del 23/08 como laboratorio.", order: 5 },
  { id: "rec2m3veriL9wUGEI", name: "Startup Ø UnderTango — Élitros y arquitectura digital", status: "Activo", priority: "Alta", horizon: "Semana", areas: ["Web / Producto", "Programación", "Operaciones"], current: "La estrategia evolucionó hacia una plataforma/marca que estandariza y replica la resolución de producciones artísticas. Falta cerrar equipo y responsabilidades.", nextAction: "Antes del 18/08, contactar a Maxi y Giuliano, cerrar participación real y asignar responsabilidades.", targetDate: "2026-08-18", order: 6 },
  { id: "reciNIqJ3gAnZP8m0", name: "Clase grupo nórdico — 21/08", status: "Activo", priority: "Alta", horizon: "Mes", areas: ["Operaciones"], current: "Horario objetivo 17:00–18:00; tarifa R$70 por persona; grupo esperado 15–30. Evayan es candidata principal.", nextAction: "Confirmar con Jacó horario, cantidad final, lugar y pago; luego confirmar disponibilidad de Evayan.", targetDate: "2026-08-21", order: 7 },
  { id: "recDowRUVjJalhoVk", name: "Show Hotel Wish — Foz — 23/08", status: "Activo", priority: "Alta", horizon: "Mes", areas: ["Shows", "Operaciones"], current: "Evento confirmado por R$1.500, aproximadamente 20 minutos / 4 músicas. Falta definir bailarina reemplazante.", nextAction: "Definir bailarina reemplazante y cerrar llegada y logística final con Hotel Wish.", targetDate: "2026-08-23", order: 8 },
  { id: "recz4J7txlRHMQG3S", name: "Electrotango + cantante + cuarteto — noviembre", status: "Activo", priority: "Alta", horizon: "Trimestre", areas: ["Música", "Investigación"], current: "Gladys Fattore confirmó que va a cantar. Primer tema confirmado para arreglo de cuarteto: Corazones al sur.", nextAction: "Coordinar repertorio y tonalidades; preparar Corazones al sur y cerrar de tres a cinco piezas.", order: 9 },
  { id: "recPgnXJgXwmnXhT1", name: "Presencia digital y reputación pública", status: "Activo", priority: "Media", horizon: "Mes", areas: ["Web / Producto", "Comunicación"], current: "Existe legitimidad y trayectoria pública, pero conviven capas históricas y una identidad fragmentada.", nextAction: "Construir la ficha canónica de entidad y clasificar activos como mantener, actualizar, redirigir o retirar.", order: 10 },
  { id: "recrtKb53WSaugPvS", name: "Peña Los Amigos — banda en vivo — septiembre", status: "Activo", priority: "Media", horizon: "Mes", areas: ["Shows", "Música", "Comercial"], current: "Oportunidad en evaluación vía Sergio Peralta. Formación propuesta de cinco músicos y referencia inicial de ARS 500.000.", nextAction: "Esperar devolución sobre interés, presupuesto y fecha; continuar desarrollando repertorio.", order: 11 },
  { id: "recCnjJqu7UvPYTyB", name: "Sistema Bajo Fuego — red internacional de artistas", status: "Activo", priority: "Media", horizon: "Mes", areas: ["Música", "Investigación", "Operaciones"], current: "Red en fase exploratoria; UnderTango está mapeando participantes, deseos y proyectos viables.", nextAction: "Construir mapa liviano de participantes, países, disciplinas e intereses; detectar uno o dos proyectos realizables.", order: 12 },
];

function normalize(record: any): Project {
  const f = record.fields || {};
  return {
    id: record.id,
    name: f[F.name] || "Proyecto sin nombre",
    status: f[F.status] || "Activo",
    priority: f[F.priority] || "Media",
    horizon: f[F.horizon] || "Mes",
    areas: Array.isArray(f[F.areas]) ? f[F.areas] : [],
    purpose: f[F.purpose] || "",
    current: f[F.current] || "",
    nextAction: f[F.nextAction] || "",
    targetDate: f[F.targetDate] || "",
    progress: typeof f[F.progress] === "number" ? f[F.progress] : null,
    order: typeof f[F.order] === "number" ? f[F.order] : 9999,
    parentIds: Array.isArray(f[F.parent]) ? f[F.parent] : [],
  };
}

async function readAirtable(): Promise<Project[]> {
  if (!AIRTABLE_TOKEN) throw new Error("AIRTABLE_TOKEN missing");

  const all: any[] = [];
  let offset = "";

  do {
    const qs = new URLSearchParams({ pageSize: "100", returnFieldsByFieldId: "true" });
    if (offset) qs.set("offset", offset);
    const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${qs.toString()}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Airtable responded ${response.status}`);
    }

    const data = await response.json();
    all.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return all
    .map(normalize)
    .filter((project) => !["Completado", "Archivado"].includes(project.status))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function GET() {
  try {
    const projects = await readAirtable();
    return NextResponse.json(
      { projects, source: "airtable", live: true, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.warn("Projects API is using the Airtable snapshot fallback:", error);
    return NextResponse.json(
      { projects: snapshot, source: "snapshot", live: false, updatedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
