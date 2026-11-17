type ClubEvent = { id: string; date: string; time: string; title: string; place: string };
type ClubMonth = { events: ClubEvent[]; live: boolean; source: string; updatedAt: string };

export async function readClubCalendar(today: string, until: string) {
  const months: string[] = [];
  const monthStart = new Date(today.slice(0, 7) + "-01T12:00:00Z");
  while (monthStart.toISOString().slice(0, 10) <= until) {
    months.push(monthStart.toISOString().slice(0, 7));
    monthStart.setUTCMonth(monthStart.getUTCMonth() + 1);
  }
  const results = await Promise.allSettled(months.map(async (key) => {
    const [year, month] = key.split("-");
    const url = new URL("https://www.undertangoclub.com/api/calendario");
    url.search = new URLSearchParams({ year, month }).toString();
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000), redirect: "error" });
    if (!response.ok) throw new Error("Calendario no disponible");
    const data: ClubMonth = await response.json();
    if (data.live !== true || data.source !== "google-calendar" || !Array.isArray(data.events) ||
        !Number.isFinite(Date.parse(data.updatedAt))) throw new Error("Consulta sin confirmar");
    return data;
  }));
  const available = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);
  return {
    partial: available.length > 0 && available.length < months.length,
    updatedAt: available.map(month => month.updatedAt).sort()[0],
    events: available.flatMap(month => month.events)
      .filter(event => event.date >= today && event.date <= until)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
  };
}
