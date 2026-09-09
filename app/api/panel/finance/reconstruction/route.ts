import { NextResponse } from "next/server";
import { authorize, PanelError } from "../../../../../src/lib/panel-server";
import { readOperationsSnapshot } from "../../../../../src/lib/panel-operations";
import { F } from "../../../../../src/lib/panel-model";
import { readFinanceSnapshot } from "../../../../../src/lib/finance-server";
import { buildFinanceReport } from "../../../../../src/lib/finance-report";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", Vary: "Authorization, Cookie" };

export async function GET(request: Request) {
  try {
    await authorize(request);
    if (process.env.VERCEL_ENV === "preview" || process.env.PANEL_DATA_SOURCE !== "supabase") {
      throw new PanelError("El informe está disponible en el panel de producción.", 409);
    }
    const [snapshot, finance] = await Promise.all([readOperationsSnapshot(), readFinanceSnapshot()]);
    const task = snapshot.tasks.find(row => row.id === "recF3AXDHq0OoABoa");
    if (!task || typeof task.fields[F.tasks.result] !== "string" || !task.fields[F.tasks.result].trim()) {
      throw new PanelError("Todavía no hay un informe registrado.", 404);
    }
    return NextResponse.json({
      title: task.fields[F.tasks.name],
      status: task.fields[F.tasks.status],
      result: task.fields[F.tasks.result].replace(/\\n/g, "\n"),
      dashboard: buildFinanceReport(finance),
    }, { headers });
  } catch (error) {
    return NextResponse.json({ error: error instanceof PanelError ? error.message : "No se pudo consultar el informe financiero." },
      { status: error instanceof PanelError ? error.status : 503, headers });
  }
}
