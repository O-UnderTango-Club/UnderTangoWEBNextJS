import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const DEVICE_COOKIE = "__Host-ut-panel";
export const DEVICE_MAX_AGE = 90 * 24 * 60 * 60;
const OWNER = "pablocieslik@gmail.com";
type Grant = { hash: string; expiresAt: number };

function signingKey() {
  const secret = process.env.AIRTABLE_PANEL_TOKEN;
  if (!secret) throw new Error("Falta configurar el acceso del panel.");
  // Dedicated domain: the Airtable credential itself never becomes a browser credential.
  return createHmac("sha256", secret).update("undertango/panel/device-session/v1").digest();
}
function signature(value: string) {
  return createHmac("sha256", signingKey()).update(value).digest("base64url");
}
function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
export function issueDevice(now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ v: 1, sub: OWNER, iat: now, exp: now + DEVICE_MAX_AGE * 1000, id: randomBytes(16).toString("hex") })).toString("base64url");
  return `${payload}.${signature(payload)}`;
}
export function verifyDevice(value: string, now = Date.now()): string | null {
  if (!value || value.length > 2048) return null;
  try {
    const parts = value.split(".");
    if (parts.length !== 2 || !equal(parts[1], signature(parts[0]))) return null;
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
    if (payload.v !== 1 || payload.sub !== OWNER || !Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp) || payload.iat > now || payload.exp <= now || payload.exp - payload.iat !== DEVICE_MAX_AGE * 1000) return null;
    return OWNER;
  } catch { return null; }
}
export function deviceActor(request: Request) {
  const cookie = (request.headers.get("cookie") || "").split(";").map(v => v.trim()).find(v => v.startsWith(`${DEVICE_COOKIE}=`));
  return cookie ? verifyDevice(cookie.slice(DEVICE_COOKIE.length + 1)) : null;
}
export function validBootstrap(token: unknown, grants: readonly Grant[], now = Date.now()) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return false;
  const hash = createHash("sha256").update(token).digest("hex");
  return grants.some(grant => now < grant.expiresAt && equal(hash, grant.hash));
}
export function sameOrigin(request: Request) {
  return request.headers.get("origin") === new URL(request.url).origin && request.headers.get("content-type")?.split(";")[0].trim() === "application/json";
}
