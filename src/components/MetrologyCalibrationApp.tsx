import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
  Minus,
  Ruler,
  Layers,
  Search, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Tag, 
  Settings, 
  Trash2, 
  Edit3, 
  History, 
  Lock, 
  ArrowLeft, 
  CheckSquare, 
  AlertTriangle, 
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building2,
  Filter,
  X,
  Moon,
  Sun
} from 'lucide-react';

import { 
  InstrumentRecord, 
  MeasurementRangeItem,
  InstrumentCalHistoryItem, 
  InstrumentRepairLog, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { useCloudState } from '../services/firestoreSync';
import { InspectorDatalist, saveRecordedInspector } from '../utils/inspectorStorage';

interface MetrologyCalibrationAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const INITIAL_INSTRUMENTS: InstrumentRecord[] = [
  {
    docId: 'inst-001',
    id: 'CAL-001',
    name: 'Vernier Caliper 0-150mm',
    brand: 'Mitutoyo',
    model: '500-196-30',
    serialNo: 'MT-884201',
    location: 'QC Lab Line 1',
    range: '0-150 mm',
    spec: 0.02,
    entryDate: '2025-01-10',
    startDate: '2025-01-15',
    lastCalDate: '2026-01-15',
    frequency: 12,
    calType: 'EXTERNAL',
    instrumentClass: 'A',
    lastResult: 'PASS',
    lastError: 0.008,
    isRepairing: false,
    history: [
      {
        type: 'CALIBRATION',
        date: '2026-01-15',
        sendDate: '2026-01-10',
        receiveDate: '2026-01-15',
        error: 0.008,
        result: 'PASS',
        lab: 'Siam Metrology Institute (NIMT)',
        certNo: 'CAL-2026-0102',
        uncertainty: 0.003,
        officer: 'Sompong P. (Calibration Tech)',
        note: 'Initial annual calibration passed spec.'
      }
    ]
  },
  {
    docId: 'inst-002',
    id: 'MIC-002',
    name: 'Outside Micrometer 0-25mm',
    brand: 'Mitutoyo',
    model: '103-137',
    serialNo: 'MT-773910',
    location: 'Cutting QC Room',
    range: '0-25 mm',
    spec: 0.004,
    entryDate: '2025-02-01',
    startDate: '2025-02-05',
    lastCalDate: '2025-08-10',
    frequency: 6,
    calType: 'EXTERNAL',
    instrumentClass: 'A',
    lastResult: 'PASS',
    lastError: 0.0015,
    isRepairing: false,
    history: [
      {
        type: 'CALIBRATION',
        date: '2025-08-10',
        sendDate: '2025-08-05',
        receiveDate: '2025-08-10',
        error: 0.0015,
        result: 'PASS',
        lab: 'Precision Calibration Co., Ltd.',
        certNo: 'CAL-2025-0881',
        uncertainty: 0.0008,
        officer: 'Prasert T.',
        note: '6-month periodic recalibration completed.'
      }
    ]
  },
  {
    docId: 'inst-003',
    id: 'CTG-003',
    name: 'Digital Coating Thickness Gauge',
    brand: 'Elcometer',
    model: '456 Top',
    serialNo: 'EL-90123',
    location: 'Coating Line 2',
    range: '0-1500 µm',
    spec: 1.0,
    entryDate: '2024-06-15',
    startDate: '2024-06-20',
    lastCalDate: '2025-07-20',
    frequency: 12,
    calType: 'INTERNAL',
    instrumentClass: 'B',
    lastResult: 'PASS',
    lastError: 0.45,
    isRepairing: false,
    history: []
  },
  {
    docId: 'inst-004',
    id: 'SCALE-004',
    name: 'Precision Electronic Scale 0.01g',
    brand: 'Mettler Toledo',
    model: 'ME204E',
    serialNo: 'MT-449102',
    location: 'Mixing Lab',
    range: '0-220 g',
    spec: 0.001,
    entryDate: '2024-09-01',
    startDate: '2024-09-05',
    lastCalDate: '2025-02-10',
    frequency: 6,
    calType: 'EXTERNAL',
    instrumentClass: 'B',
    lastResult: 'FAIL',
    lastError: 0.0028,
    isRepairing: true,
    currentRepair: {
      type: 'REPAIR_START',
      startDate: '2026-08-01',
      expectedEndDate: '2026-08-10',
      symptom: 'Zero point drift and load cell nonlinearity above 150g',
      detail: 'Sent to manufacturer service center for load cell realignment and sensor cleaning.',
      repairBy: 'Mettler Toledo Service Center Thailand',
      cost: 4500,
      date: '2026-08-01'
    },
    history: [
      {
        type: 'REPAIR_START',
        date: '2026-08-01',
        symptom: 'Zero point drift and load cell nonlinearity above 150g',
        repairBy: 'Mettler Toledo Service Center Thailand',
        cost: 4500
      }
    ]
  },
  {
    docId: 'inst-005',
    id: 'HG-005',
    name: 'Digital Height Gauge 0-600mm',
    brand: 'Mitutoyo',
    model: '192-630-10',
    serialNo: 'MT-332901',
    location: 'Final Inspection Station',
    range: '0-600 mm',
    spec: 0.04,
    entryDate: '2025-03-01',
    startDate: '2025-03-05',
    lastCalDate: '2025-03-05',
    frequency: 12,
    calType: 'INTERNAL',
    instrumentClass: 'C',
    lastResult: 'PASS',
    lastError: 0.015,
    isRepairing: false,
    history: []
  }
];

const ADMIN_PASS = 'admin2026';

export const MetrologyCalibrationApp: React.FC<MetrologyCalibrationAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  // State with Real-time Cloud Sync
  const [instruments, setInstruments] = useCloudState<InstrumentRecord[]>('metrology_instruments', INITIAL_INSTRUMENTS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DUE_SOON' | 'EXPIRED' | 'REPAIRING'>('ALL');
  const [classFilter, setClassFilter] = useState<'ALL' | 'A' | 'B' | 'C' | 'D'>('ALL');
  const [calTypeFilter, setCalTypeFilter] = useState<'ALL' | 'EXTERNAL' | 'INTERNAL'>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInst, setEditingInst] = useState<InstrumentRecord | null>(null);

  const [calModalItem, setCalModalItem] = useState<InstrumentRecord | null>(null);
  const [repairModalItem, setRepairModalItem] = useState<InstrumentRecord | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<InstrumentRecord | null>(null);

  // Edit Latest Calibration Modal State (Admin Protected)
  const [editCalModalItem, setEditCalModalItem] = useState<InstrumentRecord | null>(null);
  const [targetHistoryId, setTargetHistoryId] = useState<string | null>(null);
  const [editCalFormData, setEditCalFormData] = useState({
    sendDate: new Date().toISOString().split('T')[0],
    receiveDate: new Date().toISOString().split('T')[0],
    lab: 'Internal Metrology Lab',
    certNo: '',
    actualError: '',
    uncertainty: '',
    officer: '',
    note: ''
  });

  // Status message bar
  const [statusMsg, setStatusMsg] = useState<{ type: 'info' | 'success' | 'error'; message: string }>({
    type: 'info',
    message: isTh ? 'ระบบควบคุมเครื่องมือวัดพร้อมใช้งาน (Cloud Sync Enabled)' : 'Instrument Control System ready'
  });

  // Admin Security Modal
  const [securityModal, setSecurityModal] = useState<{ show: boolean; onConfirm: (() => void) | null; password: string }>({
    show: false,
    onConfirm: null,
    password: ''
  });

  // Delete Confirm Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; docId: string | null; instId: string | null }>({
    show: false,
    docId: null,
    instId: null
  });

  // Range Helper Functions
  const parseRangeStringToItems = (rangeStr: string): { ranges: { id: string; min: string; max: string; unit: string }[]; globalUnit: string } => {
    if (!rangeStr || !rangeStr.trim()) {
      return {
        ranges: [{ id: '1', min: '0', max: '150', unit: 'mm' }],
        globalUnit: 'mm'
      };
    }

    const parts = rangeStr.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) {
      return {
        ranges: [{ id: '1', min: '0', max: '150', unit: 'mm' }],
        globalUnit: 'mm'
      };
    }

    let detectedGlobalUnit = 'mm';
    const parsedRanges: { id: string; min: string; max: string; unit: string }[] = [];

    parts.forEach((part, idx) => {
      const match = part.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:[-~–]|to)\s*([+-]?\d+(?:\.\d+)?)\s*([a-zA-Zµ°Ω/·]+)?$/i);
      if (match) {
        let unit = match[3] ? match[3].trim() : 'mm';
        if (unit.toLowerCase() === 'um') unit = 'µm';
        if (idx === 0) detectedGlobalUnit = unit;
        parsedRanges.push({
          id: String(idx + 1),
          min: match[1],
          max: match[2],
          unit: unit
        });
      } else {
        const singleMatch = part.match(/^([+-]?\d+(?:\.\d+)?)\s*([a-zA-Zµ°Ω/·]+)?$/i);
        if (singleMatch) {
          let unit = singleMatch[2] ? singleMatch[2].trim() : 'mm';
          if (unit.toLowerCase() === 'um') unit = 'µm';
          if (idx === 0) detectedGlobalUnit = unit;
          parsedRanges.push({
            id: String(idx + 1),
            min: '0',
            max: singleMatch[1],
            unit: unit
          });
        } else {
          parsedRanges.push({
            id: String(idx + 1),
            min: '0',
            max: part,
            unit: 'mm'
          });
        }
      }
    });

    return {
      ranges: parsedRanges.length > 0 ? parsedRanges : [{ id: '1', min: '0', max: '150', unit: 'mm' }],
      globalUnit: detectedGlobalUnit
    };
  };

  const formatItemsToRangeString = (ranges: { min: string; max: string; unit: string }[]): string => {
    if (!ranges || ranges.length === 0) return '';
    return ranges
      .filter(r => (r.max && r.max.trim() !== '') || (r.min && r.min.trim() !== ''))
      .map(r => {
        const minVal = r.min.trim();
        const maxVal = r.max.trim();
        const u = r.unit ? r.unit.trim() : '';
        if (minVal && maxVal) {
          return `${minVal}-${maxVal} ${u}`.trim();
        } else if (maxVal) {
          return `0-${maxVal} ${u}`.trim();
        } else {
          return `${minVal} ${u}`.trim();
        }
      })
      .join(', ');
  };

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    brand: '',
    model: '',
    serialNo: '',
    location: '',
    range: '0-150 mm',
    ranges: [
      { id: '1', min: '0', max: '150', unit: 'mm' }
    ] as { id: string; min: string; max: string; unit: string }[],
    globalUnit: 'mm',
    isCustomUnit: false,
    customUnitText: '',
    spec: '0.02',
    entryDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    frequency: '12',
    calType: 'EXTERNAL' as 'EXTERNAL' | 'INTERNAL',
    instrumentClass: 'A' as 'A' | 'B' | 'C' | 'D'
  });

  // Cal Entry Form State
  const [calFormData, setCalFormData] = useState({
    sendDate: new Date().toISOString().split('T')[0],
    receiveDate: new Date().toISOString().split('T')[0],
    lab: 'Internal Metrology Lab',
    certNo: `CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    actualError: '',
    uncertainty: '',
    officer: 'Sompong P. (QA Metrology)',
    note: ''
  });

  // Repair Entry Form State
  const [repairFormData, setRepairFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    expectedEndDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    symptom: '',
    detail: '',
    repairBy: '',
    cost: ''
  });

  // Helper function to parse frequency text (e.g. "3 ปี", "36", "6 เดือน", "1 ปี") into months
  const parseFrequencyToMonths = (freq: number | string | undefined | null): number => {
    if (freq === undefined || freq === null) return 12;
    if (typeof freq === 'number') return freq > 0 ? freq : 12;
    const str = String(freq).trim();
    if (!str) return 12;

    // Direct numeric string e.g. "36", "12", "3"
    const directNum = parseFloat(str);
    if (!isNaN(directNum) && /^\d+(\.\d+)?$/.test(str)) {
      return directNum;
    }

    // Matches e.g. "3 ปี", "3ปี", "3 years", "3 yr", "3y"
    const yearMatch = str.match(/(\d+(\.\d+)?)\s*(ปี|year|years|yr|yrs|y)/i);
    if (yearMatch) {
      return Math.round(parseFloat(yearMatch[1]) * 12);
    }

    // Matches e.g. "6 เดือน", "6เดือน", "6 months", "6 mo", "6m"
    const monthMatch = str.match(/(\d+(\.\d+)?)\s*(เดือน|month|months|mo|m)/i);
    if (monthMatch) {
      return Math.round(parseFloat(monthMatch[1]));
    }

    // Matches e.g. "90 วัน", "90 days"
    const dayMatch = str.match(/(\d+(\.\d+)?)\s*(วัน|day|days|d)/i);
    if (dayMatch) {
      return Math.max(1, Math.round(parseFloat(dayMatch[1]) / 30));
    }

    if (!isNaN(directNum) && directNum > 0) {
      return directNum;
    }

    return 12;
  };

  // Helper function to format frequency display label
  const formatFrequencyDisplay = (freq: number | string | undefined | null): string => {
    if (freq === undefined || freq === null) return '-';
    if (typeof freq === 'number') {
      if (freq === 12) return '1 ปี (12M)';
      if (freq === 24) return '2 ปี (24M)';
      if (freq === 36) return '3 ปี (36M)';
      return `${freq} เดือน`;
    }
    const str = String(freq).trim();
    if (str === '36' || str === '3 ปี' || str === '3ปี') return '3 ปี (36M)';
    if (str === '12' || str === '1 ปี' || str === '1ปี') return '1 ปี (12M)';
    if (str === '24' || str === '2 ปี' || str === '2ปี') return '2 ปี (24M)';
    return str;
  };

  // Helper function to calculate Next Cal Date
  const calculateNextCal = (lastCalDate?: string, freq: number | string = 12): string | null => {
    if (!lastCalDate) return null;
    const months = parseFrequencyToMonths(freq);
    const date = new Date(lastCalDate);
    if (isNaN(date.getTime())) return null;
    date.setMonth(date.getMonth() + Number(months));
    return date.toISOString().split('T')[0];
  };

  // Helper function to derive Status Badge Info
  const getStatusInfo = (inst: InstrumentRecord) => {
    if (inst.isRepairing) {
      return { label: 'Repairing', labelTh: 'กำลังส่งซ่อม', class: 'bg-amber-950/80 text-amber-300 border-amber-800', warning: true };
    }
    
    const nextCalDate = calculateNextCal(inst.lastCalDate, inst.frequency);
    if (!nextCalDate) {
      return { label: 'Pending', labelTh: 'รอการสอบเทียบ', class: 'bg-slate-800 text-slate-300 border-slate-700', warning: false };
    }

    const today = new Date();
    const target = new Date(nextCalDate);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: 'Expired', labelTh: 'หมดอายุการสอบเทียบ', class: 'bg-rose-950/90 text-rose-300 border-rose-800 font-bold animate-pulse', warning: true };
    }
    if (diffDays <= 30) {
      return { label: 'Due Soon', labelTh: 'ใกล้ครบกำหนด', class: 'bg-amber-950/80 text-amber-300 border-amber-800 font-bold', warning: true };
    }
    return { label: 'Active', labelTh: 'ปกติ / พร้อมใช้', class: 'bg-emerald-950/80 text-emerald-300 border-emerald-800', warning: false };
  };

  // Security Check
  const requestSecurityCheck = (action: () => void) => {
    setSecurityModal({ show: true, onConfirm: action, password: '' });
  };

  const verifySecurity = () => {
    if (securityModal.password === ADMIN_PASS) {
      const actionToExecute = securityModal.onConfirm;
      setSecurityModal({ show: false, onConfirm: null, password: '' });
      if (actionToExecute) actionToExecute();
    } else {
      setStatusMsg({
        type: 'error',
        message: isTh ? 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง' : 'Incorrect Admin Password'
      });
      setSecurityModal(prev => ({ ...prev, password: '' }));
    }
  };

  // Filtered Instruments List
  const filteredInstruments = useMemo(() => {
    return instruments.filter(inst => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        inst.id.toLowerCase().includes(q) ||
        inst.name.toLowerCase().includes(q) ||
        (inst.serialNo && inst.serialNo.toLowerCase().includes(q)) ||
        (inst.brand && inst.brand.toLowerCase().includes(q)) ||
        (inst.location && inst.location.toLowerCase().includes(q)) ||
        (inst.instrumentClass && `class ${inst.instrumentClass}`.toLowerCase().includes(q)) ||
        (inst.calType && inst.calType.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        const statusInfo = getStatusInfo(inst);
        if (statusFilter === 'ACTIVE' && statusInfo.label !== 'Active') return false;
        if (statusFilter === 'DUE_SOON' && statusInfo.label !== 'Due Soon') return false;
        if (statusFilter === 'EXPIRED' && statusInfo.label !== 'Expired') return false;
        if (statusFilter === 'REPAIRING' && statusInfo.label !== 'Repairing') return false;
      }

      // Class filter (A, B, C, D)
      if (classFilter !== 'ALL' && (inst.instrumentClass || 'A') !== classFilter) return false;

      // Cal Type filter (EXTERNAL, INTERNAL)
      if (calTypeFilter !== 'ALL' && (inst.calType || 'EXTERNAL') !== calTypeFilter) return false;

      return true;
    });
  }, [instruments, searchQuery, statusFilter, classFilter, calTypeFilter]);

  // Dashboard Metrics
  const stats = useMemo(() => {
    let total = instruments.length;
    let warning = 0;
    let expired = 0;
    let active = 0;

    instruments.forEach(inst => {
      const st = getStatusInfo(inst);
      if (st.label === 'Repairing' || st.label === 'Due Soon') warning++;
      if (st.label === 'Expired') expired++;
      if (st.label === 'Active') active++;
    });

    const activeRate = total > 0 ? ((active / total) * 100).toFixed(1) : '0.0';

    return { total, warning, expired, active, activeRate };
  }, [instruments]);

  // Handle Save New or Edit Instrument
  const handleSaveInstrument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id.trim() || !formData.name.trim()) return;

    const cleanFrequency: number | string = (() => {
      const trimmed = (formData.frequency || '').trim();
      if (!trimmed) return '1 ปี';
      if (/^\d+$/.test(trimmed)) {
        return parseInt(trimmed, 10);
      }
      return trimmed;
    })();

    const finalRanges = formData.ranges.filter(r => (r.max && r.max.trim() !== '') || (r.min && r.min.trim() !== ''));
    const combinedRange = finalRanges.length > 0 
      ? formatItemsToRangeString(finalRanges) 
      : formData.range.trim();
    const cleanUnit = formData.isCustomUnit 
      ? (formData.customUnitText.trim() || 'mm') 
      : (formData.globalUnit || 'mm');

    if (editingInst) {
      // Edit mode
      setInstruments(prev => prev.map(item => {
        if (item.docId === editingInst.docId) {
          return {
            ...item,
            id: formData.id.trim().toUpperCase(),
            name: formData.name.trim(),
            brand: formData.brand.trim(),
            model: formData.model.trim(),
            serialNo: formData.serialNo.trim(),
            location: formData.location.trim(),
            range: combinedRange,
            ranges: finalRanges,
            unit: cleanUnit,
            spec: parseFloat(formData.spec) || 0.02,
            entryDate: formData.entryDate,
            startDate: formData.startDate,
            frequency: cleanFrequency,
            calType: formData.calType,
            instrumentClass: formData.instrumentClass
          };
        }
        return item;
      }));

      setStatusMsg({
        type: 'success',
        message: isTh ? `แก้ไขข้อมูลเครื่องมือ ${formData.id} สำเร็จ` : `Updated instrument ${formData.id}`
      });
    } else {
      // Add mode
      const newInst: InstrumentRecord = {
        docId: `inst-${Date.now()}`,
        id: formData.id.trim().toUpperCase(),
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        model: formData.model.trim(),
        serialNo: formData.serialNo.trim(),
        location: formData.location.trim(),
        range: combinedRange,
        ranges: finalRanges,
        unit: cleanUnit,
        spec: parseFloat(formData.spec) || 0.02,
        entryDate: formData.entryDate,
        startDate: formData.startDate,
        lastCalDate: formData.startDate,
        frequency: cleanFrequency,
        calType: formData.calType,
        instrumentClass: formData.instrumentClass,
        lastResult: 'NEW',
        lastError: 0,
        isRepairing: false,
        history: []
      };

      setInstruments(prev => [newInst, ...prev]);

      if (onLogNewActivity) {
        if (calFormData.officer) saveRecordedInspector(calFormData.officer);
        onLogNewActivity({
          id: newInst.docId!,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'EQP-01',
          moduleTitleTh: 'ระบบควบคุมเครื่องมือวัด (Metrology & Calibration)',
          moduleTitleEn: 'Equipment Calibration & Gauge Tracking',
          inspector: 'Metrology Custodian',
          batchLot: `New Instrument: ${newInst.id} - ${newInst.name}`,
          result: 'PASS',
          defectCount: 0,
          remarks: `Added to Master List. Spec: ±${newInst.spec}, Cal Type: ${newInst.calType}, Class: ${newInst.instrumentClass}`
        });
      }

      setStatusMsg({
        type: 'success',
        message: isTh ? `เพิ่มเครื่องมือวัด ${newInst.id} (Class ${newInst.instrumentClass || 'A'} - ${newInst.calType}) สำเร็จ` : `Added instrument ${newInst.id}`
      });
    }

    setShowAddModal(false);
    setEditingInst(null);
  };

  // Delete Instrument
  const handleDeleteInstrument = (docId: string) => {
    const inst = instruments.find(i => i.docId === docId);
    setInstruments(prev => prev.filter(i => i.docId !== docId));
    setStatusMsg({
      type: 'success',
      message: isTh ? `ลบเครื่องมือวัด ${inst?.id || ''} เรียบร้อยแล้ว` : `Deleted instrument ${inst?.id || ''}`
    });
  };

  // Submit Calibration
  const handleSaveCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!calModalItem) return;

    const errorVal = parseFloat(calFormData.actualError);
    if (isNaN(errorVal)) return;

    const isPassed = Math.abs(errorVal) <= calModalItem.spec;
    const resultLabel: 'PASS' | 'FAIL' = isPassed ? 'PASS' : 'FAIL';

    const newHistoryItem: InstrumentCalHistoryItem = {
      id: `cal-hist-${Date.now()}`,
      type: 'CALIBRATION',
      date: calFormData.receiveDate,
      sendDate: calFormData.sendDate,
      receiveDate: calFormData.receiveDate,
      error: errorVal,
      result: resultLabel,
      lab: calFormData.lab,
      certNo: calFormData.certNo,
      uncertainty: parseFloat(calFormData.uncertainty) || 0,
      officer: calFormData.officer,
      note: calFormData.note
    };

    setInstruments(prev => prev.map(item => {
      if (item.docId === calModalItem.docId) {
        return {
          ...item,
          lastCalDate: calFormData.receiveDate,
          lastResult: resultLabel,
          lastError: errorVal,
          isRepairing: false,
          currentRepair: null,
          history: [newHistoryItem, ...(item.history || [])]
        };
      }
      return item;
    }));

    if (onLogNewActivity) {
      if (calFormData.officer) saveRecordedInspector(calFormData.officer);
        onLogNewActivity({
        id: calModalItem.docId!,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleCode: 'EQP-01',
        moduleTitleTh: 'ระบบควบคุมเครื่องมือวัด (Metrology & Calibration)',
        moduleTitleEn: 'Equipment Calibration & Gauge Tracking',
        inspector: calFormData.officer || 'Calibration Inspector',
        batchLot: `${calModalItem.id} (${calModalItem.name})`,
        result: isPassed ? 'PASS' : 'REJECT',
        defectCount: isPassed ? 0 : 1,
        remarks: `Error: ${errorVal} (Spec: ±${calModalItem.spec}), Cert: ${calFormData.certNo}`
      });
    }

    setCalModalItem(null);
    setStatusMsg({
      type: isPassed ? 'success' : 'error',
      message: isPassed
        ? isTh ? `บันทึกสอบเทียบ ${calModalItem.id} ผ่านเกณฑ์ (Error: ${errorVal})` : `Calibration PASSED for ${calModalItem.id}`
        : isTh ? `บันทึกสอบเทียบ ${calModalItem.id} ไม่ผ่านเกณฑ์! (Error: ${errorVal} > Spec: ±${calModalItem.spec})` : `Calibration FAILED for ${calModalItem.id}`
    });
  };

  // Open Edit Latest Calibration Modal (Protected with Admin password)
  const openEditLatestCalibration = (inst: InstrumentRecord, specificHistoryItem?: InstrumentCalHistoryItem) => {
    // Find latest calibration item in history if not specified
    const latestCal = specificHistoryItem || (inst.history ? inst.history.find(h => h.type === 'CALIBRATION') : undefined);

    setEditCalModalItem(inst);
    setTargetHistoryId(latestCal?.id || null);
    setEditCalFormData({
      sendDate: latestCal?.sendDate || latestCal?.date || inst.lastCalDate || new Date().toISOString().split('T')[0],
      receiveDate: latestCal?.receiveDate || latestCal?.date || inst.lastCalDate || new Date().toISOString().split('T')[0],
      lab: latestCal?.lab || 'Internal Metrology Lab',
      certNo: latestCal?.certNo || `CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      actualError: latestCal?.error !== undefined ? String(latestCal.error) : (inst.lastError !== undefined ? String(inst.lastError) : ''),
      uncertainty: latestCal?.uncertainty !== undefined ? String(latestCal.uncertainty) : '',
      officer: latestCal?.officer || 'Sompong P. (QA Metrology)',
      note: latestCal?.note || ''
    });
  };

  const handleRequestEditLatestCal = (inst: InstrumentRecord, specificHistoryItem?: InstrumentCalHistoryItem) => {
    requestSecurityCheck(() => {
      openEditLatestCalibration(inst, specificHistoryItem);
    });
  };

  // Update Calibration Result (Admin verified)
  const handleUpdateLatestCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCalModalItem) return;

    const errorVal = parseFloat(editCalFormData.actualError);
    if (isNaN(errorVal)) return;

    const isPassed = Math.abs(errorVal) <= editCalModalItem.spec;
    const resultLabel: 'PASS' | 'FAIL' = isPassed ? 'PASS' : 'FAIL';

    setInstruments(prev => prev.map(item => {
      if (item.docId === editCalModalItem.docId) {
        let updatedHistory = [...(item.history || [])];

        let found = false;
        if (targetHistoryId) {
          updatedHistory = updatedHistory.map(h => {
            if (h.id === targetHistoryId) {
              found = true;
              return {
                ...h,
                date: editCalFormData.receiveDate,
                sendDate: editCalFormData.sendDate,
                receiveDate: editCalFormData.receiveDate,
                error: errorVal,
                result: resultLabel,
                lab: editCalFormData.lab,
                certNo: editCalFormData.certNo,
                uncertainty: parseFloat(editCalFormData.uncertainty) || 0,
                officer: editCalFormData.officer,
                note: editCalFormData.note
              };
            }
            return h;
          });
        }

        if (!found) {
          const calIndex = updatedHistory.findIndex(h => h.type === 'CALIBRATION');
          if (calIndex >= 0) {
            updatedHistory[calIndex] = {
              ...updatedHistory[calIndex],
              date: editCalFormData.receiveDate,
              sendDate: editCalFormData.sendDate,
              receiveDate: editCalFormData.receiveDate,
              error: errorVal,
              result: resultLabel,
              lab: editCalFormData.lab,
              certNo: editCalFormData.certNo,
              uncertainty: parseFloat(editCalFormData.uncertainty) || 0,
              officer: editCalFormData.officer,
              note: editCalFormData.note
            };
          } else {
            updatedHistory.unshift({
              id: `cal-hist-${Date.now()}`,
              type: 'CALIBRATION',
              date: editCalFormData.receiveDate,
              sendDate: editCalFormData.sendDate,
              receiveDate: editCalFormData.receiveDate,
              error: errorVal,
              result: resultLabel,
              lab: editCalFormData.lab,
              certNo: editCalFormData.certNo,
              uncertainty: parseFloat(editCalFormData.uncertainty) || 0,
              officer: editCalFormData.officer,
              note: editCalFormData.note
            });
          }
        }

        return {
          ...item,
          lastCalDate: editCalFormData.receiveDate,
          lastResult: resultLabel,
          lastError: errorVal,
          history: updatedHistory
        };
      }
      return item;
    }));

    if (onLogNewActivity) {
      if (editCalFormData.officer) saveRecordedInspector(editCalFormData.officer);
      onLogNewActivity({
        id: editCalModalItem.docId!,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleCode: 'EQP-01',
        moduleTitleTh: 'ระบบควบคุมเครื่องมือวัด (Metrology & Calibration)',
        moduleTitleEn: 'Equipment Calibration & Gauge Tracking',
        inspector: editCalFormData.officer || 'Calibration Inspector (Admin Edit)',
        batchLot: `${editCalModalItem.id} (${editCalModalItem.name})`,
        result: isPassed ? 'PASS' : 'REJECT',
        defectCount: isPassed ? 0 : 1,
        remarks: `[แก้ไขผลสอบเทียบ] Error: ${errorVal} (Spec: ±${editCalModalItem.spec}), Cert: ${editCalFormData.certNo}`
      });
    }

    setEditCalModalItem(null);
    setTargetHistoryId(null);
    setStatusMsg({
      type: 'success',
      message: isTh 
        ? `✓ แก้ไขบันทึกสอบเทียบล่าสุดของ ${editCalModalItem.id} เรียบร้อยแล้ว (Error: ${errorVal}, ผล: ${resultLabel})`
        : `✓ Updated latest calibration for ${editCalModalItem.id} successfully`
    });
  };

  // Submit Repair Start
  const handleSaveRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairModalItem) return;

    const repairLog: InstrumentRepairLog = {
      type: 'REPAIR_START',
      startDate: repairFormData.startDate,
      expectedEndDate: repairFormData.expectedEndDate,
      symptom: repairFormData.symptom,
      detail: repairFormData.detail,
      repairBy: repairFormData.repairBy,
      cost: parseFloat(repairFormData.cost) || 0,
      date: repairFormData.startDate
    };

    const historyItem: InstrumentCalHistoryItem = {
      id: `rep-hist-${Date.now()}`,
      type: 'REPAIR_START',
      date: repairFormData.startDate,
      symptom: repairFormData.symptom,
      detail: repairFormData.detail,
      repairBy: repairFormData.repairBy,
      cost: parseFloat(repairFormData.cost) || 0
    };

    setInstruments(prev => prev.map(item => {
      if (item.docId === repairModalItem.docId) {
        return {
          ...item,
          isRepairing: true,
          currentRepair: repairLog,
          history: [historyItem, ...(item.history || [])]
        };
      }
      return item;
    }));

    setRepairModalItem(null);
    setStatusMsg({
      type: 'info',
      message: isTh ? `บันทึกการส่งซ่อม ${repairModalItem.id} และเปลี่ยนสถานะเป็น Repairing` : `Recorded repair start for ${repairModalItem.id}`
    });
  };

  // Complete Repair Action
  const handleCompleteRepair = (docId: string) => {
    const inst = instruments.find(i => i.docId === docId);
    if (!inst) return;

    const historyItem: InstrumentCalHistoryItem = {
      id: `rep-end-${Date.now()}`,
      type: 'REPAIR_END',
      date: new Date().toISOString().split('T')[0],
      note: isTh ? 'ซ่อมบำรุงเรียบร้อย พร้อมส่งสอบเทียบก่อนนำกลับมาใช้งาน' : 'Maintenance completed. Ready for recalibration.'
    };

    setInstruments(prev => prev.map(item => {
      if (item.docId === docId) {
        return {
          ...item,
          isRepairing: false,
          currentRepair: null,
          history: [historyItem, ...(item.history || [])]
        };
      }
      return item;
    }));

    setStatusMsg({
      type: 'success',
      message: isTh ? `เครื่องมือ ${inst.id} ซ่อมเสร็จแล้ว กรุณาทำการสอบเทียบใหม่เพื่อเปิดใช้งาน` : `Repair completed for ${inst.id}`
    });
  };

  // Export Excel / CSV
  const exportToExcel = () => {
    if (instruments.length === 0) return;

    const headers = [
      "Tool ID", "Class", "Cal Type", "Instrument Name", "Brand", "Model", "Serial No.",
      "Location", "Range", "Spec (±)", "Entry Date", "Start Date",
      "Frequency (Months)", "Last Cal Date", "Next Cal Date", "Last Result", "Last Error",
      "Is Repairing", "Repair Symptom", "Status"
    ];

    const rows = instruments.map(inst => {
      const nextCal = calculateNextCal(inst.lastCalDate, inst.frequency);
      const st = getStatusInfo(inst);
      return [
        inst.id,
        `Class ${inst.instrumentClass || 'A'}`,
        inst.calType === 'INTERNAL' ? 'Internal (สอบเทียบภายใน)' : 'External (สอบเทียบภายนอก)',
        inst.name,
        inst.brand || "-",
        inst.model || "-",
        inst.serialNo || "-",
        inst.location || "-",
        inst.range || "-",
        inst.spec,
        inst.entryDate || "-",
        inst.startDate || "-",
        inst.frequency,
        inst.lastCalDate || "-",
        nextCal || "-",
        inst.lastResult || "-",
        inst.lastError !== undefined ? inst.lastError : "-",
        inst.isRepairing ? "YES" : "NO",
        inst.isRepairing ? (inst.currentRepair?.symptom || "-") : "-",
        st.label
      ];
    });

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Instrument_Master_List_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setStatusMsg({
      type: 'success',
      message: isTh ? 'ส่งออกข้อมูล Master List เข้าสู่ไฟล์ CSV เรียบร้อยแล้ว' : 'Exported Master List to CSV'
    });
  };

  // Print Tag Window
  const handlePrintTag = (inst: InstrumentRecord) => {
    const nextCal = calculateNextCal(inst.lastCalDate, inst.frequency) || '-';
    const statusInfo = getStatusInfo(inst);
    const classLabel = `Class ${inst.instrumentClass || 'A'}`;
    const calTypeLabel = inst.calType === 'INTERNAL' ? 'Internal (สอบเทียบภายใน)' : 'External (สอบเทียบภายนอก)';

    const qrData = `APP:EQP-01\nID:${inst.id}\nCLASS:${classLabel}\nTYPE:${inst.calType || 'EXTERNAL'}\nNAME:${inst.name}\nSERIAL:${inst.serialNo || '-'}\nSPEC:±${inst.spec}\nNEXT_CAL:${nextCal}\nSTATUS:${statusInfo.label}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;

    const printWindow = window.open('', '_blank', 'width=520,height=420');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Calibration Identification Tag - ${inst.id}</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background: #090d16; color: #f8fafc; }
            .tag-card {
              border: 3px solid #334155;
              border-radius: 16px;
              padding: 20px;
              width: 340px;
              margin: auto;
              position: relative;
              background: #0f172a;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
            }
            .tag-header {
              text-align: center;
              border-bottom: 2px solid #334155;
              padding-bottom: 10px;
              margin-bottom: 14px;
            }
            .tag-title { font-weight: 900; font-size: 15px; text-transform: uppercase; color: #60a5fa; letter-spacing: 0.05em; }
            .tag-subtitle { font-size: 10px; font-weight: 700; color: #94a3b8; }
            .tag-body { display: flex; align-items: center; gap: 14px; }
            .qr-area { width: 105px; height: 105px; flex-shrink: 0; background: #ffffff; padding: 4px; border-radius: 8px; }
            .qr-area img { width: 100%; height: 100%; border-radius: 4px; }
            .info-area { flex: 1; font-size: 11px; line-height: 1.6; font-weight: 600; color: #e2e8f0; }
            .info-label { color: #64748b; font-size: 9px; text-transform: uppercase; font-weight: 800; display: block; }
            .badge-pill { display: inline-block; padding: 1px 6px; border-radius: 4px; font-size: 9px; font-weight: 800; margin-right: 4px; }
            .class-badge { background: #312e81; color: #a5b4fc; border: 1px solid #4338ca; }
            .type-badge { background: #042f2e; color: #5eead4; border: 1px solid #0f766e; }
            .status-stamp {
              position: absolute;
              top: 14px;
              right: 14px;
              border: 3px solid ${statusInfo.label === 'Active' ? '#10b981' : statusInfo.label === 'Due Soon' ? '#f59e0b' : '#f43f5e'};
              color: ${statusInfo.label === 'Active' ? '#10b981' : statusInfo.label === 'Due Soon' ? '#f59e0b' : '#f43f5e'};
              padding: 2px 8px;
              font-size: 11px;
              font-weight: 900;
              transform: rotate(8deg);
              text-transform: uppercase;
              border-radius: 6px;
              background: #0f172a;
            }
            .next-cal-box {
              margin-top: 12px;
              background: #1e293b;
              border: 1px solid #334155;
              border-radius: 8px;
              padding: 8px;
              text-align: center;
            }
            .next-cal-date { font-size: 14px; font-weight: 900; color: #38bdf8; font-family: monospace; }
            .footer { margin-top: 10px; border-top: 1px dashed #334155; padding-top: 6px; font-size: 8px; text-align: center; color: #64748b; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="tag-card">
            <div class="status-stamp">${statusInfo.label}</div>
            <div class="tag-header">
              <div class="tag-title">CALIBRATION STATUS TAG</div>
              <div class="tag-subtitle">EQP-01 METROLOGY & GAUGE CONTROL</div>
            </div>
            <div class="tag-body">
              <div class="qr-area">
                <img src="${qrUrl}" alt="QR Code" />
              </div>
              <div class="info-area">
                <div><span class="info-label">TOOL ID:</span> <b>${inst.id}</b></div>
                <div style="margin: 3px 0;">
                  <span class="badge-pill class-badge">${classLabel}</span>
                  <span class="badge-pill type-badge">${inst.calType === 'INTERNAL' ? 'INTERNAL' : 'EXTERNAL'}</span>
                </div>
                <div><span class="info-label">NAME:</span> ${inst.name}</div>
                <div><span class="info-label">SERIAL:</span> ${inst.serialNo || '-'}</div>
                <div><span class="info-label">SPEC LIMIT:</span> ±${inst.spec}</div>
                <div><span class="info-label">CAL TYPE:</span> ${calTypeLabel}</div>
                <div><span class="info-label">LOCATION:</span> ${inst.location || '-'}</div>
              </div>
            </div>
            <div class="next-cal-box">
              <span class="info-label">NEXT CALIBRATION DUE:</span>
              <div class="next-cal-date">${nextCal}</div>
            </div>
            <div class="footer">Verified by EQP-01 Metrology System | ${new Date().toLocaleDateString('th-TH')}</div>
          </div>
        </body>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Universal QA Inspector Datalist */}
      <InspectorDatalist id="qa-inspector-list" />

      {/* Admin Verification Modal */}
      {securityModal.show && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Verification</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อดำเนินการสิทธิ์ผู้ดูแลระบบ (ค่าเริ่มต้น: admin2026)' : 'Enter admin password for protected operation (Default: admin2026)'}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); verifySecurity(); }} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={securityModal.password}
                  onChange={(e) => setSecurityModal(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSecurityModal({ show: false, onConfirm: null, password: '' })}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  {isTh ? 'ยืนยันรหัสผ่าน' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-800 space-y-4">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-white">{isTh ? 'ยืนยันการลบเครื่องมือ?' : 'Confirm Tool Deletion'}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {isTh ? `ลบเครื่องมือ ${deleteConfirm.instId} ออกจาก Master List ใช่หรือไม่?` : `Delete instrument ${deleteConfirm.instId} permanently?`}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirm({ show: false, docId: null, instId: null })}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.docId) handleDeleteInstrument(deleteConfirm.docId);
                  setDeleteConfirm({ show: false, docId: null, instId: null });
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition"
              >
                {isTh ? 'ยืนยันลบ' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  EQP-01
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'ระบบควบคุมเครื่องมือวัด (Instrument Control)' : 'Metrology & Calibration System'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh 
                  ? 'จัดการ Master List, แผนการสอบเทียบ (Cal Plan), ตรวจสอบผล Error/Uncertainty และระบบส่งซ่อม' 
                  : 'Manage instrument master list, calibration schedule, error/uncertainty logs & repair tracking'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
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

          <button
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl transition shadow-md shadow-emerald-600/20 flex items-center gap-2 text-xs font-bold"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={() => {
              setEditingInst(null);
              setFormData({
                id: `CAL-${Math.floor(100 + Math.random() * 900)}`,
                name: '',
                brand: '',
                model: '',
                serialNo: '',
                location: '',
                range: '0-150 mm',
                ranges: [{ id: '1', min: '0', max: '150', unit: 'mm' }],
                globalUnit: 'mm',
                isCustomUnit: false,
                customUnitText: '',
                spec: '0.02',
                entryDate: new Date().toISOString().split('T')[0],
                startDate: new Date().toISOString().split('T')[0],
                frequency: '12',
                calType: 'EXTERNAL',
                instrumentClass: 'A'
              });
              setShowAddModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-2 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            <span>{isTh ? 'เพิ่มเครื่องมือใหม่' : 'Add Instrument'}</span>
          </button>
        </div>
      </header>

      {/* Status Bar Message */}
      <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-bold border transition ${
        statusMsg.type === 'error' ? 'bg-rose-950/80 border-rose-800 text-rose-300' :
        statusMsg.type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300' :
        'bg-slate-900 border-slate-800 text-indigo-300'
      }`}>
        {statusMsg.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
        <span>{statusMsg.message}</span>
      </div>

      {/* Dashboard Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isTh ? 'เครื่องมือทั้งหมด' : 'Total Gauges'}</span>
            <Wrench className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-3xl font-black text-white font-mono">{stats.total}</p>
          <p className="text-[10px] text-slate-500">{isTh ? 'ลงทะเบียนใน Master List' : 'Registered Master Tools'}</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-amber-900/60 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isTh ? 'สถานะซ่อม / ใกล้กำหนด' : 'Repair / Due Soon'}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-amber-300 font-mono">{stats.warning}</p>
          <p className="text-[10px] text-amber-400/80">{isTh ? 'ต้องเตรียมสอบเทียบ / กำลังส่งซ่อม' : 'Needs attention or repair'}</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-rose-900/60 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isTh ? 'หมดอายุ / ต้องสอบเทียบด่วน' : 'Expired / Out of Cal'}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-3xl font-black text-rose-300 font-mono">{stats.expired}</p>
          <p className="text-[10px] text-rose-400/80">{isTh ? 'เกินกำหนดวันสอบเทียบแล้ว' : 'Calibration overdue'}</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-emerald-900/60 shadow-sm space-y-1">
          <div className="flex justify-between items-center text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">{isTh ? 'ความพร้อมใช้งาน (Cal Rate)' : 'Calibration Rate'}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-emerald-300 font-mono">{stats.activeRate}%</p>
          <p className="text-[10px] text-emerald-400/80">{isTh ? `พร้อมใช้งาน ${stats.active} / ${stats.total} เครื่อง` : `${stats.active} ready tools`}</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isTh ? 'ค้นหารหัส, ชื่อเครื่องมือ, Serial, Location...' : 'Search ID, Name, Serial, Location...'}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 hidden sm:block" />
            {(['ALL', 'ACTIVE', 'DUE_SOON', 'EXPIRED', 'REPAIRING'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {st === 'ALL' && (isTh ? 'ทั้งหมด' : 'All')}
                {st === 'ACTIVE' && (isTh ? 'ปกติ (Active)' : 'Active')}
                {st === 'DUE_SOON' && (isTh ? 'ใกล้กำหนด (Due Soon)' : 'Due Soon')}
                {st === 'EXPIRED' && (isTh ? 'หมดอายุ (Expired)' : 'Expired')}
                {st === 'REPAIRING' && (isTh ? 'ส่งซ่อม (Repairing)' : 'Repairing')}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Row: Class & Cal Type */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Class Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              {isTh ? 'ระดับความสำคัญ (Class):' : 'Class:'}
            </span>
            {(['ALL', 'A', 'B', 'C', 'D'] as const).map(cls => {
              const active = classFilter === cls;
              const colorCls = 
                cls === 'A' ? (active ? 'bg-rose-600 text-white border-rose-500' : 'text-rose-400 border-rose-900/60 bg-rose-950/30 hover:bg-rose-950/60') :
                cls === 'B' ? (active ? 'bg-amber-600 text-white border-amber-500' : 'text-amber-400 border-amber-900/60 bg-amber-950/30 hover:bg-amber-950/60') :
                cls === 'C' ? (active ? 'bg-indigo-600 text-white border-indigo-500' : 'text-indigo-400 border-indigo-900/60 bg-indigo-950/30 hover:bg-indigo-950/60') :
                cls === 'D' ? (active ? 'bg-teal-600 text-white border-teal-500' : 'text-teal-400 border-teal-900/60 bg-teal-950/30 hover:bg-teal-950/60') :
                active ? 'bg-slate-700 text-white border-slate-600' : 'text-slate-400 border-slate-800 bg-slate-950 hover:text-slate-200';

              return (
                <button
                  key={cls}
                  onClick={() => setClassFilter(cls)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${colorCls}`}
                >
                  {cls === 'ALL' ? (isTh ? 'ทุก Class' : 'All Classes') : `Class ${cls}`}
                </button>
              );
            })}
          </div>

          {/* Cal Type Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
              {isTh ? 'การสอบเทียบ:' : 'Cal Type:'}
            </span>
            {(['ALL', 'EXTERNAL', 'INTERNAL'] as const).map(type => {
              const active = calTypeFilter === type;
              return (
                <button
                  key={type}
                  onClick={() => setCalTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    active
                      ? type === 'EXTERNAL' ? 'bg-purple-600 text-white border-purple-500' : type === 'INTERNAL' ? 'bg-cyan-600 text-white border-cyan-500' : 'bg-slate-700 text-white border-slate-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {type === 'ALL' && (isTh ? 'ทั้งหมด (All)' : 'All')}
                  {type === 'EXTERNAL' && (isTh ? 'ภายนอก (External)' : 'External')}
                  {type === 'INTERNAL' && (isTh ? 'ภายใน (Internal)' : 'Internal')}
                </button>
              );
            })}

            {(classFilter !== 'ALL' || calTypeFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setClassFilter('ALL');
                  setCalTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-rose-400 underline ml-2 transition"
              >
                {isTh ? 'ล้างตัวกรอง' : 'Clear Filters'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Master List & Calibration Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-md overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <h2 className="font-bold text-xs text-white uppercase tracking-wider">
              {isTh ? `รายการเครื่องมือวัด (Master List & Cal Plan) [${filteredInstruments.length}]` : `Instrument Master List & Cal Plan [${filteredInstruments.length}]`}
            </h2>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold flex items-center gap-1 bg-emerald-950/60 border border-emerald-900 px-2 py-0.5 rounded-md">
            <CheckCircle2 className="w-3 h-3" /> Cloud Synced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">ID / ชื่อเครื่องมือ</th>
                <th className="px-4 py-3">Brand / Model / Serial</th>
                <th className="px-4 py-3">Range / Spec (±)</th>
                <th className="px-4 py-3">Cal. Date</th>
                <th className="px-4 py-3">Next Cal.</th>
                <th className="px-4 py-3">ผลล่าสุด / รายละเอียดซ่อม</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredInstruments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    {isTh ? 'ไม่พบข้อมูลเครื่องมือวัดตามเงื่อนไข' : 'No instrument record found'}
                  </td>
                </tr>
              ) : (
                filteredInstruments.map(inst => {
                  const statusInfo = getStatusInfo(inst);
                  const nextCal = calculateNextCal(inst.lastCalDate, inst.frequency);

                  return (
                    <tr key={inst.docId} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono font-bold text-indigo-300">{inst.id}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                            inst.instrumentClass === 'A' || !inst.instrumentClass ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                            inst.instrumentClass === 'B' ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                            inst.instrumentClass === 'C' ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800' :
                            'bg-teal-950/80 text-teal-300 border-teal-800'
                          }`}>
                            Class {inst.instrumentClass || 'A'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                            inst.calType === 'INTERNAL' 
                              ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800' 
                              : 'bg-purple-950/80 text-purple-300 border-purple-800'
                          }`}>
                            {inst.calType === 'INTERNAL' ? (isTh ? 'ภายใน (Internal)' : 'Internal') : (isTh ? 'ภายนอก (External)' : 'External')}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200">{inst.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-600" />
                          <span>{inst.location || 'Unassigned Location'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        <div>{inst.brand || '-'} {inst.model ? `(${inst.model})` : ''}</div>
                        <div className="text-[10px] text-slate-500 font-mono">SN: {inst.serialNo || '-'}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="text-slate-200 font-medium">{inst.range || '-'}</div>
                        {((inst.ranges && inst.ranges.length > 1) || (inst.range && inst.range.includes(','))) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-semibold inline-flex items-center gap-1 mt-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {inst.ranges?.length || inst.range?.split(',').length} {isTh ? 'ช่วงวัด' : 'ranges'}
                          </span>
                        )}
                        <div className="text-[10px] font-mono text-amber-400 font-bold mt-0.5">Spec: ±{inst.spec}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {inst.lastCalDate || '-'}
                        <div className="text-[10px] text-slate-500">Freq: {formatFrequencyDisplay(inst.frequency)}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-200">
                        <div className={statusInfo.warning ? 'text-amber-400' : 'text-slate-200'}>
                          {nextCal || '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        {inst.isRepairing && inst.currentRepair ? (
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase text-amber-400 block">อาการซ่อม:</span>
                            <p className="text-[11px] text-amber-200 max-w-[180px] truncate" title={inst.currentRepair.symptom}>
                              {inst.currentRepair.symptom}
                            </p>
                            <span className="text-[9px] text-slate-500 block">โดย: {inst.currentRepair.repairBy}</span>
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                inst.lastResult === 'PASS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                inst.lastResult === 'FAIL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {inst.lastResult || '-'}
                              </span>
                              {inst.lastCalDate && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestEditLatestCal(inst)}
                                  title={isTh ? 'แก้ไขบันทึกผลสอบเทียบล่าสุด (ยืนยัน Admin Password)' : 'Edit latest calibration (Admin Password required)'}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition active:scale-95"
                                >
                                  <Edit3 className="w-2.5 h-2.5 text-cyan-400" />
                                  <span>{isTh ? 'แก้ไข' : 'Edit'}</span>
                                </button>
                              )}
                            </div>
                            {inst.lastError !== undefined && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Err: ±{inst.lastError}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-block ${statusInfo.class}`}>
                          {isTh ? statusInfo.labelTh : statusInfo.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {!inst.isRepairing ? (
                            <>
                              <button
                                onClick={() => {
                                  setCalModalItem(inst);
                                  setCalFormData({
                                    sendDate: new Date().toISOString().split('T')[0],
                                    receiveDate: new Date().toISOString().split('T')[0],
                                    lab: 'Internal Metrology Lab',
                                    certNo: `CAL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                                    actualError: '',
                                    uncertainty: '',
                                    officer: 'Sompong P. (QA Metrology)',
                                    note: ''
                                  });
                                }}
                                className="bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <CheckSquare className="w-3 h-3" />
                                <span>{isTh ? 'บันทึกสอบเทียบ' : 'Calibrate'}</span>
                              </button>

                              {inst.lastCalDate && (
                                <button
                                  type="button"
                                  onClick={() => handleRequestEditLatestCal(inst)}
                                  className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 active:scale-95 shadow-xs"
                                  title={isTh ? 'แก้ไขบันทึกผลสอบเทียบล่าสุด (ยืนยัน Admin Password)' : 'Edit latest calibration record (Admin Password required)'}
                                >
                                  <Edit3 className="w-3 h-3 text-cyan-400" />
                                  <span>{isTh ? 'แก้ไขผลล่าสุด' : 'Edit Cal'}</span>
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setRepairModalItem(inst);
                                  setRepairFormData({
                                    startDate: new Date().toISOString().split('T')[0],
                                    expectedEndDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
                                    symptom: '',
                                    detail: '',
                                    repairBy: '',
                                    cost: ''
                                  });
                                }}
                                className="bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              >
                                <Wrench className="w-3 h-3" />
                                <span>{isTh ? 'ส่งซ่อม' : 'Repair'}</span>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleCompleteRepair(inst.docId!)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-md shadow-emerald-600/20"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{isTh ? 'ซ่อมเสร็จแล้ว' : 'Finish Repair'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setHistoryModalItem(inst)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg border border-slate-700 transition"
                            title="View History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handlePrintTag(inst)}
                            className="bg-slate-800 hover:bg-slate-700 text-indigo-400 p-1.5 rounded-lg border border-slate-700 transition"
                            title="Print QR Tag"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => requestSecurityCheck(() => {
                              setEditingInst(inst);
                              const parsed = parseRangeStringToItems(inst.range || '');
                              const initialRanges = (inst.ranges && inst.ranges.length > 0)
                                ? inst.ranges
                                : parsed.ranges;
                              const currentUnit = inst.unit || (initialRanges[0]?.unit) || parsed.globalUnit || 'mm';
                              const isPreset = ['mm', 'µm', 'g', 'kg'].includes(currentUnit);

                              setFormData({
                                id: inst.id,
                                name: inst.name,
                                brand: inst.brand || '',
                                model: inst.model || '',
                                serialNo: inst.serialNo || '',
                                location: inst.location || '',
                                range: inst.range || formatItemsToRangeString(initialRanges),
                                ranges: initialRanges.map((r, idx) => ({
                                  id: r.id || String(idx + 1),
                                  min: r.min || '0',
                                  max: r.max || '',
                                  unit: r.unit || currentUnit
                                })),
                                globalUnit: isPreset ? currentUnit : 'CUSTOM',
                                isCustomUnit: !isPreset,
                                customUnitText: !isPreset ? currentUnit : '',
                                spec: String(inst.spec),
                                entryDate: inst.entryDate || new Date().toISOString().split('T')[0],
                                startDate: inst.startDate || new Date().toISOString().split('T')[0],
                                frequency: String(inst.frequency || 12),
                                calType: inst.calType || 'EXTERNAL',
                                instrumentClass: inst.instrumentClass || 'A'
                              });
                              setShowAddModal(true);
                            })}
                            className="bg-slate-800 hover:bg-slate-700 text-cyan-400 p-1.5 rounded-lg border border-slate-700 transition"
                            title="Edit Instrument"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => requestSecurityCheck(() => {
                              setDeleteConfirm({ show: true, docId: inst.docId!, instId: inst.id });
                            })}
                            className="bg-slate-800 hover:bg-rose-950 text-rose-400 p-1.5 rounded-lg border border-slate-700 transition"
                            title="Delete Instrument"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Add / Edit Instrument Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingInst 
                    ? isTh ? `แก้ไขข้อมูลเครื่องมือ (${editingInst.id})` : `Edit Instrument (${editingInst.id})`
                    : isTh ? 'เพิ่มเครื่องมือใหม่เข้าสู่ Master List' : 'Add New Instrument to Master List'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInstrument} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Classification & Calibration Mode Configuration */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-950/80 rounded-2xl border border-indigo-900/40">
                {/* 1. External / Internal Calibration Selection */}
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1.5 flex items-center justify-between">
                    <span>{isTh ? 'ประเภทการสอบเทียบ (Calibration Type) *' : 'Calibration Type *'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                      formData.calType === 'INTERNAL'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : 'bg-purple-950 text-purple-300 border-purple-800'
                    }`}>
                      {formData.calType === 'INTERNAL' ? 'INTERNAL (ภายใน)' : 'EXTERNAL (ภายนอก)'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, calType: 'EXTERNAL' }))}
                      className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                        formData.calType === 'EXTERNAL'
                          ? 'bg-purple-950/80 border-purple-500 text-white shadow-md shadow-purple-950/50 ring-1 ring-purple-500'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-300">🏢 External</span>
                        {formData.calType === 'EXTERNAL' && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 leading-tight">
                        {isTh ? 'ส่งสอบเทียบภายนอก (ISO/IEC 17025)' : 'Outsourced Accredited Lab'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, calType: 'INTERNAL' }))}
                      className={`p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                        formData.calType === 'INTERNAL'
                          ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-md shadow-cyan-950/50 ring-1 ring-cyan-500'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-cyan-300">🔬 Internal</span>
                        {formData.calType === 'INTERNAL' && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <span className="text-[9px] text-slate-400 mt-1 leading-tight">
                        {isTh ? 'สอบเทียบภายใน (QA In-House Lab)' : 'In-House Calibration'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 2. Instrument Class Selection (A, B, C, D) */}
                <div>
                  <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1.5 flex items-center justify-between">
                    <span>{isTh ? 'ระดับความสำคัญ (Instrument Class) *' : 'Instrument Class *'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                      formData.instrumentClass === 'A' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                      formData.instrumentClass === 'B' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                      formData.instrumentClass === 'C' ? 'bg-indigo-950 text-indigo-300 border-indigo-800' :
                      'bg-teal-950 text-teal-300 border-teal-800'
                    }`}>
                      Class {formData.instrumentClass}
                    </span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { classVal: 'A' as const, label: 'Class A', desc: 'Critical', descTh: 'วิกฤต/สูง', activeCls: 'bg-rose-950 border-rose-500 text-rose-200 ring-1 ring-rose-500' },
                      { classVal: 'B' as const, label: 'Class B', desc: 'Standard', descTh: 'มาตรฐาน/ผลิต', activeCls: 'bg-amber-950 border-amber-500 text-amber-200 ring-1 ring-amber-500' },
                      { classVal: 'C' as const, label: 'Class C', desc: 'Reference', descTh: 'อ้างอิง/ตรวจ', activeCls: 'bg-indigo-950 border-indigo-500 text-indigo-200 ring-1 ring-indigo-500' },
                      { classVal: 'D' as const, label: 'Class D', desc: 'Auxiliary', descTh: 'เสริม/ทั่วไป', activeCls: 'bg-teal-950 border-teal-500 text-teal-200 ring-1 ring-teal-500' }
                    ].map(item => {
                      const isSel = formData.instrumentClass === item.classVal;
                      return (
                        <button
                          key={item.classVal}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, instrumentClass: item.classVal }))}
                          className={`p-2 rounded-xl text-center border transition flex flex-col items-center justify-center cursor-pointer ${
                            isSel
                              ? item.activeCls
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-black text-xs">{item.label}</span>
                          <span className="text-[8px] opacity-80 mt-0.5">{isTh ? item.descTh : item.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">รหัสเครื่องมือ (Instrument ID) *</label>
                <input
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="เช่น CAL-001, MIC-002"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-indigo-300 focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ชื่อเครื่องมือ (Instrument Name) *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น Vernier Caliper 0-150mm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ยี่ห้อ / ผู้ผลิต (Brand)</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="เช่น Mitutoyo, Elcometer"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">รุ่น (Model)</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="เช่น 500-196-30"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">หมายเลขซีเรียล (Serial No.)</label>
                <input
                  type="text"
                  value={formData.serialNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, serialNo: e.target.value }))}
                  placeholder="เช่น MT-884201"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">สถานที่ใช้งาน (Location)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="เช่น QC Room, Line 1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Permission Error / Spec (±) *</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formData.spec}
                  onChange={(e) => setFormData(prev => ({ ...prev, spec: e.target.value }))}
                  placeholder="เช่น 0.02"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dynamic Measurement Range Builder (Supports +1 / -1 Multi-Range & Flexible Units) */}
              <div className="md:col-span-2 space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-indigo-900/40">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                      <Ruler className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>{isTh ? 'ช่วงการวัด (Measurement Ranges) & หน่วยวัด' : 'Measurement Ranges & Units'}</span>
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded-full font-mono font-bold">
                          {formData.ranges.length} {isTh ? 'ช่วงวัด' : 'Range(s)'}
                        </span>
                      </span>
                      <p className="text-[9px] text-slate-400 mt-0.5">
                        {isTh 
                          ? 'เพิ่ม/ลดช่วงการวัดได้ (+1 / -1) สำหรับเครื่องมือที่มีหลายช่วงวัด และเลือกหรือพิมพ์หน่วยวัดได้อิสระ'
                          : 'Dynamic +1 / -1 multi-range support with flexible unit selection'}
                      </p>
                    </div>
                  </div>

                  {/* Header quick summary badge */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-semibold">{isTh ? 'ช่วงวัดรวม:' : 'Total Range:'}</span>
                    <span className="text-xs font-mono font-bold text-amber-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      {formatItemsToRangeString(formData.ranges) || formData.range || '-'}
                    </span>
                  </div>
                </div>

                {/* 1. Measurement Unit Selector */}
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <label className="text-[10px] font-bold uppercase text-slate-300 tracking-wider">
                      {isTh ? 'เลือกหน่วยการวัด (Measurement Unit):' : 'Select Measurement Unit:'}
                    </label>
                    <span className="text-[9px] text-indigo-400 font-medium">
                      {isTh ? 'เลือก mm, µm, g, kg หรือพิมพ์หน่วยที่ต้องการ' : 'Select mm, um, g, kg or custom text'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { unit: 'mm', label: 'mm (มิลลิเมตร)' },
                      { unit: 'µm', label: 'µm / um (ไมโครเมตร)' },
                      { unit: 'g', label: 'g (กรัม)' },
                      { unit: 'kg', label: 'kg (กิโลกรัม)' }
                    ].map(uItem => {
                      const isSel = !formData.isCustomUnit && formData.globalUnit === uItem.unit;
                      return (
                        <button
                          key={uItem.unit}
                          type="button"
                          onClick={() => {
                            setFormData(prev => {
                              const updatedRanges = prev.ranges.map(r => ({ ...r, unit: uItem.unit }));
                              return {
                                ...prev,
                                globalUnit: uItem.unit,
                                isCustomUnit: false,
                                ranges: updatedRanges,
                                range: formatItemsToRangeString(updatedRanges)
                              };
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                            isSel
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400'
                              : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                          }`}
                        >
                          {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          <span>{uItem.label}</span>
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          isCustomUnit: true,
                          customUnitText: prev.customUnitText || ''
                        }));
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                        formData.isCustomUnit
                          ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400'
                          : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
                      }`}
                    >
                      {formData.isCustomUnit && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      <span>✍️ {isTh ? 'พิมพ์หน่วยเอง (Custom)' : 'Custom Unit'}</span>
                    </button>
                  </div>

                  {formData.isCustomUnit && (
                    <div className="pt-1.5 animate-in fade-in slide-in-from-top-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {isTh ? 'ระบุหน่วยการวัดเอง:' : 'Specify Custom Unit:'}
                        </span>
                        <input
                          type="text"
                          required={formData.isCustomUnit}
                          value={formData.customUnitText}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData(prev => {
                              const updatedRanges = prev.ranges.map(r => ({ ...r, unit: val }));
                              return {
                                ...prev,
                                customUnitText: val,
                                ranges: updatedRanges,
                                range: formatItemsToRangeString(updatedRanges)
                              };
                            });
                          }}
                          placeholder={isTh ? 'พิมพ์หน่วย เช่น N·m, inch, °C, bar, psi, mg, rpm...' : 'e.g. N·m, inch, °C, bar...'}
                          className="w-full max-w-xs bg-slate-950 border border-cyan-500/80 rounded-xl px-3 py-1.5 text-xs font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Range Rows List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>{isTh ? 'รายการช่วงการวัด (Measurement Range Rows):' : 'Range Rows:'}</span>
                    <span className="text-slate-500">{isTh ? 'กด +1 เพื่อเพิ่มช่วงวัด หรือ -1 เพื่อลบ' : 'Use +1 to add or -1 to remove'}</span>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {formData.ranges.map((rangeItem, idx) => {
                      return (
                        <div
                          key={rangeItem.id || idx}
                          className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl flex flex-wrap sm:flex-nowrap items-center gap-2.5 transition hover:border-slate-700"
                        >
                          <div className="flex items-center gap-1.5 min-w-[75px]">
                            <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[10px] font-mono font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
                              {isTh ? `ช่วงที่ ${idx + 1}` : `Range ${idx + 1}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-2 text-[9px] font-bold text-slate-500 uppercase">Min</span>
                              <input
                                type="text"
                                value={rangeItem.min}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => {
                                    const updated = prev.ranges.map((r, i) => i === idx ? { ...r, min: val } : r);
                                    return {
                                      ...prev,
                                      ranges: updated,
                                      range: formatItemsToRangeString(updated)
                                    };
                                  });
                                }}
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-2 py-1.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <span className="text-slate-500 font-bold text-xs">-</span>

                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-2 text-[9px] font-bold text-slate-500 uppercase">Max</span>
                              <input
                                type="text"
                                value={rangeItem.max}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setFormData(prev => {
                                    const updated = prev.ranges.map((r, i) => i === idx ? { ...r, max: val } : r);
                                    return {
                                      ...prev,
                                      ranges: updated,
                                      range: formatItemsToRangeString(updated)
                                    };
                                  });
                                }}
                                placeholder="150"
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-2 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="w-24 sm:w-28">
                            <input
                              type="text"
                              value={rangeItem.unit}
                              onChange={(e) => {
                                const val = e.target.value;
                                setFormData(prev => {
                                  const updated = prev.ranges.map((r, i) => i === idx ? { ...r, unit: val } : r);
                                  return {
                                    ...prev,
                                    ranges: updated,
                                    range: formatItemsToRangeString(updated)
                                  };
                                });
                              }}
                              placeholder="unit"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-300 text-center focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {formData.ranges.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => {
                                  const updated = prev.ranges.filter((_, i) => i !== idx);
                                  return {
                                    ...prev,
                                    ranges: updated,
                                    range: formatItemsToRangeString(updated)
                                  };
                                });
                              }}
                              className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-950/80 border border-rose-900/60 transition cursor-pointer"
                              title={isTh ? 'ลบช่วงวัดนี้ (-1)' : 'Remove range (-1)'}
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Action Buttons (+1 and -1) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {/* +1 Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => {
                          const lastItem = prev.ranges[prev.ranges.length - 1];
                          const nextMin = lastItem && lastItem.max ? lastItem.max : '0';
                          const defaultUnit = prev.isCustomUnit 
                            ? (prev.customUnitText || 'mm') 
                            : (lastItem?.unit || prev.globalUnit || 'mm');
                          const updated = [
                            ...prev.ranges,
                            { id: String(Date.now() + Math.random()), min: nextMin, max: '', unit: defaultUnit }
                          ];
                          return {
                            ...prev,
                            ranges: updated,
                            range: formatItemsToRangeString(updated)
                          };
                        });
                      }}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isTh ? '+1 เพิ่มช่วงวัด (Add Range)' : '+1 Add Range'}</span>
                    </button>

                    {/* -1 Button */}
                    <button
                      type="button"
                      disabled={formData.ranges.length <= 1}
                      onClick={() => {
                        if (formData.ranges.length <= 1) return;
                        setFormData(prev => {
                          const updated = prev.ranges.slice(0, -1);
                          return {
                            ...prev,
                            ranges: updated,
                            range: formatItemsToRangeString(updated)
                          };
                        });
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                        formData.ranges.length > 1
                          ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border-rose-800 cursor-pointer'
                          : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>{isTh ? '-1 ลบช่วงวัดล่าสุด (-1 Range)' : '-1 Remove Last'}</span>
                    </button>
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {isTh ? 'ผลลัพธ์ที่จะบันทึก:' : 'Saved Format:'}{' '}
                    <b className="text-emerald-400">{formData.range || formatItemsToRangeString(formData.ranges) || '-'}</b>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่รับเข้า (Incoming Date)</label>
                <input
                  type="date"
                  required
                  value={formData.entryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, entryDate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่เริ่มใช้งาน (Start Date)</label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="md:col-span-2 space-y-2 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <span>{isTh ? 'ความถี่ในการสอบเทียบ (Calibration Frequency)' : 'Calibration Frequency'} *</span>
                    <span className="text-[9px] text-indigo-400 bg-indigo-950/80 border border-indigo-800/80 px-1.5 py-0.5 rounded font-normal">
                      {isTh ? 'มีตัวเลือก 3 ปี และพิมพ์ระบุได้เอง' : 'Option 3 Years & custom text enabled'}
                    </span>
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400 font-semibold">
                    {isTh ? `รอบคำนวณ: +${parseFrequencyToMonths(formData.frequency)} เดือน` : `Cycle: +${parseFrequencyToMonths(formData.frequency)} mo`}
                  </span>
                </div>

                {/* Quick preset selector buttons including '3 ปี' */}
                <div>
                  <span className="text-[9px] text-slate-500 font-semibold block mb-1.5">
                    {isTh ? 'ปุ่มลัดเลือกความถี่ด่วน (Quick Presets):' : 'Quick Presets:'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { label: '3 เดือน', val: '3 เดือน' },
                      { label: '6 เดือน', val: '6 เดือน' },
                      { label: '1 ปี', val: '1 ปี' },
                      { label: '2 ปี', val: '2 ปี' },
                      { label: '3 ปี', val: '3 ปี' }
                    ].map(preset => {
                      const isSelected = 
                        formData.frequency === preset.val || 
                        (preset.val === '3 ปี' && (formData.frequency === '36' || formData.frequency === '36 เดือน' || formData.frequency === '3 ปี')) ||
                        (preset.val === '1 ปี' && (formData.frequency === '12' || formData.frequency === '12 เดือน' || formData.frequency === '1 ปี')) ||
                        (preset.val === '2 ปี' && (formData.frequency === '24' || formData.frequency === '24 เดือน' || formData.frequency === '2 ปี')) ||
                        (preset.val === '6 เดือน' && (formData.frequency === '6' || formData.frequency === '6 เดือน')) ||
                        (preset.val === '3 เดือน' && (formData.frequency === '3' || formData.frequency === '3 เดือน'));

                      return (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, frequency: preset.val }))}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
                          }`}
                        >
                          {preset.val === '3 ปี' && <Sparkles className="w-3 h-3 text-amber-300" />}
                          <span>{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Combined dropdown selector & custom free-text input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1">
                      {isTh ? 'เลือกจากเมนูมาตรฐาน (Preset List)' : 'Select from Standard List'}
                    </label>
                    <select
                      value={
                        ['3 เดือน', '6 เดือน', '1 ปี', '2 ปี', '3 ปี'].includes(formData.frequency)
                          ? formData.frequency
                          : formData.frequency === '3' ? '3 เดือน'
                          : formData.frequency === '6' ? '6 เดือน'
                          : formData.frequency === '12' ? '1 ปี'
                          : formData.frequency === '24' ? '2 ปี'
                          : formData.frequency === '36' ? '3 ปี'
                          : 'CUSTOM'
                      }
                      onChange={(e) => {
                        if (e.target.value !== 'CUSTOM') {
                          setFormData(prev => ({ ...prev, frequency: e.target.value }));
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="3 เดือน">3 เดือน (3 Months)</option>
                      <option value="6 เดือน">6 เดือน (6 Months)</option>
                      <option value="1 ปี">1 ปี / 12 เดือน (1 Year)</option>
                      <option value="2 ปี">2 ปี / 24 เดือน (2 Years)</option>
                      <option value="3 ปี">3 ปี / 36 เดือน (3 Years)</option>
                      <option value="CUSTOM">{isTh ? '✍️ กำหนดเอง / พิมพ์ข้อความเอง...' : '✍️ Custom text entry...'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] text-slate-400 block mb-1">
                      {isTh ? 'หรือพิมพ์ข้อความได้เองอิสระ (Type Custom Frequency)' : 'Or Type Custom Frequency'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.frequency}
                      onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                      placeholder={isTh ? "พิมพ์ความถี่เอง เช่น 3 ปี, 18 เดือน, ทุก 500 ชม." : "e.g. 3 ปี, 18 Months, Custom"}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500 placeholder:text-slate-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-900">
                  <span className="text-slate-400">
                    {isTh ? '💡 สามารถกดเลือก "3 ปี" หรือพิมพ์ข้อความความถี่ที่ต้องการได้โดยตรง' : '💡 Select "3 ปี" or enter custom frequency freely'}
                  </span>
                  {formData.startDate && (
                    <span className="text-emerald-400 font-mono text-[10px]">
                      {isTh ? 'วันครบกำหนดถัดไป:' : 'Next Cal:'} <b>{calculateNextCal(formData.startDate, formData.frequency) || '-'}</b>
                    </span>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-indigo-600/20"
                >
                  {isTh ? 'บันทึกข้อมูลเครื่องมือ' : 'Save Instrument'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Calibration Entry Modal */}
      {calModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{isTh ? 'บันทึกผลการสอบเทียบ (Calibration Entry)' : 'Record Calibration Result'}</h3>
                  <p className="text-[10px] text-emerald-400 font-mono font-bold">{calModalItem.id} - {calModalItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setCalModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Spec Limit</span>
                <span className="font-mono font-bold text-amber-300 text-sm">± {calModalItem.spec}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Frequency</span>
                <span className="font-mono font-bold text-indigo-300 text-sm">{formatFrequencyDisplay(calModalItem.frequency)}</span>
              </div>
            </div>

            <form onSubmit={handleSaveCalibration} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่ส่งสอบเทียบ</label>
                  <input
                    type="date"
                    required
                    value={calFormData.sendDate}
                    onChange={(e) => setCalFormData(prev => ({ ...prev, sendDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่ได้รับคืน / วันสอบเทียบ</label>
                  <input
                    type="date"
                    required
                    value={calFormData.receiveDate}
                    onChange={(e) => setCalFormData(prev => ({ ...prev, receiveDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">สถาบัน / ห้องปฏิบัติการสอบเทียบ</label>
                  <input
                    type="text"
                    required
                    value={calFormData.lab}
                    onChange={(e) => setCalFormData(prev => ({ ...prev, lab: e.target.value }))}
                    placeholder="เช่น NIMT, Internal Metrology"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">หมายเลขใบรับรอง (Cert No.)</label>
                  <input
                    type="text"
                    required
                    value={calFormData.certNo}
                    onChange={(e) => setCalFormData(prev => ({ ...prev, certNo: e.target.value }))}
                    placeholder="เช่น CAL-2026-0801"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ค่า Error ที่วัดได้ (Actual Error) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">±</span>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={calFormData.actualError}
                      onChange={(e) => setCalFormData(prev => ({ ...prev, actualError: e.target.value }))}
                      placeholder="เช่น 0.005"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ค่าความไม่แน่นอน (Uncertainty)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">±</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={calFormData.uncertainty}
                      onChange={(e) => setCalFormData(prev => ({ ...prev, uncertainty: e.target.value }))}
                      placeholder="เช่น 0.001"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ผู้ตรวจสอบ / เจ้าหน้าที่</label>
                <input
                  type="text"
                  required
                  list="qa-inspector-list"
                  value={calFormData.officer}
                  onChange={(e) => setCalFormData(prev => ({ ...prev, officer: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">หมายเหตุ</label>
                <textarea
                  rows={2}
                  value={calFormData.note}
                  onChange={(e) => setCalFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับการสอบเทียบ..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCalModalItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
                >
                  {isTh ? 'ยืนยันผลการสอบเทียบ' : 'Confirm Calibration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2.1 Edit Latest Calibration Modal (Admin Protected) */}
      {editCalModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">
                      {isTh ? 'แก้ไขบันทึกผลสอบเทียบล่าสุด' : 'Edit Latest Calibration'}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-800/80 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3 text-indigo-400" /> Admin
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-400 font-mono font-bold">{editCalModalItem.id} - {editCalModalItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => { setEditCalModalItem(null); setTargetHistoryId(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Spec & Live Evaluation Card */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Spec Limit</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">± {editCalModalItem.spec}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Frequency</span>
                  <span className="font-mono font-bold text-indigo-300 text-sm">{formatFrequencyDisplay(editCalModalItem.frequency)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">ประเมินผล (Live Result)</span>
                  {editCalFormData.actualError !== '' && !isNaN(parseFloat(editCalFormData.actualError)) ? (
                    Math.abs(parseFloat(editCalFormData.actualError)) <= editCalModalItem.spec ? (
                      <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded font-bold text-xs inline-block">
                        ✓ PASS (อยู่ในเกณฑ์)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 rounded font-bold text-xs inline-block">
                        ✕ FAIL (เกินเกณฑ์ Spec)
                      </span>
                    )
                  ) : (
                    <span className="text-slate-500 text-xs">-</span>
                  )}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{isTh ? 'ใช้แก้ไขข้อมูลที่บันทึกผิดพลาด เช่น ค่า Error, วันที่, หรือเลขที่ใบเซอร์ (ยืนยันรหัสผ่าน Admin เรียบร้อย)' : 'Use to correct erroneous records e.g. actual error, dates, or cert number.'}</span>
              </div>
            </div>

            <form onSubmit={handleUpdateLatestCalibration} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่ส่งสอบเทียบ</label>
                  <input
                    type="date"
                    required
                    value={editCalFormData.sendDate}
                    onChange={(e) => setEditCalFormData(prev => ({ ...prev, sendDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่ได้รับคืน / วันสอบเทียบ</label>
                  <input
                    type="date"
                    required
                    value={editCalFormData.receiveDate}
                    onChange={(e) => setEditCalFormData(prev => ({ ...prev, receiveDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">สถาบัน / ห้องปฏิบัติการสอบเทียบ</label>
                  <input
                    type="text"
                    required
                    value={editCalFormData.lab}
                    onChange={(e) => setEditCalFormData(prev => ({ ...prev, lab: e.target.value }))}
                    placeholder="เช่น NIMT, Internal Metrology"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">หมายเลขใบรับรอง (Cert No.)</label>
                  <input
                    type="text"
                    required
                    value={editCalFormData.certNo}
                    onChange={(e) => setEditCalFormData(prev => ({ ...prev, certNo: e.target.value }))}
                    placeholder="เช่น CAL-2026-0801"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ค่า Error ที่วัดได้ (Actual Error) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">±</span>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={editCalFormData.actualError}
                      onChange={(e) => setEditCalFormData(prev => ({ ...prev, actualError: e.target.value }))}
                      placeholder="เช่น 0.005"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ค่าความไม่แน่นอน (Uncertainty)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-bold">±</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={editCalFormData.uncertainty}
                      onChange={(e) => setEditCalFormData(prev => ({ ...prev, uncertainty: e.target.value }))}
                      placeholder="เช่น 0.001"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ผู้ตรวจสอบ / เจ้าหน้าที่</label>
                <input
                  type="text"
                  required
                  list="qa-inspector-list"
                  value={editCalFormData.officer}
                  onChange={(e) => setEditCalFormData(prev => ({ ...prev, officer: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">หมายเหตุ / เหตุผลการแก้ไข</label>
                <textarea
                  rows={2}
                  value={editCalFormData.note}
                  onChange={(e) => setEditCalFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="เช่น แก้ไขเนื่องจากคีย์ค่า Error ผิดพลาด..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setEditCalModalItem(null); setTargetHistoryId(null); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-cyan-600/20 active:scale-95"
                >
                  {isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Repair Entry Modal */}
      {repairModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{isTh ? 'บันทึกการซ่อม / บำรุงรักษา (Repair Entry)' : 'Record Maintenance & Repair'}</h3>
                  <p className="text-[10px] text-amber-400 font-mono font-bold">{repairModalItem.id} - {repairModalItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setRepairModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRepair} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่เริ่มส่งซ่อม *</label>
                  <input
                    type="date"
                    required
                    value={repairFormData.startDate}
                    onChange={(e) => setRepairFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">วันที่คาดว่าจะเสร็จ *</label>
                  <input
                    type="date"
                    required
                    value={repairFormData.expectedEndDate}
                    onChange={(e) => setRepairFormData(prev => ({ ...prev, expectedEndDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">อาการที่พบ / ปัญหา *</label>
                <input
                  type="text"
                  required
                  value={repairFormData.symptom}
                  onChange={(e) => setRepairFormData(prev => ({ ...prev, symptom: e.target.value }))}
                  placeholder="เช่น ค่าอ่านผันผวน, สเกลเป็นรอย, ปุ่มกดไม่ติด"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">รายละเอียดการซ่อม</label>
                <textarea
                  rows={2}
                  value={repairFormData.detail}
                  onChange={(e) => setRepairFormData(prev => ({ ...prev, detail: e.target.value }))}
                  placeholder="เช่น ส่งศูนย์บริการเพื่อเปลี่ยนเซ็นเซอร์และปรับตั้งตำแหน่งศูนย์..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ผู้ดำเนินการซ่อม *</label>
                  <input
                    type="text"
                    required
                    value={repairFormData.repairBy}
                    onChange={(e) => setRepairFormData(prev => ({ ...prev, repairBy: e.target.value }))}
                    placeholder="ชื่อช่าง หรือ ศูนย์บริการ"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ค่าใช้จ่ายประมาณการ (THB)</label>
                  <input
                    type="number"
                    value={repairFormData.cost}
                    onChange={(e) => setRepairFormData(prev => ({ ...prev, cost: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRepairModalItem(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow-lg shadow-amber-600/20"
                >
                  {isTh ? 'ส่งซ่อมและเปลี่ยนสถานะ' : 'Confirm Repair'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. History Log Drawer Modal */}
      {historyModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{isTh ? 'ประวัติสอบเทียบและการซ่อมบำรุง' : 'Calibration & Repair Logs'}</h3>
                  <p className="text-[10px] text-indigo-400 font-mono font-bold">{historyModalItem.id} - {historyModalItem.name}</p>
                </div>
              </div>
              <button
                onClick={() => setHistoryModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {(!historyModalItem.history || historyModalItem.history.length === 0) ? (
                <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  {isTh ? 'ยังไม่มีประวัติบันทึกสอบเทียบหรือการซ่อม' : 'No history record available'}
                </div>
              ) : (
                historyModalItem.history.map((log, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          log.type === 'CALIBRATION' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          log.type === 'REPAIR_START' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        }`}>
                          {log.type}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">{log.date}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {log.result && (
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            log.result === 'PASS' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {log.result}
                          </span>
                        )}

                        {log.type === 'CALIBRATION' && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetItem = historyModalItem;
                              setHistoryModalItem(null);
                              handleRequestEditLatestCal(targetItem, log);
                            }}
                            title={isTh ? 'แก้ไขบันทึกสอบเทียบนี้ (ยืนยัน Admin Password)' : 'Edit this calibration record (Admin Password required)'}
                            className="px-2 py-0.5 rounded text-[9.5px] font-bold bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 flex items-center gap-1 transition active:scale-95"
                          >
                            <Edit3 className="w-2.5 h-2.5 text-cyan-400" />
                            <span>{isTh ? 'แก้ไข' : 'Edit'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {log.type === 'CALIBRATION' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
                        <div><span className="text-slate-500 block text-[9px]">ERROR:</span> ±{log.error}</div>
                        <div><span className="text-slate-500 block text-[9px]">UNCERTAINTY:</span> ±{log.uncertainty || '0'}</div>
                        <div><span className="text-slate-500 block text-[9px]">CERT NO:</span> {log.certNo || '-'}</div>
                        <div><span className="text-slate-500 block text-[9px]">LAB:</span> {log.lab || '-'}</div>
                        <div><span className="text-slate-500 block text-[9px]">OFFICER:</span> {log.officer || '-'}</div>
                      </div>
                    )}

                    {log.type === 'REPAIR_START' && (
                      <div className="space-y-1 text-[11px] text-amber-200">
                        <div><b>Symptom:</b> {log.symptom}</div>
                        <div><b>Repair By:</b> {log.repairBy}</div>
                        {log.cost ? <div><b>Cost:</b> ฿{log.cost.toLocaleString()}</div> : null}
                      </div>
                    )}

                    {log.note && (
                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-900">
                        "{log.note}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
