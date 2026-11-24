export type LibraryFile = {id:string; file:File};

// Keep the operator's MP3s on this browser. One store is shared by both decks.
export async function djFiles(files?: LibraryFile[]): Promise<LibraryFile[]> {
  const db = await new Promise<IDBDatabase>((resolve,reject) => {
    const request = indexedDB.open("860-multiversos-dj",1);
    request.onupgradeneeded = () => request.result.createObjectStore("tracks",{keyPath:"id"});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<LibraryFile[]>((resolve,reject) => {
      const tx = db.transaction("tracks", files ? "readwrite" : "readonly");
      const store = tx.objectStore("tracks");
      const read = files ? null : store.getAll();
      if (files) for (const record of files) store.put(record);
      tx.oncomplete = () => resolve(read?.result ?? []);
      tx.onabort = tx.onerror = () => reject(tx.error ?? Error("Biblioteca sin espacio"));
    });
  } finally { db.close(); }
}
