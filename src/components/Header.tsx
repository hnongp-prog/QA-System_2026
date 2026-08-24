import React from 'react';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Globe,
  Sun,
  Moon
} from 'lucide-react';
import { UserRole, Language, UserProfile, ShiftInfo, ThemeMode } from '../types';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
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
  theme,
  onToggleTheme,
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
  const isLight = theme === 'light';

  return (
    <header className={`${isLight ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-900 text-white border-slate-800'} border-b sticky top-0 z-30 shadow-sm transition-colors duration-200`}>
      {/* Top Utility Ribbon */}
      <div className={`${isLight ? 'bg-slate-100/80 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800/80 text-slate-400'} px-4 py-1.5 text-xs border-b flex flex-wrap items-center justify-between gap-2 transition-colors`}>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            QA Online Server Active
          </span>
          <span className="hidden sm:inline-block text-[11px] text-slate-400 font-mono">
            Plant #1 • Shift A
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Theme Mode Switcher */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
              isLight 
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Modern Clean'}
          >
            {isLight ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px]">Light Clean</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px]">Dark Mode</span>
              </>
            )}
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={() => onLanguageChange(isTh ? 'en' : 'th')}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition ${
              isLight
                ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span className="font-semibold text-[11px]">{isTh ? '🇹🇭 TH' : '🇬🇧 EN'}</span>
          </button>
        </div>
      </div>

      {/* Main Brand Bar */}
      <div className="px-4 py-3.5 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-800 p-0.5 shadow-md flex items-center justify-center shrink-0">
            <div className={`w-full h-full ${isLight ? 'bg-white' : 'bg-slate-900'} rounded-[10px] flex items-center justify-center transition-colors`}>
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                QA Inspection System
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                  isLight 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                }`}>
                  Main Portal
                </span>
              </h1>
            </div>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {isTh 
                ? 'ระบบเมนูหลักรวมแอปพลิเคชันตรวจคุณภาพและควบคุมมาตรฐานโรงงาน' 
                : 'Centralized Quality Inspection & Standards Control Sub-App Portal'}
            </p>
          </div>
        </div>

        {/* Center Search & Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={
                isTh 
                  ? 'ค้นหาระบบย่อย (เช่น IQA, IPQA, OQA, NCR, รหัสระบบ)...' 
                  : 'Search sub-apps (e.g., IQA, IPQA, OQA, NCR, module code)...'
              }
              className={`w-full pl-9 pr-4 py-2 rounded-lg text-sm transition shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                isLight
                  ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600'
                  : 'bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-400 focus:border-cyan-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs rounded-full w-4 h-4 flex items-center justify-center ${
                  isLight ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
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
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm hover:shadow transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{isTh ? 'เพิ่มแอปย่อยใหม่ (+ App Module)' : 'Add Sub-App Module'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

