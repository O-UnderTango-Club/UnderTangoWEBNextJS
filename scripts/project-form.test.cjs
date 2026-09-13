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
  mod.require = id => id in replacements ? replacements[id] : originalRequire(id);
  const source = fs.readFileSync(filename, 'utf8').replace('function EditForm(', 'export function EditForm(').replace('function QuickForm(', 'export function QuickForm(');
  mod._compile(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
  return mod.exports;
}
const model = load('../src/lib/panel-model.ts');
const grouping = load('../src/lib/panel-dependencies.ts');
const dependencies = load('../app/panel-de-control/Dependencies.tsx', {'../../src/lib/panel-model':model,'../../src/lib/panel-dependencies':grouping,'./panel.module.css':{default:{}}});
const projectGroups = load('../src/lib/panel-project-groups.ts');
const frontProjects = load('../app/panel-de-control/FrontProjects.tsx', {'../../src/lib/panel-model':model,'../../src/lib/panel-project-groups':projectGroups,'./panel.module.css':{default:{}}});
const { EditForm } = load('../app/panel-de-control/Panel.tsx', { '../../src/lib/panel-model': model, './Dependencies': dependencies, './FrontProjects':frontProjects, './panel.module.css': {default:{}} });
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
const task = render({kind:'task',initial:{name:'Borrador intacto',stage:'catalog',projects:[],cases:[],dependencies:[],events:[]}});
assert.match(task, /Borrador intacto/); assert.match(task, /Crear proyecto y seleccionarlo/);
assert.match(task, /Proyectos vinculados/); assert.match(task, /la acción se guarda por separado/);
const readOnly = render({kind:'project',initial:{name:'Prueba',status:'Activo'}},{data:{...data,readOnly:true}});
assert.match(readOnly, /fieldset disabled/);
const contextual = render({kind:'task',id:'action',initial:{name:'Pagar factura',stage:'ready',order:21,projects:['independent'],cases:['case'],dependencies:[],events:[]}}, {data:{...data,projects:[{id:'independent',name:'Tareas independientes',open:true},{id:'inherited',name:'Proyecto del caso',open:true}],cases:[{id:'case',name:'Caso',projectIds:['inherited']} ]}});
assert.ok(contextual.indexOf('Tareas independientes') < contextual.indexOf('Acción concreta'));
assert.ok(contextual.indexOf('Proyecto del caso') < contextual.indexOf('Acción concreta'));
assert.doesNotMatch(contextual, /Paso en el plan|id="edit-order"/);
assert.match(contextual, /Número registrado: 21/);
assert.match(contextual, /<details><summary>Referencia de orden anterior/);
assert.match(task, /Sin proyecto vinculado/);
console.log('Project/action rendering checks passed: context, inherited links, empty state and historical order');

// Exercise the form submission without a browser or any production writes.
let availabilityMode="now";
const { QuickForm } = load('../app/panel-de-control/Panel.tsx', {
  '../../src/lib/panel-model':model,'./Dependencies':dependencies,'./FrontProjects':frontProjects,'./panel.module.css':{default:{}},
  react:{...React,useState:initial=>[initial==="now"?availabilityMode:initial,()=>{}]}
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
 const waiting=QuickForm({editor:{...quickEditor,initial:{...quickEditor.initial,stage:'catalog'}},data:{...data,tasks:[scheduledTask]},busy:false,onSave:async changes=>{submitted=changes;}});
 await findElement(waiting,n=>n.type==='form').props.onSubmit({preventDefault(){}});
 assert.equal(Object.hasOwn(submitted,'activateAt'),false,'Non-executable state must preserve schedule');
 const readOnly=QuickForm({editor:quickEditor,data:{...data,tasks:[scheduledTask],readOnly:true},busy:false});
 assert.equal(findElement(readOnly,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,true);
 const unscheduled=QuickForm({editor:quickEditor,data:{...data,tasks:[{...scheduledTask,activateAt:''}]},busy:false});
 assert.equal(findElement(unscheduled,n=>n.type==='button'&&n.props.children==='Guardar estado').props.disabled,true);
 console.log('Scheduled recurring form passed: reactivate same state, preserve scheduling for other states, read-only and unchanged guards');
})().catch(error=>{console.error(error);process.exitCode=1;});
