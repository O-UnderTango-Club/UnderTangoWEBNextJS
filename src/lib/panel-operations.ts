// Server-side relational adapter. Not activated by credentials or imported rows.
// Keep this module out of client components; keys are server-only environment vars.
import { F, type Raw, type Snapshot } from "./panel-model";

export class OperationsError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
export type OperationsSnapshot = Snapshot & {
  source: "supabase";
  globalRevision: string;
  migrationStatus: "staged" | "validated" | "active";
};
export type OperationsReceipt = { ok: true; id: string; ids: string[]; requestId: string; revision: string; savedAt: string };
export type OperationsPatch = { table: "follow_ups" | "projects" | "trigger_events"; id: string | null; fields: Record<string, unknown>; create: boolean };
export function operationsSelected(env: NodeJS.ProcessEnv = process.env) {
  if (!env.PANEL_DATA_SOURCE || env.PANEL_DATA_SOURCE === "airtable") return false;
  if (env.PANEL_DATA_SOURCE === "supabase") return true;
  throw new OperationsError("La fuente del panel necesita una configuración explícita válida.");
}

const operationalOrigin = "https://lqsnrqnmmeyzcnurfpos.supabase.co";
export function operationsConfig(env: NodeJS.ProcessEnv = process.env) {
  // The Analytics project is deliberately not a fallback.
  const url = env.OPERATIONS_SUPABASE_URL?.replace(/\/$/, "");
  const key = env.OPERATIONS_SUPABASE_SECRET_KEY;
  if (url !== operationalOrigin || !key || !key.startsWith("sb_secret_")) {
    throw new OperationsError("Falta verificar la conexión privada al Supabase operativo.");
  }
  return { url, key };
}

function object(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseOperationsSnapshot(value: unknown, allowStaged = false): OperationsSnapshot {
  const invalid = () => new OperationsError("Supabase devolvió una lectura incompleta. No se muestran datos antiguos.");
  if (!object(value) || value.contract !== 1 || typeof value.revision !== "string" ||
      !/^(0|[1-9]\d*)$/.test(value.revision) ||
      !["staged", "validated", "active"].includes(String(value.status)) ||
      typeof value.updatedAt !== "string" || !Number.isFinite(Date.parse(value.updatedAt))) throw invalid();
  if (!allowStaged && value.status !== "active") {
    throw new OperationsError("El cambio a Supabase todavía no está habilitado. No se cambió la fuente automáticamente.");
  }
  const fields = { projects: F.projects, tasks: F.tasks, events: F.events, cases: F.cases };
  const links = new Set<string>([F.tasks.projects, F.tasks.cases, F.tasks.events, F.tasks.dependencies, F.cases.projects]);
  const numbers = new Set<string>([F.tasks.order, F.projects.rank]);
  const parsed = {} as Record<keyof typeof fields, Raw[]>;
  for (const group of Object.keys(fields) as (keyof typeof fields)[]) {
    const rows = value[group];
    if (!Array.isArray(rows)) throw invalid();
    const ids = new Set<string>();
    const allowed = new Set<string>(Object.values(fields[group]));
    parsed[group] = rows.map(row => {
      if (!object(row) || typeof row.id !== "string" || !row.id || ids.has(row.id) || !object(row.fields)) throw invalid();
      ids.add(row.id);
      for (const [field, cell] of Object.entries(row.fields)) {
        if (!allowed.has(field)) throw invalid();
        if (links.has(field)) {
          if (!Array.isArray(cell) || cell.some(id => typeof id !== "string") || new Set(cell).size !== cell.length) throw invalid();
        } else if (numbers.has(field)) {
          if (typeof cell !== "number" || !Number.isFinite(cell)) throw invalid();
        } else if (typeof cell !== "string") throw invalid();
      }
      return { id: row.id, fields: { ...row.fields } };
    });
  }
  for (const [group, field, target] of [
    ["tasks", F.tasks.projects, "projects"], ["tasks", F.tasks.cases, "cases"],
    ["tasks", F.tasks.events, "events"], ["tasks", F.tasks.dependencies, "tasks"],
    ["cases", F.cases.projects, "projects"],
  ] as const) {
    const targetIds = new Set(parsed[target].map(row => row.id));
    if (parsed[group].some(row => (row.fields[field] || []).some((id: string) => !targetIds.has(id)))) throw invalid();
  }
  return { ...parsed, source: "supabase", globalRevision: value.revision,
    migrationStatus: value.status as OperationsSnapshot["migrationStatus"], updatedAt: value.updatedAt };
}

export async function readOperationsSnapshot(options: {
  allowStaged?: boolean;
  env?: NodeJS.ProcessEnv;
  fetcher?: typeof fetch;
} = {}): Promise<OperationsSnapshot> {
  const { url, key } = operationsConfig(options.env);
  let response: Response;
  try {
    // Modern secret keys go in apikey, never in Authorization: Bearer.
    response = await (options.fetcher || fetch)(`${url}/rest/v1/rpc/ut_panel_snapshot_v1`, {
      method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
      body: "{}", cache: "no-store", signal: AbortSignal.timeout(20000),
      redirect: "error",
    });
  } catch {
    throw new OperationsError("No se pudo confirmar la lectura de Supabase. Actualizá para reintentar.");
  }
  if (!response.ok) throw new OperationsError("Supabase no pudo completar la lectura privada. No se cambió a Airtable.");
  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new OperationsError("La respuesta de Supabase no pudo verificarse."); }
  return parseOperationsSnapshot(payload, options.allowStaged);
}

function parseReceipt(value: unknown): OperationsReceipt {
  if (!object(value) || value.ok !== true || typeof value.id !== "string" || !value.id ||
      !Array.isArray(value.ids) || value.ids[0] !== value.id || value.ids.some(id => typeof id !== "string") ||
      typeof value.requestId !== "string" || typeof value.revision !== "string" || !/^\d+$/.test(value.revision) ||
      typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt))) {
    throw new OperationsError("No se pudo verificar la confirmación del cambio. Reintentá el mismo cambio para recuperar su comprobante.");
  }
  return value as OperationsReceipt;
}

async function changeRpc(name: "ut_panel_receipt_v1" | "ut_panel_commit_v1", body: Record<string, unknown>) {
  const { url, key } = operationsConfig();
  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST",
      headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify(body),
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000) });
  } catch {
    throw new OperationsError("No se pudo confirmar el guardado. Reintentá el mismo cambio: su identificador evita duplicarlo.");
  }
  if (!response.ok) {
    if (response.status === 409) throw new OperationsError("El panel cambió o este intento ya fue utilizado. Actualizá y revisá antes de guardar.", 409);
    // Never return database details, credentials or user-entered values from upstream errors.
    throw new OperationsError("Supabase no pudo confirmar el cambio completo. No se cambió a Airtable; reintentá el mismo cambio para comprobarlo.");
  }
  try { return await response.json(); }
  catch { throw new OperationsError("No se pudo leer el comprobante. Reintentá el mismo cambio para recuperarlo."); }
}

export async function operationsReceipt(requestId: string, actor: string, intent: Record<string, unknown>) {
  const value = await changeRpc("ut_panel_receipt_v1", { p_request_id: requestId, p_actor: actor, p_intent: intent });
  if (value === null) return null;
  const receipt = parseReceipt(value);
  if (receipt.requestId !== requestId) throw new OperationsError("El comprobante no corresponde a este intento.");
  return receipt;
}
export async function commitOperations(requestId: string, actor: string, intent: Record<string, unknown>, expectedRevision: string, patches: OperationsPatch[]) {
  const receipt = parseReceipt(await changeRpc("ut_panel_commit_v1", { p_request_id: requestId, p_actor: actor,
    p_intent: intent, p_expected_revision: expectedRevision, p_patches: patches }));
  if (receipt.requestId !== requestId) throw new OperationsError("El comprobante no corresponde a este intento.");
  return receipt;
}
