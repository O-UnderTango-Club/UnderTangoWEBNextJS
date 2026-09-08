import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = path => ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText.replace('"./panel-preview"', JSON.stringify('data:text/javascript;base64,' + Buffer.from(ts.transpileModule(fs.readFileSync(new URL('../src/lib/panel-preview.ts', import.meta.url), 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText).toString('base64')));
const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const modelUrl = url(compile('../src/lib/panel-model.ts'));
const { F } = await import(modelUrl);
const m = await import(url(compile('../src/lib/panel-operations.ts').replace('"./panel-model"', JSON.stringify(modelUrl))));
const row = (id, fields) => ({ id, fields });
const fixture = () => ({ contract: 1, status: 'active', revision: '9007199254740993', updatedAt: '2026-09-07T23:00:00Z',
  projects: [row('p', { [F.projects.name]: 'Proyecto', [F.projects.rank]: 1 })],
  tasks: [row('t', { [F.tasks.name]: 'Acción', [F.tasks.projects]: ['p'], [F.tasks.result]: 'Historia conservada' })],
  events: [], cases: [],
});
let count = 0;
async function check(name, fn) { await fn(); count++; console.log('OK', name); }
await check('lectura tipada conserva historial y revisión bigint sin redondear', () => {
  const s = m.parseOperationsSnapshot(fixture());
  assert.equal(s.globalRevision, '9007199254740993');
  assert.equal(s.tasks[0].fields[F.tasks.result], 'Historia conservada');
});
await check('staged y validated no activan el panel', () => {
  for (const status of ['staged', 'validated']) {
    assert.throws(() => m.parseOperationsSnapshot({ ...fixture(), status }), /todavía/);
    assert.equal(m.parseOperationsSnapshot({ ...fixture(), status }, true).migrationStatus, status);
  }
});
await check('rechaza lecturas incompletas o contratos incompatibles', () => {
  for (const patch of [{ tasks: null }, { contract: 2 }, { revision: 5 }, { revision: '-1' }, { updatedAt: 'bad' }, { status: 'unknown' }]) {
    assert.throws(() => m.parseOperationsSnapshot({ ...fixture(), ...patch }), /incompleta/);
  }
});
await check('rechaza IDs duplicados y tipos de campo incorrectos', () => {
  const f = fixture(); f.tasks.push(f.tasks[0]); assert.throws(() => m.parseOperationsSnapshot(f));
  for (const fields of [{ [F.tasks.name]: { name: 'Raw Airtable select' } }, { [F.tasks.order]: '1' },
    { [F.tasks.projects]: ['p', 'p'] }, { unapproved: 'private data' }]) {
    assert.throws(() => m.parseOperationsSnapshot({ ...fixture(), tasks: [row('t', fields)] }));
  }
});
await check('rechaza relaciones faltantes aunque la respuesta HTTP sea exitosa', () => {
  const f = fixture(); f.projects = []; assert.throws(() => m.parseOperationsSnapshot(f), /incompleta/);
});
await check('no reutiliza Analytics ni claves públicas', () => {
  for (const env of [{}, { OPERATIONS_SUPABASE_URL: 'https://titmbxbymfajgmidfabn.supabase.co', OPERATIONS_SUPABASE_SECRET_KEY: 'sb_secret_test' },
    { OPERATIONS_SUPABASE_URL: 'https://lqsnrqnmmeyzcnurfpos.supabase.co', OPERATIONS_SUPABASE_SECRET_KEY: 'sb_publishable_test' }]) {
    assert.throws(() => m.operationsConfig(env), /conexión privada/);
  }
});
const env = { OPERATIONS_SUPABASE_URL: 'https://lqsnrqnmmeyzcnurfpos.supabase.co/', OPERATIONS_SUPABASE_SECRET_KEY: 'sb_secret_TEST_ONLY' };
await check('RPC usa apikey privado, sin bearer ni caché ni redirecciones', async () => {
  const s = await m.readOperationsSnapshot({ env, fetcher: async (endpoint, init) => {
    assert.equal(endpoint, 'https://lqsnrqnmmeyzcnurfpos.supabase.co/rest/v1/rpc/ut_panel_snapshot_v1');
    assert.equal(init.headers.apikey, env.OPERATIONS_SUPABASE_SECRET_KEY); assert.equal(init.headers.Authorization, undefined);
    assert.equal(init.cache, 'no-store'); assert.equal(init.redirect, 'error'); assert.equal(init.body, '{}');
    return Response.json(fixture());
  } }); assert.equal(s.source, 'supabase');
});
await check('no filtra errores privados ni reintenta ni usa Airtable', async () => {
  let calls = 0;
  await assert.rejects(m.readOperationsSnapshot({ env, fetcher: async () => { calls++; throw new Error(env.OPERATIONS_SUPABASE_SECRET_KEY); } }),
    e => e.status === 503 && !e.message.includes(env.OPERATIONS_SUPABASE_SECRET_KEY));
  assert.equal(calls, 1);
  await assert.rejects(m.readOperationsSnapshot({ env, fetcher: async () => new Response('secret upstream details', { status: 403 }) }),
    e => !e.message.includes('upstream') && e.status === 503);
});
await check('selección explícita: credenciales no activan Supabase; valores desconocidos fallan', () => {
  assert.equal(m.operationsSelected(env), false);
  assert.equal(m.operationsSelected({ ...env, PANEL_DATA_SOURCE: 'supabase' }), true);
  assert.throws(() => m.operationsSelected({ PANEL_DATA_SOURCE: 'typo' }));
});
const accessUrl = url(compile('../src/lib/panel-access.ts'));
const opsUrl = url(compile('../src/lib/panel-operations.ts').replace('"./panel-model"', JSON.stringify(modelUrl)));
const server = await import(url(compile('../src/lib/panel-server.ts').replace('"./panel-model"', JSON.stringify(modelUrl))
  .replace('"./panel-access"', JSON.stringify(accessUrl)).replace('"./panel-operations"', JSON.stringify(opsUrl))));
Object.assign(process.env, env, { PANEL_DATA_SOURCE: 'supabase' });
let db = fixture(), revision = 0, commitCalls = 0, readCalls = 0, failAfterCommit = false, race = false, lastPatches = [];
db.projects[0].fields = { ...db.projects[0].fields, [F.projects.status]: 'Activo', [F.projects.front]: 'Primario' };
db.projects.push(row('q', { [F.projects.name]: 'Segundo', [F.projects.status]: 'Activo', [F.projects.front]: 'Primario', [F.projects.rank]: 2 }));
db.tasks[0].fields = { ...db.tasks[0].fields, [F.tasks.status]: 'Pendiente', [F.tasks.gate]: 'Acción inmediata' };
const receipts = new Map();
const nativeFetch = globalThis.fetch;
globalThis.fetch = async (endpoint, init) => {
  assert.ok(String(endpoint).startsWith('https://lqsnrqnmmeyzcnurfpos.supabase.co/rest/v1/rpc/'), 'Never fall back to Airtable or Analytics');
  const body = JSON.parse(init.body);
  if (endpoint.endsWith('/ut_panel_snapshot_v1')) { readCalls++; return Response.json({ ...db, revision: String(revision) }); }
  if (endpoint.endsWith('/ut_panel_receipt_v1')) return Response.json(receipts.get(body.p_request_id) || null);
  assert.ok(endpoint.endsWith('/ut_panel_commit_v1')); commitCalls++;
  if (race) { revision++; race = false; }
  if (body.p_expected_revision !== String(revision)) return new Response('{}', { status: 409 });
  lastPatches = body.p_patches;
  for (const patch of lastPatches) {
    const group = { follow_ups: 'tasks', projects: 'projects', trigger_events: 'events' }[patch.table];
    const record = db[group].find(r => r.id === patch.id);
    assert.ok(record, 'This integration fixture updates existing records');
    Object.assign(record.fields, patch.fields);
  }
  revision++;
  const result = { ok: true, id: lastPatches[0].id, ids: lastPatches.map(p => p.id), requestId: body.p_request_id, revision: String(revision), savedAt: new Date().toISOString() };
  receipts.set(body.p_request_id, result);
  if (failAfterCommit) { failAfterCommit = false; throw new Error('network lost AFTER database committed'); }
  return Response.json(result);
};
const intent = async (kind, id, changes) => {
  const data = await server.snapshot(true);
  const group = { task: 'tasks', project: 'projects', event: 'events' }[kind];
  return { requestId: crypto.randomUUID(), snapshotRevision: data.globalRevision, kind, id,
    revision: server.revision(data[group].find(r => r.id === id)), changes };
};
try {
  await check('servidor expone fuente y revisión solamente desde snapshot activo', async () => {
    const response = server.responseBoard(await server.snapshot()); assert.equal(response.source, 'supabase');
    assert.equal(response.snapshotRevision, '0'); assert.equal(response.migrationAvailable, false);
    db.status = 'staged'; await assert.rejects(server.snapshot(), e => e.status === 503); db.status = 'active';
  });
  await check('una edición ajena invalida el formulario antes de escribir', async () => {
    const input = await intent('task', 't', { owner: 'Pablo' }); revision++;
    const before = commitCalls; await assert.rejects(server.mutate(input, 'test-actor'), e => e.status === 409);
    assert.equal(commitCalls, before);
  });
  await check('reordenación completa viaja en una sola transacción', async () => {
    const input = await intent('project', 'p', { front: 'Primario', rank: 2 });
    const before = commitCalls; const result = await server.mutate(input, 'test-actor');
    assert.equal(result.ok, true); assert.equal(commitCalls, before + 1); assert.equal(lastPatches.length, 2);
    assert.equal(db.projects.find(p => p.id === 'p').fields[F.projects.rank], 2);
    assert.equal(db.projects.find(p => p.id === 'q').fields[F.projects.rank], 1);
  });
  await check('cambio entre lectura y commit se rechaza sin escritura alternativa', async () => {
    const input = await intent('task', 't', { owner: 'No aplicar' }); race = true;
    await assert.rejects(server.mutate(input, 'test-actor'), e => e.status === 409);
    assert.notEqual(db.tasks[0].fields[F.tasks.owner], 'No aplicar');
  });
  await check('respuesta perdida se recupera sin repetir escritura ni evidencia', async () => {
    const input = await intent('task', 't', { stage: 'done', evidence: 'Resultado de prueba' });
    failAfterCommit = true;
    await assert.rejects(server.mutate(input, 'test-actor'), e => e.status === 503);
    const beforeCommit = commitCalls, beforeRead = readCalls;
    const result = await server.mutate(input, 'test-actor');
    assert.equal(result.ok, true); assert.equal(commitCalls, beforeCommit); assert.equal(readCalls, beforeRead);
    const evidence = db.tasks[0].fields[F.tasks.result];
    assert.ok(evidence.startsWith('Historia conservada')); assert.equal(evidence.split('Resultado de prueba').length, 2);
  });
} finally { globalThis.fetch = nativeFetch; delete process.env.PANEL_DATA_SOURCE; }
await check('preview usa solo RPC limitado; staged no activa producción ni consume Airtable', async () => {
  const config = { publishableKey: 'sb_publishable_test', readToken: '1'.repeat(64), deviceSecret: '2'.repeat(64), bootstrapHash: '3'.repeat(64), expiresAt: Date.now()+3600000 };
  const env = { VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'codex/supabase-operativo-preview', OPERATIONS_PREVIEW_CONFIG: JSON.stringify(config) };
  assert.equal(m.operationsSelected(env), true);
  assert.equal(m.operationsSelected({...env,VERCEL_ENV:'production'}), false);
  assert.equal(m.operationsSelected({...env,VERCEL_GIT_COMMIT_REF:'other'}), false);
  let calls=0;
  const result=await m.readOperationsSnapshot({env,fetcher:async (url,options)=>{
    calls++; assert.equal(url,'https://lqsnrqnmmeyzcnurfpos.supabase.co/rest/v1/rpc/ut_panel_preview_v1');
    assert.equal(options.headers.apikey,config.publishableKey);
    assert.deepEqual(JSON.parse(options.body),{p_token:config.readToken});
    assert.equal(options.redirect,'error'); assert.equal(options.cache,'no-store');
    return new Response(JSON.stringify({...fixture(),status:'staged'}));
  }});
  assert.equal(calls,1); assert.equal(result.migrationStatus,'staged');
  for(const bad of ['',JSON.stringify({...config,expiresAt:0}),JSON.stringify({...config,publishableKey:'sb_secret_FORBIDDEN'})]) {
    await assert.rejects(m.readOperationsSnapshot({env:{...env,OPERATIONS_PREVIEW_CONFIG:bad},fetcher:()=>{throw new Error('Must not call any backend');}}),/prueba/);
  }
});
console.log(`${count} relational adapter and server checks passed`);
