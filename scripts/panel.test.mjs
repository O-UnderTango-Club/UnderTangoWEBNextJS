import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import { createHash } from 'node:crypto';
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
check('recurrente participa en el ranking, sigue abierta y respeta dependencias',()=>{
 const a=t('recurrente',{[F.tasks.gate]:'Acción recurrente'});
 let data={...d,tasks:[a]};assert.equal(m.classify(a,data).stage,'recurring');assert.equal(m.closed(a),false);
 assert.deepEqual(m.board(data).fronts[0].tasks,['recurrente']);assert.equal(m.projectActionSummary('p',m.board(data).tasks).ready,1);
 a.fields[F.tasks.events]=['espera'];data.events=[row('espera',{[F.events.name]:'Confirmación',[F.events.status]:'Esperando'})];
 assert.deepEqual(m.board(data).fronts[0].tasks,[]);assert.throws(()=>m.validateTask(a,data,'recurring'),/dependencias pendientes/);
 data.events[0].fields[F.events.status]='Ocurrido';data.events[0].fields[F.events.evidence]='Confirmado';data.events[0].fields[F.events.occurred]='2026-09-06';
 assert.equal(m.classify(a,data).stage,'recurring');assert.deepEqual(m.board(data).fronts[0].tasks,['recurrente']);
});
check('tres acciones por frente, incluso del mismo proyecto, con reposición al empezar',()=>{
 const tasks=[1,2,3,4].map(n=>t(`paso${n}`,{[F.tasks.order]:n}));
 let data={...d,tasks};assert.deepEqual(m.board(data).fronts[0].tasks,['paso1','paso2','paso3']);
 tasks[0].fields[F.tasks.status]='En curso';tasks[0].fields[F.tasks.gate]='En acción';
 assert.deepEqual(m.board(data).fronts[0].tasks,['paso2','paso3','paso4']);
});
check('frente y posición usan códigos 1.3 y 2.2 sin confundir el paso de la acción',()=>{assert.equal(m.frontPosition('Primario',3),'1.3');assert.equal(m.frontPosition('Secundario',2),'2.2');assert.equal(m.frontPosition('Terciario',12),'3.12');assert.equal(m.frontPosition('',1),'Sin posición');assert.equal(m.frontPosition('Primario',9999),'Sin posición');});
check('cada frente salta bloqueos y toma disponibles de todo el ranking',()=>{
 for(const front of m.FRONTS){
   const projects=[1,2,3,4].map(rank=>row(`p${rank}`,{...p.fields,[F.projects.front]:front,[F.projects.rank]:rank}));
   const tasks=projects.map((p,i)=>t(`a${i+1}`,{[F.tasks.projects]:[p.id]}));
   tasks[1].fields[F.tasks.status]='En curso';tasks[1].fields[F.tasks.gate]='En acción';
   tasks[2].fields[F.tasks.status]='En espera';tasks[2].fields[F.tasks.gate]='En espera';tasks[2].fields[F.tasks.events]=['e'];
   const data={...d,projects,tasks,events:[row('e',{[F.events.name]:'Confirmación',[F.events.status]:'Esperando'})]};
   let b=m.board(data);assert.deepEqual(b.fronts.find(f=>f.name===front).tasks,['a1','a4']);assert.equal(b.tasks.find(t=>t.id==='a4').stage,'ready');
   tasks[0].fields[F.tasks.gate]='Por revisar';b=m.board(data);assert.deepEqual(b.fronts.find(f=>f.name===front).tasks,['a4']);assert.equal(b.tasks.length,4);
 }
});
check('posiciones ausentes, fraccionarias o fuera del rango no aparecen en Frentes',()=>{
 for(const rank of [0,-1,1.5,9999]){const data={...d,projects:[row('p',{...p.fields,[F.projects.rank]:rank})],tasks:[t('a')]};assert.deepEqual(m.board(data).fronts[0].tasks,[]);}
});
check('Frentes sólo incluye acciones inmediatas y repone la plaza al cambiar de estado',()=>{
 const current=t('actual',{[F.tasks.order]:1}),next=t('siguiente',{[F.tasks.order]:2}),data={...d,tasks:[current,next]};
 assert.deepEqual(m.board(data).fronts[0].tasks,['actual','siguiente']);
 for(const [status,gate] of [['En curso','En acción'],['Pendiente','Por revisar'],['Hecho','Terminada'],['Cancelado',null]]){
   current.fields[F.tasks.status]=status;current.fields[F.tasks.gate]=gate;
   const b=m.board(data);assert.deepEqual(b.fronts[0].tasks,['siguiente']);assert.ok(b.tasks.some(t=>t.id==='actual'));
 }
 current.fields[F.tasks.status]='Pendiente';current.fields[F.tasks.gate]='Acción inmediata';assert.deepEqual(m.board(data).fronts[0].tasks,['actual','siguiente']);
});
check('una espera sin vínculo queda visible por catalogar',()=>{const a=t('a',{[F.tasks.status]:'En espera',[F.tasks.gate]:'En espera'});assert.equal(m.classify(a,{...d,tasks:[a]}).stage,'catalog');assert.throws(()=>m.validateTask(a,{...d,tasks:[a]},'waiting'));});
check('el ranking explica estados contradictorios y esperas sin vínculo sin habilitar la acción',()=>{
 const a=t('O2',{[F.tasks.status]:'En curso',[F.tasks.gate]:'En espera'}),b=m.board({...d,tasks:[a]});
 const summary=m.projectActionSummary('p',b.tasks);
 assert.equal(summary.ready,0);assert.equal(summary.open,1);assert.match(summary.text,/por catalogar/);
 assert.ok(summary.issues.includes('Estados incompatibles en Seguimientos'));assert.ok(summary.issues.includes('Espera sin dependencia vinculada'));
 assert.deepEqual(b.fronts[0].tasks,[]);
});
check('el resumen distingue un próximo paso ausente, una acción en curso y una inmediata',()=>{
 const done=t('cerrada',{[F.tasks.status]:'Hecho',[F.tasks.gate]:'Terminada'});
 assert.equal(m.projectActionSummary('p',m.board({...d,tasks:[done]}).tasks).open,0);
 const doing=t('en curso',{[F.tasks.status]:'En curso',[F.tasks.gate]:'En acción'});
 assert.match(m.projectActionSummary('p',m.board({...d,tasks:[done,doing]}).tasks).text,/en curso/);
 assert.equal(m.projectActionSummary('p',m.board({...d,tasks:[done,doing,t('lista')]}).tasks).ready,1);
});
check('todos los predecesores deben terminar; cancelar no equivale a terminar',()=>{
 const a=t('a',{[F.tasks.status]:'Hecho'}),b=t('b'),c=t('c',{[F.tasks.status]:'En espera',[F.tasks.gate]:'En espera',[F.tasks.dependencies]:['a','b']});
 const data={...d,tasks:[a,b,c]};assert.equal(m.classify(c,data).stage,'waiting');b.fields[F.tasks.status]='Hecho';assert.equal(m.classify(c,data).stage,'ready');b.fields[F.tasks.status]='Cancelado';assert.equal(m.classify(c,data).stage,'catalog');
});
check('un evento necesita ocurrencia y evidencia; no se activa sólo por fecha',()=>{const a=t('a',{[F.tasks.events]:['e']}),e=row('e',{[F.events.name]:'Respuesta',[F.events.status]:'Ocurrido',[F.events.occurred]:'2026-09-05'}),data={...d,tasks:[a],events:[e]};assert.equal(m.classify(a,data).stage,'waiting');e.fields[F.events.evidence]='Llegó la respuesta';assert.equal(m.classify(a,data).stage,'ready');});
check('se rechazan ciclos y dependencias ausentes',()=>{const a=t('a',{[F.tasks.dependencies]:['b']}),b=t('b',{[F.tasks.dependencies]:['a']}),data={...d,tasks:[a,b]};assert.throws(()=>m.validateTask(a,data,'ready'),/ciclo/);assert.equal(m.classify(a,{...data,tasks:[a]}).stage,'catalog');});
check('Wish conserva visibilidad con proyecto de origen cerrado y destino activo',()=>{const closed=row('closed',{[F.projects.status]:'Completado'}),a=t('Wish',{[F.tasks.projects]:['closed','p']});const b=m.board({...d,projects:[p,closed],tasks:[a]});assert.equal(b.tasks[0].stage,'ready');assert.deepEqual(b.fronts[0].tasks,['Wish']);});
check('acciones compartidas se muestran una sola vez y proyectos no compiten con Seguimientos',()=>{const p2=row('p2',{...p.fields,[F.projects.front]:'Secundario',legacyGate:'En espera'}),a=t('compartida',{[F.tasks.projects]:['p','p2']});const b=m.board({...d,projects:[p,p2],tasks:[a]});assert.equal(b.fronts.flatMap(f=>f.tasks).length,1);assert.equal(b.tasks[0].stage,'ready');});
check('ninguna acción desaparece por filtros; plazas limitadas y próximos pasos faltantes visibles',()=>{const projects=Array.from({length:5},(_,i)=>row('p'+i,{...p.fields,[F.projects.rank]:i+1})),tasks=projects.slice(0,4).map((p,i)=>t('t'+i,{[F.tasks.projects]:[p.id]})).concat(t('huérfana',{[F.tasks.projects]:[]}));const b=m.board({...d,projects,tasks});assert.equal(b.tasks.length,5);assert.equal(b.fronts[0].tasks.length,3);assert.ok(b.projectIssues.some(p=>p.id==='p4'));assert.equal(b.tasks.find(t=>t.id==='huérfana').stage,'catalog');});
const accessUrl=moduleUrl(compile('../src/lib/panel-access.ts'));
const access=await import(accessUrl);
const server=await import(moduleUrl(compile('../src/lib/panel-server.ts').replace('"./panel-model"',JSON.stringify(modelUrl)).replace('"./panel-access"',JSON.stringify(accessUrl))));
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
 check('el acceso del dispositivo rechaza manipulación, vencimiento y cambio de clave',()=>{
   const now=Date.now(), cookie=access.issueDevice(now);
   assert.equal(access.verifyDevice(cookie,now),'pablocieslik@gmail.com');
   assert.equal(access.verifyDevice(cookie,now-1),null);
   assert.equal(access.verifyDevice(cookie,now+access.DEVICE_MAX_AGE*1000),null);
   assert.equal(access.verifyDevice(cookie+'x',now),null);
   const forged=Buffer.from(JSON.stringify({v:1,sub:'intruder',iat:now,exp:now+access.DEVICE_MAX_AGE*1000})).toString('base64url')+'.'+cookie.split('.')[1];
   assert.equal(access.verifyDevice(forged,now),null);
   process.env.AIRTABLE_PANEL_TOKEN='changed';assert.equal(access.verifyDevice(cookie,now),null);process.env.AIRTABLE_PANEL_TOKEN='test';
 });
 check('la habilitación requiere el secreto temporal y puede retirarse sin revocar dispositivos',()=>{
   const token='a'.repeat(64),now=Date.now(),grants=[{hash:createHash('sha256').update(token).digest('hex'),expiresAt:now+1000}];
   assert.equal(access.validBootstrap(token,grants,now),true);
   assert.equal(access.validBootstrap('b'.repeat(64),grants,now),false);
   assert.equal(access.validBootstrap(token,grants,now+1000),false);
   assert.equal(access.validBootstrap(token,[],now),false);
   assert.equal(access.validBootstrap(grants[0].hash,grants,now),false);
 });
 check('las escrituras rechazan sitios externos, origen ausente y formularios simples',()=>{
   const url='https://www.undertangoclub.com/api/panel';
   for(const origin of ['https://intruder.example','https://fake.undertangoclub.com','null',''])assert.equal(access.sameOrigin(new Request(url,{headers:{origin,'Content-Type':'application/json'}})),false);
   assert.equal(access.sameOrigin(new Request(url,{headers:{origin:'https://www.undertangoclub.com','Content-Type':'text/plain'}})),false);
   assert.equal(access.sameOrigin(new Request(url,{headers:{origin:'https://www.undertangoclub.com','Content-Type':'application/json'}})),true);
 });
 const device=access.issueDevice();
 assert.equal(await server.authorize(new Request('https://example.test',{headers:{cookie:`other=1; ${access.DEVICE_COOKIE}=${device}`}})),'pablocieslik@gmail.com');count++;console.log('OK el dispositivo habilitado abre el panel sin consultar Supabase');
 await assert.rejects(server.authorize(new Request('https://example.test')),/Ingresá/);
 await assert.rejects(server.authorize(new Request('https://example.test',{headers:{Authorization:'Bearer intruder'}})),/no tiene acceso/);
 await assert.rejects(server.authorize(new Request('https://example.test',{headers:{Authorization:'Bearer unconfirmed'}})),/no tiene acceso/);
 assert.equal(await server.authorize(new Request('https://example.test',{headers:{Authorization:'Bearer owner'}})),'pablocieslik@gmail.com');count++;console.log('OK acceso privado validado por servidor');
 let snap=await server.snapshot(true),rev=server.revision(snap.tasks[0]);
 await assert.rejects(server.mutate({kind:'task',id:'a',revision:'stale',changes:{stage:'doing'}},'test'),/cambió/);assert.equal(writes,0);count++;console.log('OK conflicto evita sobreescritura');
 await assert.rejects(server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'waiting',reason:'texto suelto'}},'test'),/sin dependencia/);assert.equal(writes,0);count++;console.log('OK espera inválida rechazada antes de escribir');
 await server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'doing'}},'test');assert.equal(records[TABLES.tasks][0].fields[F.tasks.status],'En curso');assert.equal(records[TABLES.tasks][0].fields[F.tasks.gate],'En acción');count++;console.log('OK escritura y lectura de confirmación');
 assert.deepEqual(m.board(await server.snapshot(true)).fronts[0].tasks,[]);
 let current=await server.snapshot(true);
 await server.mutate({kind:'task',id:'a',revision:server.revision(current.tasks[0]),changes:{stage:'ready'}},'test');
 assert.deepEqual(m.board(await server.snapshot(true)).fronts[0].tasks,['a']);count++;console.log('OK estado guardado retira y devuelve la tarjeta a Frentes');
 records[TABLES.events].push(row('espera',{[F.events.name]:'Confirmación',[F.events.status]:'Esperando'}));
 current=await server.snapshot(true);
 await server.mutate({kind:'task',id:'a',revision:server.revision(current.tasks[0]),changes:{stage:'waiting',events:['espera']}},'test');
 let waiting=m.board(await server.snapshot(true));assert.equal(waiting.tasks[0].stage,'waiting');assert.deepEqual(waiting.fronts[0].tasks,[]);
 let eventSnap=await server.snapshot(true);
 await server.mutate({kind:'event',id:'espera',revision:server.revision(eventSnap.events[0]),changes:{status:'Ocurrido',evidence:'Confirmación recibida'}},'test');
 let released=m.board(await server.snapshot(true));assert.equal(released.tasks[0].released,true);assert.deepEqual(released.fronts[0].tasks,['a']);count++;console.log('OK la espera sale de Frentes con vínculo real y vuelve al confirmarse el hecho');
 snap=await server.snapshot(true);rev=server.revision(snap.tasks[0]);
 await assert.rejects(server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'done'}},'test'),/resultado/);
 await server.mutate({kind:'task',id:'a',revision:rev,changes:{stage:'done',evidence:'Resultado comprobado'}},'test');assert.match(records[TABLES.tasks][0].fields[F.tasks.result],/Resultado comprobado/);count++;console.log('OK cierre requiere resultado y conserva evidencia');
 const pd=await server.snapshot(true);records[TABLES.tasks].push(t('abierta'));
 await assert.rejects(server.mutate({kind:'project',id:'p',revision:server.revision(pd.projects[0]),changes:{status:'Completado'}},'test'),/acciones abiertas/);count++;console.log('OK cierre de proyecto no deja acciones invisibles');
 records[TABLES.projects].push(row('p2',{...p.fields,[F.projects.rank]:2}),row('p3',{...p.fields,[F.projects.rank]:3}));
 const ranking=await server.snapshot(true);await server.mutate({kind:'project',id:'p',revision:server.revision(ranking.projects.find(p=>p.id==='p')),changes:{rank:3}},'test');
 assert.deepEqual(records[TABLES.projects].map(p=>p.fields[F.projects.rank]),[3,1,2]);count++;console.log('OK ranking inserta posición y conserva orden relativo');
 records[TABLES.projects].push(row('s1',{...p.fields,[F.projects.front]:'Secundario',[F.projects.rank]:1}),row('s2',{...p.fields,[F.projects.front]:'Secundario',[F.projects.rank]:2}));
 records[TABLES.tasks].push(t('segunda accion',{[F.tasks.order]:2}));
 const beforeMove=await server.snapshot(true);
 await server.mutate({kind:'project',id:'p',revision:server.revision(beforeMove.projects.find(p=>p.id==='p')),changes:{front:'Secundario',rank:2}},'test');
 const moved=m.board(await server.snapshot(true));assert.equal(moved.projects.find(p=>p.id==='p').front,'Secundario');assert.equal(moved.projects.find(p=>p.id==='p').rank,2);assert.equal(moved.projects.find(p=>p.id==='s2').rank,3);
 assert.deepEqual(moved.fronts[0].tasks,[]);assert.equal(moved.fronts[1].tasks.length,2);assert.ok(['abierta','segunda accion'].includes(moved.fronts[1].tasks[0]));
 assert.equal(moved.tasks.find(t=>t.id==='a').stage,'done');count++;console.log('OK mover proyecto a 2.2 mueve sus acciones inmediatas y conserva estados');
 records[TABLES.projects]=[1,2,3,4].map(rank=>row(`r${rank}`,{...p.fields,[F.projects.front]:'Primario',[F.projects.rank]:rank}));
 records[TABLES.tasks]=[1,2,3,4].map(rank=>t(`accion${rank}`,{[F.tasks.projects]:[`r${rank}`]}));records[TABLES.events]=[];
 let ordered=await server.snapshot(true);assert.deepEqual(m.board(ordered).fronts[0].tasks,['accion1','accion2','accion3']);
 await server.mutate({kind:'project',id:'r1',revision:server.revision(ordered.projects.find(p=>p.id==='r1')),changes:{rank:4}},'test');
 ordered=await server.snapshot(true);assert.deepEqual(m.board(ordered).fronts[0].tasks,['accion2','accion3','accion4']);assert.deepEqual(ordered.projects.map(p=>p.fields[F.projects.rank]),[4,1,2,3]);
 assert.equal(m.board(ordered).tasks.find(t=>t.id==='accion1').stage,'ready');
 await server.mutate({kind:'project',id:'r1',revision:server.revision(ordered.projects.find(p=>p.id==='r1')),changes:{rank:1}},'test');
 assert.deepEqual(m.board(await server.snapshot(true)).fronts[0].tasks,['accion1','accion2','accion3']);count++;console.log('OK bajar 1.1 a 1.4 retira su acción y sube los puestos 2, 3 y 4; promoverla revierte el orden');
}finally{globalThis.fetch=originalFetch;}
console.log(`${count} verificaciones aprobadas.`);
