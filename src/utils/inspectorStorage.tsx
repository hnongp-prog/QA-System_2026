import React, { useState, useEffect, useCallback } from 'react';

// Default QA inspector list: MUST BE EMPTY so only user typed and saved inspectors appear!
export const DEFAULT_INSPECTORS: string[] = [];

export const STORAGE_KEY = 'qa_registered_inspectors';
export const ROSTER_STORAGE_KEY = 'qa_inspectors_roster';
const EVENT_NAME = 'qa_inspectors_updated';

// Blacklist of all sample / mock / demo names to completely filter out
export const DEMO_NAMES_BLACKLIST = new Set<string>([
  'สมศักดิ์ มั่นคง (QA-01)',
  'วิชัย วงศ์สวัสดิ์ (QA-02)',
  'สมชาย เจริญสุข (QA-03)',
  'อนันต์ สุขใจ (QA-04)',
  'สมพงษ์ พัฒนา (QA-05)',
  'กิตติศักดิ์ น้อมเกล้า (QA Senior)',
  'Somchai P.',
  'Anan S.',
  'Sompong P.',
  'Prasert T.',
  'Kittisak N.',
  'Wichai T. (IPQA)',
  'Somchai P. (IPQA)',
  'Somchai P. (X-Ray)',
  'Somchai K. (IQA)',
  'Anan S. (IQA)',
  'Anucha S. (IQA)',
  'Somchai R. (IQA)',
  'Kitti M.',
  'Somchai Prasert',
  'Anucha Singharaj',
  'Anan Charoensuk',
  'Wichai Thongdee',
  'Kitti Mongkol',
  'Kittisak Namchai',
  'Sompong Phromphriang',
  'Prasert Thepsathit',
  'Pichet Preechachan',
  'สมชาย ประเสริฐ',
  'อนุชา สิงหราช',
  'อนันต์ เจริญสุข',
  'วิชัย ทองดี',
  'กิตติ มงคล',
  'กิตติศักดิ์ นำชัย',
  'สมพงษ์ พร้อมเพรียง',
  'ประเสริฐ เทพสถิตย์',
  'พิเชษฐ์ ปรีชาชาญ',
  'QA Team',
  'QA Chemist',
  'Cutting Inspector',
  'IPQA Officer',
  'IPQA Inspector',
  'X-Ray Technician',
  'X-Ray Inspector',
  'Coating Technician',
  'Coating Inspector',
  'Mixing Auditor',
  'Mixing Inspector',
  'Zn Wire Inspector',
  'IQA Inspector',
  'Calibration Inspector',
  'Metrology Custodian',
  'Inspector',
  'QA Officer',
  'Name...',
  'Anan S.',
  'Somchai P.',
  '-'
]);

/**
 * Check if a candidate name is a valid user-saved name and not a demo placeholder
 */
export function isValidRecordedInspectorName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const clean = name.trim();
  if (!clean || clean === '-' || clean.length < 2) return false;
  if (DEMO_NAMES_BLACKLIST.has(clean)) return false;

  // Also check normalized lowercase
  const lower = clean.toLowerCase();
  if (
    lower === 'somchai p.' ||
    lower === 'anan s.' ||
    lower === 'sompong p.' ||
    lower === 'prasert t.' ||
    lower === 'kittisak n.' ||
    lower === 'kitti m.' ||
    lower === 'qa team' ||
    lower === 'qa chemist' ||
    lower === 'inspector' ||
    lower === 'name...'
  ) {
    return false;
  }

  return true;
}

/**
 * Clean up existing localStorage to remove any legacy demo names
 */
function sanitizeStoredInspectors() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.filter(n => typeof n === 'string' && isValidRecordedInspectorName(n));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
        }
      }
    }
  } catch (e) {
    // Ignore parse error
  }
}

/**
 * Retrieve all unique inspector names that have actually been typed and saved by the user.
 * Reads from:
 * 1. QA Inspector App roster ('qa_inspectors_roster')
 * 2. Explicitly saved inspection entries ('qa_registered_inspectors')
 * Strictly filters out any unrecorded demo / sample names!
 */
export function getRecordedInspectors(): string[] {
  const inspectorSet = new Set<string>();

  if (typeof window === 'undefined') {
    return [];
  }

  // Sanitize stored list first
  sanitizeStoredInspectors();

  // 1. Read from QA Inspector App Roster (where users manage staff: name, code, start date)
  try {
    const rawRoster = localStorage.getItem(ROSTER_STORAGE_KEY);
    if (rawRoster) {
      const parsedRoster = JSON.parse(rawRoster);
      if (Array.isArray(parsedRoster)) {
        parsedRoster.forEach((item: any) => {
          if (item && typeof item === 'object') {
            // Filter out default demo IDs like ins-001..ins-009 unless modified by user
            if (typeof item.name === 'string' && isValidRecordedInspectorName(item.name)) {
              inspectorSet.add(item.name.trim());
            }
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading qa_inspectors_roster:', e);
  }

  // 2. Read from explicitly registered inspectors (typed & saved during inspections)
  try {
    const rawRegistered = localStorage.getItem(STORAGE_KEY);
    if (rawRegistered) {
      const parsed = JSON.parse(rawRegistered);
      if (Array.isArray(parsed)) {
        parsed.forEach(name => {
          if (typeof name === 'string' && isValidRecordedInspectorName(name)) {
            inspectorSet.add(name.trim());
          }
        });
      }
    }
  } catch (e) {
    console.warn('Error reading registered inspectors:', e);
  }

  return Array.from(inspectorSet).sort((a, b) => a.localeCompare(b, 'th'));
}

/**
 * Save and register a newly used inspector name when a record is submitted and saved.
 * Ensures that this name will immediately be available in the dropdown for all sub-apps.
 */
export function saveRecordedInspector(name: string): void {
  if (!isValidRecordedInspectorName(name)) return;
  const cleanName = name.trim();

  try {
    const currentList = getRecordedInspectors();
    if (!currentList.includes(cleanName)) {
      const updated = [...currentList, cleanName].sort((a, b) => a.localeCompare(b, 'th'));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    // Dispatch custom event for real-time reactive sync in active UI
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: cleanName }));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (e) {
    console.warn('Error saving inspector name:', e);
  }
}

/**
 * React hook to access the real-time list of recorded inspector names
 */
export function useRecordedInspectors(): string[] {
  const [inspectors, setInspectors] = useState<string[]>(() => getRecordedInspectors());

  const reloadInspectors = useCallback(() => {
    setInspectors(getRecordedInspectors());
  }, []);

  useEffect(() => {
    // Initial load and sanitize
    reloadInspectors();

    const handleUpdate = () => {
      reloadInspectors();
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [reloadInspectors]);

  return inspectors;
}

/**
 * Universal Datalist component for Inspector autocomplete dropdown in any sub-app.
 * Renders ONLY names that have been actually typed and saved.
 */
export const InspectorDatalist: React.FC<{ id?: string }> = ({ id = 'qa-inspector-list' }) => {
  const inspectors = useRecordedInspectors();

  return (
    <datalist id={id}>
      {inspectors.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </datalist>
  );
};
