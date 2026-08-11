"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import styles from "./proyectos.module.css";

type Project = {
  id: string;
  name: string;
  status: string;
  priority: string;
  horizon: string;
  areas: string[];
  purpose?: string;
  current?: string;
  nextAction?: string;
  targetDate?: string;
  progress?: number | null;
  order: number;
};

type ApiPayload = {
  projects: Project[];
  source: "airtable" | "snapshot";
  live: boolean;
  updatedAt: string;
};

type SortMode = "manual" | "priority" | "horizon" | "date";

const PRIORITY: Record<string, number> = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };
const HORIZON: Record<string, number> = { Hoy: 0, Semana: 1, Mes: 2, Trimestre: 3, "6 meses": 4, Año: 5 };
const STORAGE_KEY = "undertango-project-order-v2";

function priorityClass(priority: string) {
  if (priority === "Crítica") return styles.critical;
  if (priority === "Alta") return styles.high;
  if (priority === "Media") return styles.medium;
  return styles.low;
}

function prettyDate(value?: string) {
  if (!value) return "Sin fecha objetivo";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "short" }).format(new Date(year, month - 1, day));
}

function applyManualOrder(projects: Project[], savedOrder: string[]) {
  const rank = new Map(savedOrder.map((id, index) => [id, index]));
  return [...projects].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id)! : 10000 + a.order;
    const bRank = rank.has(b.id) ? rank.get(b.id)! : 10000 + b.order;
    return aRank - bRank;
  });
}

export default function ProjectsPage() {
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [area, setArea] = useState("Todos");
  const [savedOrder, setSavedOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedOrder(JSON.parse(stored));
    } catch {}

    fetch("/api/proyectos", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setPayload)
      .catch(() => setError("No pude cargar los proyectos."));
  }, []);

  const projects = payload?.projects ?? [];

  const areas = useMemo(() => {
    const values = new Set<string>();
    projects.forEach((project) => project.areas.forEach((item) => values.add(item)));
    return ["Todos", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [projects]);

  const visibleProjects = useMemo(() => {
    let result = projects.filter((project) => area === "Todos" || project.areas.includes(area));

    if (sortMode === "manual") {
      result = applyManualOrder(result, savedOrder);
    } else if (sortMode === "priority") {
      result = [...result].sort((a, b) => (PRIORITY[a.priority] ?? 99) - (PRIORITY[b.priority] ?? 99) || a.order - b.order);
    } else if (sortMode === "horizon") {
      result = [...result].sort((a, b) => (HORIZON[a.horizon] ?? 99) - (HORIZON[b.horizon] ?? 99) || a.order - b.order);
    } else if (sortMode === "date") {
      result = [...result].sort((a, b) => {
        const aDate = a.targetDate ? new Date(`${a.targetDate}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const bDate = b.targetDate ? new Date(`${b.targetDate}T12:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        return aDate - bDate || a.order - b.order;
      });
    }

    return result;
  }, [projects, area, sortMode, savedOrder]);

  const critical = projects.filter((project) => project.priority === "Crítica").length;
  const high = projects.filter((project) => project.priority === "Alta").length;
  const week = projects.filter((project) => project.horizon === "Hoy" || project.horizon === "Semana").length;

  function moveCard(targetId: string) {
    if (!draggingId || draggingId === targetId || sortMode !== "manual") return;

    const allOrdered = applyManualOrder(projects, savedOrder).map((project) => project.id);
    const from = allOrdered.indexOf(draggingId);
    const to = allOrdered.indexOf(targetId);
    if (from < 0 || to < 0) return;

    const next = [...allOrdered];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setSavedOrder(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setDraggingId(null);
  }

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <div>
            <p className={styles.eyebrow}>Ø UnderTango · memoria operativa</p>
            <h1 className={styles.title}>Proyectos activos</h1>
            <p className={styles.subtitle}>
              Una sola vista para recordar qué está vivo, qué necesita atención y cuál es la próxima acción. Los contenidos vienen de Airtable; el orden manual puede acomodarse arrastrando las tarjetas.
            </p>
          </div>
          <div className={styles.source}>
            <span className={payload?.live ? styles.liveDot : styles.snapshotDot} />
            {payload?.live ? "Airtable en vivo" : "Airtable · foto actual"}
          </div>
        </section>

        {payload && !payload.live && (
          <p className={styles.notice}>
            Esta versión ya muestra la estructura y los datos actuales de Airtable. La lectura automática en vivo queda habilitada apenas se agregue la credencial de Airtable al entorno seguro de Vercel; no se expone ninguna clave en el navegador.
          </p>
        )}

        <section className={styles.stats} aria-label="Resumen de proyectos">
          <div className={styles.stat}><span className={styles.statValue}>{projects.length}</span><span className={styles.statLabel}>proyectos activos</span></div>
          <div className={styles.stat}><span className={styles.statValue}>{critical}</span><span className={styles.statLabel}>prioridad crítica</span></div>
          <div className={styles.stat}><span className={styles.statValue}>{high}</span><span className={styles.statLabel}>prioridad alta</span></div>
          <div className={styles.stat}><span className={styles.statValue}>{week}</span><span className={styles.statLabel}>hoy / esta semana</span></div>
        </section>

        <section className={styles.toolbar}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Ordenar</span>
            {([
              ["manual", "Manual"],
              ["priority", "Prioridad"],
              ["horizon", "Horizonte"],
              ["date", "Fecha"],
            ] as [SortMode, string][]).map(([mode, label]) => (
              <button
                key={mode}
                className={`${styles.button} ${sortMode === mode ? styles.activeButton : ""}`}
                onClick={() => setSortMode(mode)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.areaFilters}>
            <span className={styles.controlLabel}>Área</span>
            {areas.map((item) => (
              <button
                key={item}
                className={`${styles.areaButton} ${area === item ? styles.activeButton : ""}`}
                onClick={() => setArea(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.grid}>
          {!payload && !error && <div className={styles.loading}>Cargando el mapa de proyectos…</div>}
          {error && <div className={styles.empty}>{error}</div>}
          {payload && visibleProjects.length === 0 && <div className={styles.empty}>No hay proyectos para este filtro.</div>}

          {visibleProjects.map((project, index) => (
            <article
              key={project.id}
              className={`${styles.card} ${sortMode === "manual" ? styles.dragReady : ""} ${draggingId === project.id ? styles.dragging : ""}`}
              draggable={sortMode === "manual"}
              onDragStart={() => setDraggingId(project.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => sortMode === "manual" && event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                moveCard(project.id);
              }}
            >
              <div className={styles.cardTop}>
                <div className={styles.rank}>{String(index + 1).padStart(2, "0")}</div>
                <div className={styles.cardHeading}>
                  <h2 className={styles.cardTitle}>{project.name}</h2>
                  <div className={styles.meta}>
                    <span className={`${styles.chip} ${priorityClass(project.priority)}`}>{project.priority}</span>
                    <span className={styles.chip}>{project.horizon}</span>
                    {project.areas.map((item) => <span key={item} className={styles.chip}>{item}</span>)}
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              <div>
                <p className={styles.sectionLabel}>Estado actual</p>
                <p className={styles.current}>{project.current || "Sin resumen cargado todavía."}</p>
              </div>

              <div className={styles.nextBlock}>
                <p className={styles.sectionLabel}>Próxima acción</p>
                <p className={styles.nextAction}>{project.nextAction || "Definir próxima acción."}</p>
              </div>

              <div className={styles.cardFooter}>
                <span className={styles.date}>{prettyDate(project.targetDate)}</span>
                <span className={styles.dragHint}>{sortMode === "manual" ? "↕ arrastrar para ordenar" : `orden: ${sortMode}`}</span>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
