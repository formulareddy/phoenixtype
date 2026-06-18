type Filename = "LocalFontFamilyFile" | "LocalBackgroundFile";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("MonkeytypeReplica", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

const storage = {
  async storeFile(filename: Filename, dataUrl: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").put(dataUrl, filename);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async getFile(filename: Filename): Promise<string | undefined> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readonly");
      const req = tx.objectStore("files").get(filename);
      req.onsuccess = () => resolve(req.result ?? undefined);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  },

  async deleteFile(filename: Filename): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("files", "readwrite");
      tx.objectStore("files").delete(filename);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async hasFile(filename: Filename): Promise<boolean> {
    return (await this.getFile(filename)) !== undefined;
  },
};

export default storage;
