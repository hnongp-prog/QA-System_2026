import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Language, ThemeMode } from '../types';

interface FooterProps {
  language: Language;
  theme?: ThemeMode;
}

export const Footer: React.FC<FooterProps> = ({ language, theme = 'light' }) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  return (
    <footer className={`${isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'} border-t py-8 px-4 text-xs mt-12 transition-colors`}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Info */}
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
            isLight ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-900 border-slate-800 text-cyan-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className={`font-bold block text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              QA Inspection System Portal
            </span>
            <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              {isTh 
                ? 'ระบบบริหารจัดการและควบคุมคุณภาพการผลิตตามมาตรฐานสากล' 
                : 'Enterprise Quality Assurance & Inspection Management Framework'}
            </p>
          </div>
        </div>

        {/* Center Tech Stack Pills */}
        <div className="flex items-center gap-2 flex-wrap justify-center text-[11px] font-mono">
          <span className={`px-2.5 py-1 rounded border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
            ISO 9001 / IATF 16949
          </span>
          <span className={`px-2.5 py-1 rounded border ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-300'}`}>
            MIL-STD-105E AQL
          </span>
          <span className={`px-2.5 py-1 rounded border ${isLight ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-900 border-slate-800 text-cyan-400'}`}>
            Light Industrial Ready
          </span>
        </div>

        {/* Right Status */}
        <div className={`text-right text-[11px] ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          <div className="flex items-center gap-1.5 justify-end text-emerald-600 font-semibold mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isTh ? 'ระบบเมนูหลักพร้อมใช้งาน' : 'Main Portal Ready'}</span>
          </div>
          <span>© 2026 Quality Assurance Engineering Team</span>
        </div>

      </div>
    </footer>
  );
};
