"use client"

import { useMemo, useState } from "react"

import Header from "../components/header"
import Footer from "../components/footer"

import "../styles/agenda.css"

type Category = "shows" | "clases" | "ensayos" | "otros"

type PublicEvent = {
  id: string
  date: string
  time: string
  title: string
  place: string
  city?: string
  category: Category
  artists: string[]
  approximate?: boolean
}

const PUBLIC_EVENTS: PublicEvent[] = [
  {
    id: "itaipu-2026-08-08",
    date: "2026-08-08",
    time: "20:00",
    title: "Show Club Itaipú",
    place: "Club Itaipú",
    category: "shows",
    artists: ["Thays Andrade", "Pablo Cieslik"],
    approximate: true,
  },
  {
    id: "festa-nacoes-2026-08-15",
    date: "2026-08-15",
    time: "17:00",
    title: "Festa das Nações",
    place: "Av. José Maria de Brito 960",
    city: "Foz do Iguaçu",
    category: "shows",
    artists: ["Evayan Behr", "Pablo Cieslik"],
  },
  {
    id: "wish-2026-08-23",
    date: "2026-08-23",
    time: "13:30",
    title: "Saxo + dupla de tango",
    place: "Hotel Wish",
    city: "Foz do Iguaçu",
    category: "shows",
    artists: ["Agus", "Thays Andrade", "Pablo Cieslik"],
  },
  {
    id: "amerian-2026-10-03",
    date: "2026-10-03",
    time: "21:00",
    title: "Cena · tango + músico",
    place: "Hotel Amérian",
    category: "shows",
    artists: ["Agus", "Evayan Behr", "Pablo Cieslik"],
    approximate: true,
  },
]

const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]

const CATEGORY_LABELS: Record<Category, string> = {
  shows: "Shows",
  clases: "Clases",
  ensayos: "Ensayos",
  otros: "Otros",
}

function toIsoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
  })
    .format(date)
    .toUpperCase()
}

export default function AgendaPage() {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [activeCategories, setActiveCategories] = useState<Category[]>(["shows"])
  const [shareMode, setShareMode] = useState(false)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const monthCells = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const mondayOffset = (firstDay.getDay() + 6) % 7

    const cells: Array<{ day: number | null; iso: string | null }> = []

    for (let i = 0; i < mondayOffset; i += 1) {
      cells.push({ day: null, iso: null })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ day, iso: toIsoDate(year, month, day) })
    }

    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null })
    }

    return cells
  }, [month, year])

  const visibleEvents = useMemo(
    () => PUBLIC_EVENTS.filter((event) => activeCategories.includes(event.category)),
    [activeCategories],
  )

  function moveMonth(delta: number) {
    setCurrentMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1))
  }

  function toggleCategory(category: Category) {
    setActiveCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    )
  }

  function showAll() {
    setActiveCategories(["shows", "clases", "ensayos", "otros"])
  }

  return (
    <div className={shareMode ? "agenda-shell share-mode" : "agenda-shell"}>
      {!shareMode && <Header />}

      <main className="agenda-page">
        <section className="agenda-frame">
          <div className="agenda-topline">
            <div>
              <p className="agenda-kicker">Ø UNDERTANGO CLUB</p>
              <h1>Agenda pública</h1>
              <p className="agenda-subtitle">Shows, clases y movimientos compartidos del equipo.</p>
            </div>

            <button
              type="button"
              className="share-button"
              onClick={() => setShareMode((value) => !value)}
            >
              {shareMode ? "Volver" : "Vista para compartir"}
            </button>
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
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((category) => (
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
              <button type="button" className="all-filter" onClick={showAll}>
                Todo
              </button>
            </div>
          </div>

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
                const eventsForDay = cell.iso
                  ? visibleEvents.filter((event) => event.date === cell.iso)
                  : []

                return (
                  <article
                    className={cell.day ? "day-cell" : "day-cell empty"}
                    key={`${cell.iso ?? "empty"}-${index}`}
                  >
                    {cell.day && <span className="day-number">{cell.day}</span>}

                    <div className="day-events">
                      {eventsForDay.map((event) => (
                        <div className={`event-card ${event.category}`} key={event.id}>
                          <div className="event-time">
                            {event.time}
                            {event.approximate ? " aprox." : ""}
                          </div>
                          <div className="event-title">{event.title}</div>
                          <div className="event-place">
                            {event.place}
                            {event.city ? ` · ${event.city}` : ""}
                          </div>
                          <div className="event-artists">{event.artists.join(" · ")}</div>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <footer className="agenda-public-footer">
            <span>undertangoclub.com</span>
            <span>Información operativa pública · actualizada por Ø UnderTango Club</span>
          </footer>
        </section>
      </main>

      {!shareMode && <Footer />}
    </div>
  )
}
