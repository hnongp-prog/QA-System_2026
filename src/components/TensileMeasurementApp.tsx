import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  FileSpreadsheet, 
  Settings, 
  Search, 
  Lock, 
  ArrowLeft, 
  Check, 
  X, 
  BarChart3, 
  Filter, 
  Layers, 
  Gauge, 
  Calendar, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Cpu,
  Edit3,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ListFilter,
  Sun,
  Moon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

import { 
  TensileQualitySpec, 
  TensileRecord, 
  Language, 
  InspectionActivity,
  TensileLimitMode,
  TensileElongMode,
  ThemeMode
} from '../types';
import { useCloudState } from '../services/firestoreSync';
import { InspectorDatalist, saveRecordedInspector } from '../utils/inspectorStorage';
import { ProcessSelector, MachineSelector } from './common/ProcessMachineSelector';
import { STANDARD_PROCESS_OPTIONS, STANDARD_MACHINE_OPTIONS } from '../constants/processOptions';

export const formatTensileSpec = (spec: TensileQualitySpec): string => {
  const mode = spec.tensile_mode || 'min';
  if (mode === 'max') {
    const maxVal = spec.tensile_max !== undefined ? spec.tensile_max : spec.tensile;
    return `≤ ${maxVal} MPa`;
  }
  if (mode === 'both') {
    const minVal = spec.tensile;
    const maxVal = spec.tensile_max !== undefined ? spec.tensile_max : spec.tensile;
    return `${minVal} - ${maxVal} MPa`;
  }
  return `≥ ${spec.tensile} MPa`;
};

export const isTensilePass = (val: number, spec: TensileQualitySpec): boolean => {
  const mode = spec.tensile_mode || 'min';
  if (mode === 'max') {
    const maxVal = spec.tensile_max !== undefined ? spec.tensile_max : spec.tensile;
    return val <= maxVal;
  }
  if (mode === 'both') {
    const minVal = spec.tensile;
    const maxVal = spec.tensile_max !== undefined ? spec.tensile_max : spec.tensile;
    return val >= minVal && val <= maxVal;
  }
  return val >= spec.tensile;
};

export const formatYieldSpec = (spec: TensileQualitySpec): string => {
  const mode = spec.yield_mode || 'min';
  if (mode === 'max') {
    const maxVal = spec.yield_max !== undefined ? spec.yield_max : spec.yield;
    return `≤ ${maxVal} MPa`;
  }
  if (mode === 'both') {
    const minVal = spec.yield;
    const maxVal = spec.yield_max !== undefined ? spec.yield_max : spec.yield;
    return `${minVal} - ${maxVal} MPa`;
  }
  return `≥ ${spec.yield} MPa`;
};

export const isYieldPass = (val: number, spec: TensileQualitySpec): boolean => {
  const mode = spec.yield_mode || 'min';
  if (mode === 'max') {
    const maxVal = spec.yield_max !== undefined ? spec.yield_max : spec.yield;
    return val <= maxVal;
  }
  if (mode === 'both') {
    const minVal = spec.yield;
    const maxVal = spec.yield_max !== undefined ? spec.yield_max : spec.yield;
    return val >= minVal && val <= maxVal;
  }
  return val >= spec.yield;
};

export const formatElongationSpec = (spec: TensileQualitySpec): string => {
  const mode = spec.elong_mode || 'min';
  if (mode === 'max') {
    const maxVal = spec.elong_max !== undefined ? spec.elong_max : spec.elong;
    return `≤ ${maxVal}%`;
  }
  if (mode === 'both') {
    const minVal = spec.elong;
    const maxVal = spec.elong_max !== undefined ? spec.elong_max : spec.elong;
    return `${minVal}% - ${maxVal}%`;
  }
  return `≥ ${spec.elong}%`;
};

export const isElongPass = (val: number, spec: TensileQualitySpec): boolean => {
  const mode = spec.elong_mode || 'min';
  if (mode === 'max') {
    const maxVal = spec.elong_max !== undefined ? spec.elong_max : spec.elong;
    return val <= maxVal;
  }
  if (mode === 'both') {
    const minVal = spec.elong;
    const maxVal = spec.elong_max !== undefined ? spec.elong_max : spec.elong;
    return val >= minVal && val <= maxVal;
  }
  return val >= spec.elong;
};

// Helper to test if a field is ignored/unmeasured (like '-', 'N/A', empty)
export const isIgnoredValue = (v?: string | number | null): boolean => {
  if (v === undefined || v === null) return true;
  const s = String(v).trim();
  return s === '' || s === '-' || s === '--' || s === '---' || s === 'N/A' || s === 'n/a' || s === 'none' || s === 'null' || s === 'undefined';
};

// Helper to evaluate if a single dimension or strength value is Out-of-Spec (NG)
export const isFieldNg = (
  field: 'width' | 'h_left' | 'h_middle' | 'h_right' | 'tensile' | 'yield' | 'yield_val' | 'elong',
  value: string | number | undefined | null,
  spec: TensileQualitySpec | null
): boolean => {
  if (!spec || value === undefined || value === null) return false;
  if (isIgnoredValue(value)) return false;
  const num = typeof value === 'number' ? value : parseFloat(String(value).trim());
  if (isNaN(num)) return false;

  if (field === 'width') {
    if (spec.min_w > 0 && num < spec.min_w) return true;
    if (spec.max_w > 0 && num > spec.max_w) return true;
    return false;
  }
  if (field === 'h_left' || field === 'h_middle' || field === 'h_right') {
    if (spec.min_h > 0 && num < spec.min_h) return true;
    if (spec.max_h > 0 && num > spec.max_h) return true;
    return false;
  }
  if (field === 'tensile') {
    return !isTensilePass(num, spec);
  }
  if (field === 'yield' || field === 'yield_val') {
    return !isYieldPass(num, spec);
  }
  if (field === 'elong') {
    return !isElongPass(num, spec);
  }
  return false;
};

// Helper to format field spec limit for title tooltip
export const getFieldSpecText = (
  field: 'width' | 'h_left' | 'h_middle' | 'h_right' | 'tensile' | 'yield' | 'yield_val' | 'elong',
  spec: TensileQualitySpec | null
): string => {
  if (!spec) return '';
  if (field === 'width') {
    return spec.min_w > 0 && spec.max_w > 0 ? `${spec.min_w} - ${spec.max_w} mm` : '';
  }
  if (field === 'h_left' || field === 'h_middle' || field === 'h_right') {
    return spec.min_h > 0 && spec.max_h > 0 ? `${spec.min_h} - ${spec.max_h} mm` : '';
  }
  if (field === 'tensile') return formatTensileSpec(spec);
  if (field === 'yield' || field === 'yield_val') return formatYieldSpec(spec);
  if (field === 'elong') return formatElongationSpec(spec);
  return '';
};

interface TensileMeasurementAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const DEFAULT_TENSILE_SPECS: TensileQualitySpec[] = [
  {
    id: 'spec-01',
    profile: 'HR-A36',
    process: 'HOT_ROLL',
    min_w: 12.0,
    max_w: 13.0,
    min_h: 3.0,
    max_h: 3.5,
    tensile: 400.0,
    tensile_mode: 'min',
    yield: 250.0,
    yield_mode: 'min',
    elong: 20.0,
    elong_mode: 'min'
  },
  {
    id: 'spec-02',
    profile: 'CR-SS400',
    process: 'COLD_ROLL',
    min_w: 19.5,
    max_w: 20.5,
    min_h: 2.0,
    max_h: 2.5,
    tensile: 400.0,
    tensile_max: 510.0,
    tensile_mode: 'both',
    yield: 245.0,
    yield_mode: 'min',
    elong: 18.0,
    elong_max: 30.0,
    elong_mode: 'both'
  },
  {
    id: 'spec-03',
    profile: 'PIPE-STK500',
    process: 'FORMING',
    min_w: 24.0,
    max_w: 26.0,
    min_h: 4.0,
    max_h: 4.8,
    tensile: 500.0,
    tensile_mode: 'min',
    yield: 320.0,
    yield_mode: 'min',
    elong: 15.0,
    elong_mode: 'min'
  }
];

const INITIAL_RECORDS: TensileRecord[] = [
  {
    id: 'rec-001',
    coil_no: 'COIL-2026-A101',
    heat_no: 'HEAT-9812',
    work_order: 'WO-2026-001',
    profile: 'HR-A36',
    process: 'HOT_ROLL',
    machine: 'TENSILE-M01',
    inspector: 'Somchai P. (IPQA)',
    sample_name: 'SAMPLE-1A',
    width: 12.5,
    h_left: 3.2,
    h_middle: 3.2,
    h_right: 3.2,
    tensile: 425.0,
    yield: 265.0,
    elong: 22.5,
    decision: 'PASS',
    timestamp_raw: '2026-08-04T08:30:00.000Z',
    timestamp: '04/08/2026, 08:30:00'
  },
  {
    id: 'rec-002',
    coil_no: 'COIL-2026-A102',
    heat_no: 'HEAT-9813',
    work_order: 'WO-2026-001',
    profile: 'HR-A36',
    process: 'HOT_ROLL',
    machine: 'TENSILE-M01',
    inspector: 'Somchai P. (IPQA)',
    sample_name: 'SAMPLE-1B',
    width: 12.4,
    h_left: 3.1,
    h_middle: 3.1,
    h_right: 3.1,
    tensile: 418.0,
    yield: 258.0,
    elong: 21.0,
    decision: 'PASS',
    timestamp_raw: '2026-08-04T11:15:00.000Z',
    timestamp: '04/08/2026, 11:15:00'
  },
  {
    id: 'rec-003',
    coil_no: 'COIL-2026-B201',
    heat_no: 'HEAT-7710',
    work_order: 'WO-2026-002',
    profile: 'CR-SS400',
    process: 'COLD_ROLL',
    machine: 'TENSILE-M02',
    inspector: 'Kittisak N. (IPQA)',
    sample_name: 'SAMPLE-2A',
    width: 21.2,
    h_left: 2.2,
    h_middle: 2.2,
    h_right: 2.2,
    tensile: 430.0,
    yield: 280.0,
    elong: 19.0,
    decision: 'FAIL',
    timestamp_raw: '2026-08-05T02:10:00.000Z',
    timestamp: '05/08/2026, 09:10:00'
  }
];

export const TensileMeasurementApp: React.FC<TensileMeasurementAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'dashboard' | 'specs'>('entry');

  // Quality Specs state
  const [specs, setSpecs] = useCloudState<TensileQualitySpec[]>('tensile_qc_specs', DEFAULT_TENSILE_SPECS);

  // Test Records state
  const [records, setRecords] = useCloudState<TensileRecord[]>('tensile_qc_records', INITIAL_RECORDS);

  // Entry Form Header Fields
  const [mainProfile, setMainProfile] = useState('');
  const [mainProcess, setMainProcess] = useState('');
  const [mainMachine, setMainMachine] = useState('');
  const [mainInspector, setMainInspector] = useState('');
  const [mainShift, setMainShift] = useState('');

  // Active top blank input row for rapid continuous entry
  const [topRow, setTopRow] = useState<{
    coil_no: string;
    heat_no: string;
    work_order: string;
    sample_name: string;
    width: string;
    h_left: string;
    h_middle: string;
    h_right: string;
    tensile: string;
    yield_val: string;
    elong: string;
  }>({
    coil_no: '',
    heat_no: '',
    work_order: '',
    sample_name: '',
    width: '',
    h_left: '',
    h_middle: '',
    h_right: '',
    tensile: '',
    yield_val: '',
    elong: ''
  });

  // Entered rows that shift downward as new entries are added
  const [enteredRows, setEnteredRows] = useState<{
    id: string;
    coil_no: string;
    heat_no: string;
    work_order: string;
    sample_name: string;
    width: string;
    h_left: string;
    h_middle: string;
    h_right: string;
    tensile: string;
    yield_val: string;
    elong: string;
  }[]>([]);
  const [entrySuccessToast, setEntrySuccessToast] = useState('');

  // Admin Modal Security
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // History Edit Authentication & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<TensileRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<TensileRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  // Request Edit History Record
  const handleRequestEditHistory = (item: TensileRecord) => {
    setTargetEditHistoryItem(item);
    setHistoryAuthPassword('');
    setHistoryAuthError(false);
    setIsHistoryAuthOpen(true);
  };

  // Verify Password (admin2026) for Edit
  const handleVerifyHistoryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (historyAuthPassword === 'admin2026') {
      setIsHistoryAuthOpen(false);
      setHistoryAuthError(false);
      if (targetEditHistoryItem) {
        setEditingHistoryItem(JSON.parse(JSON.stringify(targetEditHistoryItem)));
      }
    } else {
      setHistoryAuthError(true);
      setHistoryAuthPassword('');
    }
  };

  // Save Edited History Record
  const handleSaveEditedHistory = () => {
    if (!editingHistoryItem) return;
    setRecords(prev => prev.map(rec => rec.id === editingHistoryItem.id ? editingHistoryItem : rec));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
  };

  // History / Dashboard Filters
  const [historyProfileFilter, setHistoryProfileFilter] = useState('All');
  const [historyCoilSearch, setHistoryCoilSearch] = useState('');
  const [dashboardProfileFilter, setDashboardProfileFilter] = useState('All');
  const [dashboardPeriod, setDashboardPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Spec Matcher
  const matchedSpec = useMemo(() => {
    if (!mainProfile.trim()) return null;
    const p = mainProfile.trim().toUpperCase();
    const pr = mainProcess.trim().toUpperCase();
    return specs.find(s => s.profile.toUpperCase() === p && (s.process.toUpperCase() === pr || !pr)) || null;
  }, [mainProfile, mainProcess, specs]);

  const handleProfileChange = (profileVal: string) => {
    setMainProfile(profileVal);
    if (profileVal) {
      const found = specs.find(s => s.profile.toUpperCase() === profileVal.trim().toUpperCase());
      if (found && !mainProcess) {
        setMainProcess(found.process);
      }
    }
  };

  const handleResetTopRow = () => {
    setTopRow({
      coil_no: '',
      heat_no: '',
      work_order: '',
      sample_name: '',
      width: '',
      h_left: '',
      h_middle: '',
      h_right: '',
      tensile: '',
      yield_val: '',
      elong: ''
    });
  };

  const handleResetForm = () => {
    setMainProfile('');
    setMainProcess('');
    setMainMachine('');
    setMainInspector('');
    setMainShift('');
    handleResetTopRow();
    setEnteredRows([]);
  };

  // Single Row Evaluator
  const evaluateRow = (row: {
    width: string;
    h_left: string;
    h_middle?: string;
    h_right: string;
    tensile: string;
    yield_val: string;
    elong: string;
  }): 'PASS' | 'FAIL' | 'PENDING' => {
    if (!matchedSpec) return 'PENDING';
    const parseVal = (v?: string) => {
      if (v === undefined || isIgnoredValue(v)) return null;
      const num = parseFloat(String(v).trim());
      return isNaN(num) ? NaN : num;
    };

    const w = parseVal(row.width);
    const hl = parseVal(row.h_left);
    const hm = parseVal(row.h_middle);
    const hr = parseVal(row.h_right);
    const t = parseVal(row.tensile);
    const y = parseVal(row.yield_val);
    const e = parseVal(row.elong);

    // If any field has invalid NaN (non-numeric text other than '-' or blank), return PENDING
    if ([w, hl, hm, hr, t, y, e].some(v => typeof v === 'number' && isNaN(v))) {
      return 'PENDING';
    }

    // Check if at least one field has been measured with a valid number
    const numericFields = [w, hl, hm, hr, t, y, e].filter((v): v is number => v !== null && !isNaN(v));
    if (numericFields.length === 0) return 'PENDING';

    let pass = true;

    if (w !== null && !isNaN(w) && isFieldNg('width', row.width, matchedSpec)) {
      pass = false;
    }
    if (hl !== null && !isNaN(hl) && isFieldNg('h_left', row.h_left, matchedSpec)) {
      pass = false;
    }
    if (hm !== null && !isNaN(hm) && isFieldNg('h_middle', row.h_middle, matchedSpec)) {
      pass = false;
    }
    if (hr !== null && !isNaN(hr) && isFieldNg('h_right', row.h_right, matchedSpec)) {
      pass = false;
    }
    if (t !== null && !isNaN(t) && isFieldNg('tensile', row.tensile, matchedSpec)) {
      pass = false;
    }
    if (y !== null && !isNaN(y) && isFieldNg('yield_val', row.yield_val, matchedSpec)) {
      pass = false;
    }
    if (e !== null && !isNaN(e) && isFieldNg('elong', row.elong, matchedSpec)) {
      pass = false;
    }

    return pass ? 'PASS' : 'FAIL';
  };

  // Add Item(s) into List (Supports 1, 4, or 6 items at once)
  const handleAddFromTopRow = (count: number = 1, e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const lastItem = enteredRows[enteredRows.length - 1];
    const cleanCoil = topRow.coil_no.trim().toUpperCase() || (lastItem?.coil_no || 'COIL-01');
    const cleanHeat = topRow.heat_no.trim().toUpperCase() || (lastItem?.heat_no || 'HEAT-01');
    const cleanWorkOrder = topRow.work_order.trim().toUpperCase() || (lastItem?.work_order || '');

    const newItems: typeof enteredRows = [];
    const baseCount = enteredRows.length;

    for (let i = 0; i < count; i++) {
      const sampleIndex = baseCount + i + 1;
      const sampleLabel = (i === 0 && topRow.sample_name.trim())
        ? topRow.sample_name.trim().toUpperCase()
        : `SAMPLE-${String(sampleIndex).padStart(2, '0')}`;

      // If width or height were entered in topRow, copy them across the batch; else check lastItem
      const wVal = topRow.width.trim() || (lastItem?.width && lastItem.width !== '-' ? lastItem.width : '-');
      const hlVal = topRow.h_left.trim() || (lastItem?.h_left && lastItem.h_left !== '-' ? lastItem.h_left : '-');
      const hmVal = topRow.h_middle.trim() || (lastItem?.h_middle && lastItem.h_middle !== '-' ? lastItem.h_middle : '-');
      const hrVal = topRow.h_right.trim() || (lastItem?.h_right && lastItem.h_right !== '-' ? lastItem.h_right : '-');

      // For first item, take tensile, yield, elong from topRow if available; for subsequent batch items, default to '-' ready for keying
      const tVal = (i === 0 && topRow.tensile.trim()) ? topRow.tensile.trim() : '-';
      const yVal = (i === 0 && topRow.yield_val.trim()) ? topRow.yield_val.trim() : '-';
      const eVal = (i === 0 && topRow.elong.trim()) ? topRow.elong.trim() : '-';

      newItems.push({
        id: `entry-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        coil_no: cleanCoil,
        heat_no: cleanHeat,
        work_order: cleanWorkOrder,
        sample_name: sampleLabel,
        width: wVal,
        h_left: hlVal,
        h_middle: hmVal,
        h_right: hrVal,
        tensile: tVal,
        yield_val: yVal,
        elong: eVal
      });
    }

    // Append newItems so records sequence naturally in order (1, 2, 3...) like IPQA-02
    setEnteredRows(prev => [...prev, ...newItems]);

    // Keep coil_no, heat_no, and work_order for continuous entry of same batch, clear numerical fields
    setTopRow({
      coil_no: cleanCoil,
      heat_no: cleanHeat,
      work_order: cleanWorkOrder,
      sample_name: '',
      width: '',
      h_left: '',
      h_middle: '',
      h_right: '',
      tensile: '',
      yield_val: '',
      elong: ''
    });

    const toastMsg = count === 1
      ? (isTh ? `✓ เพิ่ม ${newItems[0]?.sample_name || '1 ชิ้นงาน'} เรียบร้อยแล้ว (เรียงต่อท้ายในตาราง)` : `✓ Added 1 sample successfully (appended in order)`)
      : (isTh ? `✓ เพิ่มชุดชิ้นงาน ${count} ชิ้นเรียบร้อยแล้ว (${newItems[0]?.sample_name} ถึง ${newItems[newItems.length - 1]?.sample_name})` : `✓ Added batch of ${count} samples (${newItems[0]?.sample_name} - ${newItems[newItems.length - 1]?.sample_name})`);

    setEntrySuccessToast(toastMsg);
    setTimeout(() => setEntrySuccessToast(''), 3500);
  };

  const handleUpdateEnteredRow = (id: string, field: string, value: string) => {
    setEnteredRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleDeleteEnteredRow = (id: string) => {
    setEnteredRows(prev => prev.filter(r => r.id !== id));
  };

  const handleClearAllEnteredRows = () => {
    if (enteredRows.length === 0) return;
    if (window.confirm(isTh ? 'ต้องการล้างรายการทั้งหมดที่รอการบันทึกใช่หรือไม่?' : 'Clear all pending rows?')) {
      setEnteredRows([]);
    }
  };

  // Save All Entry Rows
  const handleSaveAllRows = () => {
    if (!matchedSpec) {
      setEntrySuccessToast(isTh ? '⚠️ กรุณาระบุ Profile & Process ที่มีเกณฑ์ Spec ในระบบ' : '⚠️ Please specify a profile & process matching registered specs');
      setTimeout(() => setEntrySuccessToast(''), 3500);
      return;
    }

    // Collect all entered rows
    const rowsToProcess = [...enteredRows];

    // If operator has filled numbers in the top row without clicking Add, include it too (appended at end)
    const hasTopRowData = (topRow.width.trim() && topRow.width.trim() !== '-') || (topRow.tensile.trim() && topRow.tensile.trim() !== '-');
    if (hasTopRowData) {
      rowsToProcess.push({
        id: `entry-top-${Date.now()}`,
        coil_no: topRow.coil_no.trim().toUpperCase() || 'COIL-01',
        heat_no: topRow.heat_no.trim().toUpperCase() || 'HEAT-01',
        work_order: topRow.work_order.trim().toUpperCase() || '',
        sample_name: topRow.sample_name.trim().toUpperCase() || `SAMPLE-${rowsToProcess.length + 1}`,
        width: topRow.width.trim() || '-',
        h_left: topRow.h_left.trim() || '-',
        h_middle: topRow.h_middle.trim() || '-',
        h_right: topRow.h_right.trim() || '-',
        tensile: topRow.tensile.trim() || '-',
        yield_val: topRow.yield_val.trim() || '-',
        elong: topRow.elong.trim() || '-'
      });
    }

    if (rowsToProcess.length === 0) {
      setEntrySuccessToast(isTh ? '⚠️ กรุณากรอกผลการทดสอบอย่างน้อย 1 รายการก่อนบันทึก' : '⚠️ Please enter at least 1 test measurement before saving');
      setTimeout(() => setEntrySuccessToast(''), 3500);
      return;
    }

    const newRecordsToSave: TensileRecord[] = [];
    const now = new Date();

    const parseOrDash = (v: string) => {
      const s = String(v || '').trim();
      if (!s || s === '-' || s === 'N/A') return '-';
      const n = parseFloat(s);
      return isNaN(n) ? '-' : n;
    };

    rowsToProcess.forEach((row, i) => {
      const w = parseOrDash(row.width);
      const hl = parseOrDash(row.h_left);
      const hm = parseOrDash(row.h_middle);
      const hr = parseOrDash(row.h_right);
      const t = parseOrDash(row.tensile);
      const y = parseOrDash(row.yield_val);
      const e = parseOrDash(row.elong);

      // Check if at least one field has been entered
      if ([w, hl, hm, hr, t, y, e].every(v => v === '-')) return;

      const evalResult = evaluateRow(row);
      const decision = evalResult === 'FAIL' ? 'FAIL' : 'PASS';
      const recId = `rec-${Date.now()}-${i}`;

      const rec: TensileRecord = {
        id: recId,
        coil_no: row.coil_no.trim().toUpperCase() || 'COIL-UNTITLED',
        heat_no: row.heat_no.trim().toUpperCase() || 'HEAT-00',
        work_order: row.work_order?.trim().toUpperCase() || '',
        profile: matchedSpec.profile,
        process: matchedSpec.process,
        machine: mainMachine.trim().toUpperCase() || 'TENSILE-M01',
        inspector: mainInspector.trim() || 'IPQA Officer',
        shift: mainShift.trim() || '',
        sample_name: row.sample_name.trim().toUpperCase() || `SAMPLE-${i+1}`,
        width: w,
        h_left: hl,
        h_middle: hm,
        h_right: hr,
        tensile: t,
        yield: y,
        elong: e,
        std: matchedSpec,
        decision,
        timestamp_raw: now.toISOString(),
        timestamp: now.toLocaleString('th-TH')
      };

      newRecordsToSave.push(rec);

      const ngPoints: string[] = [];
      if (isFieldNg('width', row.width, matchedSpec)) {
        const specTxt = `${matchedSpec.min_w} - ${matchedSpec.max_w} mm`;
        const valNum = typeof w === 'number' ? w : parseFloat(String(w));
        const comp = !isNaN(valNum) && valNum < matchedSpec.min_w ? `< Min ${matchedSpec.min_w}` : `> Max ${matchedSpec.max_w}`;
        ngPoints.push(`Width ${w} mm (${comp} mm, Spec: ${specTxt})`);
      }
      if (isFieldNg('h_left', row.h_left, matchedSpec)) {
        const specTxt = `${matchedSpec.min_h} - ${matchedSpec.max_h} mm`;
        const valNum = typeof hl === 'number' ? hl : parseFloat(String(hl));
        const comp = !isNaN(valNum) && valNum < matchedSpec.min_h ? `< Min ${matchedSpec.min_h}` : `> Max ${matchedSpec.max_h}`;
        ngPoints.push(`Height L ${hl} mm (${comp} mm, Spec: ${specTxt})`);
      }
      if (isFieldNg('h_middle', row.h_middle, matchedSpec)) {
        const specTxt = `${matchedSpec.min_h} - ${matchedSpec.max_h} mm`;
        const valNum = typeof hm === 'number' ? hm : parseFloat(String(hm));
        const comp = !isNaN(valNum) && valNum < matchedSpec.min_h ? `< Min ${matchedSpec.min_h}` : `> Max ${matchedSpec.max_h}`;
        ngPoints.push(`Height M ${hm} mm (${comp} mm, Spec: ${specTxt})`);
      }
      if (isFieldNg('h_right', row.h_right, matchedSpec)) {
        const specTxt = `${matchedSpec.min_h} - ${matchedSpec.max_h} mm`;
        const valNum = typeof hr === 'number' ? hr : parseFloat(String(hr));
        const comp = !isNaN(valNum) && valNum < matchedSpec.min_h ? `< Min ${matchedSpec.min_h}` : `> Max ${matchedSpec.max_h}`;
        ngPoints.push(`Height R ${hr} mm (${comp} mm, Spec: ${specTxt})`);
      }
      if (isFieldNg('tensile', row.tensile, matchedSpec)) {
        ngPoints.push(`Tensile strength ${t} MPa (Out of Spec: ${formatTensileSpec(matchedSpec)})`);
      }
      if (isFieldNg('yield', row.yield_val, matchedSpec)) {
        ngPoints.push(`Yield strength ${y} MPa (Out of Spec: ${formatYieldSpec(matchedSpec)})`);
      }
      if (isFieldNg('elong', row.elong, matchedSpec)) {
        ngPoints.push(`Elongation ${e}% (Out of Spec: ${formatElongationSpec(matchedSpec)})`);
      }

      const inspectionResultText = decision === 'PASS' 
        ? `PASS (All specs within tolerance)` 
        : (ngPoints.length > 0 ? ngPoints.join(' | ') : 'Dimension Out of Spec');

      if (onLogNewActivity) {
        if (mainInspector) saveRecordedInspector(mainInspector);
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-01',
          moduleTitleTh: 'การทดสอบแรงดึง (Tensile Measurement)',
          moduleTitleEn: 'Tensile Measurement & Quality Spec System',
          inspector: mainInspector.trim() || 'IPQA Officer',
          shift: mainShift.trim() || '',
          batchLot: `${matchedSpec.profile} - ${row.coil_no}`,
          result: decision === 'PASS' ? 'PASS' : 'REJECT',
          defectCount: decision === 'FAIL' ? 1 : 0,
          remarks: inspectionResultText,
          coilNo: row.coil_no || 'COIL-N/A',
          profile: matchedSpec.profile || 'CR-SPEC',
          process: `IPQA-01 Tensile (${mainProcess})`,
          inspectionDate: rec.timestamp,
          inspectionResult: inspectionResultText
        });
      }
    });

    if (newRecordsToSave.length === 0) {
      alert(isTh ? 'กรุณากรอกข้อมูลตัวเลขผลการทดสอบให้สมบูรณ์' : 'Please fill complete numerical test results');
      return;
    }

    setRecords(prev => [...newRecordsToSave, ...prev]);
    setEnteredRows([]);
    handleResetTopRow();
    setActiveTab('history');
  };

  // Admin Auth Handlers
  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setActiveTab('specs');
    } else {
      setShowAdminModal(true);
    }
  };

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminPasswordInput === 'admin2026') {
      setIsAdminAuthenticated(true);
      setShowAdminModal(false);
      setPasswordError(false);
      setAdminPasswordInput('');
      setActiveTab('specs');
    } else {
      setPasswordError(true);
      setAdminPasswordInput('');
    }
  };

  // Quality Specs Form & State (Empty inputs ready for user data entry)
  const [newSpecForm, setNewSpecForm] = useState<{
    profile: string;
    process: string;
    min_w: string;
    max_w: string;
    min_h: string;
    max_h: string;
    tensile_mode: TensileLimitMode;
    tensile: string;
    tensile_max: string;
    yield_mode: TensileLimitMode;
    yield: string;
    yield_max: string;
    elong_mode: TensileLimitMode;
    elong: string;
    elong_max: string;
  }>({
    profile: '',
    process: '',
    min_w: '',
    max_w: '',
    min_h: '',
    max_h: '',
    tensile_mode: 'min',
    tensile: '',
    tensile_max: '',
    yield_mode: 'min',
    yield: '',
    yield_max: '',
    elong_mode: 'min',
    elong: '',
    elong_max: ''
  });
  const [newSpecError, setNewSpecError] = useState('');
  const [newSpecSuccessMsg, setNewSpecSuccessMsg] = useState('');
  const [specSearchQuery, setSpecSearchQuery] = useState('');
  const [editingSpec, setEditingSpec] = useState<TensileQualitySpec | null>(null);

  // Handle Save New Profile Spec (takes empty form inputs, validates and stores)
  const handleSaveNewSpec = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSpecForm.profile.trim()) {
      setNewSpecError(isTh ? 'กรุณาระบุชื่อ Profile Name' : 'Please enter Profile Name');
      return;
    }

    const cleanProfile = newSpecForm.profile.trim().toUpperCase();
    const cleanProcess = newSpecForm.process.trim().toUpperCase() || 'HOT_ROLL';

    const tensileVal = parseFloat(newSpecForm.tensile) || 0;
    const tensileMaxVal = newSpecForm.tensile_max ? (parseFloat(newSpecForm.tensile_max) || 0) : undefined;
    const yieldVal = parseFloat(newSpecForm.yield) || 0;
    const yieldMaxVal = newSpecForm.yield_max ? (parseFloat(newSpecForm.yield_max) || 0) : undefined;
    const elongVal = parseFloat(newSpecForm.elong) || 0;
    const elongMaxVal = newSpecForm.elong_max ? (parseFloat(newSpecForm.elong_max) || 0) : undefined;

    const newSpecObj: TensileQualitySpec = {
      id: `spec-${Date.now()}`,
      profile: cleanProfile,
      process: cleanProcess,
      min_w: parseFloat(newSpecForm.min_w) || 0,
      max_w: parseFloat(newSpecForm.max_w) || 0,
      min_h: parseFloat(newSpecForm.min_h) || 0,
      max_h: parseFloat(newSpecForm.max_h) || 0,
      tensile: tensileVal,
      tensile_max: newSpecForm.tensile_mode === 'max' ? (tensileMaxVal !== undefined ? tensileMaxVal : tensileVal) : (newSpecForm.tensile_mode === 'both' ? (tensileMaxVal !== undefined ? tensileMaxVal : tensileVal) : undefined),
      tensile_mode: newSpecForm.tensile_mode,
      yield: yieldVal,
      yield_max: newSpecForm.yield_mode === 'max' ? (yieldMaxVal !== undefined ? yieldMaxVal : yieldVal) : (newSpecForm.yield_mode === 'both' ? (yieldMaxVal !== undefined ? yieldMaxVal : yieldVal) : undefined),
      yield_mode: newSpecForm.yield_mode,
      elong: elongVal,
      elong_max: newSpecForm.elong_mode === 'max' ? (elongMaxVal !== undefined ? elongMaxVal : elongVal) : (newSpecForm.elong_mode === 'both' ? (elongMaxVal !== undefined ? elongMaxVal : elongVal) : undefined),
      elong_mode: newSpecForm.elong_mode
    };

    const existingIdx = specs.findIndex(s => s.profile.toUpperCase() === cleanProfile);
    if (existingIdx >= 0) {
      setSpecs(prev => {
        const copy = [...prev];
        copy[existingIdx] = { ...newSpecObj, id: copy[existingIdx].id };
        return copy;
      });
      setNewSpecSuccessMsg(isTh ? `อัปเดตเกณฑ์ Spec สำหรับ "${cleanProfile}" เรียบร้อยแล้ว` : `Updated spec for "${cleanProfile}"`);
    } else {
      setSpecs(prev => [newSpecObj, ...prev]);
      setNewSpecSuccessMsg(isTh ? `บันทึก Profile Spec ใหม่ "${cleanProfile}" เรียบร้อยแล้ว` : `Saved new profile spec "${cleanProfile}"`);
    }

    // Reset back to empty fields ready for next key-in
    setNewSpecForm({
      profile: '',
      process: '',
      min_w: '',
      max_w: '',
      min_h: '',
      max_h: '',
      tensile_mode: 'min',
      tensile: '',
      tensile_max: '',
      yield_mode: 'min',
      yield: '',
      yield_max: '',
      elong_mode: 'min',
      elong: '',
      elong_max: ''
    });
    setNewSpecError('');
    setTimeout(() => setNewSpecSuccessMsg(''), 4000);
  };

  const handleResetNewSpecForm = () => {
    setNewSpecForm({
      profile: '',
      process: '',
      min_w: '',
      max_w: '',
      min_h: '',
      max_h: '',
      tensile_mode: 'min',
      tensile: '',
      tensile_max: '',
      yield_mode: 'min',
      yield: '',
      yield_max: '',
      elong_mode: 'min',
      elong: '',
      elong_max: ''
    });
    setNewSpecError('');
  };

  const handleSaveEditedSpec = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingSpec) return;
    if (!editingSpec.profile.trim()) {
      alert(isTh ? 'กรุณาระบุชื่อ Profile Name' : 'Profile Name cannot be empty');
      return;
    }
    setSpecs(prev => prev.map(s => s.id === editingSpec.id ? editingSpec : s));
    setEditingSpec(null);
  };

  const handleDeleteSpec = (id: string) => {
    const target = specs.find(s => s.id === id);
    const confirmMsg = isTh 
      ? `ต้องการลบ Profile Spec "${target?.profile || id}" ใช่หรือไม่?`
      : `Are you sure you want to delete profile spec "${target?.profile || id}"?`;
    if (window.confirm(confirmMsg)) {
      setSpecs(prev => prev.filter(s => s.id !== id));
      if (mainProfile === target?.profile) {
        setMainProfile('');
      }
    }
  };

  const filteredSpecs = useMemo(() => {
    if (!specSearchQuery.trim()) return specs;
    const q = specSearchQuery.trim().toLowerCase();
    return specs.filter(s => s.profile.toLowerCase().includes(q) || s.process.toLowerCase().includes(q));
  }, [specs, specSearchQuery]);

  // History Filter
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchP = historyProfileFilter === 'All' || r.profile === historyProfileFilter;
      const matchC = !historyCoilSearch || r.coil_no.toLowerCase().includes(historyCoilSearch.toLowerCase());
      return matchP && matchC;
    });
  }, [records, historyProfileFilter, historyCoilSearch]);

  // Dashboard Calculations
  const dashboardRecords = useMemo(() => {
    const [year, month] = dashboardPeriod.split('-').map(Number);
    return records.filter(r => {
      const matchP = dashboardProfileFilter === 'All' || r.profile === dashboardProfileFilter;
      const d = new Date(r.timestamp_raw);
      const matchM = !dashboardPeriod || (d.getFullYear() === year && d.getMonth() + 1 === month);
      return matchP && matchM;
    }).sort((a, b) => a.timestamp_raw.localeCompare(b.timestamp_raw));
  }, [records, dashboardProfileFilter, dashboardPeriod]);

  const dashStats = useMemo(() => {
    const total = dashboardRecords.length;
    const pass = dashboardRecords.filter(r => r.decision === 'PASS').length;
    const fail = total - pass;
    const ngRate = total > 0 ? ((fail / total) * 100).toFixed(1) : '0.0';
    return { total, pass, fail, ngRate };
  }, [dashboardRecords]);

  // Chart data formatting
  const chartData = useMemo(() => {
    const activeSpec = matchedSpec || (dashboardProfileFilter !== 'All' ? specs.find(s => s.profile === dashboardProfileFilter) : specs[0]);
    return dashboardRecords.slice(-20).map((r, i) => {
      const recordSpec = r.std || specs.find(s => s.profile === r.profile) || activeSpec;
      return {
        index: i + 1,
        coil: r.coil_no,
        sample: r.sample_name,
        tensile: typeof r.tensile === 'number' ? r.tensile : (parseFloat(String(r.tensile)) || null),
        yield: typeof r.yield === 'number' ? r.yield : (parseFloat(String(r.yield)) || null),
        elong: typeof r.elong === 'number' ? r.elong : (parseFloat(String(r.elong)) || null),
        specTensileMin: recordSpec?.tensile ?? 400,
        specTensileMax: recordSpec?.tensile_max,
        tensileMode: recordSpec?.tensile_mode || 'min',
        specYieldMin: recordSpec?.yield ?? 250,
        specYieldMax: recordSpec?.yield_max,
        yieldMode: recordSpec?.yield_mode || 'min',
        specElongMin: recordSpec?.elong ?? 20,
        specElongMax: recordSpec?.elong_max,
        elongMode: recordSpec?.elong_mode || 'min'
      };
    });
  }, [dashboardRecords, matchedSpec, dashboardProfileFilter, specs]);

  // Export CSV
  const exportHistoryCSV = () => {
    if (records.length === 0) return;
    let csv = "\uFEFFCoil No,Heat No,Work Order,Profile,Process,Machine,Inspector,Sample,Width,H_Left,H_Middle,H_Right,Tensile(MPa),Yield(MPa),Elong(%),Decision,Timestamp\n";
    records.forEach(r => {
      csv += `"${r.coil_no}","${r.heat_no}","${r.work_order || ''}","${r.profile}","${r.process}","${r.machine}","${r.inspector}","${r.sample_name}","${r.width}","${r.h_left}","${r.h_middle !== undefined && r.h_middle !== null ? r.h_middle : '-'}","${r.h_right}","${r.tensile}","${r.yield}","${r.elong}","${r.decision}","${r.timestamp}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Tensile_Measurement_History_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                isLight ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
              }`}>
                <Lock className="w-7 h-7" />
              </div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Admin Verification</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อเข้าสู่โหมดตั้งค่า Spec' : 'Please enter admin password to configure quality specs'}
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-2xl px-4 py-3 text-center text-lg font-mono focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-blue-600 focus:border-blue-500' 
                      : 'bg-slate-950 border-slate-800 text-cyan-300 focus:border-cyan-500'
                  }`}
                  autoFocus
                />
                {passwordError && (
                  <p className="text-rose-500 text-xs font-semibold text-center mt-2">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password. Please try again.'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition ${
                    isLight 
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition shadow-md ${
                    isLight
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                  }`}
                >
                  {isTh ? 'ยืนยันรหัสผ่าน' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Application Header */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b transition-colors ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Return to QA Portal"
            >
              <ArrowLeft className="w-4 h-4 text-blue-600" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-md ${
              isLight 
                ? 'bg-blue-600 text-white shadow-blue-500/20' 
                : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-cyan-500/20'
            }`}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}>
                  IPQA-01
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {isTh ? 'ระบบทดสอบแรงดึง (Tensile System)' : 'Tensile Measurement System'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'ตรวจสอบขนาด Dimension & ค่าแรงดึง Tensile / Yield / Elongation พร้อมระบบควบคุม Spec' 
                  : 'Quality Spec Control, Automated PASS/FAIL Judgment & Interactive Trend Dashboard'}
              </p>
            </div>
          </div>
        </div>

        {/* Engine status indicator & Theme Toggle */}
        <div className="flex items-center gap-2.5">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Clean'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLight ? (isTh ? 'สว่าง' : 'Light') : (isTh ? 'มืด' : 'Dark')}</span>
            </button>
          )}

          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            isLight 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Connected & Realtime Sync</span>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className={`flex space-x-2 border-b pb-2 overflow-x-auto ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <button
          onClick={() => setActiveTab('entry')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'entry'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isTh ? '➕ บันทึกข้อมูล' : 'Data Entry'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'history'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isTh ? '📜 ประวัติข้อมูล' : 'History Log'}</span>
          {records.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-slate-950 text-cyan-300 border-cyan-800'
            }`}>
              {records.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'dashboard'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isTh ? '📊 Dashboard' : 'Trend Dashboard'}</span>
        </button>

        <button
          onClick={handleAdminAccess}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'specs'
              ? isLight
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '⚙️ ตั้งค่า Spec' : 'Quality Specs'}</span>
          {isAdminAuthenticated && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>
      </div>

      {/* TAB 1: DATA ENTRY */}
      {activeTab === 'entry' && (
        <div className="space-y-6">
          
          {/* Section 1: Main Production Metadata */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                {isTh ? '1. ข้อมูลหลักการผลิต (Production Info)' : '1. Production & Spec Metadata'}
              </h3>

              <div className="flex items-center gap-2">
                {matchedSpec ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SPEC LOADED: {matchedSpec.profile} ({matchedSpec.process})</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTh ? 'รอระบุ Profile / Process ที่มี Spec' : 'Waiting for matching spec'}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name *
                </label>
                <select
                  value={mainProfile}
                  onChange={(e) => handleProfileChange(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-900/80 text-cyan-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-400 uppercase"
                >
                  <option value="">-- {isTh ? 'เลือก Profile' : 'Select Profile'} --</option>
                  {specs.map(s => (
                    <option key={s.id} value={s.profile}>{s.profile}</option>
                  ))}
                </select>
              </div>

              <ProcessSelector
                id="tensile-main-process"
                label={isTh ? 'Process Name (กระบวนการ)' : 'Process Name'}
                value={mainProcess}
                onChange={(proc) => setMainProcess(proc)}
              />

              <MachineSelector
                id="tensile-main-machine"
                label={isTh ? 'Machine Code (เครื่องจักร)' : 'Machine Code'}
                value={mainMachine}
                onChange={(mac) => setMainMachine(mac)}
              />

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  list="qa-inspector-list"
                  value={mainInspector}
                  onChange={(e) => setMainInspector(e.target.value)}
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ (Inspector)' : 'Inspector Name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Shift (กะ)
                </label>
                <input
                  list="tensile-shift-options"
                  type="text"
                  value={mainShift}
                  onChange={(e) => setMainShift(e.target.value)}
                  placeholder="e.g. Shift A, Shift B, Shift C..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
                <datalist id="tensile-shift-options">
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
              </div>
            </div>

            {matchedSpec && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                <div><span className="text-slate-500">Spec Width (W):</span> <strong className="text-cyan-300">{matchedSpec.min_w} - {matchedSpec.max_w} mm</strong></div>
                <div><span className="text-slate-500">Spec Height (H):</span> <strong className="text-cyan-300">{matchedSpec.min_h} - {matchedSpec.max_h} mm</strong></div>
                <div><span className="text-slate-500">{isTh ? 'เกณฑ์ Tensile:' : 'Tensile Spec:'}</span> <strong className="text-emerald-300">{formatTensileSpec(matchedSpec)}</strong></div>
                <div><span className="text-slate-500">Yield / Elong:</span> <strong className="text-amber-300">{formatYieldSpec(matchedSpec)} / {formatElongationSpec(matchedSpec)}</strong></div>
              </div>
            )}
          </div>

          {/* Section 2: Test Result Rows Entry Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  {isTh ? '2. บันทึกผลการทดสอบชิ้นงาน (Tensile Test Entry)' : '2. Measurement & Test Entry'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isTh 
                    ? 'เพิ่มรายการแบบ +1, +4 หรือ +6 ชิ้นงาน และกรอกผลการทดสอบเรียงตามลำดับได้ต่อเนื่อง'
                    : 'Add samples by +1, +4, or +6 batch and record test measurements in sequential order'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                  title={isTh ? 'ล้างข้อมูลฟอร์มเริ่มต้นใหม่' : 'Reset Form'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTh ? 'ล้างฟอร์ม' : 'Reset'}</span>
                </button>

                {/* Option to Add 1, 4, or 6 sample rows on the top row with ล้างฟอร์ม like IPQA-02 */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase hidden sm:inline">
                    {isTh ? 'เพิ่มรายการ:' : 'Add Rows:'}
                  </span>

                  {/* Add 1 by 1 */}
                  <button
                    type="button"
                    onClick={() => handleAddFromTopRow(1)}
                    title={isTh ? 'เพิ่มรายการทีละ 1 ชิ้นงาน' : 'Add 1 sample'}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm shadow-cyan-500/20 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isTh ? '+ เพิ่มทีละ 1' : '+ 1 Row'}</span>
                  </button>

                  {/* Add 4 at once */}
                  <button
                    type="button"
                    onClick={() => handleAddFromTopRow(4)}
                    title={isTh ? 'เพิ่มชุดชิ้นงาน 4 รายการภายในครั้งเดียว' : 'Add 4 samples batch at once'}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 border border-indigo-500/30 active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{isTh ? '+ เพิ่มชุด 4 ชิ้น' : '+ 4 Rows'}</span>
                  </button>

                  {/* Add 6 at once */}
                  <button
                    type="button"
                    onClick={() => handleAddFromTopRow(6)}
                    title={isTh ? 'เพิ่มชุดชิ้นงาน 6 รายการภายในครั้งเดียว' : 'Add 6 samples batch at once'}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm shadow-teal-600/20 border border-teal-500/30 active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-300" />
                    <span>{isTh ? '+ เพิ่มชุด 6 ชิ้น' : '+ 6 Rows'}</span>
                  </button>
                </div>

                <button
                  onClick={handleSaveAllRows}
                  disabled={!matchedSpec || (enteredRows.length === 0 && !topRow.tensile.trim())}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isTh 
                      ? `💾 บันทึกผลทั้งหมด (${enteredRows.length + (topRow.width && topRow.tensile ? 1 : 0)})` 
                      : `Save All (${enteredRows.length + (topRow.width && topRow.tensile ? 1 : 0)})`}
                  </span>
                </button>
              </div>
            </div>

            {/* Notification Toast */}
            {entrySuccessToast && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{entrySuccessToast}</span>
              </div>
            )}

            {/* TOP FIXED INPUT ROW (ฟิลด์ข้อมูลเปล่าอยู่ด้านบนสุดเสมอ) */}
            <div className="bg-slate-950 border-2 border-cyan-500/50 p-4 sm:p-5 rounded-2xl shadow-xl shadow-cyan-950/20 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide">
                    {isTh ? '⭐ ฟิลด์กรอกข้อมูลใหม่ (อยู่ด้านบนสุดตลอดเวลา พร้อม Key ต่อเนื่อง)' : '⭐ Active Input Row (Always at Top - Ready for Next Key)'}
                  </span>
                </div>

                {/* Real-time Status Badge */}
                {(() => {
                  const topStatus = evaluateRow(topRow);
                  return (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      topStatus === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : topStatus === 'FAIL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {topStatus === 'PASS' ? '✓ ผ่านเกณฑ์ SPEC' : topStatus === 'FAIL' ? '✕ ไม่ผ่าน SPEC' : 'พร้อมรับข้อมูล'}
                    </span>
                  );
                })()}
              </div>

              {/* 11 Inputs Grid */}
              {(() => {
                const isTopWNg = isFieldNg('width', topRow.width, matchedSpec);
                const isTopHLNg = isFieldNg('h_left', topRow.h_left, matchedSpec);
                const isTopHMNg = isFieldNg('h_middle', topRow.h_middle, matchedSpec);
                const isTopHRNg = isFieldNg('h_right', topRow.h_right, matchedSpec);
                const isTopTensileNg = isFieldNg('tensile', topRow.tensile, matchedSpec);
                const isTopYieldNg = isFieldNg('yield_val', topRow.yield_val, matchedSpec);
                const isTopElongNg = isFieldNg('elong', topRow.elong, matchedSpec);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2.5">
                    <div>
                      <label className="text-[9px] font-bold text-cyan-300 block uppercase mb-1">Coil No. *</label>
                      <input
                        type="text"
                        value={topRow.coil_no}
                        onChange={(e) => setTopRow(prev => ({ ...prev, coil_no: e.target.value }))}
                        placeholder="COIL-01"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400 uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Heat No.</label>
                      <input
                        type="text"
                        value={topRow.heat_no}
                        onChange={(e) => setTopRow(prev => ({ ...prev, heat_no: e.target.value }))}
                        placeholder="HEAT-01"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400 uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Work Order</label>
                      <input
                        type="text"
                        value={topRow.work_order}
                        onChange={(e) => setTopRow(prev => ({ ...prev, work_order: e.target.value }))}
                        placeholder="WO-01"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-400 uppercase"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Sample Name</label>
                      <input
                        type="text"
                        value={topRow.sample_name}
                        onChange={(e) => setTopRow(prev => ({ ...prev, sample_name: e.target.value }))}
                        placeholder={`SAMPLE-${String(enteredRows.length + 1).padStart(2, '0')}`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-400 uppercase"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[9px] font-bold block uppercase ${isTopWNg ? 'text-rose-400' : 'text-slate-400'}`}>
                          W (mm)
                        </label>
                        {isTopWNg && (
                          <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40">
                            NG
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={topRow.width}
                        onChange={(e) => setTopRow(prev => ({ ...prev, width: e.target.value }))}
                        placeholder={matchedSpec ? `${matchedSpec.min_w} - ${matchedSpec.max_w}` : '0.00 / -'}
                        title={isTopWNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('width', matchedSpec)})` : undefined}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors focus:outline-none ${
                          isTopWNg
                            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500 shadow-sm shadow-rose-950/50'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[9px] font-bold block uppercase ${isTopHLNg ? 'text-rose-400' : 'text-slate-400'}`}>
                          H_Left
                        </label>
                        {isTopHLNg && (
                          <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40">
                            NG
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={topRow.h_left}
                        onChange={(e) => setTopRow(prev => ({ ...prev, h_left: e.target.value }))}
                        placeholder={matchedSpec ? `${matchedSpec.min_h} - ${matchedSpec.max_h}` : '0.00 / -'}
                        title={isTopHLNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_left', matchedSpec)})` : undefined}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors focus:outline-none ${
                          isTopHLNg
                            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500 shadow-sm shadow-rose-950/50'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[9px] font-bold block uppercase ${isTopHMNg ? 'text-rose-400' : 'text-slate-400'}`}>
                          H_Middle
                        </label>
                        {isTopHMNg && (
                          <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40">
                            NG
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={topRow.h_middle}
                        onChange={(e) => setTopRow(prev => ({ ...prev, h_middle: e.target.value }))}
                        placeholder={matchedSpec ? `${matchedSpec.min_h} - ${matchedSpec.max_h}` : '0.00 / -'}
                        title={isTopHMNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_middle', matchedSpec)})` : undefined}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors focus:outline-none ${
                          isTopHMNg
                            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500 shadow-sm shadow-rose-950/50'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[9px] font-bold block uppercase ${isTopHRNg ? 'text-rose-400' : 'text-slate-400'}`}>
                          H_Right
                        </label>
                        {isTopHRNg && (
                          <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40">
                            NG
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={topRow.h_right}
                        onChange={(e) => setTopRow(prev => ({ ...prev, h_right: e.target.value }))}
                        placeholder={matchedSpec ? `${matchedSpec.min_h} - ${matchedSpec.max_h}` : '0.00 / -'}
                        title={isTopHRNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_right', matchedSpec)})` : undefined}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono transition-colors focus:outline-none ${
                          isTopHRNg
                            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500 shadow-sm shadow-rose-950/50'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 focus:border-cyan-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[9px] font-bold block uppercase ${isTopTensileNg ? 'text-rose-400' : 'text-cyan-400'}`}>
                          Tensile (MPa)
                        </label>
                        {isTopTensileNg && (
                          <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40">
                            NG
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={topRow.tensile}
                        onChange={(e) => setTopRow(prev => ({ ...prev, tensile: e.target.value }))}
                        placeholder={matchedSpec ? formatTensileSpec(matchedSpec) : 'MPa / -'}
                        title={isTopTensileNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('tensile', matchedSpec)})` : undefined}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold transition-colors focus:outline-none ${
                          isTopTensileNg
                            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-500 shadow-sm shadow-rose-950/50'
                            : 'bg-slate-900 border border-cyan-900/80 text-cyan-300 focus:border-cyan-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[9px] font-bold block uppercase ${isTopYieldNg ? 'text-rose-400' : 'text-emerald-400'}`}>
                          Yield (MPa)
                        </label>
                        {isTopYieldNg && (
                          <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40">
                            NG
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={topRow.yield_val}
                        onChange={(e) => setTopRow(prev => ({ ...prev, yield_val: e.target.value }))}
                        placeholder={matchedSpec ? formatYieldSpec(matchedSpec) : 'MPa / -'}
                        title={isTopYieldNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('yield_val', matchedSpec)})` : undefined}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold transition-colors focus:outline-none ${
                          isTopYieldNg
                            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-500 shadow-sm shadow-rose-950/50'
                            : 'bg-slate-900 border border-emerald-900/80 text-emerald-300 focus:border-emerald-400'
                        }`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-[9px] font-bold block uppercase ${isTopElongNg ? 'text-rose-400' : 'text-amber-400'}`}>
                          Elong (%)
                        </label>
                        {isTopElongNg && (
                          <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40">
                            NG
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={topRow.elong}
                        data-no-enter-advance="true"
                        onChange={(e) => setTopRow(prev => ({ ...prev, elong: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddFromTopRow(); }}
                        placeholder={matchedSpec ? formatElongationSpec(matchedSpec) : '% / -'}
                        title={isTopElongNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('elong', matchedSpec)})` : undefined}
                        className={`w-full rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold transition-colors focus:outline-none ${
                          isTopElongNg
                            ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-500 shadow-sm shadow-rose-950/50'
                            : 'bg-slate-900 border border-amber-900/80 text-amber-300 focus:border-amber-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })()}

              {/* Action Bar for Top Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-900">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-cyan-300">Tip:</span>
                  <span>{isTh ? 'กด Enter หรือคลิก "+ เพิ่มลงตาราง" เพื่อนำข้อมูลลงในตาราง (เรียงต่อท้ายตามลำดับ 1, 2, 3...)' : 'Press Enter or click Add to append row in order (1, 2, 3...)'}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTopRow}
                    className="bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs px-3 py-1.5 rounded-lg border border-slate-800 transition"
                  >
                    {isTh ? 'ล้างฟิลด์นี้' : 'Clear Row'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddFromTopRow(1)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm shadow-cyan-500/20 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isTh ? '+ เพิ่มลงตาราง' : '+ Add to Table'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* LIST OF ENTERED ROWS (เรียงลำดับต่อเนื่องเหมือน IPQA-02) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {isTh 
                      ? `รายการที่เพิ่มแล้ว (${enteredRows.length} รายการ - เรียงลำดับ 1, 2, 3...)` 
                      : `Entered Samples (${enteredRows.length} items - Sequential Order)`}
                  </span>
                </h4>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px]">
                    <span className="text-slate-500 px-1 font-semibold">{isTh ? 'เพิ่มด่วน:' : 'Quick Add:'}</span>
                    <button
                      type="button"
                      onClick={() => handleAddFromTopRow(1)}
                      title={isTh ? 'เพิ่มทีละ 1' : '+1'}
                      className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold px-2 py-0.5 rounded transition flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFromTopRow(4)}
                      title={isTh ? 'เพิ่ม 4 ชิ้น' : '+4'}
                      className="bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold px-2 py-0.5 rounded transition flex items-center gap-0.5"
                    >
                      <Layers className="w-3 h-3" />
                      <span>4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddFromTopRow(6)}
                      title={isTh ? 'เพิ่ม 6 ชิ้น' : '+6'}
                      className="bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold px-2 py-0.5 rounded transition flex items-center gap-0.5"
                    >
                      <Layers className="w-3 h-3" />
                      <span>6</span>
                    </button>
                  </div>

                  {enteredRows.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllEnteredRows}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>{isTh ? 'ล้างรายการทั้งหมด' : 'Clear All'}</span>
                    </button>
                  )}
                </div>
              </div>

              {enteredRows.length === 0 ? (
                <div className="bg-slate-950/60 p-8 rounded-2xl border border-slate-800/80 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <ListFilter className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-300">
                    {isTh ? 'ยังไม่มีรายการชิ้นงานในตาราง' : 'No test samples added yet'}
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                    {isTh 
                      ? 'กรอกข้อมูลผลการทดสอบในฟิลด์แถวด้านบนสุด แล้วกด "+ เพิ่มลงรายการ" หรือกด Enter ข้อมูลจะถูกเลื่อนลงมาแสดงในรายการนี้ต่อเนื่อง'
                      : 'Fill in test data in the top blank row and click "+ Add to List" or press Enter to push records into this list'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {enteredRows.map((row, idx) => {
                    const status = evaluateRow(row);
                    return (
                      <div key={row.id} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/90 space-y-2.5 transition hover:border-slate-700">
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 font-mono text-[10px] font-bold">
                              #{idx + 1}
                            </span>
                            <span className="font-bold text-white text-xs">{row.sample_name || `SAMPLE-${idx+1}`}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({row.coil_no} / {row.heat_no}{row.work_order ? ` / WO: ${row.work_order}` : ''})</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              status === 'PASS'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : status === 'FAIL'
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {status === 'PASS' ? '✓ PASS' : status === 'FAIL' ? '✕ FAIL / NG' : 'PENDING'}
                            </span>

                            <button
                              onClick={() => handleDeleteEnteredRow(row.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                              title={isTh ? 'ลบรายการนี้' : 'Delete'}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Row Editable Fields */}
                        {(() => {
                          const isWNg = isFieldNg('width', row.width, matchedSpec);
                          const isHLNg = isFieldNg('h_left', row.h_left, matchedSpec);
                          const isHMNg = isFieldNg('h_middle', row.h_middle, matchedSpec);
                          const isHRNg = isFieldNg('h_right', row.h_right, matchedSpec);
                          const isTNg = isFieldNg('tensile', row.tensile, matchedSpec);
                          const isYNg = isFieldNg('yield_val', row.yield_val, matchedSpec);
                          const isENg = isFieldNg('elong', row.elong, matchedSpec);

                          return (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2">
                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">Coil No.</label>
                                <input
                                  type="text"
                                  value={row.coil_no}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'coil_no', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">Heat No.</label>
                                <input
                                  type="text"
                                  value={row.heat_no}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'heat_no', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">Work Order</label>
                                <input
                                  type="text"
                                  value={row.work_order || ''}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'work_order', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                                />
                              </div>

                              <div>
                                <label className="text-[8px] font-bold text-slate-500 block uppercase">Sample</label>
                                <input
                                  type="text"
                                  value={row.sample_name}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'sample_name', e.target.value)}
                                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 font-bold focus:outline-none focus:border-cyan-500 uppercase"
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className={`text-[8px] font-bold block uppercase ${isWNg ? 'text-rose-400' : 'text-slate-500'}`}>W (mm)</label>
                                  {isWNg && <span className="text-[7px] font-bold bg-rose-500/20 text-rose-300 px-0.5 rounded border border-rose-500/40">NG</span>}
                                </div>
                                <input
                                  type="text"
                                  value={row.width}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'width', e.target.value)}
                                  title={isWNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('width', matchedSpec)})` : undefined}
                                  className={`w-full rounded px-2 py-1 text-xs font-mono transition-colors focus:outline-none ${
                                    isWNg
                                      ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                                      : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className={`text-[8px] font-bold block uppercase ${isHLNg ? 'text-rose-400' : 'text-slate-500'}`}>H_Left</label>
                                  {isHLNg && <span className="text-[7px] font-bold bg-rose-500/20 text-rose-300 px-0.5 rounded border border-rose-500/40">NG</span>}
                                </div>
                                <input
                                  type="text"
                                  value={row.h_left}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'h_left', e.target.value)}
                                  title={isHLNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_left', matchedSpec)})` : undefined}
                                  className={`w-full rounded px-2 py-1 text-xs font-mono transition-colors focus:outline-none ${
                                    isHLNg
                                      ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                                      : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className={`text-[8px] font-bold block uppercase ${isHMNg ? 'text-rose-400' : 'text-slate-500'}`}>H_Middle</label>
                                  {isHMNg && <span className="text-[7px] font-bold bg-rose-500/20 text-rose-300 px-0.5 rounded border border-rose-500/40">NG</span>}
                                </div>
                                <input
                                  type="text"
                                  value={row.h_middle}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'h_middle', e.target.value)}
                                  title={isHMNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_middle', matchedSpec)})` : undefined}
                                  className={`w-full rounded px-2 py-1 text-xs font-mono transition-colors focus:outline-none ${
                                    isHMNg
                                      ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                                      : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className={`text-[8px] font-bold block uppercase ${isHRNg ? 'text-rose-400' : 'text-slate-500'}`}>H_Right</label>
                                  {isHRNg && <span className="text-[7px] font-bold bg-rose-500/20 text-rose-300 px-0.5 rounded border border-rose-500/40">NG</span>}
                                </div>
                                <input
                                  type="text"
                                  value={row.h_right}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'h_right', e.target.value)}
                                  title={isHRNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_right', matchedSpec)})` : undefined}
                                  className={`w-full rounded px-2 py-1 text-xs font-mono transition-colors focus:outline-none ${
                                    isHRNg
                                      ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                                      : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-cyan-500'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className={`text-[8px] font-bold block uppercase ${isTNg ? 'text-rose-400' : 'text-cyan-400'}`}>Tensile (MPa)</label>
                                  {isTNg && <span className="text-[7px] font-bold bg-rose-500/20 text-rose-300 px-0.5 rounded border border-rose-500/40">NG</span>}
                                </div>
                                <input
                                  type="text"
                                  value={row.tensile}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'tensile', e.target.value)}
                                  title={isTNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('tensile', matchedSpec)})` : undefined}
                                  className={`w-full rounded px-2 py-1 text-xs font-mono font-bold transition-colors focus:outline-none ${
                                    isTNg
                                      ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                                      : 'bg-slate-900 border border-cyan-900/60 text-cyan-300 focus:border-cyan-400'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className={`text-[8px] font-bold block uppercase ${isYNg ? 'text-rose-400' : 'text-emerald-400'}`}>Yield (MPa)</label>
                                  {isYNg && <span className="text-[7px] font-bold bg-rose-500/20 text-rose-300 px-0.5 rounded border border-rose-500/40">NG</span>}
                                </div>
                                <input
                                  type="text"
                                  value={row.yield_val}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'yield_val', e.target.value)}
                                  title={isYNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('yield_val', matchedSpec)})` : undefined}
                                  className={`w-full rounded px-2 py-1 text-xs font-mono font-bold transition-colors focus:outline-none ${
                                    isYNg
                                      ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                                      : 'bg-slate-900 border border-emerald-900/60 text-emerald-300 focus:border-emerald-400'
                                  }`}
                                />
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label className={`text-[8px] font-bold block uppercase ${isENg ? 'text-rose-400' : 'text-amber-400'}`}>Elong (%)</label>
                                  {isENg && <span className="text-[7px] font-bold bg-rose-500/20 text-rose-300 px-0.5 rounded border border-rose-500/40">NG</span>}
                                </div>
                                <input
                                  type="text"
                                  value={row.elong}
                                  onChange={(e) => handleUpdateEnteredRow(row.id, 'elong', e.target.value)}
                                  title={isENg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('elong', matchedSpec)})` : undefined}
                                  className={`w-full rounded px-2 py-1 text-xs font-mono font-bold transition-colors focus:outline-none ${
                                    isENg
                                      ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400 focus:ring-1 focus:ring-rose-500'
                                      : 'bg-slate-900 border border-amber-900/60 text-amber-300 focus:border-amber-400'
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}

                  {/* Summary & Bottom Save Button */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-slate-300">
                      <span>{isTh ? 'สรุปรายการที่รอการบันทึก:' : 'Summary:'} </span>
                      <strong className="text-cyan-300">{enteredRows.length} {isTh ? 'รายการ' : 'samples'}</strong>
                      {' • '}
                      <span className="text-emerald-400 font-semibold">
                        {isTh ? 'ผ่าน' : 'Pass'}: {enteredRows.filter(r => evaluateRow(r) === 'PASS').length}
                      </span>
                      {' • '}
                      <span className="text-rose-400 font-semibold">
                        {isTh ? 'ไม่ผ่าน' : 'Fail'}: {enteredRows.filter(r => evaluateRow(r) === 'FAIL').length}
                      </span>
                    </div>

                    <button
                      onClick={handleSaveAllRows}
                      disabled={!matchedSpec || (enteredRows.length === 0 && !topRow.tensile.trim())}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isTh ? `💾 ยืนยันบันทึกผลการทดสอบทั้งหมด (${enteredRows.length})` : `Save All Results (${enteredRows.length})`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Top Control Bar */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isTh ? "ค้นหา Coil No..." : "Search Coil No..."}
                  value={historyCoilSearch}
                  onChange={(e) => setHistoryCoilSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 uppercase font-mono"
                />
              </div>

              <select
                value={historyProfileFilter}
                onChange={(e) => setHistoryProfileFilter(e.target.value)}
                className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="All">{isTh ? '-- แสดงทุก Profile --' : 'All Profiles'}</option>
                {specs.map(s => (
                  <option key={s.id} value={s.profile}>{s.profile}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportHistoryCSV}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{isTh ? 'ส่งออก CSV' : 'Export CSV'}</span>
              </button>

              <button
                onClick={() => setRecords([])}
                className="bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* History Records Table */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Batch Info</th>
                    <th className="px-4 py-3">Sample Details</th>
                    <th className="px-4 py-3">Dimension (W / HL / HM / HR)</th>
                    <th className="px-4 py-3">Test Result (T / Y / E)</th>
                    <th className="px-4 py-3 text-center">Judgment</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-950/40">
                      <td className="px-4 py-3 font-mono">
                        <strong className="text-cyan-300 text-xs block">{r.coil_no}</strong>
                        <div className="text-[10px] text-slate-400">
                          <span>Heat: {r.heat_no || '-'}</span>
                          {r.work_order && <span className="text-amber-400 ml-1.5 font-semibold">WO: {r.work_order}</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          {r.timestamp} • {r.inspector || 'IPQA'}{r.shift ? ` (${r.shift})` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-200 block">{r.sample_name}</span>
                        <span className="text-[10px] text-slate-400">{r.profile} ({r.process})</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {r.width} / {r.h_left} / {r.h_middle !== undefined && r.h_middle !== null ? r.h_middle : '-'} / {r.h_right} mm
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <span className="text-cyan-300 font-bold">{r.tensile}</span> / <span className="text-emerald-300 font-bold">{r.yield}</span> / <span className="text-amber-300 font-bold">{r.elong}%</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          r.decision === 'PASS'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {r.decision}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRequestEditHistory(r)}
                            className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold"
                            title={isTh ? "แก้ไขข้อมูล (ต้องใส่ Password)" : "Edit Record (Password required)"}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
                          </button>
                          <button
                            onClick={() => setRecords(prev => prev.filter(rec => rec.id !== r.id))}
                            className="text-slate-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        {isTh ? 'ไม่มีข้อมูลประวัติการทดสอบแรงดึง' : 'No tensile test history records found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TREND DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Filter Ribbon */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={dashboardProfileFilter}
                onChange={(e) => setDashboardProfileFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="All">{isTh ? 'ทุก Profile' : 'All Profiles'}</option>
                {specs.map(s => (
                  <option key={s.id} value={s.profile}>{s.profile}</option>
                ))}
              </select>

              <input
                type="month"
                value={dashboardPeriod}
                onChange={(e) => setDashboardPeriod(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-xs text-slate-400 font-semibold">
              {isTh ? 'ช่วงเวลา:' : 'Period:'} <span className="text-cyan-300 font-mono">{dashboardPeriod}</span>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Samples</span>
              <p className="text-2xl font-bold text-white font-mono">{dashStats.total}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-900/50 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">PASS Rate</span>
              <p className="text-2xl font-bold text-emerald-300 font-mono">{dashStats.pass}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-rose-900/50 space-y-1">
              <span className="text-[10px] font-bold text-rose-400 uppercase">FAIL (NG)</span>
              <p className="text-2xl font-bold text-rose-300 font-mono">{dashStats.fail}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-amber-900/50 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 uppercase">NG Rate (%)</span>
              <p className="text-2xl font-bold text-amber-300 font-mono">{dashStats.ngRate}%</p>
            </div>
          </div>

          {/* Interactive Recharts Trend Lines */}
          <div className="space-y-6">
            {/* Chart 1: Tensile Strength */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  Tensile Strength Trends (MPa)
                </h3>
                <span className="text-[10px] font-mono text-cyan-300">Unit: MPa</span>
              </div>
              <div className="h-64 w-full pt-2">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="coil" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="tensile" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, fill: '#06b6d4' }} name="Tensile (MPa)" />
                      {(chartData[0]?.tensileMode === 'min' || chartData[0]?.tensileMode === 'both' || !chartData[0]?.tensileMode) && (
                        <ReferenceLine y={chartData[0]?.specTensileMin || 400} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min Spec', fill: '#ef4444', fontSize: 10 }} />
                      )}
                      {(chartData[0]?.tensileMode === 'max' || (chartData[0]?.tensileMode === 'both' && chartData[0]?.specTensileMax)) && (
                        <ReferenceLine y={chartData[0]?.specTensileMax || 550} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Max Spec', fill: '#f97316', fontSize: 10 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    {isTh ? 'ไม่มีข้อมูลในช่วงที่เลือก' : 'No trend data for selected period'}
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Yield Strength */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Yield Strength Trends (MPa)
                </h3>
                <span className="text-[10px] font-mono text-emerald-300">Unit: MPa</span>
              </div>
              <div className="h-64 w-full pt-2">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="coil" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="yield" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} name="Yield (MPa)" />
                      {(chartData[0]?.yieldMode === 'min' || chartData[0]?.yieldMode === 'both' || !chartData[0]?.yieldMode) && (
                        <ReferenceLine y={chartData[0]?.specYieldMin || 250} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min Spec', fill: '#ef4444', fontSize: 10 }} />
                      )}
                      {(chartData[0]?.yieldMode === 'max' || (chartData[0]?.yieldMode === 'both' && chartData[0]?.specYieldMax)) && (
                        <ReferenceLine y={chartData[0]?.specYieldMax || 350} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Max Spec', fill: '#f97316', fontSize: 10 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    {isTh ? 'ไม่มีข้อมูลในช่วงที่เลือก' : 'No trend data for selected period'}
                  </div>
                )}
              </div>
            </div>

            {/* Chart 3: Elongation */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  Elongation Trends (%)
                </h3>
                <span className="text-[10px] font-mono text-amber-300">Unit: %</span>
              </div>
              <div className="h-64 w-full pt-2">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="coil" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="elong" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} name="Elongation (%)" />
                      {(chartData[0]?.elongMode === 'min' || chartData[0]?.elongMode === 'both' || !chartData[0]?.elongMode) && (
                        <ReferenceLine y={chartData[0]?.specElongMin || 20} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min Spec', fill: '#ef4444', fontSize: 10 }} />
                      )}
                      {(chartData[0]?.elongMode === 'max' || (chartData[0]?.elongMode === 'both' && chartData[0]?.specElongMax)) && (
                        <ReferenceLine y={chartData[0]?.specElongMax || 25} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Max Spec', fill: '#f97316', fontSize: 10 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    {isTh ? 'ไม่มีข้อมูลในช่วงที่เลือก' : 'No trend data for selected period'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: QUALITY SPECS SETTING (ADMIN) */}
      {activeTab === 'specs' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  {isTh ? 'ตั้งค่าเกณฑ์มาตรฐาน Spec เคมี & แรงดึง' : 'Quality Spec Profile Configuration'}
                  <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                    {specs.length} {isTh ? 'Profiles ที่บันทึก' : 'Profiles'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isTh 
                    ? 'จัดการ Profile Spec กลางสำหรับตัดสินผล Pass/Fail อัตโนมัติในโมดูล IPQA-01' 
                    : 'Manage standard quality criteria for automated Pass/Fail decisions'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  alert(isTh ? 'อัปเดตเกณฑ์ Spec ทั้งหมดไปยัง Cloud เรียบร้อยแล้ว' : 'All specs synchronized to Cloud');
                }}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                <span>{isTh ? '💾 บันทึกขึ้น Cloud' : 'Sync to Cloud'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 1: เพิ่ม PROFILE SPEC ใหม่ (ฟิลด์เปล่าเพื่อเตรียม Key ข้อมูล) */}
          <div className="bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
                    {isTh ? '1. เพิ่ม Profile Spec ใหม่ (ฟิลด์เปล่าพร้อมกรอก)' : '1. Add New Profile Spec (Empty Form)'}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {isTh ? 'กรอกรายละเอียดและเกณฑ์มาตรฐานของ Profile ใหม่' : 'Key in profile name, process, dimensions and mechanical strength limits'}
                  </p>
                </div>
              </div>

              {newSpecSuccessMsg && (
                <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{newSpecSuccessMsg}</span>
                </div>
              )}
            </div>

            {newSpecError && (
              <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs px-3.5 py-2 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>{newSpecError}</span>
              </div>
            )}

            <form onSubmit={handleSaveNewSpec} className="space-y-4">
              {/* Row 1: Profile & Process Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-6">
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    {isTh ? 'ชื่อ Profile Name *' : 'Profile Name *'}
                  </label>
                  <input
                    type="text"
                    placeholder={isTh ? 'เช่น HR-A36, CR-SS400, PIPE-STK500, PRO-1200' : 'e.g. HR-A36, CR-SS400, PIPE-STK500'}
                    value={newSpecForm.profile}
                    onChange={(e) => {
                      setNewSpecForm({ ...newSpecForm, profile: e.target.value.toUpperCase() });
                      if (newSpecError) setNewSpecError('');
                    }}
                    className="w-full bg-slate-950 border border-cyan-800/80 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-cyan-300 placeholder-slate-600 uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="lg:col-span-6">
                  <ProcessSelector
                    id="new-spec-process"
                    label={isTh ? 'ชื่อ Process Name' : 'Process Name'}
                    value={newSpecForm.process}
                    onChange={(proc) => setNewSpecForm({ ...newSpecForm, process: proc })}
                  />
                </div>
              </div>

              {/* Row 2: Dimension Limits */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  {isTh ? 'เกณฑ์ขนาด Dimension (mm)' : 'Dimension Limits (mm)'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Min Width (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="เช่น 12.0"
                      value={newSpecForm.min_w}
                      onChange={(e) => setNewSpecForm({ ...newSpecForm, min_w: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Max Width (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="เช่น 13.0"
                      value={newSpecForm.max_w}
                      onChange={(e) => setNewSpecForm({ ...newSpecForm, max_w: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Min Height (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="เช่น 3.0"
                      value={newSpecForm.min_h}
                      onChange={(e) => setNewSpecForm({ ...newSpecForm, min_h: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Max Height (mm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="เช่น 3.5"
                      value={newSpecForm.max_h}
                      onChange={(e) => setNewSpecForm({ ...newSpecForm, max_h: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Mechanical Strength Limits (Tensile, Yield, Elongation with Min / Max / Both Conditions) */}
              <div className="space-y-4">
                {/* 1. Tensile Strength Condition Selector & Fields */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-cyan-900/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                        {isTh ? 'เกณฑ์ค่า Tensile Strength (MPa)' : 'Tensile Strength Specification'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isTh 
                          ? 'เลือกประเภทเกณฑ์: ค่าขั้นต่ำ (≥ Min), ค่าสูงสุด (≤ Max), หรือช่วง (Min ~ Max)' 
                          : 'Select condition: Minimum only (≥ Min), Maximum only (≤ Max), or Range (Min ~ Max)'}
                      </p>
                    </div>

                    {/* Tensile Condition Mode Selector Buttons */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, tensile_mode: 'min' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.tensile_mode === 'min'
                            ? 'bg-cyan-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ค่าขั้นต่ำ (≥ Min)' : 'Min Only (≥)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, tensile_mode: 'max' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.tensile_mode === 'max'
                            ? 'bg-cyan-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ค่าสูงสุด (≤ Max)' : 'Max Only (≤)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, tensile_mode: 'both' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.tensile_mode === 'both'
                            ? 'bg-cyan-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ทั้ง 2 ค่า (Min ~ Max)' : 'Both (Min ~ Max)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Tensile Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {(newSpecForm.tensile_mode === 'min' || newSpecForm.tensile_mode === 'both') && (
                      <div>
                        <label className="text-[10px] font-bold text-cyan-300 uppercase block mb-1">
                          {newSpecForm.tensile_mode === 'both' ? (isTh ? 'Min Tensile (MPa) [ค่าต่ำสุด]' : 'Min Tensile (MPa)') : (isTh ? 'Min Tensile (MPa) [เกณฑ์ขั้นต่ำ ≥]' : 'Min Tensile (MPa)')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder={isTh ? 'เช่น 400' : 'e.g. 400'}
                          value={newSpecForm.tensile}
                          onChange={(e) => setNewSpecForm({ ...newSpecForm, tensile: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}

                    {(newSpecForm.tensile_mode === 'max' || newSpecForm.tensile_mode === 'both') && (
                      <div>
                        <label className="text-[10px] font-bold text-cyan-300 uppercase block mb-1">
                          {newSpecForm.tensile_mode === 'both' ? (isTh ? 'Max Tensile (MPa) [ค่าสูงสุด]' : 'Max Tensile (MPa)') : (isTh ? 'Max Tensile (MPa) [เกณฑ์สูงสุด ≤]' : 'Max Tensile (MPa)')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder={isTh ? 'เช่น 510' : 'e.g. 510'}
                          value={newSpecForm.tensile_mode === 'max' ? (newSpecForm.tensile_max || newSpecForm.tensile) : newSpecForm.tensile_max}
                          onChange={(e) => {
                            if (newSpecForm.tensile_mode === 'max') {
                              setNewSpecForm({ ...newSpecForm, tensile_max: e.target.value, tensile: e.target.value });
                            } else {
                              setNewSpecForm({ ...newSpecForm, tensile_max: e.target.value });
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Criteria Preview Banner for Tensile */}
                  <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {isTh ? 'สรุปเกณฑ์ตัดสิน Tensile:' : 'Tensile Rule Preview:'}
                    </span>
                    <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                      {newSpecForm.tensile_mode === 'max'
                        ? `≤ ${(newSpecForm.tensile_max || newSpecForm.tensile || '0')} MPa`
                        : newSpecForm.tensile_mode === 'both'
                        ? `${newSpecForm.tensile || '0'} ~ ${newSpecForm.tensile_max || '0'} MPa`
                        : `≥ ${newSpecForm.tensile || '0'} MPa`}
                    </span>
                  </div>
                </div>

                {/* 2. Yield Strength Condition Selector & Fields */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-emerald-900/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        {isTh ? 'เกณฑ์ค่า Yield Strength (MPa)' : 'Yield Strength Specification'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isTh 
                          ? 'เลือกประเภทเกณฑ์: ค่าขั้นต่ำ (≥ Min), ค่าสูงสุด (≤ Max), หรือช่วง (Min ~ Max)' 
                          : 'Select condition: Minimum only (≥ Min), Maximum only (≤ Max), or Range (Min ~ Max)'}
                      </p>
                    </div>

                    {/* Yield Condition Mode Selector Buttons */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, yield_mode: 'min' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.yield_mode === 'min'
                            ? 'bg-emerald-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ค่าขั้นต่ำ (≥ Min)' : 'Min Only (≥)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, yield_mode: 'max' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.yield_mode === 'max'
                            ? 'bg-emerald-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ค่าสูงสุด (≤ Max)' : 'Max Only (≤)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, yield_mode: 'both' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.yield_mode === 'both'
                            ? 'bg-emerald-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ทั้ง 2 ค่า (Min ~ Max)' : 'Both (Min ~ Max)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Yield Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {(newSpecForm.yield_mode === 'min' || newSpecForm.yield_mode === 'both') && (
                      <div>
                        <label className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">
                          {newSpecForm.yield_mode === 'both' ? (isTh ? 'Min Yield (MPa) [ค่าต่ำสุด]' : 'Min Yield (MPa)') : (isTh ? 'Min Yield (MPa) [เกณฑ์ขั้นต่ำ ≥]' : 'Min Yield (MPa)')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder={isTh ? 'เช่น 250' : 'e.g. 250'}
                          value={newSpecForm.yield}
                          onChange={(e) => setNewSpecForm({ ...newSpecForm, yield: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    )}

                    {(newSpecForm.yield_mode === 'max' || newSpecForm.yield_mode === 'both') && (
                      <div>
                        <label className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">
                          {newSpecForm.yield_mode === 'both' ? (isTh ? 'Max Yield (MPa) [ค่าสูงสุด]' : 'Max Yield (MPa)') : (isTh ? 'Max Yield (MPa) [เกณฑ์สูงสุด ≤]' : 'Max Yield (MPa)')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          placeholder={isTh ? 'เช่น 350' : 'e.g. 350'}
                          value={newSpecForm.yield_mode === 'max' ? (newSpecForm.yield_max || newSpecForm.yield) : newSpecForm.yield_max}
                          onChange={(e) => {
                            if (newSpecForm.yield_mode === 'max') {
                              setNewSpecForm({ ...newSpecForm, yield_max: e.target.value, yield: e.target.value });
                            } else {
                              setNewSpecForm({ ...newSpecForm, yield_max: e.target.value });
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Criteria Preview Banner for Yield */}
                  <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {isTh ? 'สรุปเกณฑ์ตัดสิน Yield:' : 'Yield Rule Preview:'}
                    </span>
                    <span className="font-mono font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      {newSpecForm.yield_mode === 'max'
                        ? `≤ ${(newSpecForm.yield_max || newSpecForm.yield || '0')} MPa`
                        : newSpecForm.yield_mode === 'both'
                        ? `${newSpecForm.yield || '0'} ~ ${newSpecForm.yield_max || '0'} MPa`
                        : `≥ ${newSpecForm.yield || '0'} MPa`}
                    </span>
                  </div>
                </div>

                {/* 3. Elongation Condition Selector & Fields (Min / Max / Both) */}
                <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-900/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                        {isTh ? 'เงื่อนไขกำหนดค่า Elongation % (Elongation Condition)' : 'Elongation Specification Condition'}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {isTh 
                          ? 'เลือกประเภทเกณฑ์ที่ต้องการ: ค่าขั้นต่ำ (Min), ค่าสูงสุด (Max), หรือกำหนดทั้ง 2 ค่า (ช่วง Min ~ Max)' 
                          : 'Select condition: Minimum only (≥ Min), Maximum only (≤ Max), or Range (Min ~ Max)'}
                      </p>
                    </div>

                    {/* Condition Mode Selector Buttons */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, elong_mode: 'min' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.elong_mode === 'min'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ค่าขั้นต่ำ (≥ Min)' : 'Min Only (≥)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, elong_mode: 'max' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.elong_mode === 'max'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ค่าสูงสุด (≤ Max)' : 'Max Only (≤)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewSpecForm(prev => ({ ...prev, elong_mode: 'both' }))}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                          newSpecForm.elong_mode === 'both'
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>{isTh ? 'ทั้ง 2 ค่า (Min ~ Max)' : 'Both (Min ~ Max)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Elongation Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {(newSpecForm.elong_mode === 'min' || newSpecForm.elong_mode === 'both') && (
                      <div>
                        <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                          {newSpecForm.elong_mode === 'both' ? (isTh ? 'Min Elongation (%) [ค่าต่ำสุด]' : 'Min Elongation (%)') : (isTh ? 'Min Elongation (%) [เกณฑ์ขั้นต่ำ ≥]' : 'Min Elongation (%)')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={isTh ? 'เช่น 20.0' : 'e.g. 20.0'}
                          value={newSpecForm.elong}
                          onChange={(e) => setNewSpecForm({ ...newSpecForm, elong: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}

                    {(newSpecForm.elong_mode === 'max' || newSpecForm.elong_mode === 'both') && (
                      <div>
                        <label className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                          {newSpecForm.elong_mode === 'both' ? (isTh ? 'Max Elongation (%) [ค่าสูงสุด]' : 'Max Elongation (%)') : (isTh ? 'Max Elongation (%) [เกณฑ์สูงสุด ≤]' : 'Max Elongation (%)')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder={isTh ? 'เช่น 30.0' : 'e.g. 30.0'}
                          value={newSpecForm.elong_mode === 'max' ? (newSpecForm.elong_max || newSpecForm.elong) : newSpecForm.elong_max}
                          onChange={(e) => {
                            if (newSpecForm.elong_mode === 'max') {
                              setNewSpecForm({ ...newSpecForm, elong_max: e.target.value, elong: e.target.value });
                            } else {
                              setNewSpecForm({ ...newSpecForm, elong_max: e.target.value });
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )}
                  </div>

                  {/* Live Criteria Preview Banner */}
                  <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 text-[11px]">
                      {isTh ? 'สรุปเกณฑ์ตัดสิน Elongation:' : 'Elongation Rule Preview:'}
                    </span>
                    <span className="font-mono font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      {newSpecForm.elong_mode === 'max'
                        ? `≤ ${(newSpecForm.elong_max || newSpecForm.elong || '0')}%`
                        : newSpecForm.elong_mode === 'both'
                        ? `${newSpecForm.elong || '0'}% ~ ${newSpecForm.elong_max || '0'}%`
                        : `≥ ${newSpecForm.elong || '0'}%`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetNewSpecForm}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isTh ? 'ล้างค่า' : 'Clear'}</span>
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isTh ? '+ บันทึก Profile Spec นี้' : 'Save New Profile Spec'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: รายการ PROFILE SPEC ที่บันทึกไปแล้ว (แสดงเฉพาะชื่อ PROFILE และปุ่มแก้ไข/ลบ) */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  {isTh ? '2. รายการ Profile Spec ที่บันทึกแล้ว' : '2. Saved Profile Specs'}
                </h4>
                <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {filteredSpecs.length} {isTh ? 'รายการ' : 'items'}
                </span>
              </div>

              {/* Search Box for Profiles */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isTh ? 'ค้นหาชื่อ Profile...' : 'Search profile name...'}
                  value={specSearchQuery}
                  onChange={(e) => setSpecSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Saved Profile List - Showing primarily the Profile Name as requested */}
            {filteredSpecs.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs text-slate-400">
                  {isTh ? 'ไม่พบ Profile Spec ที่ตรงกับการค้นหา' : 'No profile specs found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSpecs.map((spec) => (
                  <div
                    key={spec.id}
                    className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 p-4 rounded-xl transition flex flex-col justify-between space-y-3 group shadow-md"
                  >
                    {/* Top Row: Profile Name & Process */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                          <span className="text-sm font-mono font-black text-cyan-300 tracking-wide">
                            {spec.profile}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {spec.process || 'HOT_ROLL'}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            spec.tensile_mode === 'max'
                              ? 'bg-cyan-950 text-cyan-400 border-cyan-800'
                              : spec.tensile_mode === 'both'
                              ? 'bg-blue-950 text-blue-300 border-blue-800'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                          }`}>
                            {spec.tensile_mode === 'max' ? 'Ten: ≤Max' : spec.tensile_mode === 'both' ? 'Ten: Range' : 'Ten: ≥Min'}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            spec.yield_mode === 'max'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                              : spec.yield_mode === 'both'
                              ? 'bg-teal-950 text-teal-300 border-teal-800'
                              : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                          }`}>
                            {spec.yield_mode === 'max' ? 'Yld: ≤Max' : spec.yield_mode === 'both' ? 'Yld: Range' : 'Yld: ≥Min'}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                            spec.elong_mode === 'max'
                              ? 'bg-orange-950 text-orange-400 border-orange-800'
                              : spec.elong_mode === 'both'
                              ? 'bg-purple-950 text-purple-300 border-purple-800'
                              : 'bg-amber-950 text-amber-400 border-amber-800'
                          }`}>
                            {spec.elong_mode === 'max' ? 'Elong: ≤Max' : spec.elong_mode === 'both' ? 'Elong: Range' : 'Elong: ≥Min'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingSpec(JSON.parse(JSON.stringify(spec)))}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-cyan-950 text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-800 transition"
                          title={isTh ? 'แก้ไขค่า Spec' : 'Edit Spec Values'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSpec(spec.id)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-800 transition"
                          title={isTh ? 'ลบ Profile' : 'Delete Profile'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Compact Spec summary badges */}
                    <div className="bg-slate-900/70 p-2 rounded-lg border border-slate-850 grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Tensile (MPa)</span>
                        <span className="font-bold text-cyan-400">{formatTensileSpec(spec)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Yield (MPa)</span>
                        <span className="font-bold text-emerald-400">{formatYieldSpec(spec)}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Elong (%)</span>
                        <span className="font-bold text-amber-400">{formatElongationSpec(spec)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT SAVED SPEC MODAL */}
      {editingSpec && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'แก้ไขเกณฑ์มาตรฐาน Profile Spec' : 'Edit Quality Spec Profile'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Profile: {editingSpec.profile} ({editingSpec.process})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingSpec(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedSpec} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Profile Name *</label>
                  <input
                    type="text"
                    value={editingSpec.profile}
                    onChange={(e) => setEditingSpec({ ...editingSpec, profile: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>

                <ProcessSelector
                  id="edit-spec-process"
                  label={isTh ? 'Process Name (กระบวนการ)' : 'Process Name'}
                  value={editingSpec.process}
                  onChange={(proc) => setEditingSpec({ ...editingSpec, process: proc })}
                />
              </div>

              {/* Dimensions */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  {isTh ? 'ขนาด Dimension (mm)' : 'Dimension Limits (mm)'}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block">Min W</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingSpec.min_w}
                      onChange={(e) => setEditingSpec({ ...editingSpec, min_w: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block">Max W</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingSpec.max_w}
                      onChange={(e) => setEditingSpec({ ...editingSpec, max_w: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block">Min H</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingSpec.min_h}
                      onChange={(e) => setEditingSpec({ ...editingSpec, min_h: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 uppercase block">Max H</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingSpec.max_h}
                      onChange={(e) => setEditingSpec({ ...editingSpec, max_h: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Strength values & Conditions in Edit Modal (Tensile, Yield, Elongation) */}
              <div className="space-y-3">
                {/* 1. Edit Tensile Condition */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-cyan-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-cyan-400 uppercase">
                      {isTh ? 'เงื่อนไข Tensile Strength (MPa)' : 'Tensile Condition (MPa)'}
                    </label>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, tensile_mode: 'min' })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          (!editingSpec.tensile_mode || editingSpec.tensile_mode === 'min')
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? '≥ Min' : '≥ Min'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, tensile_mode: 'max', tensile_max: editingSpec.tensile_max ?? editingSpec.tensile })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          editingSpec.tensile_mode === 'max'
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? '≤ Max' : '≤ Max'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, tensile_mode: 'both', tensile_max: editingSpec.tensile_max ?? (editingSpec.tensile + 100) })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          editingSpec.tensile_mode === 'both'
                            ? 'bg-cyan-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? 'Min ~ Max' : 'Min ~ Max'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(!editingSpec.tensile_mode || editingSpec.tensile_mode === 'min' || editingSpec.tensile_mode === 'both') && (
                      <div>
                        <label className="text-[9px] text-cyan-300 block mb-1">
                          {editingSpec.tensile_mode === 'both' ? (isTh ? 'Min Tensile (MPa)' : 'Min Tensile (MPa)') : (isTh ? 'Min Tensile (MPa) [≥]' : 'Min Tensile (MPa) [≥]')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={editingSpec.tensile}
                          onChange={(e) => setEditingSpec({ ...editingSpec, tensile: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}

                    {(editingSpec.tensile_mode === 'max' || editingSpec.tensile_mode === 'both') && (
                      <div>
                        <label className="text-[9px] text-cyan-300 block mb-1">
                          {editingSpec.tensile_mode === 'both' ? (isTh ? 'Max Tensile (MPa)' : 'Max Tensile (MPa)') : (isTh ? 'Max Tensile (MPa) [≤]' : 'Max Tensile (MPa) [≤]')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={editingSpec.tensile_mode === 'max' ? (editingSpec.tensile_max ?? editingSpec.tensile) : (editingSpec.tensile_max ?? editingSpec.tensile)}
                          onChange={(e) => {
                            const val罕 = parseFloat(e.target.value) || 0;
                            if (editingSpec.tensile_mode === 'max') {
                              setEditingSpec({ ...editingSpec, tensile_max: val罕, tensile: val罕 });
                            } else {
                              setEditingSpec({ ...editingSpec, tensile_max: val罕 });
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-right font-mono text-cyan-300">
                    {isTh ? 'เกณฑ์ที่ตั้ง:' : 'Rule:'} {formatTensileSpec(editingSpec)}
                  </div>
                </div>

                {/* 2. Edit Yield Condition */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-emerald-400 uppercase">
                      {isTh ? 'เงื่อนไข Yield Strength (MPa)' : 'Yield Condition (MPa)'}
                    </label>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, yield_mode: 'min' })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          (!editingSpec.yield_mode || editingSpec.yield_mode === 'min')
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? '≥ Min' : '≥ Min'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, yield_mode: 'max', yield_max: editingSpec.yield_max ?? editingSpec.yield })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          editingSpec.yield_mode === 'max'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? '≤ Max' : '≤ Max'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, yield_mode: 'both', yield_max: editingSpec.yield_max ?? (editingSpec.yield + 50) })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          editingSpec.yield_mode === 'both'
                            ? 'bg-emerald-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? 'Min ~ Max' : 'Min ~ Max'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(!editingSpec.yield_mode || editingSpec.yield_mode === 'min' || editingSpec.yield_mode === 'both') && (
                      <div>
                        <label className="text-[9px] text-emerald-300 block mb-1">
                          {editingSpec.yield_mode === 'both' ? (isTh ? 'Min Yield (MPa)' : 'Min Yield (MPa)') : (isTh ? 'Min Yield (MPa) [≥]' : 'Min Yield (MPa) [≥]')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={editingSpec.yield}
                          onChange={(e) => setEditingSpec({ ...editingSpec, yield: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}

                    {(editingSpec.yield_mode === 'max' || editingSpec.yield_mode === 'both') && (
                      <div>
                        <label className="text-[9px] text-emerald-300 block mb-1">
                          {editingSpec.yield_mode === 'both' ? (isTh ? 'Max Yield (MPa)' : 'Max Yield (MPa)') : (isTh ? 'Max Yield (MPa) [≤]' : 'Max Yield (MPa) [≤]')}
                        </label>
                        <input
                          type="number"
                          step="1"
                          value={editingSpec.yield_mode === 'max' ? (editingSpec.yield_max ?? editingSpec.yield) : (editingSpec.yield_max ?? editingSpec.yield)}
                          onChange={(e) => {
                            const valY = parseFloat(e.target.value) || 0;
                            if (editingSpec.yield_mode === 'max') {
                              setEditingSpec({ ...editingSpec, yield_max: valY, yield: valY });
                            } else {
                              setEditingSpec({ ...editingSpec, yield_max: valY });
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-right font-mono text-emerald-300">
                    {isTh ? 'เกณฑ์ที่ตั้ง:' : 'Rule:'} {formatYieldSpec(editingSpec)}
                  </div>
                </div>

                {/* 3. Edit Elongation Condition */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-900/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-amber-400 uppercase">
                      {isTh ? 'เงื่อนไข Elongation %' : 'Elongation Condition'}
                    </label>
                    <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, elong_mode: 'min' })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          (!editingSpec.elong_mode || editingSpec.elong_mode === 'min')
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? '≥ Min' : '≥ Min'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, elong_mode: 'max', elong_max: editingSpec.elong_max ?? editingSpec.elong })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          editingSpec.elong_mode === 'max'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? '≤ Max' : '≤ Max'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSpec({ ...editingSpec, elong_mode: 'both', elong_max: editingSpec.elong_max ?? (editingSpec.elong + 10) })}
                        className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                          editingSpec.elong_mode === 'both'
                            ? 'bg-amber-500 text-slate-950'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? 'Min ~ Max' : 'Min ~ Max'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(!editingSpec.elong_mode || editingSpec.elong_mode === 'min' || editingSpec.elong_mode === 'both') && (
                      <div>
                        <label className="text-[9px] text-amber-300 block mb-1">
                          {editingSpec.elong_mode === 'both' ? (isTh ? 'Min Elong (%)' : 'Min Elong (%)') : (isTh ? 'Min Elong (%) [≥]' : 'Min Elong (%) [≥]')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingSpec.elong}
                          onChange={(e) => setEditingSpec({ ...editingSpec, elong: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}

                    {(editingSpec.elong_mode === 'max' || editingSpec.elong_mode === 'both') && (
                      <div>
                        <label className="text-[9px] text-amber-300 block mb-1">
                          {editingSpec.elong_mode === 'both' ? (isTh ? 'Max Elong (%)' : 'Max Elong (%)') : (isTh ? 'Max Elong (%) [≤]' : 'Max Elong (%) [≤]')}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingSpec.elong_mode === 'max' ? (editingSpec.elong_max ?? editingSpec.elong) : (editingSpec.elong_max ?? editingSpec.elong)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            if (editingSpec.elong_mode === 'max') {
                              setEditingSpec({ ...editingSpec, elong_max: val, elong: val });
                            } else {
                              setEditingSpec({ ...editingSpec, elong_max: val });
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-right font-mono text-amber-300">
                    {isTh ? 'เกณฑ์ที่ตั้ง:' : 'Rule:'} {formatElongationSpec(editingSpec)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSpec(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HISTORY AUTHENTICATION MODAL */}
      {isHistoryAuthOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsHistoryAuthOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isTh ? 'ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล' : 'Password Verification Required'}
              </h3>
              <p className="text-xs text-slate-400">
                {isTh 
                  ? 'กรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไขรายการตรวจรับ IPQA-01' 
                  : 'Enter admin password to edit IPQA-01 record'}
              </p>
            </div>

            <form onSubmit={handleVerifyHistoryPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={historyAuthPassword}
                  onChange={(e) => setHistoryAuthPassword(e.target.value)}
                  placeholder={isTh ? "รหัสผ่านผู้ดูแลระบบ" : "Admin Password"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {historyAuthError && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again'}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsHistoryAuthOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isTh ? 'ปลดล็อกเพื่อแก้ไข' : 'Unlock & Edit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HISTORY RECORD MODAL */}
      {editingHistoryItem && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'แก้ไขข้อมูลการตรวจวัดแรงดึง (IPQA-01)' : 'Edit Tensile Measurement Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Coil: {editingHistoryItem.coil_no} | ID: {editingHistoryItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingHistoryItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coil No.</label>
                  <input
                    type="text"
                    value={editingHistoryItem.coil_no || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, coil_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Heat No.</label>
                  <input
                    type="text"
                    value={editingHistoryItem.heat_no || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, heat_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Work Order</label>
                  <input
                    type="text"
                    value={editingHistoryItem.work_order || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, work_order: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sample Name</label>
                  <input
                    type="text"
                    value={editingHistoryItem.sample_name || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, sample_name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Profile Spec</label>
                  <input
                    type="text"
                    value={editingHistoryItem.profile || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, profile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspector</label>
                  <input
                    type="text"
                    value={editingHistoryItem.inspector || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, inspector: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shift (กะ)</label>
                  <input
                    list="edit-tensile-shift-options"
                    type="text"
                    placeholder="e.g. Shift A, Shift B, Shift C..."
                    value={editingHistoryItem.shift || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, shift: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="edit-tensile-shift-options">
                    <option value="Shift A" />
                    <option value="Shift B" />
                    <option value="Shift C" />
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Decision</label>
                  <select
                    value={editingHistoryItem.decision}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, decision: e.target.value as 'PASS' | 'FAIL' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Dimensions & Tensile Values</h4>
                {(() => {
                  const editSpec = specs.find(s => s.profile.toUpperCase() === (editingHistoryItem.profile || '').toUpperCase() && (s.process.toUpperCase() === (editingHistoryItem.process || '').toUpperCase() || !editingHistoryItem.process)) || matchedSpec;
                  const isEditWNg = isFieldNg('width', editingHistoryItem.width, editSpec);
                  const isEditHLNg = isFieldNg('h_left', editingHistoryItem.h_left, editSpec);
                  const isEditHMNg = isFieldNg('h_middle', editingHistoryItem.h_middle, editSpec);
                  const isEditHRNg = isFieldNg('h_right', editingHistoryItem.h_right, editSpec);
                  const isEditTNg = isFieldNg('tensile', editingHistoryItem.tensile, editSpec);
                  const isEditYNg = isFieldNg('yield', editingHistoryItem.yield, editSpec);
                  const isEditENg = isFieldNg('elong', editingHistoryItem.elong, editSpec);

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[10px] font-bold uppercase block ${isEditWNg ? 'text-rose-400' : 'text-slate-500'}`}>Width (mm)</label>
                          {isEditWNg && <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/40">NG</span>}
                        </div>
                        <input
                          type="number" step="0.1"
                          value={editingHistoryItem.width || 0}
                          onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, width: parseFloat(e.target.value) || 0 })}
                          title={isEditWNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('width', editSpec)})` : undefined}
                          className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs transition-colors focus:outline-none ${
                            isEditWNg
                              ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[10px] font-bold uppercase block ${isEditHLNg ? 'text-rose-400' : 'text-slate-500'}`}>H Left (mm)</label>
                          {isEditHLNg && <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/40">NG</span>}
                        </div>
                        <input
                          type="number" step="0.1"
                          value={editingHistoryItem.h_left || 0}
                          onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, h_left: parseFloat(e.target.value) || 0 })}
                          title={isEditHLNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_left', editSpec)})` : undefined}
                          className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs transition-colors focus:outline-none ${
                            isEditHLNg
                              ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[10px] font-bold uppercase block ${isEditHMNg ? 'text-rose-400' : 'text-slate-500'}`}>H Middle (mm)</label>
                          {isEditHMNg && <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/40">NG</span>}
                        </div>
                        <input
                          type="number" step="0.1"
                          value={editingHistoryItem.h_middle !== undefined && editingHistoryItem.h_middle !== null ? editingHistoryItem.h_middle : 0}
                          onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, h_middle: parseFloat(e.target.value) || 0 })}
                          title={isEditHMNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_middle', editSpec)})` : undefined}
                          className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs transition-colors focus:outline-none ${
                            isEditHMNg
                              ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[10px] font-bold uppercase block ${isEditHRNg ? 'text-rose-400' : 'text-slate-500'}`}>H Right (mm)</label>
                          {isEditHRNg && <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/40">NG</span>}
                        </div>
                        <input
                          type="number" step="0.1"
                          value={editingHistoryItem.h_right || 0}
                          onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, h_right: parseFloat(e.target.value) || 0 })}
                          title={isEditHRNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('h_right', editSpec)})` : undefined}
                          className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs transition-colors focus:outline-none ${
                            isEditHRNg
                              ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 font-bold focus:border-rose-400'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[10px] font-bold uppercase block ${isEditTNg ? 'text-rose-400' : 'text-slate-500'}`}>Tensile (MPa)</label>
                          {isEditTNg && <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/40">NG</span>}
                        </div>
                        <input
                          type="number" step="1"
                          value={editingHistoryItem.tensile || 0}
                          onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, tensile: parseFloat(e.target.value) || 0 })}
                          title={isEditTNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('tensile', editSpec)})` : undefined}
                          className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold transition-colors focus:outline-none ${
                            isEditTNg
                              ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400'
                              : 'bg-slate-900 border border-slate-800 text-cyan-300 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[10px] font-bold uppercase block ${isEditYNg ? 'text-rose-400' : 'text-slate-500'}`}>Yield (MPa)</label>
                          {isEditYNg && <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/40">NG</span>}
                        </div>
                        <input
                          type="number" step="1"
                          value={editingHistoryItem.yield || 0}
                          onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, yield: parseFloat(e.target.value) || 0 })}
                          title={isEditYNg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('yield', editSpec)})` : undefined}
                          className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold transition-colors focus:outline-none ${
                            isEditYNg
                              ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400'
                              : 'bg-slate-900 border border-slate-800 text-emerald-300 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`text-[10px] font-bold uppercase block ${isEditENg ? 'text-rose-400' : 'text-slate-500'}`}>Elongation (%)</label>
                          {isEditENg && <span className="text-[8px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded border border-rose-500/40">NG</span>}
                        </div>
                        <input
                          type="number" step="0.1"
                          value={editingHistoryItem.elong || 0}
                          onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, elong: parseFloat(e.target.value) || 0 })}
                          title={isEditENg ? `NG: ค่าอยู่นอกสเปก (Spec: ${getFieldSpecText('elong', editSpec)})` : undefined}
                          className={`w-full rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold transition-colors focus:outline-none ${
                            isEditENg
                              ? 'bg-rose-950/40 border-2 border-rose-500 text-rose-300 focus:border-rose-400'
                              : 'bg-slate-900 border border-slate-800 text-amber-300 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingHistoryItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEditedHistory}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
