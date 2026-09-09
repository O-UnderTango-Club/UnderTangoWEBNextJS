"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { departments, type DepartmentMember } from "./departments";
import styles from "./central.module.css";

const countries = [{ code: "AR", name: "Argentina" }, { code: "BR", name: "Brasil" }, { code: "PY", name: "Paraguay" }] as const;

function FinanceReconstruction() {
  const [report, setReport] = useState<{ title: string; result: string; status: string }>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let active = true;
    setReport(undefined);
    setError("");
    async function read() {
      try {
        const response = await fetch("/api/panel/finance/reconstruction", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        if (response.status === 401 || response.status === 403) throw new Error("Este informe requiere el acceso privado del panel en este navegador.");
        if (!response.ok) throw new Error("No se pudo consultar el informe. Podés volver a intentar.");
        const value = await response.json();
        if (typeof value.title !== "string" || typeof value.result !== "string" || typeof value.status !== "string") throw new Error("El informe no pudo verificarse.");
        if (active) setReport(value);
      } catch (error) {
        if (active) setError(error instanceof Error && error.name !== "AbortError" ? error.message : "La consulta tardó demasiado. Volvé a intentar.");
      } finally { clearTimeout(timeout); }
    }
    void read();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [attempt]);
  return <div className={`${styles.subpanelContent} ${styles.financeReport}`}>
    <p>Informe privado · avances documentados y próximos pasos.</p>
    {!report && !error && <p role="status">Consultando el informe registrado…</p>}
    {error && <p role="alert">{error}</p>}
    {report && <><h4>{report.title}</h4><p>Estado del seguimiento: {report.status}</p><div className={styles.reportText}>{report.result}</div></>}
    <div className={styles.reportActions}>
      <button type="button" onClick={() => setAttempt(value => value + 1)}>Actualizar informe</button>
      <a href="/panel-de-control/finanzas">Ver facturas y movimientos</a>
      <a href="/panel-de-control">Abrir panel de control</a>
    </div>
  </div>;
}

function MemberCard({ member }: { member: DepartmentMember }) {
  return (
    <article className={styles.memberCard}>
      <span>{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
      <div><strong>{member.name}</strong><p>{member.role}</p></div>
    </article>
  );
}

export default function CentralMap() {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"members" | "projects" | "finance" | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const detailBackButton = useRef<HTMLButtonElement>(null);
  const membersButton = useRef<HTMLButtonElement>(null);
  const projectsButton = useRef<HTMLButtonElement>(null);
  const reportButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const selected = departments.find((department) => department.number === selectedNumber);
  const matrix = departments.slice(0, 9);
  const extension = departments[9];

  const openDepartment = (number: string) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setActiveSection(null);
    setSelectedNumber(number);
  };

  const closeDepartment = useCallback(() => {
    setActiveSection(null);
    setSelectedNumber(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  }, []);

  const openSection = (section: "members" | "projects" | "finance") => {
    setActiveSection(section);
    requestAnimationFrame(() => detailBackButton.current?.focus());
  };

  const closeSection = useCallback(() => {
    const previousSection = activeSection;
    setActiveSection(previousSection === "finance" ? "projects" : null);
    requestAnimationFrame(() => {
      if (previousSection === "finance") reportButton.current?.focus();
      if (previousSection === "members") membersButton.current?.focus();
      if (previousSection === "projects") projectsButton.current?.focus();
    });
  }, [activeSection]);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (activeSection) closeSection();
      else closeDepartment();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected, activeSection, closeDepartment, closeSection]);

  return (
    <main className={styles.main}>
      <section className={styles.map} aria-labelledby="central-title">
        <header className={styles.mapHeader}>
          <h1 id="central-title"><span>Ø</span> Central</h1>
          <p>Diez departamentos. Una estructura.</p>
        </header>
        <div className={styles.mapFrame}>
          <div className={styles.grid}>
            {matrix.map((department) => (
              <button type="button" key={department.number} className={styles.tile} data-department={department.number} aria-expanded={selectedNumber === department.number} aria-haspopup="dialog" onClick={() => openDepartment(department.number)}>
                <span className={styles.number}>{department.number}</span>
                <span className={styles.keyword}>{department.keyword}</span>
              </button>
            ))}
          </div>
          <button type="button" className={`${styles.tile} ${styles.extension}`} data-department="89" aria-expanded={selectedNumber === "89"} aria-haspopup="dialog" onClick={() => openDepartment("89")}>
            <span className={styles.number}>{extension.number}</span>
            <span className={styles.keyword}>{extension.keyword}</span>
          </button>
        </div>
        <p className={styles.hint}>Elegí un departamento para abrirlo.</p>
      </section>

      {selected && (
        <div className={styles.overlay} onMouseDown={(event) => event.currentTarget === event.target && closeDepartment()}>
          <section className={styles.panel} role="dialog" aria-modal="true" aria-labelledby={`department-${selected.number}-title`}>
            <button ref={closeButton} type="button" className={styles.close} onClick={closeDepartment} aria-label="Cerrar departamento">Cerrar ×</button>
            <div className={styles.overview}>
              <header className={styles.panelHeader}>
                <span className={styles.panelNumber}>{selected.number}</span>
                <div><p>{selected.keyword}</p><h2 id={`department-${selected.number}-title`}>{selected.title}</h2></div>
              </header>
              <p className={styles.description}>{selected.description}</p>
              <div className={styles.metricGrid}>
                <button ref={membersButton} type="button" className={styles.metric} aria-expanded={activeSection === "members"} aria-controls={`department-${selected.number}-members`} onClick={() => openSection("members")}>
                  <span className={styles.metricCount}>{selected.members.length}</span>
                  <span><strong>Integrantes</strong><small>Ver el equipo +</small></span>
                </button>
                <button ref={projectsButton} type="button" className={styles.metric} aria-expanded={activeSection === "projects"} aria-controls={`department-${selected.number}-projects`} onClick={() => openSection("projects")}>
                  <span className={styles.metricCount}>{selected.projects.length}</span>
                  <span><strong>Proyectos activos</strong><small>Ver los proyectos +</small></span>
                </button>
              </div>
            </div>

            {activeSection && (
              <section className={styles.subpanel} id={`department-${selected.number}-${activeSection}`} aria-labelledby={`department-${selected.number}-${activeSection}-title`}>
                <header className={styles.subpanelHeader}>
                  <button ref={detailBackButton} type="button" className={styles.back} onClick={closeSection}>← Volver</button>
                  <div>
                    <p>{selected.number} · {selected.keyword}</p>
                    <h3 id={`department-${selected.number}-${activeSection}-title`}>{activeSection === "finance" ? "Reconstrucción financiera 2026" : activeSection === "members" ? "Integrantes" : "Proyectos activos"}</h3>
                  </div>
                  <span>{activeSection === "finance" ? "87" : activeSection === "members" ? selected.members.length : selected.projects.length}</span>
                </header>
                {activeSection === "finance" ? <FinanceReconstruction /> : activeSection === "members" ? (
                  selected.memberHeading ? (
                    <div className={`${styles.subpanelContent} ${styles.groupedMembers}`}>
                      <h4 className={styles.groupHeading}>{selected.memberHeading}</h4>
                      <div className={styles.countryGrid}>
                        {countries.map((country) => (
                          <section className={styles.countryGroup} key={country.code} aria-labelledby={`country-${selected.number}-${country.code}`}>
                            <h5 id={`country-${selected.number}-${country.code}`}><span>{country.code}</span> {country.name}</h5>
                            <div className={styles.countryMembers}>
                              {selected.members.filter((member) => member.country === country.code).map((member) => <MemberCard key={member.name} member={member} />)}
                            </div>
                          </section>
                        ))}
                      </div>
                      {selected.members.some((member) => !member.country) && (
                        <section className={styles.otherMembers} aria-label="Otros integrantes">
                          <h4>Otros integrantes</h4>
                          <div className={styles.memberGrid}>
                            {selected.members.filter((member) => !member.country).map((member) => <MemberCard key={member.name} member={member} />)}
                          </div>
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className={`${styles.subpanelContent} ${styles.memberGrid}`}>
                      {selected.members.length ? selected.members.map((member) => <MemberCard key={member.name} member={member} />) : <p className={styles.empty}>Todavía no hay integrantes asignados a este departamento en Airtable.</p>}
                    </div>
                  )
                ) : (
                  <ol className={`${styles.subpanelContent} ${styles.projectGrid}`}>
                    {selected.projects.map((project, index) => <li key={project}><span>{String(index + 1).padStart(2, "0")}</span>{selected.number === "87" && project === "Ø87 — Tablero financiero" ? <button ref={reportButton} type="button" className={styles.projectReportButton} onClick={() => openSection("finance")}><strong>{project}</strong><small>Ver reconstrucción financiera 2026 →</small></button> : <strong>{project}</strong>}</li>)}
                  </ol>
                )}
              </section>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

