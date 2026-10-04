import { ProductData, EvaluationData } from '../components/ProductResultCard.tsx';

export interface CachedProductReport {
  barcode: string;
  product: ProductData;
  evaluation: EvaluationData;
  timestamp: number;
  cachedAt: string;
  isOfflineAvailable: boolean;
}

const DB_NAME = 'HalalCheckDB';
const DB_VERSION = 1;
const STORE_NAME = 'scanned_reports';

// In-memory fallback if IndexedDB is blocked or unsupported
const memoryFallbackMap = new Map<string, CachedProductReport>();

function isIndexedDBSupported(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
}

/**
 * Initializes and returns the IndexedDB database instance.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBSupported()) {
      return reject(new Error('IndexedDB is not supported in this browser environment.'));
    }

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'barcode' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('productName', 'product.product_name', { unique: false });
          store.createIndex('status', 'evaluation.status', { unique: false });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB database.'));
      };
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Stores or updates a product report in IndexedDB cache.
 */
export async function cacheProductReport(
  product: ProductData,
  evaluation: EvaluationData
): Promise<CachedProductReport> {
  const cleanBarcode = String(product.code || '').trim();
  if (!cleanBarcode) {
    throw new Error('Barcode is required to cache product report.');
  }

  const record: CachedProductReport = {
    barcode: cleanBarcode,
    product,
    evaluation,
    timestamp: Date.now(),
    cachedAt: new Date().toISOString(),
    isOfflineAvailable: true,
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const putRequest = store.put(record);

      putRequest.onsuccess = () => {
        // Also sync in-memory map
        memoryFallbackMap.set(cleanBarcode, record);
        resolve(record);
      };

      putRequest.onerror = () => {
        // Fallback to memory
        memoryFallbackMap.set(cleanBarcode, record);
        resolve(record);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (e) {
    console.warn('IndexedDB unavailable, caching in memory fallback:', e);
    memoryFallbackMap.set(cleanBarcode, record);
    return record;
  }
}

/**
 * Retrieves a single cached product report by barcode.
 */
export async function getCachedProductReport(barcode: string): Promise<CachedProductReport | null> {
  const cleanBarcode = String(barcode || '').trim();
  if (!cleanBarcode) return null;

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(cleanBarcode);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          resolve(getRequest.result as CachedProductReport);
        } else {
          // Check memory fallback
          resolve(memoryFallbackMap.get(cleanBarcode) || null);
        }
      };

      getRequest.onerror = () => {
        resolve(memoryFallbackMap.get(cleanBarcode) || null);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return memoryFallbackMap.get(cleanBarcode) || null;
  }
}

/**
 * Retrieves all cached product reports sorted by newest first.
 */
export async function getAllCachedReports(): Promise<CachedProductReport[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        const results = (getAllRequest.result || []) as CachedProductReport[];
        results.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(results);
      };

      getAllRequest.onerror = () => {
        const memResults = Array.from(memoryFallbackMap.values());
        memResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        resolve(memResults);
      };

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    const memResults = Array.from(memoryFallbackMap.values());
    memResults.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return memResults;
  }
}

/**
 * Deletes a cached report by barcode.
 */
export async function deleteCachedReport(barcode: string): Promise<void> {
  const cleanBarcode = String(barcode || '').trim();
  memoryFallbackMap.delete(cleanBarcode);

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(cleanBarcode);

      req.onsuccess = () => resolve();
      req.onerror = () => resolve();

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    // ignore
  }
}

/**
 * Clears all cached reports from IndexedDB.
 */
export async function clearAllCachedReports(): Promise<void> {
  memoryFallbackMap.clear();

  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => resolve();

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    // ignore
  }
}

/**
 * Returns total count of cached reports.
 */
export async function getCachedReportsCount(): Promise<number> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const countReq = store.count();

      countReq.onsuccess = () => resolve(countReq.result || 0);
      countReq.onerror = () => resolve(memoryFallbackMap.size);

      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch {
    return memoryFallbackMap.size;
  }
}

/**
 * Seeds initial benchmark/cached items into IndexedDB if empty
 */
export async function seedInitialCache(
  items: { product: ProductData; evaluation: EvaluationData }[]
): Promise<void> {
  try {
    const count = await getCachedReportsCount();
    if (count === 0 && items && items.length > 0) {
      for (const item of items) {
        if (item.product && item.product.code) {
          await cacheProductReport(item.product, item.evaluation);
        }
      }
    }
  } catch (e) {
    console.warn('Could not seed initial cache:', e);
  }
}
