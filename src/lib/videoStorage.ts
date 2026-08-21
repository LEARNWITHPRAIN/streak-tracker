// IndexedDB storage for motivation videos and Instagram links
const DB_NAME = 'yodha_fuel';
const STORE_NAME = 'fuel_items';
const DB_VERSION = 2;

export type FuelItemType = 'local_video' | 'instagram_embed' | 'youtube_short';

export interface StoredFuelItem {
  id: string;
  type: FuelItemType;
  name: string;
  content: ArrayBuffer | string; // ArrayBuffer for video, URL string for Instagram
  mimeType?: string; // Only for videos
  createdAt: number;
}

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Delete old store if exists
      if (db.objectStoreNames.contains('videos')) {
        db.deleteObjectStore('videos');
      }
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

export const saveFuelItemToDB = async (item: StoredFuelItem): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(item);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
};

export const removeFuelItemFromDB = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    
    transaction.oncomplete = () => db.close();
  });
};

export const getAllFuelItemsFromDB = async (): Promise<StoredFuelItem[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      // Sort by createdAt descending (newest first)
      const items = request.result.sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    
    transaction.oncomplete = () => db.close();
  });
};

export const getStorageUsage = async (): Promise<number> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      let totalBytes = 0;
      for (const item of request.result) {
        if (item.type === 'local_video' && item.content instanceof ArrayBuffer) {
          totalBytes += item.content.byteLength;
        } else if (typeof item.content === 'string') {
          totalBytes += new Blob([item.content]).size;
        }
      }
      resolve(totalBytes);
    };
    
    transaction.oncomplete = () => db.close();
  });
};

export const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

export const arrayBufferToObjectUrl = (buffer: ArrayBuffer, mimeType: string): string => {
  const blob = new Blob([buffer], { type: mimeType });
  return URL.createObjectURL(blob);
};

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const extractInstagramId = (url: string): string | null => {
  // Normalize: remove query params and fragments for ID extraction, but keep the path
  let cleanUrl = url.trim();
  // Remove fragment
  cleanUrl = cleanUrl.split('#')[0];
  // Remove query string
  const queryIdx = cleanUrl.indexOf('?');
  const pathUrl = queryIdx !== -1 ? cleanUrl.substring(0, queryIdx) : cleanUrl;

  // Support various Instagram URL formats
  const patterns = [
    /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/,
    /instagr\.am\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/,
    // Handle /username/p/ID or /username/reel/ID style
    /instagram\.com\/[^/]+\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/,
  ];

  for (const pattern of patterns) {
    // Try on path-only URL first, then full URL (handles query string edge cases)
    const matchPath = pathUrl.match(pattern);
    if (matchPath) return matchPath[1];
    const matchFull = url.match(pattern);
    if (matchFull) return matchFull[1];
  }
  return null;
};

export const isValidInstagramUrl = (url: string): boolean => {
  const trimmed = url.trim();
  // Must contain instagram.com and have a reel/post path segment
  return /instagram\.com/.test(trimmed) && /\/(p|reel|reels)\/[A-Za-z0-9_-]+/.test(trimmed);
};

export const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /youtube\.com\/shorts\/([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{6,})/,
    /youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

export const isValidYouTubeUrl = (url: string): boolean => {
  return extractYouTubeId(url) !== null;
};


// Legacy exports for backward compatibility
export type StoredVideo = StoredFuelItem;
export const saveVideoToDB = saveFuelItemToDB;
export const removeVideoFromDB = removeFuelItemFromDB;
export const getAllVideosFromDB = getAllFuelItemsFromDB;
