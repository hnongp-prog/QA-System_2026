import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { 
  BarChart3, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  RotateCcw,
  Truck,
  Scissors,
  Ruler,
  Boxes
} from 'lucide-react';
import { BilletCuttingRecord, Language } from '../../types';

interface BilletCuttingDashboardProps {
  records: BilletCuttingRecord[];
  language?: Language;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

export const BilletCuttingDashboard: React.FC<BilletCuttingDashboardProps> = ({
  records,
  language = 'th'
}) => {
  const isTh = language === 'th';

  // Filters: Year & Month
  const currentYear = new Date().getFullYear().toString();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');

  // Available Years & Months from Records
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    records.forEach(r => {
      const y = r.header.date?.split('-')[0] || r.timestamp?.split('-')[0];
      if (y) years.add(y);
    });
    if (!years.has('2026')) years.add('2026');
    return Array.from(years).sort().reverse();
  }, [records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const dateStr = r.header.date || r.timestamp?.split(' ')[0] || '';
      const [y, m] = dateStr.split('-');

      if (selectedYear !== 'ALL' && y !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && m !== selectedMonth) return false;
      
      if (selectedGrade !== 'ALL') {
        const hasGrade = r.items.some(item => item.billetGrade === selectedGrade);
        if (!hasGrade) return false;
      }

      return true;
    });
  }, [records, selectedYear, selectedMonth, selectedGrade]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let totalLots = filteredRecords.length;
    let totalQty = 0;
    let passedQty = 0;
    let defectQty = 0;

    filteredRecords.forEach(r => {
      totalQty += r.totalQty || 0;
      passedQty += r.passedQty || 0;
      defectQty += r.defectQty || 0;
    });

    const passRate = totalQty > 0 ? ((passedQty / totalQty) * 100).toFixed(1) : '100.0';

    return {
      totalLots,
      totalQty,
      passedQty,
      defectQty,
      passRate
    };
  }, [filteredRecords]);

  // 1. Group by Billet Grade
  const gradeData = useMemo(() => {
    const gradeMap: Record<string, { grade: string; qty: number; count: number; passedQty: number; defectQty: number }> = {};
    
    filteredRecords.forEach(r => {
      r.items.forEach(item => {
        const g = item.billetGrade || 'Unknown';
        const q = typeof item.qty === 'number' ? item.qty : parseInt(String(item.qty)) || 0;
        const isPass = item.judgement === 'PASS';

        if (!gradeMap[g]) {
          gradeMap[g] = { grade: g, qty: 0, count: 0, passedQty: 0, defectQty: 0 };
        }
        gradeMap[g].qty += q;
        gradeMap[g].count += 1;
        if (isPass) gradeMap[g].passedQty += q;
        else gradeMap[g].defectQty += q;
      });
    });

    return Object.values(gradeMap).sort((a, b) => b.qty - a.qty);
  }, [filteredRecords]);

  // 2. Group by Supplier
  const supplierData = useMemo(() => {
    const supMap: Record<string, { supplier: string; qty: number; count: number; passRate: number; passedQty: number }> = {};

    filteredRecords.forEach(r => {
      r.items.forEach(item => {
        const s = item.supplier || 'Unknown Supplier';
        const q = typeof item.qty === 'number' ? item.qty : parseInt(String(item.qty)) || 0;
        const isPass = item.judgement === 'PASS';

        if (!supMap[s]) {
          supMap[s] = { supplier: s, qty: 0, count: 0, passRate: 100, passedQty: 0 };
        }
        supMap[s].qty += q;
        supMap[s].count += 1;
        if (isPass) supMap[s].passedQty += q;
      });
    });

    return Object.values(supMap).map(item => ({
      ...item,
      passRate: item.qty > 0 ? parseFloat(((item.passedQty / item.qty) * 100).toFixed(1)) : 100
    })).sort((a, b) => b.qty - a.qty);
  }, [filteredRecords]);

  // 3. Group by Cutting Length
  const lengthData = useMemo(() => {
    const lenMap: Record<string, { length: string; qty: number; count: number }> = {};

    filteredRecords.forEach(r => {
      const nominalLen = r.header.cuttingLength ? `${r.header.cuttingLength} mm` : '500 mm';
      r.items.forEach(item => {
        const q = typeof item.qty === 'number' ? item.qty : parseInt(String(item.qty)) || 0;
        if (!lenMap[nominalLen]) {
          lenMap[nominalLen] = { length: nominalLen, qty: 0, count: 0 };
        }
        lenMap[nominalLen].qty += q;
        lenMap[nominalLen].count += 1;
      });
    });

    return Object.values(lenMap).sort((a, b) => b.qty - a.qty);
  }, [filteredRecords]);

  const resetFilters = () => {
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
    setSelectedGrade('ALL');
  };

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {isTh ? 'แดชบอร์ดสรุปผลการตัดบิลเล็ต (Billet Cutting Dashboard)' : 'Billet Cutting Analytics Dashboard'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isTh ? 'สรุปภาพรวมแยกตาม Billet Grade, Supplier, Length และปริมาณ Q\'ty รายเดือน/รายปี' : 'Summary by Billet Grade, Supplier, Length & Q\'ty with Month/Year filter'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectedYear(currentYear); setSelectedMonth(currentMonth); }}
              className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isTh ? 'เดือนปัจจุบัน' : 'Current Month'}</span>
            </button>
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isTh ? 'รีเซ็ต' : 'Reset'}</span>
            </button>
          </div>
        </div>

        {/* Filter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              {isTh ? 'เลือกปี (Year)' : 'Select Year'}
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">{isTh ? 'ทุกปี (ALL YEARS)' : 'ALL YEARS'}</option>
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              {isTh ? 'เลือกเดือน (Month)' : 'Select Month'}
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">{isTh ? 'ทุกเดือน (ALL MONTHS)' : 'ALL MONTHS'}</option>
              <option value="01">มกราคม (Jan - 01)</option>
              <option value="02">กุมภาพันธ์ (Feb - 02)</option>
              <option value="03">มีนาคม (Mar - 03)</option>
              <option value="04">เมษายน (Apr - 04)</option>
              <option value="05">พฤษภาคม (May - 05)</option>
              <option value="06">มิถุนายน (Jun - 06)</option>
              <option value="07">กรกฎาคม (Jul - 07)</option>
              <option value="08">สิงหาคม (Aug - 08)</option>
              <option value="09">กันยายน (Sep - 09)</option>
              <option value="10">ตุลาคม (Oct - 10)</option>
              <option value="11">พฤศจิกายน (Nov - 11)</option>
              <option value="12">ธันวาคม (Dec - 12)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
              {isTh ? 'เลือก Billet Grade' : 'Billet Grade'}
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">{isTh ? 'ทุกเกรด (ALL GRADES)' : 'ALL GRADES'}</option>
              <option value="6063">6063</option>
              <option value="6061">6061</option>
              <option value="6082">6082</option>
              <option value="1050">1050</option>
              <option value="3003">3003</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {isTh ? 'ยอดตัดรวม (Total Q\'ty)' : 'Total Cut Q\'ty'}
            </span>
            <div className="text-2xl font-black text-white">{summaryMetrics.totalQty.toLocaleString()} <span className="text-xs text-slate-400 font-normal">Pcs</span></div>
            <span className="text-[10px] text-slate-500 font-mono">{summaryMetrics.totalLots} Lots Inspected</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              {isTh ? 'ผ่านเกณฑ์ (Passed Q\'ty)' : 'Passed Q\'ty'}
            </span>
            <div className="text-2xl font-black text-emerald-300">{summaryMetrics.passedQty.toLocaleString()} <span className="text-xs text-emerald-500 font-normal">Pcs</span></div>
            <span className="text-[10px] text-emerald-500 font-mono">Rate: {summaryMetrics.passRate}%</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-rose-900/40 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              {isTh ? 'งานเสีย (Defect Q\'ty)' : 'Defect Q\'ty'}
            </span>
            <div className="text-2xl font-black text-rose-300">{summaryMetrics.defectQty.toLocaleString()} <span className="text-xs text-rose-500 font-normal">Pcs</span></div>
            <span className="text-[10px] text-rose-500 font-mono">{summaryMetrics.defectQty === 0 ? 'Zero Defect' : 'Requires Review'}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 rounded-3xl p-5 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              {isTh ? 'อัตราผ่านรวม (Pass %)' : 'Overall Pass Rate'}
            </span>
            <div className="text-2xl font-black text-amber-300">{summaryMetrics.passRate}%</div>
            <span className="text-[10px] text-amber-500 font-mono">Target: ≥ 99.0%</span>
          </div>
        </div>
      </div>

      {/* Visual Charts: 1. Billet Grade & 2. Supplier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Billet Grade Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isTh ? 'สรุปตาม Billet Grade (Q\'ty Pcs)' : 'Summary by Billet Grade (Q\'ty)'}
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{gradeData.length} Grades</span>
          </div>

          <div className="h-64 w-full">
            {gradeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gradeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="grade" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="qty" fill="#6366f1" radius={[8, 8, 0, 0]} name={isTh ? "จำนวนชิ้น (Pcs)" : "Quantity (Pcs)"} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {isTh ? 'ไม่พบข้อมูลในช่วงที่เลือก' : 'No data available'}
              </div>
            )}
          </div>

          {/* Table Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="p-2 rounded-l-lg">Grade</th>
                  <th className="p-2 text-right">Q'ty (Pcs)</th>
                  <th className="p-2 text-right">Passed</th>
                  <th className="p-2 text-right rounded-r-lg">Defect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {gradeData.map((g, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-2 font-mono font-bold text-white">{g.grade}</td>
                    <td className="p-2 text-right font-mono text-indigo-300">{g.qty.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-emerald-400">{g.passedQty.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono text-rose-400">{g.defectQty.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Distribution */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <Truck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                {isTh ? 'สรุปตาม Supplier & Pass Rate' : 'Summary by Supplier & Quality'}
              </h4>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">{supplierData.length} Suppliers</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {supplierData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={supplierData}
                    dataKey="qty"
                    nameKey="supplier"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {supplierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                {isTh ? 'ไม่พบข้อมูลในช่วงที่เลือก' : 'No data available'}
              </div>
            )}
          </div>

          {/* Supplier Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-left">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="p-2 rounded-l-lg">Supplier</th>
                  <th className="p-2 text-right">Q'ty (Pcs)</th>
                  <th className="p-2 text-right rounded-r-lg">Pass Rate %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {supplierData.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50">
                    <td className="p-2 font-medium text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span>{s.supplier}</span>
                    </td>
                    <td className="p-2 text-right font-mono text-indigo-300">{s.qty.toLocaleString()}</td>
                    <td className="p-2 text-right font-mono font-bold text-emerald-400">{s.passRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Cutting Length Distribution */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-pink-500/10 text-pink-400 rounded-lg">
              <Ruler className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {isTh ? 'สรุปตามความยาวตัด (Cutting Length Breakdown)' : 'Cutting Length Summary'}
            </h4>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {lengthData.map((l, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Length</span>
              <div className="text-lg font-black text-pink-400 font-mono">{l.length}</div>
              <div className="text-xs text-slate-300 font-mono">{l.qty.toLocaleString()} Pcs ({l.count} lots)</div>
            </div>
          ))}
          {lengthData.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              {isTh ? 'ไม่มีข้อมูลความยาวตัด' : 'No length data recorded'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
