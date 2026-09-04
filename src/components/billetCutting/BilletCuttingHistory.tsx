import React, { useState, useMemo } from 'react';
import { 
  History, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Edit3, 
  Lock, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  X, 
  Calendar, 
  AlertCircle,
  Scissors,
  Save,
  Filter,
  RefreshCw
} from 'lucide-react';
import { BilletCuttingRecord, Language } from '../../types';
import { ADMIN_PASSWORD, checkAdminPassword } from './mockBilletData';

interface BilletCuttingHistoryProps {
  records: BilletCuttingRecord[];
  onUpdateRecords: (records: BilletCuttingRecord[]) => void;
  language?: Language;
}

export const BilletCuttingHistory: React.FC<BilletCuttingHistoryProps> = ({
  records,
  onUpdateRecords,
  language = 'th'
}) => {
  const isTh = language === 'th';

  // Current Month & Year for Default Filter
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

  // Month / Year filter states (Default to Current Month to keep data light as requested)
  const [filterMonthMode, setFilterMonthMode] = useState<'CURRENT_MONTH' | 'ALL_TIME' | 'CUSTOM'>('CURRENT_MONTH');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');

  // Detail Modal
  const [viewingRecord, setViewingRecord] = useState<BilletCuttingRecord | null>(null);

  // Security Auth Modal for Edit/Delete
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authAction, setAuthAction] = useState<'EDIT' | 'DELETE' | null>(null);
  const [targetRecordId, setTargetRecordId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [authError, setAuthError] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Record Modal
  const [editingRecord, setEditingRecord] = useState<BilletCuttingRecord | null>(null);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const dateStr = r.header.date || r.timestamp?.split(' ')[0] || '';
      const [y, m] = dateStr.split('-');

      // Month filtering
      if (filterMonthMode === 'CURRENT_MONTH') {
        if (y !== currentYear || m !== currentMonth) return false;
      } else if (filterMonthMode === 'CUSTOM') {
        if (selectedYear !== 'ALL' && y !== selectedYear) return false;
        if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && r.overallJudgement !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const lotMatch = r.header.lotNo?.toLowerCase().includes(q);
        const inspMatch = r.header.inspectorName?.toLowerCase().includes(q);
        const shiftMatch = r.header.shift?.toLowerCase().includes(q);
        const idMatch = r.id.toLowerCase().includes(q);
        const itemMatch = r.items.some(
          item => 
            item.billetGrade?.toLowerCase().includes(q) ||
            item.heatNo?.toLowerCase().includes(q) ||
            item.supplier?.toLowerCase().includes(q)
        );
        if (!lotMatch && !inspMatch && !shiftMatch && !idMatch && !itemMatch) return false;
      }

      return true;
    });
  }, [records, filterMonthMode, selectedYear, selectedMonth, currentYear, currentMonth, statusFilter, searchQuery]);

  // Auth Handler
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(passwordInput)) {
      setIsAuthModalOpen(false);
      setPasswordInput('');
      setAuthError(false);

      if (authAction === 'DELETE' && targetRecordId) {
        const updated = records.filter(r => r.id !== targetRecordId);
        onUpdateRecords(updated);
        setToastMessage(isTh ? `ลบข้อมูลรายการ ${targetRecordId} สำเร็จเรียบร้อยแล้ว` : `Record ${targetRecordId} deleted successfully`);
        setTimeout(() => setToastMessage(null), 3500);
      } else if (authAction === 'EDIT' && targetRecordId) {
        const found = records.find(r => r.id === targetRecordId);
        if (found) {
          setEditingRecord(JSON.parse(JSON.stringify(found))); // deep clone
        }
      }
    } else {
      setAuthError(true);
    }
  };

  const triggerAuth = (action: 'EDIT' | 'DELETE', id: string) => {
    setAuthAction(action);
    setTargetRecordId(id);
    setPasswordInput('');
    setAuthError(false);
    setIsAuthModalOpen(true);
  };

  // Save Edited Record
  const handleSaveEditedRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    // Recalculate summary
    let totalQty = 0;
    let passedQty = 0;
    let defectQty = 0;
    let allPass = true;

    editingRecord.items.forEach(item => {
      const q = typeof item.qty === 'number' ? item.qty : parseInt(String(item.qty)) || 0;
      totalQty += q;
      if (item.judgement === 'PASS') {
        passedQty += q;
      } else {
        defectQty += q;
        allPass = false;
      }
    });

    const updatedRec: BilletCuttingRecord = {
      ...editingRecord,
      totalQty,
      passedQty,
      defectQty,
      overallJudgement: allPass ? 'PASS' : 'FAIL',
      updatedAt: new Date().toISOString()
    };

    const updated = records.map(r => r.id === updatedRec.id ? updatedRec : r);
    onUpdateRecords(updated);
    setEditingRecord(null);
    setToastMessage(isTh ? 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว' : 'Record updated successfully');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export to Excel / CSV with UTF-8 BOM
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert(isTh ? 'ไม่มีข้อมูลสำหรับส่งออก' : 'No records to export');
      return;
    }

    const headers = [
      "Record ID",
      "Date",
      "Timestamp",
      "Inspector",
      "Shift",
      "Cutting Length Spec (mm)",
      "Lot No",
      "Machine",
      "Item #",
      "Billet Grade",
      "Heat No",
      "Supplier",
      "Q'ty (Pcs)",
      "Length (mm)",
      "Diameter (mm)",
      "Bending (mm)",
      "Bending Limit (Lx0.15%)",
      "Cutting Surface (mm)",
      "Surface Defect",
      "Heat Identify",
      "Appearance",
      "Item Judgement",
      "Overall Judgement",
      "Remarks"
    ];

    const rows: string[][] = [];

    filteredRecords.forEach(r => {
      r.items.forEach((item, idx) => {
        rows.push([
          r.id,
          r.header.date || '',
          r.timestamp || '',
          r.header.inspectorName || '',
          r.header.shift || '',
          r.header.cuttingLength || '',
          r.header.lotNo || '',
          r.header.machine || '',
          String(idx + 1),
          item.billetGrade || '',
          item.heatNo || '',
          item.supplier || '',
          String(item.qty || 0),
          item.length || '',
          item.diameter || '',
          item.bending || '',
          item.bendingLimit || (parseFloat(item.length || '500') * 0.0015).toFixed(2),
          item.cuttingSurface || '',
          item.surfaceDefect || 'None',
          item.heatIdentify || 'OK',
          item.appearance || 'OK',
          item.judgement || 'PASS',
          r.overallJudgement || 'PASS',
          item.remarks || ''
        ]);
      });
    });

    const csvContent = "\uFEFF" + headers.map(h => `"${h}"`).join(",") + "\n" +
      rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `IPQA08_Billet_Cutting_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setToastMessage(isTh ? 'ส่งออกไฟล์ Excel / CSV สำเร็จแล้ว' : 'Exported Excel / CSV successfully');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[160] bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Controls & Search Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isTh ? 'ประวัติการบันทึกการตัดท่อนบิลเล็ต (IPQA-08 History)' : 'Billet Cutting Inspection History'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {filterMonthMode === 'CURRENT_MONTH' 
                  ? (isTh ? `★ แสดงเบื้องต้น: ข้อมูลในเดือนปัจจุบัน (${currentMonth}/${currentYear}) เพื่อความรวดเร็ว` : `★ Default view: Current Month (${currentMonth}/${currentYear})`) 
                  : (isTh ? 'แสดงข้อมูลทั้งหมดตามตัวกรองที่เลือก' : 'Displaying records based on selected filter')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isTh ? 'Export เป็น Excel (CSV)' : 'Export to Excel (CSV)'}</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
          {/* Month Mode Switcher */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              {isTh ? 'ช่วงเวลาแสดงผล *' : 'Display Period *'}
            </label>
            <select
              value={filterMonthMode}
              onChange={(e) => setFilterMonthMode(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="CURRENT_MONTH">{isTh ? '📅 เดือนปัจจุบัน (Current Month)' : 'Current Month'}</option>
              <option value="ALL_TIME">{isTh ? '🌐 ทั้งหมดทุกเดือน (All Time)' : 'All Time'}</option>
              <option value="CUSTOM">{isTh ? '🔍 เลือกเดือน/ปี เอง (Custom Month)' : 'Custom Month'}</option>
            </select>
          </div>

          {filterMonthMode === 'CUSTOM' ? (
            <>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {isTh ? 'เลือกเดือน' : 'Month'}
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Months</option>
                  <option value="01">01 - Jan</option>
                  <option value="02">02 - Feb</option>
                  <option value="03">03 - Mar</option>
                  <option value="04">04 - Apr</option>
                  <option value="05">05 - May</option>
                  <option value="06">06 - Jun</option>
                  <option value="07">07 - Jul</option>
                  <option value="08">08 - Aug</option>
                  <option value="09">09 - Sep</option>
                  <option value="10">10 - Oct</option>
                  <option value="11">11 - Nov</option>
                  <option value="12">12 - Dec</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  {isTh ? 'เลือกปี' : 'Year'}
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Years</option>
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                {isTh ? 'สถานะผลการตรวจ' : 'Status Filter'}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">{isTh ? 'ทั้งหมด (All Status)' : 'All Status'}</option>
                <option value="PASS">PASS (ผ่านเกณฑ์)</option>
                <option value="FAIL">FAIL (งานเสีย)</option>
              </select>
            </div>
          )}

          {/* Search Box */}
          <div className={filterMonthMode === 'CUSTOM' ? 'col-span-1' : 'col-span-2'}>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              {isTh ? 'ค้นหาด่วน (Lot No, Heat No, Grade, Supplier)' : 'Quick Search'}
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isTh ? 'พิมพ์คำค้นหา...' : 'Search lot, heat, inspector...'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            {isTh ? `แสดง ${filteredRecords.length} รายการลอต (จากทั้งหมด ${records.length} ลอต)` : `Showing ${filteredRecords.length} of ${records.length} lots`}
          </span>
          <span className="text-[11px] text-amber-400/90 font-mono flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" />
            <span>{isTh ? 'การลบ / แก้ไข ต้องใช้รหัส admin2026' : 'Edit & Delete require admin2026'}</span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Date / ID</th>
                <th className="px-4 py-3">Lot No / Shift</th>
                <th className="px-4 py-3">Inspector</th>
                <th className="px-4 py-3">Cutting Length</th>
                <th className="px-4 py-3">Billet Grades & Heats</th>
                <th className="px-4 py-3 text-center">Total Q'ty</th>
                <th className="px-4 py-3 text-center">Judgement</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-white">{record.id}</div>
                      <div className="text-[10px] text-slate-400">{record.header.date || record.timestamp}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-mono font-bold text-indigo-300">{record.header.lotNo}</div>
                      <div className="text-[10px] text-slate-400">{record.header.shift}</div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-200">
                      <div>{record.header.inspectorName}</div>
                      {record.header.machine && (
                        <div className="text-[10px] text-slate-400 font-mono">{record.header.machine}</div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 font-mono font-bold text-pink-400">
                      {record.header.cuttingLength} mm
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {record.items.map((item, idx) => (
                          <span 
                            key={idx} 
                            className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300"
                          >
                            <strong className="text-indigo-400">{item.billetGrade}</strong>: {item.heatNo} ({item.qty} pcs)
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-center font-mono font-bold text-white">
                      {record.totalQty} <span className="text-[10px] text-slate-500 font-normal">Pcs</span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        record.overallJudgement === 'PASS' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {record.overallJudgement === 'PASS' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span>{record.overallJudgement}</span>
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingRecord(record)}
                          className="p-1.5 bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-300 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerAuth('EDIT', record.id)}
                          className="p-1.5 bg-slate-800 hover:bg-amber-600/30 text-slate-300 hover:text-amber-300 rounded-lg transition"
                          title="Edit (Admin Only)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => triggerAuth('DELETE', record.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-300 rounded-lg transition"
                          title="Delete (Admin Only)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-xs">
                    {isTh ? 'ไม่พบข้อมูลบันทึกตามเงื่อนไขที่เลือก' : 'No records found matching filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'รายละเอียดผลการตรวจตัดท่อนบิลเล็ต' : 'Billet Cutting Inspection Details'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {viewingRecord.id} | Lot: {viewingRecord.header.lotNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Inspector</span>
                <span className="text-white font-bold">{viewingRecord.header.inspectorName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Shift</span>
                <span className="text-indigo-300 font-bold">{viewingRecord.header.shift}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Cutting Length Spec</span>
                <span className="text-pink-400 font-bold">{viewingRecord.header.cuttingLength} mm</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Overall Status</span>
                <span className={`font-bold ${viewingRecord.overallJudgement === 'PASS' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {viewingRecord.overallJudgement} ({viewingRecord.totalQty} Pcs)
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Grade</th>
                    <th className="p-2.5">Heat No</th>
                    <th className="p-2.5">Supplier</th>
                    <th className="p-2.5 text-right">Q'ty</th>
                    <th className="p-2.5 text-right">Length</th>
                    <th className="p-2.5 text-right">Diameter</th>
                    <th className="p-2.5 text-right">Bending (Lx0.15%)</th>
                    <th className="p-2.5 text-right">Cut Surface (&lt;2mm)</th>
                    <th className="p-2.5">Defect</th>
                    <th className="p-2.5 text-center">Judgement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {viewingRecord.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-2.5 text-slate-500">{idx + 1}</td>
                      <td className="p-2.5 font-bold text-indigo-400">{item.billetGrade}</td>
                      <td className="p-2.5 text-slate-300">{item.heatNo}</td>
                      <td className="p-2.5 text-slate-300 font-sans">{item.supplier}</td>
                      <td className="p-2.5 text-right font-bold text-white">{item.qty}</td>
                      <td className="p-2.5 text-right text-emerald-400 font-bold">{item.length} mm</td>
                      <td className="p-2.5 text-right text-sky-400 font-bold">{item.diameter} mm</td>
                      <td className="p-2.5 text-right text-amber-400">{item.bending} mm <span className="text-[10px] text-slate-500">(max {item.bendingLimit || (parseFloat(item.length || '500')*0.0015).toFixed(2)})</span></td>
                      <td className="p-2.5 text-right text-pink-400">{item.cuttingSurface} mm</td>
                      <td className="p-2.5 text-purple-300 text-[11px] font-sans">{item.surfaceDefect || 'OK'}</td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.judgement === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {item.judgement}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
              >
                {isTh ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[130] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {authAction === 'DELETE' 
                  ? (isTh ? 'ยืนยันรหัสผ่านเพื่อลบข้อมูล' : 'Confirm Password to Delete') 
                  : (isTh ? 'ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล' : 'Confirm Password to Edit')}
              </h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรอกรหัสผ่าน admin2026 เพื่อดำเนินการ' : 'Enter admin password (admin2026)'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="admin2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password!'}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isTh ? 'ยืนยันรหัสผ่าน' : 'Confirm'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT RECORD MODAL */}
      {editingRecord && (
        <div className="fixed inset-0 z-[140] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'แก้ไขข้อมูลการตัดท่อนบิลเล็ต (Admin Edit)' : 'Edit Billet Cutting Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    ID: {editingRecord.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRecord(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRecord} className="space-y-4">
              {/* Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspector Name</label>
                  <input
                    type="text"
                    value={editingRecord.header.inspectorName}
                    onChange={(e) => setEditingRecord({
                      ...editingRecord,
                      header: { ...editingRecord.header, inspectorName: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shift</label>
                  <input
                    type="text"
                    value={editingRecord.header.shift}
                    onChange={(e) => setEditingRecord({
                      ...editingRecord,
                      header: { ...editingRecord.header, shift: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-indigo-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cutting Length (mm)</label>
                  <input
                    type="text"
                    value={editingRecord.header.cuttingLength}
                    onChange={(e) => setEditingRecord({
                      ...editingRecord,
                      header: { ...editingRecord.header, cuttingLength: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-pink-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Lot No.</label>
                  <input
                    type="text"
                    value={editingRecord.header.lotNo}
                    onChange={(e) => setEditingRecord({
                      ...editingRecord,
                      header: { ...editingRecord.header, lotNo: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-bold font-mono"
                    required
                  />
                </div>
              </div>

              {/* Items editing table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Grade</th>
                      <th className="p-2">Heat No</th>
                      <th className="p-2">Supplier</th>
                      <th className="p-2 w-16">Q'ty</th>
                      <th className="p-2 w-20">Length</th>
                      <th className="p-2 w-20">Diameter</th>
                      <th className="p-2 w-20">Bending</th>
                      <th className="p-2 w-20">Cut Surf</th>
                      <th className="p-2">Judgement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {editingRecord.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.billetGrade}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].billetGrade = e.target.value;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-indigo-300 font-bold text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.heatNo}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].heatNo = e.target.value;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="text"
                            value={item.supplier}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].supplier = e.target.value;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-200 text-xs"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].qty = parseInt(e.target.value) || 0;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-white font-bold text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number" step="0.1"
                            value={item.length}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].length = e.target.value;
                              const len = parseFloat(e.target.value);
                              if (!isNaN(len)) {
                                newItems[idx].bendingLimit = (len * 0.0015).toFixed(2);
                              }
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-emerald-400 font-bold text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number" step="0.1"
                            value={item.diameter}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].diameter = e.target.value;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-sky-400 font-bold text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number" step="0.01"
                            value={item.bending}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].bending = e.target.value;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-amber-400 font-bold text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <input
                            type="number" step="0.1"
                            value={item.cuttingSurface}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].cuttingSurface = e.target.value;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-pink-400 font-bold text-xs text-center"
                          />
                        </td>
                        <td className="p-1.5">
                          <select
                            value={item.judgement}
                            onChange={(e) => {
                              const newItems = [...editingRecord.items];
                              newItems[idx].judgement = e.target.value as any;
                              setEditingRecord({ ...editingRecord, items: newItems });
                            }}
                            className={`w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-bold ${
                              item.judgement === 'PASS' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            <option value="PASS">PASS</option>
                            <option value="FAIL">FAIL</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-lg shadow-amber-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
