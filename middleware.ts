import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();
  const pathname = request.nextUrl.pathname;

  if (!hostname.startsWith("aprende.")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/aprende")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = pathname === "/" ? "/aprende" : `/aprende${pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
