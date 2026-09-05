import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile=path=>ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
const moduleUrl=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const modelUrl=moduleUrl(compile('../src/lib/panel-model.ts'));
const m=await import(modelUrl),{F,TABLES}=m;
const row=(id,fields)=>({id,fields});
const p=row('p',{[F.projects.name]:'Proyecto',[F.projects.status]:'Activo',[F.projects.front]:'Primario',[F.projects.rank]:1});
const t=(id,extra={})=>row(id,{[F.tasks.name]:id,[F.tasks.projects]:['p'],[F.tasks.status]:'Pendiente',[F.tasks.gate]:'Acción inmediata',...extra});
const d={projects:[p],tasks:[],events:[],cases:[],updatedAt:new Date().toISOString()};
let count=0;
function check(name,fn){fn();count++;console.log('OK',name);}
check('una espera sin vínculo queda visible por catalogar',()=>{const a=t('a',{[F.tasks.status]:'En espera',[F.tasks.gate]:'En espera'});assert.equal(m.classify(a,{...d,tasks:[a]}).stage,'catalog');assert.throws(()=>m.validateTask(a,{...d,tasks:[a]},'waiting'));});
check('todos los predecesores deben terminar; cancelar no equivale a terminar',()=>{
 const a=t('a',{[F.tasks.status]:'Hecho'}),b=t('b'),c=t('c',{[F.tasks.status]:'En espera',[F.tasks.gate]:'En espera',[F.tasks.dependencies]:['a','b']});
 const data={...d,tasks:[a,b,c]};assert.equal(m.classify(c,data).stage,'waiting');b.fields[F.tasks.status]='Hecho';assert.equal(m.classify(c,data).stage,'ready');b.fields[F.tasks.status]='Cancelado';assert.equal(m.classify(c,data).stage,'catalog');
});
check('un evento necesita ocurrencia y evidencia; no se activa sólo por fecha',()=>{const a=t('a',{[F.tasks.events]:['e']}),e=row('e',{[F.events.name]:'Respuesta',[F.events.status]:'Ocurrido',[F.events.occurred]:'2026-09-05'}),data={...d,tasks:[a],events:[e]};assert.equal(m.classify(a,data).stage,'waiting');e.fields[F.events.evidence]='Llegó la respuesta';assert.equal(m.classify(a,data).stage,'ready');});
check('se rechazan ciclos y dependencias ausentes',()=>{const a=t('a',{[F.tasks.dependencies]:['b']}),b=t('b',{[F.tasks.dependencies]:['a']}),data={...d,tasks:[a,b]};assert.throws(()=>m.validateTask(a,data,'ready'),/ciclo/);assert.equal(m.classify(a,{...data,tasks:[a]}).stage,'catalog');});
check('Wish conserva visibilidad con proyecto de origen cerrado y destino activo',()=>{const closed=row('closed',{[F.projects.status]:'Completado'}),a=t('Wish',{[F.tasks.projects]:['closed','p']});const b=m.board({...d,projects:[p,closed],tasks:[a]});assert.equal(b.tasks[0].stage,'ready');assert.deepEqual(b.fronts[0].tasks,['Wish']);});
check('acciones compartidas se muestran una sola vez y proyectos no compiten con Seguimientos',()=>{const p2=row('p2',{...p.fields,[F.projects.front]:'Secundario',legacyGate:'En espera'}),a=t('compartida',{[F.tasks.projects]:['p','p2']});const b=m.board({...d,projects:[p,p2],tasks:[a]});assert.equal(b.fronts.flatMap(f=>f.tasks).length,1);assert.equal(b.tasks[0].stage,'ready');});
check('ninguna acción desaparece por filtros; plazas limitadas y próximos pasos faltantes visibles',()=>{const projects=Array.from({length:5},(_,i)=>row('p'+i,{...p.fields,[F.projects.rank]:i+1})),tasks=projects.slice(0,4).map((p,i)=>t('t'+i,{[F.tasks.projects]:[p.id]})).concat(t('huérfana',{[F.tasks.projects]:[]}));const b=m.board({...d,projects,tasks});assert.equal(b.tasks.length,5);assert.equal(b.fronts[0].tasks.length,3);assert.ok(b.projectIssues.some(p=>p.id==='p4'));assert.equal(b.tasks.find(t=>t.id==='huérfana').stage,'catalog');});
const server=await import(moduleUrl(compile('../src/lib/panel-server.ts').replace('"./panel-model"',JSON.stringify(modelUrl))));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://auth.example.test';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test';process.env.AIRTABLE_PANEL_TOKEN='test';
const originalFetch=globalThis.fetch;
const records={[TABLES.projects]:[p],[TABLES.tasks]:[t('a')],[TABLES.events]:[],[TABLES.cases]:[]};let writes=0;
globalThis.fetch=async(url,options={})=>{
 const u=new URL(url);
 if(u.hostname==='auth.example.test'){const auth=options.headers.Authorization;return Response.json(auth==='Bearer owner'?{email:'pablocieslik@gmail.com',email_confirmed_at:'2026-09-05'}:auth==='Bearer unconfirmed'?{email:'pablocieslik@gmail.com'}:{email:'intruso@example.test',email_confirmed_at:'2026-09-05'});}
 assert.equal(u.hostname,'api.airtable.com');const parts=u.pathname.split('/'),table=parts[3],id=parts[4];
 if(options.method==='PATCH'){writes++;const body=JSON.parse(options.body);if(body.records){for(const changed of body.records)Object.assign(records[table].find(x=>x.id===changed.id).fields,changed.fields);return Response.json({records:body.records});}const r=records[table].find(x=>x.id===id);Object.assign(r.fields,body.fields);return Response.json(r);}
 if(options.method==='POST'){writes++;const r=row('new'+writes,JSON.parse(options.body).fields);records[table].push(r);return Response.json(r);}
 if(id)return Response.json(records[table].find(x=>x.id===id));
 const selected=u.searchParams.getAll('fields[]');return Response.json({records:records[table].map(r=>({...r,fields:Object.fromEntries(Object.entries(r.fields).filter(([k])=>!selected.length||selected.includes(k)))}))});
};
try{
 await assert.rejects(server.authorize(new Request('https://example.test')),/Ingresá/);
 await assert.rejects(server.authorize(new Request('https://example.test',{headers:{Authorization:'Bearer intruder'}})),/no tiene acceso/);
 await assert.rejects(server.authorize(new Request('https://example.test',{headers:{Authorization:'Bearer unconfirmed'}})),/no tiene acceso/);
 assert.equal(await server.authorize(new Request('https://example.test',{headers:{Authorization:'Bearer owner'}})),'pablocieslik@gmail.com');count++;console.log('OK acceso privado validado por servidor');
 let snap=await server.snapshot(true),rev=server.revision(snap.tasks[0]);
 await assert.rejects(server.mutate({kind:'task',id:'a',revision:'stale',changes:{stage:'doing'}},'test'),/cambió/);assert.equal(writes,0);count++;console.log('OK conflicto evita sobreescritura');
 await assert.rejects(server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'waiting',reason:'texto suelto'}},'test'),/sin dependencia/);assert.equal(writes,0);count++;console.log('OK espera inválida rechazada antes de escribir');
 await server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'doing'}},'test');assert.equal(records[TABLES.tasks][0].fields[F.tasks.status],'En curso');assert.equal(records[TABLES.tasks][0].fields[F.tasks.gate],'En acción');count++;console.log('OK escritura y lectura de confirmación');
 snap=await server.snapshot(true);rev=server.revision(snap.tasks[0]);
 await assert.rejects(server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'done'}},'test'),/resultado/);
 await server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'done',evidence:'Resultado comprobado'}},'test');assert.match(records[TABLES.tasks][0].fields[F.tasks.result],/Resultado comprobado/);count++;console.log('OK cierre requiere resultado y conserva evidencia');
 const pd=await server.snapshot(true);records[TABLES.tasks].push(t('abierta'));
 await assert.rejects(server.mutate({kind:'project',id:'p',revision:server.revision(pd.projects[0]),changes:{status:'Completado'}},'test'),/acciones abiertas/);count++;console.log('OK cierre de proyecto no deja acciones invisibles');
 records[TABLES.projects].push(row('p2',{...p.fields,[F.projects.rank]:2}),row('p3',{...p.fields,[F.projects.rank]:3}));
 const ranking=await server.snapshot(true);await server.mutate({kind:'project',id:'p',revision:server.revision(ranking.projects.find(p=>p.id==='p')),changes:{rank:3}},'test');
 assert.deepEqual(records[TABLES.projects].map(p=>p.fields[F.projects.rank]),[3,1,2]);count++;console.log('OK ranking inserta posición y conserva orden relativo');
}finally{globalThis.fetch=originalFetch;}
console.log(`${count} verificaciones aprobadas.`);
