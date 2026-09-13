"use client";

import { useState, type ReactNode } from "react";
import { frontPosition, type Board } from "../../src/lib/panel-model";
import { frontProjectGroups } from "../../src/lib/panel-project-groups";
import css from "./panel.module.css";

type Props = {
  data: Board;
  front: Board["fronts"][number];
  renderTask: (task: Board["tasks"][number], projectId?: string) => ReactNode;
  onFinishToday: (projectId: string) => Promise<void>;
  disabled: boolean;
};

export default function FrontProjects({ data, front, renderTask, onFinishToday, disabled }: Props) {
  const [expanded, setExpanded] = useState<string[]>([]);
  const groups = frontProjectGroups(data, front);
  if (!groups.length) return <div className={css.empty}>Sin acciones disponibles por hoy en este frente.</div>;
  return <div className={css.frontProjectList}>{groups.map(group => {
    const isOpen = expanded.includes(group.id);
    const panelId = `project-${front.name}-${group.id}`;
    return <section className={css.frontProject} key={group.id}>
      <button className={css.projectToggle} aria-expanded={isOpen} aria-controls={panelId} onClick={() => setExpanded(previous => isOpen ? previous.filter(id => id !== group.id) : [...previous, group.id])}>
        <span className={css.projectEyebrow}>{group.id === "__unlinked" ? "Sin vincular" : "Proyecto"}<span aria-hidden="true">{isOpen ? "−" : "+"}</span></span>
        <strong className={css.frontProjectTitle}>{group.name}</strong>
        <span className={css.muted}>{group.local.length} {group.local.length === 1 ? "acción en este frente" : "acciones en este frente"}{group.tasks.length > group.local.length ? ` · ${group.tasks.length - group.local.length} en otros frentes o sin frente` : ""}</span>
        <span className={group.priority.length ? css.badge : css.muted}>{group.priority.length ? `Prioridad de hoy · ${group.priority.map(t => frontPosition(t.front, t.rank)).join(" · ")}` : "Fuera de las tres prioridades de hoy"}</span>
        <span className={css.projectOpenLabel}>{isOpen ? "Cerrar acciones" : "Abrir acciones"}</span>
      </button>
      {group.id !== "__unlinked" && <div className={css.projectDayActions}>
        <button className={css.button} disabled={disabled} onClick={() => void onFinishToday(group.id)} aria-label={`Por hoy está bien con ${group.name}`}>Por hoy está bien</button>
        <p className={css.help}>Deja para mañana las acciones abiertas del proyecto, también en otros frentes. Conserva las fechas posteriores.</p>
        {data.tasks.some(task => task.projectIds.includes(group.id) && task.projectIds.length > 1 && !["done", "cancelled"].includes(task.stage)) && <p className={css.help}>Las acciones compartidas también descansan en sus otros proyectos.</p>}
      </div>}
      <div id={panelId} hidden={!isOpen} className={css.projectContents}>
        {isOpen && <>
          <p className={css.help}>Sólo se muestran acciones disponibles. Las programadas quedan en Programadas y vuelven al llegar su fecha. Cada acción conserva su frente y posición.</p>
          {group.tasks.map(task => <div key={task.id}>
            {front.tasks.includes(task.id) && <span className={css.badge}>Entre las tres prioridades de este frente</span>}
            {task.projectIds.length > 1 && <p className={css.help}>Acción compartida entre proyectos: los cambios se reflejan en todos.</p>}
            {renderTask(task, group.id)}
          </div>)}
        </>}
      </div>
    </section>;
  })}</div>;
}
