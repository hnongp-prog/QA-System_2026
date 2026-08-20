import React from 'react';
import { ShieldCheck, Cpu, Code2, Globe, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface FooterProps {
  language: Language;
}

export const Footer: React.FC<FooterProps> = ({ language }) => {
  const isTh = language === 'th';

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 px-4 text-xs mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-slate-200 block text-sm">
              QA Inspection System Portal
            </span>
            <p className="text-[11px] text-slate-500">
              {isTh 
                ? 'ระบบบริหารจัดการและควบคุมคุณภาพการผลิตตามมาตรฐานสากล' 
                : 'Enterprise Quality Assurance & Inspection Management Framework'}
            </p>
          </div>
        </div>

        {/* Center Tech Stack Pills */}
        <div className="flex items-center gap-2 flex-wrap justify-center text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            ISO 9001 / IATF 16949
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
            MIL-STD-105E AQL
          </span>
          <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-400">
            Sub-App Ready Architecture
          </span>
        </div>

        {/* Right Status */}
        <div className="text-right text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 justify-end text-emerald-400 font-semibold mb-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isTh ? 'ระบบเมนูหลักพร้อมใช้งาน' : 'Main Portal Ready'}</span>
          </div>
          <span>© 2026 Quality Assurance Engineering Team</span>
        </div>

      </div>
    </footer>
  );
};
