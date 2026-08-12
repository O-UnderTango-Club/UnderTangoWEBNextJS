import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CALENDAR_ID = "undertangoclub@gmail.com";
const TIME_ZONE = "America/Argentina/Buenos_Aires";
const ICS_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(CALENDAR_ID)}/public/basic.ics`;

type Category = "shows" | "clases" | "ensayos" | "otros";

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  allDay: boolean;
};

type RawEvent = {
  uid: string;
  summary: string;
  location: string;
  status: string;
  start?: DateParts;
  end?: DateParts;
  recurrenceId?: DateParts;
  rrule?: Record<string, string>;
  exdates: Set<string>;
};

type PublicEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  place: string;
  category: Category;
  allDay: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_INDEX: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function dateKey(value: DateParts) {
  return `${value.year}-${pad(value.month)}-${pad(value.day)}`;
}

function dateTimeKey(value: DateParts) {
  return `${dateKey(value)}T${pad(value.hour)}:${pad(value.minute)}:${pad(value.second)}`;
}

function serial(value: DateParts) {
  return Date.UTC(value.year, value.month - 1, value.day, value.hour, value.minute, value.second);
}

function fromSerial(value: number, template: DateParts): DateParts {
  const date = new Date(value);
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
    allDay: template.allDay,
  };
}

function utcToLocalParts(date: Date, allDay = false): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: allDay ? 0 : get("hour"),
    minute: allDay ? 0 : get("minute"),
    second: allDay ? 0 : get("second"),
    allDay,
  };
}

function parseIcsDate(rawValue: string): DateParts | undefined {
  const value = rawValue.trim();

  if (/^\d{8}$/.test(value)) {
    return {
      year: Number(value.slice(0, 4)),
      month: Number(value.slice(4, 6)),
      day: Number(value.slice(6, 8)),
      hour: 0,
      minute: 0,
      second: 0,
      allDay: true,
    };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!match) return undefined;

  const [, year, month, day, hour, minute, second = "00", utc] = match;

  if (utc) {
    return utcToLocalParts(
      new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))),
    );
  }

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    allDay: false,
  };
}

function unescapeIcsText(value: string) {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function splitProperty(line: string) {
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') quoted = !quoted;
    if (char === ":" && !quoted) {
      return [line.slice(0, index), line.slice(index + 1)] as const;
    }
  }
  return [line, ""] as const;
}

function parseRrule(value: string) {
  const result: Record<string, string> = {};
  value.split(";").forEach((part) => {
    const [key, val] = part.split("=", 2);
    if (key && val) result[key.toUpperCase()] = val;
  });
  return result;
}

function parseEvents(ics: string): RawEvent[] {
  const unfolded = ics.replace(/\r?\n[ \t]/g, "");
  const blocks = unfolded.split("BEGIN:VEVENT").slice(1);

  return blocks.map((block, blockIndex) => {
    const body = block.split("END:VEVENT")[0] || "";
    const event: RawEvent = {
      uid: `google-event-${blockIndex}`,
      summary: "Actividad UnderTango",
      location: "",
      status: "CONFIRMED",
      exdates: new Set<string>(),
    };

    body.split(/\r?\n/).forEach((line) => {
      if (!line) return;
      const [left, rawValue] = splitProperty(line);
      const [rawName] = left.split(";");
      const name = rawName.toUpperCase();

      if (name === "UID") event.uid = rawValue.trim() || event.uid;
      if (name === "SUMMARY") event.summary = unescapeIcsText(rawValue) || event.summary;
      if (name === "LOCATION") event.location = unescapeIcsText(rawValue);
      if (name === "STATUS") event.status = rawValue.trim().toUpperCase();
      if (name === "DTSTART") event.start = parseIcsDate(rawValue);
      if (name === "DTEND") event.end = parseIcsDate(rawValue);
      if (name === "RECURRENCE-ID") event.recurrenceId = parseIcsDate(rawValue);
      if (name === "RRULE") event.rrule = parseRrule(rawValue);
      if (name === "EXDATE") {
        rawValue.split(",").forEach((token) => {
          const parsed = parseIcsDate(token);
          if (parsed) event.exdates.add(dateTimeKey(parsed));
        });
      }
    });

    return event;
  });
}

function categoryFor(summary: string): Category {
  const normalized = summary
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("ensayo")) return "ensayos";
  if (normalized.includes("clase")) return "clases";
  if (
    normalized.includes("show") ||
    normalized.includes("espectac") ||
    normalized.includes("tango rave") ||
    normalized.includes("presentacion")
  ) {
    return "shows";
  }
  return "otros";
}

function displayTime(start: DateParts, end?: DateParts) {
  if (start.allDay) return "Todo el día";
  const startTime = `${pad(start.hour)}:${pad(start.minute)}`;
  if (!end || end.allDay) return startTime;
  const endTime = `${pad(end.hour)}:${pad(end.minute)}`;
  return dateKey(start) === dateKey(end) ? `${startTime}–${endTime}` : startTime;
}

function toPublic(event: RawEvent, start: DateParts, end?: DateParts): PublicEvent {
  return {
    id: `${event.uid}-${dateTimeKey(start)}`,
    date: dateKey(start),
    time: displayTime(start, end),
    title: event.summary,
    place: event.location || "Lugar a confirmar",
    category: categoryFor(event.summary),
    allDay: start.allDay,
  };
}

function weekday(value: DateParts) {
  return new Date(Date.UTC(value.year, value.month - 1, value.day)).getUTCDay();
}

function dateOnlySerial(value: DateParts) {
  return Date.UTC(value.year, value.month - 1, value.day);
}

function startOfWeekSerial(value: DateParts, weekStart: number) {
  const current = weekday(value);
  const backwards = (current - weekStart + 7) % 7;
  return dateOnlySerial(value) - backwards * DAY_MS;
}

function recurrenceMatches(candidate: DateParts, start: DateParts, rule: Record<string, string>) {
  const frequency = (rule.FREQ || "").toUpperCase();
  const interval = Math.max(1, Number(rule.INTERVAL || 1));
  const candidateDate = dateOnlySerial(candidate);
  const startDate = dateOnlySerial(start);
  const diffDays = Math.floor((candidateDate - startDate) / DAY_MS);
  if (diffDays < 0) return false;

  if (frequency === "DAILY") {
    return diffDays % interval === 0;
  }

  if (frequency === "WEEKLY") {
    const byDays = (rule.BYDAY || "")
      .split(",")
      .map((value) => value.replace(/^[+-]?\d+/, ""))
      .filter(Boolean);
    const allowed = byDays.length ? byDays.map((value) => WEEKDAY_INDEX[value]).filter((value) => value !== undefined) : [weekday(start)];
    if (!allowed.includes(weekday(candidate))) return false;

    const weekStart = WEEKDAY_INDEX[(rule.WKST || "MO").toUpperCase()] ?? 1;
    const weeks = Math.floor((startOfWeekSerial(candidate, weekStart) - startOfWeekSerial(start, weekStart)) / (7 * DAY_MS));
    return weeks >= 0 && weeks % interval === 0;
  }

  if (frequency === "MONTHLY") {
    const diffMonths = (candidate.year - start.year) * 12 + (candidate.month - start.month);
    if (diffMonths < 0 || diffMonths % interval !== 0) return false;

    if (rule.BYMONTHDAY) {
      const monthDays = rule.BYMONTHDAY.split(",").map(Number);
      return monthDays.includes(candidate.day);
    }

    if (rule.BYDAY) {
      const byDays = rule.BYDAY
        .split(",")
        .map((value) => value.replace(/^[+-]?\d+/, ""))
        .filter(Boolean);
      return byDays.map((value) => WEEKDAY_INDEX[value]).includes(weekday(candidate));
    }

    return candidate.day === start.day;
  }

  if (frequency === "YEARLY") {
    const diffYears = candidate.year - start.year;
    return diffYears >= 0 && diffYears % interval === 0 && candidate.month === start.month && candidate.day === start.day;
  }

  return candidateDate === startDate;
}

function expandRecurringEvent(
  master: RawEvent,
  rangeStart: number,
  rangeEnd: number,
  exceptions: Map<string, RawEvent>,
  usedExceptions: Set<string>,
) {
  if (!master.start || !master.rrule) return [] as PublicEvent[];

  const result: PublicEvent[] = [];
  const rule = master.rrule;
  const countLimit = rule.COUNT ? Math.max(0, Number(rule.COUNT)) : Number.POSITIVE_INFINITY;
  const until = rule.UNTIL ? parseIcsDate(rule.UNTIL) : undefined;
  const untilSerial = until ? serial(until) : Number.POSITIVE_INFINITY;
  const duration = master.end ? Math.max(0, serial(master.end) - serial(master.start)) : 0;

  let cursor = dateOnlySerial(master.start);
  const lastDay = rangeEnd - DAY_MS;
  const maxCursor = Math.min(lastDay, until ? dateOnlySerial(until) : lastDay);
  let occurrenceCount = 0;
  let safety = 0;

  while (cursor <= maxCursor && safety < 25000) {
    safety += 1;
    const cursorDate = new Date(cursor);
    const candidate: DateParts = {
      year: cursorDate.getUTCFullYear(),
      month: cursorDate.getUTCMonth() + 1,
      day: cursorDate.getUTCDate(),
      hour: master.start.hour,
      minute: master.start.minute,
      second: master.start.second,
      allDay: master.start.allDay,
    };

    if (recurrenceMatches(candidate, master.start, rule) && serial(candidate) >= serial(master.start)) {
      occurrenceCount += 1;
      if (occurrenceCount > countLimit) break;
      if (serial(candidate) > untilSerial) break;

      const occurrenceKey = `${master.uid}|${dateTimeKey(candidate)}`;
      const exception = exceptions.get(occurrenceKey);

      if (exception) {
        usedExceptions.add(occurrenceKey);
        if (exception.status !== "CANCELLED" && exception.start) {
          const exceptionStartSerial = serial(exception.start);
          if (exceptionStartSerial >= rangeStart && exceptionStartSerial < rangeEnd) {
            result.push(toPublic(exception, exception.start, exception.end));
          }
        }
      } else if (!master.exdates.has(dateTimeKey(candidate))) {
        const candidateSerial = serial(candidate);
        if (candidateSerial >= rangeStart && candidateSerial < rangeEnd) {
          const end = master.end ? fromSerial(candidateSerial + duration, master.end) : undefined;
          result.push(toPublic(master, candidate, end));
        }
      }
    }

    cursor += DAY_MS;
  }

  return result;
}

function eventsForMonth(rawEvents: RawEvent[], year: number, month: number) {
  const rangeStart = Date.UTC(year, month - 1, 1);
  const rangeEnd = Date.UTC(year, month, 1);
  const exceptions = new Map<string, RawEvent>();
  const usedExceptions = new Set<string>();

  rawEvents.forEach((event) => {
    if (event.recurrenceId) {
      exceptions.set(`${event.uid}|${dateTimeKey(event.recurrenceId)}`, event);
    }
  });

  const result: PublicEvent[] = [];

  rawEvents.forEach((event) => {
    if (event.status === "CANCELLED" || event.recurrenceId || !event.start) return;

    if (event.rrule) {
      result.push(...expandRecurringEvent(event, rangeStart, rangeEnd, exceptions, usedExceptions));
      return;
    }

    const eventSerial = serial(event.start);
    if (eventSerial >= rangeStart && eventSerial < rangeEnd) {
      result.push(toPublic(event, event.start, event.end));
    }
  });

  exceptions.forEach((event, key) => {
    if (usedExceptions.has(key) || event.status === "CANCELLED" || !event.start) return;
    const eventSerial = serial(event.start);
    if (eventSerial >= rangeStart && eventSerial < rangeEnd) {
      result.push(toPublic(event, event.start, event.end));
    }
  });

  const unique = new Map(result.map((event) => [event.id, event]));
  return Array.from(unique.values()).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.title.localeCompare(b.title));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") || now.getFullYear());
  const month = Number(url.searchParams.get("month") || now.getMonth() + 1);

  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  try {
    const response = await fetch(ICS_URL, { cache: "no-store", redirect: "follow" });
    if (!response.ok) throw new Error(`Google Calendar responded ${response.status}`);

    const ics = await response.text();
    if (!ics.includes("BEGIN:VCALENDAR")) throw new Error("Google Calendar returned an invalid ICS feed");

    const events = eventsForMonth(parseEvents(ics), year, month);

    return NextResponse.json(
      {
        events,
        source: "google-calendar",
        live: true,
        calendar: "UnderTango Club",
        year,
        month,
        updatedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Calendar API could not read Google Calendar:", error);
    return NextResponse.json(
      {
        events: [],
        source: "google-calendar",
        live: false,
        calendar: "UnderTango Club",
        year,
        month,
        updatedAt: new Date().toISOString(),
        error: "No pudimos leer Google Calendar en este momento.",
      },
      { status: 502, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
