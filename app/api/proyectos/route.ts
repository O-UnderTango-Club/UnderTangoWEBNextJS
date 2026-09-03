import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const TABLE_ID = process.env.AIRTABLE_PROJECTS_TABLE_ID || "tblf6DZBViGbvxRzS";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EDITOR_EMAILS = new Set(
  (process.env.PROJECT_EDITOR_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

const F = {
  name: "fldChULRkd1GrXY3w",
  status: "fldcypAILEecLnLGQ",
  priority: "fldQEVUFZT4dtDlCD",
  horizon: "fldeDYEI0o78Q6nGB",
  areas: "fldr4SXQDM49FfkJF",
  purpose: "fldrApFZcuzKj3Gax",
  current: "fldvAlTbZGGByf7VO",
  nextMilestone: "fld7AkmdGr0WIHPDl",
  nextAction: "fldrIyFBxDY9EVswS",
  targetDate: "fldHhLYPae82IABn2",
  progress: "fld2H3CK8lkOnywNs",
  order: "fldLt3tLBaTh4GE1R",
  parent: "fldH5FKttARA0ns6V",
};

const OPTIONS = {
  statuses: ["Activo", "En espera", "Bloqueado", "Idea", "Completado", "Archivado"],
  priorities: ["Crítica", "Alta", "Media", "Baja"],
  horizons: ["Hoy", "Semana", "Mes", "Trimestre", "6 meses", "Año"],
  areas: [
    "Shows",
    "Música",
    "Web / Producto",
    "Programación",
    "Comercial",
    "Finanzas",
    "Comunicación",
    "Investigación",
    "Literatura",
    "Operaciones",
  ],
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
  nextMilestone?: string;
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
  { id: "recpyNPbqTH0ZZSAx", name: "Tarot Argentino — repositorio y evolución", status: "Activo", priority: "Media", horizon: "Mes", areas: ["Investigación", "Web / Producto"], current: "Proyecto activo que hasta ahora no estaba representado en el cockpit. Se incorpora para que su continuidad no dependa de la memoria.", nextAction: "Revisar el estado actual del repositorio y definir el próximo hito concreto del proyecto.", order: 13 },
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
    nextMilestone: f[F.nextMilestone] || "",
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
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?${qs.toString()}`, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`Airtable responded ${response.status}`);

    const data = await response.json();
    all.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return all
    .map(normalize)
    .filter((project) => !["Completado", "Archivado"].includes(project.status))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

async function getEditor(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY || EDITOR_EMAILS.size === 0) {
    return { canEdit: false, email: "" };
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user?.email) return { canEdit: false, email: "" };

    const email = data.user.email.toLowerCase();
    return { canEdit: EDITOR_EMAILS.has(email), email };
  } catch {
    return { canEdit: false, email: "" };
  }
}

function text(value: unknown, max = 20000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function buildFields(changes: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};

  if (Object.prototype.hasOwnProperty.call(changes, "name")) {
    const value = text(changes.name, 255);
    if (!value) throw new Error("El proyecto necesita un nombre.");
    fields[F.name] = value;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "status")) {
    if (!OPTIONS.statuses.includes(String(changes.status))) throw new Error("Estado inválido.");
    fields[F.status] = changes.status;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "priority")) {
    if (!OPTIONS.priorities.includes(String(changes.priority))) throw new Error("Prioridad inválida.");
    fields[F.priority] = changes.priority;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "horizon")) {
    if (!OPTIONS.horizons.includes(String(changes.horizon))) throw new Error("Horizonte inválido.");
    fields[F.horizon] = changes.horizon;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "areas")) {
    if (!Array.isArray(changes.areas)) throw new Error("Áreas inválidas.");
    const areas = changes.areas.map(String);
    if (areas.some((area) => !OPTIONS.areas.includes(area))) throw new Error("Área inválida.");
    fields[F.areas] = areas;
  }

  for (const [key, fieldId] of [
    ["purpose", F.purpose],
    ["current", F.current],
    ["nextMilestone", F.nextMilestone],
    ["nextAction", F.nextAction],
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) fields[fieldId] = text(changes[key]);
  }

  if (Object.prototype.hasOwnProperty.call(changes, "targetDate")) {
    const value = changes.targetDate;
    if (value === null || value === "") {
      fields[F.targetDate] = null;
    } else if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      fields[F.targetDate] = value;
    } else {
      throw new Error("Fecha inválida.");
    }
  }

  if (Object.prototype.hasOwnProperty.call(changes, "progress")) {
    const value = Number(changes.progress);
    if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error("Progreso inválido.");
    fields[F.progress] = value;
  }

  if (Object.prototype.hasOwnProperty.call(changes, "order")) {
    const value = Number(changes.order);
    if (!Number.isInteger(value) || value < 0 || value > 100000) throw new Error("Orden inválido.");
    fields[F.order] = value;
  }

  if (Object.keys(fields).length === 0) throw new Error("No hay cambios para guardar.");
  return fields;
}

export async function GET(request: NextRequest) {
  const editor = await getEditor(request);

  try {
    const projects = await readAirtable();
    return NextResponse.json(
      {
        projects,
        source: "airtable",
        live: true,
        canEdit: editor.canEdit,
        editorConfigured: EDITOR_EMAILS.size > 0,
        options: OPTIONS,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.warn("Projects API is using the Airtable snapshot fallback:", error);
    return NextResponse.json(
      {
        projects: snapshot,
        source: "snapshot",
        live: false,
        canEdit: false,
        editorConfigured: EDITOR_EMAILS.size > 0,
        options: OPTIONS,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const editor = await getEditor(request);
  if (!editor.canEdit) {
    return NextResponse.json({ error: "Esta cuenta no tiene permiso para editar proyectos." }, { status: 403 });
  }

  if (!AIRTABLE_TOKEN) {
    return NextResponse.json({ error: "Falta configurar AIRTABLE_TOKEN en el servidor." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    if (!/^rec[A-Za-z0-9]{14}$/.test(id)) {
      return NextResponse.json({ error: "Proyecto inválido." }, { status: 400 });
    }

    const fields = buildFields(body?.changes || {});
    const response = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${id}?returnFieldsByFieldId=true`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: false }),
      cache: "no-store",
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Airtable project update failed:", data);
      return NextResponse.json({ error: "Airtable rechazó la actualización." }, { status: 502 });
    }

    return NextResponse.json({ project: normalize(data), updatedAt: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo guardar el proyecto.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
