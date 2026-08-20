import React from 'react';
import { 
  CheckCircle2, 
  AlertOctagon, 
  ClipboardCheck, 
  Wrench, 
  TrendingUp, 
  Filter, 
  Layers 
} from 'lucide-react';
import { SystemMetrics, QACategory, Language } from '../types';

interface StatsOverviewProps {
  metrics: SystemMetrics;
  selectedCategory: QACategory;
  onSelectCategory: (category: QACategory) => void;
  language: Language;
  totalModulesCount: number;
  filteredCount: number;
  onOpenNcr?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  metrics,
  selectedCategory,
  onSelectCategory,
  language,
  totalModulesCount,
  filteredCount,
  onOpenNcr
}) => {
  const isTh = language === 'th';

  const categories: { key: QACategory; labelTh: string; labelEn: string; icon: string; color: string }[] = [
    { key: 'ALL', labelTh: 'แอปทั้งหมด', labelEn: 'All Sub-Apps', icon: 'Layers', color: 'bg-slate-800 text-slate-200' },
    { key: 'IQC', labelTh: 'IQC ตรวจรับวัตถุดิบ', labelEn: 'IQC Incoming', icon: 'PackageCheck', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { key: 'IPQC', labelTh: 'IPQC ตรวจสายผลิต', labelEn: 'IPQC In-Process', icon: 'Activity', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
    { key: 'OQC', labelTh: 'OQC ตรวจจัดส่ง', labelEn: 'OQC Outgoing', icon: 'Truck', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    { key: 'EQUIPMENT', labelTh: 'เครื่องมือ & สอบเทียบ', labelEn: 'Metrology', icon: 'Wrench', color: 'bg-slate-700/50 text-slate-300 border-slate-600' },
    { key: 'NCR', labelTh: 'NCR & CAPA ของเสีย', labelEn: 'NCR & Defect', icon: 'AlertTriangle', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
    { key: 'ANALYTICS', labelTh: 'วิเคราะห์คุณภาพ', labelEn: 'Analytics', icon: 'BarChart3', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    { key: 'CERTIFICATE_COI', labelTh: 'Certificate_COI', labelEn: 'Certificate_COI', icon: 'FileCheck', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Inspections Today */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {isTh ? 'รายการตรวจวันนี้' : 'Inspections Today'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white">{metrics.totalInspectionsToday}</span>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {isTh ? 'จาก IQC, IPQC, OQC' : 'Across all QA lines'}
          </p>
        </div>

        {/* Pass Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {isTh ? 'อัตราผ่านเกณฑ์ (Pass Rate)' : 'Overall Pass Rate'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400">{metrics.passRatePercent}%</span>
            <span className="text-[11px] font-semibold text-emerald-400">Target 97%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {isTh ? 'เกณฑ์เป้าหมายขั้นต่ำ 97.0%' : 'Meets plant quality target'}
          </p>
        </div>

        {/* Active Defects */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {isTh ? 'แจ้งเตือนของเสียสะสม' : 'Active Defect Alerts'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-400">{metrics.activeDefects}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
              Warning
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {isTh ? 'ต้องได้รับการตรวจสอบทันที' : 'Requires line supervisor check'}
          </p>
        </div>

        {/* Pending NCR */}
        <div 
          onClick={() => {
            if (onOpenNcr) {
              onOpenNcr();
            } else {
              onSelectCategory('NCR');
            }
          }}
          className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-rose-500/50 hover:bg-slate-900/80 cursor-pointer transition group"
          title={isTh ? 'คลิกเพื่อเปิดระบบจัดการของเสีย NCR & CAPA ทันที' : 'Click to launch NCR & CAPA center'}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-rose-300 transition-colors">
              {isTh ? 'เคส NCR / CAPA รอดำเนินการ' : 'Open NCR & CAPA'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-slate-950 transition-colors">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-400">{metrics.pendingNCRs}</span>
            <span className="text-[10px] text-rose-400 group-hover:underline">
              {isTh ? 'เข้าสู่ระบบ ➔' : 'Open ➔'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {isTh ? 'รอยืนยันมาตรการแก้ไข 8D' : 'Awaiting 8D verification'}
          </p>
        </div>

        {/* Tool Calibration Status */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm hover:border-slate-700 transition col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">
              {isTh ? 'ความพร้อมเครื่องมือวัด' : 'Calibrated Gauge Status'}
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-cyan-400">{metrics.calibratedToolsPercent}%</span>
            <span className="text-[10px] text-slate-400">128 Gauges</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            {isTh ? 'เครื่องมือวัดผ่านสอบเทียบพร้อมใช้' : 'Gauges active & calibrated'}
          </p>
        </div>
      </div>

      {/* Category Selection Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => onSelectCategory(cat.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-semibold border-cyan-400 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
              >
                <span>{isTh ? cat.labelTh : cat.labelEn}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 shrink-0 self-end sm:self-center font-mono">
          {isTh ? `แสดง ${filteredCount} จาก ${totalModulesCount} เมนูย่อย` : `Showing ${filteredCount} of ${totalModulesCount} sub-apps`}
        </div>
      </div>
    </div>
  );
};
