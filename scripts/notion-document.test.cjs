const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { test } = require('node:test');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const file = 'src/lib/notion-document.ts';
const compilerOptions = { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true };
function load(responses, token = 'test-secret') {
  const calls = [];
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions }).outputText, {
    exports, require: name => { assert.equal(name, 'server-only'); return {}; },
    process: { env: { NOTION_API_KEY: token } }, URL, AbortSignal,
    fetch: async (url, options) => {
      calls.push({ url, options });
      assert.equal(options.cache, 'no-store');
      assert.equal(options.headers.Authorization, 'Bearer test-secret');
      const response = responses.shift();
      assert.ok(response, 'unexpected API request');
      return { ok: !response.status, status: response.status || 200, json: async () => response };
    },
  });
  return { api: exports, calls };
}
const text = value => [{ plain_text: value }];
const page = { properties: { title: { type: 'title', title: text('Documento de prueba') } } };
const paragraph = (id, value) => ({ id, type: 'paragraph', paragraph: { rich_text: text(value) } });

test('paginates, preserves nested content and never follows child pages', async () => {
  const { api, calls } = load([page,
    { results: [{ ...paragraph('parent', 'Original'), has_children: true }, { id: 'private', type: 'child_page', has_children: true }], has_more: true, next_cursor: 'next cursor' },
    { results: [paragraph('nested', 'Nested')], has_more: false },
    { results: [paragraph('last', 'Last')], has_more: false },
  ]);
  const doc = await api.getReviewDocument();
  assert.equal(doc.title, 'Documento de prueba');
  assert.equal(doc.blocks.length, 3);
  assert.equal(doc.blocks[0].children[0].paragraph.rich_text[0].plain_text, 'Nested');
  assert.equal(calls.length, 4);
  assert.ok(calls[3].url.endsWith('start_cursor=next%20cursor'));
  assert.ok(calls.every(call => !call.url.includes('private')));
});
test('missing key makes no API request', async () => {
  const { api, calls } = load([], '');
  assert.equal(await api.getReviewDocument(), null);
  assert.equal(calls.length, 0);
});
test('denied, archived and broken pagination fail without leaking secrets', async () => {
  for (const responses of [[{ status: 403 }], [{ ...page, archived: true }], [page, { results: [], has_more: true, next_cursor: null }]]) {
    const { api } = load(responses);
    await assert.rejects(api.getReviewDocument(), error => !error.message.includes('test-secret'));
  }
});
test('fresh reads reflect edits and renew image URLs', async () => {
  const { api } = load([page, { results: [paragraph('a', 'Before')], has_more: false }, page, { results: [paragraph('a', 'After')], has_more: false }]);
  assert.equal((await api.getReviewDocument()).blocks[0].paragraph.rich_text[0].plain_text, 'Before');
  assert.equal((await api.getReviewDocument()).blocks[0].paragraph.rich_text[0].plain_text, 'After');
});
test('only safe link protocols are allowed', () => {
  const { api } = load([]);
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///secret', '//unknown']) assert.equal(api.safeUrl(url), undefined);
  assert.equal(api.safeUrl('http://example.com/image.png', true), undefined);
  assert.equal(api.safeUrl('https://example.com/image.png', true), 'https://example.com/image.png');
});
test('renders source text safely, complete image and grouped lists; fallback has no credential', async () => {
  const { api } = load([]);
  const exports = {};
  let fail = false;
  const source = fs.readFileSync('app/80/diapositivas-y-discurso/page.tsx', 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions }).outputText, {
    exports,
    require: name => {
      if (name === '@/src/lib/notion-document') return { ...api, getReviewDocument: async () => {
        if (fail) throw Error('test-secret');
        return { title: 'Review', blocks: [paragraph('one', '<script>do not execute</script>'),
          { id: 'img', type: 'image', image: { file: { url: 'https://example.com/one.png' }, caption: text('Original image') } },
          ...['a', 'b'].map(id => ({ id, type: 'numbered_list_item', numbered_list_item: { rich_text: text(id) } })),
          { id: 'unknown', type: 'unsupported' },
        ] };
      } };
      if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (name.endsWith('.css')) return {};
      return require(name);
    },
  });
  const html = renderToStaticMarkup(await exports.default());
  assert.ok(html.includes('&lt;script&gt;do not execute&lt;/script&gt;'));
  assert.ok(html.includes('alt="Original image"'));
  assert.equal((html.match(/<ol>/g) || []).length, 1);
  assert.equal((html.match(/<li>/g) || []).length, 2);
  assert.ok(html.includes('Este bloque se puede consultar'));
  fail = true;
  const fallback = renderToStaticMarkup(await exports.default());
  assert.ok(fallback.includes('no se puede mostrar'));
  assert.ok(!fallback.includes('test-secret'));
});
