const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(relative, replacements = {}) {
  const filename = path.resolve(__dirname, relative);
  const mod = new Module(filename, module);
  mod.filename = filename; mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = mod.require.bind(mod);
  mod.require = id => id in replacements ? replacements[id] : ['./ActionGroup','./Deadlines','./GroupForm','./WeekdayPicker'].includes(id) ? {default:()=>null} : originalRequire(id);
  const source = fs.readFileSync(filename, 'utf8').replace('function EditForm(', 'export function EditForm(').replace('function QuickForm(', 'export function QuickForm(');
  mod._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
  return mod.exports;
}
const model = load('../src/lib/panel-model.ts');
const grouping = load('../src/lib/panel-dependencies.ts');
const dependencies = load('../app/panel-de-control/Dependencies.tsx', {'../../src/lib/panel-model':model,'../../src/lib/panel-dependencies':grouping,'./panel.module.css':{default:{}}});
const projectGroups = load('../src/lib/panel-project-groups.ts');
const frontProjects = load('../app/panel-de-control/FrontProjects.tsx', {'../../src/lib/panel-model':model,'../../src/lib/panel-project-groups':projectGroups,'./panel.module.css':{default:{}}});
const weekdayPicker = load('../app/panel-de-control/WeekdayPicker.tsx', {'../../src/lib/panel-model':model,'./panel.module.css':{default:{}}});
const panelModules = {'../../src/lib/panel-model':model,'./Dependencies':dependencies,'./WeekdayPicker':weekdayPicker,'./panel.module.css':{default:{}}};
const { EditForm } = load('../app/panel-de-control/Panel.tsx', panelModules);
const data = { rankingMode:'action',source:'supabase',projects:[],tasks:[],events:[],cases:[] };
const front = {name:'Primario',tasks:['a']};
const projectBoard = {...data,projects:[{id:'p',name:'Proyecto compartido'}],tasks:[{id:'a',stage:'ready',projectIds:['p','q'],front:'Primario',rank:1}]};
const projectMarkup = renderToStaticMarkup(React.createElement(frontProjects.default,{data:projectBoard,front,renderTask(){return null;},async onFinishToday(){},disabled:true}));
assert.match(projectMarkup,/Por hoy está bien con Proyecto compartido/);
assert.match(projectMarkup,/<button[^>]*disabled=""[^>]*>Por hoy está bien/);
assert.match(projectMarkup,/acciones compartidas también descansan/);
const unlinkedMarkup = renderToStaticMarkup(React.createElement(frontProjects.default,{data:{...projectBoard,projects:[]},front,renderTask(){return null;},async onFinishToday(){},disabled:false}));
assert.doesNotMatch(unlinkedMarkup,/Por hoy está bien/);
const render = (editor, extra = {}) => renderToStaticMarkup(React.createElement(EditForm, { editor, data, busy:false, onClose(){}, async onSave(){}, async onCreateProject(){return 'p';}, ...extra }));
const project = render({kind:'project',initial:{name:'Proyecto nuevo',purpose:'Resultado',status:'Activo',doc:''}});
assert.match(project, /Crear proyecto/); assert.match(project, /Nombre del proyecto/);
assert.match(project, /Propósito/); assert.doesNotMatch(project, /Posición en el frente/);
assert.doesNotMatch(project, /option[^>]*>Archivado/);
const task = render({kind:'task',initial:{name:'Borrador intacto',stage:'ready',projects:[],cases:[],dependencies:[],events:[]}});
assert.match(task, /Borrador intacto/); assert.match(task, /Crear proyecto y seleccionarlo/);
assert.match(task, /Proyectos vinculados/); assert.match(task, /la acción se guarda por separado/);
const readOnly = render({kind:'project',initial:{name:'Prueba',status:'Activo'}},{data:{...data,readOnly:true}});
assert.match(readOnly, /fieldset disabled/);
assert.match(task, /Sin proyecto vinculado/);
for (const control of ["edit-front","edit-rank","edit-comment"]) assert.ok(task.includes(`id="${control}"`),control);
const purchaseName = 'Comprar artículos de limpieza';
const shoppingList = '- Detergente\n- Guantes\n- Bolsas';
const purchase = {kind:'task',id:'purchase',initial:{name:purchaseName,description:shoppingList,front:"Primario",rank:2,stage:'ready',order:21,projects:['direct'],cases:['case'],dependencies:['earlier'],events:['event']}};
const linkedData = {...data,projects:[{id:'direct',name:'Proyecto directo',open:true},{id:'inherited',name:'Proyecto del caso',open:true}],cases:[{id:'case',name:'Caso',projectIds:['inherited']}]};
const unlinked = {...purchase,initial:{...purchase.initial,description:'',projects:[],cases:[],dependencies:[],events:[]}};
const contextual = render(purchase,{embedded:true,data:linkedData});
for (const markup of [contextual,render(unlinked,{embedded:true})]) {
  assert.doesNotMatch(markup, /<h2|>Acción<|Descripción registrada|Sin proyecto vinculado|Proyecto directo|Proyecto del caso|Proyectos vinculados|Crear proyecto|Caso relacionado|Qué falta para poder empezar|Frente de la acción|Posición \(0: al final\)|Agregar comentario|id="edit-(?:front|rank|comment)"/);
  for (const label of ['Acción concreta','Estado de la acción','Contexto del proyecto','Vencimiento','Activar en','Prioridad','Qué días aparece en Frentes','Documento de apoyo en Drive / Docs','Responsable','Cancelar','Guardar']) assert.ok(markup.includes(label),label);
  assert.ok(markup.indexOf('Documento de apoyo') < markup.indexOf('Responsable'));
  assert.match(markup, /<footer>.*>Cerrar<.*>Cancelar<.*>Guardar en/);
}
assert.equal(contextual.split(purchaseName).length,2,'El título solo aparece en el campo editable');
assert.ok(contextual.includes(shoppingList));
assert.doesNotMatch(contextual, /Paso en el plan|id="edit-order"/);
assert.match(contextual, /<details><summary>Referencia de orden anterior/);
console.log('Project/action rendering checks passed: existing actions with and without project links and creation controls');

// Exercise the form submission without a browser or any production writes.
let availabilityMode="now", quickEvidence, stateIndex=0;
const { QuickForm } = load('../app/panel-de-control/Panel.tsx', {
  '../../src/lib/panel-model':model,'./Dependencies':dependencies,'./FrontProjects':frontProjects,'./panel.module.css':{default:{}},
  react:{...React,useRef:()=>({current:null}),useEffect(){},useState:initial=>[stateIndex++===4&&quickEvidence!==undefined?quickEvidence:initial==="now"?availabilityMode:initial,()=>{}]}
});
const scheduledTask={id:'scheduled',name:'Recurrente para mañana',baseStage:'recurring',stage:'scheduled',front:'Primario',rank:1,activateAt:'2099-01-01T03:00:00Z',dependencies:[],eventIds:[]};
const quickEditor={kind:'task',id:'scheduled',mode:'status',initial:{stage:'recurring',front:'Primario',rank:1,reason:'',dependencies:[],events:[]}};
function findElement(node,predicate){
 if(!node||typeof node!=='object')return;
 if(predicate(node))return node;
 for(const child of React.Children.toArray(node.props?.children)){const found=findElement(child,predicate);if(found)return found;}
}
(async()=>{
 let submitted;
 let draft = purchase.initial;
 const { EditForm: EditableForm } = load('../app/panel-de-control/Panel.tsx', {
  ...panelModules,
  react:{...React,useState:initial=>initial===purchase.initial?[draft,update=>{draft=update(draft);}]:[initial,()=>{}]},
 });
 const edit = () => EditableForm({editor:purchase,data:linkedData,onSave:async changes=>{submitted=changes;}});
 await findElement(edit(),n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.deepEqual(submitted,{},'Una descripción intacta y los vínculos ocultos no se envían');
 const context = findElement(edit(),n=>n.props?.id==='edit-description');
 assert.equal(context.props.value,shoppingList);
 const updatedList = shoppingList+'\n- Esponjas';
 context.props.onChange({target:{value:updatedList}});
 await findElement(edit(),n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.deepEqual(submitted,{description:updatedList});

 const tree=QuickForm({editor:quickEditor,data:{...data,tasks:[scheduledTask]},busy:false,onSave:async changes=>{submitted=changes;}});
 const button=findElement(tree,n=>n.type==='button'&&n.props.children==='Guardar estado');
 assert.equal(button.props.disabled,false,'Same recurring state can still be reactivated');
 assert.ok(findElement(tree,n=>n.props?.id==='quick-availability'));
 await findElement(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.deepEqual(submitted,{stage:'recurring',activateAt:'',dependencies:[],events:[]});
 availabilityMode='scheduled';
 const kept=QuickForm({editor:{...quickEditor,initial:{...quickEditor.initial,stage:'ready'}},data:{...data,tasks:[scheduledTask]},busy:false,onSave:async changes=>{submitted=changes;}});
 await findElement(kept,n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.deepEqual(submitted,{stage:'ready',dependencies:[],events:[]},'Keeping schedule must not remove activation');
 availabilityMode='now';
 const waiting=QuickForm({editor:{...quickEditor,initial:{...quickEditor.initial,stage:'waiting',dependencies:['pending']}},data:{...data,tasks:[scheduledTask,{id:'pending',name:'Pendiente',stage:'ready'}]},busy:false,onSave:async changes=>{submitted=changes;}});
 await findElement(waiting,n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(Object.hasOwn(submitted,'activateAt'),false,'Non-executable state must preserve schedule');
 const readOnly=QuickForm({editor:quickEditor,data:{...data,tasks:[scheduledTask],readOnly:true},busy:false});
 assert.equal(findElement(readOnly,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,true);
 const unscheduled=QuickForm({editor:quickEditor,data:{...data,tasks:[{...scheduledTask,activateAt:''}]},busy:false});
 assert.equal(findElement(unscheduled,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,true);
 console.log('Scheduled recurring form passed: reactivate same state, preserve scheduling for other states, read-only and unchanged guards');
 const closingEditor={...quickEditor,initial:{...quickEditor.initial,stage:'done',dependencies:['previous'],events:['confirmed']}};
 const closingData={...data,tasks:[{...scheduledTask,activateAt:'',baseStage:'ready'}],events:[{id:'confirmed',status:'Ocurrido',occurred:'2026-09-13',evidence:'Confirmado'}]};
 for(const stage of ['done','cancelled']) {
  let closed;
  const props={editor:{...closingEditor,initial:{...closingEditor.initial,stage}},data:closingData,busy:false,onSave:async changes=>{closed=changes;}};
  quickEvidence='';stateIndex=0;
  const empty=QuickForm(props);
  assert.ok(findElement(empty,n=>n.props?.id==='quick-evidence'),'Closure result must be shown');
  assert.equal(findElement(empty,n=>n.type===dependencies.default),undefined,'Closing must not show the start-condition selector');
  assert.equal(findElement(empty,n=>n.props?.id==='quick-evidence').props.required,stage==='cancelled');
  assert.equal(findElement(empty,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,stage==='cancelled');
  await findElement(empty,n=>n.type==='form').props.onSubmit({preventDefault(){}});
  if(stage==='done')assert.deepEqual(closed,{stage,dependencies:['previous'],events:['confirmed']},'Finalizada saves without result and preserves links');
  else assert.equal(closed,undefined,'Discard still requires a reason');
  quickEvidence='Trabajo verificado';stateIndex=0;
  const complete=QuickForm(props);
  assert.equal(findElement(complete,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,false);
  await findElement(complete,n=>n.type==='form').props.onSubmit({preventDefault(){}});
  assert.deepEqual(closed,{stage,dependencies:['previous'],events:['confirmed'],evidence:'Trabajo verificado'},'Closure must preserve linked history');
 }
 console.log('Closure form passed: completion without result, optional evidence, discard reason, preserved dependencies');
 const groupEditor={kind:'task',id:'group',mode:'status',initial:{stage:'done',front:'Primario',rank:1,reason:'',dependencies:[],events:[]}};
 const groupData={...data,tasks:[{id:'group',name:'Grupo',isGroup:true,memberIds:['step'],baseStage:'ready',stage:'ready',front:'Primario',rank:1,activateAt:''},{id:'step',name:'Paso',stage:'ready'}]};
 let groupChanges;
 quickEvidence='';stateIndex=0;
 const groupDone=QuickForm({editor:groupEditor,data:groupData,busy:false,onSave:async changes=>{groupChanges=changes;}});
 assert.equal(findElement(groupDone,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,false,'Open steps must not block completion');
 assert.ok(findElement(groupDone,n=>typeof n.props?.children==='string'&&n.props.children.includes('todos sus pasos quedarán finalizados')));
 await findElement(groupDone,n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.deepEqual(groupChanges,{stage:'done',dependencies:[],events:[]});
 quickEvidence='Motivo';stateIndex=0;
 const groupDiscard=QuickForm({editor:{...groupEditor,initial:{...groupEditor.initial,stage:'cancelled'}},data:groupData,busy:false});
 assert.equal(findElement(groupDiscard,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,true,'Discard remains blocked while a step is open');
 console.log('Group form passed: completion enabled, effect explained, discard guard retained');
})().catch(error=>{console.error(error);process.exitCode=1;});
