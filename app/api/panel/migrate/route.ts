import { NextResponse } from "next/server";
import { authorize, migratePanelToSupabase, PanelError } from "../../../../src/lib/panel-server";
import { sameOrigin } from "../../../../src/lib/panel-access";
export const runtime="nodejs"; export const maxDuration=60;
export async function POST(request:Request){try{if(!sameOrigin(request))throw new PanelError("Solicitud no permitida.",403);await authorize(request);return NextResponse.json(await migratePanelToSupabase(),{headers:{"Cache-Control":"private, no-store","X-Robots-Tag":"noindex, nofollow"}});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo migrar."},{status:error instanceof PanelError?error.status:400});}}
