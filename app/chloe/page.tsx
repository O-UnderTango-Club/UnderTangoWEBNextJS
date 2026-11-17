import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { DEVICE_COOKIE, verifyDevice } from "../../src/lib/panel-access";
import { readOperationsSnapshot } from "../../src/lib/panel-operations";
import { readDeadlines } from "../../src/lib/panel-deadlines-server";
import { deadlineDate, DEADLINE_KINDS, validDay, type DeadlineItem } from "../../src/lib/panel-deadlines";
import { board, frontPosition, type Board, type Stage } from "../../src/lib/panel-model";
import { readClubCalendar } from "./calendar";
import css from "./chloe.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Chloe · UnderTango",
  description: "Cuadro operativo privado de UnderTango.",
  alternates: { canonical: "/chloe" },
  robots: { index: false, follow: false },
};

const zone = "America/Argentina/Cordoba";
const stages: Record<Stage, string> = {
  ready: "Acción inmediata", recurring: "Acción recurrente", doing: "En curso", waiting: "En espera",
  scheduled: "Programada", done: "Finalizada", cancelled: "Descartada",
};
const groups = [
  { label: "Disponibles y recurrentes", stages: ["ready", "recurring"] },
  { label: "En curso", stages: ["doing"] },
  { label: "En espera", stages: ["waiting"] },
  { label: "Programadas", stages: ["scheduled"] },
  { label: "Historial", stages: ["done", "cancelled"] },
];
type Task = Board["tasks"][number];

function dayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("es-AR", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  return ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-");
}

function dayPlus(day: string, days: number) {
  return new Date(Date.parse(day + "T12:00:00Z") + days * 86400000).toISOString().slice(0, 10);
}

function dateTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short", timeZone: zone }).format(date);
}

function priorityOrder(priority: string) {
  return ({ "Crítica": 0, Alta: 1, Media: 2, Normal: 2, Baja: 3 } as Record<string, number>)[priority] ?? 4;
}

function TaskCard({ task, titles }: {
  task: Task; titles: Map<string, string>;
}) {
  const position = frontPosition(task.front, task.rank);
  const activation = dateTime(task.nextAvailableAt || task.activateAt);
  const context = task.projectIds.map(id => titles.get(id)).filter(Boolean).join(" · ");
  return <li className={css.task}>
    {context && <p className={css.context}>{context}</p>}
    <h3>{task.name || "Acción sin título"}</h3>
    <div className={css.badges}>
      {position !== "Sin posición" && <span>{task.front} {position}</span>}
      <span>{stages[task.stage]}</span>
      {task.priority && <span className={priorityOrder(task.priority) <= 1 ? css.priority : undefined}>{task.priority}</span>}
    </div>
    <p className={css.meta}>{task.owner || "Sin responsable"}{validDay(task.due) && <> · vence {deadlineDate(task.due)}</>}</p>
    {task.issues.length ? <p><strong>Revisá los datos.</strong> {task.issues.join(" · ")}</p>
      : task.blockers.length ? <p><strong>Pendiente de</strong> {task.blockers.join(" · ")}</p>
      : task.stage === "scheduled" && activation ? <p><strong>Disponible desde</strong> {activation}</p>
      : task.description && <p><strong>Próximo paso</strong> {task.description}</p>}
    {task.groupId && <p className={css.meta}>Parte de {titles.get(task.groupId) || "un grupo de acciones"}</p>}
    {task.isGroup && task.nextId && <p><strong>Siguiente paso del grupo</strong> {titles.get(task.nextId)}</p>}
  </li>;
}

function AgendaList({ items, tasks }: { items: DeadlineItem[]; tasks: Map<string, Task> }) {
  return items.length ? <ul className={css.rows}>{items.map(item => {
    const task = tasks.get(item.taskId || (item.source === "task" ? item.sourceId : ""));
    return <li key={item.id}>
      <time dateTime={item.date}>{deadlineDate(item.date)}{item.time && " · " + item.time}</time>
      <strong>{item.title}</strong>
      <span className={css.meta}>{[DEADLINE_KINDS[item.kind], item.status, item.priority, task?.owner].filter(Boolean).join(" · ")}</span>
      {item.detail && <p>{item.detail}</p>}
    </li>;
  })}</ul> : <p className={css.empty}>Sin fechas en este período.</p>;
}

// The Supabase gateway can briefly reject its generated JWT. Retry only this
// idempotent read with the same server-side credentials.
async function fetchPanelSnapshot(url: Parameters<typeof fetch>[0], init?: RequestInit) {
  const response = await fetch(url, init);
  if (response.status !== 401 || !response.headers.get("proxy-status")?.includes("PGRST303")) return response;
  await response.body?.cancel().catch(() => {});
  return fetch(url, init);
}

export default async function Chloe() {
  const cookie = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!cookie || !verifyDevice(cookie)) notFound();

  const today = dayKey(new Date());
  const until = dayPlus(today, 30);
  const [snapshot, agenda, calendar] = await Promise.allSettled([
    readOperationsSnapshot({ fetcher: fetchPanelSnapshot }),
    readDeadlines(),
    readClubCalendar(today, until),
  ]);
  const data = snapshot.status === "fulfilled" ? board(snapshot.value) : null;
  const dates = agenda.status === "fulfilled" ? agenda.value : null;
  const club = calendar.status === "fulfilled" ? calendar.value : null;
  const tasks = new Map(data?.tasks.map(task => [task.id, task]));
  const titles = new Map([
    ...(data?.projects.map(project => [project.id, project.name] as const) ?? []),
    ...(data?.tasks.map(task => [task.id, task.name] as const) ?? []),
  ]);
  const open = data?.tasks.filter(task => !["done", "cancelled"].includes(task.stage)) ?? [];
  const actionable = open.filter(task => !task.groupId && !task.issues.length &&
    ["ready", "recurring", "doing"].includes(task.stage));
  const urgency = (task: Task) => validDay(task.due) && task.due <= today ? 0 : priorityOrder(task.priority) <= 1 ? 1 : 2;
  const focus = actionable.filter(task => urgency(task) < 2 || validDay(task.due) && task.due <= dayPlus(today, 7))
    .sort((a, b) => urgency(a) - urgency(b) || priorityOrder(a.priority) - priorityOrder(b.priority) ||
      (a.due || "9999").localeCompare(b.due || "9999"));
  const overdue = dates?.items.filter(item => item.kind === "deadline" && item.date < today) ?? [];
  const soon = dates?.items.filter(item => item.date >= today && item.date <= dayPlus(today, 7)) ?? [];
  const later = dates?.items.filter(item => item.date > dayPlus(today, 7)) ?? [];
  const openProjects = data?.projects.filter(project => project.open) ?? [];

  return <main className={css.page}>
    <div className={css.shell}>
      <header className={css.hero}>
        <div className={css.top}>
          <span>Ø UnderTango Club</span>
          <a href="https://red.undertangoclub.com/">Abrir la Red ↗</a>
        </div>
        <div className={css.title}>
          <div><p>Dirección · Cuadro operativo</p><h1>Chloe</h1></div>
          <span>{deadlineDate(today)}</span>
        </div>
        <nav aria-label="Secciones de Chloe" className={css.nav}>
          <a href="#atencion">Atención</a><a href="#frentes">Frentes</a>
          <a href="#agenda">Agenda</a><a href="#explorar">Explorar</a>
          <a href="/chloe">Actualizar</a>
        </nav>
      </header>

      <div id="atencion" role="region" aria-labelledby="focus-title" className={css.focus}>
        <div><h2 id="focus-title">Prestá atención</h2>
          <p>Primero las acciones ejecutables vencidas o de hoy. Después, las de prioridad alta o crítica y las que vencen esta semana.</p>
          {dates && overdue.length > 0 && <a href="#vencidos">Revisá {overdue.length} {overdue.length === 1 ? "vencimiento atrasado" : "vencimientos atrasados"} en Agenda ↓</a>}
        </div>
        {!data ? <p className={css.empty}>No pudimos consultar el panel de Supabase. Volvé a actualizar.</p> :
          focus.length ? <div>
            <ul className={css.stack}>{focus.slice(0, 3).map(task => <TaskCard key={task.id} task={task} titles={titles} />)}</ul>
            {focus.length > 3 && <details className={css.details}><summary>Ver las {focus.length - 3} acciones restantes</summary>
              <ul className={css.stack}>{focus.slice(3).map(task => <TaskCard key={task.id} task={task} titles={titles} />)}</ul>
            </details>}
          </div> : <p className={css.empty}>No hay acciones ejecutables que cumplan estos criterios.</p>}
      </div>

      <div id="frentes" role="region" aria-labelledby="front-title" className={css.block}>
        <div className={css.heading}><h2 id="front-title">Frentes del panel</h2>
          <p>{data ? <>Supabase · consultado {dateTime(data.updatedAt)}</> : "Supabase · consulta no disponible"}</p></div>
        {data && <div className={css.fronts}>{data.fronts.map(front => <div key={front.name} className={css.front}>
          <h3>{front.name}</h3>
          {front.tasks.length ? <ul className={css.stack}>{front.tasks.map(id => {
            const task = tasks.get(id);
            return task && <TaskCard key={id} task={task} titles={titles} />;
          })}</ul> : <p className={css.empty}>Sin acciones disponibles en este frente.</p>}
        </div>)}</div>}
      </div>

      <div id="agenda" role="region" aria-labelledby="agenda-title" className={css.block}>
        <div className={css.heading}><h2 id="agenda-title">Agenda</h2><p>Hora argentina</p></div>
        <div className={css.agenda}>
          <div className={css.card}>
            <h3>Fechas operativas</h3>
            <p className={css.meta}>{dates ? "Supabase · consultado " + dateTime(dates.updatedAt) : "Supabase · consulta no disponible"}</p>
            {dates && <>
              <h4>Próximos 7 días</h4><AgendaList items={soon} tasks={tasks} />
              <details id="vencidos" className={css.details}><summary>Vencimientos atrasados · {overdue.length}</summary><AgendaList items={overdue} tasks={tasks} /></details>
              <details className={css.details}><summary>Fechas posteriores · {later.length}</summary><AgendaList items={later} tasks={tasks} /></details>
            </>}
          </div>
          <div className={css.card}>
            <h3>Calendario de UnderTango Club</h3>
            <p className={css.meta}>Google Calendar · próximos 30 días</p>
            {club?.updatedAt ? <>
              <p className={css.meta}>{club.partial ? "Consulta parcial" : "Consultado"} · {dateTime(club.updatedAt)}</p>
              {club.events.length ? <ul className={css.rows}>{club.events.map(event => <li key={event.id}>
                <time dateTime={event.date}>{deadlineDate(event.date)} · {event.time}</time><strong>{event.title}</strong><span className={css.meta}>{event.place}</span>
              </li>)}</ul> : <p className={css.empty}>Sin eventos en las fechas consultadas.</p>}
            </> : <p className={css.empty}>No pudimos consultar el calendario del Club.</p>}
            <p className={css.note}>Las fechas privadas registradas en el panel aparecen en Fechas operativas.</p>
          </div>
        </div>
      </div>

      <div id="explorar" role="region" aria-labelledby="explore-title" className={css.block}>
        <div className={css.heading}><h2 id="explore-title">Explorar</h2>
          <a href="/panel-de-control">Abrir panel de control ↗</a></div>
        {data && <>
          <h3>Todas las acciones por estado</h3>
          {groups.map(group => {
            const items = data.tasks.filter(task => group.stages.includes(task.stage));
            return <details className={css.details} key={group.label}><summary>{group.label} · {items.length}</summary>
              {items.length ? <ul className={css.explore}>{items.map(task => <TaskCard key={task.id} task={task} titles={titles} />)}</ul>
                : <p className={css.empty}>Sin acciones en este estado.</p>}
            </details>;
          })}
          <details className={css.details}><summary>Proyectos abiertos · {openProjects.length}</summary>
            <ul className={css.rows}>{[...openProjects].sort((a, b) => a.name.localeCompare(b.name, "es")).map(project => <li key={project.id}>
              <strong>{project.name}</strong><span className={css.meta}>{project.status} · {open.filter(task => task.projectIds.includes(project.id)).length} acciones abiertas</span>
            </li>)}</ul>
          </details>
        </>}
        <p className={css.note}><a href="/panel-de-control/finanzas">Abrir finanzas del panel ↗</a></p>
      </div>
    </div>
  </main>;
}
