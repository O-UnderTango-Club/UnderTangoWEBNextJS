"use client";

import { useEffect, useRef, useState } from "react";
import { departments } from "./departments";
import styles from "./central.module.css";

export default function CentralMap() {
  const [selectedNumber, setSelectedNumber] = useState<string | null>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const selected = departments.find((department) => department.number === selectedNumber);
  const matrix = departments.slice(0, 9);
  const extension = departments[9];

  const openDepartment = (number: string) => {
    returnFocus.current = document.activeElement as HTMLElement;
    setSelectedNumber(number);
  };

  const closeDepartment = () => {
    setSelectedNumber(null);
    requestAnimationFrame(() => returnFocus.current?.focus());
  };

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDepartment();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

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
            <header className={styles.panelHeader}>
              <span className={styles.panelNumber}>{selected.number}</span>
              <div><p>{selected.keyword}</p><h2 id={`department-${selected.number}-title`}>{selected.title}</h2></div>
            </header>
            <div className={styles.detailGrid}>
              <section className={styles.brief}>
                <p className={styles.detailLabel}>Esquela del departamento</p>
                <p>{selected.description}</p>
              </section>
              <section className={styles.detailSection}>
                <div className={styles.detailHeading}><h3>Integrantes</h3><span>{selected.members.length}</span></div>
                <div className={styles.memberGrid}>
                  {selected.members.length ? selected.members.map((member) => (
                    <article className={styles.memberCard} key={`${selected.number}-${member.name}`}>
                      <span>{member.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>
                      <div><strong>{member.name}</strong><p>{member.role}</p></div>
                    </article>
                  )) : <p className={styles.empty}>Todavía no hay integrantes asignados a este departamento en Airtable.</p>}
                </div>
              </section>
              <section className={styles.detailSection}>
                <div className={styles.detailHeading}><h3>Proyectos activos</h3><span>{selected.projects.length}</span></div>
                <ul className={styles.projectGrid}>
                  {selected.projects.map((project, index) => <li key={project}><span>{String(index + 1).padStart(2, "0")}</span><strong>{project}</strong></li>)}
                </ul>
              </section>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
