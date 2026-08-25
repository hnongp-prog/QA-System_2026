import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection, 
  addDoc,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Real-time Firestore synchronizer for QA Inspection System.
 * Ensures data is synchronized instantly across all computers, tablets, and sessions.
 */

// Memory cache to prevent redundant writes and echo loops
const cloudPayloadJsonCache = new Map<string, string>();
const activeListeners = new Map<string, Set<(data: any) => void>>();
const activeUnsubscribes = new Map<string, Unsubscribe>();

/**
 * Get or register a single shared Firestore snapshot listener per key.
 */
function getSharedCloudListener<T>(key: string, fallbackDefault: T, onUpdate: (data: T) => void): () => void {
  if (!activeListeners.has(key)) {
    activeListeners.set(key, new Set());
  }
  const listenerSet = activeListeners.get(key)!;
  listenerSet.add(onUpdate);

  // If already subscribed to Firestore, just return cleanup
  if (activeUnsubscribes.has(key)) {
    return () => {
      listenerSet.delete(onUpdate);
      if (listenerSet.size === 0) {
        const unsub = activeUnsubscribes.get(key);
        if (unsub) unsub();
        activeUnsubscribes.delete(key);
      }
    };
  }

  const docRef = doc(db, 'qa_master_data', key);

  const unsub = onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        if (cloudData && cloudData.payload !== undefined) {
          const payload = cloudData.payload as T;
          const jsonStr = JSON.stringify(payload);
          cloudPayloadJsonCache.set(key, jsonStr);

          // Update local cache
          try {
            localStorage.setItem(key, jsonStr);
          } catch (e) {
            console.warn(`[FirestoreSync] Local storage cache write failed for ${key}:`, e);
          }

          // Broadcast to all active component subscribers
          listenerSet.forEach(cb => {
            try {
              cb(payload);
            } catch (err) {
              console.error(`[FirestoreSync] Listener callback error for ${key}:`, err);
            }
          });
          return;
        }
      }

      // If document doesn't exist yet on cloud (first time ever setup on brand new DB), initialize cloud
      try {
        const localRaw = localStorage.getItem(key);
        const initialToUpload = localRaw ? JSON.parse(localRaw) : fallbackDefault;
        const initialJson = JSON.stringify(initialToUpload);
        cloudPayloadJsonCache.set(key, initialJson);

        await setDoc(docRef, {
          payload: initialToUpload,
          updatedAt: new Date().toISOString(),
          source: 'initial_bootstrap'
        }, { merge: true });

        listenerSet.forEach(cb => {
          try {
            cb(initialToUpload);
          } catch (err) {
            console.error(`[FirestoreSync] Bootstrap listener callback error for ${key}:`, err);
          }
        });
      } catch (initErr) {
        console.warn(`[FirestoreSync] Cloud bootstrap init failed for ${key}:`, initErr);
        listenerSet.forEach(cb => cb(fallbackDefault));
      }
    },
    (error) => {
      console.error(`[FirestoreSync] Realtime subscription error for ${key}:`, error);
      try {
        const localRaw = localStorage.getItem(key);
        const fallback = localRaw ? JSON.parse(localRaw) : fallbackDefault;
        listenerSet.forEach(cb => cb(fallback));
      } catch {
        listenerSet.forEach(cb => cb(fallbackDefault));
      }
    }
  );

  activeUnsubscribes.set(key, unsub);

  return () => {
    listenerSet.delete(onUpdate);
    if (listenerSet.size === 0) {
      const unsubFn = activeUnsubscribes.get(key);
      if (unsubFn) unsubFn();
      activeUnsubscribes.delete(key);
    }
  };
}

/**
 * Custom React Hook for fully real-time synchronized cloud state.
 * Prevents accidental overwrite on mount and synchronizes seamlessly across all devices.
 */
export function useCloudState<T>(
  key: string,
  fallbackDefault: T
): [T, (valOrUpdater: T | ((prev: T) => T)) => void, boolean] {
  const [data, setData] = useState<T>(() => {
    // 1. Check memory cache first
    const cachedJson = cloudPayloadJsonCache.get(key);
    if (cachedJson) {
      try {
        return JSON.parse(cachedJson);
      } catch {
        // ignore
      }
    }
    // 2. Check local storage
    try {
      const localRaw = localStorage.getItem(key);
      if (localRaw) {
        return JSON.parse(localRaw);
      }
    } catch {
      // ignore
    }
    // 3. Fallback
    return fallbackDefault;
  });

  const [isCloudReady, setIsCloudReady] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    const cleanup = getSharedCloudListener<T>(key, fallbackDefault, (cloudData) => {
      setData(cloudData);
      setIsCloudReady(true);
    });

    return cleanup;
  }, [key]);

  const updateCloudState = useCallback(
    (valOrUpdater: T | ((prev: T) => T)) => {
      const nextVal = typeof valOrUpdater === 'function' 
        ? (valOrUpdater as (prev: T) => T)(dataRef.current) 
        : valOrUpdater;

      setData(nextVal);
      dataRef.current = nextVal;

      // Persist to Cloud Firestore and LocalStorage
      saveCloudData(key, nextVal);
    },
    [key]
  );

  return [data, updateCloudState, isCloudReady];
}

/**
 * Subscribe to real-time updates for a dataset from Firestore.
 * Automatically synchronizes changes across all clients in real time.
 */
export function subscribeToCloudData<T>(
  key: string,
  onUpdate: (data: T) => void,
  fallbackData: T
): Unsubscribe {
  // Load local cache immediately for zero-delay rendering
  try {
    const cachedJson = cloudPayloadJsonCache.get(key);
    if (cachedJson) {
      onUpdate(JSON.parse(cachedJson));
    } else {
      const localRaw = localStorage.getItem(key);
      if (localRaw) {
        onUpdate(JSON.parse(localRaw));
      }
    }
  } catch (err) {
    console.warn(`[FirestoreSync] Local parse error for ${key}:`, err);
  }

  return getSharedCloudListener<T>(key, fallbackData, onUpdate);
}

/**
 * Save / update dataset to Firestore Cloud Database.
 * This triggers real-time updates to all other devices listening to this key.
 */
export async function saveCloudData<T>(key: string, data: T): Promise<void> {
  const jsonStr = JSON.stringify(data);
  
  // Skip redundant network writes if data is unchanged
  if (cloudPayloadJsonCache.get(key) === jsonStr) {
    return;
  }

  cloudPayloadJsonCache.set(key, jsonStr);

  // Update local cache immediately
  try {
    localStorage.setItem(key, jsonStr);
  } catch (err) {
    console.warn(`[FirestoreSync] LocalStorage cache error for ${key}:`, err);
  }

  try {
    const docRef = doc(db, 'qa_master_data', key);
    await setDoc(docRef, {
      payload: data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.error(`[FirestoreSync] Failed to save cloud data for ${key}:`, error);
  }
}

/**
 * Log individual inspection activity event to Firestore collection
 */
export async function logCloudInspectionActivity(activity: any): Promise<void> {
  try {
    const colRef = collection(db, 'inspection_activities');
    await addDoc(colRef, {
      ...activity,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('[FirestoreSync] Failed to log activity to collection:', err);
  }
}
