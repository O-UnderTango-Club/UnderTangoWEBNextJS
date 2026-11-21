import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const modules = new Map();
function load(name) {
  if (modules.has(name)) return modules.get(name);
  let source = ts.transpileModule(fs.readFileSync(`src/lib/${name}.ts`, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
  }).outputText;
  source = source.replace(/(['"])\.\/([a-z-]+)\1/g, (_, quote, dep) => JSON.stringify(load(dep)));
  const uri = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  modules.set(name, uri);
  return uri;
}
const { F, board, classify, finishTodayChanges } = await import(load("panel-model"));
const { applyGroupPlan } = await import(load("action-groups"));
const { mutate, revision } = await import(load("panel-server"));

const task = (id, rank, gate, extra = {}) => ({ id, fields: {
  [F.tasks.name]: id, [F.tasks.front]: "Secundario", ...(rank === null ? {} : { [F.tasks.rank]: rank }), [F.tasks.status]: "Pendiente",
  [F.tasks.gate]: gate, [F.tasks.weekdays]: 127, ...extra,
} });
const recurring = task("recurring", 1, "Acción recurrente", { [F.tasks.weekdays]: 21 });
const immediate = task("ordinary", 2, "Acción inmediata");
const scheduled = task("scheduled", 3, "Acción recurrente", { [F.tasks.activateAt]: "2099-11-25T03:00:00.000Z" });
const group = task("group", 4, "Acción inmediata", { [F.tasks.kind]: "group" });
const member = task("member", null, "Acción recurrente", {
  [F.tasks.kind]: "action", [F.tasks.group]: "group", [F.tasks.groupOrder]: 1, [F.tasks.front]: "",
});
let db = {
  contract: 4, revision: "1", rankingMode: "action", status: "active",
  updatedAt: "2026-11-23T15:00:00Z", projects: [], events: [], cases: [],
  tasks: [recurring, immediate, scheduled, group, member],
};
const now = Date.parse("2026-11-23T15:00:00Z");
const baseStage = id => board(db, now).tasks.find(t => t.id === id).baseStage;
assert.equal(baseStage("ordinary"), "ready", "all-days default is not recurrent");
assert.equal(classify(scheduled, db, now).stage, "scheduled");
assert.equal(baseStage("scheduled"), "recurring");
const rest = finishTodayChanges(recurring, db, now);
assert.equal(rest.stage, "recurring");
assert.equal(rest.activateAt, "2026-11-24T03:00:00.000Z");
const rested = { ...recurring, fields: { ...recurring.fields, [F.tasks.activateAt]: rest.activateAt } };
assert.equal(classify(rested, db, now).nextAvailableAt, "2026-11-25T03:00:00.000Z");
assert.equal(classify(rested, db, Date.parse("2026-11-25T03:00:00Z")).stage, "recurring");

Object.assign(process.env, {
  PANEL_DATA_SOURCE: "supabase", PANEL_ACTION_GROUPS: "1", VERCEL_ENV: "production",
  OPERATIONS_SUPABASE_URL: "https://lqsnrqnmmeyzcnurfpos.supabase.co",
  OPERATIONS_SUPABASE_SECRET_KEY: "sb_secret_TEST_ONLY",
});
const receipts = new Map();
let commits = 0;
globalThis.fetch = async (url, init) => {
  const body = JSON.parse(init.body);
  if (url.endsWith("/ut_panel_receipt_v1")) return Response.json(receipts.get(body.p_request_id) || null);
  if (url.endsWith("/ut_panel_snapshot_v6")) return Response.json(db);
  assert.ok(url.endsWith("/ut_panel_commit_v2"), String(url));
  assert.equal(body.p_expected_revision, db.revision);
  const id = body.p_patches[0].id;
  db = { ...applyGroupPlan(db, body.p_patches), revision: String(Number(db.revision) + 1) };
  const receipt = { ok: true, id, ids: [id], requestId: body.p_request_id, revision: db.revision, savedAt: new Date().toISOString() };
  receipts.set(body.p_request_id, receipt);
  commits++;
  return Response.json(receipt);
};
const intent = (id, operation) => ({
  kind: "task", origin: "central-control", centralAction: operation, id,
  revision: revision(db.tasks.find(t => t.id === id)), snapshotRevision: db.revision,
  requestId: crypto.randomUUID(),
  changes: operation === "finish" ? { stage: "done", evidence: "Finalización en prueba." } : { doneToday: true },
});
for (const id of ["recurring", "scheduled", "member"]) {
  await assert.rejects(mutate(intent(id, "finish"), "test"), { status: 409, message: /acción recurrente/ });
}
await assert.rejects(mutate(intent("group", "finish"), "test"), { status: 409, message: /grupos/ });
assert.equal(commits, 0, "rejected closes must not write");
const realDateNow = Date.now;
try {
  Date.now = () => now;
  const request = intent("recurring", "doneToday");
  const receipt = await mutate(request, "test");
  assert.deepEqual(await mutate(request, "test"), receipt);
  const after = db.tasks.find(t => t.id === "recurring").fields;
  assert.equal(after[F.tasks.status], "Pendiente");
  assert.equal(after[F.tasks.gate], "Acción recurrente");
  assert.equal(after[F.tasks.weekdays], 21);
  assert.equal(after[F.tasks.activateAt], "2026-11-24T03:00:00.000Z");
  assert.equal(after[F.tasks.rank], 1);
} finally {
  Date.now = realDateNow;
}
assert.equal(commits, 1, "same request remains idempotent");
await mutate(intent("ordinary", "finish"), "test");
assert.equal(db.tasks.find(t => t.id === "ordinary").fields[F.tasks.status], "Hecho");
assert.equal(db.tasks.find(t => t.id === "member").fields[F.tasks.status], "Pendiente");
console.log("OK: stored recurring type, Argentine weekday recurrence, canonical writes, idempotence and Central finish safeguards");
