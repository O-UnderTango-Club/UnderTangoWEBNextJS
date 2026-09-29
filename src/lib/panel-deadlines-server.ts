import { operationsConfig, operationsSelected, OperationsError } from "./panel-operations";
import { parseDeadlines, type DeadlineSnapshot } from "./panel-deadlines";

export async function readDeadlines(options: { env?: NodeJS.ProcessEnv; fetcher?: typeof fetch } = {}): Promise<DeadlineSnapshot> {
  if (!operationsSelected(options.env)) throw new OperationsError("La agenda requiere Supabase como fuente canónica.");
  const { url, key } = operationsConfig(options.env);
  let response: Response;
  try {
    response = await (options.fetcher || fetch)(url + "/rest/v1/rpc/ut_panel_deadlines_v1", {
      method:"POST", headers:{ apikey:key, "Content-Type":"application/json" }, body:"{}",
      cache:"no-store", redirect:"error", signal:AbortSignal.timeout(20000),
    });
  } catch { throw new OperationsError("No se pudo leer la agenda. Volvé a actualizar."); }
  if (!response.ok) throw new OperationsError("Supabase no pudo completar la lectura de la agenda.");
  try { return parseDeadlines(await response.json()); }
  catch { throw new OperationsError("No se pudo verificar la agenda de Supabase."); }
}

