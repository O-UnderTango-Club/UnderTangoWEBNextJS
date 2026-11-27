import { NextResponse } from "next/server";
import {
  PUBLIC_CALENDAR_NAME,
  PUBLIC_CALENDAR_SOURCE,
  publicCalendarDay,
  publicEventsForMonth,
} from "../../../src/lib/public-calendar";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const now = new Date();
  const [currentYear, currentMonth] = publicCalendarDay(now).split("-").map(Number);
  const year = Number(searchParams.get("year") || currentYear);
  const month = Number(searchParams.get("month") || currentMonth);

  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  return NextResponse.json(
    {
      events: publicEventsForMonth(year, month),
      source: PUBLIC_CALENDAR_SOURCE,
      live: true,
      calendar: PUBLIC_CALENDAR_NAME,
      year,
      month,
      updatedAt: now.toISOString(),
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
