import type { Board } from "./panel-model";

type Task = Board["tasks"][number];
type Assignment = { id: string; department: string | null };
export type CentralMode = "overview" | "urgent" | "dates" | "priority";
type Entry = { task: Task; members: Task[]; otherDays: Task[]; due: string };

export function isOpenAction(task: Task) {
  return task.stage !== "done" && task.stage !== "cancelled";
}

export function centralSnapshotTasks(tasks: Task[]) {
  const openGroups = new Set(tasks.filter(task => task.isGroup && isOpenAction(task)).map(task => task.id));
  return tasks.filter(task => isOpenAction(task) || openGroups.has(task.groupId));
}

export function daysUntil(due: string, today: string) {
  return (Date.parse(due.slice(0, 10) + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000;
}

export function centralActionView(tasks: Task[], assignments: Assignment[], fronts: Board["fronts"],
  department: string | null, mode: CentralMode, today: string) {
  const byId = new Map(tasks.map(task => [task.id, task]));
  const departmentById = new Map(assignments.map(row => [row.id, row.department]));
  const departmentOf = (row: Task) => departmentById.get(row.id) || "unassigned";
  const byDate = mode === "urgent" || mode === "dates";
  const dayBit = 1 << ((new Date(today + "T12:00:00Z").getUTCDay() + 6) % 7);
  const appearsToday = (row: Task) => !!((row.weekdays & row.parentWeekdays) & dayBit);
  const highlighted = new Set(fronts.flatMap(front => front.tasks));
  const counts: Record<string, number> = {};
  const visible: Entry[] = [];
  const rest: Entry[] = [];
  let total = 0;

  // The board supplies both the front ranking and the saved order of each group's members.
  for (const task of tasks) {
    if (task.groupId || !isOpenAction(task)) continue;
    total++;
    const members = task.memberIds.map(id => byId.get(id)).filter((member): member is Task => !!member);
    const openRows = [task, ...members.filter(isOpenAction)];
    for (const code of new Set(openRows.map(departmentOf))) counts[code] = (counts[code] || 0) + 1;

    const matches = openRows.filter(row => {
      if (department && departmentOf(row) !== department) return false;
      switch (mode) {
        case "urgent": return !!row.due && daysUntil(row.due, today) <= 7;
        case "dates": return !!row.due;
        case "priority": return /alta|urgente|cr[ií]tica/i.test(row.priority);
        default: return true;
      }
    });
    if (!matches.length) continue;
    const todaysMatches = matches.filter(appearsToday);
    if (mode !== "overview" && !todaysMatches.length) continue;
    const due = byDate ? todaysMatches.map(row => row.due).sort()[0] : task.due;
    if (mode === "overview" && (!highlighted.has(task.id) || !todaysMatches.length)) {
      rest.push({task, members, otherDays: [], due});
    } else {
      visible.push({task, members: members.filter(appearsToday), otherDays: members.filter(member => !appearsToday(member)), due});
    }
  }
  if (byDate) {
    visible.sort((a, b) => a.due.localeCompare(b.due) || a.task.name.localeCompare(b.task.name, "es"));
  }
  return { visible, rest, total, counts, departmentById };
}
