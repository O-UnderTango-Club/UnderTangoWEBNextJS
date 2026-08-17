import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appJwwHP1Wkoxo54q";
const TABLE_ID = process.env.AIRTABLE_UNDERTANGO_EVENTS_TABLE_ID || "tbl1rWfynUYLROCqP";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

const F = {
  id: "fldszeh5Eivlvup7V",
  occurredAt: "fldrK6q0BLUSjlIdo",
  event: "fldYUOzZHhDcIUClh",
  visitor: "fldiCbNSCQQCmH0fl",
  session: "fldxBn4ksgXRUu5D8",
  path: "fld0b9m0eU1cyCTb6",
  destination: "fldqenTLlYJItViQc",
  intent: "fldIhRsIfOfjydo87",
  subintent: "flduW5u76MRL2lYu7",
  cta: "fldwlFj4BjoUDvk6L",
  source: "fldaLxnTrXgVbQv8n",
  medium: "fldYDpFdBXMgvfOBT",
  campaign: "fldw4dkPhwqTY1T5g",
  content: "fldaptd8Fd9ZaJiWl",
  referrer: "fldSOhcudA8icNdMB",
  notes: "fldfC0vpIpQE5PlLZ",
};

const ALLOWED_EVENTS = new Set([
  "page_view",
  "intent_click",
  "subintent_click",
  "whatsapp_click",
]);

const ALLOWED_INTENTS = new Set([
  "ver_tango",
  "aprender_tango",
  "contratar_show",
]);

function clean(value: unknown, max = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(request: NextRequest) {
  if (!AIRTABLE_TOKEN) {
    console.error("[UNDERTANGO analytics] AIRTABLE_TOKEN missing");
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
  const intent = clean(body.intent, 60);
  const occurredAt = new Date().toISOString();

  const fields: Record<string, string> = {
    [F.id]: eventId,
    [F.occurredAt]: occurredAt,
    [F.event]: event,
    [F.visitor]: clean(body.visitorId, 100),
    [F.session]: clean(body.sessionId, 100),
    [F.path]: clean(body.path, 300),
    [F.destination]: clean(body.destination, 500),
    [F.subintent]: clean(body.subintent, 150),
    [F.cta]: clean(body.cta, 150),
    [F.source]: clean(body.utmSource, 150),
    [F.medium]: clean(body.utmMedium, 150),
    [F.campaign]: clean(body.utmCampaign, 200),
    [F.content]: clean(body.utmContent, 200),
    [F.referrer]: clean(body.referrer, 1000),
    [F.notes]: clean(body.notes, 1000),
  };

  if (ALLOWED_INTENTS.has(intent)) {
    fields[F.intent] = intent;
  }

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
      console.error("[UNDERTANGO analytics] Airtable write failed", airtable.status, detail);
      return NextResponse.json({ ok: false }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[UNDERTANGO analytics] unexpected error", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
