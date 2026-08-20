import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Globe
} from 'lucide-react';
import { UserRole, Language, UserProfile, ShiftInfo } from '../types';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  userProfile: UserProfile;
  onUserProfileChange: (role: UserRole) => void;
  shiftInfo: ShiftInfo;
  onShiftInfoChange: (shift: ShiftInfo) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenAddModal: () => void;
  totalModulesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  userProfile,
  onUserProfileChange,
  shiftInfo,
  onShiftInfoChange,
  searchQuery,
  onSearchChange,
  onOpenAddModal,
  totalModulesCount
}) => {
  const isTh = language === 'th';

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Utility Ribbon */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            QA Online Server Active
          </span>

        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher Button */}
          <button
            onClick={() => onLanguageChange(isTh ? 'en' : 'th')}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">{isTh ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
          </button>
        </div>
      </div>

      {/* Main Brand Bar */}
      <div className="px-4 py-3.5 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                QA Inspection System
                <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Main Portal
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              {isTh 
                ? 'ระบบเมนูหลักรวมแอปพลิเคชันตรวจคุณภาพและควบคุมมาตรฐานโรงงาน' 
                : 'Centralized Quality Inspection & Standards Control Sub-App Portal'}
            </p>
          </div>
        </div>

        {/* Center Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isTh 
                  ? 'ค้นหาระบบย่อย (เช่น IQC, IPQC, NCR, รหัสระบบ)...' 
                  : 'Search sub-apps (e.g., IQC, IPQC, NCR, module code)...'
              }
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 bg-slate-700 rounded-full w-4 h-4 flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right CTA Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg shadow-md hover:shadow-cyan-500/20 transition active:scale-95 border border-cyan-400/30 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isTh ? 'เพิ่มแอปย่อยใหม่ (+ App Module)' : 'Add Sub-App Module'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
