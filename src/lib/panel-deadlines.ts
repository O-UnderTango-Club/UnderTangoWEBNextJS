export const DEADLINE_KINDS = {
  deadline: "Vencimiento / entrega", confirmed: "Evento confirmado",
  tentative: "Tentativo", conditional: "Condicional",
} as const;
export type DeadlineKind = keyof typeof DEADLINE_KINDS;
export type DeadlineItem = {
  id: string; source: "agenda" | "task" | "operation" | "case" | "project";
  sourceId: string; title: string; date: string; time: string; kind: DeadlineKind;
  status: string; priority: string; detail: string; url: string; taskId: string | null;
};
export type DeadlineSnapshot = {
  contract: 1; source: "supabase"; timezone: "America/Argentina/Cordoba";
  today: string; updatedAt: string; revision: string; items: DeadlineItem[];
};
export function validDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T12:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
export function safeDeadlineUrl(value: string): string | undefined {
  if (/\s/.test(value)) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : undefined; }
  catch { return undefined; }
}
export function parseDeadlines(value: unknown): DeadlineSnapshot {
  const invalid = () => new Error("No se pudo verificar la agenda de Supabase.");
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid();
  const v = value as Record<string, unknown>;
  if (v.contract !== 1 || v.source !== "supabase" || v.timezone !== "America/Argentina/Cordoba" ||
    !validDay(v.today) || typeof v.updatedAt !== "string" || !Number.isFinite(Date.parse(v.updatedAt)) ||
    typeof v.revision !== "string" || !/^\d+$/.test(v.revision) || !Array.isArray(v.items)) throw invalid();
  const ids = new Set<string>();
  const items = v.items.map((row: unknown) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw invalid();
    const item = row as Record<string, unknown>;
    for (const key of ["id","source","sourceId","title","date","time","kind","status","priority","detail","url"])
      if (typeof item[key] !== "string") throw invalid();
    if (!item.id || !item.title || ids.has(item.id as string) || !validDay(item.date) ||
      !Object.hasOwn(DEADLINE_KINDS, item.kind as string) ||
      !["agenda","task","operation","case","project"].includes(item.source as string) ||
      !["","Alta","Media","Baja","Crítica"].includes(item.priority as string) ||
      (item.taskId !== null && typeof item.taskId !== "string")) throw invalid();
    ids.add(item.id as string);
    return { ...item } as DeadlineItem;
  });
  return { ...v, items: sortDeadlines(items) } as DeadlineSnapshot;
}
const priorityOrder: Record<string,number> = { "Crítica":0, Alta:1, Media:2, Baja:3 };
export function sortDeadlines(items: DeadlineItem[]) {
  return [...items].sort((a,b) => a.date.localeCompare(b.date) ||
    (a.time || "99:99").localeCompare(b.time || "99:99") ||
    (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4) ||
    a.title.localeCompare(b.title,"es") || a.id.localeCompare(b.id));
}
export function deadlineWindow(data: DeadlineSnapshot, days: number | null) {
  const until = days === null ? null : new Date(Date.parse(data.today+"T12:00:00Z") + days*86400000).toISOString().slice(0,10);
  return {
    upcoming: sortDeadlines(data.items.filter(item => item.date >= data.today && (!until || item.date <= until))),
    overdue: sortDeadlines(data.items.filter(item => item.date < data.today && item.kind === "deadline")),
  };
}
export function deadlineDate(day: string) {
  return new Intl.DateTimeFormat("es-AR", { timeZone:"America/Argentina/Cordoba",weekday:"short",day:"numeric",month:"short",year:"numeric" }).format(new Date(day+"T12:00:00Z"));
}
