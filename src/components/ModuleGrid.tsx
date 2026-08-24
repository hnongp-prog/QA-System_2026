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
import { QAModule, Language } from '../types';
import { IconRenderer } from './IconRenderer';

interface ModuleGridProps {
  modules: QAModule[];
  onSelectModule: (module: QAModule) => void;
  onTogglePin: (id: string) => void;
  language: Language;
}

export const ModuleGrid: React.FC<ModuleGridProps> = ({
  modules,
  onSelectModule,
  onTogglePin,
  language
}) => {
  const isTh = language === 'th';

  if (modules.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center my-8">
        <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          {isTh ? 'ไม่พบเมนูระบบย่อยที่ค้นหา' : 'No QA Sub-App Modules Found'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {isTh 
            ? 'ลองเปลี่ยนหมวดหมู่หรือคำค้นหา หรือกดปุ่ม "เพิ่มแอปย่อยใหม่" ด้านบนเพื่อสร้างเมนูใหม่' 
            : 'Try changing category filter or search query, or click "Add Sub-App Module" to register a new menu.'}
        </p>
      </div>
    );
  }

  // Category Color Map
  const getCategoryBadgeClass = (category: string) => {
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
      case 'AUDIT':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
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
            className={`group bg-slate-900/90 border rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-cyan-500/5 relative overflow-hidden cursor-pointer ${
              mod.pinned 
                ? 'border-cyan-500/50 bg-gradient-to-b from-slate-900 to-slate-900/95 shadow-md shadow-cyan-950/40' 
                : 'border-slate-800 hover:border-slate-700'
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
                  <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {mod.code}
                  </span>

                  {/* Popular Tag if applicable */}
                  {mod.isPopular && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" />
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
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' 
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  }`}
                  title={mod.pinned ? 'Unpin module' : 'Pin to top'}
                >
                  <Pin className={`w-3.5 h-3.5 ${mod.pinned ? 'fill-cyan-400' : ''}`} />
                </button>
              </div>

              {/* Title & Icon Header */}
              <div className="flex items-start gap-3.5 mt-2">
                <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors duration-200 shadow-sm">
                  <IconRenderer name={mod.iconName} className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug line-clamp-2">
                    {title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Quick Metrics Peek inside Card */}
              {mod.metrics && mod.metrics.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2">
                  {mod.metrics.map((met, idx) => (
                    <div key={idx} className="bg-slate-950/60 rounded-lg p-2 border border-slate-800/60">
                      <span className="text-[10px] text-slate-400 block truncate">
                        {isTh ? met.labelTh : met.labelEn}
                      </span>
                      <div className="flex items-baseline justify-between mt-0.5">
                        <span className="text-xs font-bold text-slate-200">{met.value}</span>
                        {met.trend && (
                          <span className={`text-[10px] font-semibold ${met.trendUp ? 'text-emerald-400' : 'text-slate-400'}`}>
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
            <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{mod.version}</span>
              </div>

              <button
                onClick={() => onSelectModule(mod)}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 hover:border-cyan-400 transition shadow-sm active:scale-95 group/btn"
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
