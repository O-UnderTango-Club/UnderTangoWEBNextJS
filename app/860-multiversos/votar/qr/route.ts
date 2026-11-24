import makeQR from "qrcode-generator";

export function GET(request: Request) {
  const url = new URL(request.url);
  const session = url.searchParams.get("s") || "";
  if (!/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(session)) {
    return new Response("La sesión no es válida.", { status: 400 });
  }
  const join = new URL("/860-multiversos/votar", url.origin);
  join.searchParams.set("s", session);
  const code = makeQR(0, "M");
  code.addData(join.href);
  code.make();
  const svg = code.createSvgTag({cellSize: 6, margin: 24, scalable: true});
  return new Response(svg, { headers: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff",
  } });
}
