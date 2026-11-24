import { NextResponse } from "next/server";
import { centralSnapshotTasks, isOpenAction } from "../../../src/lib/central-actions";
import { readControlDepartments } from "../../../src/lib/control-departments";
import { validWeekdays } from "../../../src/lib/panel-model";
import { sameOrigin } from "../../../src/lib/panel-access";
import { authorize, mutate, PanelError, responseBoard, snapshot } from "../../../src/lib/panel-server";
import { operationsConfig, operationsSelected } from "../../../src/lib/panel-operations";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", Vary: "Cookie, Authorization" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const revision = /^[0-9a-f]{64}$/i;
const snapshotRevision = /^(0|[1-9][0-9]*)$/;

function failure(error: unknown) {
  return NextResponse.json(
    { error: error instanceof PanelError ? error.message : "No se pudo confirmar el cambio o la lectura. Volvé a intentar." },
    { status: error instanceof PanelError ? error.status : 503, headers },
  );
}

async function controlRpc(name: "ut_central_latest_v1" | "ut_central_undo_v1", args: Record<string, string>) {
  const { url, key } = operationsConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: key, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(20000),
  });
  if (response.status === 409 && name === "ut_central_undo_v1") {
    throw new PanelError("Ese cambio ya no se puede deshacer porque alguna de las acciones afectadas cambió después.", 409);
  }
  if (!response.ok) throw new PanelError("No se pudo confirmar la operación en Supabase. Volvé a intentar.", 503);
  return response.json();
}

export async function GET(request: Request) {
  try {
    const actor = await authorize(request);
    if (!operationsSelected()) throw new PanelError("La central necesita la conexión operativa de Supabase.", 503);
    const [data, assignments, latestChange] = await Promise.all([
      snapshot(true),
      readControlDepartments(),
      controlRpc("ut_central_latest_v1", { p_actor: actor }),
    ]);
    const board = responseBoard(data);
    if (board.source !== "supabase" || !board.snapshotRevision) throw new PanelError("La central necesita una lectura completa de Supabase.", 503);
    const tasks = centralSnapshotTasks(board.tasks);
    const revisions = Object.fromEntries(tasks.filter(isOpenAction).map(task => [task.id, board.revisions[task.id]]));
    return NextResponse.json({
      tasks, revisions, snapshotRevision: board.snapshotRevision, readOnly: board.readOnly,
      fronts: board.fronts, updatedAt: board.updatedAt, assignments, latestChange,
    }, { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new PanelError("Solicitud no permitida.", 403);
    const actor = await authorize(request);
    if (!operationsSelected() || process.env.VERCEL_ENV === "preview") throw new PanelError("Los cambios se guardan desde la Central de producción.", 409);
    const text = await request.text();
    if (text.length > 1600) throw new PanelError("Solicitud demasiado larga.", 413);
    let input;
    try { input = JSON.parse(text); }
    catch { throw new PanelError("Solicitud inválida."); }
    if (!input || typeof input.requestId !== "string" || !uuid.test(input.requestId)) {
      throw new PanelError("Solicitud inválida.");
    }

    if (input.operation === "undo") {
      if (typeof input.originalId !== "string" || !uuid.test(input.originalId)) throw new PanelError("No hay un cambio para deshacer.");
      const receipt = await controlRpc("ut_central_undo_v1", {
        p_actor: actor, p_request_id: input.requestId, p_original_id: input.originalId,
      });
      return NextResponse.json(receipt, { headers });
    }

    if (!["finish", "doneToday", "weekdays"].includes(input.operation) ||
        typeof input.taskId !== "string" || !input.taskId || input.taskId.length > 150 ||
        typeof input.revision !== "string" || !revision.test(input.revision) ||
        typeof input.snapshotRevision !== "string" || !snapshotRevision.test(input.snapshotRevision)) {
      throw new PanelError("Actualizá la Central antes de guardar.", 409);
    }

    if (input.operation === "weekdays" && !validWeekdays(input.weekdays)) {
      throw new PanelError("Elegí al menos un día de la semana.");
    }
    const changes = input.operation === "weekdays" ? { weekdays: input.weekdays } : input.operation === "finish"
      ? { stage: "done", evidence: "Finalización confirmada desde la Central de control." }
      : { doneToday: true };
    const receipt = await mutate({
      kind: "task", origin: "central-control", centralAction: input.operation,
      id: input.taskId, revision: input.revision, snapshotRevision: input.snapshotRevision,
      requestId: input.requestId, changes,
    }, actor);
    return NextResponse.json(receipt, { headers });
  } catch (error) {
    return failure(error);
  }
}
