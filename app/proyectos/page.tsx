"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Header from "../components/header";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../../src/lib/supabase";
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
  nextMilestone?: string;
  nextAction?: string;
  targetDate?: string;
  progress?: number | null;
  order: number;
};

type ApiPayload = {
  projects: Project[];
  source: "airtable" | "snapshot";
  live: boolean;
  canEdit: boolean;
  editorConfigured: boolean;
  options: {
    statuses: string[];
    priorities: string[];
    horizons: string[];
    areas: string[];
  };
  updatedAt: string;
};

type SortMode = "manual" | "priority" | "horizon" | "date";

const PRIORITY: Record<string, number> = { Crítica: 0, Alta: 1, Media: 2, Baja: 3 };
const HORIZON: Record<string, number> = { Hoy: 0, Semana: 1, Mes: 2, Trimestre: 3, "6 meses": 4, Año: 5 };
const STORAGE_KEY = "undertango-project-order-v2";

const FALLBACK_OPTIONS = {
  statuses: ["Activo", "En espera", "Bloqueado", "Idea", "Completado", "Archivado"],
  priorities: ["Crítica", "Alta", "Media", "Baja"],
  horizons: ["Hoy", "Semana", "Mes", "Trimestre", "6 meses", "Año"],
  areas: ["Shows", "Música", "Web / Producto", "Programación", "Comercial", "Finanzas", "Comunicación", "Investigación", "Literatura", "Operaciones"],
};

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
  const { user, loading: authLoading, login, logout } = useAuth();
  const [payload, setPayload] = useState<ApiPayload | null>(null);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("manual");
  const [area, setArea] = useState("Todos");
  const [savedOrder, setSavedOrder] = useState<string[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [draft, setDraft] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSavedOrder(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function load() {
      setError("");
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || "";
      const response = await fetch("/api/proyectos", {
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next = await response.json();
      if (!cancelled) setPayload(next);
    }

    load().catch(() => !cancelled && setError("No pude cargar los proyectos."));
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const projects = payload?.projects ?? [];
  const options = payload?.options ?? FALLBACK_OPTIONS;

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

  function openEditor(project: Project) {
    setEditing(project);
    setDraft({ ...project, areas: [...project.areas] });
    setSaveError("");
  }

  function closeEditor() {
    if (saving) return;
    setEditing(null);
    setDraft(null);
    setSaveError("");
  }

  function toggleDraftArea(value: string) {
    if (!draft) return;
    const exists = draft.areas.includes(value);
    setDraft({
      ...draft,
      areas: exists ? draft.areas.filter((item) => item !== value) : [...draft.areas, value],
    });
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    if (!draft || !editing || !payload?.canEdit) return;

    setSaving(true);
    setSaveError("");

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token || "";
      if (!token) throw new Error("La sesión de edición venció. Volvé a iniciar sesión.");

      const changes = {
        name: draft.name,
        status: draft.status,
        priority: draft.priority,
        horizon: draft.horizon,
        areas: draft.areas,
        purpose: draft.purpose || "",
        current: draft.current || "",
        nextMilestone: draft.nextMilestone || "",
        nextAction: draft.nextAction || "",
        targetDate: draft.targetDate || null,
        progress: draft.progress ?? null,
        order: draft.order,
      };

      const response = await fetch("/api/proyectos", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: editing.id, changes }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo guardar.");

      const updated = result.project as Project;
      const closesProject = ["Completado", "Archivado"].includes(updated.status);
      setPayload((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          projects: closesProject
            ? previous.projects.filter((project) => project.id !== updated.id)
            : previous.projects.map((project) => (project.id === updated.id ? updated : project)),
        };
      });
      setToast(closesProject ? "Proyecto cerrado y guardado en Airtable." : "Cambios guardados en Airtable.");
      closeEditor();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleEditorLogin(event: FormEvent) {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError("");

    try {
      const result = await login(loginEmail.trim(), loginPassword);
      if (!result?.success) throw new Error(result?.message || "No se pudo iniciar sesión.");
      setLoginPassword("");
      setLoginOpen(false);
      setToast("Sesión iniciada. Verificando permisos de edición…");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleEditorLogout() {
    await logout();
    setEditing(null);
    setDraft(null);
    setToast("Sesión de edición cerrada.");
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
              Una sola vista para recordar qué está vivo, qué necesita atención y cuál es la próxima acción. Los datos vienen de Airtable; cuando la edición está habilitada, los cambios se guardan directamente en la base operativa.
            </p>
          </div>

          <div className={styles.heroActions}>
            <div className={styles.source}>
              <span className={payload?.live ? styles.liveDot : styles.snapshotDot} />
              {payload?.live ? "Airtable en vivo" : "Airtable · foto actual"}
            </div>

            {!user && (
              <button type="button" className={styles.editorButton} onClick={() => setLoginOpen(true)}>
                Editar proyectos
              </button>
            )}

            {user && payload?.canEdit && (
              <button type="button" className={`${styles.editorButton} ${styles.editorActive}`} onClick={handleEditorLogout}>
                Edición activa · salir
              </button>
            )}

            {user && payload && !payload.canEdit && (
              <button type="button" className={styles.editorButton} onClick={handleEditorLogout}>
                Sin permiso · salir
              </button>
            )}
          </div>
        </section>

        {payload && !payload.live && (
          <p className={styles.notice}>
            Esta versión está usando una foto de respaldo. Para editar, el servidor necesita acceso en vivo a Airtable mediante una credencial segura de Vercel.
          </p>
        )}

        {user && payload && !payload.editorConfigured && (
          <p className={styles.editNotice}>
            La cuenta está iniciada, pero falta definir <strong>PROJECT_EDITOR_EMAILS</strong> en Vercel para autorizar quién puede escribir en Airtable.
          </p>
        )}

        {user && payload?.editorConfigured && !payload.canEdit && (
          <p className={styles.editNotice}>
            Esta cuenta está autenticada, pero no figura entre los editores autorizados del panel.
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
              <button key={mode} className={`${styles.button} ${sortMode === mode ? styles.activeButton : ""}`} onClick={() => setSortMode(mode)}>
                {label}
              </button>
            ))}
          </div>

          <div className={styles.areaFilters}>
            <span className={styles.controlLabel}>Área</span>
            {areas.map((item) => (
              <button key={item} className={`${styles.areaButton} ${area === item ? styles.activeButton : ""}`} onClick={() => setArea(item)}>
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
              className={`${styles.card} ${sortMode === "manual" && !payload?.canEdit ? styles.dragReady : ""} ${draggingId === project.id ? styles.dragging : ""}`}
              draggable={sortMode === "manual" && !payload?.canEdit}
              onDragStart={() => setDraggingId(project.id)}
              onDragEnd={() => setDraggingId(null)}
              onDragOver={(event) => sortMode === "manual" && !payload?.canEdit && event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                moveCard(project.id);
              }}
            >
              <div className={styles.cardTop}>
                <div className={styles.rank}>{String(index + 1).padStart(2, "0")}</div>
                <div className={styles.cardHeading}>
                  <div className={styles.titleRow}>
                    <h2 className={styles.cardTitle}>{project.name}</h2>
                    {payload?.canEdit && (
                      <button type="button" className={styles.editCardButton} onClick={() => openEditor(project)}>
                        Editar
                      </button>
                    )}
                  </div>
                  <div className={styles.meta}>
                    <span className={`${styles.chip} ${priorityClass(project.priority)}`}>{project.priority}</span>
                    <span className={styles.chip}>{project.status}</span>
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

              {typeof project.progress === "number" && (
                <div className={styles.progressWrap}>
                  <div className={styles.progressMeta}><span>Progreso</span><strong>{Math.round(project.progress * 100)}%</strong></div>
                  <div className={styles.progressTrack}><span style={{ width: `${Math.max(0, Math.min(100, project.progress * 100))}%` }} /></div>
                </div>
              )}

              <div className={styles.cardFooter}>
                <span className={styles.date}>{prettyDate(project.targetDate)}</span>
                <span className={styles.dragHint}>
                  {payload?.canEdit ? `orden mental: ${project.order}` : sortMode === "manual" ? "↕ arrastrar para ordenar" : `orden: ${sortMode}`}
                </span>
              </div>
            </article>
          ))}
        </section>
      </main>

      {toast && <div className={styles.toast}>{toast}</div>}

      {loginOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => !loggingIn && setLoginOpen(false)}>
          <div className={`${styles.modal} ${styles.loginModal}`} role="dialog" aria-modal="true" aria-label="Acceso de edición" onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Acceso privado</p>
                <h2>Editar proyectos</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={() => setLoginOpen(false)} aria-label="Cerrar">×</button>
            </div>

            <form className={styles.form} onSubmit={handleEditorLogin}>
              <label className={styles.field}>
                <span>Email</span>
                <input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} required autoComplete="email" />
              </label>
              <label className={styles.field}>
                <span>Contraseña</span>
                <input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} required autoComplete="current-password" />
              </label>
              {loginError && <p className={styles.formError}>{loginError}</p>}
              <button type="submit" className={styles.saveButton} disabled={loggingIn}>{loggingIn ? "Ingresando…" : "Entrar al modo edición"}</button>
            </form>
          </div>
        </div>
      )}

      {editing && draft && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeEditor}>
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`Editar ${editing.name}`} onMouseDown={(event) => event.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>Edición Airtable</p>
                <h2>{editing.name}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeEditor} aria-label="Cerrar">×</button>
            </div>

            <form className={styles.form} onSubmit={saveProject}>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Nombre del proyecto</span>
                <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required />
              </label>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>Estado</span>
                  <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                    {options.statuses.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Prioridad</span>
                  <select value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
                    {options.priorities.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Horizonte</span>
                  <select value={draft.horizon} onChange={(event) => setDraft({ ...draft, horizon: event.target.value })}>
                    {options.horizons.map((item) => <option key={item}>{item}</option>)}
                  </select>
                </label>

                <label className={styles.field}>
                  <span>Fecha objetivo</span>
                  <input type="date" value={draft.targetDate || ""} onChange={(event) => setDraft({ ...draft, targetDate: event.target.value })} />
                </label>

                <label className={styles.field}>
                  <span>Progreso (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={draft.progress == null ? "" : Math.round(draft.progress * 100)}
                    placeholder="Sin dato"
                    onChange={(event) => setDraft({ ...draft, progress: event.target.value === "" ? null : Number(event.target.value) / 100 })}
                  />
                </label>

                <label className={styles.field}>
                  <span>Orden mental</span>
                  <input type="number" min="0" step="1" value={draft.order} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} />
                </label>
              </div>

              <div className={`${styles.field} ${styles.fieldWide}`}>
                <span>Áreas</span>
                <div className={styles.areaPicker}>
                  {options.areas.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`${styles.areaChoice} ${draft.areas.includes(item) ? styles.areaChoiceActive : ""}`}
                      onClick={() => toggleDraftArea(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Propósito</span>
                <textarea rows={3} value={draft.purpose || ""} onChange={(event) => setDraft({ ...draft, purpose: event.target.value })} />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Estado actual</span>
                <textarea rows={4} value={draft.current || ""} onChange={(event) => setDraft({ ...draft, current: event.target.value })} />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Próximo hito</span>
                <textarea rows={3} value={draft.nextMilestone || ""} onChange={(event) => setDraft({ ...draft, nextMilestone: event.target.value })} />
              </label>

              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span>Próxima acción</span>
                <textarea rows={4} value={draft.nextAction || ""} onChange={(event) => setDraft({ ...draft, nextAction: event.target.value })} />
              </label>

              {saveError && <p className={styles.formError}>{saveError}</p>}

              <div className={styles.formActions}>
                <button type="button" className={styles.cancelButton} onClick={closeEditor} disabled={saving}>Cancelar</button>
                <button type="submit" className={styles.saveButton} disabled={saving}>{saving ? "Guardando…" : "Guardar en Airtable"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
