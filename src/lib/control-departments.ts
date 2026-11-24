import { operationsConfig } from "./panel-operations";

type Assignment = { id: string; department: string | null };

export async function readControlDepartments(): Promise<Assignment[]> {
  const { url, key } = operationsConfig();
  const response = await fetch(`${url}/rest/v1/rpc/ut_control_departments_v1`, {
    method: "POST", headers: { apikey: key, "Content-Type": "application/json" },
    body: "{}", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error("No se pudieron leer los departamentos.");
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.some(row => !row || typeof row.id !== "string" ||
      (row.department !== null && (typeof row.department !== "string" || !/^8\d$/.test(row.department))))) {
    throw new Error("La lectura de departamentos está incompleta.");
  }
  return rows;
}
