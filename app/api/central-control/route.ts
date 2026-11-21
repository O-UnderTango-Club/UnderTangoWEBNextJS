import { NextResponse } from "next/server";
import { authorize, PanelError, responseBoard, snapshot } from "../../../src/lib/panel-server";
import { operationsConfig } from "../../../src/lib/panel-operations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", Vary: "Cookie, Authorization" };

export async function GET(request: Request) {
  try {
    await authorize(request);
    const data = await snapshot(true);
    if (!("source" in data) || data.source !== "supabase") throw new PanelError("La central necesita la conexi�n operativa de Supabase.", 503);
    const { url, key } = operationsConfig();
    const response = await fetch(`${url}/rest/v1/rpc/ut_control_departments_v1`, {
      method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: "{}",
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new PanelError("No se pudieron actualizar los departamentos. Volv� a intentar.", 503);
    const assignments: unknown = await response.json();
    if (!Array.isArray(assignments) || assignments.some(x => !x || typeof x.id !== "string" || (x.department !== null && (typeof x.department !== "string" || !/^8\d$/.test(x.department))))) throw new PanelError("La lectura de departamentos est� incompleta.", 503);
    const board = responseBoard(data);
    return NextResponse.json({ tasks: board.tasks, fronts: board.fronts, updatedAt: board.updatedAt, assignments }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof PanelError ? error.message : "No se pudo conectar con la central." }, { status: error instanceof PanelError ? error.status : 503, headers });
  }
}

