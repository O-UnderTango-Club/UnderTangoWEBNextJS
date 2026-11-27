// The tab keeps its own handle. Only the finished clip is written to this device.
const key = 'primera-voluntad.toma';
let connection;
function db() {
  if (!connection) connection = new Promise((resolve, reject) => {
    const req = indexedDB.open('primera-voluntad-clips', 1);
    req.onupgradeneeded = () => {
      const takes = req.result.createObjectStore('takes', { keyPath: 'id' });
      takes.createIndex('saved', 'saved');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return connection;
}
export function savedId() {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
async function change(write) {
  const tx = (await db()).transaction('takes', 'readwrite');
  const done = new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
  write(tx.objectStore('takes'));
  await done;
}
export async function rememberTake(file, won, source, photoOffsets) {
  const old = savedId(), id = old || crypto.randomUUID();
  try {
    // ArrayBuffer is portable across WebKit storage backends, including private tabs.
    const bytes = await file.arrayBuffer();
    sessionStorage.setItem(key, id);
    await change(store => {
      store.put({ id, bytes, name: file.name, type: file.type, won, source, photoOffsets, saved: Date.now() });
      // Closed tabs can leave orphaned recordings. Reclaim these on a later save.
      const expired = IDBKeyRange.upperBound(Date.now() - 7 * 86400000);
      store.index('saved').openKeyCursor(expired).onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) return;
        store.delete(cursor.primaryKey);
        cursor.continue();
      };
    });
    return true;
  } catch {
    if (!old && savedId() === id) {
      try { sessionStorage.removeItem(key); } catch { /* Storage may be disabled. */ }
    }
    return false;
  }
}
export async function readTake() {
  const id = savedId();
  if (!id) return null;
  try {
    const tx = (await db()).transaction('takes');
    const record = await new Promise((resolve, reject) => {
      const req = tx.objectStore('takes').get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (record?.bytes?.byteLength && savedId() === id)
      return { won: record.won, source: record.source, photoOffsets: record.photoOffsets, file: new File([record.bytes], record.name, { type: record.type }) };
  } catch { /* In-memory playback still works if device storage is unavailable. */ }
  return null;
}
export function markReturn(away) {
  try {
    if (away) sessionStorage.setItem(key + '.away', '1');
    else sessionStorage.removeItem(key + '.away');
  } catch { /* The open page retains its File. */ }
}
export function returningFromApp() {
  try { return sessionStorage.getItem(key + '.away') === '1'; } catch { return false; }
}
