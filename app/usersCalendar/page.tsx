"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import styles from "./calendar.module.css";

type CalendarEvent = {
  id: string;
  type: string;
  place: string;
  date: string;
  time: string;
  status: string;
  title: string;
};

type CalendarPayload = {
  events: CalendarEvent[];
  source: "airtable" | "snapshot";
  live: boolean;
  updatedAt: string;
};

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function dateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function prettyDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

function typeClass(type: string) {
  if (type === "Clase") return styles.classEvent;
  if (type === "Producción") return styles.productionEvent;
  return styles.showEvent;
}

export default function UsersCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [payload, setPayload] = useState<CalendarPayload | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/calendario", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setPayload)
      .catch(() => setError("No pudimos cargar la agenda en este momento."));
  }, []);

  const events = payload?.events ?? [];

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const current = map.get(event.date) || [];
      current.push(event);
      map.set(event.date, current);
    });
    return map;
  }, [events]);

  const monthCells = useMemo(() => {
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;
    const cells: Array<number | null> = Array.from({ length: leading }, () => null);
    for (let day = 1; day <= days; day += 1) cells.push(day);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const upcoming = useMemo(() => events.slice(0, 8), [events]);

  function previousMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((value) => value - 1);
    } else {
      setMonth((value) => value - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((value) => value + 1);
    } else {
      setMonth((value) => value + 1);
    }
  }

  function goToday() {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  return (
    <div className={styles.shell}>
      <Header />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Ø UnderTango Club · agenda pública</p>
            <h1>Calendario</h1>
            <p className={styles.subtitle}>
              Shows, clases y producciones confirmadas de UnderTango en la Triple Frontera y la región.
            </p>
          </div>

          <div className={styles.sourceBadge}>
            <span className={payload?.live ? styles.liveDot : styles.snapshotDot} />
            {payload?.live ? "Agenda en vivo" : "Agenda de respaldo"}
          </div>
        </section>

        {!payload && !error && <div className={styles.notice}>Cargando agenda…</div>}
        {error && <div className={styles.error}>{error}</div>}
        {payload && !payload.live && (
          <div className={styles.notice}>
            Estamos mostrando una copia pública de respaldo mientras se restablece la conexión en vivo.
          </div>
        )}

        <section className={styles.toolbar} aria-label="Navegación del calendario">
          <button type="button" onClick={previousMonth} aria-label="Mes anterior">
            ← Anterior
          </button>
          <div className={styles.monthTitle}>
            <span>{MONTHS[month]}</span>
            <strong>{year}</strong>
          </div>
          <div className={styles.toolbarRight}>
            <button type="button" onClick={goToday}>Hoy</button>
            <button type="button" onClick={nextMonth} aria-label="Mes siguiente">
              Siguiente →
            </button>
          </div>
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.calendarFrame} aria-label={`${MONTHS[month]} ${year}`}>
            <div className={styles.weekHeader}>
              {WEEKDAYS.map((weekday) => (
                <div key={weekday}>{weekday}</div>
              ))}
            </div>

            <div className={styles.calendarGrid}>
              {monthCells.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className={styles.emptyCell} />;

                const key = dateKey(year, month, day);
                const dayEvents = byDate.get(key) || [];
                const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
                const isToday = key === todayKey;

                return (
                  <article
                    key={key}
                    className={`${styles.dayCell} ${dayEvents.length ? styles.hasEvents : ""} ${isToday ? styles.today : ""}`}
                  >
                    <div className={styles.dayNumber}>{day}</div>
                    <div className={styles.dayEvents}>
                      {dayEvents.map((event) => (
                        <div key={event.id} className={`${styles.eventCard} ${typeClass(event.type)}`}>
                          <div className={styles.eventTime}>{event.time}</div>
                          <div className={styles.eventTitle}>{event.title}</div>
                          <div className={styles.eventPlace}>{event.place}</div>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className={styles.upcoming}>
            <div className={styles.upcomingHeader}>
              <p className={styles.eyebrow}>Próximamente</p>
              <h2>Próximas fechas</h2>
            </div>

            <div className={styles.upcomingList}>
              {payload && upcoming.length === 0 && (
                <p className={styles.emptyMessage}>No hay actividades públicas confirmadas todavía.</p>
              )}

              {upcoming.map((event) => (
                <article key={`upcoming-${event.id}`} className={styles.upcomingCard}>
                  <div className={styles.upcomingDate}>{prettyDate(event.date)}</div>
                  <div className={styles.upcomingBody}>
                    <span className={`${styles.typePill} ${typeClass(event.type)}`}>{event.type}</span>
                    <h3>{event.title}</h3>
                    <p>{event.time}</p>
                    <p>{event.place}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </div>

        <p className={styles.privacyNote}>
          Esta agenda muestra únicamente información pública. Datos internos de producción, pagos, elenco y coordinación no se publican aquí.
        </p>
      </main>
    </div>
  );
}
