import type { Board } from "./panel-model";

/** Presentation only: the board remains the source of action positions and daily slots. */
export function frontProjectGroups(data: Board, front: Board["fronts"][number]) {
  const open = data.tasks.filter(t => ["ready", "recurring"].includes(t.stage));
  const inFront = open.filter(t => t.front === front.name);
  const priorityIds = new Set(front.tasks);
  const groups = data.projects.filter(p => inFront.some(t => t.projectIds.includes(p.id))).map(project => {
    const tasks = open.filter(t => t.projectIds.includes(project.id));
    const local = inFront.filter(t => t.projectIds.includes(project.id));
    return { id: project.id, name: project.name, tasks, local, priority: local.filter(t => priorityIds.has(t.id)) };
  });
  const unlinked = inFront.filter(t => !data.projects.some(p => t.projectIds.includes(p.id)));
  if (unlinked.length) groups.push({ id: "__unlinked", name: "Acciones sin proyecto", tasks: unlinked, local: unlinked, priority: unlinked.filter(t => priorityIds.has(t.id)), history: [] });
  const rank = (tasks: typeof open) => Math.min(...tasks.map(t => t.rank > 0 ? t.rank : Number.MAX_SAFE_INTEGER));
  return groups.sort((a, b) => Number(!!b.priority.length) - Number(!!a.priority.length) || rank(a.priority.length ? a.priority : a.local) - rank(b.priority.length ? b.priority : b.local) || a.name.localeCompare(b.name, "es"));
}
