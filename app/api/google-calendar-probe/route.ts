import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CALENDAR_ID = "undertangoclub@gmail.com";

export async function GET() {
  const url = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

  try {
    const response = await fetch(url, { cache: "no-store", redirect: "follow" });
    const text = await response.text();

    return NextResponse.json({
      ok: response.ok && text.includes("BEGIN:VCALENDAR"),
      upstreamStatus: response.status,
      contentType: response.headers.get("content-type") || "",
      bytes: text.length,
      isCalendar: text.includes("BEGIN:VCALENDAR"),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 502 },
    );
  }
}
