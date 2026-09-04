// Server-only: imported by the two analytics route handlers, never by a component.
type Source = "undertango" | "aprende";

const events: Record<Source, Set<string>> = {
  undertango: new Set(["page_view", "intent_click", "subintent_click", "whatsapp_click"]),
  aprende: new Set(["page_view", "download_click", "form_click", "whatsapp_click", "profile_submit", "offer_sent", "payment"]),
};
const intents = new Set(["ver_tango", "aprender_tango", "contratar_show"]);
const clean = (value: unknown, max: number) => typeof value === "string" ? value.trim().slice(0, max) : "";
const reply = (status: number, error?: string) => Response.json(
  error ? { ok: false, error } : { ok: status === 200 },
  { status, headers: { "Cache-Control": "no-store" } },
);

export async function recordAnalytics(request: Request, source: Source): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 32768) return reply(413, "payload_too_large");
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return reply(400, "invalid_json");
    body = parsed as Record<string, unknown>;
  } catch {
    return reply(400, "invalid_json");
  }

  const event = clean(body.event, 40);
  if (!events[source].has(event)) return reply(400, "invalid_event");

  const url = process.env.ANALYTICS_SUPABASE_URL;
  const secret = process.env.ANALYTICS_SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error("[analytics] Server configuration missing");
    return reply(503);
  }

  const intent = clean(body.intent, 60);
  const row = {
    source,
    event_id: clean(body.eventId, 100) || crypto.randomUUID(),
    occurred_at: new Date().toISOString(),
    event,
    visitor_id: clean(body.visitorId, 100),
    session_id: clean(body.sessionId, 100),
    path: clean(body.path, 300),
    destination: clean(body.destination, source === "aprende" ? 300 : 500),
    intent: source === "undertango" && intents.has(intent) ? intent : "",
    subintent: source === "undertango" ? clean(body.subintent, 150) : "",
    cta: source === "undertango" ? clean(body.cta, 150) : "",
    utm_source: clean(body.utmSource, 150),
    utm_medium: clean(body.utmMedium, 150),
    utm_campaign: clean(body.utmCampaign, 200),
    utm_content: clean(body.utmContent, 200),
    referrer: clean(body.referrer, 1000),
    notes: clean(body.notes, 1000),
  };

  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/analytics_events?on_conflict=source,event_id`, {
      method: "POST",
      headers: {
        apikey: secret,
        "Content-Type": "application/json",
        Prefer: "resolution=ignore-duplicates,return=minimal",
      },
      body: JSON.stringify(row),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.error("[analytics] Storage write failed", response.status);
      return reply(502);
    }
    return reply(200);
  } catch {
    // Do not log request payloads, credentials, or upstream error bodies.
    console.error("[analytics] Storage unavailable");
    return reply(502);
  }
}
