import { NextResponse } from "next/server";
import { DEVICE_COOKIE, DEVICE_MAX_AGE, issueDevice, sameOrigin, validBootstrap } from "../../../../src/lib/panel-access";
import { bootstrapGrants } from "../../../../src/lib/panel-bootstrap";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const headers = { "Cache-Control": "private, no-store, max-age=0", "X-Robots-Tag": "noindex, nofollow", Vary: "Cookie" };
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403, headers });
  try {
    const body = await request.text();
    if (body.length > 1024 || !validBootstrap(JSON.parse(body).token, bootstrapGrants)) {
      return NextResponse.json({ error: "Esta habilitación no está disponible o venció." }, { status: 401, headers });
    }
    const response = NextResponse.json({ ok: true }, { headers });
    response.cookies.set(DEVICE_COOKIE, issueDevice(), { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: DEVICE_MAX_AGE });
    return response;
  } catch {
    return NextResponse.json({ error: "No se pudo habilitar este navegador." }, { status: 400, headers });
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Solicitud no permitida." }, { status: 403, headers });
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set(DEVICE_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
