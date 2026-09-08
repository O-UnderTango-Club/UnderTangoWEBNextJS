import { NextResponse } from "next/server";
import { sameOrigin } from "../../../../src/lib/panel-access";
import { authorize, PanelError } from "../../../../src/lib/panel-server";
import { commitFinance, FinanceError, readFinanceSnapshot } from "../../../../src/lib/finance-server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;
const headers = { "Cache-Control":"private, no-store, max-age=0", "X-Robots-Tag":"noindex, nofollow", Vary:"Authorization, Cookie" };
function failure(error: unknown) {
  const known = error instanceof FinanceError || error instanceof PanelError;
  return NextResponse.json({ error:known ? error.message : "No se pudo completar la operación financiera.",
    code:error instanceof FinanceError ? error.code : "request", uncertain:error instanceof FinanceError && error.uncertain },
  { status:known ? error.status : 400,headers });
}
export async function GET(request: Request) {
  try {
    const actor = await authorize(request);
    return NextResponse.json({ ...await readFinanceSnapshot(),actor },{headers});
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    if (!sameOrigin(request)) throw new PanelError("Solicitud no permitida.",403);
    const actor = await authorize(request);
    const body = await request.text();
    if (body.length > 150000) throw new PanelError("El cambio es demasiado largo.",413);
    return NextResponse.json(await commitFinance(JSON.parse(body),actor),{headers});
  } catch (error) { return failure(error); }
}
