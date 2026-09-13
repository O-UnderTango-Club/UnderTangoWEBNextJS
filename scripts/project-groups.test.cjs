const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
  const module = { exports: {} };
  new Function('module', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText)(module, module.exports);
  return module.exports;
}
const { frontProjectGroups } = load('src/lib/panel-project-groups.ts');
const { board, F } = load('src/lib/panel-model.ts');
const project = id => ({ id, fields: { [F.projects.name]:id, [F.projects.status]:'Activo' } });
const task = (id, rank, projects, extra={}) => ({id, fields:{[F.tasks.name]:id,[F.tasks.front]:'Secundario',[F.tasks.rank]:rank,[F.tasks.projects]:projects,[F.tasks.status]:'Pendiente',[F.tasks.gate]:'Acción inmediata',...extra}});
const snapshot = {rankingMode:'action',projects:['Brasil','Otro','Compartido'].map(project),cases:[],events:[],updatedAt:'2026-09-13T00:00:00Z',tasks:[
  task('primera',1,['Brasil']),task('intercalada',2,['Otro']),task('segunda',3,['Brasil']),
  task('más abajo',12,['Brasil']),task('compartida',13,['Brasil','Compartido']),
  task('espera',4,['Otro'],{[F.tasks.activateAt]:'2099-01-01T03:00:00Z'}),
  task('otro frente',1,['Brasil'],{[F.tasks.front]:'Terciario'}),
  task('cerrada',20,['Brasil'],{[F.tasks.status]:'Hecho'}),task('sin proyecto',21,[])
]};
const data = board(snapshot,Date.parse(snapshot.updatedAt));
const before = JSON.stringify(data);
const front = data.fronts.find(f=>f.name==='Secundario');
const groups = frontProjectGroups(data,front);
assert.deepEqual(front.tasks,['primera','intercalada','segunda']);
assert.deepEqual(groups.map(g=>g.name),['Brasil','Otro','Compartido']);
assert.equal(groups.filter(g=>g.id==='Brasil').length,1);
assert.deepEqual(groups[0].priority.map(t=>t.rank),[1,3]);
assert.deepEqual(groups[0].local.map(t=>t.rank),[1,3,12,13]);
assert.ok(groups[0].tasks.some(t=>t.id==='otro frente'));
assert.ok(!groups[0].tasks.some(t=>t.id==='cerrada'));
assert.equal(groups[0].tasks.find(t=>t.id==='compartida'),groups[2].tasks[0]);
assert.equal(JSON.stringify(data),before,'Grouping must never mutate action positions or counts');
const later = board({...snapshot,tasks:snapshot.tasks.map(t=>t.id==='primera'?{...t,fields:{...t.fields,[F.tasks.activateAt]:'2099-01-01T03:00:00Z'}}:t)},Date.parse(snapshot.updatedAt));
const next = later.fronts.find(f=>f.name==='Secundario');
assert.deepEqual(next.tasks,['intercalada','segunda','más abajo']);
assert.deepEqual(frontProjectGroups(later,next).map(g=>g.id).slice(0,2),['Otro','Brasil']);
assert.ok(!frontProjectGroups(later,next).find(g=>g.id==='Brasil').tasks.some(t=>t.id==='primera'));
assert.ok(later.tasks.some(t=>t.id==='primera'&&t.rank===1&&t.stage==='scheduled'));
const allDeferred={...data,tasks:data.tasks.map(t=>t.projectIds.includes('Brasil')?{...t,stage:'scheduled'}:t)};
assert.ok(!frontProjectGroups(allDeferred,front).some(g=>g.id==='Brasil'));
assert.ok(frontProjectGroups(later,next).every(g=>g.tasks.every(t=>['ready','recurring'].includes(t.stage))));
const tomorrow=board({...snapshot,tasks:snapshot.tasks.map(t=>t.id==='primera'?{...t,fields:{...t.fields,[F.tasks.activateAt]:'2026-09-13T03:00:00Z',[F.tasks.gate]:'Acción recurrente'}}:t)},Date.parse('2026-09-13T03:00:00Z'));
assert.ok(frontProjectGroups(tomorrow,tomorrow.fronts.find(f=>f.name==='Secundario')).find(g=>g.id==='Brasil').tasks.some(t=>t.id==='primera'&&t.rank===1&&t.stage==='recurring'));
assert.deepEqual(frontProjectGroups(data,data.fronts.find(f=>f.name==='Primario')),[]);
console.log('Project grouping passed: active actions only, daily removal, empty project removal, same-position reactivation and shared identity');
