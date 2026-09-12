"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { departments, type DepartmentMember } from "./departments";
import styles from "./central.module.css";
import FinanceReconstruction from "./FinanceReconstruction";

const countries = [{ code: "AR", name: "Argentina" }, { code: "BR", name: "Brasil" }, { code: "PY", name: "Paraguay" }] as const;
const chartColors = ["#d7b35a", "#b96365", "#71968a", "#c48750", "#9585b8", "#789bbd", "#b9be6b", "#d693b6", "#81b7b0", "#a08b73"];
const chartDepartments = [...departments].sort((a, b) => Number(a.number) - Number(b.number));
const participationTotal = chartDepartments.reduce((sum, department) => sum + department.members.length, 0);
const uniqueMemberTotal = new Set(departments.flatMap((department) => department.members.map((member) => member.name))).size;
const chartSegments = chartDepartments.map((department, index) => {
  const start = chartDepartments.slice(0, index).reduce((sum, item) => sum + item.members.length, 0);
  return `${chartColors[index]} ${participationTotal ? start / participationTotal * 100 : 0}% ${participationTotal ? (start + department.members.length) / participationTotal * 100 : 0}%`;
}).join(", ");

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
            {matrix.map((department) => department.link?.direct ? (
              <a key={department.number} className={styles.tile} data-department={department.number} href={department.link.href} aria-label={`${department.number} · ${department.link.label}`}>
                <span className={styles.number}>{department.number}</span>
                <span className={styles.keyword}>{department.keyword} ↗</span>
              </a>
            ) : (
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
        <p className={styles.hint}>Elegí un departamento para abrirlo. Distribución del equipo ↓</p>
      </section>

      <section className={styles.distribution} aria-labelledby="distribution-title">
        <header>
          <h2 id="distribution-title">El equipo por departamento</h2>
          <p>{uniqueMemberTotal} personas · {participationTotal} participaciones departamentales</p>
        </header>
        <div className={styles.chartLayout}>
          <div className={styles.pieChart} role="img" aria-label="Distribución porcentual de participaciones por departamento. Detalle en la lista contigua." style={{ background: participationTotal ? `conic-gradient(${chartSegments})` : "#333" }} />
          <ul className={styles.chartLegend}>
            {chartDepartments.map((department, index) => <li key={department.number}>
              <span className={styles.chartSwatch} style={{ background: chartColors[index] }} aria-hidden="true" />
              <span>{department.number} · {department.keyword}</span>
              <strong>{department.members.length} · {(participationTotal ? department.members.length / participationTotal * 100 : 0).toFixed(1).replace(".", ",")}%</strong>
            </li>)}
          </ul>
        </div>
        <p className={styles.chartNote}>Cada persona cuenta una vez en cada departamento que integra. Los clientes no se incluyen; Vinculación cuenta sólo a Juan Pögler. Los porcentajes están redondeados.</p>
      </section>

      {selected && (
        <div className={styles.overlay} onMouseDown={(event) => event.currentTarget === event.target && closeDepartment()}>
          <section className={`${styles.panel} ${activeSection === "finance" ? styles.financePanel : ""}`} role="dialog" aria-modal="true" aria-labelledby={`department-${selected.number}-title`}>
            <button ref={closeButton} type="button" className={styles.close} onClick={closeDepartment} aria-label="Cerrar departamento">Cerrar ×</button>
            <div className={styles.overview}>
              <header className={styles.panelHeader}>
                <span className={styles.panelNumber}>{selected.number}</span>
                <div><p>{selected.keyword}</p><h2 id={`department-${selected.number}-title`}>{selected.title}</h2></div>
              </header>
              <div className={styles.description}><p>{selected.description}</p>{selected.link && <a href={selected.link.href}>{selected.link.label} →</a>}{selected.emptyLabel && <strong>{selected.emptyLabel}</strong>}</div>
              <div className={styles.metricGrid}>
                <button ref={membersButton} type="button" className={styles.metric} aria-expanded={activeSection === "members"} aria-controls={`department-${selected.number}-members`} onClick={() => openSection("members")}>
                  <span className={styles.metricCount}>{selected.members.length}</span>
                  <span><strong>{selected.clients ? "Alianzas" : "Integrantes"}</strong><small>{selected.clients ? "Ver vínculos +" : "Ver el equipo +"}</small></span>
                </button>
                <button ref={projectsButton} type="button" className={styles.metric} aria-expanded={activeSection === "projects"} aria-controls={`department-${selected.number}-projects`} onClick={() => openSection("projects")}>
                  <span className={styles.metricCount}>{selected.clients?.length ?? selected.projects.length}</span>
                  <span><strong>{selected.clients ? "Clientes" : "Proyectos activos"}</strong><small>{selected.clients ? "Ver por país +" : "Ver los proyectos +"}</small></span>
                </button>
              </div>
            </div>

            {activeSection && (
              <section className={`${styles.subpanel} ${activeSection === "finance" ? styles.financeSubpanel : ""}`} id={`department-${selected.number}-${activeSection}`} aria-labelledby={`department-${selected.number}-${activeSection}-title`}>
                <header className={styles.subpanelHeader}>
                  <button ref={detailBackButton} type="button" className={styles.back} onClick={closeSection}>← Volver</button>
                  <div>
                    <p>{selected.number} · {selected.keyword}</p>
                    <h3 id={`department-${selected.number}-${activeSection}-title`}>{activeSection === "finance" ? "Informe financiero 2026" : activeSection === "members" ? (selected.clients ? "Alianzas" : "Integrantes") : (selected.clients ? "Clientes" : "Proyectos activos")}</h3>
                  </div>
                  <span>{activeSection === "finance" ? "87" : activeSection === "members" ? selected.members.length : (selected.clients?.length ?? selected.projects.length)}</span>
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
                        <section className={styles.otherMembers} aria-label="Producción">
                          <h4>Producción · articulación entre países</h4>
                          <div className={styles.memberGrid}>
                            {selected.members.filter((member) => !member.country).map((member) => <MemberCard key={member.name} member={member} />)}
                          </div>
                        </section>
                      )}
                    </div>
                  ) : (
                    <div className={`${styles.subpanelContent} ${styles.memberGrid}`}>
                      {selected.members.length ? selected.members.map((member) => <MemberCard key={member.name} member={member} />) : <p className={styles.empty}>{selected.emptyLabel ?? "Sin integrantes publicados por el momento."}</p>}
                    </div>
                  )
                ) : selected.clients ? (
                  <div className={`${styles.subpanelContent} ${styles.clientGroups}`}>
                    {countries.map((country) => <section key={country.code} className={styles.countryGroup}>
                      <h4>{country.name}</h4>
                      <ul>{selected.clients?.filter((client) => client.country === country.code).map((client) => <li key={client.name}>{client.name}</li>)}</ul>
                    </section>)}
                  </div>
                ) : (
                  <ol className={`${styles.subpanelContent} ${styles.projectGrid}`}>
                    {selected.projects.map((project, index) => <li key={project}><span>{String(index + 1).padStart(2, "0")}</span>{selected.number === "87" && project === "Ø87 — Tablero financiero" ? <button ref={reportButton} type="button" className={styles.projectReportButton} onClick={() => openSection("finance")}><strong>{project}</strong><small>Ver informe gráfico 2026 →</small></button> : <strong>{project}</strong>}</li>)}
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

