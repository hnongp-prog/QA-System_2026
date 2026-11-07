import { useMemo, useCallback } from 'react';
import { QAInspector, InspectorDepartment, InspectorRole } from '../types';
import { useCloudState } from './firestoreSync';
import { saveRecordedInspector, isValidRecordedInspectorName } from '../utils/inspectorStorage';

// Empty default: No demo or mock inspectors allowed!
export const DEFAULT_INSPECTORS: QAInspector[] = [];

/**
 * Calculate tenure / years of service from start date
 */
export function calculateTenure(startDateStr: string, isTh = true): string {
  if (!startDateStr) return '-';
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return '-';

  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years <= 0 && months <= 0) {
    return isTh ? 'เพิ่งเริ่มงาน' : 'Just started';
  }

  if (years > 0 && months > 0) {
    return isTh ? `${years} ปี ${months} เดือน` : `${years} yrs ${months} mos`;
  } else if (years > 0) {
    return isTh ? `${years} ปี` : `${years} yrs`;
  } else {
    return isTh ? `${months} เดือน` : `${months} mos`;
  }
}

/**
 * Hook to access and manage live synchronized QA Inspectors roster.
 * Strictly filters out any fake demo entries and preserves ONLY user typed and saved entries.
 */
export function useQAInspectors() {
  const [inspectors, setInspectors, isReady] = useCloudState<QAInspector[]>(
    'qa_inspectors_roster',
    DEFAULT_INSPECTORS
  );

  // Filter out any lingering mock demo entries from local storage or cloud
  const effectiveInspectors = useMemo(() => {
    if (!inspectors || !Array.isArray(inspectors)) return [];
    return inspectors.filter(ins => {
      if (!ins || typeof ins !== 'object') return false;
      // Filter out hardcoded demo IDs (ins-001 through ins-009)
      if (ins.id && /^ins-00[1-9]$/.test(ins.id)) return false;
      // Filter out demo names
      return isValidRecordedInspectorName(ins.name);
    });
  }, [inspectors]);

  // Active inspectors only (sorted by department, then name)
  const activeInspectors = useMemo(() => {
    return effectiveInspectors
      .filter(i => i.status === 'ACTIVE')
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [effectiveInspectors]);

  // Formatted inspector select options
  const inspectorOptions = useMemo(() => {
    return activeInspectors.map(i => ({
      value: i.name,
      label: `${i.name} (${i.empCode} - ${i.department})`,
      empCode: i.empCode,
      name: i.name,
      nameEn: i.nameEn,
      department: i.department,
      role: i.role
    }));
  }, [activeInspectors]);

  const addInspector = useCallback((newInspector: Omit<QAInspector, 'id' | 'createdAt'>) => {
    const id = `ins-${Date.now()}`;
    const item: QAInspector = {
      ...newInspector,
      id,
      empCode: newInspector.empCode.trim().toUpperCase(),
      createdAt: new Date().toISOString()
    };

    setInspectors(prev => {
      const prevClean = (prev || []).filter(ins => !/^ins-00[1-9]$/.test(ins.id) && isValidRecordedInspectorName(ins.name));
      return [item, ...prevClean];
    });

    // Also register in universal inspector storage so all sub-apps pick it up immediately
    saveRecordedInspector(item.name);

    return item;
  }, [setInspectors]);

  const updateInspector = useCallback((id: string, updated: Partial<QAInspector>) => {
    setInspectors(prev => (prev || []).map(i => {
      if (i.id === id) {
        const next = { ...i, ...updated, updatedAt: new Date().toISOString() };
        if (next.name) saveRecordedInspector(next.name);
        return next;
      }
      return i;
    }));
  }, [setInspectors]);

  const deleteInspector = useCallback((id: string) => {
    setInspectors(prev => (prev || []).filter(i => i.id !== id));
  }, [setInspectors]);

  const toggleStatus = useCallback((id: string) => {
    setInspectors(prev => (prev || []).map(i => {
      if (i.id === id) {
        const nextStatus = i.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        return { ...i, status: nextStatus, updatedAt: new Date().toISOString() };
      }
      return i;
    }));
  }, [setInspectors]);

  return {
    inspectors: effectiveInspectors,
    activeInspectors,
    inspectorOptions,
    addInspector,
    updateInspector,
    deleteInspector,
    toggleStatus,
    isReady
  };
}
