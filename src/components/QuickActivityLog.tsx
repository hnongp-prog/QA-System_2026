import React, { useState } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download, 
  Filter, 
  User, 
  Tag, 
  Layers 
} from 'lucide-react';
import { InspectionActivity, Language } from '../types';

interface QuickActivityLogProps {
  activities: InspectionActivity[];
  language: Language;
}

export const QuickActivityLog: React.FC<QuickActivityLogProps> = ({
  activities,
  language
}) => {
  const isTh = language === 'th';
  const [filterResult, setFilterResult] = useState<'ALL' | 'PASS' | 'FAIL'>('ALL');

  const filtered = activities.filter((act) => {
    if (filterResult === 'ALL') return true;
    if (filterResult === 'FAIL') return act.result === 'FAIL' || act.result === 'REJECT';
    return act.result === filterResult;
  });

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'ModuleCode', 'ModuleTitle', 'Inspector', 'BatchLot', 'Result', 'Defects', 'Remarks'];
    const rows = activities.map(a => [
      a.timestamp,
      a.moduleCode,
      `"${a.moduleTitleEn}"`,
      `"${a.inspector}"`,
      `"${a.batchLot}"`,
      a.result,
      a.defectCount || 0,
      `"${a.remarks || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `QA_Inspection_Log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {isTh ? 'บันทึกการตรวจล่าสุดเรียลไทม์ (Live Inspection Logs)' : 'Live Recent Inspection Logs'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                Live Feed
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              {isTh ? 'กิจกรรมการตรวจคุณภาพผ่านระบบย่อยทั้งหมดในกะปัจจุบัน' : 'Inspection activities captured across all sub-apps'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setFilterResult('ALL')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterResult === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isTh ? 'ทั้งหมด' : 'All'}
            </button>
            <button
              onClick={() => setFilterResult('PASS')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterResult === 'PASS' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pass
            </button>
            <button
              onClick={() => setFilterResult('FAIL')}
              className={`px-2.5 py-1 rounded-md font-medium transition ${
                filterResult === 'FAIL' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fail/Reject
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            title="Export CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">{isTh ? 'ดาวน์โหลด CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            {isTh ? 'ไม่มีรายการบันทึกการตรวจในเงื่อนไขนี้' : 'No inspection logs match filter'}
          </div>
        ) : (
          filtered.map((item) => {
            const isPass = item.result === 'PASS';
            const moduleTitle = isTh ? item.moduleTitleTh : item.moduleTitleEn;

            return (
              <div
                key={item.id}
                className="bg-slate-950/70 hover:bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isPass ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {isPass ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                        {item.moduleCode}
                      </span>
                      <span className="font-semibold text-white">{moduleTitle}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-mono text-slate-300">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {item.batchLot}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <User className="w-3 h-3 text-slate-500" />
                        {item.inspector}
                      </span>
                    </div>

                    {item.remarks && (
                      <p className="text-[11px] text-slate-400 mt-1 italic bg-slate-900/50 px-2 py-0.5 rounded border border-slate-800/50 inline-block">
                        "{item.remarks}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span
                    className={`font-bold text-[11px] px-2.5 py-1 rounded-full border ${
                      isPass
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {item.result} {item.defectCount ? `(${item.defectCount} Defect)` : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
