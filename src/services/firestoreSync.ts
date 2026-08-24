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

// Memory cache to prevent unnecessary writes
const lastSavedJson = new Map<string, string>();
const isInitialLoaded = new Map<string, boolean>();

/**
 * Subscribe to real-time updates for a dataset from Firestore.
 * Automatically synchronizes changes across all clients in real time.
 */
export function subscribeToCloudData<T>(
  key: string,
  onUpdate: (data: T) => void,
  fallbackData: T
): Unsubscribe {
  // Load local cache immediately for zero-delay initial rendering
  try {
    const localRaw = localStorage.getItem(key);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      onUpdate(parsed);
    }
  } catch (err) {
    console.warn(`[FirestoreSync] Local storage parse failed for ${key}:`, err);
  }

  const docRef = doc(db, 'qa_master_data', key);

  const unsubscribe = onSnapshot(
    docRef,
    async (snapshot) => {
      if (snapshot.exists()) {
        const cloudData = snapshot.data();
        if (cloudData && cloudData.payload !== undefined) {
          const payload = cloudData.payload as T;
          const jsonStr = JSON.stringify(payload);
          lastSavedJson.set(key, jsonStr);
          isInitialLoaded.set(key, true);

          // Update local cache
          try {
            localStorage.setItem(key, jsonStr);
          } catch (e) {
            console.warn(`[FirestoreSync] Local storage cache write failed for ${key}:`, e);
          }

          onUpdate(payload);
          return;
        }
      }

      // If document doesn't exist yet on cloud (first time setup), upload the fallbackData to initialize cloud
      if (!isInitialLoaded.get(key)) {
        isInitialLoaded.set(key, true);
        try {
          const localRaw = localStorage.getItem(key);
          const initialToUpload = localRaw ? JSON.parse(localRaw) : fallbackData;
          await setDoc(docRef, {
            payload: initialToUpload,
            updatedAt: new Date().toISOString(),
            source: 'initial_bootstrap'
          }, { merge: true });
          lastSavedJson.set(key, JSON.stringify(initialToUpload));
          onUpdate(initialToUpload);
        } catch (initErr) {
          console.warn(`[FirestoreSync] Cloud bootstrap init failed for ${key}:`, initErr);
          onUpdate(fallbackData);
        }
      }
    },
    (error) => {
      console.error(`[FirestoreSync] Realtime subscription error for ${key}:`, error);
      // Fallback to local data
      try {
        const localRaw = localStorage.getItem(key);
        if (localRaw) {
          onUpdate(JSON.parse(localRaw));
        } else {
          onUpdate(fallbackData);
        }
      } catch {
        onUpdate(fallbackData);
      }
    }
  );

  return unsubscribe;
}

/**
 * Save / update dataset to Firestore Cloud Database.
 * This triggers real-time updates to all other devices listening to this key.
 */
export async function saveCloudData<T>(key: string, data: T): Promise<void> {
  const jsonStr = JSON.stringify(data);
  
  // Skip redundant network writes if data is unchanged
  if (lastSavedJson.get(key) === jsonStr) {
    return;
  }

  // Update local cache immediately
  try {
    localStorage.setItem(key, jsonStr);
  } catch (err) {
    console.warn(`[FirestoreSync] LocalStorage cache error for ${key}:`, err);
  }

  lastSavedJson.set(key, jsonStr);

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
