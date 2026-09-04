"use client";

import { useEffect, useRef, useState } from "react";
import { departments } from "./departments";
import styles from "./central.module.css";

export default function CentralMap() {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"members" | "projects" | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const detailBackButton = useRef<HTMLButtonElement>(null);
  const membersButton = useRef<HTMLButtonElement>(null);
  const projectsButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const selected = departments.find((department) => department.number === selectedNumber);
  const matrix = departments.slice(0, 9);
  const extension = departments[9];

  const openDepartment = (number: string) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setActiveSection(null);
    setSelectedNumber(number);
  };

  const closeDepartment = () => {
    setActiveSection(null);
    setSelectedNumber(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  };

  const openSection = (section: "members" | "projects") => {
    setActiveSection(section);
    requestAnimationFrame(() => detailBackButton.current?.focus());
  };

  const closeSection = () => {
    const previousSection = activeSection;
    setActiveSection(null);
    requestAnimationFrame(() => {
      if (previousSection === "members") membersButton.current?.focus();
      if (previousSection === "projects") projectsButton.current?.focus();
    });
  };

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
  }, [selected, activeSection]);

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
                    <h3 id={`department-${selected.number}-${activeSection}-title`}>{activeSection === "members" ? "Integrantes" : "Proyectos activos"}</h3>
                  </div>
                  <span>{activeSection === "members" ? selected.members.length : selected.projects.length}</span>
                </header>
                {activeSection === "members" ? (
                  <div className={`${styles.subpanelContent} ${styles.memberGrid}`}>
                    {selected.members.length ? selected.members.map((member) => (
                      <article className={styles.memberCard} key={`${selected.number}-${member.name}`}>
                        <span>{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                        <div><strong>{member.name}</strong><p>{member.role}</p></div>
                      </article>
                    )) : <p className={styles.empty}>Todavía no hay integrantes asignados a este departamento en Airtable.</p>}
                  </div>
                ) : (
                  <ol className={`${styles.subpanelContent} ${styles.projectGrid}`}>
                    {selected.projects.map((project, index) => <li key={project}><span>{String(index + 1).padStart(2, "0")}</span><strong>{project}</strong></li>)}
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

