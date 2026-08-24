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
  ChevronUp
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
  InspectionActivity 
} from '../types';

interface TensileMeasurementAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
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
    yield: 250.0,
    elong: 20.0
  },
  {
    id: 'spec-02',
    profile: 'CR-SS400',
    process: 'COLD_ROLL',
    min_w: 19.5,
    max_w: 20.5,
    min_h: 2.0,
    max_h: 2.5,
    tensile: 450.0,
    yield: 275.0,
    elong: 18.0
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
    yield: 320.0,
    elong: 15.0
  }
];

const INITIAL_RECORDS: TensileRecord[] = [
  {
    id: 'rec-001',
    coil_no: 'COIL-2026-A101',
    heat_no: 'HEAT-9812',
    profile: 'HR-A36',
    process: 'HOT_ROLL',
    machine: 'TENSILE-M01',
    inspector: 'Somchai P. (IPQC)',
    sample_name: 'SAMPLE-1A',
    width: 12.5,
    h_left: 3.2,
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
    profile: 'HR-A36',
    process: 'HOT_ROLL',
    machine: 'TENSILE-M01',
    inspector: 'Somchai P. (IPQC)',
    sample_name: 'SAMPLE-1B',
    width: 12.4,
    h_left: 3.1,
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
    profile: 'CR-SS400',
    process: 'COLD_ROLL',
    machine: 'TENSILE-M02',
    inspector: 'Kittisak N. (IPQC)',
    sample_name: 'SAMPLE-2A',
    width: 20.0,
    h_left: 2.2,
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
  language = 'th'
}) => {
  const isTh = language === 'th';
  const [activeTab, setActiveTab] = useState<'entry' | 'history' | 'dashboard' | 'specs'>('entry');

  // Quality Specs state
  const [specs, setSpecs] = useState<TensileQualitySpec[]>(() => {
    const saved = localStorage.getItem('tensile_qc_specs');
    return saved ? JSON.parse(saved) : DEFAULT_TENSILE_SPECS;
  });

  // Test Records state
  const [records, setRecords] = useState<TensileRecord[]>(() => {
    const saved = localStorage.getItem('tensile_qc_records');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  // Entry Form Header Fields
  const [mainProfile, setMainProfile] = useState('');
  const [mainProcess, setMainProcess] = useState('');
  const [mainMachine, setMainMachine] = useState('');
  const [mainInspector, setMainInspector] = useState('');

  // Entry Test Rows (Clean start for user input, no demo leftover)
  const [testRows, setTestRows] = useState<{
    coil_no: string;
    heat_no: string;
    sample_name: string;
    width: string;
    h_left: string;
    h_right: string;
    tensile: string;
    yield_val: string;
    elong: string;
  }[]>([
    {
      coil_no: '',
      heat_no: '',
      sample_name: '',
      width: '',
      h_left: '',
      h_right: '',
      tensile: '',
      yield_val: '',
      elong: ''
    }
  ]);

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

  // Save Specs to Local Storage
  useEffect(() => {
    localStorage.setItem('tensile_qc_specs', JSON.stringify(specs));
  }, [specs]);

  useEffect(() => {
    localStorage.setItem('tensile_qc_records', JSON.stringify(records));
  }, [records]);

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

  const handleResetForm = () => {
    setMainProfile('');
    setMainProcess('');
    setMainMachine('');
    setMainInspector('');
    setTestRows([
      {
        coil_no: '',
        heat_no: '',
        sample_name: '',
        width: '',
        h_left: '',
        h_right: '',
        tensile: '',
        yield_val: '',
        elong: ''
      }
    ]);
  };

  // Single Row Evaluator
  const evaluateRow = (row: typeof testRows[0]): 'PASS' | 'FAIL' | 'PENDING' => {
    if (!matchedSpec) return 'PENDING';
    const w = parseFloat(row.width);
    const hl = parseFloat(row.h_left);
    const hr = parseFloat(row.h_right);
    const t = parseFloat(row.tensile);
    const y = parseFloat(row.yield_val);
    const e = parseFloat(row.elong);

    if (isNaN(w) || isNaN(hl) || isNaN(hr) || isNaN(t) || isNaN(y) || isNaN(e)) {
      return 'PENDING';
    }

    const passDim = w >= matchedSpec.min_w && w <= matchedSpec.max_w &&
                    hl >= matchedSpec.min_h && hl <= matchedSpec.max_h &&
                    hr >= matchedSpec.min_h && hr <= matchedSpec.max_h;
    const passTest = t >= matchedSpec.tensile && y >= matchedSpec.yield && e >= matchedSpec.elong;

    return passDim && passTest ? 'PASS' : 'FAIL';
  };

  // Add Row in Entry
  const addTestRow = () => {
    setTestRows(prev => [
      ...prev,
      {
        coil_no: prev.length > 0 ? prev[prev.length - 1].coil_no : '',
        heat_no: prev.length > 0 ? prev[prev.length - 1].heat_no : '',
        sample_name: '',
        width: '',
        h_left: '',
        h_right: '',
        tensile: '',
        yield_val: '',
        elong: ''
      }
    ]);
  };

  const updateTestRow = (index: number, field: keyof typeof testRows[0], value: string) => {
    setTestRows(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const deleteTestRow = (index: number) => {
    setTestRows(prev => prev.filter((_, i) => i !== index));
  };

  // Save All Entry Rows
  const handleSaveAllRows = () => {
    if (!matchedSpec) {
      alert(isTh ? 'กรุณาระบุ Profile & Process ที่มีเกณฑ์ Spec ในระบบ' : 'Please specify a profile & process matching registered specs');
      return;
    }

    const newRecordsToSave: TensileRecord[] = [];
    const now = new Date();

    testRows.forEach((row, i) => {
      const w = parseFloat(row.width);
      const hl = parseFloat(row.h_left);
      const hr = parseFloat(row.h_right);
      const t = parseFloat(row.tensile);
      const y = parseFloat(row.yield_val);
      const e = parseFloat(row.elong);

      if (isNaN(w) || isNaN(t)) return;

      const decision = evaluateRow(row) === 'PASS' ? 'PASS' : 'FAIL';
      const recId = `rec-${Date.now()}-${i}`;

      const rec: TensileRecord = {
        id: recId,
        coil_no: row.coil_no.trim().toUpperCase() || 'COIL-UNTITLED',
        heat_no: row.heat_no.trim().toUpperCase() || 'HEAT-00',
        profile: matchedSpec.profile,
        process: matchedSpec.process,
        machine: mainMachine.trim().toUpperCase() || 'TENSILE-M01',
        inspector: mainInspector.trim() || 'IPQC Officer',
        sample_name: row.sample_name.trim().toUpperCase() || `SAMPLE-${i+1}`,
        width: w,
        h_left: hl,
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

      const inspectionResultText = decision === 'PASS' 
        ? `PASS (Tensile: ${t} MPa, Yield: ${y} MPa, Elong: ${e}%)` 
        : `FAIL / Out of Spec: Tensile ${t} MPa (Spec Min: ${matchedSpec.tensile}), Yield ${y} MPa (Spec Min: ${matchedSpec.yield}), Elongation ${e}% (Spec Min: ${matchedSpec.elong}%)`;

      if (onLogNewActivity) {
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQC-01',
          moduleTitleTh: 'การทดสอบแรงดึง (Tensile Measurement)',
          moduleTitleEn: 'Tensile Measurement & Quality Spec System',
          inspector: mainInspector.trim() || 'IPQC Officer',
          batchLot: `${matchedSpec.profile} - ${row.coil_no}`,
          result: decision === 'PASS' ? 'PASS' : 'REJECT',
          defectCount: decision === 'FAIL' ? 1 : 0,
          remarks: inspectionResultText,
          coilNo: row.coil_no || 'COIL-N/A',
          profile: matchedSpec.profile || 'CR-SPEC',
          process: `IPQC-01 Tensile (${mainProcess})`,
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
    setTestRows([
      {
        coil_no: '',
        heat_no: '',
        sample_name: '',
        width: '',
        h_left: '',
        h_right: '',
        tensile: '',
        yield_val: '',
        elong: ''
      }
    ]);

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
  const [newSpecForm, setNewSpecForm] = useState({
    profile: '',
    process: '',
    min_w: '',
    max_w: '',
    min_h: '',
    max_h: '',
    tensile: '',
    yield: '',
    elong: ''
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

    const newSpecObj: TensileQualitySpec = {
      id: `spec-${Date.now()}`,
      profile: cleanProfile,
      process: cleanProcess,
      min_w: parseFloat(newSpecForm.min_w) || 0,
      max_w: parseFloat(newSpecForm.max_w) || 0,
      min_h: parseFloat(newSpecForm.min_h) || 0,
      max_h: parseFloat(newSpecForm.max_h) || 0,
      tensile: parseFloat(newSpecForm.tensile) || 0,
      yield: parseFloat(newSpecForm.yield) || 0,
      elong: parseFloat(newSpecForm.elong) || 0
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
      tensile: '',
      yield: '',
      elong: ''
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
      tensile: '',
      yield: '',
      elong: ''
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
    return dashboardRecords.slice(-20).map((r, i) => ({
      index: i + 1,
      coil: r.coil_no,
      sample: r.sample_name,
      tensile: r.tensile,
      yield: r.yield,
      elong: r.elong,
      specTensile: matchedSpec?.tensile || 400,
      specYield: matchedSpec?.yield || 250,
      specElong: matchedSpec?.elong || 20
    }));
  }, [dashboardRecords, matchedSpec]);

  // Export CSV
  const exportHistoryCSV = () => {
    if (records.length === 0) return;
    let csv = "\uFEFFCoil No,Heat No,Profile,Process,Machine,Inspector,Sample,Width,H_Left,H_Right,Tensile(MPa),Yield(MPa),Elong(%),Decision,Timestamp\n";
    records.forEach(r => {
      csv += `"${r.coil_no}","${r.heat_no}","${r.profile}","${r.process}","${r.machine}","${r.inspector}","${r.sample_name}","${r.width}","${r.h_left}","${r.h_right}","${r.tensile}","${r.yield}","${r.elong}","${r.decision}","${r.timestamp}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Tensile_Measurement_History_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 space-y-6">

      {/* Admin Password Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Verification</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อเข้าสู่โหมดตั้งค่า Spec (admin2026)' : 'Please enter admin password to configure quality specs'}
              </p>
            </div>

            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-rose-400 text-xs font-semibold text-center mt-2">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password. Please try again.'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-cyan-500/20"
                >
                  {isTh ? 'ยืนยันรหัสผ่าน' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top Application Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Return to QA Portal"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-slate-950 shadow-lg shadow-cyan-500/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  IPQC-01
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'ระบบทดสอบแรงดึง (Tensile System)' : 'Tensile Measurement System'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh 
                  ? 'ตรวจสอบขนาด Dimension & ค่าแรงดึง Tensile / Yield / Elongation พร้อมระบบควบคุม Spec' 
                  : 'Quality Spec Control, Automated PASS/FAIL Judgment & Interactive Trend Dashboard'}
              </p>
            </div>
          </div>
        </div>

        {/* Engine status indicator */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Connected & Realtime Sync</span>
          </div>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('entry')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'entry'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
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
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isTh ? '📜 ประวัติข้อมูล' : 'History Log'}</span>
          {records.length > 0 && (
            <span className="ml-1 bg-slate-950 text-cyan-300 px-2 py-0.5 rounded-full text-[10px] font-mono border border-cyan-800">
              {records.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'dashboard'
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
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
              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '⚙️ ตั้งค่า Spec' : 'Quality Specs'}</span>
          {isAdminAuthenticated && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Process Name
                </label>
                <input
                  type="text"
                  value={mainProcess}
                  onChange={(e) => setMainProcess(e.target.value.toUpperCase())}
                  placeholder="HOT_ROLL / COLD_ROLL"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Machine Code
                </label>
                <input
                  type="text"
                  value={mainMachine}
                  onChange={(e) => setMainMachine(e.target.value.toUpperCase())}
                  placeholder="เช่น TENSILE-M01"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 uppercase"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  value={mainInspector}
                  onChange={(e) => setMainInspector(e.target.value)}
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ (Inspector)' : 'Inspector Name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {matchedSpec && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
                <div><span className="text-slate-500">Spec Width (W):</span> <strong className="text-cyan-300">{matchedSpec.min_w} - {matchedSpec.max_w} mm</strong></div>
                <div><span className="text-slate-500">Spec Height (H):</span> <strong className="text-cyan-300">{matchedSpec.min_h} - {matchedSpec.max_h} mm</strong></div>
                <div><span className="text-slate-500">Min Tensile:</span> <strong className="text-emerald-300">≥ {matchedSpec.tensile} MPa</strong></div>
                <div><span className="text-slate-500">Min Yield / Elong:</span> <strong className="text-amber-300">≥ {matchedSpec.yield} MPa / {matchedSpec.elong}%</strong></div>
              </div>
            )}
          </div>

          {/* Section 2: Test Result Rows Entry Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400" />
                {isTh ? '2. บันทึกผลการทดสอบชิ้นงาน (Tensile Test Results)' : '2. Measurement & Test Entry'}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                  title={isTh ? 'ล้างข้อมูลฟอร์มเริ่มต้นใหม่' : 'Reset Form'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTh ? 'ล้างฟอร์ม' : 'Reset'}</span>
                </button>

                <button
                  onClick={addTestRow}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>{isTh ? '+ เพิ่มรายการ' : 'Add Row'}</span>
                </button>

                <button
                  onClick={handleSaveAllRows}
                  disabled={!matchedSpec}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? '💾 บันทึกผลทั้งหมด' : 'Save All Results'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {testRows.map((row, idx) => {
                const status = evaluateRow(row);
                return (
                  <div key={idx} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Coil No. *</label>
                        <input
                          type="text"
                          value={row.coil_no}
                          onChange={(e) => updateTestRow(idx, 'coil_no', e.target.value)}
                          placeholder="COIL-01"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Heat No.</label>
                        <input
                          type="text"
                          value={row.heat_no}
                          onChange={(e) => updateTestRow(idx, 'heat_no', e.target.value)}
                          placeholder="HEAT-01"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500 uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Sample Name</label>
                        <input
                          type="text"
                          value={row.sample_name}
                          onChange={(e) => updateTestRow(idx, 'sample_name', e.target.value)}
                          placeholder={`SAMPLE-0${idx + 1}`}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-cyan-500 uppercase"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">W (mm)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={row.width}
                          onChange={(e) => updateTestRow(idx, 'width', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">H_Left</label>
                        <input
                          type="number"
                          step="0.01"
                          value={row.h_left}
                          onChange={(e) => updateTestRow(idx, 'h_left', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 block uppercase mb-1">H_Right</label>
                        <input
                          type="number"
                          step="0.01"
                          value={row.h_right}
                          onChange={(e) => updateTestRow(idx, 'h_right', e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-cyan-400 block uppercase mb-1">Tensile (MPa)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={row.tensile}
                          onChange={(e) => updateTestRow(idx, 'tensile', e.target.value)}
                          placeholder="MPa"
                          className="w-full bg-slate-900 border border-cyan-900/60 rounded-lg px-2 py-1.5 text-xs text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-emerald-400 block uppercase mb-1">Yield (MPa)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={row.yield_val}
                          onChange={(e) => updateTestRow(idx, 'yield_val', e.target.value)}
                          placeholder="MPa"
                          className="w-full bg-slate-900 border border-emerald-900/60 rounded-lg px-2 py-1.5 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-amber-400 block uppercase mb-1">Elong (%)</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={row.elong}
                            onChange={(e) => updateTestRow(idx, 'elong', e.target.value)}
                            placeholder="%"
                            className="w-full bg-slate-900 border border-amber-900/60 rounded-lg px-2 py-1.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                          />
                          {testRows.length > 1 && (
                            <button
                              onClick={() => deleteTestRow(idx)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Single Row Status */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900 text-xs">
                      <div className="text-[10px] text-slate-500">
                        Row #{idx + 1} Judgment Evaluation
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        status === 'PASS'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : status === 'FAIL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {status === 'PASS' ? '✓ PASS' : status === 'FAIL' ? '✕ FAIL / NG' : 'READY FOR INPUT'}
                      </span>
                    </div>
                  </div>
                );
              })}
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
                    <th className="px-4 py-3">Dimension (W / HL / HR)</th>
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
                        <span className="text-[10px] text-slate-500">{r.timestamp}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-200 block">{r.sample_name}</span>
                        <span className="text-[10px] text-slate-400">{r.profile} ({r.process})</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {r.width} / {r.h_left} / {r.h_right} mm
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
                      <ReferenceLine y={chartData[0]?.specTensile || 400} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min Spec', fill: '#ef4444', fontSize: 10 }} />
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
                      <ReferenceLine y={chartData[0]?.specYield || 250} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min Spec', fill: '#ef4444', fontSize: 10 }} />
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
                      <ReferenceLine y={chartData[0]?.specElong || 20} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Min Spec', fill: '#ef4444', fontSize: 10 }} />
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
                    ? 'จัดการ Profile Spec กลางสำหรับตัดสินผล Pass/Fail อัตโนมัติในโมดูล IPQC-01' 
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
                  <label className="text-[11px] font-bold text-slate-300 uppercase block mb-1">
                    {isTh ? 'ชื่อ Process Name' : 'Process Name'}
                  </label>
                  <input
                    type="text"
                    placeholder={isTh ? 'เช่น HOT_ROLL, COLD_ROLL, FORMING, EXTRUSION' : 'e.g. HOT_ROLL, COLD_ROLL, FORMING'}
                    value={newSpecForm.process}
                    onChange={(e) => setNewSpecForm({ ...newSpecForm, process: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-slate-200 placeholder-slate-600 uppercase focus:outline-none focus:border-cyan-400"
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

              {/* Row 3: Mechanical Strength Limits */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-cyan-900/50">
                  <label className="text-[10px] font-bold text-cyan-400 uppercase block mb-1">Min Tensile (MPa)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="เช่น 400"
                    value={newSpecForm.tensile}
                    onChange={(e) => setNewSpecForm({ ...newSpecForm, tensile: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-900/50">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Min Yield (MPa)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="เช่น 250"
                    value={newSpecForm.yield}
                    onChange={(e) => setNewSpecForm({ ...newSpecForm, yield: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-amber-900/50">
                  <label className="text-[10px] font-bold text-amber-400 uppercase block mb-1">Min Elongation (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="เช่น 20.0"
                    value={newSpecForm.elong}
                    onChange={(e) => setNewSpecForm({ ...newSpecForm, elong: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-bold text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                  />
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
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                            {spec.process || 'HOT_ROLL'}
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
                        <span className="text-slate-500 block text-[9px]">Tensile</span>
                        <span className="font-bold text-cyan-400">≥ {spec.tensile}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Yield</span>
                        <span className="font-bold text-emerald-400">≥ {spec.yield}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Elong</span>
                        <span className="font-bold text-amber-400">≥ {spec.elong}%</span>
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

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Process Name</label>
                  <input
                    type="text"
                    value={editingSpec.process}
                    onChange={(e) => setEditingSpec({ ...editingSpec, process: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500 uppercase"
                  />
                </div>
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

              {/* Strength values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-cyan-900/40">
                  <label className="text-[9px] font-bold text-cyan-400 uppercase block mb-1">Min Tensile (MPa)</label>
                  <input
                    type="number"
                    step="1"
                    value={editingSpec.tensile}
                    onChange={(e) => setEditingSpec({ ...editingSpec, tensile: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40">
                  <label className="text-[9px] font-bold text-emerald-400 uppercase block mb-1">Min Yield (MPa)</label>
                  <input
                    type="number"
                    step="1"
                    value={editingSpec.yield}
                    onChange={(e) => setEditingSpec({ ...editingSpec, yield: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-amber-900/40">
                  <label className="text-[9px] font-bold text-amber-400 uppercase block mb-1">Min Elong (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingSpec.elong}
                    onChange={(e) => setEditingSpec({ ...editingSpec, elong: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
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
                  ? 'กรอกรหัสผ่านเพื่อแก้ไขรายการตรวจรับ IPQC-01 (Password: admin2026)' 
                  : 'Enter password to edit IPQC-01 record (Password: admin2026)'}
              </p>
            </div>

            <form onSubmit={handleVerifyHistoryPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={historyAuthPassword}
                  onChange={(e) => setHistoryAuthPassword(e.target.value)}
                  placeholder="Password: admin2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {historyAuthError && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isTh ? 'รหัสผ่านไม่ถูกต้อง! (กรุณาใช้ admin2026)' : 'Incorrect password! (Use admin2026)'}</span>
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
                    {isTh ? 'แก้ไขข้อมูลการตรวจวัดแรงดึง (IPQC-01)' : 'Edit Tensile Measurement Record'}
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Width (mm)</label>
                    <input
                      type="number" step="0.1"
                      value={editingHistoryItem.width || 0}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, width: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">H Left (mm)</label>
                    <input
                      type="number" step="0.1"
                      value={editingHistoryItem.h_left || 0}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, h_left: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">H Right (mm)</label>
                    <input
                      type="number" step="0.1"
                      value={editingHistoryItem.h_right || 0}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, h_right: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tensile (MPa)</label>
                    <input
                      type="number" step="1"
                      value={editingHistoryItem.tensile || 0}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, tensile: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-cyan-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Yield (MPa)</label>
                    <input
                      type="number" step="1"
                      value={editingHistoryItem.yield || 0}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, yield: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Elongation (%)</label>
                    <input
                      type="number" step="0.1"
                      value={editingHistoryItem.elong || 0}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, elong: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs font-bold text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
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
