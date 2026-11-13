import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Beaker, 
  History, 
  PlusCircle, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Save,
  BarChart3,
  Lock,
  ArrowLeft,
  Plus,
  Search,
  Settings,
  Download,
  Target,
  Sliders,
  TrendingUp,
  Layers,
  Edit3,
  X,
  FileSpreadsheet,
  RotateCcw,
  Moon,
  Sun,
  Filter,
  PieChart,
  ClipboardCheck
} from 'lucide-react';

import { 
  MixingCoatingSpec, 
  MixingInspectionRecord, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { useCloudState } from '../services/firestoreSync';
import { InspectorDatalist, saveRecordedInspector } from '../utils/inspectorStorage';
import { ProcessSelector, MachineSelector } from './common/ProcessMachineSelector';

interface MixingInspectionAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

// Helper to parse spec limit string (e.g. "15.0 - 17.5", "40.0 ± 2.0", "< 25", "18 - 22")
const parseSpecLimits = (spec?: string): { min: number | null; max: number | null; target: number | null } => {
  if (!spec || spec.trim() === '') return { min: null, max: null, target: null };
  const s = spec.trim();
  try {
    if (s.includes('<')) {
      const maxVal = parseFloat(s.replace('<', '').trim());
      return { min: 0, max: isNaN(maxVal) ? null : maxVal, target: null };
    }
    if (s.includes('>')) {
      const minVal = parseFloat(s.replace('>', '').trim());
      return { min: isNaN(minVal) ? null : minVal, max: null, target: null };
    }
    if (s.includes('±')) {
      const parts = s.split('±');
      const target = parseFloat(parts[0].trim());
      const tol = parseFloat(parts[1].trim());
      if (!isNaN(target) && !isNaN(tol)) {
        return { min: parseFloat((target - tol).toFixed(2)), max: parseFloat((target + tol).toFixed(2)), target };
      }
    }
    if (s.includes('-') || s.toLowerCase().includes('to')) {
      const parts = s.split(/-|to/i);
      const min = parseFloat(parts[0].trim());
      const max = parseFloat(parts[1].trim());
      if (!isNaN(min) && !isNaN(max)) {
        return { min, max, target: parseFloat(((min + max) / 2).toFixed(2)) };
      }
    }
    const single = parseFloat(s);
    if (!isNaN(single)) return { min: single, max: single, target: single };
  } catch {
    return { min: null, max: null, target: null };
  }
  return { min: null, max: null, target: null };
};

// Trend Data Point interface for Mixing Inspection
export interface MixingTrendPointItem {
  index: number;
  id: string;
  date: string;
  timestamp?: string;
  lotNumber: string; // Cup No.
  mixingLot?: string;
  coatingType: string;
  judgment: string;
  inspector?: string;
  binderPercent: number;
  solidParticlePercent: number;
  grindometer: number;
  viscosity: number;
}

// Full-width parameter row chart component (Binder %, Solid %, Grindometer, Viscosity)
interface MixingParameterRowCardProps {
  paramKey: 'binderPercent' | 'solidParticlePercent' | 'grindometer' | 'viscosity';
  title: string;
  thaiTitle: string;
  descriptionTh: string;
  descriptionEn: string;
  color: string;
  data: MixingTrendPointItem[];
  unit: string;
  specString?: string;
  isLight: boolean;
  isTh: boolean;
}

const MixingParameterRowCard: React.FC<MixingParameterRowCardProps> = ({
  paramKey,
  title,
  thaiTitle,
  descriptionTh,
  descriptionEn,
  color,
  data,
  unit,
  specString = '',
  isLight,
  isTh,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Extract non-zero / valid data points
  const validPoints = useMemo(() => {
    return data
      .map(item => ({
        ...item,
        value: item[paramKey]
      }))
      .filter(item => !isNaN(item.value) && item.value > 0);
  }, [data, paramKey]);

  const { min: specMin, max: specMax, target: specTarget } = useMemo(() => {
    return parseSpecLimits(specString);
  }, [specString]);

  const count = validPoints.length;
  const avg = count > 0 ? validPoints.reduce((acc, p) => acc + p.value, 0) / count : 0;
  const min = count > 0 ? Math.min(...validPoints.map(p => p.value)) : 0;
  const max = count > 0 ? Math.max(...validPoints.map(p => p.value)) : 0;
  const last = count > 0 ? validPoints[validPoints.length - 1].value : 0;

  const outOfSpecCount = useMemo(() => {
    if (specMin === null && specMax === null) return 0;
    return validPoints.filter(p => {
      if (specMin !== null && specMin !== undefined && p.value < specMin) return true;
      if (specMax !== null && specMax !== undefined && p.value > specMax) return true;
      return false;
    }).length;
  }, [validPoints, specMin, specMax]);

  // Chart Dimensions
  const width = 1000;
  const height = 240;
  const padding = { top: 25, right: 35, bottom: 45, left: 65 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Calculate dynamic Y domain including spec limits with headroom
  const values = validPoints.map(p => p.value);
  if (specTarget !== null && specTarget !== undefined) values.push(specTarget);
  if (specMin !== null && specMin !== undefined) values.push(specMin);
  if (specMax !== null && specMax !== undefined) values.push(specMax);

  const rawMin = values.length > 0 ? Math.min(...values) : 0;
  const rawMax = values.length > 0 ? Math.max(...values) : 10;
  const margin = Math.max((rawMax - rawMin) * 0.15, rawMax * 0.05, 0.5);

  const domainMin = Math.max(0, parseFloat((rawMin - margin).toFixed(2)));
  const domainMax = parseFloat((rawMax + margin).toFixed(2));
  const domainRange = domainMax - domainMin || 1;

  const getX = (index: number) => {
    if (count <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (count - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - domainMin) / domainRange) * innerHeight;
  };

  const pointsString = validPoints.map((p, i) => `${getX(i)},${getY(p.value)}`).join(' ');
  const areaPolygonString = count > 1 
    ? `${getX(0)},${padding.top + innerHeight} ${pointsString} ${getX(count - 1)},${padding.top + innerHeight}`
    : '';

  // 5 grid lines
  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = domainMin + (domainRange / gridSteps) * i;
    const y = getY(val);
    return { val, y };
  });

  const hoveredPoint = hoveredIdx !== null && validPoints[hoveredIdx] ? validPoints[hoveredIdx] : null;

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isLight 
        ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300' 
        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
    }`}>
      {/* Header Info & Stats Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span 
              className="w-3.5 h-3.5 rounded-md shadow-sm"
              style={{ backgroundColor: color }}
            />
            <h4 className={`font-bold text-base tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {title}
            </h4>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              {thaiTitle}
            </span>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
              ({unit})
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {isTh ? descriptionTh : descriptionEn}
            {specString && (
              <span className="ml-2 font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                [Spec Requirement: {specString} {unit}]
              </span>
            )}
          </p>
        </div>

        {/* Statistical Summary Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sample count N */}
          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Sample N</span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{count}</span>
          </div>

          {/* Average */}
          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Avg (X̄)</span>
            <span className="text-xs font-mono font-bold" style={{ color }}>
              {count > 0 ? avg.toFixed(2) : '-'}
            </span>
          </div>

          {/* Min / Max */}
          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Min / Max</span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              {count > 0 ? `${min.toFixed(1)} / ${max.toFixed(1)}` : '-'}
            </span>
          </div>

          {/* Last */}
          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Last</span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {count > 0 ? last.toFixed(2) : '-'}
            </span>
          </div>

          {/* Out of Spec Badge */}
          {(specMin !== null || specMax !== null) && (
            <div className={`px-3 py-1.5 rounded-xl border text-center ${
              outOfSpecCount === 0
                ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-800 text-emerald-400')
                : (isLight ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-800 text-rose-400')
            }`}>
              <span className="text-[9px] uppercase tracking-wider block font-bold">Out of Spec</span>
              <span className="text-xs font-mono font-black">
                {outOfSpecCount} {count > 0 ? `(${((outOfSpecCount / count) * 100).toFixed(1)}%)` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative mt-4">
        {count === 0 ? (
          <div className={`h-48 flex flex-col items-center justify-center text-xs border border-dashed rounded-xl ${
            isLight ? 'bg-slate-50 border-slate-300 text-slate-600' : 'bg-slate-950/50 border-slate-800 text-slate-400'
          }`}>
            <BarChart3 className="w-8 h-8 opacity-30 mb-2" />
            <span>{isTh ? 'ไม่มีข้อมูลการตรวจวัดสำหรับพารามิเตอร์นี้ในช่วงที่เลือก' : 'No inspection data available for this parameter'}</span>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className={`w-full h-56 sm:h-64 transition-colors select-none rounded-xl border ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
              }`}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <defs>
                <linearGradient id={`mix-grad-${paramKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-axis labels */}
              {gridLines.map((gl, i) => (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={gl.y}
                    x2={width - padding.right}
                    y2={gl.y}
                    stroke={isLight ? '#e2e8f0' : '#1e293b'}
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={gl.y + 3.5}
                    textAnchor="end"
                    fontSize="10"
                    fontFamily="monospace"
                    fill={isLight ? '#64748b' : '#64748b'}
                  >
                    {gl.val.toFixed(1)}
                  </text>
                </g>
              ))}

              {/* TARGET SPEC LINE (Dotted Blue) */}
              {specTarget !== null && specTarget !== undefined && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(specTarget)}
                    x2={width - padding.right}
                    y2={getY(specTarget)}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                  <text
                    x={padding.left + 8}
                    y={getY(specTarget) - 5}
                    textAnchor="start"
                    fontSize="9.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill="#0284c7"
                  >
                    TARGET: {specTarget} {unit}
                  </text>
                </g>
              )}

              {/* SPEC MIN LIMIT LINE (Dashed Red/Orange) */}
              {specMin !== null && specMin !== undefined && specMin > 0 && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(specMin)}
                    x2={width - padding.right}
                    y2={getY(specMin)}
                    stroke="#ef4444"
                    strokeWidth="1.8"
                    strokeDasharray="6 4"
                  />
                  <text
                    x={width - padding.right}
                    y={getY(specMin) + 12}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill="#ef4444"
                  >
                    SPEC MIN: {specMin} {unit}
                  </text>
                </g>
              )}

              {/* SPEC MAX LIMIT LINE (Dashed Red/Orange) */}
              {specMax !== null && specMax !== undefined && (
                <g>
                  <line
                    x1={padding.left}
                    y1={getY(specMax)}
                    x2={width - padding.right}
                    y2={getY(specMax)}
                    stroke="#f97316"
                    strokeWidth="1.8"
                    strokeDasharray="6 4"
                  />
                  <text
                    x={width - padding.right}
                    y={getY(specMax) - 5}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                    fill="#f97316"
                  >
                    SPEC MAX: {specMax} {unit}
                  </text>
                </g>
              )}

              {/* Area Fill Gradient under the line */}
              {count > 1 && (
                <polygon
                  points={areaPolygonString}
                  fill={`url(#mix-grad-${paramKey})`}
                />
              )}

              {/* Main Trend Polyline */}
              {count > 1 && (
                <polyline
                  points={pointsString}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Hover highlight guide vertical line */}
              {hoveredIdx !== null && validPoints[hoveredIdx] && (
                <line
                  x1={getX(hoveredIdx)}
                  y1={padding.top}
                  x2={getX(hoveredIdx)}
                  y2={padding.top + innerHeight}
                  stroke={isLight ? '#94a3b8' : '#475569'}
                  strokeDasharray="2 2"
                  strokeWidth="1.2"
                />
              )}

              {/* Data Point Circles */}
              {validPoints.map((p, i) => {
                const cx = getX(i);
                const cy = getY(p.value);
                const isHovered = hoveredIdx === i;
                const isOut = (specMin !== null && p.value < specMin) || (specMax !== null && p.value > specMax);

                return (
                  <g key={p.id || i} className="cursor-pointer">
                    {/* Invisible larger hover hitbox */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill="transparent"
                      onMouseEnter={() => setHoveredIdx(i)}
                    />
                    {/* Visual Point */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 3.8}
                      fill={isOut ? '#ef4444' : (isLight ? '#ffffff' : '#0f172a')}
                      stroke={isOut ? '#ef4444' : color}
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* Bottom timeline milestone labels on X-axis */}
              {count > 0 && (
                <g fontSize="10" fontFamily="monospace" fill={isLight ? '#64748b' : '#64748b'}>
                  <text x={getX(0)} y={height - 12} textAnchor="start">
                    #1 ({validPoints[0].lotNumber})
                  </text>
                  {count > 3 && (
                    <text x={getX(Math.floor(count / 2))} y={height - 12} textAnchor="middle">
                      #{Math.floor(count / 2) + 1} ({validPoints[Math.floor(count / 2)].date || ''})
                    </text>
                  )}
                  {count > 1 && (
                    <text x={getX(count - 1)} y={height - 12} textAnchor="end">
                      #{count} ({validPoints[count - 1].lotNumber})
                    </text>
                  )}
                </g>
              )}
            </svg>

            {/* Interactive Floating Tooltip */}
            {hoveredPoint && (
              <div
                className={`absolute z-30 pointer-events-none p-3 rounded-xl shadow-xl border text-xs font-sans transition-all transform -translate-y-full -translate-x-1/2 ${
                  isLight 
                    ? 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/30' 
                    : 'bg-slate-950/95 text-slate-100 border-slate-700 shadow-black/60'
                }`}
                style={{
                  left: `${(getX(hoveredIdx!) / width) * 100}%`,
                  top: `${Math.max(15, (getY(hoveredPoint.value) / height) * 100 - 8)}%`,
                  minWidth: '220px'
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1.5">
                  <span className="font-bold text-indigo-400">
                    Sample #{hoveredPoint.index}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    hoveredPoint.judgment === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {hoveredPoint.judgment}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cup No:</span>
                    <span className="font-bold text-white">{hoveredPoint.lotNumber}</span>
                  </div>
                  {hoveredPoint.mixingLot && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Mixing Lot:</span>
                      <span className="text-slate-200">{hoveredPoint.mixingLot}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coating Type:</span>
                    <span className="text-indigo-300 font-semibold">{hoveredPoint.coatingType}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1">
                    <span className="text-slate-300 font-sans font-bold">{title}:</span>
                    <span className="font-bold text-sm" style={{ color }}>
                      {hoveredPoint.value.toFixed(2)} {unit}
                    </span>
                  </div>
                  {specString && (
                    <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800 pt-1">
                      <span>Spec Evaluation:</span>
                      <span className={
                        (specMin !== null && hoveredPoint.value < specMin) || (specMax !== null && hoveredPoint.value > specMax)
                          ? 'text-rose-400 font-bold'
                          : 'text-emerald-400 font-bold'
                      }>
                        {(specMin !== null && hoveredPoint.value < specMin) || (specMax !== null && hoveredPoint.value > specMax)
                          ? 'Out of Spec'
                          : 'In Spec'}
                      </span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                    <span>Date: {hoveredPoint.date || hoveredPoint.timestamp}</span>
                    <span>Insp: {hoveredPoint.inspector || '-'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DEFAULT_COATING_SPECS: MixingCoatingSpec[] = [
  { 
    name: 'Standard Coating A (Type-100)', 
    binderSpec: '15.0 - 17.5',
    solidSpec: '40.0 ± 2.0',
    grindoSpec: '< 25',
    viscoSpec: '18 - 22'
  },
  { 
    name: 'Heavy Duty Coating B (Type-200)', 
    binderSpec: '18.0 - 22.0',
    solidSpec: '45.0 ± 3.0',
    grindoSpec: '< 20',
    viscoSpec: '22 - 28'
  }
];

const INITIAL_INSPECTIONS: MixingInspectionRecord[] = [
  {
    id: 'rec-mix-001',
    inspectorName: 'Anan S.',
    mixingLot: 'MIX-2026-A101',
    coatingType: 'Standard Coating A (Type-100)',
    lotNumber: 'CUP-101',
    cupWeight: '12.4500',
    coatingWeight: '50.1200',
    cupCoatingWeight: '62.5700',
    wtAfterDry105: '32.8000',
    wtAfterDry430: '29.5000',
    weightOfBinder: '3.3000',
    totalCoatingWeight: '20.3500',
    binderPercent: '16.22',
    solidParticlePercent: '40.60',
    grindometer: '18',
    viscosity: '20',
    judgment: 'PASS',
    remarks: 'Sample within all standard specifications',
    date: '2026-08-05',
    timestamp: '05/08/2026, 09:30:00'
  },
  {
    id: 'rec-mix-002',
    inspectorName: 'Anan S.',
    mixingLot: 'MIX-2026-A101',
    coatingType: 'Standard Coating A (Type-100)',
    lotNumber: 'CUP-102',
    cupWeight: '12.4200',
    coatingWeight: '50.0500',
    cupCoatingWeight: '62.4700',
    wtAfterDry105: '35.1000',
    wtAfterDry430: '28.1000',
    weightOfBinder: '7.0000',
    totalCoatingWeight: '22.6800',
    binderPercent: '30.86',
    solidParticlePercent: '45.31',
    grindometer: '30',
    viscosity: '26',
    judgment: 'FAIL',
    remarks: 'Binder % and Grindometer exceed maximum limits',
    date: '2026-08-05',
    timestamp: '05/08/2026, 11:15:00'
  }
];

export const MixingInspectionApp: React.FC<MixingInspectionAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<'new-batch' | 'settings' | 'dashboard' | 'history'>('new-batch');
  const tableRef = useRef<HTMLDivElement>(null);

  // Profiles and Inspections with Real-time Cloud Sync
  const [savedCoatingTypes, setSavedCoatingTypes] = useCloudState<MixingCoatingSpec[]>('mixing_qc_profiles', DEFAULT_COATING_SPECS);
  const [inspections, setInspections] = useCloudState<MixingInspectionRecord[]>('mixing_qc_inspections', INITIAL_INSPECTIONS);

  // Auth State for Admin Settings
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Header Metadata State (Clean initial state)
  const [headerInfo, setHeaderInfo] = useState({
    inspectorName: '',
    shift: '',
    process: 'MIX',
    machine: '',
    mixingLot: '',
    date: new Date().toISOString().split('T')[0],
    coatingType: ''
  });

  const [coatingTypeSpecs, setCoatingTypeSpecs] = useState({
    binderSpec: '',
    solidSpec: '',
    grindoSpec: '',
    viscoSpec: ''
  });

  const [profileStatus, setProfileStatus] = useState<'found' | 'not-found'>('not-found');

  // Batch Rows Data Entry State (Clean initial state)
  const [batchItems, setBatchItems] = useState([
    {
      id: Date.now(),
      lotNumber: 'CUP-1',
      cupWeight: '',
      coatingWeight: '',
      cupCoatingWeight: '',
      wtAfterDry105: '',
      wtAfterDry430: '',
      weightOfBinder: '',
      totalCoatingWeight: '',
      binderPercent: '',
      solidParticlePercent: '',
      grindometer: '',
      viscosity: '',
      judgment: 'PENDING' as 'PASS' | 'FAIL' | 'PENDING',
      remarks: ''
    }
  ]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'profile' | 'history'; id: string; label: string } | null>(null);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<MixingInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<MixingInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: MixingInspectionRecord) => {
    setTargetEditHistoryItem(item);
    setHistoryAuthPassword('');
    setHistoryAuthError(false);
    setIsHistoryAuthOpen(true);
  };

  const handleVerifyHistoryPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (historyAuthPassword === 'admin2026') {
      setIsHistoryAuthOpen(false);
      setHistoryAuthError(false);
      if (targetEditHistoryItem) {
        setEditingHistoryItem(JSON.parse(JSON.stringify(targetEditHistoryItem)));
      }
    } else {
      setHistoryAuthError(true);
      setHistoryAuthPassword('');
    }
  };

  const handleSaveEditedHistory = () => {
    if (!editingHistoryItem) return;
    setInspections(prev => prev.map(ins => ins.id === editingHistoryItem.id ? editingHistoryItem : ins));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
    showNotification(isTh ? 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว' : 'Record updated successfully');
  };

  const [trendFilterProfile, setTrendFilterProfile] = useState('All');
  const [trendFilterMonth, setTrendFilterMonth] = useState('All');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Handle Admin Verification
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin2026') {
      setIsAdminAuthenticated(true);
      setAdminAuthError(false);
      setAdminPasswordInput('');
      setShowAdminModal(false);
      setActiveTab('settings');
    } else {
      setAdminAuthError(true);
      showNotification(isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password', 'error');
    }
  };

  const handleAdminAccess = () => {
    if (isAdminAuthenticated) {
      setActiveTab('settings');
    } else {
      setShowAdminModal(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const form = (e.target as HTMLElement).closest('form') || tableRef.current;
      if (!form) return;

      const focusableElements = Array.from(
        form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input:not([disabled]), select:not([disabled])')
      );
      
      const index = focusableElements.indexOf(e.target as HTMLInputElement);
      if (index > -1 && index < focusableElements.length - 1) {
        (focusableElements[index + 1] as HTMLElement).focus();
      } else if (index === focusableElements.length - 1) {
        addRow();
        setTimeout(() => {
          const updated = Array.from(
            form.querySelectorAll<HTMLInputElement>('input:not([disabled])')
          );
          if (updated[index + 1]) (updated[index + 1] as HTMLElement).focus();
        }, 50);
      }
    }
  };

  const isIgnoredValue = (v?: string | number): boolean => {
    if (v === undefined || v === null) return true;
    const s = String(v).trim();
    return s === '' || s === '-' || s === '--' || s === '---' || s === 'N/A' || s === 'n/a' || s === 'none' || s === 'null' || s === 'undefined';
  };

  // Logic for judging a value against spec string (e.g. "15.0 - 17.5", "< 25", "40.0 ± 2.0")
  const checkPass = (value?: string, spec?: string): 'PASS' | 'FAIL' | 'PENDING' | 'IGNORED' => {
    if (isIgnoredValue(value)) return 'IGNORED';
    const s = String(value).trim();
    if (!spec || spec === '') return 'PENDING';
    const num = parseFloat(s);
    if (isNaN(num)) return 'PENDING';

    try {
      if (spec.includes('<')) {
        const limit = parseFloat(spec.replace('<', '').trim());
        return num < limit ? 'PASS' : 'FAIL';
      }
      if (spec.includes('>')) {
        const limit = parseFloat(spec.replace('>', '').trim());
        return num > limit ? 'PASS' : 'FAIL';
      }
      if (spec.includes('±')) {
        const parts = spec.split('±');
        const target = parseFloat(parts[0].trim());
        const tolerance = parseFloat(parts[1].trim());
        return (num >= target - tolerance && num <= target + tolerance) ? 'PASS' : 'FAIL';
      }
      if (spec.includes('-') || spec.toLowerCase().includes('to')) {
        const parts = spec.split(/-|to/i);
        const min = parseFloat(parts[0].trim());
        const max = parseFloat(parts[1].trim());
        return (num >= min && num <= max) ? 'PASS' : 'FAIL';
      }
      const singleLimit = parseFloat(spec);
      if (!isNaN(singleLimit)) return num === singleLimit ? 'PASS' : 'FAIL';

      return 'PENDING';
    } catch {
      return 'PENDING';
    }
  };

  const selectCoatingType = (profile: MixingCoatingSpec) => {
    setHeaderInfo(prev => ({
      ...prev,
      coatingType: profile.name
    }));
    setCoatingTypeSpecs({
      binderSpec: profile.binderSpec || '',
      solidSpec: profile.solidSpec || '',
      grindoSpec: profile.grindoSpec || '',
      viscoSpec: profile.viscoSpec || ''
    });
    setProfileStatus('found');
  };

  useEffect(() => {
    if (headerInfo.coatingType) {
      const match = savedCoatingTypes.find(p => p.name.toLowerCase() === headerInfo.coatingType.toLowerCase());
      if (match) {
        setProfileStatus('found');
        setCoatingTypeSpecs({
          binderSpec: match.binderSpec || '',
          solidSpec: match.solidSpec || '',
          grindoSpec: match.grindoSpec || '',
          viscoSpec: match.viscoSpec || ''
        });
      } else {
        setProfileStatus('not-found');
      }
    } else {
      setProfileStatus('not-found');
      setCoatingTypeSpecs({
        binderSpec: '',
        solidSpec: '',
        grindoSpec: '',
        viscoSpec: ''
      });
    }
  }, [headerInfo.coatingType, savedCoatingTypes]);

  const handleResetForm = () => {
    setHeaderInfo({
      inspectorName: '',
      shift: '',
      mixingLot: '',
      date: new Date().toISOString().split('T')[0],
      coatingType: ''
    });
    setCoatingTypeSpecs({
      binderSpec: '',
      solidSpec: '',
      grindoSpec: '',
      viscoSpec: ''
    });
    setProfileStatus('not-found');
    setBatchItems([
      {
        id: Date.now(),
        lotNumber: 'CUP-1',
        cupWeight: '',
        coatingWeight: '',
        cupCoatingWeight: '',
        wtAfterDry105: '',
        wtAfterDry430: '',
        weightOfBinder: '',
        totalCoatingWeight: '',
        binderPercent: '',
        solidParticlePercent: '',
        grindometer: '',
        viscosity: '',
        judgment: 'PENDING' as 'PASS' | 'FAIL' | 'PENDING',
        remarks: ''
      }
    ]);
    showNotification(isTh ? 'ล้างข้อมูลฟอร์มเรียบร้อยแล้ว' : 'Form reset successfully');
  };

  const handleSaveCoatingType = () => {
    if (!headerInfo.coatingType.trim()) {
      showNotification(isTh ? 'กรุณาระบุ Coating Type ก่อนบันทึก' : 'Please specify Coating Type Name', 'error');
      return;
    }

    const newProfile: MixingCoatingSpec = {
      name: headerInfo.coatingType.trim(),
      binderSpec: coatingTypeSpecs.binderSpec,
      solidSpec: coatingTypeSpecs.solidSpec,
      grindoSpec: coatingTypeSpecs.grindoSpec,
      viscoSpec: coatingTypeSpecs.viscoSpec
    };

    setSavedCoatingTypes(prev => {
      const idx = prev.findIndex(p => p.name.toLowerCase() === newProfile.name.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newProfile;
        return copy;
      }
      return [...prev, newProfile];
    });

    showNotification(isTh ? `บันทึก Coating Type "${newProfile.name}" เรียบร้อยแล้ว` : `Saved Coating Type "${newProfile.name}"`);
  };

  const handleDeleteCoatingType = (profileName: string) => {
    setSavedCoatingTypes(prev => prev.filter(p => p.name !== profileName));
    if (headerInfo.coatingType === profileName) {
      setHeaderInfo(prev => ({ ...prev, coatingType: '' }));
      setProfileStatus('not-found');
    }
    showNotification(isTh ? `ลบ Coating Type สำเร็จ` : `Deleted coating type`);
    setDeleteConfirm(null);
  };

  const handleDeleteHistoryItem = (docId: string) => {
    setInspections(prev => prev.filter(i => i.id !== docId));
    showNotification(isTh ? 'ลบรายการประวัติสำเร็จ' : 'Deleted history item');
    setDeleteConfirm(null);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addCups = (count: number = 1) => {
    setBatchItems(prev => {
      // Find the next cup number
      const cupNumbers = prev.map(item => {
        const match = item.lotNumber.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      });
      const maxCupNum = cupNumbers.length > 0 ? Math.max(...cupNumbers) : 0;
      const startNum = maxCupNum >= prev.length ? maxCupNum + 1 : prev.length + 1;

      const newItems: typeof prev = Array.from({ length: count }, (_, i) => {
        const num = startNum + i;
        return {
          id: Date.now() + i * 23 + Math.random(),
          lotNumber: `CUP-${num}`,
          cupWeight: '',
          coatingWeight: '',
          cupCoatingWeight: '',
          wtAfterDry105: '',
          wtAfterDry430: '',
          weightOfBinder: '',
          totalCoatingWeight: '',
          binderPercent: '',
          solidParticlePercent: '',
          grindometer: '',
          viscosity: '',
          judgment: 'PENDING' as 'PASS' | 'FAIL' | 'PENDING',
          remarks: ''
        };
      });

      return [...prev, ...newItems];
    });

    if (count > 1) {
      showNotification(isTh ? `เพิ่ม ${count} ถ้วย (CUP) ภายในครั้งเดียวเรียบร้อยแล้ว` : `Added ${count} cups batch at once successfully`);
    }
  };

  const addRow = () => addCups(1);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCoatingTypeSpecs(prev => ({ ...prev, [name]: value }));
  };

  // Item change and calculation logic
  const handleItemChange = (id: number, field: string, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => {
      if (item.id !== id) return item;

      const updatedItem = { ...item, [field]: value };
      const getNum = (val?: string) => (val && !isNaN(parseFloat(val))) ? parseFloat(val) : 0;

      // Auto Calculations
      if (field === 'cupWeight' || field === 'coatingWeight') {
        const sum = getNum(updatedItem.cupWeight) + getNum(updatedItem.coatingWeight);
        updatedItem.cupCoatingWeight = sum > 0 ? sum.toFixed(4) : '';
      }

      if (field === 'wtAfterDry105' || field === 'wtAfterDry430') {
        const diff = getNum(updatedItem.wtAfterDry105) - getNum(updatedItem.wtAfterDry430);
        updatedItem.weightOfBinder = (getNum(updatedItem.wtAfterDry105) > 0 && getNum(updatedItem.wtAfterDry430) > 0) ? diff.toFixed(4) : '';
      }

      if (field === 'wtAfterDry105' || field === 'cupWeight') {
        const diff = getNum(updatedItem.wtAfterDry105) - getNum(updatedItem.cupWeight);
        updatedItem.totalCoatingWeight = (getNum(updatedItem.wtAfterDry105) > 0 && getNum(updatedItem.cupWeight) > 0) ? diff.toFixed(4) : '';
      }

      const bWt = getNum(updatedItem.weightOfBinder);
      const tCWt = getNum(updatedItem.totalCoatingWeight);
      const cWt = getNum(updatedItem.coatingWeight);

      if (tCWt > 0) {
        updatedItem.binderPercent = ((bWt / tCWt) * 100).toFixed(2);
      } else {
        updatedItem.binderPercent = '';
      }

      if (cWt > 0 && tCWt > 0) {
        updatedItem.solidParticlePercent = ((tCWt / cWt) * 100).toFixed(2);
      } else {
        updatedItem.solidParticlePercent = '';
      }

      // Judgment Calculation
      const results = [
        checkPass(updatedItem.binderPercent, coatingTypeSpecs.binderSpec),
        checkPass(updatedItem.solidParticlePercent, coatingTypeSpecs.solidSpec),
        checkPass(updatedItem.grindometer, coatingTypeSpecs.grindoSpec),
        checkPass(updatedItem.viscosity, coatingTypeSpecs.viscoSpec)
      ];

      const evaluated = results.filter(r => r === 'PASS' || r === 'FAIL');

      if (results.includes('FAIL')) {
        updatedItem.judgment = 'FAIL';
      } else if (evaluated.length > 0 && results.every(r => r === 'PASS' || r === 'IGNORED')) {
        updatedItem.judgment = 'PASS';
      } else {
        updatedItem.judgment = 'PENDING';
      }

      return updatedItem;
    }));
  };

  const saveBatch = () => {
    const validItems = batchItems.filter(item => item.lotNumber.trim() !== '' && item.judgment !== 'PENDING');
    if (validItems.length === 0) {
      showNotification(isTh ? 'กรุณากรอกข้อมูลและ Cup No. อย่างน้อย 1 รายการ' : 'Please enter inspection data', 'error');
      return;
    }

    const now = new Date();
    const newRecords: MixingInspectionRecord[] = validItems.map(item => {
      const recId = `rec-mix-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      if (onLogNewActivity) {
        if (headerInfo.inspectorName) saveRecordedInspector(headerInfo.inspectorName);
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-06',
          moduleTitleTh: 'การตรวจวัดคุณภาพสารผสม (Mixing Inspection)',
          moduleTitleEn: 'Mixing Inspection System & Coating Spec Manager',
          inspector: headerInfo.inspectorName || 'Mixing Auditor',
          shift: headerInfo.shift || '',
          batchLot: `${headerInfo.coatingType} - ${headerInfo.mixingLot}`,
          result: item.judgment === 'PASS' ? 'PASS' : 'REJECT',
          defectCount: item.judgment === 'FAIL' ? 1 : 0,
          remarks: (() => {
            if (item.judgment !== 'FAIL') return `PASS (Cup ${item.lotNumber}: All specs passed)`;
            const failedSpecs: string[] = [];
            if (checkPass(item.binderPercent, coatingTypeSpecs.binderSpec) === 'FAIL') {
              failedSpecs.push(`Binder: ${item.binderPercent}% (Spec: ${coatingTypeSpecs.binderSpec})`);
            }
            if (checkPass(item.solidParticlePercent, coatingTypeSpecs.solidSpec) === 'FAIL') {
              failedSpecs.push(`Solid: ${item.solidParticlePercent}% (Spec: ${coatingTypeSpecs.solidSpec})`);
            }
            if (checkPass(item.grindometer, coatingTypeSpecs.grindoSpec) === 'FAIL') {
              failedSpecs.push(`Grindometer: ${item.grindometer} µm (Spec: ${coatingTypeSpecs.grindoSpec} µm)`);
            }
            if (checkPass(item.viscosity, coatingTypeSpecs.viscoSpec) === 'FAIL') {
              failedSpecs.push(`Viscosity: ${item.viscosity} s (Spec: ${coatingTypeSpecs.viscoSpec} s)`);
            }
            return failedSpecs.length > 0 ? failedSpecs.join(', ') : `Cup ${item.lotNumber}: Out of spec`;
          })(),
          inspectionResult: (() => {
            if (item.judgment !== 'FAIL') return `PASS (Cup ${item.lotNumber}: All specs passed)`;
            const failedSpecs: string[] = [];
            if (checkPass(item.binderPercent, coatingTypeSpecs.binderSpec) === 'FAIL') {
              failedSpecs.push(`Binder: ${item.binderPercent}% (Spec: ${coatingTypeSpecs.binderSpec})`);
            }
            if (checkPass(item.solidParticlePercent, coatingTypeSpecs.solidSpec) === 'FAIL') {
              failedSpecs.push(`Solid: ${item.solidParticlePercent}% (Spec: ${coatingTypeSpecs.solidSpec})`);
            }
            if (checkPass(item.grindometer, coatingTypeSpecs.grindoSpec) === 'FAIL') {
              failedSpecs.push(`Grindometer: ${item.grindometer} µm (Spec: ${coatingTypeSpecs.grindoSpec} µm)`);
            }
            if (checkPass(item.viscosity, coatingTypeSpecs.viscoSpec) === 'FAIL') {
              failedSpecs.push(`Viscosity: ${item.viscosity} s (Spec: ${coatingTypeSpecs.viscoSpec} s)`);
            }
            return failedSpecs.length > 0 ? failedSpecs.join(', ') : `Cup ${item.lotNumber}: Out of spec`;
          })()
        });
      }

      return {
        id: recId,
        inspectorName: headerInfo.inspectorName || 'Mixing Inspector',
        shift: headerInfo.shift || '',
        mixingLot: headerInfo.mixingLot,
        coatingType: headerInfo.coatingType,
        lotNumber: item.lotNumber,
        cupWeight: item.cupWeight,
        coatingWeight: item.coatingWeight,
        cupCoatingWeight: item.cupCoatingWeight,
        wtAfterDry105: item.wtAfterDry105,
        wtAfterDry430: item.wtAfterDry430,
        weightOfBinder: item.weightOfBinder,
        totalCoatingWeight: item.totalCoatingWeight,
        binderPercent: item.binderPercent,
        solidParticlePercent: item.solidParticlePercent,
        grindometer: item.grindometer,
        viscosity: item.viscosity,
        judgment: item.judgment,
        remarks: item.remarks,
        date: headerInfo.date,
        timestamp: now.toLocaleString('th-TH')
      };
    });

    setInspections(prev => [...newRecords, ...prev]);
    showNotification(isTh ? `บันทึกข้อมูล ${validItems.length} รายการเรียบร้อยแล้ว` : `Saved ${validItems.length} inspection items`);

    setBatchItems([
      {
        id: Date.now(),
        lotNumber: 'CUP-1',
        cupWeight: '',
        coatingWeight: '',
        cupCoatingWeight: '',
        wtAfterDry105: '',
        wtAfterDry430: '',
        weightOfBinder: '',
        totalCoatingWeight: '',
        binderPercent: '',
        solidParticlePercent: '',
        grindometer: '',
        viscosity: '',
        judgment: 'PENDING' as 'PASS' | 'FAIL' | 'PENDING',
        remarks: ''
      }
    ]);

    setActiveTab('history');
  };

  const exportToExcel = () => {
    if (inspections.length === 0) {
      showNotification(isTh ? 'ไม่มีข้อมูลสำหรับ Export' : 'No history to export', 'error');
      return;
    }

    const headers = [
      'Timestamp', 'Inspector', 'Shift', 'Mixing Lot', 'Coating Type', 'Cup No',
      'Cup Wt (g)', 'Coating Wt (g)', 'Cup+Coat Wt (g)', 'Dry 105 (g)', 'Dry 430 (g)',
      'Binder Wt (g)', 'Total Coat Wt (g)', 'Binder %', 'Solid %', 'Grindometer (µm)', 'Viscosity (s)', 'Judgment', 'Remarks'
    ];

    const csvRows = inspections.map(ins => [
      `"${ins.timestamp}"`,
      `"${ins.inspectorName}"`,
      `"${ins.shift || '-'}"`,
      `"${ins.mixingLot || '-'}"`,
      `"${ins.coatingType}"`,
      `"${ins.lotNumber}"`,
      ins.cupWeight || '-', ins.coatingWeight || '-', ins.cupCoatingWeight || '-',
      ins.wtAfterDry105 || '-', ins.wtAfterDry430 || '-', ins.weightOfBinder || '-',
      ins.totalCoatingWeight || '-', ins.binderPercent || '-', ins.solidParticlePercent || '-',
      ins.grindometer || '-', ins.viscosity || '-',
      `"${ins.judgment}"`,
      `"${ins.remarks || '-'}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mixing_Inspection_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(isTh ? 'ส่งออกไฟล์ CSV เรียบร้อยแล้ว' : 'Exported CSV successfully');
  };

  const availableProfiles = useMemo(() => {
    return ['All', ...Array.from(new Set(inspections.map(i => i.coatingType || 'Unknown')))];
  }, [inspections]);

  const availableMonths = useMemo(() => {
    const months = inspections.map(i => i.date ? i.date.substring(0, 7) : null).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(months))].sort((a, b) => b.localeCompare(a));
  }, [inspections]);

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    if (inspections.length === 0) return null;

    const total = inspections.length;
    const passCount = inspections.filter(i => i.judgment === 'PASS').length;
    const failCount = total - passCount;
    const passRatio = ((passCount / total) * 100).toFixed(1);

    const profileGroups: Record<string, { 
      name: string; total: number; pass: number; fail: number; 
      avgBinder: number; countBinder: number;
      avgSolid: number; countSolid: number;
      avgGrindo: number; countGrindo: number;
      avgVisco: number; countVisco: number;
    }> = {};

    inspections.forEach(item => {
      const pName = item.coatingType || 'Unknown';
      if (!profileGroups[pName]) {
        profileGroups[pName] = { 
          name: pName, total: 0, pass: 0, fail: 0, 
          avgBinder: 0, countBinder: 0,
          avgSolid: 0, countSolid: 0,
          avgGrindo: 0, countGrindo: 0,
          avgVisco: 0, countVisco: 0,
        };
      }
      profileGroups[pName].total++;
      if (item.judgment === 'PASS') profileGroups[pName].pass++;
      else profileGroups[pName].fail++;

      const b = parseFloat(item.binderPercent || '0');
      if (!isNaN(b) && b > 0) { profileGroups[pName].avgBinder += b; profileGroups[pName].countBinder++; }

      const s = parseFloat(item.solidParticlePercent || '0');
      if (!isNaN(s) && s > 0) { profileGroups[pName].avgSolid += s; profileGroups[pName].countSolid++; }

      const g = parseFloat(item.grindometer || '0');
      if (!isNaN(g) && g > 0) { profileGroups[pName].avgGrindo += g; profileGroups[pName].countGrindo++; }

      const v = parseFloat(item.viscosity || '0');
      if (!isNaN(v) && v > 0) { profileGroups[pName].avgVisco += v; profileGroups[pName].countVisco++; }
    });

    const profileSummaries = Object.values(profileGroups).map(g => {
      return {
        ...g,
        avgBinder: g.countBinder > 0 ? (g.avgBinder / g.countBinder).toFixed(2) : '-',
        avgSolid: g.countSolid > 0 ? (g.avgSolid / g.countSolid).toFixed(2) : '-',
        avgGrindo: g.countGrindo > 0 ? (g.avgGrindo / g.countGrindo).toFixed(1) : '-',
        avgVisco: g.countVisco > 0 ? (g.avgVisco / g.countVisco).toFixed(1) : '-',
        passRate: ((g.pass / g.total) * 100).toFixed(1),
      };
    });

    return { total, passCount, failCount, passRatio, profileSummaries };
  }, [inspections]);

  // Filtered Trend Data for Unified Overview & Query
  const filteredTrendData = useMemo<MixingTrendPointItem[]>(() => {
    if (inspections.length === 0) return [];

    let filtered = [...inspections];
    if (trendFilterProfile !== 'All') {
      filtered = filtered.filter(i => (i.coatingType || 'Unknown') === trendFilterProfile);
    }
    if (trendFilterMonth !== 'All') {
      filtered = filtered.filter(i => i.date && i.date.startsWith(trendFilterMonth));
    }

    // Sort chronologically (oldest to newest)
    const sorted = [...filtered].sort((a, b) => {
      const timeA = new Date(a.date ? `${a.date}T${a.timestamp || '00:00:00'}` : (a.timestamp || 0)).getTime();
      const timeB = new Date(b.date ? `${b.date}T${b.timestamp || '00:00:00'}` : (b.timestamp || 0)).getTime();
      return (timeA || 0) - (timeB || 0);
    });

    return sorted.map((item, idx) => {
      const b = parseFloat(item.binderPercent || '0');
      const s = parseFloat(item.solidParticlePercent || '0');
      const g = parseFloat(item.grindometer || '0');
      const v = parseFloat(item.viscosity || '0');

      return {
        index: idx + 1,
        id: item.id || `pt-${idx}`,
        date: item.date || item.timestamp?.split(' ')[0] || '',
        timestamp: item.timestamp || '',
        lotNumber: item.lotNumber || '-',
        mixingLot: item.mixingLot || '',
        coatingType: item.coatingType || 'Unknown',
        judgment: item.judgment || 'PASS',
        inspector: item.inspectorName || '-',
        binderPercent: !isNaN(b) && b > 0 ? parseFloat(b.toFixed(2)) : 0,
        solidParticlePercent: !isNaN(s) && s > 0 ? parseFloat(s.toFixed(2)) : 0,
        grindometer: !isNaN(g) && g > 0 ? parseFloat(g.toFixed(1)) : 0,
        viscosity: !isNaN(v) && v > 0 ? parseFloat(v.toFixed(1)) : 0,
      };
    });
  }, [inspections, trendFilterProfile, trendFilterMonth]);

  // Active Coating Type Spec for Spec Limit Lines in Trend Charts
  const activeTrendSpec = useMemo(() => {
    if (trendFilterProfile === 'All') return null;
    return savedCoatingTypes.find(p => p.name.toLowerCase() === trendFilterProfile.toLowerCase()) || null;
  }, [trendFilterProfile, savedCoatingTypes]);

  const filteredInspections = useMemo(() => {
    if (!historySearchTerm) return inspections;
    const term = historySearchTerm.toLowerCase();
    return inspections.filter(i => 
      i.lotNumber.toLowerCase().includes(term) ||
      i.coatingType.toLowerCase().includes(term) ||
      i.inspectorName.toLowerCase().includes(term) ||
      (i.mixingLot && i.mixingLot.toLowerCase().includes(term))
    );
  }, [inspections, historySearchTerm]);

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>

      {/* Admin Security Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Verification</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อตั้งค่า Coating Type Spec' : 'Enter admin password to manage coating specifications'}
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                {adminAuthError && (
                  <p className="text-rose-400 text-xs font-semibold text-center mt-2">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password. Please try again.'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-indigo-600/20"
                >
                  {isTh ? 'ยืนยันรหัสผ่าน' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-800 space-y-4">
             <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
             </div>
             <div className="text-center">
               <h3 className="text-lg font-bold text-white">{isTh ? 'ยืนยันการลบข้อมูล?' : 'Confirm Deletion'}</h3>
               <p className="text-xs text-slate-400 mt-1">{isTh ? 'คุณต้องการลบ' : 'Delete'} <b>{deleteConfirm.label}</b> {isTh ? 'ใช่หรือไม่?' : 'permanently?'}</p>
             </div>
             <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'profile') handleDeleteCoatingType(deleteConfirm.id);
                    if (deleteConfirm.type === 'history') handleDeleteHistoryItem(deleteConfirm.id);
                  }} 
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/20 transition"
                >
                  {isTh ? 'ยืนยันลบ' : 'Delete'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Return to QA Portal"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-400" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Beaker className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  IPQA-06
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'การตรวจวัดคุณภาพสารผสม (Mixing Inspection)' : 'Mixing Inspection System'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh 
                  ? 'บันทึกและคำนวณข้อมูลการผสมสารเคลือบ (Cup Wt, Coating Wt, Dry 105/430, Binder %, Solid %, Grindometer, Viscosity)' 
                  : 'Mixing inspection system for Cup weight, Coating weight, Dry 105/430, Binder %, Solid %, Grindometer & Viscosity'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isLight
                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Clean'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLight ? (isTh ? 'สว่าง' : 'Light') : (isTh ? 'มืด' : 'Dark')}</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Cloud Sync Active</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('new-batch')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'new-batch'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isTh ? '➕ บันทึกกลุ่มงาน' : 'Data Entry'}</span>
        </button>

        <button
          onClick={handleAdminAccess}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '⚙️ Coating Specs' : 'Coating Specs'}</span>
          {isAdminAuthenticated && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>{isTh ? '📊 Dashboard' : 'Dashboard'}</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isTh ? '📜 ประวัติ' : 'History'}</span>
          {inspections.length > 0 && (
            <span className="ml-1 bg-slate-950 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-mono border border-indigo-800">
              {inspections.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 shadow-lg border text-xs font-bold animate-in fade-in ${
          notification.type === 'error' ? 'bg-rose-950/80 border-rose-800 text-rose-300' : 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
        }`}>
          {notification.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TAB 1: NEW BATCH DATA ENTRY */}
      {activeTab === 'new-batch' && (
        <div className="space-y-6">
          {/* Header Metadata Form */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Beaker className="w-4 h-4 text-indigo-400" />
                {isTh ? '1. ข้อมูลการตรวจสอบหลัก (Mixing Header Metadata)' : '1. Header Metadata'}
              </h3>

              <div className="flex items-center gap-2">
                {profileStatus === 'found' ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SPEC LOADED: {headerInfo.coatingType}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTh ? 'ไม่พบ Spec ของประเภทสารนี้' : 'Coating Spec Not Found'}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Coating Type *
                </label>
                <select
                  value={headerInfo.coatingType}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      handleResetForm();
                      return;
                    }
                    const selected = savedCoatingTypes.find(p => p.name === val);
                    if (selected) selectCoatingType(selected);
                  }}
                  className="w-full bg-slate-950 border border-indigo-900/80 text-indigo-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-400"
                >
                  <option value="">-- {isTh ? 'เลือกประเภทสารเคลือบ' : 'Select Coating Type'} --</option>
                  {savedCoatingTypes.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Mixing Lot No.
                </label>
                <input
                  type="text"
                  name="mixingLot"
                  value={headerInfo.mixingLot}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น MIX-2026-A102' : 'Mixing Lot No.'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <ProcessSelector
                id="mixing-header-process"
                label="Process"
                value={headerInfo.process || 'MIX'}
                onChange={(proc) => setHeaderInfo(prev => ({ ...prev, process: proc }))}
              />

              <MachineSelector
                id="mixing-header-machine"
                label="Machine No."
                value={headerInfo.machine}
                onChange={(mac) => setHeaderInfo(prev => ({ ...prev, machine: mac }))}
              />

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Inspector Name
                </label>
                <input
                  type="text"
                  name="inspectorName"
                  list="qa-inspector-list"
                  value={headerInfo.inspectorName}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ' : 'Inspector Name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Shift (กะ)
                </label>
                <input
                  list="mixing-shift-options"
                  type="text"
                  name="shift"
                  value={headerInfo.shift}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Shift A, Shift B, Shift C..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <datalist id="mixing-shift-options">
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Inspection Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={headerInfo.date}
                  onChange={handleHeaderChange}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Loaded Target Limits Quick Bar */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
              <div><span className="text-slate-500">Binder % Spec:</span> <strong className="text-indigo-300">{coatingTypeSpecs.binderSpec || '-'}</strong></div>
              <div><span className="text-slate-500">Solid % Spec:</span> <strong className="text-indigo-300">{coatingTypeSpecs.solidSpec || '-'}</strong></div>
              <div><span className="text-slate-500">Grindometer Spec:</span> <strong className="text-amber-300">{coatingTypeSpecs.grindoSpec ? `${coatingTypeSpecs.grindoSpec} µm` : '-'}</strong></div>
              <div><span className="text-slate-500">Viscosity Spec:</span> <strong className="text-amber-300">{coatingTypeSpecs.viscoSpec ? `${coatingTypeSpecs.viscoSpec} sec` : '-'}</strong></div>
            </div>
          </div>

          {/* Mixing Measurement Entry Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md overflow-hidden" ref={tableRef}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                {isTh ? '2. ตารางบันทึกค่าและคำนวณการผสมสาร (Mixing Measurement Entry Table)' : '2. Mixing Measurement Table'}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  title={isTh ? 'ล้างฟอร์มทั้งหมด' : 'Reset Form'}
                  className={`font-semibold text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 transition ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTh ? 'ล้างฟอร์ม' : 'Reset'}</span>
                </button>

                {/* +1 Cup button */}
                <button
                  type="button"
                  onClick={() => addCups(1)}
                  className={`font-bold text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 transition active:scale-95 ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title={isTh ? 'เพิ่มถ้วยทดสอบทีละ 1 ถ้วย' : 'Add 1 cup'}
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>{isTh ? '+ เพิ่มถ้วย (Cup)' : 'Add Cup'}</span>
                </button>

                {/* +6 Cups bulk button */}
                <button
                  type="button"
                  onClick={() => addCups(6)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-indigo-500/40 flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/30 active:scale-95"
                  title={isTh ? 'เพิ่มถ้วยทดสอบ 6 ถ้วยพร้อมกันในครั้งเดียว (CUP ต่อเนื่อง)' : 'Add 6 cups batch at once'}
                >
                  <Layers className="w-4 h-4 text-indigo-200" />
                  <span className="font-extrabold">{isTh ? '+ เพิ่ม 6 ถ้วย (+6 Cups)' : '+ 6 Cups'}</span>
                </button>

                <button
                  type="button"
                  onClick={saveBatch}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? '💾 บันทึกทั้งหมด' : 'Save Batch'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <form onKeyDown={handleKeyDown}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px] uppercase">
                      <th className="p-2.5 w-10 text-center">#</th>
                      <th className="p-2.5 min-w-[120px]">{isTh ? 'Cup No.' : 'Cup No.'}</th>
                      <th className="p-2.5 min-w-[100px] text-center">{isTh ? 'Cup Wt (g)' : 'Cup Wt'}</th>
                      <th className="p-2.5 min-w-[100px] text-center">{isTh ? 'Coating Wt (g)' : 'Coat Wt'}</th>
                      <th className="p-2.5 min-w-[100px] text-center">{isTh ? 'Cup+Coat (g)' : 'Cup+Coat'}</th>
                      <th className="p-2.5 min-w-[100px] text-center">{isTh ? 'Dry 105 (g)' : 'Dry 105'}</th>
                      <th className="p-2.5 min-w-[100px] text-center">{isTh ? 'Dry 430 (g)' : 'Dry 430'}</th>
                      <th className="p-2.5 min-w-[100px] text-center">{isTh ? 'Binder Wt (g)' : 'Binder Wt'}</th>
                      <th className="p-2.5 min-w-[100px] text-center">{isTh ? 'Total Coat Wt (g)' : 'Total Coat'}</th>
                      <th className="p-2.5 min-w-[90px] text-center">{isTh ? 'Binder %' : 'Binder %'}</th>
                      <th className="p-2.5 min-w-[90px] text-center">{isTh ? 'Solid %' : 'Solid %'}</th>
                      <th className="p-2.5 min-w-[90px] text-center">{isTh ? 'Grindometer (µm)' : 'Grindometer'}</th>
                      <th className="p-2.5 min-w-[90px] text-center">{isTh ? 'Viscosity (s)' : 'Viscosity'}</th>
                      <th className="p-2.5 w-24 text-center">{isTh ? 'ผลการตรวจ' : 'Judgment'}</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {batchItems.map((item, idx) => {
                      const bindPass = checkPass(item.binderPercent, coatingTypeSpecs.binderSpec);
                      const solidPass = checkPass(item.solidParticlePercent, coatingTypeSpecs.solidSpec);
                      const grindoPass = checkPass(item.grindometer, coatingTypeSpecs.grindoSpec);
                      const viscoPass = checkPass(item.viscosity, coatingTypeSpecs.viscoSpec);

                      return (
                        <tr key={item.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="p-2.5 text-center font-mono text-slate-500 font-bold">{idx + 1}</td>
                          
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.lotNumber}
                              onChange={(e) => handleItemChange(item.id, 'lotNumber', e.target.value)}
                              placeholder={`CUP-${idx + 1}`}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-indigo-500 uppercase"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={item.cupWeight}
                              onChange={(e) => handleItemChange(item.id, 'cupWeight', e.target.value)}
                              placeholder="0.0000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={item.coatingWeight}
                              onChange={(e) => handleItemChange(item.id, 'coatingWeight', e.target.value)}
                              placeholder="0.0000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              readOnly
                              value={item.cupCoatingWeight}
                              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-400 font-bold cursor-not-allowed"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={item.wtAfterDry105}
                              onChange={(e) => handleItemChange(item.id, 'wtAfterDry105', e.target.value)}
                              placeholder="0.0000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="number"
                              step="0.0001"
                              value={item.wtAfterDry430}
                              onChange={(e) => handleItemChange(item.id, 'wtAfterDry430', e.target.value)}
                              placeholder="0.0000"
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              readOnly
                              value={item.weightOfBinder}
                              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-400 font-bold cursor-not-allowed"
                            />
                          </td>

                          <td className="p-2">
                            <input
                              type="text"
                              readOnly
                              value={item.totalCoatingWeight}
                              className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg px-2 py-1.5 text-xs text-center font-mono text-slate-400 font-bold cursor-not-allowed"
                            />
                          </td>

                          <td className="p-2">
                            <div className={`flex items-center justify-between border rounded-lg px-2 py-1.5 ${
                              bindPass === 'FAIL' ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-slate-950 border-slate-800 text-indigo-300'
                            }`}>
                              <span className="font-mono font-bold text-xs">{item.binderPercent || '-'}</span>
                              <div className={`w-2 h-2 rounded-full ${bindPass === 'PASS' ? 'bg-emerald-400' : bindPass === 'FAIL' ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
                            </div>
                          </td>

                          <td className="p-2">
                            <div className={`flex items-center justify-between border rounded-lg px-2 py-1.5 ${
                              solidPass === 'FAIL' ? 'bg-rose-950/40 border-rose-800 text-rose-300' : 'bg-slate-950 border-slate-800 text-indigo-300'
                            }`}>
                              <span className="font-mono font-bold text-xs">{item.solidParticlePercent || '-'}</span>
                              <div className={`w-2 h-2 rounded-full ${solidPass === 'PASS' ? 'bg-emerald-400' : solidPass === 'FAIL' ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
                            </div>
                          </td>

                          <td className="p-2">
                            <div className={`flex items-center gap-1 border rounded-lg px-1.5 py-1 ${
                              grindoPass === 'FAIL' ? 'bg-rose-950/40 border-rose-800' : 'bg-slate-950 border-slate-800'
                            }`}>
                              <input
                                type="number"
                                step="1"
                                value={item.grindometer}
                                onChange={(e) => handleItemChange(item.id, 'grindometer', e.target.value)}
                                placeholder="µm"
                                className="w-full bg-transparent text-xs text-center font-mono text-slate-200 focus:outline-none"
                              />
                              <div className={`w-2 h-2 rounded-full shrink-0 ${grindoPass === 'PASS' ? 'bg-emerald-400' : grindoPass === 'FAIL' ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
                            </div>
                          </td>

                          <td className="p-2">
                            <div className={`flex items-center gap-1 border rounded-lg px-1.5 py-1 ${
                              viscoPass === 'FAIL' ? 'bg-rose-950/40 border-rose-800' : 'bg-slate-950 border-slate-800'
                            }`}>
                              <input
                                type="number"
                                step="1"
                                value={item.viscosity}
                                onChange={(e) => handleItemChange(item.id, 'viscosity', e.target.value)}
                                placeholder="sec"
                                className="w-full bg-transparent text-xs text-center font-mono text-slate-200 focus:outline-none"
                              />
                              <div className={`w-2 h-2 rounded-full shrink-0 ${viscoPass === 'PASS' ? 'bg-emerald-400' : viscoPass === 'FAIL' ? 'bg-rose-500 animate-pulse' : 'bg-slate-700'}`} />
                            </div>
                          </td>

                          <td className="p-2 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase inline-block ${
                              item.judgment === 'PASS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              item.judgment === 'FAIL' ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-sm' :
                              'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}>
                              {item.judgment}
                            </span>
                          </td>

                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                              title="Delete Row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {batchItems.length === 0 && (
                      <tr>
                        <td colSpan={15} className="p-8 text-center">
                          <p className={`text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isTh ? 'ยังไม่มีรายการถ้วยทดสอบในตาราง กรุณากดเพิ่มถ้วย' : 'No cup measurement entries. Click below to add.'}
                          </p>
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => addCups(1)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${
                                isLight
                                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5 inline mr-1 text-indigo-400" />
                              {isTh ? '+ เพิ่ม 1 ถ้วย' : '+ 1 Cup'}
                            </button>
                            <button
                              type="button"
                              onClick={() => addCups(6)}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
                            >
                              <Layers className="w-3.5 h-3.5 inline mr-1 text-indigo-200" />
                              {isTh ? '+ เพิ่ม 6 ถ้วย (+6 Cups)' : '+ 6 Cups'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </form>
            </div>

            {/* Quick Actions Footer below Table */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t text-xs ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {isTh ? 'รวมจำนวนถ้วยทดสอบ:' : 'Total Cups:'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {batchItems.length} {isTh ? 'ถ้วย' : 'cups'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addCups(1)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1 transition ${
                    isLight 
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                  title={isTh ? 'เพิ่มถ้วย 1 ถ้วย' : 'Add 1 cup'}
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isTh ? '+ 1 ถ้วย' : '+ 1 Cup'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => addCups(6)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-1.5 rounded-lg border border-indigo-500/40 font-bold flex items-center gap-1 transition shadow-xs active:scale-95"
                  title={isTh ? 'เพิ่มถ้วย 6 ถ้วยพร้อมกัน' : 'Add 6 cups batch at once'}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-200" />
                  <span>{isTh ? '+ 6 ถ้วย (+6 Cups)' : '+ 6 Cups'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COATING SPECS MANAGER (ADMIN) */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Coating Type Specification Manager (Admin Mode)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isTh ? 'ตั้งค่าประเภทสารเคลือบและกำหนดเกณฑ์ Binder%, Solid%, Grindometer, Viscosity' : 'Manage coating types and benchmark specifications'}
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveCoatingType}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isTh ? 'บันทึก Specification' : 'Save Specification'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* List of Coating Types */}
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Coating Types List</span>
                <span className="text-indigo-400 font-mono">{savedCoatingTypes.length} Saved</span>
              </h4>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {savedCoatingTypes.map((profile) => (
                  <div
                    key={profile.name}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      headerInfo.coatingType === profile.name
                        ? 'bg-indigo-950/80 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                    }`}
                    onClick={() => selectCoatingType(profile)}
                  >
                    <div>
                      <div className="font-bold text-xs">{profile.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Bind: {profile.binderSpec || '-'} | Solid: {profile.solidSpec || '-'}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'profile', id: profile.name, label: profile.name });
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Spec Edit Form */}
            <div className="md:col-span-2 bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-3">
                Coating Specification Parameters
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Coating Type Name *
                  </label>
                  <input
                    type="text"
                    name="coatingType"
                    value={headerInfo.coatingType}
                    onChange={handleHeaderChange}
                    placeholder="Standard Coating A (Type-100)"
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Binder % Spec Range
                    </label>
                    <input
                      type="text"
                      name="binderSpec"
                      value={coatingTypeSpecs.binderSpec}
                      onChange={handleSpecChange}
                      placeholder="15.0 - 17.5"
                      className="w-full bg-slate-950 border border-slate-800 text-indigo-300 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Ex: 15.0 - 17.5</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Solid Particle % Spec Range
                    </label>
                    <input
                      type="text"
                      name="solidSpec"
                      value={coatingTypeSpecs.solidSpec}
                      onChange={handleSpecChange}
                      placeholder="40.0 ± 2.0"
                      className="w-full bg-slate-950 border border-slate-800 text-indigo-300 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Ex: 40.0 ± 2.0 or 38 - 42</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Grindometer Max Limit (µm)
                    </label>
                    <input
                      type="text"
                      name="grindoSpec"
                      value={coatingTypeSpecs.grindoSpec}
                      onChange={handleSpecChange}
                      placeholder="< 25"
                      className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Ex: &lt; 25</span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Viscosity Spec Range (sec)
                    </label>
                    <input
                      type="text"
                      name="viscoSpec"
                      value={coatingTypeSpecs.viscoSpec}
                      onChange={handleSpecChange}
                      placeholder="18 - 22"
                      className="w-full bg-slate-950 border border-slate-800 text-amber-300 font-mono rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Ex: 18 - 22</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DASHBOARD & TRENDS */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashboardStats ? (
            <>
              {/* Top High-level KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border transition-all ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                } space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isTh ? 'จำนวนตัวอย่างทั้งหมด' : 'Total Mixing Samples'}
                    </span>
                    <Beaker className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className={`text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {dashboardStats.total} <span className="text-xs font-normal text-slate-400">{isTh ? 'ถ้วย (Cups)' : 'Cups'}</span>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                } space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      {isTh ? 'ผ่านเกณฑ์ (PASS)' : 'Passed Samples'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {dashboardStats.passCount} <span className="text-xs font-normal text-slate-400">{isTh ? 'ถ้วย' : 'Cups'}</span>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                } space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                      {isTh ? 'ไม่ผ่านเกณฑ์ (REJECT)' : 'Rejected Samples'}
                    </span>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {dashboardStats.failCount} <span className="text-xs font-normal text-slate-400">{isTh ? 'ถ้วย' : 'Cups'}</span>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border transition-all ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                } space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                      {isTh ? 'อัตราผ่านเกณฑ์' : 'Pass Rate'}
                    </span>
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-purple-400">
                    {dashboardStats.passRatio}%
                  </div>
                </div>
              </div>

              {/* Summary Breakdown by Coating Type */}
              {dashboardStats.profileSummaries && dashboardStats.profileSummaries.length > 0 && (
                <div className={`rounded-2xl border overflow-hidden ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-400" />
                      <div>
                        <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {isTh ? 'สรุปผลการตรวจสอบแยกตามชนิดสารเคลือบ (Coating Type Breakdown)' : 'Summary by Coating Type'}
                        </h4>
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {isTh ? 'คลิกที่แถวหรือปุ่มเพื่อกรองดูกราฟแนวโน้มเฉพาะชนิดสารเคลือบนั้น' : 'Click row or button to query graphs for that coating type'}
                        </p>
                      </div>
                    </div>

                    {trendFilterProfile !== 'All' && (
                      <button
                        onClick={() => setTrendFilterProfile('All')}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                          isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>{isTh ? 'ดูภาพรวมทั้งหมด (Reset)' : 'View All'}</span>
                      </button>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                          isLight ? 'bg-slate-100/70 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                        }`}>
                          <th className="p-3">{isTh ? 'ชนิดสารเคลือบ (Coating Type)' : 'Coating Type'}</th>
                          <th className="p-3 text-center">{isTh ? 'จำนวนตัวอย่าง' : 'Samples'}</th>
                          <th className="p-3 text-center">{isTh ? 'อัตราผ่าน' : 'Pass Rate'}</th>
                          <th className="p-3 text-center text-indigo-400">{isTh ? 'เฉลี่ย Binder %' : 'Avg Binder %'}</th>
                          <th className="p-3 text-center text-emerald-400">{isTh ? 'เฉลี่ย Solid %' : 'Avg Solid %'}</th>
                          <th className="p-3 text-center text-amber-400">{isTh ? 'เฉลี่ย Grindometer (µm)' : 'Avg Grindo (µm)'}</th>
                          <th className="p-3 text-center text-purple-400">{isTh ? 'เฉลี่ย Viscosity (s)' : 'Avg Visco (s)'}</th>
                          <th className="p-3 text-right">{isTh ? 'การดำเนินการ' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                        {dashboardStats.profileSummaries.map((summary) => {
                          const isSelected = trendFilterProfile === summary.name;
                          return (
                            <tr
                              key={summary.name}
                              onClick={() => setTrendFilterProfile(isSelected ? 'All' : summary.name)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? isLight
                                    ? 'bg-indigo-50/80 font-semibold'
                                    : 'bg-indigo-950/40 font-semibold'
                                  : isLight
                                    ? 'hover:bg-slate-50'
                                    : 'hover:bg-slate-800/40'
                              }`}
                            >
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-indigo-500 ring-2 ring-indigo-400/30' : 'bg-slate-400'}`} />
                                  <span className={isLight ? 'text-slate-800 font-bold' : 'text-slate-200 font-bold'}>{summary.name}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono">
                                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{summary.total}</span>
                                <span className="text-[10px] text-slate-500 ml-1">({summary.pass} P / {summary.fail} R)</span>
                              </td>
                              <td className="p-3 text-center font-mono">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  parseFloat(summary.passRate) >= 95
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : parseFloat(summary.passRate) >= 80
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}>
                                  {summary.passRate}%
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono text-indigo-400 font-bold">{summary.avgBinder} %</td>
                              <td className="p-3 text-center font-mono text-emerald-400 font-bold">{summary.avgSolid} %</td>
                              <td className="p-3 text-center font-mono text-amber-400 font-bold">{summary.avgGrindo} µm</td>
                              <td className="p-3 text-center font-mono text-purple-400 font-bold">{summary.avgVisco} s</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTrendFilterProfile(isSelected ? 'All' : summary.name);
                                  }}
                                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {isSelected ? (isTh ? 'เลือกอยู่ ✓' : 'Selected ✓') : (isTh ? 'ดูกราฟ' : 'Filter')}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Main Query & Filter Toolbar */}
              <div className={`p-5 rounded-2xl border transition-all ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              } space-y-4`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {isTh ? 'ภาพรวมแนวโน้มและค้นหาตามชนิดสารเคลือบ / เดือน' : 'Trend Overview & Query by Coating Type / Month'}
                      </h4>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isTh
                        ? 'แสดงผลภาพรวมทุก Coating Type และทุกเดือนเป็นค่าเริ่มต้น หรือระบุเงื่อนไขที่ต้องการวิเคราะห์ โดยแยกกราฟ Binder%, Solid%, Grindometer และ Viscosity เป็นคนละแถวอย่างชัดเจน'
                        : 'Default shows integrated overview across all coating types & months. Query specific coating type and month with dedicated full-width rows.'}
                    </p>
                  </div>

                  {/* Filter Selectors & Reset */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isTh ? 'ชนิดสารเคลือบ:' : 'Coating:'}
                      </label>
                      <select
                        value={trendFilterProfile}
                        onChange={(e) => setTrendFilterProfile(e.target.value)}
                        className={`text-xs rounded-xl px-3 py-1.5 font-medium border focus:outline-none focus:border-indigo-500 ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        {availableProfiles.map(p => (
                          <option key={p} value={p}>
                            {p === 'All' ? (isTh ? 'ทุก Coating Type (ภาพรวม)' : 'All Coating Types (Overview)') : p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isTh ? 'เดือน:' : 'Month:'}
                      </label>
                      <select
                        value={trendFilterMonth}
                        onChange={(e) => setTrendFilterMonth(e.target.value)}
                        className={`text-xs rounded-xl px-3 py-1.5 font-medium border focus:outline-none focus:border-indigo-500 ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        {availableMonths.map(m => (
                          <option key={m} value={m}>
                            {m === 'All' ? (isTh ? 'ทุกเดือน (ทั้งหมด)' : 'All Months (All)') : m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(trendFilterProfile !== 'All' || trendFilterMonth !== 'All') && (
                      <button
                        onClick={() => {
                          setTrendFilterProfile('All');
                          setTrendFilterMonth('All');
                        }}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isTh ? 'รีเซ็ต' : 'Reset'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Selection Pills */}
                <div className={`pt-3 border-t flex flex-wrap items-center gap-1.5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {isTh ? 'ทางลัดชนิดสารเคลือบ:' : 'Quick Select:'}
                  </span>
                  {availableProfiles.map(p => {
                    const isSelected = trendFilterProfile === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setTrendFilterProfile(p)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {p === 'All' ? (isTh ? 'ภาพรวมทุกชนิด' : 'All Types') : p}
                      </button>
                    );
                  })}
                </div>

                {/* Active Spec Info Banner when filtering by specific coating type */}
                {trendFilterProfile !== 'All' && activeTrendSpec && (
                  <div className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                    isLight
                      ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                      : 'bg-indigo-950/20 border-indigo-800/40 text-indigo-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-xs font-bold">
                          {isTh ? 'เกณฑ์มาตรฐาน (Spec Limits) สำหรับ ' : 'Specification Limits for '}
                          <span className="underline font-extrabold">{trendFilterProfile}</span>
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {isTh ? 'เส้นประแนวนอนบนกราฟจะอ้างอิงตามค่าสเปกนี้' : 'Dashed reference lines on charts indicate these thresholds'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-indigo-400 block font-sans font-bold">Binder %</span>
                        <span className="font-bold">{activeTrendSpec.binderSpec || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-emerald-400 block font-sans font-bold">Solid %</span>
                        <span className="font-bold">{activeTrendSpec.solidSpec || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-amber-400 block font-sans font-bold">Grindometer</span>
                        <span className="font-bold">{activeTrendSpec.grindoSpec || 'N/A'} µm</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-purple-400 block font-sans font-bold">Viscosity</span>
                        <span className="font-bold">{activeTrendSpec.viscoSpec || 'N/A'} s</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4 DEDICATED FULL-WIDTH PARAMETER ROWS */}
              {filteredTrendData.length > 0 ? (
                <div className="space-y-6">
                  {/* ROW 1: Binder % Trend */}
                  <MixingParameterRowCard
                    paramKey="binderPercent"
                    title="Binder %"
                    thaiTitle="เปอร์เซ็นต์สารยึดเกาะ (Binder %)"
                    descriptionTh="สัดส่วนเปอร์เซ็นต์สารยึดเกาะต่อน้ำหนักการผสมทั้งหมด (Binder Content)"
                    descriptionEn="Binder percentage in coating mixture"
                    color="#818cf8"
                    data={filteredTrendData}
                    unit="%"
                    specString={activeTrendSpec?.binderSpec || ''}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* ROW 2: Solid % Trend */}
                  <MixingParameterRowCard
                    paramKey="solidParticlePercent"
                    title="Solid Particle %"
                    thaiTitle="เปอร์เซ็นต์อนุภาคของแข็ง (Solid Particle %)"
                    descriptionTh="สัดส่วนของแข็งหลังผ่านการอบแห้งในเตาอบ (Solid Content %)"
                    descriptionEn="Solid particle percentage after oven drying"
                    color="#34d399"
                    data={filteredTrendData}
                    unit="%"
                    specString={activeTrendSpec?.solidSpec || ''}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* ROW 3: Grindometer Trend */}
                  <MixingParameterRowCard
                    paramKey="grindometer"
                    title="Grindometer Fineness"
                    thaiTitle="ความละเอียดการกระจายตัว (Grindometer Fineness)"
                    descriptionTh="ขนาดอนุภาคสูงสุดจากการปาดวัดด้วยเครื่อง Grindometer (Fineness of Grind)"
                    descriptionEn="Maximum particle fineness measured by grindometer"
                    color="#fbbf24"
                    data={filteredTrendData}
                    unit="µm"
                    specString={activeTrendSpec?.grindoSpec || ''}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* ROW 4: Viscosity Trend */}
                  <MixingParameterRowCard
                    paramKey="viscosity"
                    title="Viscosity Flow Time"
                    thaiTitle="ความหนืดของสารผสม (Viscosity / Flow Time)"
                    descriptionTh="เวลาการไหลของสารผสมผ่านถ้วยวัดความหนืด (Viscosity Cup Flow Time)"
                    descriptionEn="Viscosity flow time in seconds (cup method)"
                    color="#c084fc"
                    data={filteredTrendData}
                    unit="s"
                    specString={activeTrendSpec?.viscoSpec || ''}
                    isLight={isLight}
                    isTh={isTh}
                  />
                </div>
              ) : (
                <div className={`text-center py-12 rounded-2xl border ${
                  isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-500'
                } text-xs space-y-2`}>
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="font-bold">{isTh ? 'ไม่พบข้อมูลแนวโน้มที่ตรงกับเงื่อนไขการค้นหา' : 'No trend data matching filter'}</p>
                  <button
                    onClick={() => {
                      setTrendFilterProfile('All');
                      setTrendFilterMonth('All');
                    }}
                    className="text-indigo-400 hover:underline text-[11px]"
                  >
                    {isTh ? 'คลิกที่นี่เพื่อรีเซ็ตตัวกรองเป็นภาพรวมทั้งหมด' : 'Click here to reset filter'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className={`text-center py-12 rounded-2xl border ${
              isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-500'
            } text-xs`}>
              {isTh ? 'ไม่มีข้อมูลการตรวจสอบสำหรับแสดงผลแดชบอร์ด' : 'No inspection records available for dashboard analysis'}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INSPECTION HISTORY & EXPORT */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearchTerm}
                onChange={(e) => setHistorySearchTerm(e.target.value)}
                placeholder={isTh ? 'ค้นหาตาม Cup No, Mixing Lot, Inspector...' : 'Search records...'}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={exportToExcel}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              <span>{isTh ? 'ส่งออก CSV/Excel' : 'Export CSV'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 text-[11px] uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">{isTh ? 'Cup No.' : 'Cup No.'}</th>
                  <th className="p-3">{isTh ? 'Mixing Lot' : 'Mixing Lot'}</th>
                  <th className="p-3">{isTh ? 'Coating Type' : 'Coating Type'}</th>
                  <th className="p-3 text-center">Binder %</th>
                  <th className="p-3 text-center">Solid %</th>
                  <th className="p-3 text-center">Grindometer</th>
                  <th className="p-3 text-center">Viscosity</th>
                  <th className="p-3 text-center">{isTh ? 'ผลการตรวจ' : 'Judgment'}</th>
                  <th className="p-3 text-center">Inspector</th>
                  <th className="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="p-3 font-mono text-slate-400 text-[11px]">{ins.timestamp}</td>
                    <td className="p-3 font-bold text-slate-200">{ins.lotNumber}</td>
                    <td className="p-3 font-mono text-indigo-300">{ins.mixingLot || '-'}</td>
                    <td className="p-3 text-slate-300">{ins.coatingType}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-200">{ins.binderPercent || '-'}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-200">{ins.solidParticlePercent || '-'}</td>
                    <td className="p-3 text-center font-mono text-slate-300">{ins.grindometer ? `${ins.grindometer} µm` : '-'}</td>
                    <td className="p-3 text-center font-mono text-slate-300">{ins.viscosity ? `${ins.viscosity} s` : '-'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase inline-block ${
                        ins.judgment === 'PASS' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}>
                        {ins.judgment}
                      </span>
                    </td>
                    <td className="p-3 text-center text-slate-400">
                      <div>{ins.inspectorName}</div>
                      {ins.shift && <div className="text-[10px] text-cyan-400 font-mono">Shift: {ins.shift}</div>}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleRequestEditHistory(ins)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition border border-amber-500/30 flex items-center gap-1 text-[11px] font-bold"
                          title={isTh ? "แก้ไขข้อมูล (ต้องใส่ Password)" : "Edit Record (Password required)"}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{isTh ? 'แก้ไข' : 'Edit'}</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'history', id: ins.id!, label: ins.lotNumber })}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT HISTORY AUTHENTICATION MODAL */}
      {isHistoryAuthOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setIsHistoryAuthOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {isTh ? 'ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล' : 'Password Verification Required'}
              </h3>
              <p className="text-xs text-slate-400">
                {isTh 
                  ? 'กรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไขรายการตรวจวัด IPQA-06' 
                  : 'Enter admin password to edit IPQA-06 record'}
              </p>
            </div>

            <form onSubmit={handleVerifyHistoryPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={historyAuthPassword}
                  onChange={(e) => setHistoryAuthPassword(e.target.value)}
                  placeholder={isTh ? "รหัสผ่านผู้ดูแลระบบ" : "Admin Password"}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {historyAuthError && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{isTh ? 'รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง' : 'Incorrect password! Please try again'}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsHistoryAuthOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isTh ? 'ปลดล็อกเพื่อแก้ไข' : 'Unlock & Edit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT HISTORY RECORD MODAL */}
      {editingHistoryItem && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 space-y-5 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'แก้ไขข้อมูลผสมและตรวจวัดสารเคลือบ (IPQA-06)' : 'Edit Mixing & Coating Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Cup: {editingHistoryItem.lotNumber} | ID: {editingHistoryItem.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingHistoryItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Cup Number / Lot</label>
                  <input
                    type="text"
                    value={editingHistoryItem.lotNumber || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, lotNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mixing Lot</label>
                  <input
                    type="text"
                    value={editingHistoryItem.mixingLot || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, mixingLot: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-indigo-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coating Type</label>
                  <input
                    type="text"
                    value={editingHistoryItem.coatingType || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, coatingType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <ProcessSelector
                  id="edit-mixing-process"
                  label="Process"
                  value={editingHistoryItem.process || 'MIX'}
                  onChange={(proc) => setEditingHistoryItem({ ...editingHistoryItem, process: proc })}
                />

                <MachineSelector
                  id="edit-mixing-machine"
                  label="Machine No."
                  value={editingHistoryItem.machine || ''}
                  onChange={(mac) => setEditingHistoryItem({ ...editingHistoryItem, machine: mac })}
                />

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspector Name</label>
                  <input
                    type="text"
                    list="qa-inspector-list"
                    value={editingHistoryItem.inspectorName || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, inspectorName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shift (กะ)</label>
                  <input
                    list="edit-mixing-shift-options"
                    type="text"
                    placeholder="e.g. Shift A, Shift B, Shift C..."
                    value={editingHistoryItem.shift || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, shift: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="edit-mixing-shift-options">
                    <option value="Shift A" />
                    <option value="Shift B" />
                    <option value="Shift C" />
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Judgment</label>
                  <select
                    value={editingHistoryItem.judgment}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, judgment: e.target.value as 'PASS' | 'FAIL' | 'PENDING' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Mixing & Lab Test Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Binder %</label>
                    <input
                      type="text"
                      value={editingHistoryItem.binderPercent || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, binderPercent: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Solid Particle %</label>
                    <input
                      type="text"
                      value={editingHistoryItem.solidParticlePercent || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, solidParticlePercent: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Grindometer (µm)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.grindometer || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, grindometer: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Viscosity (s)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.viscosity || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, viscosity: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-purple-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Weight of Binder (g)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.weightOfBinder || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, weightOfBinder: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Total Coating Wt (g)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.totalCoatingWeight || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, totalCoatingWeight: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingHistoryItem(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
              >
                {isTh ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleSaveEditedHistory}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>{isTh ? 'บันทึกการแก้ไข' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MixingInspectionApp;
