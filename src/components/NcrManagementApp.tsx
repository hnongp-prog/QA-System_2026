import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Download,
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Layers,
  User,
  Calendar,
  Settings2,
  Trash2,
  Edit,
  Eye,
  Printer,
  RefreshCw,
  Copy,
  Check,
  Building,
  Tag,
  Flame,
  CheckCheck,
  ChevronRight,
  TrendingDown,
  BarChart3,
  PieChart,
  HelpCircle,
  FileSpreadsheet,
  AlertOctagon,
  ArrowUpRight,
  ShieldCheck,
  X
} from 'lucide-react';

import { NcrRecord, NcrStatus, NcrSeverity, Language, InspectionActivity } from '../types';
import { 
  getStoredNcrRecords, 
  saveNcrRecords, 
  addNcrRecord, 
  exportNcrToCsv 
} from '../utils/ncrStorage';

interface NcrManagementAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
}

const PROCESS_OPTIONS = [
  'IPQA-07 Thickness Wall Measurement',
  'IPQA-01 Tensile Measurement',
  'IPQA-02 Surface Roughness',
  'IPQA-03 X-Ray Plating & Film Thickness',
  'IPQA-04 Coating & Film Thickness',
  'IPQA-05 Cutting Dimension & Tolerance',
  'IPQA-06 Mixing Inspection & Viscosity',
  'IQA-01 Billet Incoming (Chemical & Visual)',
  'IQA-02 Chemical Incoming Inspection',
  'IQA-03 Zn Wire Incoming Inspection',
  'OQA-01 FG Pre-Shipment Tag & Packaging',
  'EQP-01 Metrology & Tool Calibration',
  'Line A - Extrusion & Press #1',
  'Line B - Extrusion & Press #2',
  'Line C - Cold Rolling & Slitting',
  'Anodizing & Surface Treatment'
];

export const NcrManagementApp: React.FC<NcrManagementAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th'
}) => {
  const isTh = language === 'th';

  // Active Tab
  const [activeTab, setActiveTab] = useState<'LOG' | 'CREATE' | 'ANALYTICS' | 'REPORT'>('LOG');

  // NCR Records State
  const [ncrList, setNcrList] = useState<NcrRecord[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProcess, setFilterProcess] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  // Modals & Selected NCR for 8D Review
  const [selectedNcr, setSelectedNcr] = useState<NcrRecord | null>(null);
  const [isEditingNcr, setIsEditingNcr] = useState<boolean>(false);
  const [editFormData, setEditFormData] = useState<Partial<NcrRecord>>({});

  // Status Notification
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // New NCR Form State
  const [newCoilNo, setNewCoilNo] = useState('');
  const [newProfile, setNewProfile] = useState('');
  const [newInspectionDate, setNewInspectionDate] = useState(() => new Date().toLocaleString('sv-SE').slice(0, 16));
  const [newInspector, setNewInspector] = useState('Somchai P. (QA Inspector)');
  const [newProcess, setNewProcess] = useState(PROCESS_OPTIONS[0]);
  const [newInspectionResult, setNewInspectionResult] = useState('');
  const [newSeverity, setNewSeverity] = useState<NcrSeverity>('MAJOR');
  const [newStatus, setNewStatus] = useState<NcrStatus>('QUARANTINE');
  const [newImmediateAction, setNewImmediateAction] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newCorrectiveAction, setNewCorrectiveAction] = useState('');
  const [newPreventiveAction, setNewPreventiveAction] = useState('');
  const [newAssignedTo, setNewAssignedTo] = useState('');
  const [newTargetClosureDate, setNewTargetClosureDate] = useState('');

  // Load initial data and attach event listener for cross-subapp sync
  useEffect(() => {
    const records = getStoredNcrRecords();
    setNcrList(records);

    const handleUpdate = (e: any) => {
      if (e?.detail) {
        setNcrList(e.detail);
      } else {
        setNcrList(getStoredNcrRecords());
      }
    };

    window.addEventListener('ncr_records_updated', handleUpdate);
    return () => {
      window.removeEventListener('ncr_records_updated', handleUpdate);
    };
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToastMsg({ type, message });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return ncrList.filter((item) => {
      if (filterProcess !== 'ALL' && !item.process.includes(filterProcess)) return false;
      if (filterStatus !== 'ALL' && item.status !== filterStatus) return false;
      if (filterSeverity !== 'ALL' && item.severity !== filterSeverity) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchCoil = item.coilNo.toLowerCase().includes(q);
        const matchProfile = item.profile.toLowerCase().includes(q);
        const matchInspector = item.inspector.toLowerCase().includes(q);
        const matchProcess = item.process.toLowerCase().includes(q);
        const matchResult = item.inspectionResult.toLowerCase().includes(q);
        const matchAction = (item.immediateAction || '').toLowerCase().includes(q);

        return matchId || matchCoil || matchProfile || matchInspector || matchProcess || matchResult || matchAction;
      }
      return true;
    });
  }, [ncrList, filterProcess, filterStatus, filterSeverity, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = ncrList.length;
    const quarantined = ncrList.filter((n) => n.status === 'QUARANTINE').length;
    const underInvest = ncrList.filter((n) => n.status === 'UNDER_INVESTIGATION' || n.status === 'CAPA_IN_PROGRESS').length;
    const closed = ncrList.filter((n) => n.status === 'CLOSED').length;
    const critical = ncrList.filter((n) => n.severity === 'CRITICAL').length;
    const major = ncrList.filter((n) => n.severity === 'MAJOR').length;

    // Process breakdown
    const byProcess: Record<string, number> = {};
    ncrList.forEach((n) => {
      const pKey = n.process.split('(')[0].trim();
      byProcess[pKey] = (byProcess[pKey] || 0) + 1;
    });

    return { total, quarantined, underInvest, closed, critical, major, byProcess };
  }, [ncrList]);

  // Handle Quick Status Change
  const handleQuickStatusChange = (id: string, newStat: NcrStatus) => {
    const updated = ncrList.map((item) => {
      if (item.id === id) {
        const isClosing = newStat === 'CLOSED';
        return {
          ...item,
          status: newStat,
          closedAt: isClosing ? new Date().toLocaleString('sv-SE').slice(0, 16) : item.closedAt,
          closedBy: isClosing ? 'QA Manager Sign-off' : item.closedBy
        };
      }
      return item;
    });
    setNcrList(updated);
    saveNcrRecords(updated);
    showToast('success', isTh ? `อัปเดตสถานะ ${id} เป็น "${newStat}" เรียบร้อยแล้ว` : `Updated status for ${id} to "${newStat}"`);
  };

  // Handle Delete Record
  const handleDeleteNcr = (id: string) => {
    if (!window.confirm(isTh ? `ยืนยันการลบรายการ ${id}?` : `Confirm deleting record ${id}?`)) return;
    const updated = ncrList.filter((item) => item.id !== id);
    setNcrList(updated);
    saveNcrRecords(updated);
    if (selectedNcr?.id === id) {
      setSelectedNcr(null);
    }
    showToast('info', isTh ? `ลบรายการ ${id} แล้ว` : `Deleted ${id}`);
  };

  // Handle Create Manual NCR
  const handleCreateNcrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoilNo.trim() || !newProfile.trim() || !newInspectionResult.trim()) {
      showToast('error', isTh ? 'กรุณากรอกข้อมูล Coil No., Profile และ ผลการตรวจสอบ (Out of Spec)' : 'Please fill in Coil No., Profile, and Out of Spec inspection result');
      return;
    }

    const created = addNcrRecord({
      coilNo: newCoilNo.trim(),
      profile: newProfile.trim(),
      inspectionDate: newInspectionDate,
      inspector: newInspector.trim(),
      process: newProcess,
      inspectionResult: newInspectionResult.trim(),
      severity: newSeverity,
      status: newStatus,
      sourceModuleCode: 'NCR-01',
      defectCount: 1,
      immediateAction: newImmediateAction.trim() || 'Quarantine and Tag lot for QA disposition.',
      rootCause: newRootCause.trim(),
      correctiveAction: newCorrectiveAction.trim(),
      preventiveAction: newPreventiveAction.trim(),
      assignedTo: newAssignedTo.trim(),
      targetClosureDate: newTargetClosureDate
    });

    setNcrList(getStoredNcrRecords());

    if (onLogNewActivity) {
      onLogNewActivity({
        id: created.docId!,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleCode: 'NCR-01',
        moduleTitleTh: 'ระบบรายงานของเสีย NCR & CAPA (NCR-01)',
        moduleTitleEn: 'Non-Conformance Report & CAPA System',
        inspector: newInspector.trim(),
        batchLot: `Coil: ${newCoilNo.trim()} (${newProfile.trim()})`,
        result: 'FAIL',
        defectCount: 1,
        remarks: `Manual NCR Created: ${newInspectionResult.slice(0, 40)}...`,
        coilNo: newCoilNo.trim(),
        profile: newProfile.trim(),
        process: newProcess,
        inspectionDate: newInspectionDate,
        inspectionResult: newInspectionResult.trim()
      });
    }

    showToast('success', isTh ? `ออกเอกสาร ${created.id} เข้าระบบ NCR-01 เรียบร้อยแล้ว` : `Issued ${created.id} into NCR-01 system successfully`);

    // Reset Form
    setNewCoilNo('');
    setNewProfile('');
    setNewInspectionResult('');
    setNewImmediateAction('');
    setNewRootCause('');
    setNewCorrectiveAction('');
    setNewPreventiveAction('');
    setNewAssignedTo('');
    setNewTargetClosureDate('');
    setActiveTab('LOG');
  };

  // Handle Save Edit Form
  const handleSaveEditNcr = () => {
    if (!selectedNcr) return;
    const updated = ncrList.map((item) => {
      if (item.id === selectedNcr.id) {
        return {
          ...item,
          ...editFormData
        } as NcrRecord;
      }
      return item;
    });
    setNcrList(updated);
    saveNcrRecords(updated);
    setSelectedNcr((prev) => (prev ? ({ ...prev, ...editFormData } as NcrRecord) : null));
    setIsEditingNcr(false);
    showToast('success', isTh ? 'บันทึกการแก้ไขข้อมูล NCR / CAPA สำเร็จ' : 'Saved NCR / CAPA modifications');
  };

  const getStatusBadge = (status: NcrStatus) => {
    switch (status) {
      case 'QUARANTINE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            QUARANTINE (กักกัน)
          </span>
        );
      case 'UNDER_INVESTIGATION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" />
            INVESTIGATING (ตรวจหาสาเหตุ)
          </span>
        );
      case 'CAPA_IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <Layers className="w-3.5 h-3.5" />
            CAPA ACTION (กำลังแก้ไข)
          </span>
        );
      case 'REWORK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-500/30">
            <RefreshCw className="w-3.5 h-3.5" />
            REWORK (ส่งปรับปรุง)
          </span>
        );
      case 'SCRAP':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 text-red-400 border border-red-800">
            <Trash2 className="w-3.5 h-3.5" />
            SCRAP (ทำลายทิ้ง)
          </span>
        );
      case 'CONCESSION':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <AlertOctagon className="w-3.5 h-3.5" />
            CONCESSION (ผ่อนผันพิเศษ)
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CLOSED (ปิดงานแล้ว)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: NcrSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-600 text-white tracking-wider">CRITICAL</span>;
      case 'MAJOR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 tracking-wider">MAJOR</span>;
      case 'MINOR':
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700 text-slate-200">MINOR</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-sm font-semibold animate-in fade-in slide-in-from-top-4 ${
          toastMsg.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' :
          toastMsg.type === 'error' ? 'bg-rose-950/90 text-rose-300 border-rose-500/40' :
          'bg-slate-900/90 text-slate-200 border-slate-700'
        }`}>
          {toastMsg.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {toastMsg.type === 'error' && <AlertOctagon className="w-5 h-5 text-rose-400" />}
          {toastMsg.type === 'info' && <HelpCircle className="w-5 h-5 text-cyan-400" />}
          <span>{toastMsg.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-4">
          <button
            onClick={onBackToPortal}
            className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white rounded-2xl border border-slate-700 transition"
            title={isTh ? 'กลับสู่หน้าหลัก QA Portal' : 'Back to QA Portal'}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                NCR-01
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {isTh ? 'ศูนย์จัดการของเสีย & การแก้ไข CAPA' : 'Non-Conformance Report (NCR) & CAPA Center'}
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {isTh 
                ? 'รวบรวมข้อมูลรายการ Fail / Out of Spec / NG อัตโนมัติจากทุกกระบวนการ แยกตาม Coil no., Profile, Inspection date, Inspector, Process และ Inspection result' 
                : 'Centralized non-conformance database automatically aggregated from all inspection stations separated by Coil no., Profile, Date, Inspector, Process & Out of Spec details.'}
            </p>
          </div>
        </div>

        {/* Top Action Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('LOG')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'LOG'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{isTh ? 'รายการของเสียทั้งหมด' : 'All NCR Records'} ({ncrList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CREATE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'CREATE'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isTh ? 'เปิดเอกสาร NCR ใหม่' : 'Issue New NCR'}</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 ${
              activeTab === 'ANALYTICS'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isTh ? 'สถิติ & Pareto' : 'Defect Pareto'}</span>
          </button>

          <button
            onClick={() => exportNcrToCsv(filteredList)}
            className="px-3 py-2.5 rounded-xl font-bold text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition flex items-center gap-1.5"
            title="Export CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400">{isTh ? 'รายการ NG / NCR รวม' : 'Total NCRs'}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-white">{stats.total}</span>
            <span className="text-[11px] text-slate-500">{isTh ? 'รายการ' : 'records'}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 rounded-2xl p-4 flex flex-col justify-between bg-rose-950/10">
          <span className="text-[11px] font-semibold text-rose-400">{isTh ? '🛑 กักกันสินค้า (Quarantine)' : '🛑 Quarantined Lots'}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-400">{stats.quarantined}</span>
            <span className="text-[10px] text-rose-400/80 uppercase font-bold">{isTh ? 'ห้ามเคลื่อนย้าย' : 'Hold'}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-4 flex flex-col justify-between bg-amber-950/10">
          <span className="text-[11px] font-semibold text-amber-300">{isTh ? '⏳ รอดำเนินการ / CAPA' : '⏳ In Investigation'}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-300">{stats.underInvest}</span>
            <span className="text-[10px] text-amber-400 font-bold">{isTh ? 'กำลังแก้ไข' : 'Active'}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl p-4 flex flex-col justify-between bg-emerald-950/10">
          <span className="text-[11px] font-semibold text-emerald-400">{isTh ? '✅ ปิดงานแล้ว (Closed)' : '✅ Closed CAPA'}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-400">{stats.closed}</span>
            <span className="text-[10px] text-emerald-400 font-mono">
              {stats.total > 0 ? `${Math.round((stats.closed / stats.total) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-rose-300">{isTh ? 'ความรุนแรง Critical' : 'Critical Defects'}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-rose-500">{stats.critical}</span>
            <span className="text-[10px] text-rose-400 font-bold">Priority #1</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-amber-300">{isTh ? 'ความรุนแรง Major' : 'Major Defects'}</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-400">{stats.major}</span>
            <span className="text-[10px] text-amber-400 font-bold">Priority #2</span>
          </div>
        </div>
      </div>

      {/* TAB 1: ALL NCR LOGS TABLE (With User-Requested Separated Dimensions) */}
      {activeTab === 'LOG' && (
        <div className="space-y-4">
          
          {/* Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTh ? 'ค้นหา Coil no., Profile, Inspector, Process, หรือรายละเอียด Out of Spec...' : 'Search Coil no., Profile, Inspector, Process or Defect description...'}
                className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Process Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{isTh ? 'กระบวนการ:' : 'Process:'}</span>
                <select
                  value={filterProcess}
                  onChange={(e) => setFilterProcess(e.target.value)}
                  className="bg-transparent text-xs text-rose-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">{isTh ? 'ทั้งหมด (All Processes)' : 'All Processes'}</option>
                  <option value="IPQC-07" className="bg-slate-900 text-white">IPQC-07 Thickness Wall</option>
                  <option value="IPQC-01" className="bg-slate-900 text-white">IPQC-01 Tensile Test</option>
                  <option value="IPQC-02" className="bg-slate-900 text-white">IPQC-02 Roughness</option>
                  <option value="IPQC-03" className="bg-slate-900 text-white">IPQC-03 X-Ray</option>
                  <option value="IPQC-04" className="bg-slate-900 text-white">IPQC-04 Coating</option>
                  <option value="IPQC-05" className="bg-slate-900 text-white">IPQC-05 Cutting</option>
                  <option value="IPQC-06" className="bg-slate-900 text-white">IPQC-06 Mixing</option>
                  <option value="IQC-01" className="bg-slate-900 text-white">IQC-01 Billet Incoming</option>
                  <option value="IQC-02" className="bg-slate-900 text-white">IQC-02 Chemical Incoming</option>
                  <option value="IQC-03" className="bg-slate-900 text-white">IQC-03 Zn Wire Incoming</option>
                  <option value="OQC-01" className="bg-slate-900 text-white">OQC-01 FG Shipment</option>
                  <option value="EQP-01" className="bg-slate-900 text-white">EQP-01 Metrology</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{isTh ? 'สถานะ:' : 'Status:'}</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent text-xs text-amber-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">{isTh ? 'ทุกสถานะ' : 'All Status'}</option>
                  <option value="QUARANTINE" className="bg-slate-900 text-rose-400">QUARANTINE</option>
                  <option value="UNDER_INVESTIGATION" className="bg-slate-900 text-amber-300">INVESTIGATING</option>
                  <option value="CAPA_IN_PROGRESS" className="bg-slate-900 text-indigo-300">CAPA ACTION</option>
                  <option value="REWORK" className="bg-slate-900 text-orange-300">REWORK</option>
                  <option value="SCRAP" className="bg-slate-900 text-red-400">SCRAP</option>
                  <option value="CONCESSION" className="bg-slate-900 text-purple-300">CONCESSION</option>
                  <option value="CLOSED" className="bg-slate-900 text-emerald-400">CLOSED</option>
                </select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{isTh ? 'ระดับ:' : 'Severity:'}</span>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="bg-transparent text-xs text-cyan-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">{isTh ? 'ทุกระดับ' : 'All Severity'}</option>
                  <option value="CRITICAL" className="bg-slate-900 text-rose-400">CRITICAL</option>
                  <option value="MAJOR" className="bg-slate-900 text-amber-300">MAJOR</option>
                  <option value="MINOR" className="bg-slate-900 text-slate-300">MINOR</option>
                </select>
              </div>
            </div>
          </div>

          {/* Main NCR Table with Separated Dimensions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span className="text-sm font-bold text-white tracking-wide">
                  {isTh ? 'ตารางแยกรายละเอียดของเสียตามมิติที่กำหนด (NCR Breakdown Table)' : 'Non-Conformance Detail Log by Dimension'}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {isTh ? `แสดงผล ${filteredList.length} จาก ${ncrList.length} รายการ` : `Showing ${filteredList.length} of ${ncrList.length} items`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-28">NCR No.</th>
                    <th className="py-3 px-4 min-w-[150px] text-rose-300">1. Coil no.</th>
                    <th className="py-3 px-4 min-w-[170px] text-indigo-300">2. Profile</th>
                    <th className="py-3 px-4 min-w-[140px] text-cyan-300">3. Inspection Date</th>
                    <th className="py-3 px-4 min-w-[140px] text-amber-300">4. Inspector</th>
                    <th className="py-3 px-4 min-w-[180px] text-purple-300">5. Process</th>
                    <th className="py-3 px-4 min-w-[280px] text-rose-400">6. Inspection Result / Out of Spec</th>
                    <th className="py-3 px-4 min-w-[140px]">Status</th>
                    <th className="py-3 px-4 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400/50" />
                          <p className="text-sm font-semibold text-slate-400">
                            {isTh ? 'ไม่พบรายการของเสียที่ตรงตามเงื่อนไข' : 'No Non-conformance records found'}
                          </p>
                          <p className="text-xs text-slate-600">
                            {isTh ? 'ระบบตรวจรับและผลิตทั้งหมดผ่านเกณฑ์มาตรฐานสมบูรณ์' : 'All incoming and in-process tests are currently within standard specifications.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedNcr(item)}
                      >
                        {/* NCR ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-400">
                          <div className="flex items-center gap-1.5">
                            <span>{item.id}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.id, item.id);
                              }}
                              className="text-slate-600 hover:text-slate-300 transition"
                              title="Copy ID"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <div className="mt-1">{getSeverityBadge(item.severity)}</div>
                        </td>

                        {/* 1. Coil no. */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span className="font-mono font-bold text-white text-sm bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                              {item.coilNo}
                            </span>
                          </div>
                        </td>

                        {/* 2. Profile */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-indigo-300">{item.profile}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{item.sourceModuleCode}</span>
                        </td>

                        {/* 3. Inspection date */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-slate-300 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{item.inspectionDate}</span>
                          </div>
                        </td>

                        {/* 4. Inspector */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-medium text-slate-200">{item.inspector}</span>
                          </div>
                        </td>

                        {/* 5. Process */}
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-1 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 max-w-[200px] truncate" title={item.process}>
                            {item.process}
                          </span>
                        </td>

                        {/* 6. Inspection result */}
                        <td className="py-3.5 px-4">
                          <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-2 text-rose-300 font-mono text-[11px] leading-relaxed">
                            {item.inspectionResult}
                          </div>
                          {item.immediateAction && (
                            <div className="text-[10px] text-slate-400 mt-1 truncate max-w-[280px]">
                              <span className="text-amber-400 font-semibold">{isTh ? 'มาตรการ:' : 'Action:'}</span> {item.immediateAction}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1.5">
                            {getStatusBadge(item.status)}
                            <div className="flex gap-1">
                              <select
                                value={item.status}
                                onChange={(e) => handleQuickStatusChange(item.id, e.target.value as NcrStatus)}
                                className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                              >
                                <option value="QUARANTINE">Set QUARANTINE</option>
                                <option value="UNDER_INVESTIGATION">Set INVESTIGATING</option>
                                <option value="CAPA_IN_PROGRESS">Set CAPA</option>
                                <option value="REWORK">Set REWORK</option>
                                <option value="SCRAP">Set SCRAP</option>
                                <option value="CONCESSION">Set CONCESSION</option>
                                <option value="CLOSED">Set CLOSED</option>
                              </select>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedNcr(item)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
                              title="View 8D Report Sheet"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteNcr(item.id)}
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-200 rounded-lg border border-rose-900/60 transition"
                              title="Delete NCR"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CREATE / ISSUE NEW MANUAL NCR FORM */}
      {activeTab === 'CREATE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {isTh ? 'ออกเอกสารแจ้งเตือนของเสีย NCR ใหม่ (Issue Non-Conformance Report)' : 'Issue New Non-Conformance Report (NCR)'}
                </h2>
                <p className="text-xs text-slate-400">
                  {isTh 
                    ? 'บันทึกรายการ Out of Spec หรือของเสียที่พบ พร้อมระบุ Coil no., Profile, Inspector, Process และรายละเอียดผลการตรวจสอบ'
                    : 'Log an out of spec issue with mandatory fields: Coil no., Profile, Date, Inspector, Process, and NG result.'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreateNcrSubmit} className="space-y-6">
            
            {/* Grid 1: Basic Identifiers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Coil no. */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>1. Coil no. / Lot / Batch <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={newCoilNo}
                  onChange={(e) => setNewCoilNo(e.target.value)}
                  placeholder="e.g. COIL-8805-C / HEAT-99420 / LOT-2026-A1"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl px-4 py-3 text-xs font-mono font-bold text-rose-300 focus:outline-none"
                />
              </div>

              {/* Profile */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>2. Profile / Part No. / Spec <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={newProfile}
                  onChange={(e) => setNewProfile(e.target.value)}
                  placeholder="e.g. Profile B-002 / Billet 6063 / CR-SS400"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-3 text-xs font-semibold text-white focus:outline-none"
                />
              </div>

              {/* Inspection Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>3. Inspection Date & Time <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={newInspectionDate}
                  onChange={(e) => setNewInspectionDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-3 text-xs font-mono text-cyan-300 focus:outline-none"
                />
              </div>

              {/* Inspector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>4. Inspector Name <span className="text-rose-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  value={newInspector}
                  onChange={(e) => setNewInspector(e.target.value)}
                  placeholder="e.g. Somchai P. (IPQC Lead)"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs font-semibold text-amber-200 focus:outline-none"
                />
              </div>

              {/* Process */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>5. Process / Inspection Station <span className="text-rose-500">*</span></span>
                </label>
                <select
                  value={newProcess}
                  onChange={(e) => setNewProcess(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-2xl px-4 py-3 text-xs font-semibold text-purple-200 focus:outline-none cursor-pointer"
                >
                  {PROCESS_OPTIONS.map((proc) => (
                    <option key={proc} value={proc} className="bg-slate-900 text-white">
                      {proc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inspection Result (Out of Spec details) */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>6. Inspection Result / Defect & Out of Spec Details <span className="text-rose-500">*</span></span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={newInspectionResult}
                  onChange={(e) => setNewInspectionResult(e.target.value)}
                  placeholder="e.g. FAIL / Out of Spec: Wall thickness T1 = 3.85 mm (Spec Max: 3.60 mm), OR dimension 16.9 mm > 16.5 mm. Exceeds standard tolerance."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-2xl px-4 py-3 text-xs font-mono text-rose-300 focus:outline-none"
                />
              </div>

            </div>

            {/* Grid 2: Severity, Status & Containment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Severity Level</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as NcrSeverity)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="CRITICAL" className="bg-slate-900 text-rose-400">CRITICAL (ส่งผลต่อลูกค้า/โครงสร้าง)</option>
                  <option value="MAJOR" className="bg-slate-900 text-amber-300">MAJOR (เกินเกณฑ์สเปกหลัก)</option>
                  <option value="MINOR" className="bg-slate-900 text-slate-300">MINOR (ข้อบกพร่องเล็กน้อย)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Initial Disposition Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as NcrStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="QUARANTINE" className="bg-slate-900 text-rose-400">QUARANTINE (กักกันพื้นที่ Q-Bay)</option>
                  <option value="UNDER_INVESTIGATION" className="bg-slate-900 text-amber-300">UNDER INVESTIGATION</option>
                  <option value="REWORK" className="bg-slate-900 text-orange-300">REWORK</option>
                  <option value="SCRAP" className="bg-slate-900 text-red-400">SCRAP</option>
                  <option value="CONCESSION" className="bg-slate-900 text-purple-300">CONCESSION</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Assigned Engineer (ผู้รับผิดชอบ)</label>
                <input
                  type="text"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  placeholder="e.g. Wichai T. (Tooling QA)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Immediate Action */}
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-bold text-slate-300">Immediate Containment Action (การกักกันสินค้าทันที)</label>
                <input
                  type="text"
                  value={newImmediateAction}
                  onChange={(e) => setNewImmediateAction(e.target.value)}
                  placeholder="e.g. ติดป้าย Red Tag กักกัน Coil no. ณ บริเวณ Quarantine Zone Q-2 ห้ามส่งต่อสายการผลิตถัดไป"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none"
                />
              </div>

            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('LOG')}
                className="px-6 py-3 rounded-2xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-8 py-3 rounded-2xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{isTh ? 'ออกเอกสารและบันทึก NCR' : 'Issue & Save NCR'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* TAB 3: ANALYTICS & DEFECT PARETO */}
      {activeTab === 'ANALYTICS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Defect Distribution by Process */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-rose-400" />
                <h3 className="text-sm font-bold text-white">
                  {isTh ? 'การกระจายของเสียตามกระบวนการ (Defect Distribution by Process)' : 'Defects by Process Station'}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">{stats.total} total NG</span>
            </div>

            <div className="space-y-3">
              {Object.entries(stats.byProcess).map(([proc, count]) => {
                const countNum = Number(count);
                const percent = stats.total > 0 ? Math.round((countNum / stats.total) * 100) : 0;
                return (
                  <div key={proc} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{proc}</span>
                      <span className="font-mono text-rose-400 font-bold">{countNum} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Disposition & CAPA Progress Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  {isTh ? 'สถานะการกักกันและการแก้ไข CAPA (Disposition & Status Breakdown)' : 'CAPA Status & Disposition'}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 border border-rose-900/30 rounded-2xl p-4 text-center">
                <span className="text-xs text-rose-400 font-bold">QUARANTINE</span>
                <p className="text-3xl font-black text-white mt-1">{stats.quarantined}</p>
                <span className="text-[10px] text-slate-500">{isTh ? 'สินค้าถูกล็อกห้ามจำหน่าย' : 'Locked in Q-Bay'}</span>
              </div>

              <div className="bg-slate-950 border border-amber-900/30 rounded-2xl p-4 text-center">
                <span className="text-xs text-amber-300 font-bold">IN PROGRESS</span>
                <p className="text-3xl font-black text-white mt-1">{stats.underInvest}</p>
                <span className="text-[10px] text-slate-500">{isTh ? 'กำลังวิเคราะห์ 5-Why' : '5-Why in progress'}</span>
              </div>

              <div className="bg-slate-950 border border-emerald-900/30 rounded-2xl p-4 text-center">
                <span className="text-xs text-emerald-400 font-bold">CLOSED CAPA</span>
                <p className="text-3xl font-black text-white mt-1">{stats.closed}</p>
                <span className="text-[10px] text-slate-500">{isTh ? 'ปิดสมบูรณ์' : 'Verified & Closed'}</span>
              </div>

              <div className="bg-slate-950 border border-indigo-900/30 rounded-2xl p-4 text-center">
                <span className="text-xs text-indigo-300 font-bold">CLOSURE RATE</span>
                <p className="text-3xl font-black text-indigo-400 mt-1">
                  {stats.total > 0 ? `${Math.round((stats.closed / stats.total) * 100)}%` : '0%'}
                </p>
                <span className="text-[10px] text-slate-500">{isTh ? 'อัตราปิดงานเฉลี่ย' : 'Target > 90%'}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 8D CAPA & NCR DETAIL MODAL */}
      {selectedNcr && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400">{selectedNcr.id}</span>
                    {getSeverityBadge(selectedNcr.severity)}
                    {getStatusBadge(selectedNcr.status)}
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {isTh ? 'รายงานวิเคราะห์ของเสีย & แบบฟอร์ม 8D CAPA' : '8D Non-Conformance & CAPA Problem Solving Sheet'}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
                  title="Print 8D Report"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedNcr(null);
                    setIsEditingNcr(false);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Highlighted 6 Separated Dimensions Grid */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Coil no. */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">1. Coil no. / Lot</span>
                  <div className="text-sm font-mono font-bold text-white bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    {selectedNcr.coilNo}
                  </div>
                </div>

                {/* 2. Profile */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">2. Profile / Part</span>
                  <div className="text-sm font-semibold text-indigo-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    {selectedNcr.profile}
                  </div>
                </div>

                {/* 3. Inspection Date */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">3. Inspection Date</span>
                  <div className="text-sm font-mono text-cyan-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    {selectedNcr.inspectionDate}
                  </div>
                </div>

                {/* 4. Inspector */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">4. Inspector</span>
                  <div className="text-sm font-semibold text-amber-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    {selectedNcr.inspector}
                  </div>
                </div>

                {/* 5. Process */}
                <div className="space-y-1 sm:col-span-2">
                  <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">5. Process / Station</span>
                  <div className="text-sm font-semibold text-purple-200 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    {selectedNcr.process}
                  </div>
                </div>

                {/* 6. Inspection Result / Out of Spec */}
                <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                  <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">6. Inspection Result (Out of Spec Details)</span>
                  <div className="text-xs font-mono text-rose-300 bg-rose-950/20 border border-rose-500/30 p-3 rounded-xl leading-relaxed">
                    {selectedNcr.inspectionResult}
                  </div>
                </div>

              </div>

              {/* 8D Problem Solving Matrix */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>8D CAPA Action & Investigation Details</span>
                </h4>

                {/* D3: Containment */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                  <span className="text-xs font-bold text-amber-400">D3: Immediate Containment Action (การกักกันสินค้า)</span>
                  {isEditingNcr ? (
                    <input
                      type="text"
                      value={editFormData.immediateAction ?? selectedNcr.immediateAction ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, immediateAction: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  ) : (
                    <p className="text-xs text-slate-300">{selectedNcr.immediateAction || 'No containment action logged.'}</p>
                  )}
                </div>

                {/* D4: Root Cause (5-Why) */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                  <span className="text-xs font-bold text-rose-400">D4: Root Cause Analysis (สาเหตุรากเหง้า 5-Why)</span>
                  {isEditingNcr ? (
                    <textarea
                      rows={2}
                      value={editFormData.rootCause ?? selectedNcr.rootCause ?? ''}
                      onChange={(e) => setEditFormData({ ...editFormData, rootCause: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  ) : (
                    <p className="text-xs text-slate-300">{selectedNcr.rootCause || 'Root cause investigation in progress.'}</p>
                  )}
                </div>

                {/* D5 & D7: Corrective & Preventive */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <span className="text-xs font-bold text-indigo-400">D5: Corrective Action (มาตรการแก้ไข)</span>
                    {isEditingNcr ? (
                      <textarea
                        rows={2}
                        value={editFormData.correctiveAction ?? selectedNcr.correctiveAction ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, correctiveAction: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    ) : (
                      <p className="text-xs text-slate-300">{selectedNcr.correctiveAction || 'Pending corrective plan.'}</p>
                    )}
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-1.5">
                    <span className="text-xs font-bold text-emerald-400">D7: Preventive Action (มาตรการป้องกันการเกิดซ้ำ)</span>
                    {isEditingNcr ? (
                      <textarea
                        rows={2}
                        value={editFormData.preventiveAction ?? selectedNcr.preventiveAction ?? ''}
                        onChange={(e) => setEditFormData({ ...editFormData, preventiveAction: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    ) : (
                      <p className="text-xs text-slate-300">{selectedNcr.preventiveAction || 'Pending preventive plan.'}</p>
                    )}
                  </div>
                </div>

                {/* Responsible & Target Date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Assigned To</span>
                    <p className="text-xs font-semibold text-white mt-1">{selectedNcr.assignedTo || '-'}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Target Date</span>
                    <p className="text-xs font-mono text-cyan-300 mt-1">{selectedNcr.targetClosureDate || '-'}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Closed Date</span>
                    <p className="text-xs font-mono text-emerald-400 mt-1">{selectedNcr.closedAt || 'Pending Closure'}</p>
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{isTh ? 'เปลี่ยนสถานะด่วน:' : 'Quick Status:'}</span>
                <select
                  value={selectedNcr.status}
                  onChange={(e) => {
                    handleQuickStatusChange(selectedNcr.id, e.target.value as NcrStatus);
                    setSelectedNcr({ ...selectedNcr, status: e.target.value as NcrStatus });
                  }}
                  className="bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none"
                >
                  <option value="QUARANTINE">QUARANTINE</option>
                  <option value="UNDER_INVESTIGATION">UNDER INVESTIGATION</option>
                  <option value="CAPA_IN_PROGRESS">CAPA IN PROGRESS</option>
                  <option value="REWORK">REWORK</option>
                  <option value="SCRAP">SCRAP</option>
                  <option value="CONCESSION">CONCESSION</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                {isEditingNcr ? (
                  <>
                    <button
                      onClick={() => setIsEditingNcr(false)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                    >
                      {isTh ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                      onClick={handleSaveEditNcr}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/20"
                    >
                      {isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditingNcr(true);
                      setEditFormData({
                        immediateAction: selectedNcr.immediateAction,
                        rootCause: selectedNcr.rootCause,
                        correctiveAction: selectedNcr.correctiveAction,
                        preventiveAction: selectedNcr.preventiveAction,
                        assignedTo: selectedNcr.assignedTo
                      });
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>{isTh ? 'แก้ไขรายละเอียด CAPA' : 'Edit CAPA Plan'}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
