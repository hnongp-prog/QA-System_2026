import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  ArrowLeft, 
  Calendar, 
  Briefcase, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Download, 
  Printer, 
  ShieldCheck, 
  Clock, 
  Award, 
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  ChevronRight,
  Info,
  Check,
  X
} from 'lucide-react';
import { 
  QAInspector, 
  InspectorDepartment, 
  InspectorRole, 
  InspectorStatus, 
  Language, 
  ThemeMode 
} from '../types';
import { useQAInspectors, calculateTenure } from '../services/inspectorRoster';

interface QAInspectorAppProps {
  onBackToPortal: () => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const AVAILABLE_PROCESSES = [
  'Billet Incoming (IQA-01)',
  'Chemical COA (IQA-02)',
  'Zn Wire Incoming (IQA-03)',
  'Tensile Measurement (IPQA-01)',
  'Roughness Measurement (IPQA-02)',
  'X-Ray Film Thickness (IPQA-03)',
  'Coating Measurement (IPQA-04)',
  'Cutting Dimension (IPQA-05)',
  'Mixing Inspection (IPQA-06)',
  'Thickness Wall (IPQA-07)',
  'Billet Cutting (IPQA-08)',
  'FG Pre-Shipment (OQA-01)',
  'Calibration Lab (EQP-01)',
  'NCR & Defect Control (NCR-01)'
];

export const QAInspectorApp: React.FC<QAInspectorAppProps> = ({
  onBackToPortal,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  const { 
    inspectors, 
    activeInspectors, 
    addInspector, 
    updateInspector, 
    deleteInspector, 
    toggleStatus 
  } = useQAInspectors();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState<InspectorDepartment | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<InspectorStatus | 'ALL'>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInspector, setEditingInspector] = useState<QAInspector | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    empCode: string;
    name: string;
    nameEn: string;
    startDate: string;
    department: InspectorDepartment;
    role: InspectorRole;
    status: InspectorStatus;
    phone: string;
    email: string;
    certifiedProcesses: string[];
    notes: string;
  }>({
    empCode: '',
    name: '',
    nameEn: '',
    startDate: new Date().toISOString().split('T')[0],
    department: 'IPQA',
    role: 'INSPECTOR',
    status: 'ACTIVE',
    phone: '',
    email: '',
    certifiedProcesses: [],
    notes: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingInspector(null);
    setFormData({
      empCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      nameEn: '',
      startDate: new Date().toISOString().split('T')[0],
      department: 'IPQA',
      role: 'INSPECTOR',
      status: 'ACTIVE',
      phone: '',
      email: '',
      certifiedProcesses: [],
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (ins: QAInspector) => {
    setEditingInspector(ins);
    setFormData({
      empCode: ins.empCode,
      name: ins.name,
      nameEn: ins.nameEn || '',
      startDate: ins.startDate || new Date().toISOString().split('T')[0],
      department: ins.department,
      role: ins.role,
      status: ins.status,
      phone: ins.phone || '',
      email: ins.email || '',
      certifiedProcesses: ins.certifiedProcesses || [],
      notes: ins.notes || ''
    });
    setIsModalOpen(true);
  };

  // Save (Create / Update)
  const handleSaveInspector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(isTh ? 'กรุณากรอกชื่อ-นามสกุลพนักงาน' : 'Please enter inspector name');
      return;
    }
    if (!formData.empCode.trim()) {
      alert(isTh ? 'กรุณากรอกรหัสพนักงาน' : 'Please enter employee ID');
      return;
    }
    if (!formData.startDate) {
      alert(isTh ? 'กรุณาระบุวันที่เริ่มทำงาน' : 'Please select start date');
      return;
    }

    if (editingInspector) {
      updateInspector(editingInspector.id, {
        empCode: formData.empCode.trim().toUpperCase(),
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim(),
        startDate: formData.startDate,
        department: formData.department,
        role: formData.role,
        status: formData.status,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        certifiedProcesses: formData.certifiedProcesses,
        notes: formData.notes.trim()
      });
      showToast(isTh ? `อัปเดตข้อมูล ${formData.name} เรียบร้อยแล้ว` : `Updated ${formData.name} successfully`);
    } else {
      addInspector({
        empCode: formData.empCode.trim().toUpperCase(),
        name: formData.name.trim(),
        nameEn: formData.nameEn.trim(),
        startDate: formData.startDate,
        department: formData.department,
        role: formData.role,
        status: formData.status,
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        certifiedProcesses: formData.certifiedProcesses,
        notes: formData.notes.trim()
      });
      showToast(isTh ? `เพิ่มพนักงาน ${formData.name} เรียบร้อยแล้ว (ซิงค์ไปยัง IQA, IPQA, OQA ทันที)` : `Added inspector ${formData.name}`);
    }

    setIsModalOpen(false);
  };

  // Select all certified processes toggle
  const isAllProcessesSelected = formData.certifiedProcesses.length === AVAILABLE_PROCESSES.length && AVAILABLE_PROCESSES.length > 0;

  const handleToggleSelectAllProcesses = () => {
    if (isAllProcessesSelected) {
      setFormData(prev => ({ ...prev, certifiedProcesses: [] }));
    } else {
      setFormData(prev => ({ ...prev, certifiedProcesses: [...AVAILABLE_PROCESSES] }));
    }
  };

  // Delete
  const handleDeleteInspector = (id: string) => {
    deleteInspector(id);
    setDeleteConfirmId(null);
    showToast(isTh ? 'ลบข้อมูลผู้ตรวจสอบออกจากระบบเรียบร้อยแล้ว' : 'Inspector removed from system');
  };

  // Filtered List
  const filteredInspectors = useMemo(() => {
    return inspectors.filter(ins => {
      // Dept filter
      if (deptFilter !== 'ALL' && ins.department !== deptFilter && ins.department !== 'QA_ALL') {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && ins.status !== statusFilter) {
        return false;
      }
      // Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const mName = ins.name.toLowerCase().includes(q);
        const mNameEn = ins.nameEn?.toLowerCase().includes(q) || false;
        const mCode = ins.empCode.toLowerCase().includes(q);
        const mDept = ins.department.toLowerCase().includes(q);
        const mRole = ins.role.toLowerCase().includes(q);
        const mPhone = ins.phone?.toLowerCase().includes(q) || false;
        return mName || mNameEn || mCode || mDept || mRole || mPhone;
      }
      return true;
    });
  }, [inspectors, deptFilter, statusFilter, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = inspectors.length;
    const active = inspectors.filter(i => i.status === 'ACTIVE').length;
    const iqaCount = inspectors.filter(i => i.department === 'IQA' && i.status === 'ACTIVE').length;
    const ipqaCount = inspectors.filter(i => i.department === 'IPQA' && i.status === 'ACTIVE').length;
    const oqaCount = inspectors.filter(i => i.department === 'OQA' && i.status === 'ACTIVE').length;
    
    // Find newest hire
    let newest = '-';
    if (inspectors.length > 0) {
      const sortedByDate = [...inspectors].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
      if (sortedByDate[0]) {
        newest = `${sortedByDate[0].name} (${sortedByDate[0].startDate})`;
      }
    }

    return { total, active, iqaCount, ipqaCount, oqaCount, newest };
  }, [inspectors]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['รหัสพนักงาน', 'ชื่อ-นามสกุล', 'English Name', 'วันที่เริ่มงาน', 'อายุงาน', 'แผนก/สายงาน', 'ตำแหน่ง', 'สถานะ', 'เบอร์โทร', 'อีเมล', 'กระบวนการที่รับรอง'];
    const rows = filteredInspectors.map(i => [
      i.empCode,
      i.name,
      i.nameEn || '',
      i.startDate,
      calculateTenure(i.startDate, true),
      i.department,
      i.role,
      i.status === 'ACTIVE' ? 'ปฏิบัติงาน (Active)' : 'พักงาน/ลาออก (Inactive)',
      i.phone || '',
      i.email || '',
      (i.certifiedProcesses || []).join('; ')
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QA_Inspectors_Roster_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(isTh ? 'ส่งออกไฟล์ CSV รายชื่อพนักงานสำเร็จ' : 'Exported inspectors to CSV');
  };

  // Print Roster
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[200] bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors ${
        isLight ? 'bg-white/90 border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToPortal}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{isTh ? 'กลับสู่หน้าหลัก QA' : 'Back to Portal'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
                    INS-01
                  </span>
                  <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                    {isTh ? 'ระบบจัดการผู้ตรวจสอบคุณภาพ (QA Inspector)' : 'QA Inspector Management'}
                  </h1>
                </div>
                <p className={`text-[11px] truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isTh 
                    ? 'เพิ่มรายชื่อพนักงาน, รหัส, วันที่เริ่มงาน และซิงค์ชื่อไปยังทุกแอปย่อย IQA, IPQA, OQA แบบเรียลไทม์' 
                    : 'Manage QA inspector roster with real-time sync across all IQA, IPQA, and OQA modules'}
                </p>
              </div>
            </div>
          </div>

          {/* Right action controls */}
          <div className="flex items-center gap-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                title="Toggle Theme"
                className={`p-2 rounded-xl border transition ${
                  isLight ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
              >
                {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
              </button>
            )}

            <button
              onClick={handleOpenCreateModal}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isTh ? '+ เพิ่มผู้ตรวจสอบใหม่' : '+ Add Inspector'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 flex-1 w-full">
        {/* KPI & Department Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total Staff */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}>
            <span className={`text-[11px] font-bold block uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isTh ? 'พนักงานทั้งหมด' : 'Total Staff'}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono">{metrics.total}</span>
              <span className={`text-[11px] font-bold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>ท่าน</span>
            </div>
          </div>

          {/* Active Staff */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-emerald-50/60 border-emerald-200 shadow-xs' : 'bg-emerald-950/20 border-emerald-500/30'
          }`}>
            <span className="text-[11px] font-bold block uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {isTh ? 'กำลังปฏิบัติงาน' : 'Active On-Duty'}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">{metrics.active}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 font-bold text-emerald-600 dark:text-emerald-300">
                100% Sync
              </span>
            </div>
          </div>

          {/* IQA Staff */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-blue-50/60 border-blue-200 shadow-xs' : 'bg-blue-950/20 border-blue-500/30'
          }`}>
            <span className="text-[11px] font-bold block uppercase tracking-wider text-blue-600 dark:text-blue-400">
              IQA Incoming
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-blue-600 dark:text-blue-400">{metrics.iqaCount}</span>
              <span className="text-[10px] text-blue-500 font-semibold">IQA-01..03</span>
            </div>
          </div>

          {/* IPQA Staff */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-amber-50/60 border-amber-200 shadow-xs' : 'bg-amber-950/20 border-amber-500/30'
          }`}>
            <span className="text-[11px] font-bold block uppercase tracking-wider text-amber-600 dark:text-amber-400">
              IPQA In-Process
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">{metrics.ipqaCount}</span>
              <span className="text-[10px] text-amber-500 font-semibold">IPQA-01..08</span>
            </div>
          </div>

          {/* OQA Staff */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-indigo-50/60 border-indigo-200 shadow-xs' : 'bg-indigo-950/20 border-indigo-500/30'
          }`}>
            <span className="text-[11px] font-bold block uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              OQA Outgoing
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{metrics.oqaCount}</span>
              <span className="text-[10px] text-indigo-500 font-semibold">OQA-01 Pre-Ship</span>
            </div>
          </div>

          {/* Realtime Live Sync Status */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isLight ? 'bg-cyan-50/60 border-cyan-200 shadow-xs' : 'bg-cyan-950/20 border-cyan-500/30'
          }`}>
            <span className="text-[11px] font-bold block uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              {isTh ? 'การเชื่อมโยงระบบ' : 'Cloud Sync'}
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Real-time</span>
              </div>
              <span className="text-[10px] text-cyan-500 font-semibold">ทุกอุปกรณ์</span>
            </div>
          </div>
        </div>

        {/* Integration Notification Banner */}
        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          isLight
            ? 'bg-blue-50/80 border-blue-200 text-blue-900'
            : 'bg-blue-950/30 border-blue-500/30 text-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-500 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">
                {isTh 
                  ? '🔗 รายชื่อผู้ตรวจสอบเชื่อมโยงกับทุกแอปย่อย IQA, IPQA, และ OQA โดยอัตโนมัติ' 
                  : '🔗 Live Inspector Roster connected to all IQA, IPQA, and OQA modules'}
              </h3>
              <p className="text-[11px] opacity-80 mt-0.5">
                {isTh
                  ? 'เมื่อเพิ่มหรือแก้ไขรายชื่อที่นี่ ในช่อง Inspector Name ของแอป Billet, Chemical, Tensile, Coating, Cutting, FG Pre-Shipment ฯลฯ จะมีรายชื่อนี้ให้เลือกใช้งานได้ทันที'
                  : 'Whenever you add or update inspectors here, they appear immediately in all inspector dropdown selectors across the system.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleExportCSV}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isTh ? 'ส่งออก CSV' : 'Export'}</span>
            </button>
            <button
              onClick={handlePrint}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isTh ? 'พิมพ์' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={isTh ? 'ค้นหาชื่อพนักงาน, รหัส, สายงาน, หรือเบอร์โทร...' : 'Search inspector name, employee ID, role...'}
                className={`w-full rounded-xl pl-9 pr-8 py-2 text-xs font-medium focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                    : 'bg-slate-950 border border-slate-800 text-white focus:border-cyan-500'
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
              <span className={`text-[10px] font-bold uppercase shrink-0 mr-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh ? 'แผนก:' : 'Dept:'}
              </span>
              {(['ALL', 'IQA', 'IPQA', 'OQA'] as const).map(dept => {
                const isSelected = deptFilter === dept;
                return (
                  <button
                    key={dept}
                    onClick={() => setDeptFilter(dept)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                      isSelected
                        ? isLight
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                        : isLight
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200 border-slate-700'
                    }`}
                  >
                    {dept === 'ALL' ? (isTh ? 'ทุกแผนก' : 'All') : dept}
                  </button>
                );
              })}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 shrink-0">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(st => {
                const isSelected = statusFilter === st;
                return (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
                      isSelected
                        ? st === 'ACTIVE'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'INACTIVE'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : isLight ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-200 text-slate-950 border-white'
                        : isLight
                          ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {st === 'ALL' ? (isTh ? 'ทุกสถานะ' : 'All Status') :
                     st === 'ACTIVE' ? (isTh ? 'ปฏิบัติงาน' : 'Active') : (isTh ? 'พักงาน' : 'Inactive')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspectors Table / Cards */}
        <div className={`rounded-2xl border overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className={`border-b uppercase text-[10px] font-bold tracking-wider ${
                isLight ? 'bg-slate-50 text-slate-500 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <tr>
                  <th className="p-3.5 pl-5">รหัสพนักงาน (ID)</th>
                  <th className="p-3.5">ชื่อ-นามสกุล (Inspector Name)</th>
                  <th className="p-3.5 text-center">แผนก / สายงาน</th>
                  <th className="p-3.5">ตำแหน่ง (Role)</th>
                  <th className="p-3.5">วันที่เริ่มทำงาน / อายุงาน</th>
                  <th className="p-3.5">กระบวนการที่ผ่านการรับรอง</th>
                  <th className="p-3.5 text-center">สถานะ</th>
                  <th className="p-3.5 pr-5 text-center">จัดการ</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredInspectors.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <Users className="w-8 h-8 mx-auto text-slate-500 opacity-60" />
                        <p className="font-bold text-sm">ไม่พบรายชื่อผู้ตรวจสอบ</p>
                        <p className="text-xs">ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม "+ เพิ่มผู้ตรวจสอบใหม่" เพื่อบันทึกพนักงาน</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInspectors.map((ins) => {
                    const tenure = calculateTenure(ins.startDate, isTh);
                    const isActive = ins.status === 'ACTIVE';

                    return (
                      <tr 
                        key={ins.id}
                        className={`transition-colors ${
                          !isActive 
                            ? 'opacity-60 bg-slate-50/50 dark:bg-slate-950/40' 
                            : isLight 
                              ? 'hover:bg-slate-50' 
                              : 'hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Employee ID Code */}
                        <td className="p-3.5 pl-5">
                          <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border ${
                            isLight 
                              ? 'bg-slate-100 text-slate-900 border-slate-300' 
                              : 'bg-slate-950 text-cyan-400 border-slate-800'
                          }`}>
                            {ins.empCode}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              ins.department === 'IQA'
                                ? 'bg-blue-500/20 text-blue-500'
                                : ins.department === 'IPQA'
                                  ? 'bg-amber-500/20 text-amber-500'
                                  : 'bg-indigo-500/20 text-indigo-500'
                            }`}>
                              {ins.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                <span>{ins.name}</span>
                              </div>
                              {ins.nameEn && (
                                <div className="text-[11px] text-slate-400 font-sans">
                                  {ins.nameEn}
                                </div>
                              )}
                              {ins.phone && (
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{ins.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black inline-block border ${
                            ins.department === 'IQA'
                              ? isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : ins.department === 'IPQA'
                                ? isLight ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : ins.department === 'OQA'
                                  ? isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                  : isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {ins.department}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="p-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                          {ins.role === 'SR_INSPECTOR' ? 'Senior Inspector' :
                           ins.role === 'QA_ENGINEER' ? 'QA Engineer' :
                           ins.role === 'SUPERVISOR' ? 'QA Supervisor' : 'QA Inspector'}
                        </td>

                        {/* Start Date & Tenure */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-mono font-bold">
                            <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                            <span>{ins.startDate}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>อายุงาน: <b className="text-slate-600 dark:text-slate-300">{tenure}</b></span>
                          </div>
                        </td>

                        {/* Certified Skills */}
                        <td className="p-3.5 max-w-xs">
                          {ins.certifiedProcesses && ins.certifiedProcesses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {ins.certifiedProcesses.slice(0, 3).map((proc, idx) => (
                                <span 
                                  key={idx}
                                  className={`text-[9px] px-1.5 py-0.5 rounded font-medium truncate max-w-[130px] border ${
                                    isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-950 text-slate-300 border-slate-800'
                                  }`}
                                  title={proc}
                                >
                                  {proc}
                                </span>
                              ))}
                              {ins.certifiedProcesses.length > 3 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                  +{ins.certifiedProcesses.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Status Toggle */}
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleStatus(ins.id)}
                            title={isActive ? 'คลิกเพื่อเปลี่ยนสถานะเป็น ไม่ปฏิบัติงาน' : 'คลิกเพื่อเปิดใช้งาน'}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 transition-all ${
                              isActive
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700 hover:bg-slate-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            <span>{isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(ins)}
                              title={isTh ? 'แก้ไขข้อมูลพนักงาน' : 'Edit inspector'}
                              className={`p-1.5 rounded-lg transition ${
                                isLight 
                                  ? 'hover:bg-slate-200 text-slate-600' 
                                  : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {deleteConfirmId === ins.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteInspector(ins.id)}
                                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-500"
                                >
                                  ลบ
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-bold text-[10px]"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(ins.id)}
                                title={isTh ? 'ลบผู้ตรวจสอบ' : 'Delete inspector'}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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

        {/* Integration Architecture Guide */}
        <div className={`p-6 rounded-3xl border space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-xl">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold">
                {isTh ? 'การส่งต่อรายชื่อพนักงานเข้าสู่ทุกแอปย่อย (Roster Auto-Population Architecture)' : 'System-wide Inspector Integration'}
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-500">
              Active Sync: 12 Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-blue-50/50 border-blue-200' : 'bg-blue-950/20 border-blue-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-600 dark:text-blue-400">1. IQA Sub-Apps</span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 font-mono text-[10px] font-bold">Connected</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                รองรับใน <b>IQA-01 Billet Incoming</b>, <b>IQA-02 Chemical COA</b>, และ <b>IQA-03 Zn Wire Incoming</b> โดยผู้ตรวจสามารถเลือกชื่อตนเองได้ทันที
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-amber-50/50 border-amber-200' : 'bg-amber-950/20 border-amber-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-600 dark:text-amber-400">2. IPQA Sub-Apps</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-500 font-mono text-[10px] font-bold">Connected</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                รองรับใน <b>IPQA-01 Tensile</b>, <b>IPQA-02 Roughness</b>, <b>IPQA-03 X-Ray</b>, <b>IPQA-04 Coating</b>, <b>IPQA-05 Dimension</b>, <b>IPQA-06 Mixing</b>, <b>IPQA-07 Thickness</b>, <b>IPQA-08 Billet Cutting</b>
              </p>
            </div>

            <div className={`p-4 rounded-2xl border space-y-2 ${
              isLight ? 'bg-indigo-50/50 border-indigo-200' : 'bg-indigo-950/20 border-indigo-900/50'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">3. OQA Sub-Apps</span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-500 font-mono text-[10px] font-bold">Connected</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-[11px]">
                รองรับใน <b>OQA-01 FG Pre-Shipment Label Checker</b> พร้อมแสดงชื่อผู้ตรวจสอบบนใบ Inspection Certificate และ QR Identification Tag
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {editingInspector 
                      ? (isTh ? 'แก้ไขข้อมูลผู้ตรวจสอบคุณภาพ' : 'Edit QA Inspector') 
                      : (isTh ? 'เพิ่มพนักงานตรวจคุณภาพใหม่ (Add QA Inspector)' : 'Add New QA Inspector')}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isTh ? 'ข้อมูลนี้จะถูกซิงค์ไปยัง Dropdown ผู้ตรวจในทุกแอป IQA, IPQA, OQA' : 'Synchronized into all sub-app inspector selection lists'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveInspector} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Row 1: Employee Code & Start Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'รหัสพนักงาน (Employee ID) *' : 'Employee ID *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.empCode}
                    onChange={(e) => setFormData({ ...formData, empCode: e.target.value.toUpperCase() })}
                    placeholder="เช่น EMP-101, QA-005"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'วันที่เริ่มทำงาน (Start Work Date) *' : 'Start Work Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                  {formData.startDate && (
                    <span className="text-[10px] text-cyan-500 mt-1 block">
                      อายุงานปัจจุบัน: {calculateTenure(formData.startDate, isTh)}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Name Thai & English */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'ชื่อ-นามสกุล (ไทย) *' : 'Full Name (Thai) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="เช่น สมชาย สุขเกษม"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'ชื่อภาษาอังกฤษ (English Name)' : 'English Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    placeholder="e.g. Somchai Sukkasem"
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              {/* Row 3: Department, Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'แผนก/สายงาน (Department) *' : 'Department *'}
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value as InspectorDepartment })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  >
                    <option value="IQA">IQA - Incoming Quality</option>
                    <option value="IPQA">IPQA - In-Process Quality</option>
                    <option value="OQA">OQA - Outgoing Quality</option>
                    <option value="QA_ALL">QA All - ทุกสายงาน</option>
                    <option value="METROLOGY">Metrology - ห้องปฏิบัติการ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'ตำแหน่ง (Role)' : 'Role'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as InspectorRole })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  >
                    <option value="INSPECTOR">QA Inspector (ผู้ตรวจสอบ)</option>
                    <option value="SR_INSPECTOR">Senior Inspector (หัวหน้ากะตรวจ)</option>
                    <option value="QA_ENGINEER">QA Engineer (วิศวกรคุณภาพ)</option>
                    <option value="SUPERVISOR">QA Supervisor (หัวหน้างาน)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'สถานะการทำงาน' : 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as InspectorStatus })}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-bold focus:outline-none border ${
                      formData.status === 'ACTIVE'
                        ? 'text-emerald-500'
                        : 'text-rose-500'
                    } ${
                      isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <option value="ACTIVE">ACTIVE (ปฏิบัติงาน)</option>
                    <option value="INACTIVE">INACTIVE (พักงาน/ลาออก)</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'เบอร์โทรศัพท์ติดต่อ' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="เช่น 081-234-5678"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold block mb-1">
                    {isTh ? 'อีเมล (Email)' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="inspector@company.com"
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                        : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                    }`}
                  />
                </div>
              </div>

              {/* Row 5: Certified Processes (Checkboxes) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold flex items-center gap-1.5">
                    <span>{isTh ? 'กระบวนการ/ทักษะที่ผ่านการรับรอง' : 'Certified QA Skills'}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      formData.certifiedProcesses.length > 0
                        ? isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-300'
                        : isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {formData.certifiedProcesses.length} / {AVAILABLE_PROCESSES.length}
                    </span>
                  </label>

                  {/* Select All Checkbox */}
                  <label className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition select-none border ${
                    isAllProcessesSelected
                      ? isLight
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                      : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}>
                    <input
                      type="checkbox"
                      checked={isAllProcessesSelected}
                      onChange={handleToggleSelectAllProcesses}
                      className="rounded text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>{isTh ? 'เลือกทั้งหมด (Select All)' : 'Select All'}</span>
                  </label>
                </div>
                <div className={`p-3 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  {AVAILABLE_PROCESSES.map((proc) => {
                    const isChecked = formData.certifiedProcesses.includes(proc);
                    return (
                      <label 
                        key={proc}
                        className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition select-none ${
                          isChecked 
                            ? isLight ? 'bg-cyan-100/70 text-cyan-900 font-bold' : 'bg-cyan-950/60 text-cyan-300 font-bold' 
                            : 'hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, certifiedProcesses: [...formData.certifiedProcesses, proc] });
                            } else {
                              setFormData({ ...formData, certifiedProcesses: formData.certifiedProcesses.filter(p => p !== proc) });
                            }
                          }}
                          className="rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span className="truncate">{proc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Notes */}
              <div>
                <label className="text-xs font-bold block mb-1">
                  {isTh ? 'หมายเหตุเพิ่มเติม (Notes)' : 'Notes'}
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={isTh ? 'หมายเหตุ หรือข้อมูลเพิ่มเติม...' : 'Additional notes...'}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                      : 'bg-slate-950 border-slate-800 text-white focus:border-cyan-500'
                  }`}
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingInspector ? (isTh ? 'บันทึกการแก้ไข' : 'Save Changes') : (isTh ? 'บันทึกพนักงานใหม่' : 'Create Inspector')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
