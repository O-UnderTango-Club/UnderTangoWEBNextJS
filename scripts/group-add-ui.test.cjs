const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
for(const ext of ['.ts','.tsx'])require.extensions[ext]=(mod,file)=>mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,file);
require.extensions['.css']=mod=>{mod.exports=new Proxy({},{get:(_,key)=>String(key)});};
function harness(file,name,initialStates=[]){
 const states=[...initialStates],refs=[];let cursor=0,refCursor=0;
 const hooks={...React,useCallback:callback=>callback,useEffect(){},useRef:initial=>{const i=refCursor++;return refs[i]||(refs[i]={current:initial});},useState:initial=>{const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],next=>{states[i]=typeof next==='function'?next(states[i]):next;}];}};
 const filename=path.resolve(__dirname,file),mod=new Module(filename,module);mod.filename=filename;mod.paths=Module._nodeModulePaths(path.dirname(filename));const req=mod.require.bind(mod);mod.require=id=>id==='react'?hooks:req(id);
 mod._compile(ts.transpileModule(fs.readFileSync(filename,'utf8').replace('function QuickForm(', 'export function QuickForm('),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,filename);
 return props=>{cursor=0;refCursor=0;return mod.exports[name](props);};
}
function find(node,predicate){if(!node||typeof node!=='object')return;if(predicate(node))return node;for(const child of React.Children.toArray(node.props?.children)){const value=find(child,predicate);if(value)return value;}}
const button=(tree,text)=>find(tree,n=>n.type==='button'&&n.props.children===text);
const submit=tree=>find(tree,n=>n.type==='form').props.onSubmit({preventDefault(){}});
const base={id:'a',name:'Armar manual',baseStage:'waiting',stage:'waiting',front:'Primario',rank:2,activateAt:'',weekdays:127,parentWeekdays:127,projectIds:['p'],dependencies:[],eventIds:['e']};
const data={rankingMode:'action',source:'supabase',projects:[{id:'p',name:'Proyecto',open:true}],tasks:[base],events:[{id:'e',name:'Confirmación de Lucila',status:'Esperando',occurred:'',evidence:''}],cases:[]};
(async()=>{
 const groupRender=harness('../app/panel-de-control/GroupForm.tsx','default');let groupSaved;const gp={data,sourceTaskId:'a',busy:false,onClose(){},onSave:async value=>{groupSaved=value;}};tree=groupRender(gp);assert.match(renderToStaticMarkup(tree),/La acción original será su primer paso/);await submit(tree);assert.deepEqual(groupSaved.members,['a']);assert.equal(groupSaved.rank,2);assert.equal(groupSaved.name,'Armar manual');
 const member={...base,id:'b',name:'Segundo paso',stage:'ready'},group={...base,id:'g',isGroup:true,name:'Grupo',memberIds:['a','b']};const gd={...data,tasks:[{...base,groupId:'g'}, {...member,groupId:'g'},group]};
 const orderRender=harness('../app/panel-de-control/GroupForm.tsx','default');const op={data:gd,id:'g',embedded:true,busy:false,onClose(){},onSave:async value=>{groupSaved=value;},onCreateTask:async()=> 'new'};tree=orderRender(op);find(tree,n=>n.props?.['aria-label']==='Bajar Armar manual').props.onClick();tree=orderRender(op);await submit(tree);assert.deepEqual(groupSaved.members,['b','a']);assert.deepEqual(group.memberIds,['a','b']);
 find(tree,n=>n.props?.id==='new-member-g').props.onChange({target:{value:'Tercer paso'}});tree=orderRender(op);await button(tree,'Crear acción y seleccionarla').props.onClick();tree=orderRender(op);assert.match(renderToStaticMarkup(tree),/Tercer paso/);await submit(tree);assert.deepEqual(groupSaved.members,['b','a','new']);
 const actionRender=harness('../app/panel-de-control/ActionGroup.tsx','default');const ap={group,data:gd,disabled:false,onEdit(){},onPosition(){},onToday(){},renderTask:t=>React.createElement('span',null,t.name),onSaveGroup:async()=>{},onCreateTask:async()=> 'new'};tree=actionRender(ap);button(tree,'Agregar otra acción').props.onClick();tree=actionRender(ap);assert.ok(find(tree,n=>n.props?.embedded&&n.props?.focusAdd));assert.equal(button(tree,'Cerrar pasos').props.disabled,true);assert.match(renderToStaticMarkup(tree),/Agregar otra acción/);
 const task={...base,stage:'ready',baseStage:'ready',issues:[],blockers:[],due:'',doc:'',directProjectIds:['p'],caseIds:[]};
 const board={...data,actionGroups:true,updatedAt:'2026-09-14T12:00:00Z',snapshotRevision:'42',revisions:{a:'7'},tasks:[task],fronts:[{name:'Primario',tasks:['a']}],projectIssues:[]};
 const panelFor=(value,flags=[])=>harness('../app/panel-de-control/Panel.tsx','default',['test@example.com',false,value,...flags]);
 const panelRender=panelFor(board);let panel=panelRender();
 button(panel,'Transformar en grupo de acciones').props.onClick();panel=panelRender();
 const editor=find(panel,n=>n.props?.sourceTaskId==='a');assert.ok(editor,'The card must pass the chosen action into GroupForm');assert.equal(editor.props.id,undefined);
 const fromCard=harness('../app/panel-de-control/GroupForm.tsx','default');let conversion=fromCard(editor.props);assert.match(renderToStaticMarkup(conversion),/La acción original será su primer paso/);assert.equal(find(conversion,n=>n.props?.id==='member-project-new').props.value,'p');
 let converted;conversion=fromCard({...editor.props,onSave:async value=>{converted=value;}});await submit(conversion);assert.deepEqual(converted.members,['a']);assert.equal(converted.rank,2);assert.equal(converted.front,'Primario');assert.equal(converted.weekdays,127);
 editor.props.onClose();assert.equal(find(panelRender(),n=>n.props?.sourceTaskId==='a'),undefined);assert.deepEqual(board.tasks,[task]);
 for(const changed of [{actionGroups:false},{tasks:[{...task,groupId:'g'}]},{tasks:[{...task,stage:'done'}]},{tasks:[{...task,stage:'cancelled'}]}])assert.equal(button(panelFor({...board,...changed})(),'Transformar en grupo de acciones'),undefined);
 assert.equal(button(panelFor({...board,readOnly:true})(),'Transformar en grupo de acciones').props.disabled,true);
 for(const flags of [[true,false,''],[false,true,''],[false,false,'Error']])assert.equal(button(panelFor(board,flags)(),'Transformar en grupo de acciones').props.disabled,true);
 console.log('OK: card conversion entry, prefill, cancel, guards, member ordering, action creation and inline context');
})().catch(e=>{console.error(e);process.exitCode=1;});
