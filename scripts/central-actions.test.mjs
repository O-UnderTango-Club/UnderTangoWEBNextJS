import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

async function load(name) {
  const source = fs.readFileSync(`src/lib/${name}.ts`, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  });
  return import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));
}
const { F, board } = await load("panel-model");
const { centralSnapshotTasks, centralActionView } = await load("central-actions");
const f = F.tasks;
const day = "2026-11-24";
const task = (id, fields) => ({ id, fields: {
  [f.name]: id, [f.status]: "Pendiente", [f.gate]: "Acción inmediata", ...fields,
} });
const ranked = (id, rank, fields) => task(id, { [f.front]: "Primario", [f.rank]: rank, ...fields });
const step = (id, group, order, fields) => task(id, { [f.group]: group, [f.groupOrder]: order, ...fields });
const finished = { [f.status]: "Hecho", [f.gate]: "Terminada" };
const raw = [
  ranked("waiting-group", 1, { [f.kind]: "group" }),
  step("blocked", "waiting-group", 1, { [f.dependencies]: ["single"] }),
  ranked("group", 2, { [f.kind]: "group" }),
  step("alpha", "group", 2, { [f.due]: "2026-11-25", [f.priority]: "Alta" }),
  step("resolved", "group", 3, { ...finished, [f.due]: "2026-10-01", [f.priority]: "Alta" }),
  step("zeta", "group", 1, { [f.due]: "2026-12-10" }),
  ranked("single", 3, { [f.due]: "2026-11-27" }),
  ranked("third", 4), ranked("extra", 5),
  ranked("closed-group", 6, { [f.kind]: "group", ...finished }),
  step("old-step", "closed-group", 1, finished), ranked("old-single", 7, finished),
];
const data = board({ rankingMode: "action", tasks: raw, projects: [], events: [], cases: [], updatedAt: day },
  Date.parse(day + "T15:00:00Z"));
const tasks = centralSnapshotTasks(data.tasks);
assert.ok(tasks.some(task => task.id === "resolved"));
assert.ok(!tasks.some(task => ["closed-group", "old-step", "old-single"].includes(task.id)));
const assignments = Object.entries({
  group: "87", alpha: "88", zeta: "87", resolved: "81", single: "88",
}).map(([id, department]) => ({ id, department }));
const view = (mode = "overview", department = null) =>
  centralActionView(tasks, assignments, data.fronts, department, mode, day);
const ids = entries => entries.map(entry => entry.task.id);
const all = view();
assert.deepEqual(ids(all.visible), ["group", "single", "third"]);
assert.deepEqual(ids(all.rest), ["waiting-group", "extra"]);
assert.deepEqual(all.visible[0].members.map(task => task.id), ["zeta", "alpha", "resolved"]);
assert.equal(all.total, 5);
assert.deepEqual(all.counts, { "87": 1, "88": 2, unassigned: 3 });
assert.deepEqual(ids(view("overview", "88").visible), ["group", "single"]);
assert.deepEqual(ids(view("overview", "81").visible), []);
assert.deepEqual(ids(view("overview", "unassigned").rest), ["waiting-group", "extra"]);
assert.deepEqual(ids(view("dates").visible), ["group", "single"]);
assert.equal(view("dates").visible[0].due, "2026-11-25");
assert.equal(view("dates", "87").visible[0].due, "2026-12-10");
assert.deepEqual(ids(view("urgent", "87").visible), []);
assert.deepEqual(ids(view("urgent", "88").visible), ["group", "single"]);
assert.deepEqual(ids(view("priority", "87").visible), []);
assert.deepEqual(ids(view("priority", "88").visible), ["group"]);
console.log("OK: grupos, orden de pasos, tres puestos por frente, espera, departamentos, fechas y prioridad");

const fridayGroup = ranked("weekly-group", 1, { [f.kind]: "group" });
const fridayStep = step("friday", "weekly-group", 1, { [f.weekdays]: 16, [f.priority]: "Alta" });
const exceptMonday = step("except-monday", "weekly-group", 2, { [f.weekdays]: 126 });
const week = { rankingMode: "action", tasks: [fridayGroup, fridayStep, exceptMonday, ranked("fallback",2)], projects: [], cases: [], events: [] };
function weeklyView(day, mode = "overview") {
  const data = board(week, Date.parse(day + "T15:00:00Z"));
  return centralActionView(data.tasks, [], data.fronts, null, mode, day);
}
const thursday = weeklyView("2026-11-26");
assert.deepEqual(thursday.visible[0].members.map(t => t.id), ["except-monday"]);
assert.deepEqual(thursday.visible[0].otherDays.map(t => t.id), ["friday"]);
assert.equal(weeklyView("2026-11-26","priority").visible.length,0);
assert.deepEqual(weeklyView("2026-11-27").visible[0].members.map(t => t.id), ["friday","except-monday"]);
const monday = weeklyView("2026-11-30");
assert.deepEqual(ids(monday.visible), ["fallback"]);
assert.deepEqual(monday.rest[0].members.map(t => t.id), ["friday","except-monday"]);
