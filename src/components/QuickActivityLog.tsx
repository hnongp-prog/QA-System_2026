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
import { InspectionActivity, Language, ThemeMode } from '../types';

interface QuickActivityLogProps {
  activities: InspectionActivity[];
  language: Language;
  theme?: ThemeMode;
}

export const QuickActivityLog: React.FC<QuickActivityLogProps> = ({
  activities,
  language,
  theme = 'light'
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
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
    <div className={`border rounded-2xl p-5 shadow-xs space-y-4 transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b ${
        isLight ? 'border-slate-100' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isLight ? 'bg-blue-50 text-blue-600' : 'bg-cyan-500/10 text-cyan-400'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {isTh ? 'บันทึกการตรวจล่าสุดเรียลไทม์ (Live Inspection Logs)' : 'Live Recent Inspection Logs'}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                isLight ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                Live Feed
              </span>
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isTh ? 'กิจกรรมการตรวจคุณภาพผ่านระบบย่อยทั้งหมดในกะปัจจุบัน' : 'Inspection activities captured across all sub-apps'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Filter Pills */}
          <div className={`flex items-center gap-1 p-1 rounded-lg border text-xs ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              onClick={() => setFilterResult('ALL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterResult === 'ALL' 
                  ? isLight ? 'bg-white text-slate-800 shadow-xs' : 'bg-slate-800 text-white font-semibold' 
                  : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isTh ? 'ทั้งหมด' : 'All'}
            </button>
            <button
              onClick={() => setFilterResult('PASS')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterResult === 'PASS' 
                  ? isLight ? 'bg-emerald-100 text-emerald-800 shadow-xs' : 'bg-emerald-500/20 text-emerald-300 font-semibold' 
                  : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pass
            </button>
            <button
              onClick={() => setFilterResult('FAIL')}
              className={`px-2.5 py-1 rounded-md font-semibold transition ${
                filterResult === 'FAIL' 
                  ? isLight ? 'bg-rose-100 text-rose-800 shadow-xs' : 'bg-rose-500/20 text-rose-300 font-semibold' 
                  : isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fail / Reject
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-xs ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Activity Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'}`}>
              <th className="py-2.5 px-3 font-semibold">{isTh ? 'เวลา' : 'Time'}</th>
              <th className="py-2.5 px-3 font-semibold">{isTh ? 'ระบบย่อย' : 'Sub-App'}</th>
              <th className="py-2.5 px-3 font-semibold">{isTh ? 'Batch / Coil / Lot' : 'Batch / Lot'}</th>
              <th className="py-2.5 px-3 font-semibold">{isTh ? 'ผู้ตรวจ' : 'Inspector'}</th>
              <th className="py-2.5 px-3 font-semibold text-center">{isTh ? 'ผลตรวจ' : 'Result'}</th>
              <th className="py-2.5 px-3 font-semibold">{isTh ? 'หมายเหตุ' : 'Remarks'}</th>
            </tr>
          </thead>
          <tbody className={`divide-y font-mono ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className={`text-center py-8 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                  {isTh ? 'ไม่พบรายการบันทึกผลการตรวจ' : 'No inspection records found'}
                </td>
              </tr>
            ) : (
              filtered.map((act) => {
                const isPass = act.result === 'PASS';
                const isFail = act.result === 'FAIL' || act.result === 'REJECT';
                return (
                  <tr key={act.id} className={`transition ${
                    isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-800/40'
                  }`}>
                    <td className={`py-2.5 px-3 whitespace-nowrap text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {act.timestamp}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-sans">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isLight ? 'bg-slate-100 text-blue-700 border border-slate-200' : 'bg-slate-800 text-cyan-400 border border-slate-700'
                        }`}>
                          {act.moduleCode}
                        </span>
                        <span className={`text-xs font-medium truncate max-w-[140px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {isTh ? act.moduleTitleTh : act.moduleTitleEn}
                        </span>
                      </div>
                    </td>
                    <td className={`py-2.5 px-3 text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                      {act.batchLot}
                    </td>
                    <td className={`py-2.5 px-3 font-sans text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      {act.inspector}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans border ${
                        isPass 
                          ? isLight
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : isFail
                            ? isLight
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                            : isLight
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {isPass && <CheckCircle2 className="w-3 h-3" />}
                        {isFail && <XCircle className="w-3 h-3" />}
                        <span>{act.result}</span>
                      </span>
                    </td>
                    <td className={`py-2.5 px-3 font-sans text-[11px] truncate max-w-[200px] ${
                      isFail ? (isLight ? 'text-rose-600 font-semibold' : 'text-rose-400') : (isLight ? 'text-slate-500' : 'text-slate-400')
                    }`}>
                      {act.remarks || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
