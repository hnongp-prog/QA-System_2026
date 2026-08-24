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
import { SystemMetrics, QACategory, Language, ThemeMode } from '../types';

interface StatsOverviewProps {
  metrics: SystemMetrics;
  selectedCategory: QACategory;
  onSelectCategory: (category: QACategory) => void;
  language: Language;
  theme?: ThemeMode;
  totalModulesCount: number;
  filteredCount: number;
  onOpenNcr?: () => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  metrics,
  selectedCategory,
  onSelectCategory,
  language,
  theme = 'light',
  totalModulesCount,
  filteredCount,
  onOpenNcr
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  const categories: { key: QACategory; labelTh: string; labelEn: string }[] = [
    { key: 'ALL', labelTh: 'แอปทั้งหมด', labelEn: 'All Sub-Apps' },
    { key: 'IQA', labelTh: 'IQA ตรวจรับวัตถุดิบ', labelEn: 'IQA Incoming' },
    { key: 'IPQA', labelTh: 'IPQA ตรวจสายผลิต', labelEn: 'IPQA In-Process' },
    { key: 'OQA', labelTh: 'OQA ตรวจจัดส่ง', labelEn: 'OQA Outgoing' },
    { key: 'EQUIPMENT', labelTh: 'เครื่องมือ & สอบเทียบ', labelEn: 'Metrology' },
    { key: 'NCR', labelTh: 'NCR & CAPA ของเสีย', labelEn: 'NCR & Defect' },
    { key: 'ANALYTICS', labelTh: 'วิเคราะห์คุณภาพ', labelEn: 'Analytics' },
    { key: 'CERTIFICATE_COI', labelTh: 'Certificate_COI', labelEn: 'Certificate_COI' },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Inspections Today */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'} border rounded-xl p-4 transition-all`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isTh ? 'รายการตรวจวันนี้' : 'Inspections Today'}
            </span>
            <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/10 text-blue-400'} flex items-center justify-center`}>
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{metrics.totalInspectionsToday}</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +14%
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {isTh ? 'จาก IQA, IPQA, OQA' : 'Across all QA lines'}
          </p>
        </div>

        {/* Pass Rate */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'} border rounded-xl p-4 transition-all`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isTh ? 'อัตราผ่านเกณฑ์ (Pass Rate)' : 'Overall Pass Rate'}
            </span>
            <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-emerald-50 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'} flex items-center justify-center`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>{metrics.passRatePercent}%</span>
            <span className={`text-[11px] font-semibold ${isLight ? 'text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded' : 'text-emerald-400'}`}>Target 97%</span>
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {isTh ? 'เกณฑ์เป้าหมายขั้นต่ำ 97.0%' : 'Meets plant quality target'}
          </p>
        </div>

        {/* Active Defects */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'} border rounded-xl p-4 transition-all`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isTh ? 'แจ้งเตือนของเสียสะสม' : 'Active Defect Alerts'}
            </span>
            <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'} flex items-center justify-center`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isLight ? 'text-amber-600' : 'text-amber-400'}`}>{metrics.activeDefects}</span>
            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Points</span>
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {isTh ? 'ตรวจพบและกักกันแล้ว' : 'Flagged & quarantined'}
          </p>
        </div>

        {/* Pending NCRs - Clickable to NCR */}
        <div 
          onClick={onOpenNcr}
          className={`${isLight ? 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-xs' : 'bg-slate-900 border-slate-800 hover:border-rose-500/40'} border rounded-xl p-4 transition cursor-pointer group`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold group-hover:text-rose-600 transition ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isTh ? 'ใบ NCR รอแก้ไข (Open)' : 'Pending NCRs'}
            </span>
            <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-rose-50 text-rose-600' : 'bg-rose-500/10 text-rose-400'} flex items-center justify-center group-hover:scale-105 transition`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isLight ? 'text-rose-600' : 'text-rose-400'}`}>{metrics.pendingNCRs}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isLight ? 'bg-rose-100 text-rose-700' : 'bg-rose-950 text-rose-300 border border-rose-800'}`}>
              {isTh ? 'เปิดระบบ NCR' : 'Open NCR'}
            </span>
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {isTh ? 'คลิกเพื่อดูและจัดการ CAPA' : 'Click to view & manage CAPA'}
          </p>
        </div>

        {/* Calibration Ready */}
        <div className={`${isLight ? 'bg-white border-slate-200 shadow-xs hover:border-slate-300' : 'bg-slate-900 border-slate-800 hover:border-slate-700'} border rounded-xl p-4 transition-all col-span-2 sm:col-span-1`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {isTh ? 'ความพร้อมเครื่องมือวัด' : 'Calibrated Gauges'}
            </span>
            <div className={`w-8 h-8 rounded-lg ${isLight ? 'bg-blue-50 text-blue-600' : 'bg-slate-800 text-slate-300'} flex items-center justify-center`}>
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className={`text-2xl font-bold font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{metrics.calibratedToolsPercent}%</span>
            <span className="text-[11px] font-semibold text-emerald-600">Valid</span>
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
            {isTh ? 'เครื่องมือผ่านเกณฑ์ทั้งหมด' : 'All plant gauges verified'}
          </p>
        </div>
      </div>

      {/* Category Selection Tabs Bar */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-2.5 rounded-xl border transition-colors ${
        isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => onSelectCategory(cat.key)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${
                  isSelected
                    ? isLight
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                    : isLight
                      ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
              >
                <span>{isTh ? cat.labelTh : cat.labelEn}</span>
                {cat.key === 'ALL' && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected
                      ? isLight ? 'bg-blue-700 text-white' : 'bg-slate-900 text-cyan-300'
                      : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {totalModulesCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className={`text-xs shrink-0 self-end sm:self-center font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {isTh ? `แสดง ${filteredCount} จาก ${totalModulesCount} เมนูย่อย` : `Showing ${filteredCount} of ${totalModulesCount} sub-apps`}
        </div>
      </div>
    </div>
  );
};
