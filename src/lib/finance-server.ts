// Server-only adapter. Never import this module from a client component.
import { operationsConfig } from "./panel-operations";
import { financePreviewConfig } from "./finance-preview";
import { FINANCE_FIELDS, amountInput, isObject, parseFinanceSnapshot, validFinanceDate,
  type FinanceCell, type FinanceSnapshot, type FinanceChange, type FinanceReceipt } from "./finance-model";

export class FinanceError extends Error {
  constructor(message: string, public status = 503, public code = "unavailable", public uncertain = false) { super(message); }
}
export type { FinanceChange, FinanceReceipt } from "./finance-model";
type Options = { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const revisionPattern = /^(0|[1-9]\d*)$/;
function selected(env: NodeJS.ProcessEnv) {
  // Every private RPC, including receipt lookup, stays unavailable to previews.
  if (env.VERCEL_ENV === "preview") throw new FinanceError("Esta publicación de prueba es de solo lectura. Las operaciones reales siguen en el sistema vigente.",409,"preview");
  if (env.PANEL_DATA_SOURCE !== "supabase") throw new FinanceError("Finanzas todavía no está habilitado en Supabase. Seguí registrando en Airtable.",409,"inactive");
  try { return operationsConfig(env); }
  catch { throw new FinanceError("Falta verificar la conexión privada al Supabase operativo."); }
}
function inputError(message: string): never { throw new FinanceError(message,400,"invalid"); }
function keys(value: Record<string,unknown>, allowed: string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) inputError("El cambio contiene una propiedad no permitida.");
}
export function validateFinanceChange(value: unknown): FinanceChange {
  if (!isObject(value) || JSON.stringify(value).length > 150000) inputError("Cambio financiero inválido o demasiado largo.");
  keys(value,["record","balances","balanceReason","duplicateReason"]);
  const record = value.record;
  if (!isObject(record)) inputError("Falta el registro financiero.");
  keys(record,["table","id","create","fields"]);
  if (record.table !== "obligations" && record.table !== "movements") inputError("Tabla financiera desconocida.");
  const table = record.table;
  if (typeof record.create !== "boolean" || (record.create ? record.id != null : typeof record.id !== "string" || !record.id || record.id.length > 80)) inputError("Identificador de registro inválido.");
  if (!isObject(record.fields) || !Object.keys(record.fields).length) inputError("No hay campos para guardar.");
  const metadata = Object.values(FINANCE_FIELDS[table]);
  const fields: Record<string,FinanceCell> = {};
  for (const [id,cell] of Object.entries(record.fields)) {
    const field = metadata.find(f => f.id === id);
    if (!field || field.readOnly) inputError("Ese campo no se edita desde este formulario.");
    if (field.type === "links") {
      if (!Array.isArray(cell) || cell.length > 30 || cell.some(v => typeof v !== "string" || !v || v.length > 80) || new Set(cell).size !== cell.length) inputError(`Revisá los vínculos de ${field.label}.`);
      fields[id] = [...cell];
    } else if (field.type === "amount") {
      try { fields[id] = amountInput(cell); } catch (error) { inputError(error instanceof Error ? error.message : "Importe inválido."); }
    } else {
      if (cell !== null && (typeof cell !== "string" || cell.length > 20000)) inputError(`Valor inválido en ${field.label}.`);
      if (typeof cell === "string" && field.type === "date" && !validFinanceDate(cell)) inputError(`Revisá la fecha de ${field.label}.`);
      if (typeof cell === "string" && field.type === "select" && !field.choices?.includes(cell)) inputError(`Revisá la opción de ${field.label}.`);
      fields[id] = cell;
    }
  }
  const change: FinanceChange = { record: { table,id:typeof record.id === "string" ? record.id : null,create:record.create,fields } };
  for (const name of ["balanceReason","duplicateReason"] as const) {
    if (value[name] === undefined) continue;
    const reason = value[name];
    if (typeof reason !== "string" || reason.trim().length < (name === "duplicateReason" ? 12 : 5) || reason.length > 1000) inputError("Explicá brevemente el motivo de esta operación.");
    change[name] = reason;
  }
  if (value.balances !== undefined) {
    if (!Array.isArray(value.balances) || value.balances.length > 30) inputError("Lista de saldos inválida.");
    const ids = new Set<string>();
    change.balances = value.balances.map(b => {
      if (!isObject(b)) inputError("Saldo inválido.");
      keys(b,["id","oldBalance","newBalance","state"]);
      if (typeof b.id !== "string" || !b.id || b.id.length > 80 || ids.has(b.id)) inputError("Hay una obligación duplicada o inválida.");
      if (typeof b.state !== "string" || !FINANCE_FIELDS.obligations.status.choices!.includes(b.state)) inputError("Revisá el estado de la obligación.");
      ids.add(b.id);
      let oldBalance: string | null, newBalance: string | null;
      try { oldBalance = amountInput(b.oldBalance); newBalance = amountInput(b.newBalance); }
      catch { inputError("Revisá el saldo anterior y el saldo nuevo de cada obligación."); }
      return { id:b.id,oldBalance,newBalance,state:b.state };
    });
    if (change.balances.length && (table !== "movements" || !change.balanceReason)) inputError("Los saldos requieren un movimiento y una explicación de la distribución.");
  }
  return change;
}

function previewSelected(env: NodeJS.ProcessEnv) {
  try { return financePreviewConfig(env); }
  catch { throw new FinanceError("El acceso financiero de prueba falta o venció. No se usa la conexión de producción.",409,"preview"); }
}
async function rpc(name: "ut_finance_snapshot_v1" | "ut_finance_commit_v1" | "ut_finance_receipt_v1" | "ut_finance_preview_v1", body: Record<string,unknown>, options: Options) {
  const {url,key} = name === "ut_finance_preview_v1" ? previewSelected(options.env || process.env) : selected(options.env || process.env);
  const isWrite = name === "ut_finance_commit_v1";
  let response: Response;
  try {
    response = await (options.fetcher || fetch)(`${url}/rest/v1/rpc/${name}`,{
      method:"POST",headers:{apikey:key,"Content-Type":"application/json"},body:JSON.stringify(body),
      cache:"no-store",redirect:"error",signal:AbortSignal.timeout(20000),
    });
  } catch {
    throw new FinanceError(isWrite ? "No se pudo confirmar el guardado. Conservá el formulario y reintentá el mismo envío; no crees otro." : "No se pudo verificar la lectura financiera. Volvé a actualizar.",503,"connection",isWrite);
  }
  if (!response.ok) {
    let upstream: unknown; try { upstream = await response.json(); } catch { upstream = null; }
    if (response.status === 409) {
      const duplicate = isObject(upstream) && upstream.message === "Possible duplicate: review the existing record before creating another";
      throw new FinanceError(duplicate ? "Encontré una posible operación duplicada. Buscá el registro existente; creá otro solo si es una operación distinta." : "Los datos cambiaron o este identificador ya se utilizó. Actualizá y revisá antes de guardar.",409,duplicate ? "duplicate" : "conflict");
    }
    if (response.status === 400 && isObject(upstream) && ["22023","22007","22008","23503"].includes(String(upstream.code))) {
      throw new FinanceError("No se guardó el cambio. Revisá los datos obligatorios, importes, fechas y vínculos.",400,"invalid");
    }
    // No database error text, secrets, raw values, or fallback to another backend.
    throw new FinanceError(isWrite ? "No se pudo confirmar el cambio completo. Conservá este envío para reintentarlo sin duplicarlo." : "Supabase no pudo completar la lectura financiera privada.",503,"upstream",isWrite);
  }
  try { return await response.json() as unknown; }
  catch { throw new FinanceError("La respuesta no pudo verificarse. Si estabas guardando, reintentá el mismo envío.",503,"invalid_response",isWrite); }
}
function receipt(value: unknown, requestId: string): FinanceReceipt {
  if (!isObject(value) || value.ok !== true || value.requestId !== requestId || typeof value.id !== "string" || !value.id
    || !Array.isArray(value.ids) || value.ids[0] !== value.id || value.ids.some(id => typeof id !== "string" || !id)
    || new Set(value.ids).size !== value.ids.length || typeof value.revision !== "string" || !revisionPattern.test(value.revision)
    || !Number.isInteger(value.balanceUpdates) || (value.balanceUpdates as number) < 0 || (value.balanceUpdates as number) > 30
    || value.ids.length !== (value.balanceUpdates as number) + 1
    || typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt))) {
    throw new FinanceError("No se pudo verificar el comprobante. Reintentá el mismo envío para recuperarlo.",503,"invalid_receipt",true);
  }
  return value as FinanceReceipt;
}
export async function readFinanceSnapshot(options: Options = {}): Promise<FinanceSnapshot & {readOnly:boolean}> {
  const env = options.env || process.env;
  const readOnly = env.VERCEL_ENV === "preview";
  const value = readOnly
    ? await rpc("ut_finance_preview_v1",{p_token:previewSelected(env).readToken},options)
    : await rpc("ut_finance_snapshot_v1",{},options);
  try { return {...parseFinanceSnapshot(value,readOnly),readOnly}; }
  catch { throw new FinanceError("La base financiera todavía no está activa o devolvió una lectura incompleta. No se muestran datos antiguos."); }
}
function identity(requestId: unknown, actor: string) {
  if (typeof requestId !== "string" || !uuid.test(requestId) || !actor || actor.trim().length > 320) inputError("Falta identificar correctamente este envío.");
  return requestId;
}
export async function financeReceipt(requestId: string, actor: string, change: unknown, options: Options = {}) {
  identity(requestId,actor);
  const value = await rpc("ut_finance_receipt_v1",{p_request_id:requestId,p_actor:actor,p_change:validateFinanceChange(change)},options);
  return value === null ? null : receipt(value,requestId);
}
export async function commitFinance(input: unknown, actor: string, options: Options = {}): Promise<FinanceReceipt> {
  if (!isObject(input)) inputError("Envío financiero inválido.");
  keys(input,["requestId","revision","change"]);
  const requestId = identity(input.requestId,actor);
  if (typeof input.revision !== "string" || !revisionPattern.test(input.revision)) inputError("Actualizá los datos antes de guardar.");
  const change = validateFinanceChange(input.change);
  return receipt(await rpc("ut_finance_commit_v1",{p_request_id:requestId,p_actor:actor,p_expected_revision:input.revision,p_change:change},options),requestId);
}
