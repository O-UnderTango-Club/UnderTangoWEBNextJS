import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const modules=new Map();
function load(name) {
  if(modules.has(name))return modules.get(name);
  let s=ts.transpileModule(fs.readFileSync(`src/lib/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
  s=s.replace(/(['"])\.\/([a-z-]+)\1/g,(_,q,dep)=>JSON.stringify(load(dep)));
  const url='data:text/javascript;base64,'+Buffer.from(s).toString('base64');modules.set(name,url);return url;
}
const m=await import(load('panel-deadlines'));
const server=await import(load('panel-deadlines-server'));
const {F}=await import(load('panel-model'));
const access=await import(load('panel-access'));
const item=(id,date,kind='deadline',extra={})=>({id,source:'task',sourceId:id,title:id,date,time:'',kind,status:'Pendiente',priority:'Media',detail:'',url:'',taskId:id,...extra});
const fixture=()=>({contract:1,source:'supabase',timezone:'America/Argentina/Cordoba',today:'2026-09-29',updatedAt:'2026-09-30T01:00:00Z',revision:'9007199254740993',items:[item('later','2026-10-09','tentative'),item('today','2026-09-29'),item('waiting','2026-10-01','conditional'),item('past','2026-09-28'),item('show','2026-10-03','confirmed'),item('far','2027-02-01')]});
let count=0;async function check(name,fn){await fn();count++;console.log('OK',name);}
await check('date-only values keep the Córdoba day and invalid dates fail',()=>{
 assert.equal(m.validDay('2026-02-30'),false);assert.equal(m.validDay('2026-10-09T00:00Z'),false);
 assert.match(m.deadlineDate('2026-10-09'),/9/);assert.equal(m.validDay('2028-02-29'),true);
});
await check('chronology does not mutate source or rank by priority',()=>{
 const f=fixture();f.items[0].priority='Alta';const before=structuredClone(f);
 const parsed=m.parseDeadlines(f);assert.deepEqual(f,before);assert.equal(parsed.revision,'9007199254740993');
 assert.deepEqual(parsed.items.map(i=>i.id),['past','today','waiting','show','later','far']);
});
await check('today, overdue, horizon and unlimited view are independent',()=>{
 const f=m.parseDeadlines(fixture());const window=m.deadlineWindow(f,30);
 assert.deepEqual(window.upcoming.map(i=>i.id),['today','waiting','show','later']);
 assert.deepEqual(window.overdue.map(i=>i.id),['past']);
 assert.equal(m.deadlineWindow(f,null).upcoming.at(-1).id,'far');
});
await check('same-day ordering handles actual time before unspecified time',()=>{
 const sorted=m.sortDeadlines([item('unknown','2026-10-01'),item('afternoon','2026-10-01','confirmed',{time:'13:00'}),item('morning','2026-10-01','confirmed',{time:'10:00'})]);
 assert.deepEqual(sorted.map(i=>i.id),['morning','afternoon','unknown']);
});
await check('rejects duplicate IDs, unknown kinds, malformed and partial payloads',()=>{
 for(const mutate of [v=>v.items.push(v.items[0]),v=>v.items[0].kind='paid',v=>v.items[0].date='2026-02-30',v=>delete v.items,v=>v.source='airtable',v=>v.timezone='UTC',v=>v.items[0].taskId=5]){
  const f=fixture();mutate(f);assert.throws(()=>m.parseDeadlines(f));
 }
 assert.deepEqual(m.parseDeadlines({...fixture(),items:[]}).items,[]);
});
await check('links reject active content and combined URLs',()=>{
 assert.equal(m.safeDeadlineUrl('javascript:alert(1)'),undefined);
 assert.equal(m.safeDeadlineUrl('http://example.com'),undefined);
 assert.equal(m.safeDeadlineUrl('https://example.com/\nhttps://example.org'),undefined);
 assert.equal(m.safeDeadlineUrl('https://docs.google.com/document/d/a'),'https://docs.google.com/document/d/a');
});
const env={PANEL_DATA_SOURCE:'supabase',OPERATIONS_SUPABASE_URL:'https://lqsnrqnmmeyzcnurfpos.supabase.co',OPERATIONS_SUPABASE_SECRET_KEY:'sb_secret_TEST_ONLY'};
await check('private RPC has no cache, redirects or browser bearer',async()=>{
 const result=await server.readDeadlines({env,fetcher:async(url,options)=>{
  assert.ok(url.endsWith('/ut_panel_deadlines_v1'));assert.equal(options.cache,'no-store');assert.equal(options.redirect,'error');assert.equal(options.method,'POST');assert.equal(options.headers.apikey,'sb_secret_TEST_ONLY');assert.equal(options.headers.Authorization,undefined);return Response.json(fixture());
 }});
 assert.equal(result.items.length,6);
});
await check('connection and malformed response errors do not leak private details',async()=>{
 for(const fetcher of [async()=>{throw new Error('SECRET_DATABASE_DETAIL');},async()=>new Response('SECRET_DATABASE_DETAIL',{status:500}),async()=>Response.json({})])
  await assert.rejects(server.readDeadlines({env,fetcher}),e=>!e.message.includes('SECRET_DATABASE_DETAIL'));
 await assert.rejects(server.readDeadlines({env:{...env,PANEL_DATA_SOURCE:'airtable'},fetcher:async()=>{throw Error('must not call');}}),/Supabase/);
});
Object.assign(process.env,env,{AIRTABLE_PANEL_TOKEN:'LOCAL_TEST_SIGNING_KEY',PANEL_ACTION_GROUPS:'1'});
const raw={contract:6,status:'active',revision:'1',updatedAt:new Date().toISOString(),projects:[{id:'p',fields:{[F.projects.name]:'Project context',[F.projects.status]:'Activo'}}],cases:[],events:[],tasks:[{id:'t1',fields:{[F.tasks.projects]:['p'],[F.tasks.name]:'Existing action',[F.tasks.status]:'Pendiente',[F.tasks.gate]:'Acción inmediata',[F.tasks.front]:'Primario',[F.tasks.rank]:1,[F.tasks.weekdays]:127}}]};
let route=ts.transpileModule(fs.readFileSync('app/api/panel/route.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
route=route.replace('import { NextResponse } from "next/server";','const NextResponse={json:(body,init)=>new Response(JSON.stringify(body),{...init,headers:{"Content-Type":"application/json",...init.headers}})};');
route=route.replace(/(['"])\.\.\/\.\.\/\.\.\/src\/lib\/([a-z-]+)\1/g,(_,q,dep)=>JSON.stringify(load(dep)));
const api=await import('data:text/javascript;base64,'+Buffer.from(route).toString('base64'));
const originalFetch=globalThis.fetch;
try {
 let calls=0;globalThis.fetch=async()=>{calls++;throw Error('must authorize first');};
 await check('unauthorized API request exposes no agenda and never queries DB',async()=>{
  const response=await api.GET(new Request('http://localhost/api/panel'));assert.equal(response.status,401);assert.equal(calls,0);
 });
 const request=()=>new Request('http://localhost/api/panel',{headers:{cookie:access.DEVICE_COOKIE+'='+access.issueDevice()}});
 await check('authenticated API returns existing fronts and all four agenda kinds',async()=>{
  globalThis.fetch=async url=>Response.json(String(url).endsWith('/ut_panel_deadlines_v1')?fixture():raw);
  const response=await api.GET(request());assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private, no-store/);
  const body=await response.json();assert.equal(body.fronts.length,3);assert.deepEqual(body.fronts[0].tasks,['t1']);assert.equal(body.deadlines.items.length,6);assert.equal(body.deadlinesError,'');
 });
 await check('agenda outage preserves fronts and reports missing dates, not empty success',async()=>{
  globalThis.fetch=async url=>String(url).endsWith('/ut_panel_deadlines_v1')?new Response('private error',{status:503}):Response.json(raw);
  const body=await(await api.GET(request())).json();assert.equal(body.fronts.length,3);assert.deepEqual(body.fronts[0].tasks,['t1']);assert.equal(body.deadlines,undefined);assert.match(body.deadlinesError,/Supabase/);
 });
} finally { globalThis.fetch=originalFetch; }
console.log(count+' deadline and API checks passed');

