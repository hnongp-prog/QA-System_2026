import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardCheck, 
  History, 
  PlusCircle, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  X, 
  Save, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Target, 
  Filter, 
  Settings, 
  Cpu, 
  Lock, 
  ChevronRight, 
  ArrowLeft, 
  Download, 
  Plus, 
  Minus, 
  Layers, 
  Search, 
  Sliders, 
  FileSpreadsheet, 
  Edit3, 
  RotateCcw, 
  Sun, 
  Moon, 
  Factory, 
  Copy 
} from 'lucide-react';

import { 
  XRayProfileSpec, 
  XRayInspectionRecord, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { useCloudState } from '../services/firestoreSync';
import { InspectorDatalist, saveRecordedInspector } from '../utils/inspectorStorage';
import { ProcessSelector, MachineSelector } from './common/ProcessMachineSelector';
import { STANDARD_PROCESS_OPTIONS, STANDARD_MACHINE_OPTIONS } from '../constants/processOptions';

// Helper to normalize string or string[] into string[]
const toArray = (val: string | string[] | undefined | null): string[] => {
  if (val === undefined || val === null) return [''];
  if (Array.isArray(val)) return val.length > 0 ? val : [''];
  return [String(val)];
};

// Helper for empty point array
const createEmptyPointArray = (count: number) => Array(Math.max(1, count)).fill('');

// Helper to calculate average of point values
const calcAvg = (points: string | string[] | undefined, decimals = 2): string => {
  const arr = toArray(points);
  const nums = arr
    .map(p => String(p || '').trim())
    .filter(p => p !== '' && p !== '-' && p !== 'N/A')
    .map(p => parseFloat(p))
    .filter(n => !isNaN(n) && n > 0);
  if (nums.length === 0) return '-';
  return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(decimals);
};

// Aliases for Zn compatibility
const calcZnAvg = (points: string | string[] | undefined): string => calcAvg(points, 2);

// Helper to format multiple points for display
const formatPointsDisplay = (val: string | string[] | undefined): string => {
  const arr = toArray(val).filter(v => v.trim() !== '');
  if (arr.length === 0) return '-';
  return arr.join(', ');
};

const formatZnDisplay = (val: string | string[] | undefined): string => formatPointsDisplay(val);

// Helper to calculate overall average (combining Up and Lo)
const getOverallAvg = (up: string | string[] | undefined, lo: string | string[] | undefined, decimals = 2): string => {
  const upNums = toArray(up)
    .map(v => String(v || '').trim())
    .filter(v => v !== '' && v !== '-' && v !== 'N/A')
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v) && v > 0);
  const loNums = toArray(lo)
    .map(v => String(v || '').trim())
    .filter(v => v !== '' && v !== '-' && v !== 'N/A')
    .map(v => parseFloat(v))
    .filter(v => !isNaN(v) && v > 0);
  const all = [...upNums, ...loNums];
  if (all.length === 0) return '-';
  return (all.reduce((a, b) => a + b, 0) / all.length).toFixed(decimals);
};

const getZnOverallAvg = (raUp: string | string[] | undefined, raLo: string | string[] | undefined): string => getOverallAvg(raUp, raLo, 2);

interface XRayMeasurementAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

// Trend Data Point interface for X-Ray
export interface XRayTrendPointItem {
  index: number;
  id: string;
  date: string;
  timestamp?: string;
  lotNumber: string;
  profileName: string;
  stage?: string;
  process?: string;
  status: string;
  inspector?: string;
  zn: number;
  flux: number;
  coverage: number;
}

// Full-width parameter row chart component (Zn Weight, Flux Weight, Coverage %)
interface XRayParameterRowCardProps {
  paramKey: 'zn' | 'flux' | 'coverage';
  title: string;
  thaiTitle: string;
  descriptionTh: string;
  descriptionEn: string;
  color: string;
  data: XRayTrendPointItem[];
  unit: string;
  specMin?: number | null;
  specMax?: number | null;
  isLight: boolean;
  isTh: boolean;
}

const XRayParameterRowCard: React.FC<XRayParameterRowCardProps> = ({
  paramKey,
  title,
  thaiTitle,
  descriptionTh,
  descriptionEn,
  color,
  data,
  unit,
  specMin = null,
  specMax = null,
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

  const count = validPoints.length;
  const avg = count > 0 ? validPoints.reduce((acc, p) => acc + p.value, 0) / count : 0;
  const min = count > 0 ? Math.min(...validPoints.map(p => p.value)) : 0;
  const max = count > 0 ? Math.max(...validPoints.map(p => p.value)) : 0;
  const last = count > 0 ? validPoints[validPoints.length - 1].value : 0;
  
  const outOfSpecCount = useMemo(() => {
    if (!specMin && !specMax) return 0;
    return validPoints.filter(p => {
      if (specMin !== null && specMin !== undefined && p.value < specMin) return true;
      if (specMax !== null && specMax !== undefined && p.value > specMax) return true;
      return false;
    }).length;
  }, [validPoints, specMin, specMax]);

  // Active hovered point
  const activePoint = hoveredIdx !== null && hoveredIdx < validPoints.length ? validPoints[hoveredIdx] : null;

  // SVG Chart Dimensions
  const svgWidth = 1000;
  const svgHeight = 220;
  const padLeft = 65;
  const padRight = 35;
  const padTop = 25;
  const padBottom = 35;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const minCandidate = specMin !== null && specMin !== undefined ? Math.min(min, specMin) : min;
  const minVal = Math.max(0, minCandidate * 0.85);
  const maxCandidate = Math.max(max, specMax || 0, avg, 0.1);
  const maxVal = maxCandidate * 1.25;
  const valRange = maxVal - minVal || 1;

  const getX = (idx: number) => {
    if (validPoints.length <= 1) return padLeft + plotW / 2;
    return padLeft + (idx / (validPoints.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    return padTop + plotH - ((val - minVal) / valRange) * plotH;
  };

  const linePoints = validPoints.map((p, i) => `${getX(i).toFixed(1)},${getY(p.value).toFixed(1)}`).join(' ');
  const areaPath = validPoints.length > 0 
    ? `M ${getX(0).toFixed(1)} ${padTop + plotH} ` + 
      validPoints.map((p, i) => `L ${getX(i).toFixed(1)} ${getY(p.value).toFixed(1)}`).join(' ') + 
      ` L ${getX(validPoints.length - 1).toFixed(1)} ${padTop + plotH} Z`
    : '';

  // Y-axis grid ticks (5 divisions)
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0].map(pct => {
    const val = minVal + pct * valRange;
    return { val, y: getY(val) };
  });

  // X-axis label step
  const xStep = Math.max(1, Math.floor(validPoints.length / 8));

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Parameter Row Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span 
              className="px-2.5 py-1 rounded-xl text-xs font-black uppercase font-mono tracking-wide border"
              style={{
                backgroundColor: isLight ? `${color}15` : `${color}25`,
                color: color,
                borderColor: `${color}40`
              }}
            >
              {title}
            </span>
            <span className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              {isTh ? thaiTitle : title}
            </span>
            {(specMin !== null && specMin !== undefined) || (specMax !== null && specMax !== undefined) ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                Spec: {specMin ? `Min ≥ ${specMin}` : ''} {specMin && specMax ? '•' : ''} {specMax ? `Max ≤ ${specMax}` : ''} {unit}
              </span>
            ) : null}
          </div>
          <p className={`text-[11px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {isTh ? descriptionTh : descriptionEn}
          </p>
        </div>

        {/* Statistical Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className={`px-2.5 py-1 rounded-lg border text-center ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className="text-[9px] block text-slate-400 font-sans uppercase font-bold">Samples (N)</span>
            <strong className="text-xs">{count}</strong>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className="text-[9px] block text-slate-400 font-sans uppercase font-bold">Avg (เฉลี่ย)</span>
            <strong style={{ color }}>{count > 0 ? avg.toFixed(2) : '-'} {unit}</strong>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border text-center ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className="text-[9px] block text-slate-400 font-sans uppercase font-bold">Min (ต่ำสุด)</span>
            <strong>{count > 0 ? min.toFixed(2) : '-'}</strong>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border text-center ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className="text-[9px] block text-slate-400 font-sans uppercase font-bold">Max (สูงสุด)</span>
            <strong>{count > 0 ? max.toFixed(2) : '-'}</strong>
          </div>

          <div className={`px-2.5 py-1 rounded-lg border text-center ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}>
            <span className="text-[9px] block text-slate-400 font-sans uppercase font-bold">Last (ล่าสุด)</span>
            <strong style={{ color }}>{count > 0 ? last.toFixed(2) : '-'}</strong>
          </div>

          {(specMin !== null || specMax !== null) && (
            <div className={`px-2.5 py-1 rounded-lg border text-center ${
              outOfSpecCount > 0 
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 font-bold' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold'
            }`}>
              <span className="text-[9px] block text-slate-400 font-sans uppercase font-bold">Out of Spec</span>
              <strong>{outOfSpecCount} ({count > 0 ? ((outOfSpecCount / count) * 100).toFixed(1) : 0}%)</strong>
            </div>
          )}
        </div>
      </div>

      {/* Hover Inspection Detail Banner */}
      {activePoint ? (
        <div className={`my-2.5 p-2.5 rounded-xl border flex flex-wrap items-center justify-between text-xs animate-fade-in ${
          isLight ? 'bg-blue-50/90 border-blue-200 text-slate-800' : 'bg-slate-950 border-indigo-900/50 text-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">#{activePoint.index}</span>
            <span><strong>วันที่:</strong> {activePoint.date} {activePoint.timestamp}</span>
            <span><strong>Coil / Lot:</strong> <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{activePoint.lotNumber}</span></span>
            <span><strong>Profile:</strong> <span className="font-bold">{activePoint.profileName}</span></span>
            <span><strong>Stage:</strong> {activePoint.stage || 'MASS'}</span>
            <span><strong>Process:</strong> {activePoint.process || '-'}</span>
            <span><strong>ผู้ตรวจ:</strong> {activePoint.inspector || '-'}</span>
          </div>
          <div className="flex items-center gap-2 mt-1 sm:mt-0 font-mono">
            <span className="font-bold text-sm" style={{ color }}>{activePoint.value.toFixed(2)} {unit}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              activePoint.status === 'Pass' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {activePoint.status === 'Pass' ? 'PASS' : 'FAIL'}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-2" />
      )}

      {/* SVG Chart Content */}
      {validPoints.length === 0 ? (
        <div className={`h-48 flex flex-col items-center justify-center rounded-xl border border-dashed text-xs ${
          isLight ? 'bg-slate-50 border-slate-300 text-slate-400' : 'bg-slate-950/60 border-slate-800 text-slate-500'
        }`}>
          <Activity className="w-6 h-6 mb-2 opacity-50" />
          <span>{isTh ? 'ไม่มีข้อมูลการตรวจวัดสำหรับพารามิเตอร์นี้' : 'No measurement trend data for this parameter'}</span>
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className={`w-full h-56 sm:h-64 rounded-xl border overflow-visible ${
              isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-950/90 border-slate-800'
            }`}
          >
            <defs>
              <linearGradient id={`grad-${paramKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color} stopOpacity="0.32" />
                <stop offset="100%" stopColor={color} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Y-axis Grid lines and labels */}
            {yTicks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={tick.y}
                  x2={padLeft + plotW}
                  y2={tick.y}
                  stroke={isLight ? '#e2e8f0' : '#1e293b'}
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={tick.y + 3}
                  textAnchor="end"
                  fill={isLight ? '#64748b' : '#64748b'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {tick.val.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Average Line */}
            {count > 1 && (
              <g>
                <line
                  x1={padLeft}
                  y1={getY(avg)}
                  x2={padLeft + plotW}
                  y2={getY(avg)}
                  stroke={color}
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
                <text
                  x={padLeft + plotW - 6}
                  y={getY(avg) - 4}
                  textAnchor="end"
                  fill={color}
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Avg: {avg.toFixed(2)} {unit}
                </text>
              </g>
            )}

            {/* Spec Min Reference Line */}
            {specMin !== null && specMin !== undefined && specMin > 0 && (
              <g>
                <line
                  x1={padLeft}
                  y1={getY(specMin)}
                  x2={padLeft + plotW}
                  y2={getY(specMin)}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth="2"
                />
                <text
                  x={padLeft + plotW - 6}
                  y={getY(specMin) - 4}
                  textAnchor="end"
                  fill="#ef4444"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Spec Min: ≥ {specMin.toFixed(1)} {unit}
                </text>
              </g>
            )}

            {/* Spec Max Reference Line */}
            {specMax !== null && specMax !== undefined && specMax > 0 && (
              <g>
                <line
                  x1={padLeft}
                  y1={getY(specMax)}
                  x2={padLeft + plotW}
                  y2={getY(specMax)}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  strokeWidth="2"
                />
                <text
                  x={padLeft + plotW - 6}
                  y={getY(specMax) - 4}
                  textAnchor="end"
                  fill="#ef4444"
                  fontSize="10"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Spec Max: ≤ {specMax.toFixed(1)} {unit}
                </text>
              </g>
            )}

            {/* Area Fill */}
            {areaPath && (
              <path d={areaPath} fill={`url(#grad-${paramKey})`} />
            )}

            {/* Line Graph */}
            {validPoints.length > 1 && (
              <polyline
                points={linePoints}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Hover Vertical Guide Line */}
            {hoveredIdx !== null && (
              <line
                x1={getX(hoveredIdx)}
                y1={padTop}
                x2={getX(hoveredIdx)}
                y2={padTop + plotH}
                stroke={color}
                strokeDasharray="3 3"
                strokeWidth="1.5"
                opacity="0.8"
              />
            )}

            {/* Data Points */}
            {validPoints.map((p, i) => {
              const cx = getX(i);
              const cy = getY(p.value);
              const isFail = 
                (specMin !== null && specMin !== undefined && p.value < specMin) ||
                (specMax !== null && specMax !== undefined && p.value > specMax) ||
                p.status === 'Fail';
              const isHovered = hoveredIdx === i;

              return (
                <g key={p.id || i}>
                  {/* Invisible hit area */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    onClick={() => setHoveredIdx(i)}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6.5 : (validPoints.length > 30 ? 3.5 : 4.5)}
                    fill={isFail ? '#ef4444' : (isLight ? '#ffffff' : '#0f172a')}
                    stroke={isFail ? '#ef4444' : color}
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all pointer-events-none"
                  />
                </g>
              );
            })}

            {/* X-axis Baseline */}
            <line
              x1={padLeft}
              y1={padTop + plotH}
              x2={padLeft + plotW}
              y2={padTop + plotH}
              stroke={isLight ? '#cbd5e1' : '#334155'}
              strokeWidth="1.5"
            />

            {/* X-axis Tick Labels (Dates / Lots) */}
            {validPoints.map((p, i) => {
              if (i !== 0 && i !== validPoints.length - 1 && i % xStep !== 0) return null;
              const cx = getX(i);
              return (
                <text
                  key={i}
                  x={cx}
                  y={padTop + plotH + 16}
                  textAnchor="middle"
                  fill={isLight ? '#64748b' : '#64748b'}
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {p.date ? p.date.slice(5) : `#${i + 1}`}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

const DEFAULT_PROFILES: XRayProfileSpec[] = [
  { 
    name: 'Standard_ZnCoating', 
    raUp: '0.80', raLo: '0.80', 
    rzUp: '1.20', rzLo: '1.20', 
    fluxMinUp: '1.00', fluxMinLo: '1.00',
    fluxMaxUp: '2.00', fluxMaxLo: '2.00',
    coverageLimitUp: '95.0', coverageLimitLo: '95.0',
    settingRaUp: '0.75', settingRaLo: '0.75',
    settingRzUp: '1.25', settingRzLo: '1.25',
    settingFluxMinUp: '0.90', settingFluxMinLo: '0.90',
    settingFluxMaxUp: '2.10', settingFluxMaxLo: '2.10',
    settingCoverageLimitUp: '93.0', settingCoverageLimitLo: '93.0'
  },
  {
    name: 'HEAVY-ZN-GALV',
    raUp: '1.20', raLo: '1.20',
    rzUp: '1.80', rzLo: '1.80',
    fluxMinUp: '1.50', fluxMinLo: '1.50',
    fluxMaxUp: '2.80', fluxMaxLo: '2.80',
    coverageLimitUp: '98.0', coverageLimitLo: '98.0',
    settingRaUp: '1.15', settingRaLo: '1.15',
    settingRzUp: '1.85', settingRzLo: '1.85',
    settingFluxMinUp: '1.40', settingFluxMinLo: '1.40',
    settingFluxMaxUp: '2.90', settingFluxMaxLo: '2.90',
    settingCoverageLimitUp: '96.0', settingCoverageLimitLo: '96.0'
  },
  {
    name: 'LIGHT-PRECOAT-01',
    raUp: '0.40', raLo: '0.40',
    rzUp: '0.70', rzLo: '0.70',
    fluxMinUp: '0.50', fluxMinLo: '0.50',
    fluxMaxUp: '1.20', fluxMaxLo: '1.20',
    coverageLimitUp: '90.0', coverageLimitLo: '90.0',
    settingRaUp: '0.35', settingRaLo: '0.35',
    settingRzUp: '0.75', settingRzLo: '0.75',
    settingFluxMinUp: '0.45', settingFluxMinLo: '0.45',
    settingFluxMaxUp: '1.25', settingFluxMaxLo: '1.25',
    settingCoverageLimitUp: '88.0', settingCoverageLimitLo: '88.0'
  }
];

const INITIAL_INSPECTIONS: XRayInspectionRecord[] = [
  {
    id: 'rec-xray-001',
    stage: 'MASS',
    lotNumber: 'COIL-2026-X101',
    partId: 'UP-SIDE',
    process: 'GALVANIZING',
    raUp: '0.95', raLo: '0.92',
    rzUp: '1.45', rzLo: '1.40',
    rtUp: '96.5', rtLo: '95.8',
    status: 'Pass',
    profileName: 'Standard_ZnCoating',
    inspectorName: 'Somchai P. (X-Ray)',
    machine: 'XRAY-SURF-01',
    date: '2026-08-04',
    timestamp: '04/08/2026, 09:30:00'
  },
  {
    id: 'rec-xray-002',
    stage: 'SETTING',
    lotNumber: 'COIL-2026-X102',
    partId: 'LO-SIDE',
    process: 'GALVANIZING',
    raUp: '0.72', raLo: '0.75',
    rzUp: '1.85', rzLo: '1.80',
    rtUp: '92.0', rtLo: '91.5',
    status: 'Fail',
    remarks: 'Zn weight below setting spec min (0.75 g/m²)',
    profileName: 'Standard_ZnCoating',
    inspectorName: 'Somchai P. (X-Ray)',
    machine: 'XRAY-SURF-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 11:15:00'
  }
];

export const XRayMeasurementApp: React.FC<XRayMeasurementAppProps> = ({
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

  // Saved Profiles & Inspections with Real-time Cloud Sync
  const [savedProfiles, setSavedProfiles] = useCloudState<XRayProfileSpec[]>('xray_qc_profiles', DEFAULT_PROFILES);
  const [inspections, setInspections] = useCloudState<XRayInspectionRecord[]>('xray_qc_inspections', INITIAL_INSPECTIONS);

  // Auth State for Settings
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Tab inside Profile Settings: Setting vs Mass specs
  const [specEditTab, setSpecEditTab] = useState<'setting' | 'mass'>('setting');

  // Header Info State (Clean initial state with both Mass and Setting Specs)
  const [headerInfo, setHeaderInfo] = useState({
    inspectorName: '',
    shift: '',
    process: 'EXT',
    machine: '',
    date: new Date().toISOString().split('T')[0],
    profileName: '',
    // Mass Specs
    requirementRaUp: '', requirementRaLo: '', 
    requirementRzUp: '', requirementRzLo: '', 
    requirementFluxMinUp: '', requirementFluxMinLo: '',
    requirementFluxMaxUp: '', requirementFluxMaxLo: '',
    requirementCoverageLimitUp: '', requirementCoverageLimitLo: '',
    // Setting Specs
    requirementSettingRaUp: '', requirementSettingRaLo: '',
    requirementSettingRzUp: '', requirementSettingRzLo: '',
    requirementSettingFluxMinUp: '', requirementSettingFluxMinLo: '',
    requirementSettingFluxMaxUp: '', requirementSettingFluxMaxLo: '',
    requirementSettingCoverageLimitUp: '', requirementSettingCoverageLimitLo: ''
  });

  const [profileStatus, setProfileStatus] = useState<'found' | 'not-found'>('not-found');

  // Multi-point measurement configuration states for Zn, Flux, and Coverage
  const [znPointCount, setZnPointCount] = useState<number>(1);
  const [fluxPointCount, setFluxPointCount] = useState<number>(1);
  const [coveragePointCount, setCoveragePointCount] = useState<number>(1);

  // Profile Spec Editor active stage tab ('SETTING' | 'MASS')
  const [specEditStage, setSpecEditStage] = useState<'SETTING' | 'MASS'>('MASS');

  // Batch Data Entry Items State (Clean initial state, default to SETTING stage)
  const [batchItems, setBatchItems] = useState([
    { 
      id: Date.now(), 
      stage: 'SETTING' as 'SETTING' | 'MASS',
      partId: '', 
      lotNumber: '', 
      process: '', 
      raUp: createEmptyPointArray(1), 
      raLo: createEmptyPointArray(1), 
      rzUp: createEmptyPointArray(1), 
      rzLo: createEmptyPointArray(1), 
      rtUp: createEmptyPointArray(1), 
      rtLo: createEmptyPointArray(1), 
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    }
  ]);

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'profile' | 'history'; id: string; label: string } | null>(null);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<XRayInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<XRayInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: XRayInspectionRecord) => {
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
    const upArr = toArray(editingHistoryItem.raUp);
    const loArr = toArray(editingHistoryItem.raLo);
    const fluxUpArr = toArray(editingHistoryItem.rzUp);
    const fluxLoArr = toArray(editingHistoryItem.rzLo);
    const covUpArr = toArray(editingHistoryItem.rtUp);
    const covLoArr = toArray(editingHistoryItem.rtLo);

    const updated: XRayInspectionRecord = {
      ...editingHistoryItem,
      znAvgUp: calcAvg(upArr),
      znAvgLo: calcAvg(loArr),
      znAvgTotal: getOverallAvg(upArr, loArr),
      znPointsCount: Math.max(upArr.length, loArr.length),
      fluxAvgUp: calcAvg(fluxUpArr),
      fluxAvgLo: calcAvg(fluxLoArr),
      fluxAvgTotal: getOverallAvg(fluxUpArr, fluxLoArr),
      fluxPointsCount: Math.max(fluxUpArr.length, fluxLoArr.length),
      coverageAvgUp: calcAvg(covUpArr, 1),
      coverageAvgLo: calcAvg(covLoArr, 1),
      coverageAvgTotal: getOverallAvg(covUpArr, covLoArr, 1),
      coveragePointsCount: Math.max(covUpArr.length, covLoArr.length)
    };
    setInspections(prev => prev.map(ins => ins.id === updated.id ? updated : ins));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
    showNotification(isTh ? 'บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว' : 'Record updated successfully');
  };

  const [trendFilterProfile, setTrendFilterProfile] = useState('All');
  const [trendFilterMonth, setTrendFilterMonth] = useState('All');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Handle Admin Auth
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

  const availableProfiles = useMemo(() => {
    return ['All', ...Array.from(new Set(inspections.map(i => i.profileName || 'Unknown')))];
  }, [inspections]);

  const availableMonths = useMemo(() => {
    const months = inspections.map(i => i.date ? i.date.substring(0, 7) : null).filter(Boolean) as string[];
    return ['All', ...Array.from(new Set(months))].sort((a, b) => b.localeCompare(a));
  }, [inspections]);

  // Dashboard Stats
  const dashboardStats = useMemo(() => {
    if (inspections.length === 0) return null;

    const total = inspections.length;
    const passCount = inspections.filter(i => i.status === 'Pass').length;
    const failCount = total - passCount;
    const passRatio = ((passCount / total) * 100).toFixed(1);

    const profileGroups: Record<string, { 
      name: string; total: number; pass: number; fail: number; 
      avgZn: number; countZn: number;
      avgFlux: number; countFlux: number;
      avgCov: number; countCov: number;
    }> = {};

    inspections.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!profileGroups[pName]) {
        profileGroups[pName] = { 
          name: pName, total: 0, pass: 0, fail: 0, 
          avgZn: 0, countZn: 0,
          avgFlux: 0, countFlux: 0,
          avgCov: 0, countCov: 0,
        };
      }
      profileGroups[pName].total++;
      if (item.status === 'Pass') profileGroups[pName].pass++;
      else profileGroups[pName].fail++;

      const upVals = toArray(item.raUp).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const loVals = toArray(item.raLo).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      upVals.forEach(v => { profileGroups[pName].avgZn += v; profileGroups[pName].countZn++; });
      loVals.forEach(v => { profileGroups[pName].avgZn += v; profileGroups[pName].countZn++; });

      const upFluxVals = toArray(item.rzUp).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const loFluxVals = toArray(item.rzLo).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      upFluxVals.forEach(v => { profileGroups[pName].avgFlux += v; profileGroups[pName].countFlux++; });
      loFluxVals.forEach(v => { profileGroups[pName].avgFlux += v; profileGroups[pName].countFlux++; });

      const upCovVals = toArray(item.rtUp).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      const loCovVals = toArray(item.rtLo).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
      upCovVals.forEach(v => { profileGroups[pName].avgCov += v; profileGroups[pName].countCov++; });
      loCovVals.forEach(v => { profileGroups[pName].avgCov += v; profileGroups[pName].countCov++; });
    });

    const profileSummaries = Object.values(profileGroups).map(g => {
      return {
        ...g,
        avgZn: g.countZn > 0 ? (g.avgZn / g.countZn).toFixed(2) : '-',
        avgFlux: g.countFlux > 0 ? (g.avgFlux / g.countFlux).toFixed(2) : '-',
        avgCov: g.countCov > 0 ? (g.avgCov / g.countCov).toFixed(1) : '-',
        passRate: ((g.pass / g.total) * 100).toFixed(1),
      };
    });

    return { total, passCount, failCount, passRatio, profileSummaries };
  }, [inspections]);

  // Filtered Chronological Inspection Data for unified X-Ray trend graphs
  const filteredTrendData = useMemo<XRayTrendPointItem[]>(() => {
    if (inspections.length === 0) return [];

    let filtered = [...inspections];
    if (trendFilterProfile !== 'All') {
      filtered = filtered.filter(i => (i.profileName || 'Unknown') === trendFilterProfile);
    }
    if (trendFilterMonth !== 'All') {
      filtered = filtered.filter(i => i.date && i.date.startsWith(trendFilterMonth));
    }

    // Sort chronologically (oldest to newest for left-to-right trend)
    filtered.sort((a, b) => {
      const dateA = `${a.date || ''} ${a.timestamp || ''}`;
      const dateB = `${b.date || ''} ${b.timestamp || ''}`;
      return dateA.localeCompare(dateB);
    });

    return filtered.map((item, idx) => {
      // Calculate Zn Weight
      let znVal = 0;
      if (item.znAvgTotal && !isNaN(parseFloat(item.znAvgTotal)) && parseFloat(item.znAvgTotal) > 0) {
        znVal = parseFloat(item.znAvgTotal);
      } else {
        const upVals = toArray(item.raUp).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        const loVals = toArray(item.raLo).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        const all = [...upVals, ...loVals];
        znVal = all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : 0;
      }

      // Calculate Flux Weight
      let fluxVal = 0;
      if (item.fluxAvgTotal && !isNaN(parseFloat(item.fluxAvgTotal)) && parseFloat(item.fluxAvgTotal) > 0) {
        fluxVal = parseFloat(item.fluxAvgTotal);
      } else {
        const upVals = toArray(item.rzUp).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        const loVals = toArray(item.rzLo).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        const all = [...upVals, ...loVals];
        fluxVal = all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : 0;
      }

      // Calculate Coverage %
      let covVal = 0;
      if (item.coverageAvgTotal && !isNaN(parseFloat(item.coverageAvgTotal)) && parseFloat(item.coverageAvgTotal) > 0) {
        covVal = parseFloat(item.coverageAvgTotal);
      } else {
        const upVals = toArray(item.rtUp).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        const loVals = toArray(item.rtLo).map(v => parseFloat(v)).filter(v => !isNaN(v) && v > 0);
        const all = [...upVals, ...loVals];
        covVal = all.length > 0 ? all.reduce((a, b) => a + b, 0) / all.length : 0;
      }

      return {
        index: idx + 1,
        id: item.id || `xray-ins-${idx}`,
        date: item.date || '-',
        timestamp: item.timestamp || '',
        lotNumber: item.lotNumber || '-',
        profileName: item.profileName || 'Unknown',
        stage: item.stage || 'MASS',
        process: item.process || '-',
        status: item.status || 'Pass',
        inspector: item.inspectorName || '-',
        zn: znVal,
        flux: fluxVal,
        coverage: covVal,
      };
    });
  }, [inspections, trendFilterProfile, trendFilterMonth]);

  // Active spec when a specific profile is queried
  const activeTrendSpec = useMemo(() => {
    if (trendFilterProfile === 'All') return null;
    return savedProfiles.find(p => p.name.toLowerCase() === trendFilterProfile.toLowerCase()) || null;
  }, [trendFilterProfile, savedProfiles]);

  const formatSpecValue = (val: any) => {
    if (val === undefined || val === null || val === '' || isNaN(parseFloat(val))) return '0.0';
    return String(val);
  };

  const selectProfile = (profile: XRayProfileSpec) => {
    setHeaderInfo(prev => ({
      ...prev,
      profileName: profile.name,
      // Mass Specs
      requirementRaUp: formatSpecValue(profile.raUp),
      requirementRaLo: formatSpecValue(profile.raLo),
      requirementRzUp: formatSpecValue(profile.rzUp),
      requirementRzLo: formatSpecValue(profile.rzLo),
      requirementFluxMinUp: formatSpecValue(profile.fluxMinUp),
      requirementFluxMinLo: formatSpecValue(profile.fluxMinLo),
      requirementFluxMaxUp: formatSpecValue(profile.fluxMaxUp),
      requirementFluxMaxLo: formatSpecValue(profile.fluxMaxLo),
      requirementCoverageLimitUp: formatSpecValue(profile.coverageLimitUp),
      requirementCoverageLimitLo: formatSpecValue(profile.coverageLimitLo),
      // Setting Specs (fallback to mass spec if not specified)
      requirementSettingRaUp: formatSpecValue(profile.settingRaUp || profile.raUp),
      requirementSettingRaLo: formatSpecValue(profile.settingRaLo || profile.raLo),
      requirementSettingRzUp: formatSpecValue(profile.settingRzUp || profile.rzUp),
      requirementSettingRzLo: formatSpecValue(profile.settingRzLo || profile.rzLo),
      requirementSettingFluxMinUp: formatSpecValue(profile.settingFluxMinUp || profile.fluxMinUp),
      requirementSettingFluxMinLo: formatSpecValue(profile.settingFluxMinLo || profile.fluxMinLo),
      requirementSettingFluxMaxUp: formatSpecValue(profile.settingFluxMaxUp || profile.fluxMaxUp),
      requirementSettingFluxMaxLo: formatSpecValue(profile.settingFluxMaxLo || profile.fluxMaxLo),
      requirementSettingCoverageLimitUp: formatSpecValue(profile.settingCoverageLimitUp || profile.coverageLimitUp),
      requirementSettingCoverageLimitLo: formatSpecValue(profile.settingCoverageLimitLo || profile.coverageLimitLo)
    }));
    setProfileStatus('found');
  };

  useEffect(() => {
    if (headerInfo.profileName) {
      const match = savedProfiles.find(p => p.name.toLowerCase() === headerInfo.profileName.toLowerCase());
      if (match) {
        setHeaderInfo(prev => ({
          ...prev,
          requirementRaUp: formatSpecValue(match.raUp),
          requirementRaLo: formatSpecValue(match.raLo),
          requirementRzUp: formatSpecValue(match.rzUp),
          requirementRzLo: formatSpecValue(match.rzLo),
          requirementFluxMinUp: formatSpecValue(match.fluxMinUp),
          requirementFluxMinLo: formatSpecValue(match.fluxMinLo),
          requirementFluxMaxUp: formatSpecValue(match.fluxMaxUp),
          requirementFluxMaxLo: formatSpecValue(match.fluxMaxLo),
          requirementCoverageLimitUp: formatSpecValue(match.coverageLimitUp),
          requirementCoverageLimitLo: formatSpecValue(match.coverageLimitLo),
          requirementSettingRaUp: formatSpecValue(match.settingRaUp || match.raUp),
          requirementSettingRaLo: formatSpecValue(match.settingRaLo || match.raLo),
          requirementSettingRzUp: formatSpecValue(match.settingRzUp || match.rzUp),
          requirementSettingRzLo: formatSpecValue(match.settingRzLo || match.rzLo),
          requirementSettingFluxMinUp: formatSpecValue(match.settingFluxMinUp || match.fluxMinUp),
          requirementSettingFluxMinLo: formatSpecValue(match.settingFluxMinLo || match.fluxMinLo),
          requirementSettingFluxMaxUp: formatSpecValue(match.settingFluxMaxUp || match.fluxMaxUp),
          requirementSettingFluxMaxLo: formatSpecValue(match.settingFluxMaxLo || match.fluxMaxLo),
          requirementSettingCoverageLimitUp: formatSpecValue(match.settingCoverageLimitUp || match.coverageLimitUp),
          requirementSettingCoverageLimitLo: formatSpecValue(match.settingCoverageLimitLo || match.coverageLimitLo)
        }));
        setProfileStatus('found');
      } else {
        setProfileStatus('not-found');
      }
    }
  }, [headerInfo.profileName, savedProfiles]);

  const handleSaveProfile = () => {
    if (!headerInfo.profileName.trim()) {
      showNotification(isTh ? 'กรุณาระบุชื่อ Profile ก่อนบันทึก' : 'Please specify Profile Name', 'error');
      return;
    }

    const newProfile: XRayProfileSpec = {
      name: headerInfo.profileName.trim(),
      // Mass specs
      raUp: headerInfo.requirementRaUp, raLo: headerInfo.requirementRaLo,
      rzUp: headerInfo.requirementRzUp, rzLo: headerInfo.requirementRzLo,
      fluxMinUp: headerInfo.requirementFluxMinUp, fluxMinLo: headerInfo.requirementFluxMinLo,
      fluxMaxUp: headerInfo.requirementFluxMaxUp, fluxMaxLo: headerInfo.requirementFluxMaxLo,
      coverageLimitUp: headerInfo.requirementCoverageLimitUp,
      coverageLimitLo: headerInfo.requirementCoverageLimitLo,
      // Setting specs
      settingRaUp: headerInfo.requirementSettingRaUp || headerInfo.requirementRaUp,
      settingRaLo: headerInfo.requirementSettingRaLo || headerInfo.requirementRaLo,
      settingRzUp: headerInfo.requirementSettingRzUp || headerInfo.requirementRzUp,
      settingRzLo: headerInfo.requirementSettingRzLo || headerInfo.requirementRzLo,
      settingFluxMinUp: headerInfo.requirementSettingFluxMinUp || headerInfo.requirementFluxMinUp,
      settingFluxMinLo: headerInfo.requirementSettingFluxMinLo || headerInfo.requirementFluxMinLo,
      settingFluxMaxUp: headerInfo.requirementSettingFluxMaxUp || headerInfo.requirementFluxMaxUp,
      settingFluxMaxLo: headerInfo.requirementSettingFluxMaxLo || headerInfo.requirementFluxMaxLo,
      settingCoverageLimitUp: headerInfo.requirementSettingCoverageLimitUp || headerInfo.requirementCoverageLimitUp,
      settingCoverageLimitLo: headerInfo.requirementSettingCoverageLimitLo || headerInfo.requirementCoverageLimitLo,
    };

    setSavedProfiles(prev => {
      const idx = prev.findIndex(p => p.name.toLowerCase() === newProfile.name.toLowerCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newProfile;
        return copy;
      }
      return [...prev, newProfile];
    });

    showNotification(isTh ? `บันทึก Profile "${newProfile.name}" (พร้อม Setting & Mass Spec) เรียบร้อยแล้ว` : `Saved Profile "${newProfile.name}" (Setting & Mass Specs)`);
  };

  const handleDeleteProfile = (profileName: string) => {
    setSavedProfiles(prev => prev.filter(p => p.name !== profileName));
    if (headerInfo.profileName === profileName) {
      setHeaderInfo(prev => ({ ...prev, profileName: '' }));
      setProfileStatus('not-found');
    }
    showNotification(isTh ? `ลบ Profile สำเร็จ` : `Deleted profile`);
    setDeleteConfirm(null);
  };

  const handleDeleteHistoryItem = (docId: string) => {
    setInspections(prev => prev.filter(i => i.id !== docId));
    showNotification(isTh ? 'ลบรายการประวัติสำเร็จ' : 'Deleted history item');
    setDeleteConfirm(null);
  };

  const getItemActiveSpecs = (stage: 'SETTING' | 'MASS' = 'SETTING') => {
    const isSetting = stage === 'SETTING';
    return {
      znMinUp: isSetting ? (headerInfo.requirementSettingRaUp || headerInfo.requirementRaUp) : headerInfo.requirementRaUp,
      znMaxUp: isSetting ? (headerInfo.requirementSettingRzUp || headerInfo.requirementRzUp) : headerInfo.requirementRzUp,
      znMinLo: isSetting ? (headerInfo.requirementSettingRaLo || headerInfo.requirementRaLo) : headerInfo.requirementRaLo,
      znMaxLo: isSetting ? (headerInfo.requirementSettingRzLo || headerInfo.requirementRzLo) : headerInfo.requirementRzLo,
      fluxMinUp: isSetting ? (headerInfo.requirementSettingFluxMinUp || headerInfo.requirementFluxMinUp) : headerInfo.requirementFluxMinUp,
      fluxMaxUp: isSetting ? (headerInfo.requirementSettingFluxMaxUp || headerInfo.requirementFluxMaxUp) : headerInfo.requirementFluxMaxUp,
      fluxMinLo: isSetting ? (headerInfo.requirementSettingFluxMinLo || headerInfo.requirementFluxMinLo) : headerInfo.requirementFluxMinLo,
      fluxMaxLo: isSetting ? (headerInfo.requirementSettingFluxMaxLo || headerInfo.requirementFluxMaxLo) : headerInfo.requirementFluxMaxLo,
      coverageUp: isSetting ? (headerInfo.requirementSettingCoverageLimitUp || headerInfo.requirementCoverageLimitUp) : headerInfo.requirementCoverageLimitUp,
      coverageLo: isSetting ? (headerInfo.requirementSettingCoverageLimitLo || headerInfo.requirementCoverageLimitLo) : headerInfo.requirementCoverageLimitLo,
    };
  };

  const isIgnoredValue = (v?: string | number): boolean => {
    if (v === undefined || v === null) return true;
    const s = String(v).trim();
    return s === '' || s === '-' || s === '--' || s === '---' || s === 'N/A' || s === 'n/a' || s === 'none' || s === 'null' || s === 'undefined';
  };

  const judgeStatus = (item: typeof batchItems[0]): 'Pass' | 'Fail' | 'Pending' => {
    const activeSpec = getItemActiveSpecs(item.stage || 'SETTING');
    const specs = {
      znMinUp: parseFloat(activeSpec.znMinUp) || 0,
      znMaxUp: parseFloat(activeSpec.znMaxUp) || 0,
      znMinLo: parseFloat(activeSpec.znMinLo) || 0,
      znMaxLo: parseFloat(activeSpec.znMaxLo) || 0,
      fluxMinUp: parseFloat(activeSpec.fluxMinUp) || 0,
      fluxMaxUp: parseFloat(activeSpec.fluxMaxUp) || 0,
      fluxMinLo: parseFloat(activeSpec.fluxMinLo) || 0,
      fluxMaxLo: parseFloat(activeSpec.fluxMaxLo) || 0,
      coverageUp: parseFloat(activeSpec.coverageUp) || 0,
      coverageLo: parseFloat(activeSpec.coverageLo) || 0
    };

    const hasZnReqUp = !headerInfo.profileName || specs.znMinUp > 0 || specs.znMaxUp > 0;
    const hasZnReqLo = !headerInfo.profileName || specs.znMinLo > 0 || specs.znMaxLo > 0;
    const hasFluxReqUp = !headerInfo.profileName || specs.fluxMinUp > 0 || specs.fluxMaxUp > 0;
    const hasFluxReqLo = !headerInfo.profileName || specs.fluxMinLo > 0 || specs.fluxMaxLo > 0;
    const hasCoverageReqUp = !headerInfo.profileName || specs.coverageUp > 0;
    const hasCoverageReqLo = !headerInfo.profileName || specs.coverageLo > 0;

    const allValues = [
      ...(item.raUp || []),
      ...(item.raLo || []),
      ...(item.rzUp || []),
      ...(item.rzLo || []),
      ...(item.rtUp || []),
      ...(item.rtLo || [])
    ];

    const numericValues = allValues.filter(v => {
      if (isIgnoredValue(v)) return false;
      const n = parseFloat(String(v).trim());
      return !isNaN(n);
    });

    if (numericValues.length === 0) return 'Pending';

    let pass = true;

    if (hasZnReqUp) {
      for (const val of item.raUp) {
        if (!isIgnoredValue(val)) {
          const znUp = parseFloat(String(val).trim());
          if (!isNaN(znUp)) {
            if (specs.znMinUp > 0 && znUp < specs.znMinUp) pass = false;
            if (specs.znMaxUp > 0 && znUp > specs.znMaxUp) pass = false;
          }
        }
      }
    }

    if (hasZnReqLo) {
      for (const val of item.raLo) {
        if (!isIgnoredValue(val)) {
          const znLo = parseFloat(String(val).trim());
          if (!isNaN(znLo)) {
            if (specs.znMinLo > 0 && znLo < specs.znMinLo) pass = false;
            if (specs.znMaxLo > 0 && znLo > specs.znMaxLo) pass = false;
          }
        }
      }
    }

    if (hasFluxReqUp) {
      for (const val of item.rzUp) {
        if (!isIgnoredValue(val)) {
          const fluxUp = parseFloat(String(val).trim());
          if (!isNaN(fluxUp)) {
            if (specs.fluxMinUp > 0 && fluxUp < specs.fluxMinUp) pass = false;
            if (specs.fluxMaxUp > 0 && fluxUp > specs.fluxMaxUp) pass = false;
          }
        }
      }
    }

    if (hasFluxReqLo) {
      for (const val of item.rzLo) {
        if (!isIgnoredValue(val)) {
          const fluxLo = parseFloat(String(val).trim());
          if (!isNaN(fluxLo)) {
            if (specs.fluxMinLo > 0 && fluxLo < specs.fluxMinLo) pass = false;
            if (specs.fluxMaxLo > 0 && fluxLo > specs.fluxMaxLo) pass = false;
          }
        }
      }
    }

    if (hasCoverageReqUp) {
      for (const val of item.rtUp) {
        if (!isIgnoredValue(val)) {
          const covUp = parseFloat(String(val).trim());
          if (!isNaN(covUp) && specs.coverageUp > 0 && covUp < specs.coverageUp) pass = false;
        }
      }
    }

    if (hasCoverageReqLo) {
      for (const val of item.rtLo) {
        if (!isIgnoredValue(val)) {
          const covLo = parseFloat(String(val).trim());
          if (!isNaN(covLo) && specs.coverageLo > 0 && covLo < specs.coverageLo) pass = false;
        }
      }
    }

    return pass ? 'Pass' : 'Fail';
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Add / Remove Zn Point
  const addZnPoint = () => {
    const newCount = znPointCount + 1;
    setZnPointCount(newCount);
    setBatchItems(items => items.map(it => ({
      ...it,
      raUp: [...(Array.isArray(it.raUp) ? it.raUp : [it.raUp || '']), ''],
      raLo: [...(Array.isArray(it.raLo) ? it.raLo : [it.raLo || '']), '']
    })));
    showNotification(isTh ? `เพิ่มจุดวัด Zn weight เป็น ${newCount} จุด` : `Added Zn weight point (${newCount} points total)`);
  };

  const removeZnPoint = () => {
    if (znPointCount <= 1) return;
    const newCount = znPointCount - 1;
    setZnPointCount(newCount);
    setBatchItems(items => items.map(it => ({
      ...it,
      raUp: (Array.isArray(it.raUp) ? it.raUp : [it.raUp || '']).slice(0, newCount),
      raLo: (Array.isArray(it.raLo) ? it.raLo : [it.raLo || '']).slice(0, newCount)
    })));
    showNotification(isTh ? `ลดจุดวัด Zn weight เหลือ ${newCount} จุด` : `Reduced Zn weight point (${newCount} points)`);
  };

  // Add / Remove Flux Point
  const addFluxPoint = () => {
    const newCount = fluxPointCount + 1;
    setFluxPointCount(newCount);
    setBatchItems(items => items.map(it => ({
      ...it,
      rzUp: [...(Array.isArray(it.rzUp) ? it.rzUp : [it.rzUp || '']), ''],
      rzLo: [...(Array.isArray(it.rzLo) ? it.rzLo : [it.rzLo || '']), '']
    })));
    showNotification(isTh ? `เพิ่มจุดวัด Flux weight เป็น ${newCount} จุด` : `Added Flux weight point (${newCount} points total)`);
  };

  const removeFluxPoint = () => {
    if (fluxPointCount <= 1) return;
    const newCount = fluxPointCount - 1;
    setFluxPointCount(newCount);
    setBatchItems(items => items.map(it => ({
      ...it,
      rzUp: (Array.isArray(it.rzUp) ? it.rzUp : [it.rzUp || '']).slice(0, newCount),
      rzLo: (Array.isArray(it.rzLo) ? it.rzLo : [it.rzLo || '']).slice(0, newCount)
    })));
    showNotification(isTh ? `ลดจุดวัด Flux weight เหลือ ${newCount} จุด` : `Reduced Flux weight point (${newCount} points)`);
  };

  // Add / Remove Coverage Point
  const addCoveragePoint = () => {
    const newCount = coveragePointCount + 1;
    setCoveragePointCount(newCount);
    setBatchItems(items => items.map(it => ({
      ...it,
      rtUp: [...(Array.isArray(it.rtUp) ? it.rtUp : [it.rtUp || '']), ''],
      rtLo: [...(Array.isArray(it.rtLo) ? it.rtLo : [it.rtLo || '']), '']
    })));
    showNotification(isTh ? `เพิ่มจุดวัด Coverage % เป็น ${newCount} จุด` : `Added Coverage point (${newCount} points total)`);
  };

  const removeCoveragePoint = () => {
    if (coveragePointCount <= 1) return;
    const newCount = coveragePointCount - 1;
    setCoveragePointCount(newCount);
    setBatchItems(items => items.map(it => ({
      ...it,
      rtUp: (Array.isArray(it.rtUp) ? it.rtUp : [it.rtUp || '']).slice(0, newCount),
      rtLo: (Array.isArray(it.rtLo) ? it.rtLo : [it.rtLo || '']).slice(0, newCount)
    })));
    showNotification(isTh ? `ลดจุดวัด Coverage % เหลือ ${newCount} จุด` : `Reduced Coverage point (${newCount} points)`);
  };

  const handleResetForm = () => {
    setHeaderInfo({
      inspectorName: '',
      shift: '',
      machine: '',
      date: new Date().toISOString().split('T')[0],
      profileName: '',
      requirementRaUp: '', requirementRaLo: '', 
      requirementRzUp: '', requirementRzLo: '', 
      requirementFluxMinUp: '', requirementFluxMinLo: '',
      requirementFluxMaxUp: '', requirementFluxMaxLo: '',
      requirementCoverageLimitUp: '', requirementCoverageLimitLo: '',
      requirementSettingRaUp: '', requirementSettingRaLo: '',
      requirementSettingRzUp: '', requirementSettingRzLo: '',
      requirementSettingFluxMinUp: '', requirementSettingFluxMinLo: '',
      requirementSettingFluxMaxUp: '', requirementSettingFluxMaxLo: '',
      requirementSettingCoverageLimitUp: '', requirementSettingCoverageLimitLo: ''
    });
    setProfileStatus('not-found');
    setBatchItems([{ 
      id: Date.now(), 
      stage: 'SETTING' as 'SETTING' | 'MASS',
      partId: '', 
      lotNumber: '', 
      process: '', 
      raUp: createEmptyPointArray(znPointCount), 
      raLo: createEmptyPointArray(znPointCount), 
      rzUp: createEmptyPointArray(fluxPointCount), 
      rzLo: createEmptyPointArray(fluxPointCount), 
      rtUp: createEmptyPointArray(coveragePointCount), 
      rtLo: createEmptyPointArray(coveragePointCount), 
      status: 'Pending', 
      remarks: '' 
    }]);
  };

  // Add Sample Rows (Supports adding 1, 3, or 5 items at once for Coil)
  const addRows = (count: number = 1) => {
    const lastItem = batchItems[batchItems.length - 1];
    const newItems: typeof batchItems = [];
    for (let i = 0; i < count; i++) {
      newItems.push({ 
        id: Date.now() + Math.random() + i, 
        stage: (lastItem?.stage || 'SETTING') as 'SETTING' | 'MASS',
        partId: lastItem ? lastItem.partId : '', 
        lotNumber: lastItem ? lastItem.lotNumber : '', 
        process: lastItem ? lastItem.process : '', 
        raUp: createEmptyPointArray(znPointCount), 
        raLo: createEmptyPointArray(znPointCount), 
        rzUp: createEmptyPointArray(fluxPointCount), 
        rzLo: createEmptyPointArray(fluxPointCount), 
        rtUp: createEmptyPointArray(coveragePointCount), 
        rtLo: createEmptyPointArray(coveragePointCount), 
        status: 'Pending', 
        remarks: '' 
      });
    }
    setBatchItems(prev => [...prev, ...newItems]);
    showNotification(
      count === 1
        ? (isTh ? '✓ เพิ่มรายการ Coil 1 รายการ' : '✓ Added 1 Coil row')
        : (isTh ? `✓ เพิ่มชุด Coil ${count} รายการเรียบร้อยแล้ว` : `✓ Added batch of ${count} Coil rows`),
      'success'
    );
  };

  const addRow = () => addRows(1);

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDynamicPointChange = (
    id: number, 
    field: 'raUp' | 'raLo' | 'rzUp' | 'rzLo' | 'rtUp' | 'rtLo', 
    pointIndex: number, 
    value: string
  ) => {
    setBatchItems(prev => prev.map(item => {
      if (item.id === id) {
        const newArr = [...item[field]];
        while (newArr.length <= pointIndex) newArr.push('');
        newArr[pointIndex] = value;
        return { ...item, [field]: newArr };
      }
      return item;
    }));
  };

  const handleDynamicZnChange = (id: number, side: 'raUp' | 'raLo', pointIndex: number, value: string) => {
    handleDynamicPointChange(id, side, pointIndex, value);
  };

  const saveBatch = () => {
    const validItems = batchItems.filter(item => (item.partId || item.lotNumber) && judgeStatus(item) !== 'Pending');
    if (validItems.length === 0) {
      showNotification(isTh ? 'กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ' : 'Please enter inspection data', 'error');
      return;
    }

    const now = new Date();
    const newRecords: XRayInspectionRecord[] = validItems.map(item => {
      const decision = judgeStatus(item);
      const recId = `rec-xray-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      const znAvgUpVal = calcAvg(item.raUp);
      const znAvgLoVal = calcAvg(item.raLo);
      const znAvgTotalVal = getOverallAvg(item.raUp, item.raLo);
      const znUpStr = item.raUp.filter(v => v.trim() !== '').join(', ');
      const znLoStr = item.raLo.filter(v => v.trim() !== '').join(', ');

      const fluxAvgUpVal = calcAvg(item.rzUp);
      const fluxAvgLoVal = calcAvg(item.rzLo);
      const fluxAvgTotalVal = getOverallAvg(item.rzUp, item.rzLo);
      const fluxUpStr = item.rzUp.filter(v => v.trim() !== '').join(', ');
      const fluxLoStr = item.rzLo.filter(v => v.trim() !== '').join(', ');

      const covAvgUpVal = calcAvg(item.rtUp, 1);
      const covAvgLoVal = calcAvg(item.rtLo, 1);
      const covAvgTotalVal = getOverallAvg(item.rtUp, item.rtLo, 1);
      const covUpStr = item.rtUp.filter(v => v.trim() !== '').join(', ');
      const covLoStr = item.rtLo.filter(v => v.trim() !== '').join(', ');

      if (onLogNewActivity) {
        if (headerInfo.inspectorName) saveRecordedInspector(headerInfo.inspectorName);
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-03',
          moduleTitleTh: 'การตรวจวัดด้วยรังสีเอกซ์ (X-Ray Measurement)',
          moduleTitleEn: 'X-Ray Coating Weight & Coverage Measurement System',
          inspector: headerInfo.inspectorName || 'X-Ray Technician',
          shift: headerInfo.shift || '',
          batchLot: `[${item.stage || 'SETTING'}] ${headerInfo.profileName} - ${item.lotNumber}`,
          result: decision === 'Pass' ? 'PASS' : 'REJECT',
          defectCount: decision === 'Fail' ? 1 : 0,
          remarks: `Stage: ${item.stage || 'SETTING'}, Zn: [${znUpStr}]/[${znLoStr}] (Avg: ${znAvgTotalVal}), Flux: [${fluxUpStr}]/[${fluxLoStr}] (Avg: ${fluxAvgTotalVal}), Coverage: [${covUpStr}]/[${covLoStr}]% (Avg: ${covAvgTotalVal}%)`
        });
      }

      return {
        id: recId,
        stage: (item.stage || 'SETTING') as 'SETTING' | 'MASS',
        lotNumber: item.lotNumber.trim().toUpperCase() || 'COIL-UNTITLED',
        partId: item.partId.trim().toUpperCase() || 'UP-SIDE',
        process: item.process.trim().toUpperCase() || 'GALVANIZING',
        raUp: item.raUp,
        raLo: item.raLo,
        znAvgUp: znAvgUpVal,
        znAvgLo: znAvgLoVal,
        znAvgTotal: znAvgTotalVal,
        znPointsCount: item.raUp.length,
        rzUp: item.rzUp,
        rzLo: item.rzLo,
        fluxAvgUp: fluxAvgUpVal,
        fluxAvgLo: fluxAvgLoVal,
        fluxAvgTotal: fluxAvgTotalVal,
        fluxPointsCount: item.rzUp.length,
        rtUp: item.rtUp,
        rtLo: item.rtLo,
        coverageAvgUp: covAvgUpVal,
        coverageAvgLo: covAvgLoVal,
        coverageAvgTotal: covAvgTotalVal,
        coveragePointsCount: item.rtUp.length,
        status: decision,
        remarks: item.remarks,
        profileName: headerInfo.profileName,
        inspectorName: headerInfo.inspectorName || 'X-Ray Inspector',
        shift: headerInfo.shift || '',
        machine: headerInfo.machine || 'XRAY-SURF-01',
        date: headerInfo.date,
        timestamp: now.toLocaleString('th-TH'),
        timestamp_raw: now.toISOString()
      };
    });

    setInspections(prev => [...newRecords, ...prev]);
    showNotification(isTh ? `บันทึกข้อมูล ${validItems.length} รายการเรียบร้อยแล้ว` : `Saved ${validItems.length} inspection items`);

    setBatchItems([{ 
      id: Date.now(), 
      stage: 'SETTING' as 'SETTING' | 'MASS',
      partId: '', lotNumber: '', process: '', 
      raUp: createEmptyPointArray(znPointCount), 
      raLo: createEmptyPointArray(znPointCount), 
      rzUp: createEmptyPointArray(fluxPointCount), 
      rzLo: createEmptyPointArray(fluxPointCount), 
      rtUp: createEmptyPointArray(coveragePointCount), 
      rtLo: createEmptyPointArray(coveragePointCount), 
      status: 'Pending', 
      remarks: '' 
    }]);

    setActiveTab('history');
  };

  const isOutOfSpec = (val: string, min: string, max: string) => {
    const v = parseFloat(val);
    if (isNaN(v)) return false;
    const minVal = parseFloat(min) || 0;
    const maxVal = parseFloat(max) || 0;
    if (minVal > 0 && v < minVal) return true;
    if (maxVal > 0 && v > maxVal) return true;
    return false;
  };

  const exportToExcel = () => {
    if (inspections.length === 0) {
      showNotification(isTh ? 'ไม่มีข้อมูลสำหรับ Export' : 'No history to export', 'error');
      return;
    }

    const headers = [
      'Timestamp', 'Inspector', 'Machine', 'Profile Name', 'Stage', 'Coil No', 'Side', 'Process', 
      'Zn Up Points', 'Zn Lo Points', 'Zn Avg Up', 'Zn Avg Lo', 'Zn Avg Overall', 
      'Flux Up Points', 'Flux Lo Points', 'Flux Avg Up', 'Flux Avg Lo', 'Flux Avg Overall',
      'Coverage Up Points', 'Coverage Lo Points', 'Coverage Avg Up', 'Coverage Avg Lo', 'Coverage Avg Overall',
      'Status'
    ];

    const csvRows = inspections.map(ins => [
      `"${ins.timestamp}"`,
      `"${ins.inspectorName}"`,
      `"${ins.machine || '-'}"`,
      `"${ins.profileName}"`,
      `"${ins.stage || 'SETTING'}"`,
      `"${ins.lotNumber}"`,
      `"${ins.partId}"`,
      `"${ins.process}"`,
      `"${formatPointsDisplay(ins.raUp)}"`,
      `"${formatPointsDisplay(ins.raLo)}"`,
      `"${ins.znAvgUp || calcAvg(ins.raUp) || '-'}"`,
      `"${ins.znAvgLo || calcAvg(ins.raLo) || '-'}"`,
      `"${ins.znAvgTotal || getOverallAvg(ins.raUp, ins.raLo)}"`,
      `"${formatPointsDisplay(ins.rzUp)}"`,
      `"${formatPointsDisplay(ins.rzLo)}"`,
      `"${ins.fluxAvgUp || calcAvg(ins.rzUp) || '-'}"`,
      `"${ins.fluxAvgLo || calcAvg(ins.rzLo) || '-'}"`,
      `"${ins.fluxAvgTotal || getOverallAvg(ins.rzUp, ins.rzLo)}"`,
      `"${formatPointsDisplay(ins.rtUp)}"`,
      `"${formatPointsDisplay(ins.rtLo)}"`,
      `"${ins.coverageAvgUp || calcAvg(ins.rtUp, 1) || '-'}"`,
      `"${ins.coverageAvgLo || calcAvg(ins.rtLo, 1) || '-'}"`,
      `"${ins.coverageAvgTotal || getOverallAvg(ins.rtUp, ins.rtLo, 1)}"`,
      `"${ins.status}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Xray_Inspection_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(isTh ? 'ส่งออกไฟล์ CSV เรียบร้อยแล้ว' : 'Exported CSV successfully');
  };

  const filteredInspections = useMemo(() => {
    if (!historySearchTerm) return inspections;
    const term = historySearchTerm.toLowerCase();
    return inspections.filter(i => 
      i.lotNumber.toLowerCase().includes(term) ||
      i.profileName.toLowerCase().includes(term) ||
      i.inspectorName.toLowerCase().includes(term)
    );
  }, [inspections, historySearchTerm]);

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>

      {/* Admin Verification Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            <div className="text-center space-y-2">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto ${
                isLight ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
              }`}>
                <Lock className="w-7 h-7" />
              </div>
              <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>Admin Verification</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh ? 'กรุณาระบุรหัสผ่านเพื่อตั้งค่า Profile Spec' : 'Enter admin password to manage profile specifications'}
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-2xl px-4 py-3 text-center text-lg font-mono focus:outline-none ${
                    isLight 
                      ? 'bg-slate-50 border-slate-300 text-indigo-600 focus:border-indigo-500' 
                      : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                  }`}
                  autoFocus
                />
                {adminAuthError && (
                  <p className="text-rose-500 text-xs font-semibold text-center mt-2">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่' : 'Incorrect password. Please try again.'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className={`flex-1 font-bold text-xs py-3 rounded-xl transition ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-md"
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
          <div className={`rounded-3xl shadow-2xl max-w-md w-full p-6 border space-y-4 ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
             <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/20 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
             </div>
             <div className="text-center">
               <h3 className={`text-lg font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{isTh ? 'ยืนยันการลบข้อมูล?' : 'Confirm Deletion'}</h3>
               <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{isTh ? 'คุณต้องการลบ' : 'Delete'} <b>{deleteConfirm.label}</b> {isTh ? 'ใช่หรือไม่?' : 'permanently?'}</p>
             </div>
             <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setDeleteConfirm(null)} 
                  className={`flex-1 py-2.5 font-bold rounded-xl text-xs transition ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {isTh ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'profile') handleDeleteProfile(deleteConfirm.id);
                    if (deleteConfirm.type === 'history') handleDeleteHistoryItem(deleteConfirm.id);
                  }} 
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  {isTh ? 'ยืนยันลบ' : 'Delete'}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b transition-colors ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 shadow-xs'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Return to QA Portal"
            >
              <ArrowLeft className="w-4 h-4 text-indigo-600" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-md ${
              isLight ? 'bg-indigo-600 text-white' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-600/20'
            }`}>
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}>
                  IPQA-03
                </span>
                <h1 className={`text-xl font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isTh ? 'ระบบตรวจวัดด้วยรังสีเอกซ์ (X-Ray Measurement)' : 'X-Ray Measurement System'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isTh 
                  ? 'วัดค่า Zn Weight, Flux Weight, Coverage % ขอบบน-ขอบล่าง พร้อมกราฟแนวโน้ม' 
                  : 'X-Ray Zn weight, Flux weight & Coverage % (Up/Lo) with sparklines & admin spec manager'}
              </p>
            </div>
          </div>
        </div>

        {/* Status indicator & Theme Toggle */}
        <div className="flex items-center gap-2.5">
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

          <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cloud Sync Active</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className={`flex space-x-2 border-b pb-2 overflow-x-auto ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
        <button
          onClick={() => setActiveTab('new-batch')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'new-batch'
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>{isTh ? '⚙️ Profile Spec' : 'Profile Spec'}</span>
          {isAdminAuthenticated && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 border ${
            activeTab === 'dashboard'
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
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
              ? isLight
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
              : isLight
                ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{isTh ? '📜 ประวัติ' : 'History Log'}</span>
          {inspections.length > 0 && (
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono border ${
              isLight ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-950 text-indigo-300 border-indigo-800'
            }`}>
              {inspections.length}
            </span>
          )}
        </button>
      </div>

      {/* Notifications */}
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
          {/* Header Metadata */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                {isTh ? '1. ข้อมูลการตรวจสอบหลัก (Header Metadata)' : '1. Header Metadata'}
              </h3>

              <div className="flex items-center gap-2">
                {profileStatus === 'found' ? (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SPEC LOADED: {headerInfo.profileName}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isTh ? 'ไม่พบ Spec ของ Profile นี้' : 'Profile Spec Not Found'}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name *
                </label>
                <select
                  value={headerInfo.profileName}
                  onChange={(e) => {
                    const pName = e.target.value;
                    if (!pName) {
                      setHeaderInfo(prev => ({
                        ...prev,
                        profileName: '',
                        requirementRaUp: '', requirementRaLo: '', 
                        requirementRzUp: '', requirementRzLo: '', 
                        requirementFluxMinUp: '', requirementFluxMinLo: '',
                        requirementFluxMaxUp: '', requirementFluxMaxLo: '',
                        requirementCoverageLimitUp: '', requirementCoverageLimitLo: '',
                        requirementSettingRaUp: '', requirementSettingRaLo: '',
                        requirementSettingRzUp: '', requirementSettingRzLo: '',
                        requirementSettingFluxMinUp: '', requirementSettingFluxMinLo: '',
                        requirementSettingFluxMaxUp: '', requirementSettingFluxMaxLo: '',
                        requirementSettingCoverageLimitUp: '', requirementSettingCoverageLimitLo: ''
                      }));
                      setProfileStatus('not-found');
                    } else {
                      const selected = savedProfiles.find(p => p.name === pName);
                      if (selected) selectProfile(selected);
                    }
                  }}
                  className="w-full bg-slate-950 border border-indigo-900/80 text-indigo-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-400 uppercase"
                >
                  <option value="">-- {isTh ? 'เลือก Profile' : 'Select Profile'} --</option>
                  {savedProfiles.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

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
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ / Inspector name' : 'Inspector name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Shift (กะ)
                </label>
                <input
                  list="xray-shift-options"
                  type="text"
                  name="shift"
                  value={headerInfo.shift}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Shift A, Shift B, Shift C..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <datalist id="xray-shift-options">
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
              </div>

              <ProcessSelector
                id="xray-header-process"
                label="Process"
                value={headerInfo.process || 'EXT'}
                onChange={(proc) => setHeaderInfo(prev => ({ ...prev, process: proc }))}
              />

              <MachineSelector
                id="xray-header-machine"
                label="Machine No."
                value={headerInfo.machine}
                onChange={(mac) => setHeaderInfo(prev => ({ ...prev, machine: mac }))}
              />

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

            {/* Dual Spec Summary: Setting vs Mass Production */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-amber-950/20 p-3 rounded-xl border border-amber-800/40 text-xs text-slate-300">
                <div className="flex items-center justify-between font-bold text-amber-400 mb-1.5 pb-1 border-b border-amber-800/30">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5" />
                    <span>⚙️ 1.1 {isTh ? 'สเปกช่วงปรับตั้ง (Setting Spec)' : 'Setting Spec [SET]'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    {isTh ? 'สำหรับ Coil ช่วงทดลอง/ตั้งเครื่อง' : 'For setup / trial coils'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-400 block text-[10px]">Zn Limit:</span> <strong className="text-amber-200">{headerInfo.requirementSettingRaUp ? `${headerInfo.requirementSettingRaUp} - ${headerInfo.requirementSettingRzUp} g/m²` : (headerInfo.requirementRaUp ? `${headerInfo.requirementRaUp} - ${headerInfo.requirementRzUp} g/m²` : '-')}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Flux Limit:</span> <strong className="text-amber-200">{headerInfo.requirementSettingFluxMinUp ? `${headerInfo.requirementSettingFluxMinUp} - ${headerInfo.requirementSettingFluxMaxUp} g/m²` : (headerInfo.requirementFluxMinUp ? `${headerInfo.requirementFluxMinUp} - ${headerInfo.requirementFluxMaxUp} g/m²` : '-')}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Coverage Limit:</span> <strong className="text-amber-200">{headerInfo.requirementSettingCoverageLimitUp ? `≥ ${headerInfo.requirementSettingCoverageLimitUp}%` : (headerInfo.requirementCoverageLimitUp ? `≥ ${headerInfo.requirementCoverageLimitUp}%` : '-')}</strong></div>
                </div>
              </div>

              <div className="bg-cyan-950/20 p-3 rounded-xl border border-cyan-800/40 text-xs text-slate-300">
                <div className="flex items-center justify-between font-bold text-cyan-400 mb-1.5 pb-1 border-b border-cyan-800/30">
                  <span className="flex items-center gap-1.5">
                    <Factory className="w-3.5 h-3.5" />
                    <span>🏭 1.2 {isTh ? 'สเปกช่วงผลิตจริง (Mass Production Spec)' : 'Mass Spec [MASS]'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                    {isTh ? 'สำหรับ Coil ช่วงผลิตต่อเนื่อง' : 'For mass production coils'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div><span className="text-slate-400 block text-[10px]">Zn Limit:</span> <strong className="text-cyan-200">{headerInfo.requirementRaUp ? `${headerInfo.requirementRaUp} - ${headerInfo.requirementRzUp} g/m²` : '-'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Flux Limit:</span> <strong className="text-cyan-200">{headerInfo.requirementFluxMinUp ? `${headerInfo.requirementFluxMinUp} - ${headerInfo.requirementFluxMaxUp} g/m²` : '-'}</strong></div>
                  <div><span className="text-slate-400 block text-[10px]">Coverage Limit:</span> <strong className="text-cyan-200">{headerInfo.requirementCoverageLimitUp ? `≥ ${headerInfo.requirementCoverageLimitUp}%` : '-'}</strong></div>
                </div>
              </div>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md overflow-hidden" ref={tableRef}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  {isTh ? '2. ตารางบันทึกค่ารังสีเอกซ์ (X-Ray Measurements Entry)' : '2. X-Ray Entry Table'}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                  title={isTh ? 'ล้างข้อมูลฟอร์มเริ่มต้นใหม่' : 'Reset Form'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTh ? '↺ ล้างฟอร์ม' : 'Reset'}</span>
                </button>

                {/* Option to Add 1, 3, or 5 sample rows for Coil No. */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold px-1.5 uppercase hidden sm:inline">
                    {isTh ? 'เพิ่ม Coil:' : 'Add Coil:'}
                  </span>

                  {/* Add 1 by 1 */}
                  <button
                    type="button"
                    onClick={() => addRows(1)}
                    title={isTh ? 'เพิ่มรายการชิ้นงานทีละ 1 Coil' : 'Add 1 Coil row'}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-sm shadow-indigo-600/20 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isTh ? '+ เพิ่มทีละ 1' : '+ 1 Coil'}</span>
                  </button>

                  {/* Add 3 at once */}
                  <button
                    type="button"
                    onClick={() => addRows(3)}
                    title={isTh ? 'เพิ่มชุดชิ้นงาน 3 Coil พร้อมกันในครั้งเดียว' : 'Add 3 Coil rows at once'}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm shadow-purple-600/20 border border-purple-500/30 active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-300" />
                    <span>{isTh ? '+ เพิ่มชุด 3 Coil' : '+ 3 Coils'}</span>
                  </button>

                  {/* Add 5 at once */}
                  <button
                    type="button"
                    onClick={() => addRows(5)}
                    title={isTh ? 'เพิ่มชุดชิ้นงาน 5 Coil พร้อมกันในครั้งเดียว' : 'Add 5 Coil rows at once'}
                    className="bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-sm shadow-teal-600/20 border border-teal-500/30 active:scale-95"
                  >
                    <Layers className="w-3.5 h-3.5 text-teal-300" />
                    <span>{isTh ? '+ เพิ่มชุด 5 Coil' : '+ 5 Coils'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={saveBatch}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{isTh ? '💾 บันทึกทั้งหมด' : 'Save Batch'}</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <form onKeyDown={handleKeyDown}>
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5 min-w-[280px]">
                        <div className="flex items-center justify-between gap-2">
                          <span>{isTh ? 'Checklist Stage / ข้อมูล Coil' : 'Stage / Coil Info'}</span>
                          <div className="flex items-center gap-1 font-mono">
                            <button
                              type="button"
                              onClick={() => setBatchItems(prev => prev.map(it => ({ ...it, stage: 'SETTING' })))}
                              className="px-1.5 py-0.5 text-[8.5px] rounded bg-amber-950/70 hover:bg-amber-900 text-amber-300 border border-amber-800/70 transition"
                              title={isTh ? 'เปลี่ยนทุกแถวเป็นช่วงตั้งเครื่อง (SETTING)' : 'Set all rows to SETTING'}
                            >
                              SET ทั้งหมด
                            </button>
                            <button
                              type="button"
                              onClick={() => setBatchItems(prev => prev.map(it => ({ ...it, stage: 'MASS' })))}
                              className="px-1.5 py-0.5 text-[8.5px] rounded bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/70 transition"
                              title={isTh ? 'เปลี่ยนทุกแถวเป็นช่วงผลิตจริง (MASS)' : 'Set all rows to MASS'}
                            >
                              MASS ทั้งหมด
                            </button>
                          </div>
                        </div>
                      </th>
                      
                      {/* Zn Weight Header */}
                      <th 
                        className="px-2 py-2 text-center bg-indigo-950/40 text-indigo-300 border-l border-slate-800" 
                        colSpan={znPointCount * 2 + (znPointCount > 1 ? 1 : 0)}
                      >
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">Zn weight (Up / Lo)</span>
                            <span className="text-[9px] text-indigo-400/80 font-normal font-mono">(g/m²)</span>
                          </div>

                          {/* + and - buttons on column header */}
                          <div className="flex items-center gap-1 bg-slate-950/90 px-1.5 py-0.5 rounded-lg border border-indigo-900/70 shadow-xs">
                            <button
                              type="button"
                              onClick={removeZnPoint}
                              disabled={znPointCount <= 1}
                              title={isTh ? 'ลดจุดวัด Zn weight (-1 จุด)' : 'Remove Zn weight point (-1 pt)'}
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs transition ${
                                znPointCount <= 1
                                  ? 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
                                  : 'text-rose-400 bg-rose-950/50 hover:bg-rose-900 hover:text-white border border-rose-800/60 active:scale-95'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span 
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200 min-w-[36px] text-center"
                              title={isTh ? `จำนวนจุดวัด Zn weight: ${znPointCount} จุด` : `Zn weight points: ${znPointCount}`}
                            >
                              {znPointCount} {isTh ? 'จุด' : 'Pts'}
                            </span>

                            <button
                              type="button"
                              onClick={addZnPoint}
                              title={isTh ? 'เพิ่มจุดวัด Zn weight (+1 จุด)' : 'Add Zn weight point (+1 pt)'}
                              className="w-5 h-5 rounded flex items-center justify-center font-bold text-xs text-emerald-400 bg-emerald-950/60 hover:bg-emerald-800 hover:text-white border border-emerald-700/60 transition active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>

                      {/* Flux Weight Header */}
                      <th 
                        className="px-2 py-2 text-center bg-emerald-950/40 text-emerald-300 border-l border-slate-800" 
                        colSpan={fluxPointCount * 2 + (fluxPointCount > 1 ? 1 : 0)}
                      >
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">Flux weight (Up / Lo)</span>
                            <span className="text-[9px] text-emerald-400/80 font-normal font-mono">(g/m²)</span>
                          </div>

                          {/* + and - buttons on column header */}
                          <div className="flex items-center gap-1 bg-slate-950/90 px-1.5 py-0.5 rounded-lg border border-emerald-900/70 shadow-xs">
                            <button
                              type="button"
                              onClick={removeFluxPoint}
                              disabled={fluxPointCount <= 1}
                              title={isTh ? 'ลดจุดวัด Flux weight (-1 จุด)' : 'Remove Flux weight point (-1 pt)'}
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs transition ${
                                fluxPointCount <= 1
                                  ? 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
                                  : 'text-rose-400 bg-rose-950/50 hover:bg-rose-900 hover:text-white border border-rose-800/60 active:scale-95'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span 
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-200 min-w-[36px] text-center"
                              title={isTh ? `จำนวนจุดวัด Flux weight: ${fluxPointCount} จุด` : `Flux weight points: ${fluxPointCount}`}
                            >
                              {fluxPointCount} {isTh ? 'จุด' : 'Pts'}
                            </span>

                            <button
                              type="button"
                              onClick={addFluxPoint}
                              title={isTh ? 'เพิ่มจุดวัด Flux weight (+1 จุด)' : 'Add Flux weight point (+1 pt)'}
                              className="w-5 h-5 rounded flex items-center justify-center font-bold text-xs text-emerald-400 bg-emerald-950/60 hover:bg-emerald-800 hover:text-white border border-emerald-700/60 transition active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>

                      {/* Coverage % Header */}
                      <th 
                        className="px-2 py-2 text-center bg-amber-950/40 text-amber-300 border-l border-slate-800" 
                        colSpan={coveragePointCount * 2 + (coveragePointCount > 1 ? 1 : 0)}
                      >
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">Coverage % (Up / Lo)</span>
                            <span className="text-[9px] text-amber-400/80 font-normal font-mono">(%)</span>
                          </div>

                          {/* + and - buttons on column header */}
                          <div className="flex items-center gap-1 bg-slate-950/90 px-1.5 py-0.5 rounded-lg border border-amber-900/70 shadow-xs">
                            <button
                              type="button"
                              onClick={removeCoveragePoint}
                              disabled={coveragePointCount <= 1}
                              title={isTh ? 'ลดจุดวัด Coverage % (-1 จุด)' : 'Remove Coverage point (-1 pt)'}
                              className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs transition ${
                                coveragePointCount <= 1
                                  ? 'text-slate-600 bg-slate-900/40 cursor-not-allowed'
                                  : 'text-rose-400 bg-rose-950/50 hover:bg-rose-900 hover:text-white border border-rose-800/60 active:scale-95'
                              }`}
                            >
                              <Minus className="w-3 h-3" />
                            </button>

                            <span 
                              className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-200 min-w-[36px] text-center"
                              title={isTh ? `จำนวนจุดวัด Coverage %: ${coveragePointCount} จุด` : `Coverage points: ${coveragePointCount}`}
                            >
                              {coveragePointCount} {isTh ? 'จุด' : 'Pts'}
                            </span>

                            <button
                              type="button"
                              onClick={addCoveragePoint}
                              title={isTh ? 'เพิ่มจุดวัด Coverage % (+1 จุด)' : 'Add Coverage point (+1 pt)'}
                              className="w-5 h-5 rounded flex items-center justify-center font-bold text-xs text-emerald-400 bg-emerald-950/60 hover:bg-emerald-800 hover:text-white border border-emerald-700/60 transition active:scale-95"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>

                      <th className="px-3 py-3 text-center border-l border-slate-800">Status</th>
                      <th className="px-3 py-3 text-center">Action</th>
                    </tr>

                    {/* Sub-header row for multi-points */}
                    <tr className="bg-slate-950/80 text-[9px] text-slate-400 border-b border-slate-800/80">
                      <th className="px-3 py-1"></th>

                      {/* Zn Sub-headers */}
                      {Array.from({ length: znPointCount }).map((_, pIdx) => (
                        <React.Fragment key={`zn-sub-${pIdx}`}>
                          <th className="px-1 py-1 text-center bg-indigo-950/20 text-indigo-300 border-l border-slate-800/60 font-mono">
                            {znPointCount > 1 ? `Pt.${pIdx + 1} Up` : 'Up'}
                          </th>
                          <th className="px-1 py-1 text-center bg-indigo-950/20 text-indigo-300 font-mono">
                            {znPointCount > 1 ? `Pt.${pIdx + 1} Lo` : 'Lo'}
                          </th>
                        </React.Fragment>
                      ))}
                      {znPointCount > 1 && (
                        <th className="px-2 py-1 text-center bg-indigo-950/30 text-indigo-200 border-l border-slate-800/60 font-mono">
                          Zn Avg
                        </th>
                      )}

                      {/* Flux Sub-headers */}
                      {Array.from({ length: fluxPointCount }).map((_, pIdx) => (
                        <React.Fragment key={`flux-sub-${pIdx}`}>
                          <th className="px-1 py-1 text-center bg-emerald-950/20 text-emerald-300 border-l border-slate-800/60 font-mono">
                            {fluxPointCount > 1 ? `Pt.${pIdx + 1} Up` : 'Up'}
                          </th>
                          <th className="px-1 py-1 text-center bg-emerald-950/20 text-emerald-300 font-mono">
                            {fluxPointCount > 1 ? `Pt.${pIdx + 1} Lo` : 'Lo'}
                          </th>
                        </React.Fragment>
                      ))}
                      {fluxPointCount > 1 && (
                        <th className="px-2 py-1 text-center bg-emerald-950/30 text-emerald-200 border-l border-slate-800/60 font-mono">
                          Flux Avg
                        </th>
                      )}

                      {/* Coverage Sub-headers */}
                      {Array.from({ length: coveragePointCount }).map((_, pIdx) => (
                        <React.Fragment key={`cov-sub-${pIdx}`}>
                          <th className="px-1 py-1 text-center bg-amber-950/20 text-amber-300 border-l border-slate-800/60 font-mono">
                            {coveragePointCount > 1 ? `Pt.${pIdx + 1} Up` : 'Up'}
                          </th>
                          <th className="px-1 py-1 text-center bg-amber-950/20 text-amber-300 font-mono">
                            {coveragePointCount > 1 ? `Pt.${pIdx + 1} Lo` : 'Lo'}
                          </th>
                        </React.Fragment>
                      ))}
                      {coveragePointCount > 1 && (
                        <th className="px-2 py-1 text-center bg-amber-950/30 text-amber-200 border-l border-slate-800/60 font-mono">
                          Cov Avg
                        </th>
                      )}

                      <th className="px-3 py-1 border-l border-slate-800"></th>
                      <th className="px-3 py-1"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {batchItems.map((item) => {
                      const currentStatus = judgeStatus(item);
                      const currentStage = item.stage || 'SETTING';
                      const activeSpec = getItemActiveSpecs(currentStage);

                      const rowZnAvgUp = calcAvg(item.raUp);
                      const rowZnAvgLo = calcAvg(item.raLo);
                      const rowZnOverall = getOverallAvg(item.raUp, item.raLo);

                      const rowFluxAvgUp = calcAvg(item.rzUp);
                      const rowFluxAvgLo = calcAvg(item.rzLo);
                      const rowFluxOverall = getOverallAvg(item.rzUp, item.rzLo);

                      const rowCovAvgUp = calcAvg(item.rtUp, 1);
                      const rowCovAvgLo = calcAvg(item.rtLo, 1);
                      const rowCovOverall = getOverallAvg(item.rtUp, item.rtLo, 1);

                      return (
                        <tr key={item.id} className="hover:bg-slate-950/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex gap-2 items-center">
                              {/* Stage Checklist Selector right at FRONT of Coil */}
                              <div className="flex flex-col gap-0.5 min-w-[78px]">
                                <div className="flex rounded-lg overflow-hidden border border-slate-800 bg-slate-950 p-0.5 shadow-xs">
                                  <button
                                    type="button"
                                    onClick={() => handleItemChange(item.id, 'stage', 'SETTING')}
                                    className={`flex-1 py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center transition ${
                                      currentStage === 'SETTING'
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'text-slate-500 hover:text-amber-300 hover:bg-slate-900'
                                    }`}
                                    title={isTh ? 'ช่วงปรับตั้งเครื่อง (ตัดสินด้วย Setting Spec)' : 'Setting stage (Judged by Setting Spec)'}
                                  >
                                    <span>SET</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleItemChange(item.id, 'stage', 'MASS')}
                                    className={`flex-1 py-1 px-1 text-[9px] font-bold rounded flex items-center justify-center transition ${
                                      currentStage === 'MASS'
                                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                                        : 'text-slate-500 hover:text-cyan-300 hover:bg-slate-900'
                                    }`}
                                    title={isTh ? 'ช่วงผลิตจริง (ตัดสินด้วย Mass Spec)' : 'Mass production stage (Judged by Mass Spec)'}
                                  >
                                    <span>MASS</span>
                                  </button>
                                </div>
                                <span className={`text-[8px] text-center font-mono font-semibold tracking-tight ${
                                  currentStage === 'SETTING' ? 'text-amber-400' : 'text-cyan-400'
                                }`}>
                                  {currentStage === 'SETTING' ? '⚙️ สเปกตั้ง' : '🏭 สเปกจริง'}
                                </span>
                              </div>

                              {/* Coil Inputs */}
                              <div className="flex-1 space-y-1">
                                <input 
                                  type="text" 
                                  placeholder="Coil No." 
                                  value={item.lotNumber} 
                                  onChange={(e) => handleItemChange(item.id, 'lotNumber', e.target.value)} 
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                                />
                                <div className="flex gap-1 items-center">
                                  <div className="relative w-28 flex items-center">
                                    <input 
                                      type="text" 
                                      list="xray-side-options"
                                      placeholder="Side (H/T)" 
                                      value={item.partId} 
                                      onChange={(e) => handleItemChange(item.id, 'partId', e.target.value.toUpperCase())} 
                                      className="w-full bg-slate-950 border border-slate-800 rounded-md px-1.5 py-0.5 pr-12 text-[10px] text-slate-200 font-bold uppercase focus:outline-none focus:border-indigo-500" 
                                    />
                                    <div className="absolute right-0.5 flex items-center gap-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleItemChange(item.id, 'partId', 'H')}
                                        title="Head (H)"
                                        className={`px-1 py-0.2 rounded text-[8px] font-bold border transition ${
                                          item.partId === 'H'
                                            ? 'bg-indigo-500 text-white border-indigo-400 font-black'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                        }`}
                                      >
                                        H
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleItemChange(item.id, 'partId', 'T')}
                                        title="Tail (T)"
                                        className={`px-1 py-0.2 rounded text-[8px] font-bold border transition ${
                                          item.partId === 'T'
                                            ? 'bg-purple-500 text-white border-purple-400 font-black'
                                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                                        }`}
                                      >
                                        T
                                      </button>
                                    </div>
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder="Process" 
                                    value={item.process} 
                                    onChange={(e) => handleItemChange(item.id, 'process', e.target.value)} 
                                    className="flex-1 bg-slate-950 border border-slate-800 rounded-md px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-indigo-500" 
                                  />
                                  <datalist id="xray-side-options">
                                    <option value="H">H (Head / หัวคอยล์)</option>
                                    <option value="T">T (Tail / ท้ายคอยล์)</option>
                                    <option value="UP">UP (Upper Side)</option>
                                    <option value="LO">LO (Lower Side)</option>
                                  </datalist>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Dynamic Multi-point Zn weight (Up / Lo) */}
                          {Array.from({ length: znPointCount }).map((_, pIdx) => {
                            const valUp = item.raUp[pIdx] || '';
                            const valLo = item.raLo[pIdx] || '';
                            const isPtUpFail = isOutOfSpec(valUp, activeSpec.znMinUp, activeSpec.znMaxUp);
                            const isPtLoFail = isOutOfSpec(valLo, activeSpec.znMinLo, activeSpec.znMaxLo);

                            return (
                              <React.Fragment key={`zn-pt-${pIdx}`}>
                                <td className="px-1 py-2.5 text-center bg-indigo-950/10 border-l border-slate-800/60">
                                  <input 
                                    type="number" step="0.01" 
                                    placeholder={`Up ${pIdx + 1}`} 
                                    value={valUp} 
                                    onChange={(e) => handleDynamicPointChange(item.id, 'raUp', pIdx, e.target.value)} 
                                    className={`w-14 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                      isPtUpFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                                    }`} 
                                  />
                                </td>
                                <td className="px-1 py-2.5 text-center bg-indigo-950/10">
                                  <input 
                                    type="number" step="0.01" 
                                    placeholder={`Lo ${pIdx + 1}`} 
                                    value={valLo} 
                                    onChange={(e) => handleDynamicPointChange(item.id, 'raLo', pIdx, e.target.value)} 
                                    className={`w-14 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                      isPtLoFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-indigo-300 focus:border-indigo-500'
                                    }`} 
                                  />
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Calculated Zn Summary Column when points > 1 */}
                          {znPointCount > 1 && (
                            <td className="px-2 py-2.5 text-center bg-indigo-950/20 border-l border-slate-800/60">
                              <div className="text-[10px] leading-tight space-y-0.5">
                                <div className="text-indigo-300 font-bold">
                                  U:{rowZnAvgUp || '-'} L:{rowZnAvgLo || '-'}
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  Avg: <span className="font-bold text-indigo-200">{rowZnOverall}</span>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Dynamic Multi-point Flux weight (Up / Lo) */}
                          {Array.from({ length: fluxPointCount }).map((_, pIdx) => {
                            const valUp = item.rzUp[pIdx] || '';
                            const valLo = item.rzLo[pIdx] || '';
                            const isPtUpFail = isOutOfSpec(valUp, activeSpec.fluxMinUp, activeSpec.fluxMaxUp);
                            const isPtLoFail = isOutOfSpec(valLo, activeSpec.fluxMinLo, activeSpec.fluxMaxLo);

                            return (
                              <React.Fragment key={`flux-pt-${pIdx}`}>
                                <td className="px-1 py-2.5 text-center bg-emerald-950/10 border-l border-slate-800/60">
                                  <input 
                                    type="number" step="0.01" 
                                    placeholder={`Up ${pIdx + 1}`} 
                                    value={valUp} 
                                    onChange={(e) => handleDynamicPointChange(item.id, 'rzUp', pIdx, e.target.value)} 
                                    className={`w-14 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                      isPtUpFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-300 focus:border-emerald-500'
                                    }`} 
                                  />
                                </td>
                                <td className="px-1 py-2.5 text-center bg-emerald-950/10">
                                  <input 
                                    type="number" step="0.01" 
                                    placeholder={`Lo ${pIdx + 1}`} 
                                    value={valLo} 
                                    onChange={(e) => handleDynamicPointChange(item.id, 'rzLo', pIdx, e.target.value)} 
                                    className={`w-14 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                      isPtLoFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-300 focus:border-emerald-500'
                                    }`} 
                                  />
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Calculated Flux Summary Column when points > 1 */}
                          {fluxPointCount > 1 && (
                            <td className="px-2 py-2.5 text-center bg-emerald-950/20 border-l border-slate-800/60">
                              <div className="text-[10px] leading-tight space-y-0.5">
                                <div className="text-emerald-300 font-bold">
                                  U:{rowFluxAvgUp || '-'} L:{rowFluxAvgLo || '-'}
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  Avg: <span className="font-bold text-emerald-200">{rowFluxOverall}</span>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Dynamic Multi-point Coverage % (Up / Lo) */}
                          {Array.from({ length: coveragePointCount }).map((_, pIdx) => {
                            const valUp = item.rtUp[pIdx] || '';
                            const valLo = item.rtLo[pIdx] || '';
                            const isPtUpFail = parseFloat(activeSpec.coverageUp) > 0 && valUp !== '' && parseFloat(valUp) < parseFloat(activeSpec.coverageUp);
                            const isPtLoFail = parseFloat(activeSpec.coverageLo) > 0 && valLo !== '' && parseFloat(valLo) < parseFloat(activeSpec.coverageLo);

                            return (
                              <React.Fragment key={`cov-pt-${pIdx}`}>
                                <td className="px-1 py-2.5 text-center bg-amber-950/10 border-l border-slate-800/60">
                                  <input 
                                    type="number" step="0.1" 
                                    placeholder={`Up ${pIdx + 1}`} 
                                    value={valUp} 
                                    onChange={(e) => handleDynamicPointChange(item.id, 'rtUp', pIdx, e.target.value)} 
                                    className={`w-14 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                      isPtUpFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-amber-300 focus:border-amber-500'
                                    }`} 
                                  />
                                </td>
                                <td className="px-1 py-2.5 text-center bg-amber-950/10">
                                  <input 
                                    type="number" step="0.1" 
                                    placeholder={`Lo ${pIdx + 1}`} 
                                    value={valLo} 
                                    onChange={(e) => handleDynamicPointChange(item.id, 'rtLo', pIdx, e.target.value)} 
                                    className={`w-14 text-center border rounded-lg px-1 py-1.5 font-mono font-bold text-xs outline-none ${
                                      isPtLoFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-amber-300 focus:border-amber-500'
                                    }`} 
                                  />
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Calculated Coverage Summary Column when points > 1 */}
                          {coveragePointCount > 1 && (
                            <td className="px-2 py-2.5 text-center bg-amber-950/20 border-l border-slate-800/60">
                              <div className="text-[10px] leading-tight space-y-0.5">
                                <div className="text-amber-300 font-bold">
                                  U:{rowCovAvgUp || '-'} L:{rowCovAvgLo || '-'}
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  Avg: <span className="font-bold text-amber-200">{rowCovOverall}%</span>
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center border-l border-slate-800">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                currentStatus === 'Pass' 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                  : currentStatus === 'Fail' 
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {currentStatus}
                              </span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                currentStage === 'SETTING'
                                  ? 'text-amber-400 bg-amber-950/70 border border-amber-800/50'
                                  : 'text-cyan-400 bg-cyan-950/70 border border-cyan-800/50'
                              }`}>
                                {currentStage === 'SETTING' ? 'SET SPEC' : 'MASS SPEC'}
                              </span>
                            </div>
                          </td>

                          {/* Delete Row */}
                          <td className="px-3 py-2.5 text-center">
                            <button 
                              type="button" 
                              onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))} 
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </form>
            </div>

            {/* Bottom Quick-Add Bar for Coil Rows */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  {isTh ? 'เพิ่ม Coil:' : 'Add Coil:'}
                </span>
                <button
                  type="button"
                  onClick={() => addRows(1)}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs px-2.5 py-1 rounded-lg transition flex items-center gap-1 active:scale-95"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isTh ? '+1 Coil' : '+1 Coil'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => addRows(3)}
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs px-2.5 py-1 rounded-lg transition flex items-center gap-1 active:scale-95"
                >
                  <Layers className="w-3 h-3 text-purple-400" />
                  <span>{isTh ? '+3 Coil' : '+3 Coils'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => addRows(5)}
                  className="bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold text-xs px-2.5 py-1 rounded-lg transition flex items-center gap-1 active:scale-95"
                >
                  <Layers className="w-3 h-3 text-teal-400" />
                  <span>{isTh ? '+5 Coil' : '+5 Coils'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  {isTh ? `รวมทั้งหมด: ${batchItems.length} รายการ` : `Total: ${batchItems.length} items`}
                </span>
                <button
                  type="button"
                  onClick={saveBatch}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs px-4 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isTh ? 'บันทึกทั้งหมด' : 'Save'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE SPEC SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                {isTh ? 'ตั้งค่า Spec มาตรฐาน (Profile Specifications)' : 'Profile Specifications Control'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh ? 'กำหนดขีดจำกัด Min/Max ของ Zn weight, Flux weight และ Coverage %' : 'Manage Min/Max specs for Zn weight, Flux weight & Coverage %'}
              </p>
            </div>

            <button
              onClick={handleSaveProfile}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Save className="w-4 h-4" />
              <span>{isTh ? 'บันทึก Profile Spec' : 'Save Profile Spec'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Saved Profiles List */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {isTh ? 'รายการ Profile Spec ในระบบ' : 'Saved Profile Specs'}
              </span>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {savedProfiles.map((p, idx) => (
                  <div
                    key={p.id || `${p.name}-${idx}`}
                    className={`p-3 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                      headerInfo.profileName === p.name 
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200' 
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                    onClick={() => selectProfile(p)}
                  >
                    <div>
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {p.settingRaUp && (
                          <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60 font-mono">
                            Dual Spec
                          </span>
                        )}
                      </div>
                      <div className="text-[9.5px] text-cyan-400 font-mono mt-0.5">
                        Mass: Zn {p.raUp}-{p.rzUp} | Flux {p.fluxMinUp}-{p.fluxMaxUp}
                      </div>
                      {p.settingRaUp && (
                        <div className="text-[9px] text-amber-400/90 font-mono">
                          Set: Zn {p.settingRaUp}-{p.settingRzUp} | Flux {p.settingFluxMinUp}-{p.settingFluxMaxUp}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'profile', id: p.name, label: p.name });
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Spec Editor */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    name="profileName"
                    value={headerInfo.profileName}
                    onChange={handleHeaderChange}
                    placeholder="e.g. Standard_ZnCoating"
                    className="w-full bg-slate-950 border border-slate-800 text-indigo-300 font-bold rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Stage Checklist / Toggle Selector */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    {isTh ? 'เลือกตั้งค่าสเปกตามช่วงผลิต' : 'Select Spec Target Stage'}
                  </label>
                  <div className="flex rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => setSpecEditStage('SETTING')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                        specEditStage === 'SETTING'
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
                      }`}
                    >
                      <span>⚙️ ช่วงปรับตั้ง (Setting)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSpecEditStage('MASS')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition ${
                        specEditStage === 'MASS'
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
                      }`}
                    >
                      <span>🏭 ช่วงผลิตจริง (Mass)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stage Notification Banner & Quick Copy Action */}
              <div className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                specEditStage === 'SETTING'
                  ? 'bg-amber-950/30 border-amber-800/60 text-amber-300'
                  : 'bg-cyan-950/30 border-cyan-800/60 text-cyan-300'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${specEditStage === 'SETTING' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-400 animate-pulse'}`} />
                  <span className="font-medium">
                    {specEditStage === 'SETTING' 
                      ? (isTh ? 'กำลังแก้ไขสเปกสำหรับช่วงปรับตั้งเครื่อง (Setting Spec) — จะใช้ตัดสิน Coil ที่เลือก SET' : 'Editing Setting Specs — Applied to judge coils set to SET')
                      : (isTh ? 'กำลังแก้ไขสเปกสำหรับช่วงผลิตจริง (Mass Spec) — จะใช้ตัดสิน Coil ที่เลือก MASS' : 'Editing Mass Specs — Applied to judge coils set to MASS')}
                  </span>
                </div>

                {specEditStage === 'SETTING' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderInfo(prev => ({
                        ...prev,
                        requirementSettingRaUp: prev.requirementRaUp,
                        requirementSettingRaLo: prev.requirementRaLo,
                        requirementSettingRzUp: prev.requirementRzUp,
                        requirementSettingRzLo: prev.requirementRzLo,
                        requirementSettingFluxMinUp: prev.requirementFluxMinUp,
                        requirementSettingFluxMinLo: prev.requirementFluxMinLo,
                        requirementSettingFluxMaxUp: prev.requirementFluxMaxUp,
                        requirementSettingFluxMaxLo: prev.requirementFluxMaxLo,
                        requirementSettingCoverageLimitUp: prev.requirementCoverageLimitUp,
                        requirementSettingCoverageLimitLo: prev.requirementCoverageLimitLo,
                      }));
                      showNotification(isTh ? 'คัดลอกค่าจาก Mass Spec ไปยัง Setting Spec เรียบร้อยแล้ว' : 'Copied Mass Specs to Setting Specs');
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-100 border border-amber-700/60 flex items-center gap-1 transition shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isTh ? 'คัดลอกจาก Mass Spec' : 'Copy from Mass Spec'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setHeaderInfo(prev => ({
                        ...prev,
                        requirementRaUp: prev.requirementSettingRaUp,
                        requirementRaLo: prev.requirementSettingRaLo,
                        requirementRzUp: prev.requirementSettingRzUp,
                        requirementRzLo: prev.requirementSettingRzLo,
                        requirementFluxMinUp: prev.requirementSettingFluxMinUp,
                        requirementFluxMinLo: prev.requirementSettingFluxMinLo,
                        requirementFluxMaxUp: prev.requirementSettingFluxMaxUp,
                        requirementFluxMaxLo: prev.requirementSettingFluxMaxLo,
                        requirementCoverageLimitUp: prev.requirementSettingCoverageLimitUp,
                        requirementCoverageLimitLo: prev.requirementSettingCoverageLimitLo,
                      }));
                      showNotification(isTh ? 'คัดลอกค่าจาก Setting Spec ไปยัง Mass Spec เรียบร้อยแล้ว' : 'Copied Setting Specs to Mass Specs');
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-900/60 hover:bg-cyan-800 text-cyan-100 border border-cyan-700/60 flex items-center gap-1 transition shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isTh ? 'คัดลอกจาก Setting Spec' : 'Copy from Setting Spec'}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upper Surface Spec */}
                <div className={`bg-slate-950 p-4 rounded-xl border space-y-3 ${
                  specEditStage === 'SETTING' ? 'border-amber-800/60' : 'border-slate-800'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase">
                      Upper Surface Specs
                    </h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      specEditStage === 'SETTING' 
                        ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {specEditStage === 'SETTING' ? 'SETTING SPEC' : 'MASS SPEC'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingRaUp' : 'requirementRaUp'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingRaUp : headerInfo.requirementRaUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingRzUp' : 'requirementRzUp'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingRzUp : headerInfo.requirementRzUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingFluxMinUp' : 'requirementFluxMinUp'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingFluxMinUp : headerInfo.requirementFluxMinUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingFluxMaxUp' : 'requirementFluxMaxUp'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingFluxMaxUp : headerInfo.requirementFluxMaxUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Coverage Limit Min (%)</label>
                      <input
                        type="number" step="0.1"
                        name={specEditStage === 'SETTING' ? 'requirementSettingCoverageLimitUp' : 'requirementCoverageLimitUp'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingCoverageLimitUp : headerInfo.requirementCoverageLimitUp}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Lower Surface Spec */}
                <div className={`bg-slate-950 p-4 rounded-xl border space-y-3 ${
                  specEditStage === 'SETTING' ? 'border-amber-800/60' : 'border-slate-800'
                }`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase">
                      Lower Surface Specs
                    </h4>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                      specEditStage === 'SETTING' 
                        ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                    }`}>
                      {specEditStage === 'SETTING' ? 'SETTING SPEC' : 'MASS SPEC'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingRaLo' : 'requirementRaLo'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingRaLo : headerInfo.requirementRaLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Zn weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingRzLo' : 'requirementRzLo'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingRzLo : headerInfo.requirementRzLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Min (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingFluxMinLo' : 'requirementFluxMinLo'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingFluxMinLo : headerInfo.requirementFluxMinLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Flux weight Max (g/m²)</label>
                      <input
                        type="number" step="0.01"
                        name={specEditStage === 'SETTING' ? 'requirementSettingFluxMaxLo' : 'requirementFluxMaxLo'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingFluxMaxLo : headerInfo.requirementFluxMaxLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-400 block mb-1">Coverage Limit Min (%)</label>
                      <input
                        type="number" step="0.1"
                        name={specEditStage === 'SETTING' ? 'requirementSettingCoverageLimitLo' : 'requirementCoverageLimitLo'}
                        value={specEditStage === 'SETTING' ? headerInfo.requirementSettingCoverageLimitLo : headerInfo.requirementCoverageLimitLo}
                        onChange={handleHeaderChange}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashboardStats ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isTh ? 'จำนวนการตรวจวัดทั้งหมด' : 'Total Inspected'}
                    </p>
                    <p className={`text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {dashboardStats.total} <span className="text-xs font-normal text-slate-500">Coils</span>
                    </p>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isTh ? 'ผ่านเกณฑ์มาตรฐาน' : 'Passed'}
                    </p>
                    <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                      {dashboardStats.passCount} <span className="text-xs font-normal text-slate-500">Coils</span>
                    </p>
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="p-3 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl border border-rose-500/20">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isTh ? 'ไม่ผ่านเกณฑ์' : 'Failed'}
                    </p>
                    <p className="text-2xl font-bold text-rose-500 dark:text-rose-400">
                      {dashboardStats.failCount} <span className="text-xs font-normal text-slate-500">Coils</span>
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 p-5 rounded-2xl border border-indigo-800 flex items-center gap-4 text-white shadow-sm">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Target className="w-6 h-6 text-indigo-300" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                      {isTh ? 'อัตราผ่านเกณฑ์' : 'Pass Rate'}
                    </p>
                    <p className="text-2xl font-bold text-white">{dashboardStats.passRatio}%</p>
                  </div>
                </div>
              </div>

              {/* Profile Summary Table */}
              <div className={`rounded-2xl border p-6 space-y-4 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                    isLight ? 'text-slate-900' : 'text-slate-300'
                  }`}>
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <span>{isTh ? 'สถิติภาพรวมแยกตาม Profile (คลิกเพื่อกรองดูกราฟ)' : 'Summary Statistics by Profile (Click to filter graph)'}</span>
                  </h3>
                  {trendFilterProfile !== 'All' && (
                    <button
                      onClick={() => setTrendFilterProfile('All')}
                      className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 font-semibold self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isTh ? `กำลังกรอง: ${trendFilterProfile} (คลิกเพื่อดูทุก Profile)` : `Filtered: ${trendFilterProfile} (Reset)`}</span>
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className={`uppercase text-[10px] font-bold border-b ${
                      isLight ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}>
                      <tr>
                        <th className="px-4 py-3">{isTh ? 'ชื่อ Profile' : 'Profile Name'}</th>
                        <th className="px-4 py-3 text-center">{isTh ? 'จำนวน Lot' : 'Total Lots'}</th>
                        <th className="px-4 py-3 text-center">Avg Zn (g/m²)</th>
                        <th className="px-4 py-3 text-center">Avg Flux (g/m²)</th>
                        <th className="px-4 py-3 text-center">Avg Coverage %</th>
                        <th className="px-4 py-3 text-center">Pass / Fail</th>
                        <th className="px-4 py-3 text-right">Pass Rate (%)</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y font-mono ${
                      isLight ? 'divide-slate-200' : 'divide-slate-800/80'
                    }`}>
                      {dashboardStats.profileSummaries.map((p, idx) => {
                        const isSelected = trendFilterProfile === p.name;
                        return (
                          <tr 
                            key={idx} 
                            onClick={() => setTrendFilterProfile(isSelected ? 'All' : p.name)}
                            title={isTh ? `คลิกเพื่อกรองดูกราฟเฉพาะ Profile ${p.name}` : `Click to filter graph for ${p.name}`}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? (isLight ? 'bg-indigo-50 font-semibold' : 'bg-indigo-950/40 font-semibold')
                                : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-950/40')
                            }`}
                          >
                            <td className={`px-4 py-3 font-sans font-bold flex items-center gap-2 ${
                              isSelected ? 'text-indigo-600 dark:text-indigo-400' : (isLight ? 'text-slate-900' : 'text-slate-200')
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-transparent'}`} />
                              {p.name}
                            </td>
                            <td className={`px-4 py-3 text-center ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{p.total}</td>
                            <td className="px-4 py-3 text-center text-indigo-600 dark:text-indigo-400 font-bold">{p.avgZn}</td>
                            <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">{p.avgFlux}</td>
                            <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-bold">{p.avgCov}%</td>
                            <td className="px-4 py-3 text-center font-sans">
                              <span className="text-emerald-500 font-bold">{p.pass}</span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span className="text-rose-500 font-bold">{p.fail}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-sans font-bold">
                              <span className={parseFloat(p.passRate) >= 95 ? 'text-emerald-500' : 'text-rose-500'}>
                                {p.passRate}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* UNIFIED TREND ANALYSIS SECTION: Full-width rows for Zn, Flux, Coverage */}
              <div className={`rounded-2xl border p-6 space-y-6 transition-colors ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
              }`}>
                {/* Header & Query Filter Controls */}
                <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-5 ${
                  isLight ? 'border-slate-200' : 'border-slate-800'
                }`}>
                  <div>
                    <h3 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? 'text-slate-900' : 'text-slate-200'
                    }`}>
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span>{isTh ? 'การวิเคราะห์แนวโน้มค่าการเคลือบ X-Ray (X-Ray Coating Trend Analysis)' : 'X-Ray Coating Trend Analysis'}</span>
                    </h3>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {trendFilterProfile === 'All' 
                        ? (isTh ? '📊 กำลังแสดงภาพรวมทุก Profile รวมกัน (แยกตามแถวค่าทดสอบด้านล่าง)' : '📊 Showing unified overview of all profiles across dedicated parameter rows')
                        : (isTh ? `🎯 กรองเฉพาะ Profile: ${trendFilterProfile} (พร้อมเส้นกำหนดมาตรฐาน Spec Min / Max)` : `🎯 Filtered by Profile: ${trendFilterProfile} (with Spec Min / Max limits)`)}
                      {trendFilterMonth !== 'All' && ` • เดือน: ${trendFilterMonth}`}
                      {` (${filteredTrendData.length} ${isTh ? 'ตัวอย่างที่นำมาพล็อตกราฟ' : 'samples plotted'})`}
                    </p>
                  </div>

                  {/* Query Toolbar */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Profile Query Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={trendFilterProfile}
                        onChange={(e) => setTrendFilterProfile(e.target.value)}
                        className={`text-xs font-semibold rounded-xl px-3 py-1.5 border transition focus:outline-none focus:border-indigo-500 ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-800'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <option value="All">{isTh ? 'ทุก Profile (ภาพรวม)' : 'All Profiles (Overview)'}</option>
                        {availableProfiles.filter(p => p !== 'All').map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    {/* Month Query Dropdown */}
                    <div>
                      <select
                        value={trendFilterMonth}
                        onChange={(e) => setTrendFilterMonth(e.target.value)}
                        className={`text-xs font-semibold rounded-xl px-3 py-1.5 border transition focus:outline-none focus:border-indigo-500 ${
                          isLight
                            ? 'bg-slate-50 border-slate-300 text-slate-800'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        <option value="All">{isTh ? 'ทุกเดือน (All Months)' : 'All Months'}</option>
                        {availableMonths.filter(m => m !== 'All').map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>

                    {/* Reset Button */}
                    {(trendFilterProfile !== 'All' || trendFilterMonth !== 'All') && (
                      <button
                        onClick={() => {
                          setTrendFilterProfile('All');
                          setTrendFilterMonth('All');
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-semibold transition ${
                          isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                        title={isTh ? 'ล้างตัวกรองทั้งหมด' : 'Reset all filters'}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{isTh ? 'รีเซ็ต' : 'Reset'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Profile Filter Pills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{isTh ? 'เลือก Profile ด่วน:' : 'Quick Profile Select:'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {isTh ? 'เลือกเพื่อดู Spec Limit และแนวโน้มเฉพาะ Profile' : 'Select to inspect profile limits'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
                    <button
                      onClick={() => setTrendFilterProfile('All')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition shrink-0 ${
                        trendFilterProfile === 'All'
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800')
                      }`}
                    >
                      {isTh ? '🌐 ภาพรวมทุก Profile' : '🌐 All Profiles Overview'}
                    </button>

                    {availableProfiles.filter(p => p !== 'All').map(p => (
                      <button
                        key={p}
                        onClick={() => setTrendFilterProfile(p)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition shrink-0 ${
                          trendFilterProfile === p
                            ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                            : (isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800')
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Profile Spec Banner when queried */}
                {activeTrendSpec && (
                  <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isLight 
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' 
                      : 'bg-indigo-950/30 border-indigo-800/60 text-indigo-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-500/20 text-indigo-500 rounded-lg">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-indigo-600 dark:text-indigo-300">
                          {activeTrendSpec.name} {isTh ? 'มาตรฐานที่กำหนด (Specification Limits)' : 'Specification Limits'}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isTh ? 'เส้นประในแต่ละกราฟด้านล่างแสดงขอบเขตมาตรฐานควบคุมของ Profile นี้' : 'Dashed lines in the charts below mark the spec limits for this profile'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      {/* Zn Spec */}
                      <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                        isLight ? 'bg-white border-indigo-200 text-indigo-700' : 'bg-slate-900 border-indigo-800 text-indigo-300'
                      }`}>
                        Zn: {activeTrendSpec.raUp || activeTrendSpec.raLo || '-'} ~ {activeTrendSpec.rzUp || activeTrendSpec.rzLo || '-'} g/m²
                      </span>
                      {/* Flux Spec */}
                      <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                        isLight ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-slate-900 border-emerald-800 text-emerald-300'
                      }`}>
                        Flux: {activeTrendSpec.fluxMinUp || activeTrendSpec.fluxMinLo || '-'} ~ {activeTrendSpec.fluxMaxUp || activeTrendSpec.fluxMaxLo || '-'} g/m²
                      </span>
                      {/* Coverage Spec */}
                      <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                        isLight ? 'bg-white border-amber-200 text-amber-700' : 'bg-slate-900 border-amber-800 text-amber-300'
                      }`}>
                        Cov: ≥ {activeTrendSpec.coverageLimitUp || activeTrendSpec.coverageLimitLo || '-'}%
                      </span>
                    </div>
                  </div>
                )}

                {/* 3 DEDICATED FULL-WIDTH PARAMETER ROWS */}
                <div className="space-y-5">
                  {/* Row 1: Zn Weight (g/m²) */}
                  <XRayParameterRowCard
                    paramKey="zn"
                    title="Zn Weight"
                    thaiTitle="ความหนาชั้นเคลือบสังกะสี (Zinc Coating Weight - Zn)"
                    descriptionTh="น้ำหนักชั้นเคลือบสังกะสีเฉลี่ยทั้งด้านบน (Up) และด้านล่าง (Lo)"
                    descriptionEn="Average zinc coating weight on upper and lower surfaces"
                    color="#818cf8"
                    data={filteredTrendData}
                    unit="g/m²"
                    specMin={activeTrendSpec ? (parseFloat(activeTrendSpec.raUp || activeTrendSpec.raLo || '0') || null) : null}
                    specMax={activeTrendSpec ? (parseFloat(activeTrendSpec.rzUp || activeTrendSpec.rzLo || '0') || null) : null}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* Row 2: Flux Weight (g/m²) */}
                  <XRayParameterRowCard
                    paramKey="flux"
                    title="Flux Weight"
                    thaiTitle="ปริมาณสารเคลือบฟลักซ์ (Flux Coating Weight - Flux)"
                    descriptionTh="น้ำหนักฟลักซ์เฉลี่ยทั้งด้านบนและด้านล่างในการเตรียมผิวเชื่อมประสาน"
                    descriptionEn="Average flux coating weight on surfaces"
                    color="#34d399"
                    data={filteredTrendData}
                    unit="g/m²"
                    specMin={activeTrendSpec ? (parseFloat(activeTrendSpec.fluxMinUp || activeTrendSpec.fluxMinLo || '0') || null) : null}
                    specMax={activeTrendSpec ? (parseFloat(activeTrendSpec.fluxMaxUp || activeTrendSpec.fluxMaxLo || '0') || null) : null}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* Row 3: Coverage % (%) */}
                  <XRayParameterRowCard
                    paramKey="coverage"
                    title="Coverage %"
                    thaiTitle="เปอร์เซ็นต์ความครอบคลุมผิว (Coating Coverage Percentage)"
                    descriptionTh="สัดส่วนพื้นที่ผิวที่ผ่านการเคลือบอย่างสมบูรณ์เทียบกับพื้นที่ทั้งหมด (Surface Coverage)"
                    descriptionEn="Percentage of surface area covered by coating"
                    color="#fbbf24"
                    data={filteredTrendData}
                    unit="%"
                    specMin={activeTrendSpec ? (parseFloat(activeTrendSpec.coverageLimitUp || activeTrendSpec.coverageLimitLo || '0') || null) : null}
                    specMax={null}
                    isLight={isLight}
                    isTh={isTh}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={`py-20 text-center rounded-2xl border space-y-2 ${
              isLight ? 'bg-white border-slate-200 text-slate-500 shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}>
              <PieChart className="w-12 h-12 mx-auto opacity-30" />
              <p className="text-xs font-semibold">{isTh ? 'ยังไม่มีข้อมูลการตรวจวัด' : 'No inspection records found'}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HISTORY & EXPORT */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {isTh ? 'ประวัติการตรวจวัด X-Ray (Cloud Sync)' : 'Inspection History'}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder={isTh ? 'ค้นหา Coil / Profile...' : 'Search Coil / Profile...'}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-indigo-500 w-48"
                />
              </div>

              <button
                onClick={exportToExcel}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Machine</th>
                  <th className="px-3 py-3">Coil / Side / Process</th>
                  <th className="px-3 py-3">Profile Spec</th>
                  <th className="px-3 py-3 text-center">Zn Wt (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Flux Wt (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Coverage (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3">Inspector</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono">
                {filteredInspections.map((ins, idx) => (
                  <tr key={ins.id || idx} className="hover:bg-slate-950/50 transition-colors">
                    <td className="px-3 py-3 text-slate-400 text-[11px]">{ins.timestamp}</td>
                    <td className="px-3 py-3 font-semibold text-indigo-400">{ins.machine || '-'}</td>
                    <td className="px-3 py-3 font-sans font-bold text-slate-200">
                      {ins.lotNumber} / <span className="text-indigo-300">{ins.partId}</span> / <span className="text-slate-400">{ins.process}</span>
                    </td>
                    <td className="px-3 py-3 font-sans text-slate-300">{ins.profileName}</td>
                    <td className="px-3 py-3 text-center text-indigo-300">
                      <div>
                        {formatPointsDisplay(ins.raUp)} / {formatPointsDisplay(ins.raLo)}
                      </div>
                      {(ins.znAvgTotal || ins.znAvgUp || ins.znAvgLo || (Array.isArray(ins.raUp) && ins.raUp.length > 1) || (Array.isArray(ins.raLo) && ins.raLo.length > 1)) && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Avg: <span className="text-indigo-200 font-bold">{ins.znAvgTotal || getOverallAvg(ins.raUp, ins.raLo)}</span> (U:{ins.znAvgUp || calcAvg(ins.raUp) || '-'} L:{ins.znAvgLo || calcAvg(ins.raLo) || '-'})
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-emerald-300">
                      <div>
                        {formatPointsDisplay(ins.rzUp)} / {formatPointsDisplay(ins.rzLo)}
                      </div>
                      {(ins.fluxAvgTotal || ins.fluxAvgUp || ins.fluxAvgLo || (Array.isArray(ins.rzUp) && ins.rzUp.length > 1) || (Array.isArray(ins.rzLo) && ins.rzLo.length > 1)) && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Avg: <span className="text-emerald-200 font-bold">{ins.fluxAvgTotal || getOverallAvg(ins.rzUp, ins.rzLo)}</span> (U:{ins.fluxAvgUp || calcAvg(ins.rzUp) || '-'} L:{ins.fluxAvgLo || calcAvg(ins.rzLo) || '-'})
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-amber-300">
                      <div>
                        {formatPointsDisplay(ins.rtUp)}% / {formatPointsDisplay(ins.rtLo)}%
                      </div>
                      {(ins.coverageAvgTotal || ins.coverageAvgUp || ins.coverageAvgLo || (Array.isArray(ins.rtUp) && ins.rtUp.length > 1) || (Array.isArray(ins.rtLo) && ins.rtLo.length > 1)) && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Avg: <span className="text-amber-200 font-bold">{ins.coverageAvgTotal || getOverallAvg(ins.rtUp, ins.rtLo, 1)}%</span> (U:{ins.coverageAvgUp || calcAvg(ins.rtUp, 1) || '-'}% L:{ins.coverageAvgLo || calcAvg(ins.rtLo, 1) || '-'}%)
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-sans">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        ins.status === 'Pass' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {ins.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-sans text-slate-400">
                      <div>{ins.inspectorName}</div>
                      {ins.shift && <div className="text-[10px] text-slate-500">Shift: {ins.shift}</div>}
                    </td>
                    <td className="px-3 py-3 text-center">
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
                          onClick={() => setDeleteConfirm({ type: 'history', id: ins.id || String(idx), label: ins.lotNumber })}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                  ? 'กรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไขรายการตรวจวัด IPQA-03' 
                  : 'Enter admin password to edit IPQA-03 record'}
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
                    {isTh ? 'แก้ไขข้อมูลการตรวจวัดรังสีเอกซ์ (IPQA-03)' : 'Edit X-Ray Measurement Record'}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Coil: {editingHistoryItem.lotNumber} | ID: {editingHistoryItem.id}
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Coil Number</label>
                  <input
                    type="text"
                    value={editingHistoryItem.lotNumber || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, lotNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Side / Part ID (H/T)</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingHistoryItem({ ...editingHistoryItem, partId: 'H' })}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${editingHistoryItem.partId === 'H' ? 'bg-indigo-500 text-white border-indigo-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                      >
                        H
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingHistoryItem({ ...editingHistoryItem, partId: 'T' })}
                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${editingHistoryItem.partId === 'T' ? 'bg-purple-500 text-white border-purple-400' : 'bg-slate-900 text-slate-400 border-slate-800'}`}
                      >
                        T
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    list="xray-side-options"
                    value={editingHistoryItem.partId || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, partId: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Profile Spec</label>
                  <input
                    type="text"
                    value={editingHistoryItem.profileName || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, profileName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <MachineSelector
                  id="edit-xray-machine"
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
                    list="edit-xray-shift-options"
                    type="text"
                    placeholder="e.g. Shift A, Shift B, Shift C..."
                    value={editingHistoryItem.shift || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, shift: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="edit-xray-shift-options">
                    <option value="Shift A" />
                    <option value="Shift B" />
                    <option value="Shift C" />
                  </datalist>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Status</label>
                  <select
                    value={editingHistoryItem.status}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, status: e.target.value as 'Pass' | 'Fail' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">X-Ray Measured Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Zn Wt Up (g/m²)</label>
                    <input
                      type="text"
                      placeholder="e.g. 45.2, 46.1"
                      value={Array.isArray(editingHistoryItem.raUp) ? editingHistoryItem.raUp.join(', ') : (editingHistoryItem.raUp || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(',')) {
                          setEditingHistoryItem({ ...editingHistoryItem, raUp: val.split(',').map(s => s.trim()) });
                        } else {
                          setEditingHistoryItem({ ...editingHistoryItem, raUp: val });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Zn Wt Lo (g/m²)</label>
                    <input
                      type="text"
                      placeholder="e.g. 44.8, 45.5"
                      value={Array.isArray(editingHistoryItem.raLo) ? editingHistoryItem.raLo.join(', ') : (editingHistoryItem.raLo || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(',')) {
                          setEditingHistoryItem({ ...editingHistoryItem, raLo: val.split(',').map(s => s.trim()) });
                        } else {
                          setEditingHistoryItem({ ...editingHistoryItem, raLo: val });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Flux Wt Up (g/m²)</label>
                    <input
                      type="text"
                      placeholder="e.g. 0.45, 0.48"
                      value={Array.isArray(editingHistoryItem.rzUp) ? editingHistoryItem.rzUp.join(', ') : (editingHistoryItem.rzUp || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(',')) {
                          setEditingHistoryItem({ ...editingHistoryItem, rzUp: val.split(',').map(s => s.trim()) });
                        } else {
                          setEditingHistoryItem({ ...editingHistoryItem, rzUp: val });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Flux Wt Lo (g/m²)</label>
                    <input
                      type="text"
                      placeholder="e.g. 0.42, 0.46"
                      value={Array.isArray(editingHistoryItem.rzLo) ? editingHistoryItem.rzLo.join(', ') : (editingHistoryItem.rzLo || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(',')) {
                          setEditingHistoryItem({ ...editingHistoryItem, rzLo: val.split(',').map(s => s.trim()) });
                        } else {
                          setEditingHistoryItem({ ...editingHistoryItem, rzLo: val });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coverage Up (%)</label>
                    <input
                      type="text"
                      placeholder="e.g. 98.5, 99.0"
                      value={Array.isArray(editingHistoryItem.rtUp) ? editingHistoryItem.rtUp.join(', ') : (editingHistoryItem.rtUp || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(',')) {
                          setEditingHistoryItem({ ...editingHistoryItem, rtUp: val.split(',').map(s => s.trim()) });
                        } else {
                          setEditingHistoryItem({ ...editingHistoryItem, rtUp: val });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coverage Lo (%)</label>
                    <input
                      type="text"
                      placeholder="e.g. 97.0, 98.2"
                      value={Array.isArray(editingHistoryItem.rtLo) ? editingHistoryItem.rtLo.join(', ') : (editingHistoryItem.rtLo || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.includes(',')) {
                          setEditingHistoryItem({ ...editingHistoryItem, rtLo: val.split(',').map(s => s.trim()) });
                        } else {
                          setEditingHistoryItem({ ...editingHistoryItem, rtLo: val });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500"
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
