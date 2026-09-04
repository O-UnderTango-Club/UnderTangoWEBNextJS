export function isAcademiaHost(host: string) {
  return host.split(":")[0].toLowerCase() === "83.undertangoclub.com";
}

export function isAcademiaPath(path: string) {
  return path === "/academia" || path.startsWith("/academia/");
}

export function academiaRewrite(host: string, path: string): string | null {
  if (!isAcademiaHost(host)) return null;
  if (path === "/favicon.ico") return "/academia-icon.svg";
  if (path === "/academia-icon.svg" || path.startsWith("/assets/") || path.startsWith("/_next/") || path.startsWith("/api/") || isAcademiaPath(path)) return null;
  return path === "/" ? "/academia" : `/academia${path}`;
}
