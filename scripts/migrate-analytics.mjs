// Run with Node 24 and private ANALYTICS_SUPABASE_* environment variables.
// Reads a complete Airtable connector export; never deletes source records.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const [backupPath] = process.argv.slice(2);
if (!backupPath) throw new Error('Usage: node scripts/migrate-analytics.mjs /private/path/export.json');
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8').replace(/^\uFEFF/, ''));
const maps = {
  'tblJwm7MNgWaE7H8S': 'aprende',
  'tbl1rWfynUYLROCqP': 'undertango',
};
const fields = { 'Evento ID': 'event_id', 'Fecha y hora': 'occurred_at', 'Evento': 'event', 'Visitante anónimo': 'visitor_id', 'Sesión': 'session_id', 'Path': 'path', 'Destino': 'destination', 'Intención': 'intent', 'Subintención': 'subintent', 'CTA': 'cta', 'UTM source': 'utm_source', 'UTM medium': 'utm_medium', 'UTM campaign': 'utm_campaign', 'UTM content': 'utm_content', 'Referrer': 'referrer', 'Notas': 'notes' };
const rows = backup.tables.flatMap(table => {
  const source = maps[table.id];
  assert.ok(source, 'Unexpected source table');
  return table.records.map(record => {
    const row = { source, airtable_record_id: record.id, airtable_record: record };
    for (const field of table.fields) {
      const column = fields[field.name];
      if (!column) continue;
      const value = record.cellValuesByFieldId[field.id];
      row[column] = value?.name ?? value ?? '';
    }
    row.event_id ||= `airtable_${record.id}`;
    row.occurred_at ||= record.createdTime;
    for (const column of Object.values(fields)) row[column] ??= '';
    return row;
  });
});
assert.equal(new Set(rows.map(r => `${r.source}:${r.event_id}`)).size, rows.length, 'Repeated historical event IDs: investigate before migration');
const url = process.env.ANALYTICS_SUPABASE_URL;
const key = process.env.ANALYTICS_SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Private server configuration missing');
const headers = { apikey: key, 'Content-Type': 'application/json' };
for (let offset = 0; offset < rows.length; offset += 100) {
  const result = await fetch(`${url}/rest/v1/analytics_events?on_conflict=source,event_id`, { method: 'POST', headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(offset, offset + 100)), signal: AbortSignal.timeout(30000) });
  if (!result.ok) throw new Error(`Import failed: HTTP ${result.status}`);
}
const result = await fetch(`${url}/rest/v1/analytics_events?airtable_record_id=not.is.null&select=*&limit=10000`, { headers, signal: AbortSignal.timeout(30000) });
if (!result.ok) throw new Error(`Verification failed: HTTP ${result.status}`);
const migrated = new Map((await result.json()).map(row => [row.airtable_record_id, row]));
for (const row of rows) {
  const actual = migrated.get(row.airtable_record_id);
  assert.ok(actual, `Missing record ${row.airtable_record_id}`);
  for (const [column, value] of Object.entries(row)) {
    if (column === 'occurred_at') assert.equal(Date.parse(actual[column]), Date.parse(value));
    else assert.deepEqual(actual[column], value, `Mismatch ${row.airtable_record_id}/${column}`);
  }
}
console.log(JSON.stringify({ verified: rows.length, bySource: Object.fromEntries(Object.values(maps).map(source => [source, rows.filter(r => r.source === source).length])), rawRecordsAndAllFieldsVerified: true }));
