import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recordAnalytics } from '../src/lib/analytics-server.ts';

const request = body => new Request('https://www.undertangoclub.com/api/event', { method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body) });
test('rejects malformed, null, array, oversized and invalid events without storage writes', async () => {
  for (const body of ['broken', 'null', '[]', { event: 'unsupported' }]) {
    assert.equal((await recordAnalytics(request(body), 'aprende')).status, 400);
  }
  assert.equal((await recordAnalytics(request('x'.repeat(32769)), 'aprende')).status, 413);
});
test('requires private server configuration', async () => {
  delete process.env.ANALYTICS_SUPABASE_URL;
  delete process.env.ANALYTICS_SUPABASE_SECRET_KEY;
  assert.equal((await recordAnalytics(request({ event: 'page_view' }), 'aprende')).status, 503);
});
test('preserves attribution, separates sites and uses idempotent private storage', async () => {
  process.env.ANALYTICS_SUPABASE_URL = 'https://test.supabase.co';
  process.env.ANALYTICS_SUPABASE_SECRET_KEY = 'test-server-key';
  const original = globalThis.fetch;
  const sent = [];
  globalThis.fetch = async (url, init) => { sent.push({ url, init, row: JSON.parse(init.body) }); return new Response(null, { status: 201 }); };
  try {
    for (const source of ['aprende', 'undertango']) {
      const response = await recordAnalytics(request({ event: 'page_view', eventId: 'same-id', visitorId: 'v1', sessionId: 's1', path: '/?utm_campaign=test', utmCampaign: 'test', intent: 'contratar_show', cta: 'Show', source: 'forged' }), source);
      assert.equal(response.status, 200);
    }
    assert.deepEqual(sent.map(x => x.row.source), ['aprende', 'undertango']);
    assert.equal(sent[0].row.intent, '');
    assert.equal(sent[1].row.intent, 'contratar_show');
    for (const x of sent) {
      assert.equal(x.row.event_id, 'same-id');
      assert.equal(x.row.utm_campaign, 'test');
      assert.equal(x.row.visitor_id, 'v1');
      assert.equal(x.row.storage_id, `${x.row.source}:same-id`);
      assert.match(x.url, /on_conflict=storage_id$/);
      assert.match(x.init.headers.Prefer, /ignore-duplicates/);
      assert.equal(x.init.headers.apikey, 'test-server-key');
    }
  } finally { globalThis.fetch = original; }
});
test('does not acknowledge failed or unreachable storage', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('private upstream error', { status: 503 });
    assert.equal((await recordAnalytics(request({ event: 'form_click' }), 'aprende')).status, 502);
    globalThis.fetch = async () => { throw new Error('network failure'); };
    assert.equal((await recordAnalytics(request({ event: 'page_view' }), 'undertango')).status, 502);
  } finally { globalThis.fetch = original; }
});
