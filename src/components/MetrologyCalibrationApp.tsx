import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Plus, 
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
  X,
  Filter
} from 'lucide-react';

import { 
  InstrumentRecord, 
  InstrumentCalHistoryItem, 
  InstrumentRepairLog, 
  Language, 
  InspectionActivity 
} from '../types';
import { useCloudState } from '../services/firestoreSync';

interface MetrologyCalibrationAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
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
  language = 'th'
}) => {
  const isTh = language === 'th';

  // State with Real-time Cloud Sync
  const [instruments, setInstruments] = useCloudState<InstrumentRecord[]>('metrology_instruments', INITIAL_INSTRUMENTS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DUE_SOON' | 'EXPIRED' | 'REPAIRING'>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInst, setEditingInst] = useState<InstrumentRecord | null>(null);

  const [calModalItem, setCalModalItem] = useState<InstrumentRecord | null>(null);
  const [repairModalItem, setRepairModalItem] = useState<InstrumentRecord | null>(null);
  const [historyModalItem, setHistoryModalItem] = useState<InstrumentRecord | null>(null);

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

  // Add / Edit Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    brand: '',
    model: '',
    serialNo: '',
    location: '',
    range: '',
    spec: '0.02',
    entryDate: new Date().toISOString().split('T')[0],
    startDate: new Date().toISOString().split('T')[0],
    frequency: '12'
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

  // Helper function to calculate Next Cal Date
  const calculateNextCal = (lastCalDate?: string, months: number = 12): string | null => {
    if (!lastCalDate) return null;
    const date = new Date(lastCalDate);
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
        message: isTh ? 'รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (admin2026)' : 'Incorrect Admin Password (admin2026)'
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
        (inst.location && inst.location.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === 'ALL') return true;
      const statusInfo = getStatusInfo(inst);

      if (statusFilter === 'ACTIVE') return statusInfo.label === 'Active';
      if (statusFilter === 'DUE_SOON') return statusInfo.label === 'Due Soon';
      if (statusFilter === 'EXPIRED') return statusInfo.label === 'Expired';
      if (statusFilter === 'REPAIRING') return statusInfo.label === 'Repairing';

      return true;
    });
  }, [instruments, searchQuery, statusFilter]);

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
            range: formData.range.trim(),
            spec: parseFloat(formData.spec) || 0.02,
            entryDate: formData.entryDate,
            startDate: formData.startDate,
            frequency: parseInt(formData.frequency) || 12
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
        range: formData.range.trim(),
        spec: parseFloat(formData.spec) || 0.02,
        entryDate: formData.entryDate,
        startDate: formData.startDate,
        lastCalDate: formData.startDate,
        frequency: parseInt(formData.frequency) || 12,
        lastResult: 'NEW',
        lastError: 0,
        isRepairing: false,
        history: []
      };

      setInstruments(prev => [newInst, ...prev]);

      if (onLogNewActivity) {
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
          remarks: `Added to Master List. Spec: ±${newInst.spec}`
        });
      }

      setStatusMsg({
        type: 'success',
        message: isTh ? `เพิ่มเครื่องมือวัด ${newInst.id} เข้าสู่ Master List สำเร็จ` : `Added instrument ${newInst.id}`
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
      "Tool ID", "Instrument Name", "Brand", "Model", "Serial No.",
      "Location", "Range", "Spec (±)", "Entry Date", "Start Date",
      "Frequency (Months)", "Last Cal Date", "Next Cal Date", "Last Result", "Last Error",
      "Is Repairing", "Repair Symptom", "Status"
    ];

    const rows = instruments.map(inst => {
      const nextCal = calculateNextCal(inst.lastCalDate, inst.frequency);
      const st = getStatusInfo(inst);
      return [
        inst.id,
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

    const qrData = `APP:EQP-01\nID:${inst.id}\nNAME:${inst.name}\nSERIAL:${inst.serialNo || '-'}\nSPEC:±${inst.spec}\nNEXT_CAL:${nextCal}\nSTATUS:${statusInfo.label}`;
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
              border: 1px border #334155;
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
                <div><span class="info-label">NAME:</span> ${inst.name}</div>
                <div><span class="info-label">SERIAL:</span> ${inst.serialNo || '-'}</div>
                <div><span class="info-label">SPEC LIMIT:</span> ±${inst.spec}</div>
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
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 p-4 sm:p-6 space-y-6">

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
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อดำเนินการสิทธิ์ผู้ดูแลระบบ (admin2026)' : 'Enter admin password for protected operation'}
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
                range: '',
                spec: '0.02',
                entryDate: new Date().toISOString().split('T')[0],
                startDate: new Date().toISOString().split('T')[0],
                frequency: '12'
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
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
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
                        <div className="font-mono font-bold text-indigo-300">{inst.id}</div>
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
                        <div className="text-slate-300">{inst.range || '-'}</div>
                        <div className="text-[10px] font-mono text-amber-400 font-bold">Spec: ±{inst.spec}</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-300">
                        {inst.lastCalDate || '-'}
                        <div className="text-[10px] text-slate-500">Freq: {inst.frequency} M</div>
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
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              inst.lastResult === 'PASS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              inst.lastResult === 'FAIL' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {inst.lastResult || '-'}
                            </span>
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
                              setFormData({
                                id: inst.id,
                                name: inst.name,
                                brand: inst.brand || '',
                                model: inst.model || '',
                                serialNo: inst.serialNo || '',
                                location: inst.location || '',
                                range: inst.range || '',
                                spec: String(inst.spec),
                                entryDate: inst.entryDate || new Date().toISOString().split('T')[0],
                                startDate: inst.startDate || new Date().toISOString().split('T')[0],
                                frequency: String(inst.frequency || 12)
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
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ช่วงการวัด (Measurement Range)</label>
                <input
                  type="text"
                  value={formData.range}
                  onChange={(e) => setFormData(prev => ({ ...prev, range: e.target.value }))}
                  placeholder="เช่น 0-150 mm, 0-220 g"
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

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ความถี่ในการสอบเทียบ (Cal Frequency - Months)</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-indigo-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="3">3 เดือน (3 Months)</option>
                  <option value="6">6 เดือน (6 Months)</option>
                  <option value="12">12 เดือน / 1 ปี (1 Year)</option>
                  <option value="24">24 เดือน / 2 ปี (2 Years)</option>
                </select>
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
                <span className="font-mono font-bold text-indigo-300 text-sm">{calModalItem.frequency} Months</span>
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

                      {log.result && (
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.result === 'PASS' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {log.result}
                        </span>
                      )}
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
