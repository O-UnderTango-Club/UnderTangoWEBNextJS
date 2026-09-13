const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

async function main() {
  const config = require('../next.config.js');
  const redirects = await config.redirects();
  assert.equal(redirects.length, 2);
  assert.deepEqual(redirects.map(r => r.has[0].value), ['www.undertangoclub.com', 'undertangoclub.com']);
  for (const r of redirects) {
    assert.equal(r.source, '/index.html');
    assert.equal(r.destination, 'https://www.undertangoclub.com/');
    assert.equal(r.permanent, true);
    assert.equal(r.has[0].type, 'host');
  }
  for (const route of ['faq', 'reservas', 'proyectos']) {
    const source = fs.readFileSync(path.join(__dirname, '../app', route, 'layout.tsx'), 'utf8');
    const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
    const exports = {};
    new Function('exports', 'require', compiled)(exports, id => id.endsWith('.css') ? {} : require(id));
    assert.equal(exports.metadata.alternates.canonical, `https://www.undertangoclub.com/${route}`);
    assert.ok(exports.metadata.title.includes('UnderTango'));
    assert.ok(!source.includes('use client'));
  }
  console.log('SEO: redirecciones limitadas al dominio principal y 3 páginas con canonical propio verificadas.');
}
main().catch(e => { console.error(e); process.exitCode = 1; });
