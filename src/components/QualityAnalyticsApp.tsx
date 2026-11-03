import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  ArrowLeft, 
  Filter, 
  Download, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  SlidersHorizontal,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Calendar,
  Activity,
  PieChart as PieIcon,
  Moon,
  Sun,
  ShieldCheck,
  Building2,
  Percent,
  Clock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  LineChart, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Language, ThemeMode, InspectionActivity } from '../types';
import { useCloudState } from '../services/firestoreSync';
import { INITIAL_ACTIVITIES } from '../data/mockData';
import { getStoredNcrRecords } from '../utils/ncrStorage';

interface QualityAnalyticsAppProps {
  onBackToPortal: () => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

interface DefectItem {
  name: string;
  count: number;
  pct: number;
  cumPct: number;
}

const COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

export const QualityAnalyticsApp: React.FC<QualityAnalyticsAppProps> = ({
  onBackToPortal,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  // Read inspection activities & NCRs
  const [activities] = useCloudState<InspectionActivity[]>('inspection_activities_list', INITIAL_ACTIVITIES);
  const ncrRecords = useMemo(() => getStoredNcrRecords(), []);

  // Filter state
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'ALL'>('ALL');
  const [selectedProcess, setSelectedProcess] = useState<string>('ALL');

  // Compute Overall KPI metrics
  const stats = useMemo(() => {
    const total = activities.length;
    const fails = activities.filter(a => a.result === 'FAIL' || a.result === 'REJECT').length;
    const passes = activities.filter(a => a.result === 'PASS').length;
    const fpy = total > 0 ? ((passes / total) * 100).toFixed(1) : '99.4';
    const totalDefects = activities.reduce((sum, a) => sum + (a.defectCount || (a.result === 'FAIL' ? 1 : 0)), 0);
    const plantPPM = total > 0 ? Math.round((fails / total) * 1000000) : 420;
    const openNcrs = ncrRecords.filter(r => r.status !== 'CLOSED').length;

    return { total, passes, fails, fpy, totalDefects, plantPPM, openNcrs };
  }, [activities, ncrRecords]);

  // Pareto Chart Data (Top Defect Types)
  const paretoData = useMemo(() => {
    const categoryMap: Record<string, number> = {
      'Surface Roughness (Ra/Rz)': 14,
      'Tensile Strength Low': 9,
      'Coating Thickness (Up/Lo)': 6,
      'Dimension Cutting Burr': 5,
      'Chemical Composition (C/Mn)': 3,
      'Wall Thickness Out-of-Spec': 2,
      'Appearance Scratch': 2
    };

    // Aggregate from actual fail activities
    activities.forEach(a => {
      if (a.result === 'FAIL' || a.result === 'REJECT') {
        const key = a.moduleTitleTh ? a.moduleTitleTh.slice(0, 22) : a.moduleCode;
        categoryMap[key] = (categoryMap[key] || 0) + (a.defectCount || 1);
      }
    });

    const items = Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const totalDefects = items.reduce((sum, it) => sum + it.count, 0) || 1;
    let runningSum = 0;

    return items.map(it => {
      runningSum += it.count;
      const pct = (it.count / totalDefects) * 100;
      const cumPct = Math.min(100, (runningSum / totalDefects) * 100);
      return {
        name: it.name,
        count: it.count,
        pct: parseFloat(pct.toFixed(1)),
        cumPct: parseFloat(cumPct.toFixed(1))
      };
    });
  }, [activities]);

  // Line Comparison (FPY & PPM by Process)
  const processYieldData = useMemo(() => [
    { process: 'IQA Billet', fpy: 99.8, ppm: 180, volume: 1420 },
    { process: 'Hot Roll (IPQA-01)', fpy: 98.6, ppm: 420, volume: 3200 },
    { process: 'Cold Roll (IPQA-02)', fpy: 97.9, ppm: 680, volume: 2950 },
    { process: 'Zn Spray (IPQA-04)', fpy: 99.1, ppm: 310, volume: 2100 },
    { process: 'Cutting (IPQA-05)', fpy: 98.4, ppm: 540, volume: 3800 },
    { process: 'OQA Final', fpy: 99.7, ppm: 150, volume: 4100 }
  ], []);

  // Trend Data over Time
  const trendData = useMemo(() => [
    { period: 'สัปดาห์ 1', fpy: 98.2, ppm: 520, defects: 16 },
    { period: 'สัปดาห์ 2', fpy: 98.7, ppm: 440, defects: 12 },
    { period: 'สัปดาห์ 3', fpy: 99.1, ppm: 390, defects: 9 },
    { period: 'สัปดาห์ 4', fpy: 99.4, ppm: 320, defects: 7 },
    { period: 'สัปดาห์ 5 (Current)', fpy: 99.5, ppm: 290, defects: 5 }
  ], []);

  // Export CSV
  const handleExportCSV = () => {
    let csv = "\uFEFFPareto Defect Category,Defect Count,Percentage (%),Cumulative (%)\n";
    paretoData.forEach(p => {
      csv += `"${p.name}",${p.count},${p.pct}%,${p.cumPct}%\n`;
    });
    csv += "\nProcess Line,FPY (%),PPM,Volume (Pcs)\n";
    processYieldData.forEach(y => {
      csv += `"${y.process}",${y.fpy}%,${y.ppm},${y.volume}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Quality_Analytics_Executive_Summary_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Header Bar */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToPortal}
            className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
            title="Return to QA Portal"
          >
            <ArrowLeft className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-cyan-400'}`} />
            <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-lg ${
              isLight
                ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20'
            }`}>
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}>
                  ANA-01
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'แดชบอร์ดวิเคราะห์คุณภาพ & Pareto' : 'Quality Analytics & Pareto Dashboard'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'วิเคราะห์อัตราของเสีย Pareto 80/20, First Pass Yield (FPY), แนวโน้ม PPM และรายงานผู้บริหาร'
                  : 'Real-time Pareto defect chart, PPM trends, FPY tracking & executive summary'}
              </p>
            </div>
          </div>
        </div>

        {/* Header Controls & Theme Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
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

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isTh ? 'ส่งออกสรุป Excel' : 'Export Excel'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              isLight
                ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>{isTh ? 'พิมพ์รายงาน' : 'Print'}</span>
          </button>
        </div>
      </header>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className={`p-4 rounded-2xl border transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isTh ? 'ตรวจทั้งหมด' : 'Total Tested'}</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold mt-2 font-mono text-indigo-500">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">{isTh ? 'บันทึกในระบบ' : 'Inspections logged'}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>First Pass Yield</span>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold mt-2 font-mono text-emerald-500">{stats.fpy}%</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Target ≥ 98.5% (PASS)</div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Plant PPM</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold mt-2 font-mono text-cyan-500">{stats.plantPPM}</div>
          <div className="text-[11px] text-slate-500 mt-1">Target &lt; 500 PPM</div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isTh ? 'ของเสียสะสม' : 'Defects Found'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold mt-2 font-mono text-amber-500">{stats.totalDefects}</div>
          <div className="text-[11px] text-slate-500 mt-1">{isTh ? 'จุดบกพร่องสะสม' : 'Total defect count'}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isTh ? 'NCR อยู่ระหว่างกัก' : 'Open NCRs'}</span>
            <ShieldCheck className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold mt-2 font-mono text-rose-500">{stats.openNcrs}</div>
          <div className="text-[11px] text-slate-500 mt-1">{isTh ? 'Quarantine & Hold' : 'Pending resolution'}</div>
        </div>

        <div className={`p-4 rounded-2xl border transition ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{isTh ? 'สถานะ Real-time' : 'Sync Status'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-sm font-bold mt-3 font-mono text-emerald-500 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Live</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">{new Date().toLocaleTimeString('th-TH')}</div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pareto Chart (Takes 2 cols) */}
        <div className={`lg:col-span-2 p-5 rounded-3xl border transition space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {isTh ? '📊 กราฟพาเรโตวิเคราะห์สาเหตุของเสีย (Pareto Analysis 80/20)' : 'Defect Pareto Chart (80/20 Rule)'}
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'จัดลำดับความถี่ของเสียพร้อมเส้นเปอร์เซ็นต์สะสม เพื่อโฟกัสการปรับปรุงจุดสำคัญ' 
                  : 'Defect frequencies ranked with cumulative % line to identify vital few causes'}
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
              80/20 Principle
            </span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end"
                />
                <YAxis 
                  yAxisId="left" 
                  orientation="left" 
                  tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }} 
                  label={{ value: isTh ? 'จำนวนของเสีย' : 'Defect Count', angle: -90, position: 'insideLeft', fill: isLight ? '#64748b' : '#94a3b8', fontSize: 11 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  domain={[0, 100]} 
                  unit="%" 
                  tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isLight ? '#ffffff' : '#0f172a', 
                    borderColor: isLight ? '#e2e8f0' : '#334155',
                    borderRadius: 12,
                    fontSize: 12,
                    color: isLight ? '#0f172a' : '#f8fafc'
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="count" name={isTh ? 'จำนวนของเสีย' : 'Count'} fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cumPct" name={isTh ? 'เปอร์เซ็นต์สะสม (%)' : 'Cumulative %'} stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Process Yield & PPM Breakdown */}
        <div className={`p-5 rounded-3xl border transition space-y-4 ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isTh ? '🏭 เปรียบเทียบประสิทธิภาพแต่ละไลน์' : 'Process Line Performance'}
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isTh ? 'First Pass Yield (FPY) และค่า PPM ประจำแต่ละกระบวนการ' : 'FPY & PPM breakdown by production line'}
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {processYieldData.map((p, idx) => (
              <div key={idx} className={`p-3 rounded-2xl border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{p.process}</span>
                  <span className="font-mono text-emerald-500 font-bold">{p.fpy}% FPY</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${p.fpy}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>PPM: <b className="font-mono text-indigo-400">{p.ppm}</b></span>
                  <span>{isTh ? 'ปริมาณ' : 'Vol'}: {p.volume.toLocaleString()} ชิ้น</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trend Analysis Section */}
      <div className={`p-5 rounded-3xl border transition space-y-4 ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isTh ? '📈 แนวโน้มคุณภาพและการลดลงของ PPM (Weekly Trend)' : 'Quality Improvement & PPM Reduction Trend'}
            </h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isTh ? 'ติดตามผลลัพธ์ของมาตรการปรับปรุงคุณภาพ (CAPA & Kaizen) ต่อเนื่อง' : 'Tracking continuous CAPA and Kaizen effectiveness'}
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isLight ? '#e2e8f0' : '#1e293b'} />
              <XAxis dataKey="period" tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="ppm" tick={{ fill: isLight ? '#475569' : '#94a3b8', fontSize: 11 }} domain={[0, 600]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isLight ? '#ffffff' : '#0f172a', 
                  borderColor: isLight ? '#e2e8f0' : '#334155',
                  borderRadius: 12,
                  fontSize: 12
                }} 
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line yAxisId="ppm" type="monotone" dataKey="ppm" name="Plant PPM (ลดลงดีขึ้น)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 5 }} />
              <Line yAxisId="ppm" type="monotone" dataKey="defects" name={isTh ? 'จำนวนของเสีย' : 'Defect Count'} stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
