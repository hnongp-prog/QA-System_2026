import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Sliders, 
  BarChart3, 
  History, 
  RefreshCw, 
  RotateCcw,
  Info,
  Calendar,
  Layers,
  Ruler,
  CheckCheck,
  Zap,
  HelpCircle,
  Copy,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { 
  BilletCuttingRecord, 
  BilletCuttingSpec, 
  BilletCuttingMeasurementItem, 
  BilletCuttingHeader,
  Language, 
  ThemeMode 
} from '../types';
import { InspectorDatalist, saveRecordedInspector } from '../utils/inspectorStorage';
import { 
  INITIAL_BILLET_SPECS, 
  INITIAL_BILLET_RECORDS, 
  ADMIN_PASSWORD,
  DEFAULT_IQA_SUPPLIERS,
  DEFAULT_IQA_GRADES,
  IQA_SUPPLIER_GRADE_MAP,
  buildIqaCuttingSpecs
} from './billetCutting/mockBilletData';
import { BilletCuttingSpecModal } from './billetCutting/BilletCuttingSpecModal';
import { BilletCuttingDashboard } from './billetCutting/BilletCuttingDashboard';
import { BilletCuttingHistory } from './billetCutting/BilletCuttingHistory';
import { useCloudState } from '../services/firestoreSync';

interface BilletCuttingAppProps {
  onBack: () => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  userRole?: string;
  userName?: string;
}

export const BilletCuttingApp: React.FC<BilletCuttingAppProps> = ({
  onBack,
  language = 'th',
  theme = 'light',
  onToggleTheme,
  userRole = 'Inspector',
  userName = 'Somchai Prasert'
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  // Active Tab: 'ENTRY' (บันทึก), 'DASHBOARD' (แดชบอร์ด), 'HISTORY' (ประวัติ)
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'DASHBOARD' | 'HISTORY'>('ENTRY');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Spec Manager Modal State
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);

  // Specs & Records State synced to Firebase Cloud Firestore
  const [specs, setSpecs, isSpecsReady] = useCloudState<Record<string, BilletCuttingSpec>>('ipqa08_billet_specs', INITIAL_BILLET_SPECS);
  const [records, setRecords] = useCloudState<BilletCuttingRecord[]>('ipqa08_billet_records', INITIAL_BILLET_RECORDS);
  const [deletedSpecKeys, setDeletedSpecKeys, isDeletedKeysReady] = useCloudState<string[]>('ipqa08_deleted_spec_keys', []);

  // Sync with IQA-01 (Billet Incoming Inspection) Cloud State
  const [iqaHistory, , isIqaHistoryReady] = useCloudState<any[]>('billet_qc_history', []);
  const [iqaGradeSpecs, , isIqaGradeSpecsReady] = useCloudState<Record<string, any>>('billet_qc_grade_specs', {});

  // Helper to identify specs created or edited directly in Billet Spec
  const isUserManagedSpec = React.useCallback((spec?: BilletCuttingSpec | null): boolean => {
    if (!spec) return false;
    return Boolean(spec.isManual || /^spec-(manual-)?\d+$/.test(spec.id || ''));
  }, []);

  // Active Grade list derived strictly from IQA-01 Grade Spec (`billet_qc_grade_specs`)
  const activeIqaGrades = React.useMemo(() => {
    return Object.keys(iqaGradeSpecs || {})
      .map(k => k.trim())
      .filter(k => k.length > 0 && k !== 'NEW_GRADE_PENDING');
  }, [iqaGradeSpecs]);

  const activeIqaGradeSet = React.useMemo(
    () => new Set(activeIqaGrades.map(g => g.toLowerCase())),
    [activeIqaGrades]
  );

  // Extract dynamic Suppliers, Grades, and Heat records from IQA-01 Grade Spec & incoming history
  const { iqaSuppliers, iqaGrades, iqaHeatMap, iqaSupplierGradeMap } = React.useMemo(() => {
    const supplierSet = new Set<string>();
    const gradeSet = new Set<string>(activeIqaGrades);
    const heatMap: Record<string, { supplier: string; grade: string; size?: string }> = {};
    const supGradeMap: Record<string, string> = {};
    const hasGradeFilter = activeIqaGradeSet.size > 0;

    if (Array.isArray(iqaHistory)) {
      iqaHistory.forEach((item: any) => {
        const sup = (item.supplier_name || '').trim();
        const grd = (item.grade || '').trim();
        const heat = (item.heat_number || item.heat_no || '').trim();
        const isGradeAllowed = !hasGradeFilter || (grd !== '' && activeIqaGradeSet.has(grd.toLowerCase()));

        if (sup && isGradeAllowed) supplierSet.add(sup);
        if (grd && !hasGradeFilter) gradeSet.add(grd);
        if (sup && grd && isGradeAllowed) supGradeMap[sup] = grd;
        if (heat) {
          heatMap[heat.toUpperCase()] = { supplier: sup, grade: grd, size: item.billet_size };
          heatMap[heat] = { supplier: sup, grade: grd, size: item.billet_size };
        }
      });
    }

    // Only fallback to default lists if cloud IQA-01 data has not been populated at all
    if (!hasGradeFilter && gradeSet.size === 0) {
      DEFAULT_IQA_GRADES.forEach(g => gradeSet.add(g));
    }
    if (supplierSet.size === 0 && (!Array.isArray(iqaHistory) || iqaHistory.length === 0)) {
      DEFAULT_IQA_SUPPLIERS.forEach(s => {
        const mappedG = IQA_SUPPLIER_GRADE_MAP[s];
        if (!hasGradeFilter || (mappedG && activeIqaGradeSet.has(mappedG.toLowerCase()))) {
          supplierSet.add(s);
        }
      });
    }

    return {
      iqaSuppliers: Array.from(supplierSet).sort((a, b) => a.localeCompare(b)),
      iqaGrades: Array.from(gradeSet).sort((a, b) => a.localeCompare(b)),
      iqaHeatMap: heatMap,
      iqaSupplierGradeMap: supGradeMap
    };
  }, [iqaHistory, activeIqaGrades, activeIqaGradeSet]);

  // Reconcile IPQA-08 Billet Specs with live IQA-01 Grade Spec WITHOUT ever overwriting/removing edited or added Billet Specs
  const reconcileSpecsWithIqa = React.useCallback((
    prev: Record<string, BilletCuttingSpec>,
    ignoredDeletedKeys: string[] = deletedSpecKeys
  ): { next: Record<string, BilletCuttingSpec>; changed: boolean } => {
    const iqaSpecs = buildIqaCuttingSpecs(iqaHistory, iqaGradeSpecs);
    const hasActiveGrades = activeIqaGradeSet.size > 0;
    const deletedSet = new Set(ignoredDeletedKeys || []);
    const next: Record<string, BilletCuttingSpec> = {};
    let changed = false;

    Object.entries(prev || {}).forEach(([k, spec]) => {
      // Always preserve specs edited or added manually in Billet Spec
      if (isUserManagedSpec(spec)) {
        next[k] = spec;
        return;
      }

      const specGradeLower = (spec?.billetGrade || '').trim().toLowerCase();
      const isAutoSyncedIqa = Boolean(spec?.id?.startsWith('spec-iqa-') || spec?.remarks?.includes('Auto-synced from IQA-01'));

      // Remove non-manual specs whose Billet Grade was deleted from IQA-01 Grade Spec
      if (hasActiveGrades && (!specGradeLower || !activeIqaGradeSet.has(specGradeLower))) {
        changed = true;
        return;
      }

      // Remove stale auto-synced IQA-01 specs no longer present in IQA-01 Grade Spec / History
      if (hasActiveGrades && isAutoSyncedIqa && !iqaSpecs[k]) {
        changed = true;
        return;
      }

      next[k] = spec;
    });

    // Collect existing (supplier, grade) pairs in `next` so IQA defaults NEVER duplicate or override saved Billet Specs
    const existingPairs = new Set(
      (Object.values(next) as BilletCuttingSpec[]).map(
        s => `${(s?.name || '').trim().toLowerCase()}__${(s?.billetGrade || '').trim().toLowerCase()}`
      )
    );

    // Add missing active IQA-01 specs only if not already represented and not explicitly deleted by user
    Object.entries(iqaSpecs).forEach(([k, spec]) => {
      const pairKey = `${(spec.name || '').trim().toLowerCase()}__${(spec.billetGrade || '').trim().toLowerCase()}`;
      if (!next[k] && !existingPairs.has(pairKey) && !deletedSet.has(k)) {
        next[k] = spec;
        existingPairs.add(pairKey);
        changed = true;
      }
    });

    return { next, changed };
  }, [iqaHistory, iqaGradeSpecs, activeIqaGradeSet, deletedSpecKeys, isUserManagedSpec]);

  // Sync specs from IQA-01 into IPQA-08 Cutting Specs manually (preserves all edited/added Billet Specs)
  const handleSyncFromIqa = React.useCallback(() => {
    setDeletedSpecKeys([]);
    setSpecs(prev => reconcileSpecsWithIqa(prev, []).next);
    setToastMessage(
      isTh
        ? 'ซิงค์ข้อมูลจาก IQA-01 โดยคงเกณฑ์ Billet Spec ที่แก้ไข/เพิ่มไว้ทั้งหมดเรียบร้อยแล้ว'
        : 'Synced from IQA-01 while preserving all saved Billet Specs'
    );
    setTimeout(() => setToastMessage(null), 3000);
  }, [reconcileSpecsWithIqa, isTh, setSpecs, setDeletedSpecKeys]);

  // Auto-sync & prune stale non-manual specs whenever cloud IQA-01 Grade Spec or History updates
  useEffect(() => {
    if (!isSpecsReady || !isIqaGradeSpecsReady || !isIqaHistoryReady || !isDeletedKeysReady) return;
    setSpecs(prev => {
      const { next, changed } = reconcileSpecsWithIqa(prev, deletedSpecKeys);
      return changed ? next : prev;
    });
  }, [isSpecsReady, isIqaGradeSpecsReady, isIqaHistoryReady, isDeletedKeysReady, reconcileSpecsWithIqa, deletedSpecKeys, setSpecs]);

  // Selected Profile Spec (Empty by default for fresh key-in)
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  // Derived Billet Grades & Suppliers linked from Billet Spec (`specs`):
  // - All specs added/edited in Billet Spec (`isUserManagedSpec`) ALWAYS appear and are used as-is
  // - Auto-synced IQA-01 specs are filtered by active IQA-01 Grade Spec
  const specEntries = React.useMemo(() => {
    const all = Object.entries(specs || {}) as [string, BilletCuttingSpec][];
    if (activeIqaGradeSet.size === 0) return all;
    return all.filter(([, s]) =>
      isUserManagedSpec(s) || activeIqaGradeSet.has((s?.billetGrade || '').trim().toLowerCase())
    );
  }, [specs, activeIqaGradeSet, isUserManagedSpec]);

  const activeSpec = React.useMemo(() => {
    if (!selectedProfileId) return null;
    const found = specEntries.find(([k]) => k === selectedProfileId);
    return found ? found[1] : null;
  }, [selectedProfileId, specEntries]);

  useEffect(() => {
    if (selectedProfileId && isSpecsReady && isIqaGradeSpecsReady && !activeSpec) {
      setSelectedProfileId('');
      setHeader(prev => ({
        ...prev,
        specProfileId: '',
        billetGrade: '',
        supplier: ''
      }));
    }
  }, [selectedProfileId, isSpecsReady, isIqaGradeSpecsReady, activeSpec]);

  const specBilletGrades = React.useMemo(() => {
    const set = new Set<string>();
    specEntries.forEach(([, s]) => {
      if (s?.billetGrade?.trim()) set.add(s.billetGrade.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [specEntries]);

  const specSuppliers = React.useMemo(() => {
    const set = new Set<string>();
    specEntries.forEach(([, s]) => {
      if (s?.name?.trim()) set.add(s.name.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [specEntries]);

  // Form State: 1.1 Header (Blank by default for fresh key-in)
  const [header, setHeader] = useState<BilletCuttingHeader>({
    inspectorName: '',
    shift: '',
    cuttingLength: '',
    lotNo: '',
    date: new Date().toISOString().slice(0, 10),
    machine: '',
    specProfileId: '',
    billetGrade: '',
    supplier: ''
  });

  const matchingSpecSuppliers = React.useMemo(() => {
    const grade = (header.billetGrade || '').trim().toLowerCase();
    if (!grade) return specSuppliers;
    const set = new Set<string>();
    specEntries.forEach(([, s]) => {
      if ((s?.billetGrade || '').trim().toLowerCase() === grade && s?.name?.trim()) {
        set.add(s.name.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [header.billetGrade, specEntries, specSuppliers]);

  const otherSpecSuppliers = React.useMemo(() => {
    if (!header.billetGrade?.trim()) return [];
    const matchedLower = new Set(matchingSpecSuppliers.map(s => s.toLowerCase()));
    return specSuppliers.filter(s => !matchedLower.has(s.toLowerCase()));
  }, [header.billetGrade, matchingSpecSuppliers, specSuppliers]);

  // Form State: 1.2 Cutting Measurement Items (Blank by default for fresh key-in)
  const createDefaultItem = (
    grade = activeSpec?.billetGrade || header.billetGrade || '',
    len = header.cuttingLength,
    sup = activeSpec?.name || header.supplier || ''
  ): BilletCuttingMeasurementItem => {
    const nominalL = parseFloat(len) || 0;
    const calcBending = nominalL > 0 ? (nominalL * 0.0015).toFixed(2) : '0.00'; // Auto calculate length * 0.15%

    return {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      billetGrade: grade,
      heatNo: '',
      supplier: sup,
      qty: '',
      length: '',
      diameter: '',
      bending: '',
      bendingLimit: calcBending,
      cuttingSurface: '',
      surfaceDefect: '',
      heatIdentify: 'OK',
      appearance: 'OK',
      judgement: 'PASS',
      remarks: ''
    };
  };

  const [items, setItems] = useState<BilletCuttingMeasurementItem[]>([
    createDefaultItem('', '', '')
  ]);

  // Apply selected Billet Spec to Header (1.1) and Measurement Rows (1.2)
  const applySpecToForm = (profileKey: string, spec: BilletCuttingSpec) => {
    setSelectedProfileId(profileKey);
    const newLen = spec.lengthNominal || header.cuttingLength;
    const nextGrade = spec.billetGrade || '';
    const nextSupplier = spec.name || '';

    setHeader(prev => ({
      ...prev,
      specProfileId: profileKey,
      billetGrade: nextGrade,
      supplier: nextSupplier,
      cuttingLength: newLen
    }));

    // Update default grade, supplier & bending limit on existing items
    setItems(prev => prev.map(item => {
      const itemLen = parseFloat(item.length) || parseFloat(newLen) || 0;
      const newLimit = itemLen > 0 ? (itemLen * 0.0015).toFixed(2) : '0.00';
      return {
        ...item,
        billetGrade: nextGrade || item.billetGrade,
        supplier: nextSupplier || item.supplier,
        bendingLimit: newLimit
      };
    }));
  };

  // Update cuttingLength, billetGrade, and supplier when spec profile changes
  const handleProfileChange = (profileKey: string) => {
    if (!profileKey) {
      setSelectedProfileId('');
      setHeader(prev => ({
        ...prev,
        specProfileId: '',
        billetGrade: '',
        supplier: '',
        cuttingLength: ''
      }));
      return;
    }
    const spec = specs[profileKey];
    if (spec) {
      applySpecToForm(profileKey, spec);
    }
  };

  // Linked change when user selects Billet Grade in 1.1 from Billet Spec
  const handleHeaderGradeChange = (selectedGrade: string) => {
    const cleanGrade = selectedGrade.trim();
    if (!cleanGrade) {
      setSelectedProfileId('');
      setHeader(prev => ({
        ...prev,
        specProfileId: '',
        billetGrade: '',
        supplier: '',
        cuttingLength: ''
      }));
      return;
    }

    const gradeMatches = specEntries.filter(
      ([, s]) => (s?.billetGrade || '').trim().toLowerCase() === cleanGrade.toLowerCase()
    );
    const currentSupLower = (header.supplier || '').trim().toLowerCase();
    const exactMatch =
      gradeMatches.find(([, s]) => (s?.name || '').trim().toLowerCase() === currentSupLower) ||
      gradeMatches[0];

    if (exactMatch) {
      applySpecToForm(exactMatch[0], exactMatch[1]);
    } else {
      setHeader(prev => ({ ...prev, billetGrade: cleanGrade }));
    }
  };

  // Linked change when user selects Supplier in 1.1 from Billet Spec
  const handleHeaderSupplierChange = (selectedSupplier: string) => {
    const cleanSupplier = selectedSupplier.trim();
    if (!cleanSupplier) {
      setSelectedProfileId('');
      setHeader(prev => ({
        ...prev,
        specProfileId: '',
        supplier: ''
      }));
      return;
    }

    const supplierMatches = specEntries.filter(
      ([, s]) => (s?.name || '').trim().toLowerCase() === cleanSupplier.toLowerCase()
    );
    const currentGradeLower = (header.billetGrade || '').trim().toLowerCase();
    const exactMatch =
      supplierMatches.find(([, s]) => (s?.billetGrade || '').trim().toLowerCase() === currentGradeLower) ||
      supplierMatches[0];

    if (exactMatch) {
      applySpecToForm(exactMatch[0], exactMatch[1]);
    } else {
      setHeader(prev => ({ ...prev, supplier: cleanSupplier }));
    }
  };

  // Handle when user edits or adds a Billet Spec in BilletCuttingSpecModal
  const handleSpecSaved = React.useCallback((savedKey: string, previousKey: string | null, savedSpec: BilletCuttingSpec) => {
    // Unmark from deleted keys if previously deleted
    setDeletedSpecKeys(prev => prev.filter(k => k !== savedKey && k !== previousKey));

    // Apply immediately if editing the currently selected spec OR adding a new Billet Spec
    const isEditingActive = Boolean(previousKey && selectedProfileId === previousKey);
    const isAddingNewSpec = previousKey === null;

    if (isEditingActive || isAddingNewSpec) {
      setSelectedProfileId(savedKey);
      const newLen = savedSpec.lengthNominal || header.cuttingLength;
      setHeader(prev => ({
        ...prev,
        specProfileId: savedKey,
        billetGrade: savedSpec.billetGrade || '',
        supplier: savedSpec.name || '',
        cuttingLength: newLen
      }));

      // Recompute items with newly saved spec criteria & limits
      const lMin = parseFloat(savedSpec.lengthMin);
      const lMax = parseFloat(savedSpec.lengthMax);
      const dMin = parseFloat(savedSpec.diameterMin);
      const dMax = parseFloat(savedSpec.diameterMax);
      const surfMax = parseFloat(savedSpec.cuttingSurfaceMax || '2.0');

      setItems(prev => prev.map(item => {
        const lVal = parseFloat(item.length);
        const dVal = parseFloat(item.diameter);
        const bVal = parseFloat(item.bending);
        const sVal = parseFloat(item.cuttingSurface);
        const targetLen = !isNaN(lVal) ? lVal : (parseFloat(newLen) || 0);
        const newLimit = targetLen > 0 ? (targetLen * 0.0015).toFixed(2) : '0.00';

        const isLengthOk = item.length === '' || isNaN(lVal) || (!isNaN(lMin) && !isNaN(lMax) ? (lVal >= lMin && lVal <= lMax) : true);
        const isDiameterOk = item.diameter === '' || isNaN(dVal) || (!isNaN(dMin) && !isNaN(dMax) ? (dVal >= dMin && dVal <= dMax) : true);
        const calcBendingLim = targetLen * 0.0015;
        const isBendingOk = item.bending === '' || isNaN(bVal) || (calcBendingLim > 0 ? bVal <= calcBendingLim : true);
        const isSurfaceOk = item.cuttingSurface === '' || isNaN(sVal) || (!isNaN(surfMax) ? sVal <= surfMax : true);

        const isPass =
          isLengthOk &&
          isDiameterOk &&
          isBendingOk &&
          isSurfaceOk &&
          item.heatIdentify !== 'NG' &&
          item.appearance !== 'NG';

        return {
          ...item,
          billetGrade: savedSpec.billetGrade || item.billetGrade,
          supplier: savedSpec.name || item.supplier,
          bendingLimit: newLimit,
          judgement: isPass ? 'PASS' : 'FAIL'
        };
      }));
    }
  }, [selectedProfileId, header.cuttingLength, setDeletedSpecKeys]);

  const handleSpecDeleted = React.useCallback((deletedKey: string) => {
    setDeletedSpecKeys(prev => (prev.includes(deletedKey) ? prev : [...prev, deletedKey]));
  }, [setDeletedSpecKeys]);

  // Item Validation Helper
  const validateItem = (item: BilletCuttingMeasurementItem): {
    isLengthValid: boolean;
    isDiameterValid: boolean;
    isBendingValid: boolean;
    isSurfaceValid: boolean;
    isPass: boolean;
    isFilled: boolean;
    reason?: string;
  } => {
    const lMin = activeSpec ? parseFloat(activeSpec.lengthMin) : 0;
    const lMax = activeSpec ? parseFloat(activeSpec.lengthMax) : 999999;
    const dMin = activeSpec ? parseFloat(activeSpec.diameterMin) : 0;
    const dMax = activeSpec ? parseFloat(activeSpec.diameterMax) : 999999;
    const surfMax = activeSpec ? parseFloat(activeSpec.cuttingSurfaceMax) : 2.0;

    const lVal = parseFloat(item.length);
    const dVal = parseFloat(item.diameter);
    const bVal = parseFloat(item.bending);
    const sVal = parseFloat(item.cuttingSurface);

    const isLengthFilled = item.length !== '' && !isNaN(lVal);
    const isDiameterFilled = item.diameter !== '' && !isNaN(dVal);
    const isBendingFilled = item.bending !== '' && !isNaN(bVal);
    const isSurfaceFilled = item.cuttingSurface !== '' && !isNaN(sVal);

    const isLengthValid = !isLengthFilled || (lVal >= lMin && lVal <= lMax);
    const isDiameterValid = !isDiameterFilled || (dVal >= dMin && dVal <= dMax);

    // Bending limit: item.length * 0.15%
    const targetLen = !isNaN(lVal) ? lVal : (parseFloat(header.cuttingLength) || 0);
    const calcLimit = targetLen * 0.0015;
    const isBendingValid = !isBendingFilled || (calcLimit > 0 ? bVal <= calcLimit : true);

    // Cutting surface < 2.0 mm (or spec max)
    const isSurfaceValid = !isSurfaceFilled || (sVal <= surfMax);

    const hasFailedDimension = 
      (isLengthFilled && !isLengthValid) ||
      (isDiameterFilled && !isDiameterValid) ||
      (isBendingFilled && !isBendingValid) ||
      (isSurfaceFilled && !isSurfaceValid) ||
      item.heatIdentify === 'NG' ||
      item.appearance === 'NG';

    const isPass = !hasFailedDimension;
    const isFilled = isLengthFilled && isDiameterFilled && isBendingFilled && isSurfaceFilled && !!item.heatNo && !!item.supplier && !!item.qty;

    return {
      isLengthValid,
      isDiameterValid,
      isBendingValid,
      isSurfaceValid,
      isPass,
      isFilled
    };
  };

  // Modify Item Row with auto-fill from IQA-01
  const handleItemChange = (index: number, field: keyof BilletCuttingMeasurementItem, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };

    // Auto calculate Bending Limit if length changes
    if (field === 'length') {
      const lenNum = parseFloat(value);
      if (!isNaN(lenNum) && lenNum > 0) {
        target.bendingLimit = (lenNum * 0.0015).toFixed(2);
      }
    }

    // Auto-fill Supplier & Billet Grade from IQA-01 when Heat No is entered
    if (field === 'heatNo') {
      const cleanHeat = String(value || '').trim();
      const matched = iqaHeatMap[cleanHeat.toUpperCase()] || iqaHeatMap[cleanHeat];
      if (matched) {
        if (matched.supplier && (!target.supplier || target.supplier === '')) {
          target.supplier = matched.supplier;
        }
        if (matched.grade && (!target.billetGrade || target.billetGrade === '' || target.billetGrade === '6063')) {
          target.billetGrade = matched.grade;
        }
      }
    }

    // Auto-fill Billet Grade from IQA-01 when Supplier is selected
    if (field === 'supplier') {
      const cleanSup = String(value || '').trim();
      const mappedGrade = iqaSupplierGradeMap[cleanSup];
      if (mappedGrade && (!target.billetGrade || target.billetGrade === '' || target.billetGrade === '6063')) {
        target.billetGrade = mappedGrade;
      }
    }

    // Auto compute Judgement
    const val = validateItem(target);
    target.judgement = val.isPass ? 'PASS' : 'FAIL';

    updated[index] = target;
    setItems(updated);
  };

  // Add Item Row
  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      createDefaultItem(
        activeSpec?.billetGrade || header.billetGrade || '',
        header.cuttingLength,
        activeSpec?.name || header.supplier || ''
      )
    ]);
  };

  // Reset / Clear Entry Table & Header
  const handleResetForm = () => {
    setSelectedProfileId('');
    setHeader({
      inspectorName: '',
      shift: '',
      cuttingLength: '',
      lotNo: '',
      date: new Date().toISOString().slice(0, 10),
      machine: '',
      specProfileId: '',
      billetGrade: '',
      supplier: ''
    });
    setItems([createDefaultItem('', '', '')]);
    setToastMessage(isTh ? 'ล้างข้อมูลส่วนหัวและตารางเรียบร้อยแล้ว พร้อมสำหรับกรอกข้อมูลชุดใหม่' : 'Form cleared, ready for new entry');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Duplicate Row
  const duplicateItemRow = (index: number) => {
    const target = items[index];
    const clone: BilletCuttingMeasurementItem = {
      ...target,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      heatNo: ''
    };
    setItems(prev => [...prev, clone]);
  };

  // Remove Item Row
  const removeItemRow = (index: number) => {
    if (items.length <= 1) {
      setItems([
        createDefaultItem(
          activeSpec?.billetGrade || header.billetGrade || '',
          header.cuttingLength,
          activeSpec?.name || header.supplier || ''
        )
      ]);
      setToastMessage(isTh ? 'ล้างแถวเป็นค่าว่างเรียบร้อยแล้ว' : 'Row reset to blank');
      setTimeout(() => setToastMessage(null), 2500);
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Summary Totals
  const formSummary = React.useMemo(() => {
    let totalQty = 0;
    let passedQty = 0;
    let defectQty = 0;
    let overallPass = true;

    items.forEach(item => {
      const q = typeof item.qty === 'number' ? item.qty : parseInt(String(item.qty)) || 0;
      totalQty += q;
      if (item.judgement === 'PASS') {
        passedQty += q;
      } else {
        defectQty += q;
        overallPass = false;
      }
    });

    return { totalQty, passedQty, defectQty, overallPass };
  }, [items]);

  // Save New Inspection Record
  const handleSaveRecord = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProfileId) {
      alert(isTh ? 'กรุณาเลือกเกณฑ์มาตรฐาน Billet Grade ก่อนบันทึกข้อมูล' : 'Please select Billet Grade spec before saving');
      return;
    }
    if (!header.inspectorName.trim()) {
      alert(isTh ? 'กรุณากรอกชื่อผู้ตรวจสอบ (Inspector Name)' : 'Please enter Inspector Name');
      return;
    }
    if (!header.shift) {
      alert(isTh ? 'กรุณาเลือกกะการทำงาน (Shift)' : 'Please select Shift');
      return;
    }
    if (!header.cuttingLength.trim()) {
      alert(isTh ? 'กรุณาระบุความยาวตัดเป้าหมาย (Cutting Length mm)' : 'Please enter Target Cutting Length');
      return;
    }
    if (!header.lotNo.trim()) {
      alert(isTh ? 'กรุณากรอกหมายเลข Lot No.' : 'Please enter Lot No.');
      return;
    }

    // Check that all measurement rows are filled
    const incompleteIndex = items.findIndex(
      item => !item.heatNo.trim() || !item.supplier.trim() || item.qty === '' || item.length === '' || item.diameter === '' || item.bending === '' || item.cuttingSurface === ''
    );

    if (incompleteIndex !== -1) {
      alert(
        isTh 
          ? `กรุณากรอกข้อมูลการตรวจวัดในแถวที่ ${incompleteIndex + 1} ให้ครบถ้วนทุกช่อง (Heat No, Supplier, Q'ty, Length, Diameter, Bending, Cut Surface)` 
          : `Please fill in all measurement fields for row #${incompleteIndex + 1}`
      );
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord: BilletCuttingRecord = {
      id: `BC-${now.getFullYear()}-${String(records.length + 1).padStart(4, '0')}`,
      docId: `doc-bc-${Date.now()}`,
      timestamp: timeStr,
      timestampRaw: now.toISOString(),
      header: { ...header },
      items: [...items],
      totalQty: formSummary.totalQty,
      passedQty: formSummary.passedQty,
      defectQty: formSummary.defectQty,
      overallJudgement: formSummary.overallPass ? 'PASS' : 'FAIL',
      createdAt: now.toISOString()
    };

    setRecords(prev => [newRecord, ...prev]);
    saveRecordedInspector(header.inspectorName);

    setToastMessage(
      isTh
        ? `บันทึกข้อมูลการตัดท่อนบิลเล็ตสำเร็จ! (Record ID: ${newRecord.id})`
        : `Billet cutting record saved successfully! (ID: ${newRecord.id})`
    );
    setTimeout(() => setToastMessage(null), 4000);

    // Reset Form for next fresh key-in
    setSelectedProfileId('');
    setHeader({
      inspectorName: '',
      shift: '',
      cuttingLength: '',
      lotNo: '',
      date: new Date().toISOString().slice(0, 10),
      machine: '',
      specProfileId: '',
      billetGrade: '',
      supplier: ''
    });

    // Reset table to fresh blank row
    setItems([createDefaultItem('', '', '')]);

    // Switch to history tab
    setActiveTab('HISTORY');
  };

  return (
    <div
      data-app="IPQA-08"
      className={`ipqa-08-container min-h-screen font-sans p-4 sm:p-6 pb-20 selection:bg-indigo-500 selection:text-white relative transition-colors duration-200 ${
        isLight ? 'bg-slate-100 text-black theme-light' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar (Formatted like IPQA-06) */}
        <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
          isLight ? 'border-slate-300' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title={isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}
            >
              <ArrowLeft className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isLight
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                      : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                  }`}>
                    IPQA-08
                  </span>
                  <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-black' : 'text-white'}`}>
                    {isTh ? 'Billet Cutting' : 'Billet Cutting System'}
                  </h1>
                </div>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
                  {isTh ? 'ระบบตรวจสอบและบันทึกการตัดท่อนบิลเล็ตตามเกณฑ์มาตรฐาน' : 'Billet Cutting Quality Inspection & Spec Management System'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                  isLight
                    ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
                title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                <span>{isLight ? (isTh ? 'สว่าง' : 'Light') : (isTh ? 'มืด' : 'Dark')}</span>
              </button>
            )}

            <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`}></span>
              <span>Cloud Sync Active</span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs Row Below Header (Formatted like IPQA-06) */}
        <div className={`flex space-x-2 border-b pb-2 overflow-x-auto ${
          isLight ? 'border-slate-300' : 'border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('ENTRY')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border whitespace-nowrap ${
              activeTab === 'ENTRY'
                ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>{isTh ? 'บันทึกผลการตัด' : 'Cutting Entry'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border whitespace-nowrap ${
              activeTab === 'DASHBOARD'
                ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isTh ? 'Dashboard' : 'Dashboard'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border whitespace-nowrap ${
              activeTab === 'HISTORY'
                ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{isTh ? 'ประวัติ' : 'History'}</span>
            {records.length > 0 && (
              <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                activeTab === 'HISTORY'
                  ? 'bg-indigo-700 text-white border-indigo-400 keep-white'
                  : isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-slate-950 text-indigo-300 border-indigo-800'
              }`}>
                {records.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsSpecModalOpen(true)}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border whitespace-nowrap ${
              isSpecModalOpen
                ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                : isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Admin Spec Manager"
          >
            <Sliders className="w-4 h-4" />
            <span>{isTh ? 'Billet Spec' : 'Billet Spec'}</span>
          </button>
        </div>

        {/* Main Container */}
        <div>
        {/* TAB 1: RECORD ENTRY */}
        {activeTab === 'ENTRY' && (
          <form onSubmit={handleSaveRecord} className="space-y-6">
            {/* Section 1: Spec Profile & Header Form */}
            <div className={`border rounded-3xl p-5 shadow-xl space-y-4 transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800 shadow-xl'
            }`}>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                  }`}>
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-wider ${isLight ? 'text-black' : 'text-white'}`}>
                      {isTh ? '1.1 ข้อมูลส่วนหัว & เลือกเกณฑ์มาตรฐาน Billet Grade' : '1.1 Header Information & Billet Grade Spec'}
                    </h2>
                    <p className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-400'}`}>
                      {isTh ? 'เลือก Billet Grade เพื่อโหลดเกณฑ์ความยาว, เส้นผ่านศูนย์กลาง และคำนวณการโก่งงออัตโนมัติ' : 'Select Billet Grade spec to auto-calculate Bending limit & tolerances'}
                    </p>
                  </div>
                </div>

                {/* Billet Grade Dropdown & IQA-01 Sync Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncFromIqa}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border-2 flex items-center gap-1.5 transition ${
                      isLight 
                        ? 'bg-blue-50 text-black border-blue-400 hover:bg-blue-100' 
                        : 'bg-blue-950/60 text-blue-300 border-blue-800 hover:bg-blue-900/60'
                    }`}
                    title={isTh ? 'ดึงข้อมูล Supplier & Billet Grade จาก IQA-01 มาเพิ่มเป็นเกณฑ์ตัดอัตโนมัติ' : 'Sync Supplier & Grade from IQA-01'}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isTh ? 'ซิงค์จาก IQA-01' : 'Sync IQA-01'}</span>
                  </button>

                  <span className={`text-xs font-black ${isLight ? 'text-black' : 'text-slate-400'}`}>
                    {isTh ? 'เกณฑ์ตัด:' : 'Spec:'}
                  </span>
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-mono font-black focus:outline-none border-2 max-w-[260px] truncate ${
                      isLight 
                        ? 'bg-white border-blue-600 text-black focus:border-blue-700 focus:bg-white shadow-xs' 
                        : 'bg-slate-950 border-indigo-500/40 text-indigo-300 focus:border-indigo-400'
                    }`}
                  >
                    <option value="">{isTh ? '-- เลือกเกณฑ์ Billet / Supplier --' : '-- Select Spec Profile --'}</option>
                    {specEntries.map(([key, spec]) => {
                      const displayGrade = spec.billetGrade || key;
                      const isIqa = spec.remarks?.includes('IQA-01') || spec.id?.includes('iqa');
                      const supplierInfo = spec.name && spec.name !== displayGrade ? ` (${spec.name})` : '';
                      const prefix = isIqa ? '[IQA] ' : '';
                      return (
                        <option key={key} value={key}>{prefix}{displayGrade}{supplierInfo}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Active Spec Criteria Banner */}
              <div className={`grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-2xl border font-mono text-xs ${
                isLight ? 'bg-blue-50/50 border-2 border-blue-200' : 'bg-slate-950/80 border-slate-800'
              }`}>
                <div>
                  <span className={`text-[10px] uppercase font-black block ${isLight ? 'text-black' : 'text-slate-500'}`}>Length Spec</span>
                  <span className={`font-black ${isLight ? 'text-black' : 'text-emerald-400'}`}>
                    {activeSpec ? `${activeSpec.lengthMin} - ${activeSpec.lengthMax} mm` : '— mm'}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-black block ${isLight ? 'text-black' : 'text-slate-500'}`}>Diameter Spec</span>
                  <span className={`font-black ${isLight ? 'text-black' : 'text-sky-400'}`}>
                    {activeSpec ? `${activeSpec.diameterMin} - ${activeSpec.diameterMax} mm` : '— mm'}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-black block ${isLight ? 'text-black' : 'text-amber-500'}`}>Bending Max (Lx0.15%)</span>
                  <span className={`font-black ${isLight ? 'text-black' : 'text-amber-400'}`}>
                    {activeSpec ? `≤ ${activeSpec.bendingMax || (parseFloat(activeSpec.lengthNominal || '500') * 0.0015).toFixed(2)} mm` : '— mm'}
                  </span>
                </div>
                <div>
                  <span className={`text-[10px] uppercase font-black block ${isLight ? 'text-black' : 'text-pink-500'}`}>Cutting Surface Max</span>
                  <span className={`font-black ${isLight ? 'text-black' : 'text-pink-400'}`}>
                    {activeSpec ? `< ${activeSpec.cuttingSurfaceMax || '2.0'} mm` : '< 2.0 mm'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className={`text-[10px] uppercase font-black block ${isLight ? 'text-black' : 'text-purple-500'}`}>Surface Defect Limit</span>
                  <span className={`font-black ${isLight ? 'text-black' : 'text-purple-300'}`}>
                    {activeSpec ? (activeSpec.surfaceDefectSpecText || '≤ 2x50x100 mm') : '≤ 2x50x100 mm'}
                  </span>
                </div>
              </div>

              {/* Header Input Fields: Billet Grade (Linked), Supplier (Linked), Lot no., Inspector name, Shift, Cutting length */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className={`text-[11px] font-black uppercase tracking-wider flex items-center justify-between gap-2 mb-1 ${
                    isLight ? 'text-black' : 'text-slate-400'
                  }`}>
                    <span>{isTh ? 'Billet Grade (Link จาก IQA-01 Grade Spec) *' : 'Billet Grade (IQA-01 Grade Spec) *'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                      isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
                    }`}>
                      {specBilletGrades.length} {isTh ? 'เกรด' : 'Grades'}
                    </span>
                  </label>
                  <select
                    value={header.billetGrade || ''}
                    onChange={(e) => handleHeaderGradeChange(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono font-black focus:outline-none border-2 ${
                      isLight
                        ? 'bg-white border-blue-600 text-black focus:bg-white focus:border-blue-700 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                    }`}
                    required
                  >
                    <option value="">{isTh ? '-- เลือก Billet Grade (IQA-01 Grade Spec) --' : '-- Select Billet Grade --'}</option>
                    {specBilletGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`text-[11px] font-black uppercase tracking-wider flex items-center justify-between gap-2 mb-1 ${
                    isLight ? 'text-black' : 'text-slate-400'
                  }`}>
                    <span>{isTh ? 'Supplier (Link จาก Billet Spec / IQA-01) *' : 'Supplier (Billet Spec / IQA-01) *'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
                      isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950/80 text-indigo-300 border-indigo-800'
                    }`}>
                      {matchingSpecSuppliers.length} / {specSuppliers.length}
                    </span>
                  </label>
                  <select
                    value={header.supplier || ''}
                    onChange={(e) => handleHeaderSupplierChange(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none border-2 ${
                      isLight
                        ? 'bg-white border-blue-600 text-black focus:bg-white focus:border-blue-700 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-cyan-300 focus:border-indigo-500'
                    }`}
                    required
                  >
                    <option value="">{isTh ? '-- เลือก Supplier (Billet Spec / IQA-01) --' : '-- Select Supplier --'}</option>
                    {header.billetGrade ? (
                      <>
                        <optgroup label={isTh ? `Supplier สำหรับ Grade ${header.billetGrade}` : `Suppliers for ${header.billetGrade}`}>
                          {matchingSpecSuppliers.map(sup => (
                            <option key={`match-${sup}`} value={sup}>{sup}</option>
                          ))}
                        </optgroup>
                        {otherSpecSuppliers.length > 0 && (
                          <optgroup label={isTh ? 'Supplier อื่นใน Billet Spec' : 'Other Suppliers in Billet Spec'}>
                            {otherSpecSuppliers.map(sup => (
                              <option key={`other-${sup}`} value={sup}>{sup}</option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    ) : (
                      specSuppliers.map(sup => (
                        <option key={sup} value={sup}>{sup}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className={`text-[11px] font-black uppercase tracking-wider block mb-1 ${
                    isLight ? 'text-black' : 'text-slate-400'
                  }`}>
                    {isTh ? 'หมายเลขลอต (Lot No.) *' : 'Lot No. *'}
                  </label>
                  <input
                    type="text"
                    value={header.lotNo}
                    onChange={(e) => setHeader({ ...header, lotNo: e.target.value })}
                    placeholder={isTh ? 'ระบุหมายเลข Lot No.' : 'e.g. LOT-BC-260831-01'}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-black font-mono focus:outline-none border-2 ${
                      isLight 
                        ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-xs' 
                        : 'bg-slate-950 border-slate-800 text-amber-300 placeholder:text-slate-600 focus:border-amber-500'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className={`text-[11px] font-black uppercase tracking-wider block mb-1 ${
                    isLight ? 'text-black' : 'text-slate-400'
                  }`}>
                    {isTh ? 'ชื่อผู้ตรวจสอบ (Inspector Name) *' : 'Inspector Name *'}
                  </label>
                  <input
                    type="text"
                    list="qa-inspector-list"
                    value={header.inspectorName}
                    onChange={(e) => setHeader({ ...header, inspectorName: e.target.value })}
                    placeholder={isTh ? 'เลือกจากรายชื่อ หรือพิมพ์เอง' : 'Select or enter inspector name'}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none border-2 ${
                      isLight 
                        ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-xs' 
                        : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500'
                    }`}
                    required
                  />
                  <InspectorDatalist id="qa-inspector-list" />
                </div>

                <div>
                  <label className={`text-[11px] font-black uppercase tracking-wider block mb-1 ${
                    isLight ? 'text-black' : 'text-slate-400'
                  }`}>
                    {isTh ? 'กะการทำงาน (Shift) *' : 'Shift *'}
                  </label>
                  <select
                    value={header.shift}
                    onChange={(e) => setHeader({ ...header, shift: e.target.value })}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-bold focus:outline-none border-2 ${
                      isLight 
                        ? 'bg-white border-blue-600 text-black focus:bg-white focus:border-blue-700 shadow-xs' 
                        : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                    }`}
                    required
                  >
                    <option value="">{isTh ? '-- เลือกกะการทำงาน (Shift) --' : '-- Select Shift --'}</option>
                    <option value="Shift A (เช้า)">Shift A (เช้า 08:00 - 16:00)</option>
                    <option value="Shift B (บ่าย)">Shift B (บ่าย 16:00 - 24:00)</option>
                    <option value="Shift C (ดึก)">Shift C (ดึก 24:00 - 08:00)</option>
                  </select>
                </div>

                <div>
                  <label className={`text-[11px] font-black uppercase tracking-wider block mb-1 ${
                    isLight ? 'text-black' : 'text-slate-400'
                  }`}>
                    {isTh ? 'ความยาวตัดเป้าหมาย (Cutting Length mm) *' : 'Target Cutting Length (mm) *'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={header.cuttingLength}
                    onChange={(e) => {
                      const len = e.target.value;
                      setHeader({ ...header, cuttingLength: len });
                      const lenNum = parseFloat(len);
                      if (!isNaN(lenNum)) {
                        const newLimit = (lenNum * 0.0015).toFixed(2);
                        setItems(prev => prev.map(item => ({ ...item, bendingLimit: newLimit })));
                      }
                    }}
                    placeholder={isTh ? 'ระบุความยาวเป้าหมาย (เช่น 500)' : 'e.g. 500'}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-black font-mono focus:outline-none border-2 ${
                      isLight 
                        ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-xs' 
                        : 'bg-slate-950 border-slate-800 text-pink-300 placeholder:text-slate-600 focus:border-pink-500'
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Cutting Measurement Entry Table */}
            <div className={`border rounded-3xl p-5 shadow-xl space-y-4 ${
              isLight ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ${
                isLight ? 'border-slate-200' : 'border-slate-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border ${
                    isLight ? 'bg-pink-100 text-pink-700 border-pink-300' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                  }`}>
                    <Ruler className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-wider ${
                      isLight ? 'text-black' : 'text-white'
                    }`}>
                      {isTh ? '1.2 ตารางบันทึกการวัดค่า (Cutting Measurement Entry)' : '1.2 Cutting Measurement Data Table'}
                    </h2>
                    <p className={`text-[11px] font-bold ${isLight ? 'text-black' : 'text-slate-400'}`}>
                      {isTh 
                        ? 'Billet grade, Heat no, Supplier, Q\'ty, Length, Diameter, Bending (Lx0.15%), Cutting surface <2mm, Defect 2x50x100mm, Heat ID, Appearance, Judgement' 
                        : 'Record dimensions, auto Bending calc (Lx0.15%), tolerance checks & judgement'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className={`px-3 py-1.5 font-bold text-xs rounded-xl transition flex items-center gap-1.5 border shadow-sm ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-black border-slate-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/80'
                    }`}
                    title={isTh ? 'ล้างข้อมูลตารางเป็นค่าว่าง' : 'Clear table'}
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isLight ? 'text-black' : 'text-slate-400'}`} />
                    <span>{isTh ? 'ล้างข้อมูล' : 'Clear Form'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={addItemRow}
                    data-add-row="true"
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isTh ? 'เพิ่มแถวตรวจ' : 'Add Row'}</span>
                  </button>
                </div>
              </div>

              {/* Items Entry Table */}
              <div className={`overflow-x-auto rounded-2xl border-2 ${
                isLight ? 'border-blue-400 bg-white shadow-xs' : 'border-slate-800 bg-slate-950'
              }`}>
                <table className="w-full text-xs text-left border-collapse">
                  <thead className={`font-black uppercase text-[10px] tracking-wider border-b-2 ${
                    isLight 
                      ? 'bg-blue-100 text-black border-blue-300' 
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}>
                    <tr>
                      <th className={`p-3 w-10 text-center ${isLight ? 'text-black font-black' : ''}`}>#</th>
                      <th className={`p-3 w-28 ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Billet Grade *' : 'Grade *'}</th>
                      <th className={`p-3 w-28 ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Heat No *' : 'Heat No *'}</th>
                      <th className={`p-3 w-36 ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Supplier *' : 'Supplier *'}</th>
                      <th className={`p-3 w-20 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Q\'ty (Pcs) *' : 'Q\'ty *'}</th>
                      <th className={`p-3 w-28 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Length (mm) *' : 'Length *'}</th>
                      <th className={`p-3 w-28 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Diameter (mm) *' : 'Diameter *'}</th>
                      <th className={`p-3 w-32 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Bending (Lx0.15%) *' : 'Bending *'}</th>
                      <th className={`p-3 w-28 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Cut Surface (<2mm) *' : 'Cut Surface *'}</th>
                      <th className={`p-3 w-36 ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Surface Defect' : 'Defect (2x50x100)'}</th>
                      <th className={`p-3 w-20 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Heat ID' : 'Heat ID'}</th>
                      <th className={`p-3 w-20 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Appearance' : 'Appear'}</th>
                      <th className={`p-3 w-24 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Judgement' : 'Judgement'}</th>
                      <th className={`p-3 w-16 text-center ${isLight ? 'text-black font-black' : ''}`}>{isTh ? 'Action' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-mono ${
                    isLight ? 'divide-slate-200 bg-white' : 'divide-slate-800/80 bg-slate-900/40'
                  }`}>
                    {items.map((item, index) => {
                      const val = validateItem(item);
                      const targetLen = parseFloat(item.length || header.cuttingLength || '500');
                      const computedBendingLimit = (targetLen * 0.0015).toFixed(2);

                      const isLengthFilled = item.length !== '' && !isNaN(parseFloat(item.length));
                      const isLengthOutOfSpec = isLengthFilled && !val.isLengthValid;

                      const isDiameterFilled = item.diameter !== '' && !isNaN(parseFloat(item.diameter));
                      const isDiameterOutOfSpec = isDiameterFilled && !val.isDiameterValid;

                      const isBendingFilled = item.bending !== '' && !isNaN(parseFloat(item.bending));
                      const isBendingOutOfSpec = isBendingFilled && !val.isBendingValid;

                      const isSurfaceFilled = item.cuttingSurface !== '' && !isNaN(parseFloat(item.cuttingSurface));
                      const isSurfaceOutOfSpec = isSurfaceFilled && !val.isSurfaceValid;

                      return (
                        <tr key={item.id} className={isLight ? 'hover:bg-blue-50/40 transition' : 'hover:bg-slate-800/30 transition'}>
                          {/* Row index */}
                          <td className={`p-2 text-center font-black ${isLight ? 'text-black' : 'text-slate-500'}`}>
                            {index + 1}
                          </td>

                          {/* Billet Grade (Typable / Editable) */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              list="billet-cutting-grade-list"
                              value={item.billetGrade}
                              onChange={(e) => handleItemChange(index, 'billetGrade', e.target.value)}
                              placeholder="6063"
                              className={`w-full rounded-lg px-2 py-1.5 text-xs font-mono font-black focus:outline-none border-2 ${
                                isLight 
                                  ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-2xs' 
                                  : 'bg-slate-950 border-slate-800 text-indigo-300 placeholder:text-slate-600 focus:border-indigo-500'
                              }`}
                              required
                            />
                          </td>

                          {/* Heat No (Integrated with IQA-01) */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              list="billet-cutting-heat-list"
                              value={item.heatNo}
                              onChange={(e) => handleItemChange(index, 'heatNo', e.target.value)}
                              placeholder="HT-XXXXX"
                              className={`w-full rounded-lg px-2 py-1.5 text-xs font-bold focus:outline-none border-2 ${
                                isLight 
                                  ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-2xs' 
                                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500'
                              }`}
                              required
                            />
                          </td>

                          {/* Supplier (Auto-synced from IQA-01) */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              list="billet-cutting-supplier-list"
                              value={item.supplier}
                              onChange={(e) => handleItemChange(index, 'supplier', e.target.value)}
                              placeholder="Supplier Name"
                              className={`w-full rounded-lg px-2 py-1.5 text-xs font-sans font-bold focus:outline-none border-2 ${
                                isLight 
                                  ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-2xs' 
                                  : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500'
                              }`}
                              required
                            />
                          </td>

                          {/* Q'ty (Pcs) */}
                          <td className="p-1.5">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, 'qty', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                              placeholder="0"
                              className={`w-full rounded-lg px-2 py-1.5 text-xs text-center font-black focus:outline-none border-2 ${
                                isLight 
                                  ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-2xs' 
                                  : 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus:border-indigo-500'
                              }`}
                              required
                            />
                          </td>

                          {/* Length (mm) */}
                          <td className="p-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={item.length}
                                onChange={(e) => handleItemChange(index, 'length', e.target.value)}
                                placeholder="500.0"
                                className={`w-full border-2 rounded-lg px-2 py-1.5 text-xs text-center font-black focus:outline-none ${
                                  !isLengthFilled
                                    ? isLight 
                                      ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700' 
                                      : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500'
                                    : isLengthOutOfSpec
                                      ? isLight
                                        ? 'bg-rose-100 border-rose-600 text-black font-black focus:border-rose-700'
                                        : 'bg-rose-950/20 border-rose-500 text-rose-400 focus:border-rose-500'
                                      : isLight
                                        ? 'bg-white border-blue-600 text-black font-black focus:border-blue-700'
                                        : 'bg-emerald-950/10 border-emerald-500/50 text-emerald-400 focus:border-emerald-500'
                                }`}
                                required
                              />
                            </div>
                          </td>

                          {/* Diameter (mm) */}
                          <td className="p-1.5">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                value={item.diameter}
                                onChange={(e) => handleItemChange(index, 'diameter', e.target.value)}
                                placeholder="127.0"
                                className={`w-full border-2 rounded-lg px-2 py-1.5 text-xs text-center font-black focus:outline-none ${
                                  !isDiameterFilled
                                    ? isLight 
                                      ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700' 
                                      : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500'
                                    : isDiameterOutOfSpec
                                      ? isLight
                                        ? 'bg-rose-100 border-rose-600 text-black font-black focus:border-rose-700'
                                        : 'bg-rose-950/20 border-rose-500 text-rose-400 focus:border-rose-500'
                                      : isLight
                                        ? 'bg-white border-blue-600 text-black font-black focus:border-blue-700'
                                        : 'bg-sky-950/10 border-sky-500/50 text-sky-400 focus:border-sky-500'
                                }`}
                                required
                              />
                            </div>
                          </td>

                          {/* Bending (Lx0.15%) Auto calculated limit */}
                          <td className="p-1.5">
                            <div className="space-y-0.5">
                              <input
                                type="number"
                                step="0.01"
                                value={item.bending}
                                onChange={(e) => handleItemChange(index, 'bending', e.target.value)}
                                placeholder="0.50"
                                className={`w-full border-2 rounded-lg px-2 py-1 text-xs text-center font-black focus:outline-none ${
                                  !isBendingFilled
                                    ? isLight 
                                      ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700' 
                                      : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500'
                                    : isBendingOutOfSpec
                                      ? isLight
                                        ? 'bg-rose-100 border-rose-600 text-black font-black focus:border-rose-700'
                                        : 'bg-rose-950/20 border-rose-500 text-rose-400 focus:border-rose-500'
                                      : isLight
                                        ? 'bg-white border-blue-600 text-black font-black focus:border-blue-700'
                                        : 'bg-amber-950/10 border-amber-500/50 text-amber-300 focus:border-amber-500'
                                }`}
                                required
                              />
                              <div className={`text-[9px] text-center ${isLight ? 'text-black font-bold' : 'text-slate-500'}`}>
                                max ≤ <strong className={isLight ? 'text-black font-black' : 'text-amber-400'}>{computedBendingLimit}</strong>
                              </div>
                            </div>
                          </td>

                          {/* Cutting Surface (< 2mm) */}
                          <td className="p-1.5">
                            <input
                              type="number"
                              step="0.1"
                              value={item.cuttingSurface}
                              onChange={(e) => handleItemChange(index, 'cuttingSurface', e.target.value)}
                              placeholder="1.2"
                              className={`w-full border-2 rounded-lg px-2 py-1.5 text-xs text-center font-black focus:outline-none ${
                                !isSurfaceFilled
                                  ? isLight 
                                    ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700' 
                                    : 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500'
                                  : isSurfaceOutOfSpec
                                    ? isLight
                                      ? 'bg-rose-100 border-rose-600 text-black font-black focus:border-rose-700'
                                      : 'bg-rose-950/20 border-rose-500 text-rose-400 focus:border-rose-500'
                                    : isLight
                                      ? 'bg-white border-blue-600 text-black font-black focus:border-blue-700'
                                      : 'bg-pink-950/10 border-pink-500/50 text-pink-400 focus:border-pink-500'
                              }`}
                              required
                            />
                          </td>

                          {/* Surface Defect (2x50x100 mm) */}
                          <td className="p-1.5">
                            <input
                              type="text"
                              value={item.surfaceDefect}
                              onChange={(e) => handleItemChange(index, 'surfaceDefect', e.target.value)}
                              placeholder="Normal / None"
                              className={`w-full rounded-lg px-2 py-1.5 text-xs font-sans font-bold focus:outline-none border-2 ${
                                isLight 
                                  ? 'bg-white border-blue-600 text-black placeholder:text-slate-500 focus:bg-white focus:border-blue-700 shadow-2xs' 
                                  : 'bg-slate-950 border-slate-800 text-purple-300 placeholder:text-slate-600 focus:border-purple-500'
                              }`}
                            />
                          </td>

                          {/* Heat Identify */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'heatIdentify', item.heatIdentify === 'OK' ? 'NG' : 'OK')}
                              className={`px-2 py-1 rounded text-[10px] font-black transition border-2 ${
                                item.heatIdentify === 'OK'
                                  ? isLight 
                                    ? 'bg-emerald-100 text-black border-emerald-600' 
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : isLight 
                                    ? 'bg-rose-100 text-black border-rose-600' 
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {item.heatIdentify}
                            </button>
                          </td>

                          {/* Appearance */}
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, 'appearance', item.appearance === 'OK' ? 'NG' : 'OK')}
                              className={`px-2 py-1 rounded text-[10px] font-black transition border-2 ${
                                item.appearance === 'OK'
                                  ? isLight 
                                    ? 'bg-emerald-100 text-black border-emerald-600' 
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                  : isLight 
                                    ? 'bg-rose-100 text-black border-rose-600' 
                                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {item.appearance}
                            </button>
                          </td>

                          {/* Judgement */}
                          <td className="p-1.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 border-2 ${
                              val.isPass
                                ? isLight
                                  ? 'bg-emerald-100 text-black border-emerald-600'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : isLight
                                  ? 'bg-rose-100 text-black border-rose-600'
                                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            }`}>
                              {val.isPass ? <CheckCircle2 className="w-3 h-3 text-emerald-700" /> : <XCircle className="w-3 h-3 text-rose-700" />}
                              <span>{val.isPass ? 'PASS' : 'FAIL'}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="p-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => duplicateItemRow(index)}
                                className={`p-1 rounded transition border ${
                                  isLight 
                                    ? 'bg-slate-100 hover:bg-slate-200 text-black border-slate-300' 
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent'
                                }`}
                                title="Duplicate Row"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeItemRow(index)}
                                className={`p-1 rounded transition border ${
                                  isLight 
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' 
                                    : 'bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-400 border-transparent'
                                }`}
                                title="Delete Row"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Summary Bar & Save Button */}
              <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
                isLight ? 'bg-blue-50/70 border-blue-300' : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className={isLight ? 'text-black font-extrabold' : 'text-slate-400'}>
                    {isTh ? 'จำนวนท่อนทั้งหมด:' : 'Total Q\'ty:'} <strong className={`text-sm ${isLight ? 'text-black font-black' : 'text-white'}`}>{formSummary.totalQty} Pcs</strong>
                  </div>
                  <div className={isLight ? 'text-black font-extrabold' : 'text-emerald-400'}>
                    {isTh ? 'ผ่านเกณฑ์:' : 'Passed:'} <strong className={`text-sm ${isLight ? 'text-black font-black' : 'text-emerald-300'}`}>{formSummary.passedQty} Pcs</strong>
                  </div>
                  <div className={isLight ? 'text-black font-extrabold' : 'text-rose-400'}>
                    {isTh ? 'งานเสีย:' : 'Defects:'} <strong className={`text-sm ${isLight ? 'text-black font-black' : 'text-rose-300'}`}>{formSummary.defectQty} Pcs</strong>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className={isLight ? 'text-black font-extrabold' : 'text-slate-400'}>{isTh ? 'สรุปรวมผลตรวจ:' : 'Overall Status:'}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border-2 ${
                      formSummary.overallPass 
                        ? isLight 
                          ? 'bg-emerald-100 text-black border-emerald-600' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : isLight 
                          ? 'bg-rose-100 text-black border-rose-600' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {formSummary.overallPass ? 'PASS (ผ่าน)' : 'FAIL (มีงานเสีย)'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isTh ? 'บันทึกข้อมูลการตรวจตัด (Save Record)' : 'Save Inspection Record'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: DASHBOARD */}
        {activeTab === 'DASHBOARD' && (
          <BilletCuttingDashboard
            records={records}
            language={language}
            theme={theme}
          />
        )}

        {/* TAB 3: HISTORY & EXPORT */}
        {activeTab === 'HISTORY' && (
          <BilletCuttingHistory
            records={records}
            onUpdateRecords={setRecords}
            language={language}
            theme={theme}
          />
        )}
        </div>
      </div>

      {/* SPEC PROFILE MANAGER MODAL (Admin password protected & IQA-01 Linked) */}
      <BilletCuttingSpecModal
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
        specs={specs}
        onSaveSpecs={setSpecs}
        onSpecSaved={handleSpecSaved}
        onSpecDeleted={handleSpecDeleted}
        iqaSuppliers={iqaSuppliers}
        iqaGrades={iqaGrades}
        iqaHistory={iqaHistory}
        onSyncFromIqa={handleSyncFromIqa}
        language={language}
        theme={theme}
      />

      {/* Datalists linked from Billet Spec & IQA-01 (Grade Spec) */}
      <datalist id="billet-cutting-heat-list">
        {Object.keys(iqaHeatMap).slice(0, 80).map(heat => (
          <option key={heat} value={heat}>
            {iqaHeatMap[heat].supplier ? `${heat} (${iqaHeatMap[heat].supplier} • ${iqaHeatMap[heat].grade})` : heat}
          </option>
        ))}
      </datalist>

      <datalist id="billet-cutting-supplier-list">
        {Array.from(new Set([...specSuppliers, ...iqaSuppliers])).map(sup => (
          <option key={sup} value={sup} />
        ))}
      </datalist>

      <datalist id="billet-cutting-grade-list">
        {Array.from(new Set([...specBilletGrades, ...iqaGrades])).map(grade => (
          <option key={grade} value={grade} />
        ))}
      </datalist>
    </div>
  );
};
