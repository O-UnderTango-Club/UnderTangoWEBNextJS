import { NextResponse } from "next/server";
import { authorize, PanelError, mutate, responseBoard, snapshot } from "../../../src/lib/panel-server";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=60;
const headers={"Cache-Control":"private, no-store, max-age=0","X-Robots-Tag":"noindex, nofollow",Vary:"Authorization"};
function failure(error:unknown) {
  return NextResponse.json({error:error instanceof PanelError?error.message:error instanceof Error&&error.name==="Error"?error.message:"No se pudo completar la operación."},{status:error instanceof PanelError?error.status:400,headers});
}
export async function GET(request: Request) {
  try{await authorize(request);return NextResponse.json(responseBoard(await snapshot(new URL(request.url).searchParams.get("refresh")==="1")),{headers});}catch(error){return failure(error);}
}
export async function POST(request: Request) {
  try{
    const actor=await authorize(request);
    const body=await request.text();if(body.length>15000)throw new PanelError("El cambio es demasiado largo.",413);
    return NextResponse.json(await mutate(JSON.parse(body),actor),{headers});
  }catch(error){return failure(error);}
}
