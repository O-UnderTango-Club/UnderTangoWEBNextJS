const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('app/api/panel/finance/reconstruction/route.ts', 'utf8');
const js = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
class PanelError extends Error { constructor(message,status=400) { super(message);this.status=status; } }
async function run({auth=true,env={PANEL_DATA_SOURCE:'supabase',VERCEL_ENV:'production'},fail=false,missing=false}={}) {
  let reads=0;
  const context={exports:{},process:{env},require(name){
    if(name==='next/server')return {NextResponse:{json(body,options){return {body,...options};}}};
    if(name.endsWith('panel-server'))return {PanelError,authorize:async()=>{if(!auth)throw new PanelError('Unauthorized',401);}};
    if(name.endsWith('panel-model'))return {F:{tasks:{name:'name',status:'status',result:'result'}}};
    if(name.endsWith('finance-server'))return {readFinanceSnapshot:async()=>{reads++;return {revision:'1'};}};
    if(name.endsWith('finance-report'))return {buildFinanceReport: snapshot=>({year:2026,revision:snapshot.revision})};
    if(name.endsWith('panel-operations'))return {readOperationsSnapshot:async()=>{reads++;if(fail)throw new Error('private upstream value');return {tasks:missing?[]:[{id:'recF3AXDHq0OoABoa',fields:{name:'Informe',status:'Pendiente',result:'Primera línea\\nSegunda línea'}}]};}};
    throw new Error(name);
  }};
  vm.runInNewContext(js,context);
  const response=await context.exports.GET({});
  assert.equal(response.headers['Cache-Control'],'private, no-store, max-age=0');
  return {response,reads};
}
(async()=>{
  let r=await run({auth:false});assert.equal(r.response.status,401);assert.equal(r.reads,0);
  r=await run({env:{VERCEL_ENV:'preview',PANEL_DATA_SOURCE:'supabase'}});assert.equal(r.response.status,409);assert.equal(r.reads,0);
  r=await run({env:{PANEL_DATA_SOURCE:'airtable'}});assert.equal(r.response.status,409);assert.equal(r.reads,0);
  r=await run();assert.equal(r.reads,2);assert.equal(r.response.body.result,'Primera línea\nSegunda línea');assert.equal(r.response.body.dashboard.year,2026);
  r=await run({missing:true});assert.equal(r.response.status,404);
  r=await run({fail:true});assert.equal(r.response.status,503);assert.ok(!JSON.stringify(r.response).includes('private upstream value'));
  console.log('6 comprobaciones correctas: acceso, preview, fuente, lectura, ausencia y error privado.');
})().catch(e=>{console.error(e);process.exitCode=1;});
