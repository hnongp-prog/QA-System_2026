import React from 'react';
import { 
  Pin, 
  ArrowUpRight, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  Clock, 
  FileCode, 
  Star,
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { QAModule, Language, ThemeMode } from '../types';
import { IconRenderer } from './IconRenderer';

interface ModuleGridProps {
  modules: QAModule[];
  onSelectModule: (module: QAModule) => void;
  onTogglePin: (id: string) => void;
  language: Language;
  theme?: ThemeMode;
}

export const ModuleGrid: React.FC<ModuleGridProps> = ({
  modules,
  onSelectModule,
  onTogglePin,
  language,
  theme = 'light'
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  if (modules.length === 0) {
    return (
      <div className={`${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/50 border-slate-800'} border rounded-2xl p-12 text-center my-8 shadow-xs`}>
        <div className={`w-12 h-12 rounded-full ${isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-slate-400'} flex items-center justify-center mx-auto mb-3`}>
          <Layers className="w-6 h-6" />
        </div>
        <h3 className={`text-base font-semibold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
          {isTh ? 'ไม่พบเมนูระบบย่อยที่ค้นหา' : 'No QA Sub-App Modules Found'}
        </h3>
        <p className={`text-xs mt-1 max-w-sm mx-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          {isTh 
            ? 'ลองเปลี่ยนหมวดหมู่หรือคำค้นหา หรือกดปุ่ม "เพิ่มแอปย่อยใหม่" ด้านบนเพื่อสร้างเมนูใหม่' 
            : 'Try changing category filter or search query, or click "Add Sub-App Module" to register a new menu.'}
        </p>
      </div>
    );
  }

  // Category Color Map
  const getCategoryBadgeClass = (category: string) => {
    if (isLight) {
      switch (category) {
        case 'IQA':
        case 'IQC':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'IPQA':
        case 'IPQC':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'FQA':
        case 'FQC':
          return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'OQA':
        case 'OQC':
          return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'EQUIPMENT':
          return 'bg-slate-100 text-slate-700 border-slate-200';
        case 'NCR':
          return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'ANALYTICS':
          return 'bg-purple-50 text-purple-700 border-purple-200';
        case 'CERTIFICATE_COI':
          return 'bg-teal-50 text-teal-700 border-teal-200';
        default:
          return 'bg-slate-100 text-slate-700 border-slate-200';
      }
    } else {
      switch (category) {
        case 'IQA':
        case 'IQC':
          return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
        case 'IPQA':
        case 'IPQC':
          return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        case 'FQA':
        case 'FQC':
          return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
        case 'OQA':
        case 'OQC':
          return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
        case 'EQUIPMENT':
          return 'bg-slate-800 text-slate-300 border-slate-700';
        case 'NCR':
          return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
        case 'ANALYTICS':
          return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
        case 'CERTIFICATE_COI':
          return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
        default:
          return 'bg-slate-800 text-slate-300 border-slate-700';
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {modules.map((mod) => {
        const title = isTh ? mod.titleTh : mod.titleEn;
        const description = isTh ? mod.descriptionTh : mod.descriptionEn;

        return (
          <div
            key={mod.id}
            onClick={() => onSelectModule(mod)}
            className={`group border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 relative overflow-hidden cursor-pointer ${
              isLight
                ? mod.pinned
                  ? 'bg-white border-blue-400 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                : mod.pinned
                  ? 'border-cyan-500/50 bg-gradient-to-b from-slate-900 to-slate-900/95 shadow-md shadow-cyan-950/40'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-xl hover:shadow-cyan-500/5'
            }`}
          >
            {/* Top Bar inside Card */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Category Pill */}
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(mod.category)}`}>
                    {mod.category}
                  </span>

                  {/* Code Tag */}
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    isLight 
                      ? 'text-slate-700 bg-slate-100 border-slate-200' 
                      : 'text-slate-300 bg-slate-800 border-slate-700'
                  }`}>
                    {mod.code}
                  </span>

                  {/* Popular Tag if applicable */}
                  {mod.isPopular && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                      isLight 
                        ? 'bg-amber-50 text-amber-800 border-amber-200' 
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    }`}>
                      <Zap className="w-3 h-3 text-amber-500" />
                      {isTh ? 'ใช้บ่อย' : 'Popular'}
                    </span>
                  )}
                </div>

                {/* Pin Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(mod.id);
                  }}
                  className={`p-1.5 rounded-lg text-xs transition ${
                    mod.pinned 
                      ? isLight
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                      : isLight
                        ? 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                  title={mod.pinned ? 'Unpin module' : 'Pin to top'}
                >
                  <Pin className={`w-3.5 h-3.5 ${mod.pinned ? (isLight ? 'fill-blue-600' : 'fill-cyan-400') : ''}`} />
                </button>
              </div>

              {/* Title & Icon Header */}
              <div className="flex items-start gap-3.5 mt-2">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-colors duration-200 shadow-xs ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600'
                    : 'bg-slate-800 border-slate-700/80 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950'
                }`}>
                  <IconRenderer name={mod.iconName} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-base font-bold transition-colors leading-snug line-clamp-2 ${
                    isLight 
                      ? 'text-slate-900 group-hover:text-blue-600' 
                      : 'text-white group-hover:text-cyan-300'
                  }`}>
                    {title}
                  </h3>
                  <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {description}
                  </p>
                </div>
              </div>

              {/* Quick Metrics Peek inside Card */}
              {mod.metrics && mod.metrics.length > 0 && (
                <div className={`mt-4 pt-3 border-t grid grid-cols-2 gap-2 ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
                  {mod.metrics.map((met, idx) => (
                    <div key={idx} className={`rounded-lg p-2 border ${
                      isLight ? 'bg-slate-50/80 border-slate-200/60' : 'bg-slate-950/60 border-slate-800/60'
                    }`}>
                      <span className={`text-[10px] block truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isTh ? met.labelTh : met.labelEn}
                      </span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{met.value}</span>
                        {met.trend && (
                          <span className={`text-[10px] font-semibold ${met.trendUp ? 'text-emerald-600' : isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {met.trend}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions inside Card */}
            <div className={`mt-5 pt-3.5 border-t flex items-center justify-between gap-2 ${isLight ? 'border-slate-100' : 'border-slate-800/80'}`}>
              <div className={`flex items-center gap-1.5 text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{mod.version}</span>
              </div>

              <button
                onClick={() => onSelectModule(mod)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition shadow-xs active:scale-95 group/btn ${
                  isLight
                    ? 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border-slate-200 hover:border-blue-600'
                    : 'bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 border-slate-700 hover:border-cyan-400'
                }`}
              >
                <span>{isTh ? 'เปิดแอป / ดูสเปค' : 'Launch / Specs'}</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
