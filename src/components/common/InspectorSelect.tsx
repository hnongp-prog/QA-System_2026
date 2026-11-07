import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQAInspectors, calculateTenure } from '../../services/inspectorRoster';
import { QAInspector, InspectorDepartment } from '../../types';
import { 
  User, 
  ChevronDown, 
  Search, 
  Check, 
  ShieldCheck, 
  Briefcase, 
  Calendar, 
  X,
  ExternalLink
} from 'lucide-react';

export interface InspectorSelectProps {
  value: string;
  onChange: (value: string, inspector?: QAInspector) => void;
  department?: InspectorDepartment | 'ALL';
  placeholder?: string;
  className?: string;
  isLight?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  required?: boolean;
  compact?: boolean;
  onOpenRosterApp?: () => void;
}

export const InspectorSelect: React.FC<InspectorSelectProps> = ({
  value,
  onChange,
  department = 'ALL',
  placeholder = 'เลือกหรือพิมพ์ชื่อผู้ตรวจสอบ...',
  className = '',
  isLight = false,
  disabled = false,
  id,
  name,
  required = false,
  compact = false,
  onOpenRosterApp
}) => {
  const { activeInspectors } = useQAInspectors();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<InspectorDepartment | 'ALL'>(department);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find if currently entered value matches an inspector
  const matchedInspector = useMemo(() => {
    if (!value || !value.trim()) return null;
    const v = value.trim().toLowerCase();
    return activeInspectors.find(i => 
      i.name.toLowerCase() === v ||
      i.name.toLowerCase().includes(v) ||
      (i.nameEn && i.nameEn.toLowerCase() === v) ||
      i.empCode.toLowerCase() === v ||
      `${i.name} (${i.empCode})`.toLowerCase() === v
    );
  }, [value, activeInspectors]);

  // Filtered inspectors for popover
  const filteredInspectors = useMemo(() => {
    return activeInspectors.filter(i => {
      // Department filter
      if (selectedDeptFilter !== 'ALL' && i.department !== selectedDeptFilter && i.department !== 'QA_ALL') {
        return false;
      }
      // Search term
      if (search.trim()) {
        const q = search.toLowerCase();
        const mName = i.name.toLowerCase().includes(q);
        const mNameEn = i.nameEn?.toLowerCase().includes(q) || false;
        const mCode = i.empCode.toLowerCase().includes(q);
        const mDept = i.department.toLowerCase().includes(q);
        const mRole = i.role.toLowerCase().includes(q);
        return mName || mNameEn || mCode || mDept || mRole;
      }
      return true;
    });
  }, [activeInspectors, selectedDeptFilter, search]);

  const handleSelect = (ins: QAInspector) => {
    onChange(ins.name, ins);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const datalistId = useMemo(() => `datalist-inspectors-${Math.random().toString(36).slice(2, 7)}`, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Input Group with Icon, Clear, and Picker Toggle Button */}
      <div className="relative flex items-center">
        <div className={`absolute left-2.5 pointer-events-none transition-colors ${
          matchedInspector 
            ? 'text-cyan-500' 
            : isLight ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <User className="w-3.5 h-3.5" />
        </div>

        <input
          type="text"
          id={id}
          name={name}
          required={required}
          disabled={disabled}
          list={datalistId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl pl-8 pr-16 py-2 text-xs font-semibold focus:outline-none transition-all ${
            isLight
              ? 'bg-slate-50 border border-slate-300 text-slate-900 focus:bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
              : 'bg-slate-950 border border-slate-800 text-slate-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        />

        {/* Browser native datalist for seamless autocomplete */}
        <datalist id={datalistId}>
          {activeInspectors.map((ins) => (
            <option key={ins.id} value={ins.name}>
              {ins.empCode} • {ins.department} • {ins.nameEn || ''}
            </option>
          ))}
        </datalist>

        {/* Action icons right side */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              title="ล้างชื่อ"
              className={`p-1 rounded-lg transition ${
                isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              <X className="w-3 h-3" />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(prev => !prev)}
            title="เลือกจากรายชื่อ QA Inspector ทั้งหมด"
            className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5 border ${
              isOpen
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Matched Inspector Tag Badge */}
      {matchedInspector && !compact && (
        <div className="mt-1 flex items-center gap-1.5 text-[10px]">
          <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${
            isLight ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
          }`}>
            {matchedInspector.empCode}
          </span>
          <span className={`px-1.5 py-0.5 rounded font-semibold ${
            matchedInspector.department === 'IQA'
              ? isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-300'
              : matchedInspector.department === 'IPQA'
                ? isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-300'
                : isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-500/20 text-indigo-300'
          }`}>
            {matchedInspector.department}
          </span>
          <span className={`truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            อายุงาน: {calculateTenure(matchedInspector.startDate, true)}
          </span>
        </div>
      )}

      {/* Popover Dropdown Roster */}
      {isOpen && (
        <div className={`absolute z-[100] left-0 mt-1 w-full min-w-[300px] sm:min-w-[340px] max-w-[420px] rounded-2xl border shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white border-slate-200 shadow-slate-300/60 text-slate-900'
            : 'bg-slate-900 border-slate-800 shadow-black/80 text-white'
        }`}>
          {/* Header & Quick Search */}
          <div className="space-y-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-500" />
                <span className="text-xs font-bold">
                  รายชื่อผู้ตรวจสอบคุณภาพ (QA Inspectors)
                </span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}>
                {activeInspectors.length} ท่าน
              </span>
            </div>

            {/* Search Input inside popover */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก..."
                className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium focus:outline-none ${
                  isLight
                    ? 'bg-slate-100 border border-slate-200 text-slate-900 focus:bg-white focus:border-cyan-500'
                    : 'bg-slate-950 border border-slate-800 text-white focus:border-cyan-500'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Department Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 scrollbar-none">
              {(['ALL', 'IQA', 'IPQA', 'OQA'] as const).map(dept => {
                const isSelected = selectedDeptFilter === dept;
                return (
                  <button
                    key={dept}
                    type="button"
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition whitespace-nowrap ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : isLight
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {dept === 'ALL' ? 'ทุกแผนก' : dept}
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Inspectors */}
          <div className="mt-2 max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredInspectors.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                ไม่พบรายชื่อพนักงานที่ตรงกับเงื่อนไข
              </div>
            ) : (
              filteredInspectors.map((ins) => {
                const isSelected = value === ins.name;
                return (
                  <button
                    key={ins.id}
                    type="button"
                    onClick={() => handleSelect(ins)}
                    className={`w-full text-left p-2 rounded-xl transition flex items-center justify-between border ${
                      isSelected
                        ? isLight
                          ? 'bg-cyan-50 border-cyan-300 text-cyan-900 font-bold'
                          : 'bg-cyan-950/60 border-cyan-500 text-cyan-200 font-bold'
                        : isLight
                          ? 'bg-white hover:bg-slate-50 border-transparent text-slate-800'
                          : 'bg-slate-900/60 hover:bg-slate-800 border-transparent text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {ins.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs truncate">{ins.name}</span>
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold ${
                            isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-cyan-300'
                          }`}>
                            {ins.empCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className={`font-semibold ${
                            ins.department === 'IQA' ? 'text-blue-400' :
                            ins.department === 'IPQA' ? 'text-amber-400' : 'text-indigo-400'
                          }`}>
                            {ins.department}
                          </span>
                          <span>•</span>
                          <span>เริ่ม {ins.startDate} ({calculateTenure(ins.startDate, true)})</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-cyan-500 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with shortcut to QA Inspector roster app */}
          {onOpenRosterApp && (
            <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px]">
              <span className="text-slate-400">เพิ่ม/แก้ไขข้อมูลพนักงานได้ที่</span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenRosterApp();
                }}
                className="text-cyan-500 hover:text-cyan-400 font-bold flex items-center gap-1 transition"
              >
                <span>เปิดแอป QA Inspector</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
