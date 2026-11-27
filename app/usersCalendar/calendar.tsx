"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { CSSProperties } from "react";

import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/agenda.css";
import {
  publicEventsForMonth,
  upcomingPublicEvents,
  type CalendarCategory,
  type PublicCalendarEvent,
} from "../../src/lib/public-calendar";

const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const CATEGORIES: CalendarCategory[] = ["shows", "milongas", "clases", "ensayos", "otros"];
const CATEGORY_LABELS: Record<CalendarCategory, string> = {
  shows: "Shows",
  milongas: "Milongas",
  clases: "Clases",
  ensayos: "Ensayos",
  otros: "Otros",
};

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

function eventWhatsAppUrl(event: PublicCalendarEvent) {
  const date = event.date.split("-").reverse().join("/");
  const time = event.allDay ? "" : ` (${event.time})`;
  const place = event.place ? ` en ${event.place}` : "";
  const message = `Hola, quisiera consultar por «${event.title}» del ${date}${time}${place}.`;

  return `https://wa.me/5493757618270?text=${encodeURIComponent(message)}`;
}

function EventCard({ event }: { event: PublicCalendarEvent }) {
  const details = (
    <>
      <div className="event-time">{event.time}</div>
      <div className="event-title">{event.title}</div>
      {event.place && <div className="event-place">{event.place}</div>}
    </>
  );

  if (event.category !== "shows" && event.category !== "clases") {
    return <div className={`event-card ${event.category}`}>{details}</div>;
  }

  return (
    <a
      className={`event-card ${event.category}`}
      href={eventWhatsAppUrl(event)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Consultar por WhatsApp: ${event.title}, ${event.date.split("-").reverse().join("/")} (abre en una nueva pestaña)`}
    >
      {details}
      <span className="event-contact">Consultar por WhatsApp <span aria-hidden="true">↗</span></span>
    </a>
  );
}

const featuredDateFormat = new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

function FeaturedEvent({ event }: { event: PublicCalendarEvent }) {
  if (!event.flyer) return null;
  const dateLabel = featuredDateFormat.format(new Date(`${event.date}T12:00:00Z`));
  return (
    <article className="agenda-featured-card">
      <a className="agenda-featured-flyer" href={event.flyer.src} target="_blank" rel="noopener noreferrer"
        aria-label={`Ver el flyer de ${event.title} en ${event.place} (abre en una nueva pestaña)`}>
        <Image src={event.flyer.src} alt={event.flyer.alt} fill sizes="(max-width: 700px) 35vw, 220px" />
      </a>
      <div className="agenda-featured-details">
        <time dateTime={event.date}>{dateLabel}</time>
        {event.festival && <p className="agenda-featured-festival">{event.festival}</p>}
        <h3>{event.title}</h3>
        <p className="agenda-featured-place">{event.place}</p>
        {event.description && <p>{event.description}</p>}
        <p className="agenda-featured-time">{event.time}</p>
      </div>
    </article>
  );
}

export default function PublicCalendar({ todayKey }: { todayKey: string }) {
  const upcoming = useMemo(() => upcomingPublicEvents(todayKey), [todayKey]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [year, month] = (upcoming[0]?.date ?? todayKey).split("-").map(Number);
    return new Date(year, month - 1, 1);
  });
  const [activeCategories, setActiveCategories] = useState<CalendarCategory[]>(CATEGORIES);
  const [shareMode, setShareMode] = useState(false);

  const featured = upcoming.filter((event) => event.flyer);
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthCells = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    const cells: Array<{ day: number | null; iso: string | null }> = [];

    for (let index = 0; index < mondayOffset; index += 1) {
      cells.push({ day: null, iso: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, iso: toIsoDate(year, month, day) });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null });
    }

    return cells;
  }, [month, year]);

  const weekCount = monthCells.length / 7;
  const events = useMemo(() => publicEventsForMonth(year, month + 1), [year, month]);

  const visibleEvents = useMemo(
    () => events.filter((event) => activeCategories.includes(event.category)),
    [events, activeCategories],
  );

  const eventsByDate = useMemo(() => {
    const result = new Map<string, PublicCalendarEvent[]>();
    visibleEvents.forEach((event) => {
      const current = result.get(event.date) || [];
      current.push(event);
      result.set(event.date, current);
    });
    return result;
  }, [visibleEvents]);

  function moveMonth(delta: number) {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function toggleCategory(category: CalendarCategory) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function showAll() {
    setActiveCategories(CATEGORIES);
  }

  const allActive = activeCategories.length === CATEGORIES.length;
  const agendaStyle = { "--calendar-weeks": weekCount } as CSSProperties;

  return (
    <div className={shareMode ? "agenda-shell share-mode" : "agenda-shell"} style={agendaStyle}>
      {!shareMode && <Header />}

      <main className="agenda-page">
        <div className="agenda-frame">
          <div className="agenda-topline">
            <div className="agenda-heading">
              <p className="agenda-kicker">Ø UNDERTANGO CLUB</p>
              <h1>Agenda pública</h1>
              <p className="agenda-subtitle">Presentaciones abiertas al público</p>
            </div>

            <div className="agenda-actions">
              <button
                type="button"
                className="share-button"
                onClick={() => setShareMode((value) => !value)}
              >
                {shareMode ? "Volver" : "Vista para compartir"}
              </button>
            </div>
          </div>

          {featured.length > 0 && (
            <section className="agenda-featured" aria-labelledby="agenda-featured-title">
              <h2 id="agenda-featured-title">Próximas funciones</h2>
              <div className="agenda-featured-grid">
                {featured.map((event) => <FeaturedEvent key={event.id} event={event} />)}
              </div>
            </section>
          )}

          <div className="agenda-toolbar">
            <div className="month-navigation" aria-label="Cambiar mes">
              <button type="button" onClick={() => moveMonth(-1)} aria-label="Mes anterior">
                ‹
              </button>
              <h2>{monthLabel(currentMonth)}</h2>
              <button type="button" onClick={() => moveMonth(1)} aria-label="Mes siguiente">
                ›
              </button>
            </div>

            <div className="category-filters" aria-label="Filtrar agenda">
              {CATEGORIES.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={activeCategories.includes(category) ? "active" : ""}
                  aria-pressed={activeCategories.includes(category)}
                  onClick={() => toggleCategory(category)}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
              <button
                type="button"
                className={allActive ? "all-filter active" : "all-filter"}
                aria-pressed={allActive}
                onClick={showAll}
              >
                Todo
              </button>
            </div>
          </div>

          {visibleEvents.length === 0 && (
            <div className="agenda-message" role="status">
              {events.length === 0 ? (
                "No hay eventos publicados en este calendario para este mes."
              ) : (
                <>
                  No hay eventos visibles con los filtros seleccionados. Hay {events.length}{" "}
                  {events.length === 1 ? "evento publicado" : "eventos publicados"} este mes.{" "}
                  <button type="button" className="agenda-reset-filters" onClick={showAll}>
                    Mostrar todos
                  </button>
                </>
              )}
            </div>
          )}

          <div className="calendar-wrap">
            <div className="calendar-grid weekday-row" aria-hidden="true">
              {WEEKDAYS.map((weekday) => (
                <div key={weekday} className="weekday-cell">
                  {weekday}
                </div>
              ))}
            </div>

            <div className="calendar-grid month-grid">
              {monthCells.map((cell, index) => {
                const eventsForDay = cell.iso ? eventsByDate.get(cell.iso) || [] : [];
                const isToday = cell.iso === todayKey;

                return (
                  <article
                    className={`${cell.day ? "day-cell" : "day-cell empty"}${isToday ? " today" : ""}`}
                    key={`${cell.iso ?? "empty"}-${index}`}
                  >
                    {cell.day && <span className="day-number">{cell.day}</span>}

                    <div className="day-events">
                      {eventsForDay.map((event) => (
                        <EventCard key={event.id} event={event} />
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <footer className="agenda-public-footer">
            <span>undertangoclub.com</span>
            <span>
              {allActive
                ? `${events.length} ${events.length === 1 ? "evento" : "eventos"} este mes`
                : `Mostrando ${visibleEvents.length} de ${events.length} eventos este mes`}
            </span>
          </footer>
        </div>
      </main>

      {!shareMode && <Footer />}
    </div>
  );
}
