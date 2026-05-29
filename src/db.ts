import { ScannedDoc, ConversionHistoryItem, UserPreferences } from './types';

const DB_NAME = 'ScannerProDB';
const DB_VERSION = 1;

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('scans')) {
        db.createObjectStore('scans', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('conversions')) {
        db.createObjectStore('conversions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

// Scans Store
export async function saveScan(doc: ScannedDoc): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('scans', 'readwrite');
    const store = transaction.objectStore('scans');
    const request = store.put(doc);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllScans(): Promise<ScannedDoc[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('scans', 'readonly');
    const store = transaction.objectStore('scans');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteScan(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('scans', 'readwrite');
    const store = transaction.objectStore('scans');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Conversions Store
export async function saveConversion(item: ConversionHistoryItem): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('conversions', 'readwrite');
    const store = transaction.objectStore('conversions');
    // Keep list clean (e.g. limit to 20 or so if preferred, but let's just write and let users bulk clear)
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllConversions(): Promise<ConversionHistoryItem[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('conversions', 'readonly');
    const store = transaction.objectStore('conversions');
    const request = store.getAll();
    request.onsuccess = () => {
      const list = request.result || [];
      // Sort in-memory descending by date
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function deleteConversion(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('conversions', 'readwrite');
    const store = transaction.objectStore('conversions');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllConversions(): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('conversions', 'readwrite');
    const store = transaction.objectStore('conversions');
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Settings Store
export async function getStoredPreferences(): Promise<UserPreferences | null> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readonly');
    const store = transaction.objectStore('settings');
    const request = store.get('user_prefs');
    request.onsuccess = () => resolve(request.result?.value || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStoredPreferences(prefs: UserPreferences): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put({ key: 'user_prefs', value: prefs });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getStorageEstimate(): Promise<{ used: number; total: number; percentage: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 4 * 1024 * 1024 * 1024; // Default to 4GB if quota undefined
      return {
        used,
        total,
        percentage: Math.min(100, Math.round((used / total) * 100))
      };
    } catch {
      // Fallback
    }
  }
  return { used: 0, total: 4 * 1024 * 1024 * 1024, percentage: 0 };
}
