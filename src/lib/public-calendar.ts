export const PUBLIC_CALENDAR_SOURCE = "public-calendar";
export const PUBLIC_CALENDAR_NAME = "UnderTango Club";
export const PUBLIC_CALENDAR_TIME_ZONE = "America/Argentina/Cordoba";

export type CalendarCategory = "shows" | "milongas" | "clases" | "ensayos" | "otros";

export type PublicCalendarEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  place: string;
  category: CalendarCategory;
  allDay: boolean;
  festival?: string;
  description?: string;
  flyer?: { src: string; alt: string };
};

// Cartelera editorial. Cada entrada está aprobada para difusión pública.
const PUBLIC_EVENTS: readonly PublicCalendarEvent[] = [
  {
    id: "primera-voluntad-iguazu-2026",
    date: "2026-12-02",
    time: "Horario por confirmar",
    title: "Ø Primera voluntad",
    place: "La Cabaña de los Muñecos · Puerto Iguazú",
    category: "shows",
    allDay: true,
    festival: "Multiversos 2026",
    description: "Arte generativo audiovisual. Pablo Cieslik cruza piano en vivo, música con código y visuales generativos.",
    flyer: {
      src: "/images/agenda/primera-voluntad-iguazu.webp",
      alt: "Flyer de Ø Primera voluntad en Puerto Iguazú, con un círculo barrado de partículas azules y violetas.",
    },
  },
  {
    id: "primera-voluntad-posadas-2026",
    date: "2026-12-12",
    time: "Horario por confirmar",
    title: "Ø Primera voluntad",
    place: "Silicon Misiones · Posadas",
    category: "shows",
    allDay: true,
    festival: "Multiversos 2026",
    description: "Pablo Cieslik lleva la performance de arte generativo audiovisual a Silicon Misiones.",
    flyer: {
      src: "/images/agenda/primera-voluntad-posadas.webp",
      alt: "Flyer de Ø Primera voluntad en Posadas, con una interpretación de la instalación de luces y pantallas en Silicon Misiones.",
    },
  },
];

const calendarDayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: PUBLIC_CALENDAR_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function publicCalendarDay(now = new Date()): string {
  const parts = calendarDayFormat.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function upcomingPublicEvents(day: string): PublicCalendarEvent[] {
  return PUBLIC_EVENTS.filter((event) => event.date >= day)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export function publicEventsForMonth(year: number, month: number): PublicCalendarEvent[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return upcomingPublicEvents(`${prefix}01`).filter((event) => event.date.startsWith(prefix));
}
