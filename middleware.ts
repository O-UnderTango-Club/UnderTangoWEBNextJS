import { NextRequest, NextResponse } from "next/server";

const APRENDE_GUIDE_PATH = "/APRENDE_7_paginas_para_recordar_mejor.pdf";
const APRENDE_ICON_PATH = "/aprende/icon.svg";

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  const pathname = request.nextUrl.pathname;

  // ELITROS is a public experiment that lives inside the UnderTango codebase.
  // The subdomain keeps clean public URLs while reusing the same deployment.
  if (hostname.startsWith("elitros.")) {
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
