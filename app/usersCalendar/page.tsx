"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

import Header from "../components/header";
import Footer from "../components/footer";
import "../styles/agenda.css";

type Category = "shows" | "clases" | "ensayos" | "otros";

type PublicEvent = {
  id: string;
  date: string;
  time: string;
  title: string;
  place: string;
  category: Category;
  allDay: boolean;
};

type CalendarPayload = {
  events: PublicEvent[];
  source: "google-calendar";
  live: boolean;
  calendar: string;
  year: number;
  month: number;
  updatedAt: string;
  error?: string;
};

const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const CATEGORIES: Category[] = ["shows", "clases", "ensayos", "otros"];
const CATEGORY_LABELS: Record<Category, string> = {
  shows: "Shows",
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

export default function UsersCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [activeCategories, setActiveCategories] = useState<Category[]>(["shows"]);
  const [shareMode, setShareMode] = useState(false);
  const [payload, setPayload] = useState<CalendarPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    fetch(`/api/calendario?year=${year}&month=${month + 1}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = (await response.json()) as CalendarPayload;
        if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
        return data;
      })
      .then((data) => setPayload(data))
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setPayload(null);
        setError(reason instanceof Error ? reason.message : "No pudimos cargar Google Calendar.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [year, month]);

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
  const events = payload?.events ?? [];

  const visibleEvents = useMemo(
    () => events.filter((event) => activeCategories.includes(event.category)),
    [events, activeCategories],
  );

  const eventsByDate = useMemo(() => {
    const result = new Map<string, PublicEvent[]>();
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

  function toggleCategory(category: Category) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function showAll() {
    setActiveCategories(CATEGORIES);
  }

  const today = new Date();
  const todayKey = toIsoDate(today.getFullYear(), today.getMonth(), today.getDate());
  const allActive = activeCategories.length === CATEGORIES.length;
  const agendaStyle = { "--calendar-weeks": weekCount } as CSSProperties;

  const statusClass = error ? "agenda-status error" : loading ? "agenda-status loading" : "agenda-status";
  const statusText = error
    ? "Google Calendar sin conexión"
    : loading
      ? "Sincronizando…"
      : "Google Calendar · en vivo";

  return (
    <div className={shareMode ? "agenda-shell share-mode" : "agenda-shell"} style={agendaStyle}>
      {!shareMode && <Header />}

      <main className="agenda-page">
        <div className="agenda-frame">
          <div className="agenda-topline">
            <div className="agenda-heading">
              <p className="agenda-kicker">Ø UNDERTANGO CLUB</p>
              <h1>Agenda pública</h1>
              <p className="agenda-subtitle">Calendario oficial sincronizado con Google Calendar.</p>
            </div>

            <div className="agenda-actions">
              <span className={statusClass}>{statusText}</span>
              <button
                type="button"
                className="share-button"
                onClick={() => setShareMode((value) => !value)}
              >
                {shareMode ? "Volver" : "Vista para compartir"}
              </button>
            </div>
          </div>

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
                onClick={showAll}
              >
                Todo
              </button>
            </div>
          </div>

          {loading && <p className="agenda-message">Leyendo el calendario UnderTango Club…</p>}
          {error && <p className="agenda-message error">{error}</p>}

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
                        <div className={`event-card ${event.category}`} key={event.id}>
                          <div className="event-time">{event.time}</div>
                          <div className="event-title">{event.title}</div>
                          {event.place && <div className="event-place">{event.place}</div>}
                        </div>
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
              Fuente: Google Calendar · UnderTango Club{payload ? ` · ${payload.events.length} eventos este mes` : ""}
            </span>
          </footer>
        </div>
      </main>

      {!shareMode && <Footer />}
    </div>
  );
}
