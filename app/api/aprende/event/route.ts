import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const TABLE_ID = process.env.AIRTABLE_APRENDE_EVENTS_TABLE_ID || "tblJwm7MNgWaE7H8S";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

const F = {
  id: "fld64b3k2PlTYUHRX",
  occurredAt: "fld0wgPydi0lUGyPp",
  event: "fldWYBKzlBTGl8zOm",
  visitor: "fldxvU1d9JhwBoNK6",
  session: "fldcuEmai05oyw4jF",
  path: "fldnUkJuupWPjF9Dp",
  destination: "fld5nCpo06fOf4sdq",
  source: "fldvOFHFMjmvQEXQQ",
  medium: "fldyb6Z7El9IFgzm5",
  campaign: "fldZnCDuPx8i1IfuX",
  content: "fldw5c6TQbh7KBlgm",
  referrer: "fldX7d4wOGvbqZfrw",
  notes: "fldqa774qOx7n7TuE",
};

const ALLOWED_EVENTS = new Set([
  "page_view",
  "download_click",
  "whatsapp_click",
  "profile_submit",
  "offer_sent",
  "payment",
]);

function clean(value: unknown, max = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  if (!AIRTABLE_TOKEN) {
    console.error("[APRENDE analytics] AIRTABLE_TOKEN missing");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const event = clean(body.event, 40);
  if (!ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  }

  const eventId = clean(body.eventId, 100) || crypto.randomUUID();
  const occurredAt = new Date().toISOString();

  const fields = {
    [F.id]: eventId,
    [F.occurredAt]: occurredAt,
    [F.event]: event,
    [F.visitor]: clean(body.visitorId, 100),
    [F.session]: clean(body.sessionId, 100),
    [F.path]: clean(body.path, 300),
    [F.destination]: clean(body.destination, 300),
    [F.source]: clean(body.utmSource, 150),
    [F.medium]: clean(body.utmMedium, 150),
    [F.campaign]: clean(body.utmCampaign, 200),
    [F.content]: clean(body.utmContent, 200),
    [F.referrer]: clean(body.referrer, 1000),
    [F.notes]: clean(body.notes, 1000),
  };

  try {
    const airtable = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
      cache: "no-store",
    });

    if (!airtable.ok) {
      const detail = await airtable.text();
      console.error("[APRENDE analytics] Airtable write failed", airtable.status, detail);
      return NextResponse.json({ ok: false }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[APRENDE analytics] unexpected error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
