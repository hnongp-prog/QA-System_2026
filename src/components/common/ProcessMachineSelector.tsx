import React from 'react';
import { STANDARD_PROCESS_OPTIONS, STANDARD_PROCESS_DESCRIPTIONS, STANDARD_MACHINE_OPTIONS } from '../../constants/processOptions';

interface ProcessSelectorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  isLight?: boolean;
  placeholder?: string;
  className?: string;
  showQuickChips?: boolean;
  disabled?: boolean;
}

export const ProcessSelector: React.FC<ProcessSelectorProps> = ({
  id = 'process-input',
  value,
  onChange,
  label = 'Process',
  required = false,
  isLight = false,
  placeholder = 'เช่น EXT, COT, CUT, MIX, ReW...',
  className = '',
  showQuickChips = false,
  disabled = false
}) => {
  const currentProcessDesc = STANDARD_PROCESS_DESCRIPTIONS[value]?.th;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          {currentProcessDesc && (
            <span className="text-[9px] font-medium text-cyan-500 truncate max-w-[150px]">
              {currentProcessDesc.split(' ')[0]}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <input
          id={id}
          list={`${id}-list`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`w-full rounded-xl px-3 py-2 text-xs font-semibold font-mono focus:outline-none transition border ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 placeholder-slate-400'
              : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 placeholder-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <datalist id={`${id}-list`}>
          {STANDARD_PROCESS_OPTIONS.map((proc) => {
            const desc = STANDARD_PROCESS_DESCRIPTIONS[proc];
            return (
              <option key={proc} value={proc} label={desc ? `${proc} — ${desc.th}` : proc}>
                {desc ? `${proc} — ${desc.th}` : proc}
              </option>
            );
          })}
        </datalist>
      </div>

      {showQuickChips && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {STANDARD_PROCESS_OPTIONS.map((proc) => (
            <button
              key={proc}
              type="button"
              onClick={() => onChange(proc)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition border ${
                value === proc
                  ? 'bg-cyan-500 text-white border-cyan-400 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800 hover:text-cyan-300'
              }`}
            >
              {proc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface MachineSelectorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  isLight?: boolean;
  placeholder?: string;
  className?: string;
  showQuickChips?: boolean;
  disabled?: boolean;
}

export const MachineSelector: React.FC<MachineSelectorProps> = ({
  id = 'machine-input',
  value,
  onChange,
  label = 'Machine',
  required = false,
  isLight = false,
  placeholder = 'เช่น P57, CM55A, SC51...',
  className = '',
  showQuickChips = false,
  disabled = false
}) => {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          list={`${id}-list`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={`w-full rounded-xl px-3 py-2 text-xs font-semibold font-mono focus:outline-none transition border ${
            isLight
              ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-slate-400'
              : 'bg-slate-950 border-slate-800 text-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 placeholder-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
        <datalist id={`${id}-list`}>
          {STANDARD_MACHINE_OPTIONS.map((mac) => (
            <option key={mac} value={mac} label={`Machine ${mac}`}>
              {mac}
            </option>
          ))}
        </datalist>
      </div>

      {showQuickChips && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {STANDARD_MACHINE_OPTIONS.slice(0, 8).map((mac) => (
            <button
              key={mac}
              type="button"
              onClick={() => onChange(mac)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono transition border ${
                value === mac
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border-slate-800 hover:text-indigo-300'
              }`}
            >
              {mac}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
