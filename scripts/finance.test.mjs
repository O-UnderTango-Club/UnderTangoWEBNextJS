import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const modules=new Map();
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
function compile(relative) {
  const file=path.resolve(root,relative);
  if(modules.has(file))return modules.get(file);
  let source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText;
  source=source.replace(/from "(\.\.?\/[^\"]+)"/g,(_match,name)=>'from '+JSON.stringify(compile(path.relative(root,path.resolve(path.dirname(file),name+'.ts')))));
  source=source.replace('from "next/server"','from '+JSON.stringify(data('export const NextResponse={json:(body,init)=>Response.json(body,init)};')));
  const url=data(source);modules.set(file,url);return url;
}
const model=await import(compile('src/lib/finance-model.ts'));
const server=await import(compile('src/lib/finance-server.ts'));
const workflow=await import(compile('src/lib/finance-workflow.ts'));
const {FINANCE_FIELDS:F}=model;
const fields=(table,values={})=>Object.fromEntries(Object.entries(F[table]).map(([name,f])=>[f.id,name in values?values[name]:f.type==='links'?[]:null]));
const record=(table,id,values={})=>({id,version:'1',fields:fields(table,values)});
const fixture=()=>({contract:1,status:'active',revision:'9007199254740993',updatedAt:'2026-09-07T23:00:00Z',
  obligations:[record('obligations','o',{name:'Prueba',type:'Por cobrar',status:'Pendiente',currency:'BRL',originalAmount:'100.10',balance:'100.10',movements:['m']})],
  movements:[record('movements','m',{name:'Pago',type:'Ingreso',status:'Confirmado',currency:'BRL',amount:'0.30',date:'2026-09-07',obligations:['o']})],
  contacts:[],cases:[],operations:[]});
let count=0;
async function check(name,fn){await fn();count++;console.log('OK',name);}
await check('decimales exactos y sin convertir desconocidos a cero',()=>{
  assert.equal(model.centsDecimal(model.decimalCents('0.10')+model.decimalCents('0.20')),'0.30');
  assert.equal(model.amountInput('999999999999999,99'),'999999999999999.99');
  assert.equal(model.amountInput(''),null); assert.equal(model.amountInput(null),null); assert.equal(model.amountInput('0'),'0.00');
  for(const value of [0.1,'NaN','1.000','1,000.00','-1','1e3',undefined])assert.throws(()=>model.amountInput(value));
});
await check('lectura completa conserva todos los campos y revisiones grandes',()=>{
  const s=model.parseFinanceSnapshot(fixture());assert.equal(s.revision,'9007199254740993');
  assert.equal(Object.keys(s.obligations[0].fields).length,16);assert.equal(Object.keys(s.movements[0].fields).length,14);
  for(const status of ['staged','validated']){assert.throws(()=>model.parseFinanceSnapshot({...fixture(),status}));assert.equal(model.parseFinanceSnapshot({...fixture(),status},true).status,status);}
});
await check('rechaza datos truncados, tipos y relaciones inconsistentes',()=>{
  for(const mutate of [s=>delete s.movements,s=>delete s.obligations[0].fields[F.obligations.notes.id],
    s=>s.movements.push(s.movements[0]),s=>s.movements[0].fields[F.movements.amount.id]=0.30,
    s=>s.movements[0].fields[F.movements.obligations.id]=[],s=>s.movements[0].fields[F.movements.contacts.id]=['missing'],
    s=>s.movements[0].fields[F.movements.date.id]='2026-02-31',s=>s.obligations[0].version='0']){
    const s=fixture();mutate(s);assert.throws(()=>model.parseFinanceSnapshot(s));
  }
});
await check('monedas, ingreso/egreso y estado nunca se mezclan ni se llaman caja',()=>{
  const s=fixture();s.obligations.push(record('obligations','unknown',{name:'Pendiente de monto',type:'Por pagar',status:'En revisión'}));
  s.obligations.push(record('obligations','r',{name:'Etiqueta histórica',type:'Saldada',currency:'R$',balance:'1.00'}));
  s.movements.push(record('movements','pending',{name:'Esperado',type:'Ingreso',status:'Pendiente',currency:'BRL',amount:'100.00'}));
  s.movements.push(record('movements','ars',{name:'Pesos',type:'Ingreso',status:'Confirmado',currency:'ARS',amount:'20.00'}));
  const totals=model.financeTotals(model.parseFinanceSnapshot(s));assert.equal(totals.length,6);
  assert.equal(totals.find(g=>g.currency===null).knownSubtotal,null);assert.equal(totals.find(g=>g.currency===null).unknown,1);
  assert.equal(totals.find(g=>g.table==='movements'&&g.currency==='BRL'&&g.status==='Confirmado').knownSubtotal,'0.30');
  assert.equal(totals.find(g=>g.currency==='R$').knownSubtotal,'1.00');
});
const change=()=>({record:{table:'movements',id:'m',create:false,fields:{[F.movements.amount.id]:'0,30'}}});
await check('valida cambios mínimos, orden de vínculos y saldos explícitos',()=>{
  const c=server.validateFinanceChange(change());assert.equal(c.record.fields[F.movements.amount.id],'0.30');assert.equal(Object.keys(c.record.fields).length,1);
  const linked={record:{...change().record,fields:{[F.movements.obligations.id]:['b','a']}}};
  assert.deepEqual(server.validateFinanceChange(linked).record.fields[F.movements.obligations.id],['b','a']);
  for(const bad of [{...change(),unknown:1},{record:{...change().record,fields:{[F.obligations.movements.id]:[]}}},
    {record:{...change().record,fields:{[F.movements.amount.id]:0.3}}},
    {record:{...change().record,fields:{[F.movements.obligations.id]:['o','o']}}},
    {...change(),balances:[{id:'o',oldBalance:'100',newBalance:'90',state:'Parcial'}]},
    {...change(),balanceReason:'Distribución aprobada',balances:[{id:'o',newBalance:'90',state:'Parcial'}]}])assert.throws(()=>server.validateFinanceChange(bad));
  const c2=server.validateFinanceChange({...change(),balanceReason:'Distribución aprobada',balances:[{id:'o',oldBalance:'100,10',newBalance:'100',state:'Parcial'}]});
  assert.equal(c2.balances[0].oldBalance,'100.10');assert.equal(c2.balances[0].newBalance,'100.00');
});
const env={PANEL_DATA_SOURCE:'supabase',VERCEL_ENV:'production',OPERATIONS_SUPABASE_URL:'https://lqsnrqnmmeyzcnurfpos.supabase.co',OPERATIONS_SUPABASE_SECRET_KEY:'sb_secret_TEST_ONLY'};
await check('sin activación o sin permiso financiero de preview no llama a la base',async()=>{
  for(const override of [{PANEL_DATA_SOURCE:undefined},{PANEL_DATA_SOURCE:'airtable'},{VERCEL_ENV:'preview'},{OPERATIONS_SUPABASE_URL:'https://titmbxbymfajgmidfabn.supabase.co'}]){
    const options={env:{...env,...override},fetcher:()=>{throw new Error('Must not fetch');}};
    await assert.rejects(server.readFinanceSnapshot(options),e=>e instanceof server.FinanceError);
    await assert.rejects(server.commitFinance({requestId:crypto.randomUUID(),revision:'0',change:change()},'tester',options),e=>e instanceof server.FinanceError);
  }
});
await check('lectura usa apikey privado, no cachea ni sigue redirecciones',async()=>{
  const s=await server.readFinanceSnapshot({env,fetcher:async(endpoint,init)=>{
    assert.equal(endpoint,env.OPERATIONS_SUPABASE_URL+'/rest/v1/rpc/ut_finance_snapshot_v1');assert.equal(init.headers.apikey,env.OPERATIONS_SUPABASE_SECRET_KEY);
    assert.equal(init.headers.Authorization,undefined);assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');return Response.json(fixture());
  }});assert.equal(s.movements.length,1);
  await assert.rejects(server.readFinanceSnapshot({env,fetcher:async()=>Response.json({...fixture(),status:'staged'})}),e=>e.status===503);
});
await check('errores privados no se filtran y duplicados se distinguen',async()=>{
  const input={requestId:crypto.randomUUID(),revision:'0',change:change()};
  await assert.rejects(server.commitFinance(input,'tester',{env,fetcher:async()=>Response.json({message:env.OPERATIONS_SUPABASE_SECRET_KEY},{status:500})}),e=>e.uncertain&&!e.message.includes(env.OPERATIONS_SUPABASE_SECRET_KEY));
  await assert.rejects(server.commitFinance(input,'tester',{env,fetcher:async()=>Response.json({message:'Possible duplicate: review the existing record before creating another',details:'private'},{status:409})}),e=>e.code==='duplicate'&&!e.uncertain&&!e.message.includes('private'));
});
await check('respuesta perdida conserva el identificador; reintento recupera un único comprobante',async()=>{
  const saved=new Map();let commits=0;let revision=0;let lose=true;
  const fetcher=async(endpoint,init)=>{
    assert.equal(endpoint,env.OPERATIONS_SUPABASE_URL+'/rest/v1/rpc/ut_finance_commit_v1');
    const body=JSON.parse(init.body);
    if(saved.has(body.p_request_id))return Response.json(saved.get(body.p_request_id));
    assert.equal(body.p_expected_revision,String(revision));commits++;revision++;
    const result={ok:true,id:'m',ids:['m'],requestId:body.p_request_id,revision:String(revision),balanceUpdates:0,savedAt:new Date().toISOString()};
    saved.set(body.p_request_id,result);if(lose){lose=false;throw new Error('Response lost after commit');}return Response.json(result);
  };
  const input={requestId:crypto.randomUUID(),revision:'0',change:change()};
  await assert.rejects(server.commitFinance(input,'tester',{env,fetcher}),e=>e.uncertain);
  assert.equal(commits,1);const result=await server.commitFinance(input,'tester',{env,fetcher});assert.equal(commits,1);assert.equal(result.requestId,input.requestId);
});
await check('comprobante incorrecto no se presenta como guardado verificado',async()=>{
  const requestId=crypto.randomUUID();const base={ok:true,id:'m',ids:['m'],requestId,revision:'1',balanceUpdates:0,savedAt:new Date().toISOString()};
  for(const patch of [{requestId:crypto.randomUUID()},{ids:['m','m']},{balanceUpdates:1},{revision:1}]){
    await assert.rejects(server.commitFinance({requestId,revision:'0',change:change()},'tester',{env,fetcher:async()=>Response.json({...base,...patch})}),e=>e.uncertain&&e.code==='invalid_receipt');
  }
});

const route=await import(compile('app/api/panel/finance/route.ts'));
const access=await import(compile('src/lib/panel-access.ts'));
const previous=Object.fromEntries([...Object.keys(env),'AIRTABLE_PANEL_TOKEN'].map(k=>[k,process.env[k]]));
const nativeFetch=globalThis.fetch;let requests=0;
try{
  Object.assign(process.env,env,{AIRTABLE_PANEL_TOKEN:'TEST_DEVICE_KEY_ONLY'});
  globalThis.fetch=async()=>{requests++;return Response.json(fixture());};
  await check('API exige sesión y mismo origen antes de acceder a finanzas',async()=>{
    const anonymous=await route.GET(new Request('https://example.test/api/panel/finance'));assert.equal(anonymous.status,401);assert.equal(requests,0);
    const wrong=await route.POST(new Request('https://example.test/api/panel/finance',{method:'POST',headers:{origin:'https://other.test','content-type':'application/json'},body:'{}'}));assert.equal(wrong.status,403);assert.equal(requests,0);
    const cookie=`${access.DEVICE_COOKIE}=${access.issueDevice()}`;
    const response=await route.GET(new Request('https://example.test/api/panel/finance',{headers:{cookie}}));
    assert.equal(response.status,200);assert.match(response.headers.get('cache-control'),/private, no-store/);assert.equal(requests,1);
    const data=await response.json();assert.equal(data.obligations.length,1);
    process.env.PANEL_DATA_SOURCE='airtable';
    const disabled=await route.GET(new Request('https://example.test/api/panel/finance',{headers:{cookie}}));assert.equal(disabled.status,409);assert.equal(requests,1);
  });
} finally {
  globalThis.fetch=nativeFetch;
  for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
}
await check('formulario edita solo campos modificados y conserva vacíos históricos',()=>{
  const s=fixture();s.movements[0].fields[F.movements.date.id]=null;
  const d=workflow.newFinanceDraft('movements',s,s.movements[0]);
  d.values[F.movements.notes.id]='Nota nueva sin inventar fecha';
  const input=workflow.buildFinanceSubmission(d,s,crypto.randomUUID());
  assert.deepEqual(input.change.record.fields,{[F.movements.notes.id]:'Nota nueva sin inventar fecha'});
  assert.equal(input.change.record.id,'m');assert.equal(input.revision,s.revision);
  assert.ok(workflow.financeWarnings(s.movements[0],'movements',s).some(x=>x.includes('sin fecha')));
  assert.throws(()=>workflow.buildFinanceSubmission({...d,revision:'0'},s,crypto.randomUUID()));
});
await check('formulario exige campos confirmados y no distribuye importes automáticamente',()=>{
  const s=fixture();s.obligations.push(record('obligations','other',{name:'Otra deuda',type:'Por cobrar',status:'Pendiente',currency:'BRL',originalAmount:'100.10',balance:'100.10'}));
  const d=workflow.newFinanceDraft('movements',s);
  Object.assign(d.values,{[F.movements.name.id]:'Pago con dos vínculos',[F.movements.type.id]:'Ingreso',[F.movements.status.id]:'Confirmado',
    [F.movements.amount.id]:'0,30',[F.movements.currency.id]:'BRL',[F.movements.obligations.id]:['other','o']});
  assert.throws(()=>workflow.buildFinanceSubmission(d,s,crypto.randomUUID()),/fecha/);
  d.values[F.movements.date.id]='2026-09-08';
  const input=workflow.buildFinanceSubmission(d,s,crypto.randomUUID());assert.equal(input.change.balances,undefined);
  assert.deepEqual(input.change.record.fields[F.movements.obligations.id],['other','o']);assert.equal(input.change.record.fields[F.movements.amount.id],'0.30');
  d.balances.o={enabled:true,newBalance:'100,00',state:'Parcial'};
  assert.throws(()=>workflow.buildFinanceSubmission(d,s,crypto.randomUUID()),/distribuye/);
  d.balanceReason='Distribución explícita aprobada';
  assert.deepEqual(workflow.buildFinanceSubmission(d,s,crypto.randomUUID()).change.balances,[{id:'o',oldBalance:'100.10',newBalance:'100.00',state:'Parcial'}]);
  d.values[F.movements.obligations.id]=['other'];assert.throws(()=>workflow.buildFinanceSubmission(d,s,crypto.randomUUID()),/vinculada/);
});
await check('revisión de lectura compara datos exactos y distingue ediciones posteriores',()=>{
  const s=fixture(),id=crypto.randomUUID(),d=workflow.newFinanceDraft('movements',s,s.movements[0]);d.values[F.movements.amount.id]='0,40';
  const input=workflow.buildFinanceSubmission(d,s,id);
  const receipt={ok:true,id:'m',ids:['m'],requestId:id,revision:s.revision,balanceUpdates:0,savedAt:s.updatedAt};
  assert.throws(()=>workflow.verifyFinanceReadback(s,input,receipt));s.movements[0].fields[F.movements.amount.id]='0.4';
  assert.equal(workflow.verifyFinanceReadback(s,input,receipt),'verified');s.revision=String(BigInt(s.revision)+1n);
  assert.equal(workflow.verifyFinanceReadback(s,input,receipt),'newer');
});
await check('recuperación conserva UUID y no pierde intentos si luego vence la sesión',()=>{
  const submission={requestId:crypto.randomUUID(),revision:'12',change:change()};
  assert.deepEqual(workflow.parsePendingFinance({v:1,actor:'pablo',submission},'pablo'),submission);
  assert.equal(workflow.parsePendingFinance({v:1,actor:'pablo',submission},'another'),null);
  assert.equal(workflow.retainFinanceAttempt({uncertain:true,code:'connection'},false),true);
  assert.equal(workflow.retainFinanceAttempt({uncertain:false,code:'request'},true),true);
  assert.equal(workflow.retainFinanceAttempt({uncertain:false,code:'storage'},true),true);
  assert.equal(workflow.retainFinanceAttempt({uncertain:false,code:'invalid'},false),false);
  assert.equal(workflow.retainFinanceAttempt({uncertain:false,code:'conflict'},true),false);
  assert.equal(workflow.formatFinanceAmount(null,'BRL'),'No informado');assert.equal(workflow.formatFinanceAmount('1234.50','ARS'),'1.234,50 ARS');
});
const preview=await import(compile('src/lib/finance-preview.ts'));
const now=Date.now();
const panelPermission={publishableKey:'sb_publishable_TEST_ONLY',readToken:'1'.repeat(64),deviceSecret:'2'.repeat(64),bootstrapHash:'3'.repeat(64),expiresAt:now+3600000};
const financePermission={readToken:'4'.repeat(64),expiresAt:now+1800000};
const previewEnv={...env,VERCEL_ENV:'preview',VERCEL_GIT_COMMIT_REF:'codex/supabase-operativo-preview',
  OPERATIONS_PREVIEW_CONFIG:JSON.stringify(panelPermission),OPERATIONS_FINANCE_PREVIEW_CONFIG:JSON.stringify(financePermission)};
await check('permiso financiero independiente exige rama, vencimiento y token distinto',async()=>{
  assert.equal(preview.financePreviewConfig(previewEnv,now).key,panelPermission.publishableKey);
  for(const override of [{VERCEL_ENV:'production'},{VERCEL_GIT_COMMIT_REF:'main'},
    {OPERATIONS_FINANCE_PREVIEW_CONFIG:undefined},{OPERATIONS_PREVIEW_CONFIG:undefined},
    {OPERATIONS_FINANCE_PREVIEW_CONFIG:JSON.stringify({...financePermission,readToken:panelPermission.readToken})},
    {OPERATIONS_FINANCE_PREVIEW_CONFIG:JSON.stringify({...financePermission,readToken:panelPermission.deviceSecret})},
    {OPERATIONS_FINANCE_PREVIEW_CONFIG:JSON.stringify({...financePermission,expiresAt:now})},
    {OPERATIONS_FINANCE_PREVIEW_CONFIG:JSON.stringify({...financePermission,expiresAt:panelPermission.expiresAt+1})},
    {OPERATIONS_FINANCE_PREVIEW_CONFIG:JSON.stringify({...financePermission,key:'sb_secret_DO_NOT_USE'})}]){
    assert.throws(()=>preview.financePreviewConfig({...previewEnv,...override},now));
    if(override.VERCEL_ENV==='production')continue; // Production still uses its own explicit source policy.
    let calls=0;
    await assert.rejects(server.readFinanceSnapshot({env:{...previewEnv,...override},fetcher:()=>{calls++;throw new Error('Must not fetch');}}),e=>e.code==='preview');
    assert.equal(calls,0);
  }
});
await check('preview financiero solo lee RPC limitado sin claves privadas ni escrituras',async()=>{
  let calls=0;
  const options={env:previewEnv,fetcher:async(endpoint,init)=>{
    calls++;assert.equal(endpoint,'https://lqsnrqnmmeyzcnurfpos.supabase.co/rest/v1/rpc/ut_finance_preview_v1');
    assert.equal(init.headers.apikey,panelPermission.publishableKey);assert.equal(init.headers.Authorization,undefined);
    assert.deepEqual(JSON.parse(init.body),{p_token:financePermission.readToken});assert.equal(init.cache,'no-store');assert.equal(init.redirect,'error');
    return Response.json({...fixture(),status:'staged'});
  }};
  const s=await server.readFinanceSnapshot(options);assert.equal(s.readOnly,true);assert.equal(s.status,'staged');assert.equal(calls,1);
  assert.equal(JSON.stringify(s).includes(financePermission.readToken),false);
  const id=crypto.randomUUID();
  await assert.rejects(server.commitFinance({requestId:id,revision:'0',change:change()},'tester',options),e=>e.code==='preview'&&!e.uncertain);
  await assert.rejects(server.financeReceipt(id,'tester',change(),options),e=>e.code==='preview');assert.equal(calls,1);
  await assert.rejects(server.readFinanceSnapshot({...options,fetcher:async()=>Response.json({message:financePermission.readToken},{status:401})}),e=>e.status===503&&!e.message.includes(financePermission.readToken));
});
await check('API preview autentica el dispositivo y marca solo lectura; POST no llega a la base',async()=>{
  const before=Object.fromEntries(Object.keys(previewEnv).map(k=>[k,process.env[k]])),oldFetch=globalThis.fetch;
  let calls=0;
  try{
    Object.assign(process.env,previewEnv);
    globalThis.fetch=async()=>{calls++;return Response.json({...fixture(),status:'staged'});};
    const cookie=`${access.DEVICE_COOKIE}=${access.issueDevice()}`;
    const url='https://preview.example.test/api/panel/finance';
    const denied=await route.GET(new Request(url));assert.equal(denied.status,401);assert.equal(calls,0);
    const response=await route.GET(new Request(url,{headers:{cookie}}));assert.equal(response.status,200);
    const value=await response.json();assert.equal(value.readOnly,true);assert.equal(value.status,'staged');assert.ok(value.actor);assert.equal(calls,1);
    const post=await route.POST(new Request(url,{method:'POST',headers:{cookie,origin:'https://preview.example.test','content-type':'application/json'},body:JSON.stringify({requestId:crypto.randomUUID(),revision:'0',change:change()})}));
    assert.equal(post.status,409);assert.equal((await post.json()).code,'preview');assert.equal(calls,1);
  }finally{
    globalThis.fetch=oldFetch;
    for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
  }
});
console.log(`${count} finance checks passed`);
