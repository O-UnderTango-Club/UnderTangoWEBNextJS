import { NextRequest, NextResponse } from "next/server";
import { academiaRewrite, isAcademiaHost } from "./src/lib/academia-routing";

const APRENDE_GUIDE_PATH = "/APRENDE_7_paginas_para_recordar_mejor.pdf";
const APRENDE_ICON_PATH = "/aprende/icon.svg";

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (pathname === "/panel-de-control" || pathname.startsWith("/panel-de-control/")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "") + "; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
    return response;
  }

  if (hostname === "rave.undertangoclub.com") {
    if (pathname === "/rave" || pathname.startsWith("/rave/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(5) || "/";
      return NextResponse.redirect(url);
    }
    if (pathname === "/" || pathname === "/tango-rave" || pathname === "/pena-rave") {
      const url = request.nextUrl.clone();
      url.pathname = pathname === "/" ? "/rave" : `/rave${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (isAcademiaHost(hostname)) {
    const destination = academiaRewrite(hostname, pathname);
    if (!destination) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = destination;
    return NextResponse.rewrite(url);
  }

  // ELITROS is a public experiment that lives inside the UnderTango codebase.
  // The subdomain keeps clean public URLs while reusing the same deployment.
  if (hostname.startsWith("elitros.")) {
    // Operación viva belongs to the main UnderTango site. Links from the
    // ELITROS subdomain must not be rewritten to /elitros/operacion.
    if (pathname === "/operacion" || pathname.startsWith("/operacion/")) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.hostname = "undertangoclub.com";
      url.port = "";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/elitros")) {
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/elitros" : `/elitros${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (!hostname.startsWith("aprende.")) {
    return NextResponse.next();
  }

  // The main site keeps its original favicon. Only the APRENDE subdomain
  // rewrites the conventional /favicon.ico request to the APRENDE icon.
  if (pathname === "/favicon.ico") {
    const url = request.nextUrl.clone();
    url.pathname = APRENDE_ICON_PATH;
    return NextResponse.rewrite(url);
  }

  // Keep the public PDF reachable from the APRENDE subdomain.
  if (pathname === APRENDE_GUIDE_PATH) {
    return NextResponse.next();
  }

  // The landing currently links to /aprende/guia. On the APRENDE subdomain,
  // serve the final static PDF directly so the download cannot fall through to 404.
  if (pathname === "/aprende/guia") {
    const url = request.nextUrl.clone();
    url.pathname = APRENDE_GUIDE_PATH;
    return NextResponse.rewrite(url);
  }

  if (pathname.startsWith("/aprende")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/aprende" : `/aprende${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image).*)"],
};
