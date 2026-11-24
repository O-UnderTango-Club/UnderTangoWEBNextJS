import { createHash, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const cookieName = "ut860_publico";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);
const scenes = [92, 96, 100];
const colors = ["azul", "ambar", "violeta"];
const sounds = ["aire", "campana", "agua"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

type Payload = Record<string, unknown>;

async function respond(request: NextRequest, body: Payload) {
  const cookie = request.cookies.get(cookieName)?.value;
  const voter = validId(cookie) ? cookie : randomUUID();
  function json(value: unknown, status = 200) {
    const result = NextResponse.json(value, {status, headers: {"Cache-Control":"private, no-store"}});
    if (voter !== cookie) result.cookies.set(cookieName, voter, {
      httpOnly:true, sameSite:"lax", secure:request.nextUrl.protocol === "https:",
      path:"/api/860-votos", maxAge:86400,
    });
    return result;
  }

  const {action} = body;
  if (typeof action !== "string" || !["create","state","open","close","vote"].includes(action)) return json({error:"Acción desconocida."},400);
  const session = action === "create" && body.session === undefined ? randomUUID() : body.session;
  if (!validId(session)) return json({error:"Identificador de función inválido."},400);
  const hostToken = action === "create" && body.hostToken === undefined ? randomUUID() : body.hostToken;
  if (["create","open","close"].includes(action) && !validId(hostToken)) return json({error:"Falta el permiso de conducción."},403);
  const {scene, duration, color, sound} = body;
  if (["open","close","vote"].includes(action) && (typeof scene !== "number" || !scenes.includes(scene))) return json({error:"Ronda inválida."},400);
  if (action === "open" && (typeof duration !== "number" || !Number.isInteger(duration) || duration<1 || duration>120)) return json({error:"Duración inválida."},400);
  if (action === "vote") {
    if (typeof color !== "string" || !colors.includes(color) || typeof sound !== "string" || !sounds.includes(sound)) return json({error:"Elegí un color y un sonido."},400);
    if (!validId(cookie)) return json({error:"Actualizá la votación para habilitar este navegador."},428);
  }
  const url = process.env.ANALYTICS_SUPABASE_URL;
  const secret = process.env.ANALYTICS_SUPABASE_SECRET_KEY;
  if (!url || !secret) return json({error:"La votación todavía no está disponible."},503);
  try {
    const headers: Record<string,string> = {"Content-Type":"application/json", apikey:secret};
    if (secret.startsWith("eyJ")) headers.Authorization = "Bearer "+secret;
    const upstream = await fetch(new URL("/rest/v1/rpc/ut_860_poll",url), {
      method:"POST", cache:"no-store", signal:AbortSignal.timeout(6500), headers,
      body:JSON.stringify({p_action:action,p_session:session,
        p_voter:hash(session+":"+voter),p_host:validId(hostToken)?hash(hostToken):null,
        p_scene:scene??null,p_duration:duration??null,p_color:color??null,p_sound:sound??null}),
    });
    if (!upstream.ok) {
      const {code} = await upstream.json();
      if (code==="PT404") return json({error:"La función no está disponible."},404);
      if (code==="PT403") return json({error:"Sólo el puesto de conducción puede cambiar la ronda."},403);
      if (code==="PT409") return json({error:"Esta ronda ya terminó o cambió de escena."},409);
      return json({error:"No se pudo contactar la votación."},503);
    }
    const state = await upstream.json();
    return json(action === "create" ? {session,hostToken} : state);
  } catch { return json({error:"No se pudo contactar la votación."},503); }
}

export async function GET(request: NextRequest) {
  return respond(request,{action:"state",session:request.nextUrl.searchParams.get("session")});
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({error:"Origen inválido."},{status:403});
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return NextResponse.json({error:"Se requiere JSON."},{status:415});
  if (Number(request.headers.get("content-length"))>2048) return NextResponse.json({error:"Solicitud demasiado grande."},{status:413});
  try {
    const text = await request.text();
    if (text.length>2048) return NextResponse.json({error:"Solicitud demasiado grande."},{status:413});
    const body = JSON.parse(text);
    if (!body || Array.isArray(body) || typeof body !== "object") throw new Error();
    return respond(request,body);
  } catch { return NextResponse.json({error:"Solicitud inválida."},{status:400}); }
}
