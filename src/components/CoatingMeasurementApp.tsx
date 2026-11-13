import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardCheck, 
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
  Download,
  Plus,
  Search,
  Settings,
  Layers,
  FileSpreadsheet,
  Edit3,
  X,
  RotateCcw,
  HelpCircle,
  Calculator,
  Moon,
  Sun,
  TrendingUp,
  Target,
  Filter,
  PieChart
} from 'lucide-react';

import { 
  CoatingProfileSpec, 
  CoatingInspectionRecord, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { useCloudState } from '../services/firestoreSync';
import { InspectorDatalist, saveRecordedInspector } from '../utils/inspectorStorage';
import { ProcessSelector, MachineSelector } from './common/ProcessMachineSelector';
import { STANDARD_PROCESS_OPTIONS, STANDARD_MACHINE_OPTIONS } from '../constants/processOptions';

interface CoatingMeasurementAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

// Trend Data Point interface for Coating
export interface CoatingTrendPointItem {
  index: number;
  id: string;
  date: string;
  timestamp?: string;
  lotNumber: string; // Coil No.
  profileName: string;
  process?: string;
  status: string;
  inspector?: string;
  coatingWt: number;
  coatingUp: number;
  coatingLo: number;
  binderPercent: number;
  amountOfBinder?: number;
}

// Full-width parameter row chart component (Coating WT, Binder %)
interface CoatingParameterRowCardProps {
  paramKey: 'coatingWt' | 'binderPercent';
  title: string;
  thaiTitle: string;
  descriptionTh: string;
  descriptionEn: string;
  color: string;
  data: CoatingTrendPointItem[];
  unit: string;
  specMin?: number | null;
  specMax?: number | null;
  isLight: boolean;
  isTh: boolean;
}

const CoatingParameterRowCard: React.FC<CoatingParameterRowCardProps> = ({
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
  const padding = { top: 25, right: 35, bottom: 45, left: 60 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Calculate dynamic Y domain including spec limits with margin
  const values = validPoints.map(p => p.value);
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
            {(specMin !== null || specMax !== null) && (
              <span className="ml-2 font-mono text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                [Spec: {specMin !== null ? `Min ${specMin}` : ''} {specMax !== null ? `Max ${specMax}` : ''} {unit}]
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
              {count > 0 ? `${min.toFixed(2)} / ${max.toFixed(2)}` : '-'}
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
                <linearGradient id={`coat-grad-${paramKey}`} x1="0" y1="0" x2="0" y2="1">
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
                    {gl.val.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* SPEC MIN LIMIT LINE (Dashed Red/Orange) */}
              {specMin !== null && specMin !== undefined && (
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
                  fill={`url(#coat-grad-${paramKey})`}
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
                    hoveredPoint.status === 'Pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {hoveredPoint.status}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coil No:</span>
                    <span className="font-bold text-white">{hoveredPoint.lotNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profile:</span>
                    <span className="text-indigo-300 font-semibold">{hoveredPoint.profileName}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-1">
                    <span className="text-slate-300 font-sans font-bold">{title}:</span>
                    <span className="font-bold text-sm" style={{ color }}>
                      {hoveredPoint.value.toFixed(2)} {unit}
                    </span>
                  </div>
                  {paramKey === 'coatingWt' && (hoveredPoint.coatingUp > 0 || hoveredPoint.coatingLo > 0) && (
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Side Up / Lo:</span>
                      <span className="text-slate-200">{hoveredPoint.coatingUp || '-'} / {hoveredPoint.coatingLo || '-'} g/m²</span>
                    </div>
                  )}
                  {(specMin !== null || specMax !== null) && (
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
                    <span>Insp: {hoveredPoint.inspector}</span>
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

const DEFAULT_PROFILES: CoatingProfileSpec[] = [
  { 
    name: 'Standard_Coating_01', 
    calcMode: 'calculated',
    widthMin: '1000', widthMax: '1020',
    heightMin: '0.40', heightMax: '0.60',
    binderMin: '5.00', binderMax: '10.00',
    amtBinderMin: '1.00', amtBinderMax: '3.00',
    coatingWtMinUp: '10.0', coatingWtMaxUp: '20.0',
    pencilHardnessUp: '2H',
    coatingWtMinLo: '10.0', coatingWtMaxLo: '20.0',
    pencilHardnessLo: '2H',
    scothMagicTapeMax: '0.50',
    scothMagicTapeMaxUp: '0.50',
    scothMagicTapeMaxLo: '0.50',
    scothMagicTape: '0.50',
    scothMagicTapeUp: '0.50',
    scothMagicTapeLo: '0.50',
    stdLength: '200',
    stdCoatingWidth: '100'
  },
  {
    name: 'HEAVY-COATING-PRO',
    calcMode: 'calculated',
    widthMin: '1200', widthMax: '1220',
    heightMin: '0.50', heightMax: '0.80',
    binderMin: '8.00', binderMax: '15.00',
    amtBinderMin: '2.00', amtBinderMax: '5.00',
    coatingWtMinUp: '15.0', coatingWtMaxUp: '30.0',
    pencilHardnessUp: '3H',
    coatingWtMinLo: '15.0', coatingWtMaxLo: '30.0',
    pencilHardnessLo: '3H',
    scothMagicTapeMax: '0.50',
    scothMagicTapeMaxUp: '0.50',
    scothMagicTapeMaxLo: '0.50',
    scothMagicTape: '0.50',
    scothMagicTapeUp: '0.50',
    scothMagicTapeLo: '0.50',
    stdLength: '200',
    stdCoatingWidth: '100'
  },
  {
    name: 'Coating_Manual_Standard',
    calcMode: 'manual',
    widthMin: '1000', widthMax: '1020',
    heightMin: '0.40', heightMax: '0.60',
    binderMin: '0.00', binderMax: '0.20',
    amtBinderMin: '', amtBinderMax: '',
    coatingWtMinUp: '10.0', coatingWtMaxUp: '20.0',
    pencilHardnessUp: '2H',
    coatingWtMinLo: '10.0', coatingWtMaxLo: '20.0',
    pencilHardnessLo: '2H',
    scothMagicTapeMax: '0.50',
    scothMagicTapeMaxUp: '0.50',
    scothMagicTapeMaxLo: '0.50',
    scothMagicTape: '0.50',
    scothMagicTapeUp: '0.50',
    scothMagicTapeLo: '0.50',
    stdLength: '200',
    stdCoatingWidth: '100'
  }
];

const INITIAL_INSPECTIONS: CoatingInspectionRecord[] = [
  {
    id: 'rec-coat-001',
    lotNumber: 'COIL-2026-C101',
    partId: 'UP-SIDE',
    mixingLot: 'MIX-2026-B08',
    width: '100',
    heightLeft: '0.48',
    heightRight: '0.50',
    length: '200',
    coatingWidth: '100',
    coatingArea: '0.020000',
    totalWeight: '1.2500',
    weightAfterDryer: '1.1800',
    wtWithoutCoatUp: '1.0200',
    wtWithoutCoatLo: '0.8800',
    binderWt: '0.0700',
    totalCoatBinderWt: '0.3700',
    raUp: '8.00',
    raLo: '7.00',
    binderPercent: '18.92',
    amountOfBinder: '7.00',
    rtUp: '2H',
    rtLo: '2H',
    scothMagicTape: '0.12',
    scothMagicTapeUp: '0.12',
    scothMagicTapeLo: '0.10',
    status: 'Pass',
    profileName: 'Standard_Coating_01',
    inspectorName: 'Somchai P.',
    machine: 'COAT-LINE-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 09:30:00'
  },
  {
    id: 'rec-coat-002',
    lotNumber: 'COIL-2026-C102',
    partId: 'LO-SIDE',
    mixingLot: 'MIX-2026-B08',
    width: '100',
    heightLeft: '0.52',
    heightRight: '0.51',
    length: '200',
    coatingWidth: '100',
    coatingArea: '0.020000',
    totalWeight: '1.1000',
    weightAfterDryer: '1.0800',
    wtWithoutCoatUp: '1.0500',
    wtWithoutCoatLo: '0.9200',
    binderWt: '0.0200',
    totalCoatBinderWt: '0.1800',
    raUp: '1.50',
    raLo: '6.50',
    binderPercent: '11.11',
    amountOfBinder: '2.00',
    rtUp: '2H',
    rtLo: '2H',
    scothMagicTape: '0.15',
    scothMagicTapeUp: '0.15',
    scothMagicTapeLo: '0.14',
    status: 'Fail',
    remarks: 'Coating Wt Up below spec min (10.0 g/m²)',
    profileName: 'Standard_Coating_01',
    inspectorName: 'Somchai P.',
    machine: 'COAT-LINE-01',
    date: '2026-08-05',
    timestamp: '05/08/2026, 11:15:00'
  }
];

export const CoatingMeasurementApp: React.FC<CoatingMeasurementAppProps> = ({
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
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  // Saved Profiles & Inspections with Real-time Cloud Sync
  const [savedProfiles, setSavedProfiles] = useCloudState<CoatingProfileSpec[]>('coating_qc_profiles', DEFAULT_PROFILES);
  const [inspections, setInspections] = useCloudState<CoatingInspectionRecord[]>('coating_qc_inspections', INITIAL_INSPECTIONS);

  // Automatically include built-in profiles (such as Coating_Manual_Standard) into profile list
  const effectiveProfiles = useMemo(() => {
    const existingNames = new Set(savedProfiles.map(p => p.name.toLowerCase()));
    const missing = DEFAULT_PROFILES.filter(dp => !existingNames.has(dp.name.toLowerCase()));
    if (missing.length === 0) return savedProfiles;
    return [...savedProfiles, ...missing];
  }, [savedProfiles]);

  // Auth State for Settings
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState(false);

  // Header Info State (Clean initial state)
  const [headerInfo, setHeaderInfo] = useState({
    inspectorName: '',
    shift: '',
    process: 'COT',
    machine: '',
    mixingLot: '',
    date: new Date().toISOString().split('T')[0],
    profileName: '',
    calcMode: 'calculated' as 'calculated' | 'manual', // 'calculated' = Calculated Coating & Binder Metrics, 'manual' = Coating Manual
    reqWidthMin: '', reqWidthMax: '',
    reqHeightMin: '', reqHeightMax: '',
    reqBinderMin: '', reqBinderMax: '',
    reqAmtBinderMin: '', reqAmtBinderMax: '',
    reqCoatingWtMinUp: '', reqCoatingWtMaxUp: '',
    reqPencilHardnessUp: '',
    reqCoatingWtMinLo: '', reqCoatingWtMaxLo: '',
    reqPencilHardnessLo: '',
    reqScothMagicTapeMax: '0.50',
    reqScothMagicTapeMaxUp: '0.50',
    reqScothMagicTapeMaxLo: '0.50',
    reqScothMagicTape: '0.50',
    reqScothMagicTapeUp: '0.50',
    reqScothMagicTapeLo: '0.50',
    stdLength: '200',
    stdCoatingWidth: '100'
  });

  const [profileStatus, setProfileStatus] = useState<'found' | 'not-found'>('not-found');

  // Auto calculate helper for row items using official IPQA-04 formulas:
  const parseNumOrNull = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    if (s === '' || s === '-' || s === 'N/A') return null;
    const n = parseFloat(s);
    return isNaN(n) ? null : n;
  };

  // 1. Calculated Mode:
  //    - Coating wt Up = (Dryer Wt - Empty Up) / (Std Coating Width x Std Length / 1,000,000)
  //    - Coating wt Lo = (Empty Up - Empty Lo) / (Std Coating Width x Std Length / 1,000,000)
  //    - Binder% = (Total Wt - Dryer Wt) / (Total Wt - min(Empty Up, Empty Lo)) * 100
  //    - Amt Binder = (Total Wt - Dryer Wt) / ((Std Coating Width x Std Length / 1,000,000) / 2)
  // 2. Coating Manual Mode:
  //    - Binder% = (Total Wt - Dryer Wt)
  //    - Coating wt up, Coating wt lo = Inspector Key Data
  const calculateAutoFields = (item: any, currentHeader = headerInfo) => {
    const isManualMode = currentHeader?.calcMode === 'manual';
    const total = parseNumOrNull(item.totalWeight);
    const dryer = parseNumOrNull(item.weightAfterDryer);
    const wtUp = parseNumOrNull(item.wtWithoutCoatUp);
    const wtLo = parseNumOrNull(item.wtWithoutCoatLo);
    
    // Sample Strip Dimensions from Spec (Standard Test Dimensions (mm)):
    const stdCoatingWidth = parseNumOrNull(item.coatingWidth) || parseNumOrNull(currentHeader?.stdCoatingWidth) || 100;
    const stdLength = parseNumOrNull(item.length) || parseNumOrNull(currentHeader?.stdLength) || 200;

    // Formula denominator: (Std Coating Width x Std Length / 1000000) in m²
    const coatingAreaVal = stdCoatingWidth > 0 && stdLength > 0 ? (stdCoatingWidth * stdLength) / 1000000 : 0;
    const coatingAreaStr = coatingAreaVal > 0 ? coatingAreaVal.toFixed(6) : '';

    // Binder Weight = Total Wt - Dryer Wt
    const binderWtVal = total !== null && dryer !== null && total > 0 && dryer > 0 ? (total - dryer) : null;
    const binderWtStr = binderWtVal !== null && binderWtVal > 0 ? binderWtVal.toFixed(4) : '';

    // Total Coat & Binder Wt = Total Wt - min(Empty Up, Empty Lo)
    let totalCoatBinderWtVal: number | null = null;
    let totalCoatBinderWtStr = '';
    if (total !== null && total > 0 && (wtUp !== null || wtLo !== null)) {
        const values = [wtUp, wtLo].filter((v): v is number => v !== null && v > 0);
        if (values.length > 0) {
          const minEmpty = Math.min(...values);
          totalCoatBinderWtVal = (total - minEmpty);
          totalCoatBinderWtStr = totalCoatBinderWtVal > 0 ? totalCoatBinderWtVal.toFixed(4) : '';
        }
    }

    if (isManualMode) {
      // Coating Manual Mode:
      // Binder % = (Total Wt - Dryer Wt)
      let binderPercent = '';
      if (total !== null && dryer !== null) {
        const diff = total - dryer;
        binderPercent = Number.isInteger(diff) ? String(diff) : Number(diff.toFixed(4)).toString();
      }

      return { 
        coatingWidth: String(stdCoatingWidth),
        length: String(stdLength),
        coatingArea: coatingAreaStr, 
        binderWt: binderWtStr, 
        totalCoatBinderWt: totalCoatBinderWtStr, 
        binderPercent, 
        raUp: item.raUp !== undefined ? item.raUp : '', 
        raLo: item.raLo !== undefined ? item.raLo : '', 
        amountOfBinder: '' 
      };
    }

    // Calculated Coating & Binder Metrics Mode:
    // 3. Binder% = (Total Wt - Dryer Wt) / (Total Wt - min(Empty Up, Empty Lo)) * 100
    let binderPercent = '';
    if (binderWtVal !== null && binderWtVal > 0 && totalCoatBinderWtVal !== null && totalCoatBinderWtVal > 0) {
      binderPercent = ((binderWtVal / totalCoatBinderWtVal) * 100).toFixed(2);
    }

    // 4. Amt Binder = (Total Wt - Dryer Wt) / ((Std Coating Width x Std Length / 1000000) / 2)
    let amountOfBinder = '';
    if (binderWtVal !== null && binderWtVal > 0 && coatingAreaVal > 0) {
      amountOfBinder = (binderWtVal / (coatingAreaVal / 2)).toFixed(2);
    }

    // 1. Coating wt Up = (Dryer Wt - Empty Up) / (Std Coating Width x Std Length / 1000000)
    // 2. Coating wt Lo = (Empty Up - Empty Lo) / (Std Coating Width x Std Length / 1000000)
    let raUp = item.raUp || '';
    let raLo = item.raLo || '';
    if (coatingAreaVal > 0) {
        if (dryer !== null && dryer > 0 && wtUp !== null && wtUp > 0) {
          raUp = ((dryer - wtUp) / coatingAreaVal).toFixed(2);
        }
        if (wtUp !== null && wtUp > 0 && wtLo !== null && wtLo > 0) {
          raLo = ((wtUp - wtLo) / coatingAreaVal).toFixed(2);
        }
    }

    return { 
      coatingWidth: String(stdCoatingWidth),
      length: String(stdLength),
      coatingArea: coatingAreaStr, 
      binderWt: binderWtStr, 
      totalCoatBinderWt: totalCoatBinderWtStr, 
      binderPercent, 
      raUp, 
      raLo, 
      amountOfBinder 
    };
  };

  // Batch Data Entry Items State (Clean initial state)
  const [batchItems, setBatchItems] = useState(() => {
    const initial = { 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      width: '', 
      heightLeft: '', 
      heightRight: '',
      length: '200', 
      coatingWidth: '100', 
      coatingArea: '', 
      totalWeight: '', 
      weightAfterDryer: '', 
      wtWithoutCoatUp: '', 
      wtWithoutCoatLo: '',
      binderWt: '', 
      totalCoatBinderWt: '', 
      amountOfBinder: '',
      raUp: '', raLo: '', 
      binderPercent: '', 
      rtUp: '', rtLo: '', 
      scothMagicTapeUp: '',
      scothMagicTapeLo: '',
      scothMagicTape: '',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    };
    const autos = calculateAutoFields(initial);
    return [{ ...initial, ...autos }];
  });

  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'profile' | 'history'; id: string; label: string } | null>(null);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<CoatingInspectionRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<CoatingInspectionRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: CoatingInspectionRecord) => {
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
      avgCoatingUp: number; countUp: number;
      avgBinderPct: number; countBinder: number;
      avgAmtBinder: number; countAmtBinder: number;
    }> = {};

    inspections.forEach(item => {
      const pName = item.profileName || 'Unknown';
      if (!profileGroups[pName]) {
        profileGroups[pName] = { 
          name: pName, total: 0, pass: 0, fail: 0, 
          avgCoatingUp: 0, countUp: 0,
          avgBinderPct: 0, countBinder: 0,
          avgAmtBinder: 0, countAmtBinder: 0,
        };
      }
      profileGroups[pName].total++;
      if (item.status === 'Pass') profileGroups[pName].pass++;
      else profileGroups[pName].fail++;

      const coatingUp = parseFloat(item.raUp || '0');
      if (!isNaN(coatingUp) && coatingUp > 0) {
        profileGroups[pName].avgCoatingUp += coatingUp;
        profileGroups[pName].countUp++;
      }

      const binderPct = parseFloat(item.binderPercent || '0');
      if (!isNaN(binderPct) && binderPct > 0) {
        profileGroups[pName].avgBinderPct += binderPct;
        profileGroups[pName].countBinder++;
      }

      const amtBinder = parseFloat(item.amountOfBinder || '0');
      if (!isNaN(amtBinder) && amtBinder > 0) {
        profileGroups[pName].avgAmtBinder += amtBinder;
        profileGroups[pName].countAmtBinder++;
      }
    });

    const profileSummaries = Object.values(profileGroups).map(g => {
      return {
        ...g,
        avgCoatingUp: g.countUp > 0 ? (g.avgCoatingUp / g.countUp).toFixed(2) : '-',
        avgBinderPct: g.countBinder > 0 ? (g.avgBinderPct / g.countBinder).toFixed(2) : '-',
        avgAmtBinder: g.countAmtBinder > 0 ? (g.avgAmtBinder / g.countAmtBinder).toFixed(2) : '-',
        passRate: ((g.pass / g.total) * 100).toFixed(1),
      };
    });

    return { total, passCount, failCount, passRatio, profileSummaries };
  }, [inspections]);

  // Filtered Trend Data for Unified Overview & Query
  const filteredTrendData = useMemo<CoatingTrendPointItem[]>(() => {
    if (inspections.length === 0) return [];

    let filtered = [...inspections];
    if (trendFilterProfile !== 'All') {
      filtered = filtered.filter(i => (i.profileName || 'Unknown') === trendFilterProfile);
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
      const up = parseFloat(item.raUp || '0');
      const lo = parseFloat(item.raLo || '0');
      let coatWt = 0;
      if (!isNaN(up) && up > 0 && !isNaN(lo) && lo > 0) coatWt = (up + lo) / 2;
      else if (!isNaN(up) && up > 0) coatWt = up;
      else if (!isNaN(lo) && lo > 0) coatWt = lo;

      const binderPct = parseFloat(item.binderPercent || '0');
      const amtBinder = parseFloat(item.amountOfBinder || '0');

      return {
        index: idx + 1,
        id: item.id || `pt-${idx}`,
        date: item.date || item.timestamp?.split(' ')[0] || '',
        timestamp: item.timestamp || '',
        lotNumber: item.lotNumber || '-',
        profileName: item.profileName || 'Unknown',
        process: item.partId || '',
        status: item.status || 'Pass',
        inspector: item.inspectorName || '-',
        coatingWt: parseFloat(coatWt.toFixed(2)),
        coatingUp: !isNaN(up) && up > 0 ? parseFloat(up.toFixed(2)) : 0,
        coatingLo: !isNaN(lo) && lo > 0 ? parseFloat(lo.toFixed(2)) : 0,
        binderPercent: !isNaN(binderPct) ? parseFloat(binderPct.toFixed(2)) : 0,
        amountOfBinder: !isNaN(amtBinder) ? parseFloat(amtBinder.toFixed(2)) : 0
      };
    });
  }, [inspections, trendFilterProfile, trendFilterMonth]);

  // Active Profile Spec for Spec Limit Lines in Trend Charts
  const activeTrendSpec = useMemo(() => {
    if (trendFilterProfile === 'All') return null;
    return effectiveProfiles.find(p => p.name.toLowerCase() === trendFilterProfile.toLowerCase()) || null;
  }, [trendFilterProfile, effectiveProfiles]);

  const formatSpecValue = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    return String(val);
  };

  const selectProfile = (profile: CoatingProfileSpec) => {
    const tapeMaxUp = profile.scothMagicTapeMaxUp || profile.scothMagicTapeMax || profile.scothMagicTapeUp || profile.scothMagicTape || '0.50';
    const tapeMaxLo = profile.scothMagicTapeMaxLo || profile.scothMagicTapeMax || profile.scothMagicTapeLo || profile.scothMagicTape || '0.50';
    const stdLen = formatSpecValue(profile.stdLength) || '200';
    const stdCoatW = formatSpecValue(profile.stdCoatingWidth) || '100';
    const isManualProfile = profile.calcMode === 'manual' || (Boolean(profile.name) && profile.name.toLowerCase().includes('manual'));
    const mode = isManualProfile ? 'manual' : (profile.calcMode || 'calculated');

    const newHeader = {
      ...headerInfo,
      profileName: profile.name,
      calcMode: mode,
      reqWidthMin: formatSpecValue(profile.widthMin),
      reqWidthMax: formatSpecValue(profile.widthMax),
      reqHeightMin: formatSpecValue(profile.heightMin),
      reqHeightMax: formatSpecValue(profile.heightMax),
      reqBinderMin: formatSpecValue(profile.binderMin),
      reqBinderMax: formatSpecValue(profile.binderMax),
      reqAmtBinderMin: formatSpecValue(profile.amtBinderMin),
      reqAmtBinderMax: formatSpecValue(profile.amtBinderMax),
      reqCoatingWtMinUp: formatSpecValue(profile.coatingWtMinUp),
      reqCoatingWtMaxUp: formatSpecValue(profile.coatingWtMaxUp),
      reqPencilHardnessUp: formatSpecValue(profile.pencilHardnessUp),
      reqCoatingWtMinLo: formatSpecValue(profile.coatingWtMinLo),
      reqCoatingWtMaxLo: formatSpecValue(profile.coatingWtMaxLo),
      reqPencilHardnessLo: formatSpecValue(profile.pencilHardnessLo),
      reqScothMagicTapeMax: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeMaxUp: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeMaxLo: formatSpecValue(tapeMaxLo),
      reqScothMagicTape: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeUp: formatSpecValue(tapeMaxUp),
      reqScothMagicTapeLo: formatSpecValue(tapeMaxLo),
      stdLength: stdLen,
      stdCoatingWidth: stdCoatW
    };

    setHeaderInfo(newHeader);
    setProfileStatus('found');

    setBatchItems(prevItems => prevItems.map(item => {
      const updated = {
        ...item,
        length: stdLen,
        coatingWidth: stdCoatW
      };
      const autos = calculateAutoFields(updated, newHeader);
      return { ...updated, ...autos };
    }));
  };

  useEffect(() => {
    if (headerInfo.profileName) {
      const match = effectiveProfiles.find(p => p.name.toLowerCase() === headerInfo.profileName.toLowerCase());
      if (match) {
        const tapeMaxUp = match.scothMagicTapeMaxUp || match.scothMagicTapeMax || match.scothMagicTapeUp || match.scothMagicTape || '0.50';
        const tapeMaxLo = match.scothMagicTapeMaxLo || match.scothMagicTapeMax || match.scothMagicTapeLo || match.scothMagicTape || '0.50';
        const stdLen = formatSpecValue(match.stdLength) || '200';
        const stdCoatW = formatSpecValue(match.stdCoatingWidth) || '100';
        const isManualProfile = match.calcMode === 'manual' || (Boolean(match.name) && match.name.toLowerCase().includes('manual'));
        const mode = isManualProfile ? 'manual' : (match.calcMode || 'calculated');

        setHeaderInfo(prev => ({
          ...prev,
          calcMode: mode,
          reqWidthMin: formatSpecValue(match.widthMin),
          reqWidthMax: formatSpecValue(match.widthMax),
          reqHeightMin: formatSpecValue(match.heightMin),
          reqHeightMax: formatSpecValue(match.heightMax),
          reqBinderMin: formatSpecValue(match.binderMin),
          reqBinderMax: formatSpecValue(match.binderMax),
          reqAmtBinderMin: formatSpecValue(match.amtBinderMin),
          reqAmtBinderMax: formatSpecValue(match.amtBinderMax),
          reqCoatingWtMinUp: formatSpecValue(match.coatingWtMinUp),
          reqCoatingWtMaxUp: formatSpecValue(match.coatingWtMaxUp),
          reqPencilHardnessUp: formatSpecValue(match.pencilHardnessUp),
          reqCoatingWtMinLo: formatSpecValue(match.coatingWtMinLo),
          reqCoatingWtMaxLo: formatSpecValue(match.coatingWtMaxLo),
          reqPencilHardnessLo: formatSpecValue(match.pencilHardnessLo),
          reqScothMagicTapeMax: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeMaxUp: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeMaxLo: formatSpecValue(tapeMaxLo),
          reqScothMagicTape: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeUp: formatSpecValue(tapeMaxUp),
          reqScothMagicTapeLo: formatSpecValue(tapeMaxLo),
          stdLength: stdLen,
          stdCoatingWidth: stdCoatW
        }));
        setProfileStatus('found');
      } else {
        setProfileStatus('not-found');
      }
    } else {
      setProfileStatus('not-found');
    }
  }, [headerInfo.profileName, effectiveProfiles]);

  const handleResetForm = () => {
    setHeaderInfo({
      inspectorName: '',
      shift: '',
      process: 'COT',
      machine: '',
      mixingLot: '',
      date: new Date().toISOString().split('T')[0],
      profileName: '',
      calcMode: 'calculated',
      reqWidthMin: '', reqWidthMax: '',
      reqHeightMin: '', reqHeightMax: '',
      reqBinderMin: '', reqBinderMax: '',
      reqAmtBinderMin: '', reqAmtBinderMax: '',
      reqCoatingWtMinUp: '', reqCoatingWtMaxUp: '',
      reqPencilHardnessUp: '',
      reqCoatingWtMinLo: '', reqCoatingWtMaxLo: '',
      reqPencilHardnessLo: '',
      reqScothMagicTapeMax: '0.50',
      reqScothMagicTapeMaxUp: '0.50',
      reqScothMagicTapeMaxLo: '0.50',
      reqScothMagicTape: '0.50',
      reqScothMagicTapeUp: '0.50',
      reqScothMagicTapeLo: '0.50',
      stdLength: '200',
      stdCoatingWidth: '100'
    });
    setProfileStatus('not-found');
    const resetRow = { 
      id: Date.now(), 
      partId: '', 
      lotNumber: '', 
      width: '', 
      heightLeft: '', 
      heightRight: '', 
      length: '200', 
      coatingWidth: '100', 
      coatingArea: '0.020000', 
      totalWeight: '', 
      weightAfterDryer: '', 
      wtWithoutCoatUp: '', 
      wtWithoutCoatLo: '', 
      binderWt: '', 
      totalCoatBinderWt: '', 
      amountOfBinder: '',
      raUp: '', raLo: '', 
      binderPercent: '', 
      rtUp: '', rtLo: '', 
      scothMagicTapeUp: '',
      scothMagicTapeLo: '',
      scothMagicTape: '',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    };
    const autos = calculateAutoFields(resetRow);
    setBatchItems([{ ...resetRow, ...autos }]);
    showNotification(isTh ? 'ล้างข้อมูลฟอร์มเรียบร้อยแล้ว' : 'Form reset successfully');
  };

  const handleSaveProfile = () => {
    if (!headerInfo.profileName.trim()) {
      showNotification(isTh ? 'กรุณาระบุชื่อ Profile ก่อนบันทึก' : 'Please specify Profile Name', 'error');
      return;
    }

    const tapeUp = headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || '0.50';
    const tapeLo = headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || '0.50';

    const newProfile: CoatingProfileSpec = {
      name: headerInfo.profileName.trim(),
      calcMode: headerInfo.calcMode || 'calculated',
      widthMin: headerInfo.reqWidthMin, widthMax: headerInfo.reqWidthMax,
      heightMin: headerInfo.reqHeightMin, heightMax: headerInfo.reqHeightMax,
      binderMin: headerInfo.reqBinderMin, binderMax: headerInfo.reqBinderMax,
      amtBinderMin: headerInfo.reqAmtBinderMin, amtBinderMax: headerInfo.reqAmtBinderMax,
      coatingWtMinUp: headerInfo.reqCoatingWtMinUp, coatingWtMaxUp: headerInfo.reqCoatingWtMaxUp,
      pencilHardnessUp: headerInfo.reqPencilHardnessUp,
      coatingWtMinLo: headerInfo.reqCoatingWtMinLo, coatingWtMaxLo: headerInfo.reqCoatingWtMaxLo,
      pencilHardnessLo: headerInfo.reqPencilHardnessLo,
      scothMagicTapeMax: tapeUp,
      scothMagicTapeMaxUp: tapeUp,
      scothMagicTapeMaxLo: tapeLo,
      scothMagicTape: tapeUp,
      scothMagicTapeUp: tapeUp,
      scothMagicTapeLo: tapeLo,
      stdLength: headerInfo.stdLength,
      stdCoatingWidth: headerInfo.stdCoatingWidth
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

    showNotification(isTh ? `บันทึก Profile "${newProfile.name}" เรียบร้อยแล้ว` : `Saved Profile "${newProfile.name}"`);
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

  const isIgnoredValue = (valStr?: string | number): boolean => {
    if (valStr === undefined || valStr === null) return true;
    const s = String(valStr).trim();
    return s === '' || s === '-' || s === '--' || s === '---' || s === 'N/A' || s === 'n/a' || s === 'none' || s === 'null' || s === 'undefined';
  };

  const isScothTapeFail = (measuredStr?: string, maxLimitStr?: string) => {
    if (isIgnoredValue(measuredStr)) return false;
    const s = String(measuredStr).trim().toLowerCase();
    if (s === 'fail' || s === 'ng') return true;
    if (s === 'pass' || s === 'ok' || s === 'no peeling') return false;
    const val = parseFloat(String(measuredStr));
    const max = parseFloat(maxLimitStr || '0.50');
    if (!isNaN(val) && !isNaN(max) && max > 0) {
      // Must be less than or equal to standard limit (ค่าน้อยกว่าหรือเท่ากับมาตรฐาน)
      return val > max;
    }
    return false;
  };

  const judgeStatus = (item: typeof batchItems[0]): 'Pass' | 'Fail' | 'Pending' => {
    let pass = true;
    let numericCount = 0;

    const checkMinMax = (valStr?: string, minStr?: string, maxStr?: string) => {
      if (isIgnoredValue(valStr)) return;
      const s = String(valStr).trim();
      const v = parseFloat(s);
      if (isNaN(v)) return;
      numericCount++;
      const minVal = parseFloat(minStr || '0');
      const maxVal = parseFloat(maxStr || '0');
      if (minStr && minStr !== '' && minVal > 0 && v < minVal) pass = false;
      if (maxStr && maxStr !== '' && maxVal > 0 && v > maxVal) pass = false;
    };

    checkMinMax(item.width, headerInfo.reqWidthMin, headerInfo.reqWidthMax);
    checkMinMax(item.heightLeft, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
    checkMinMax(item.heightRight, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
    checkMinMax(item.raUp, headerInfo.reqCoatingWtMinUp, headerInfo.reqCoatingWtMaxUp);
    checkMinMax(item.raLo, headerInfo.reqCoatingWtMinLo, headerInfo.reqCoatingWtMaxLo);
    checkMinMax(item.binderPercent, headerInfo.reqBinderMin, headerInfo.reqBinderMax);
    if (headerInfo.calcMode !== 'manual') {
      checkMinMax(item.amountOfBinder, headerInfo.reqAmtBinderMin, headerInfo.reqAmtBinderMax);
    }

    // Scoth Magic Tape evaluation (Weight check: measured weight must be <= standard max limit)
    const maxTapeUp = headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50';
    const maxTapeLo = headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || headerInfo.reqScothMagicTapeMax || '0.50';

    if (isScothTapeFail(item.scothMagicTapeUp, maxTapeUp)) pass = false;
    if (isScothTapeFail(item.scothMagicTapeLo, maxTapeLo)) pass = false;
    if (isScothTapeFail(item.scothMagicTape, maxTapeUp)) pass = false;

    const hasTapeData = !isIgnoredValue(item.scothMagicTapeUp) || !isIgnoredValue(item.scothMagicTapeLo) || !isIgnoredValue(item.scothMagicTape);

    if (numericCount === 0 && !hasTapeData) return 'Pending';
    if (!item.lotNumber && !item.totalWeight && !item.partId) return 'Pending';

    return pass ? 'Pass' : 'Fail';
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addRow = () => {
    const lastItem = batchItems[batchItems.length - 1];
    const newItem = { 
      id: Date.now() + Math.random(), 
      partId: lastItem ? lastItem.partId : '', 
      lotNumber: lastItem ? lastItem.lotNumber : '', 
      width: headerInfo.reqWidthMin || (lastItem ? lastItem.width : ''),
      heightLeft: lastItem ? lastItem.heightLeft : '',
      heightRight: lastItem ? lastItem.heightRight : '',
      length: headerInfo.stdLength || (lastItem ? lastItem.length : '100'),
      coatingWidth: headerInfo.stdCoatingWidth || (lastItem ? lastItem.coatingWidth : '100'),
      coatingArea: '',
      totalWeight: '',
      weightAfterDryer: '',
      wtWithoutCoatUp: '',
      wtWithoutCoatLo: '',
      binderWt: '',
      totalCoatBinderWt: '',
      amountOfBinder: '',
      raUp: '', raLo: '', binderPercent: '',
      rtUp: headerInfo.reqPencilHardnessUp || '', 
      rtLo: headerInfo.reqPencilHardnessLo || '', 
      scothMagicTapeUp: headerInfo.reqScothMagicTapeUp || (lastItem ? lastItem.scothMagicTapeUp : 'Pass') || 'Pass',
      scothMagicTapeLo: headerInfo.reqScothMagicTapeLo || (lastItem ? lastItem.scothMagicTapeLo : 'Pass') || 'Pass',
      scothMagicTape: headerInfo.reqScothMagicTape || (lastItem ? lastItem.scothMagicTape : 'Pass') || 'Pass',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', 
      remarks: '' 
    };
    const autos = calculateAutoFields(newItem);
    setBatchItems(prev => [...prev, { ...newItem, ...autos }]);
  };

  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setHeaderInfo(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'stdLength' || name === 'stdCoatingWidth') {
        setBatchItems(prevItems => prevItems.map(item => {
          const updated = {
            ...item,
            length: name === 'stdLength' ? value : (item.length || next.stdLength),
            coatingWidth: name === 'stdCoatingWidth' ? value : (item.coatingWidth || next.stdCoatingWidth)
          };
          const autos = calculateAutoFields(updated, next);
          return { ...updated, ...autos };
        }));
      }
      return next;
    });
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    setBatchItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        const autos = calculateAutoFields(updated, headerInfo);
        return { ...updated, ...autos };
      }
      return item;
    }));
  };

  const saveBatch = () => {
    const validItems = batchItems.filter(item => (item.partId || item.lotNumber) && judgeStatus(item) !== 'Pending');
    if (validItems.length === 0) {
      showNotification(isTh ? 'กรุณากรอกข้อมูลให้ครบถ้วนอย่างน้อย 1 รายการ' : 'Please enter inspection data', 'error');
      return;
    }

    const now = new Date();
    const newRecords: CoatingInspectionRecord[] = validItems.map(item => {
      const decision = judgeStatus(item);
      const recId = `rec-coat-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

      if (onLogNewActivity) {
        if (headerInfo.inspectorName) saveRecordedInspector(headerInfo.inspectorName);
        onLogNewActivity({
          id: recId,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moduleCode: 'IPQA-04',
          moduleTitleTh: 'การตรวจวัดการเคลือบผิว (Coating Measurement)',
          moduleTitleEn: 'Coating Thickness, Area & Binder Measurement System',
          inspector: headerInfo.inspectorName || 'Coating Technician',
          shift: headerInfo.shift || '',
          batchLot: `${headerInfo.profileName} - ${item.lotNumber}`,
          result: decision === 'Pass' ? 'PASS' : 'REJECT',
          defectCount: decision === 'Fail' ? 1 : 0,
          remarks: `Coat Wt: ${item.raUp}/${item.raLo}, Binder%: ${item.binderPercent}%, AmtBinder: ${item.amountOfBinder}, Scoth Tape: ${item.scothMagicTapeUp || 'Pass'}/${item.scothMagicTapeLo || 'Pass'}`
        });
      }

      return {
        id: recId,
        lotNumber: item.lotNumber.trim().toUpperCase() || 'COIL-UNTITLED',
        partId: item.partId.trim().toUpperCase() || 'UP-SIDE',
        mixingLot: headerInfo.mixingLot,
        width: item.width,
        heightLeft: item.heightLeft,
        heightRight: item.heightRight,
        length: item.length,
        coatingWidth: item.coatingWidth,
        coatingArea: item.coatingArea,
        totalWeight: item.totalWeight,
        weightAfterDryer: item.weightAfterDryer,
        wtWithoutCoatUp: item.wtWithoutCoatUp,
        wtWithoutCoatLo: item.wtWithoutCoatLo,
        binderWt: item.binderWt,
        totalCoatBinderWt: item.totalCoatBinderWt,
        raUp: item.raUp,
        raLo: item.raLo,
        binderPercent: item.binderPercent,
        amountOfBinder: item.amountOfBinder,
        rtUp: item.rtUp,
        rtLo: item.rtLo,
        scothMagicTape: item.scothMagicTape || item.scothMagicTapeUp || 'Pass',
        scothMagicTapeUp: item.scothMagicTapeUp || 'Pass',
        scothMagicTapeLo: item.scothMagicTapeLo || 'Pass',
        status: decision,
        remarks: item.remarks,
        profileName: headerInfo.profileName,
        calcMode: headerInfo.calcMode || 'calculated',
        inspectorName: headerInfo.inspectorName || 'Coating Inspector',
        shift: headerInfo.shift || '',
        machine: headerInfo.machine || 'COAT-LINE-01',
        date: headerInfo.date,
        timestamp: now.toLocaleString('th-TH')
      };
    });

    setInspections(prev => [...newRecords, ...prev]);
    showNotification(isTh ? `บันทึกข้อมูล ${validItems.length} รายการเรียบร้อยแล้ว` : `Saved ${validItems.length} inspection items`);

    const resetRow = { 
      id: Date.now(), 
      partId: '', lotNumber: '', width: '', heightLeft: '', heightRight: '', 
      length: headerInfo.stdLength || '100', coatingWidth: headerInfo.stdCoatingWidth || '100',
      coatingArea: '0.010000', totalWeight: '', weightAfterDryer: '', wtWithoutCoatUp: '', wtWithoutCoatLo: '',
      binderWt: '', totalCoatBinderWt: '', amountOfBinder: '', raUp: '', raLo: '', binderPercent: '',
      rtUp: headerInfo.reqPencilHardnessUp || '', rtLo: headerInfo.reqPencilHardnessLo || '',
      scothMagicTapeUp: headerInfo.reqScothMagicTapeUp || 'Pass',
      scothMagicTapeLo: headerInfo.reqScothMagicTapeLo || 'Pass',
      scothMagicTape: headerInfo.reqScothMagicTape || 'Pass',
      status: 'Pending' as 'Pass' | 'Fail' | 'Pending', remarks: '' 
    };
    const resetAutos = calculateAutoFields(resetRow);
    setBatchItems([{ ...resetRow, ...resetAutos }]);

    setActiveTab('history');
  };

  const isOutOfSpec = (val?: string, min?: string, max?: string) => {
    if (!val || val === '') return false;
    const v = parseFloat(val);
    if (isNaN(v)) return false;
    const minVal = parseFloat(min || '0');
    const maxVal = parseFloat(max || '0');
    if (min && min !== '' && minVal > 0 && v < minVal) return true;
    if (max && max !== '' && maxVal > 0 && v > maxVal) return true;
    return false;
  };

  const exportToExcel = () => {
    if (inspections.length === 0) {
      showNotification(isTh ? 'ไม่มีข้อมูลสำหรับ Export' : 'No history to export', 'error');
      return;
    }

    const headers = [
      'Timestamp', 'Inspector', 'Machine', 'Mixing Lot', 'Profile Name', 'Coil No', 'Side', 
      'Width', 'H-Left', 'H-Right', 'Length', 'Coating Width', 'Coating Area',
      'Total Wt', 'Dryer Wt', 'Empty Up', 'Empty Lo', 'Binder Wt', 'Coat+Binder Wt',
      'Coating Wt Up', 'Coating Wt Lo', 'Binder %', 'Amount of Binder', 'Hardness Up', 'Hardness Lo',
      'Scoth Magic Tape Up', 'Scoth Magic Tape Lo', 'Status'
    ];

    const csvRows = inspections.map(ins => [
      `"${ins.timestamp}"`,
      `"${ins.inspectorName}"`,
      `"${ins.machine || '-'}"`,
      `"${ins.mixingLot || '-'}"`,
      `"${ins.profileName}"`,
      `"${ins.lotNumber}"`,
      `"${ins.partId}"`,
      ins.width || '-', ins.heightLeft || '-', ins.heightRight || '-',
      ins.length || '-', ins.coatingWidth || '-', ins.coatingArea || '-',
      ins.totalWeight || '-', ins.weightAfterDryer || '-', ins.wtWithoutCoatUp || '-', ins.wtWithoutCoatLo || '-',
      ins.binderWt || '-', ins.totalCoatBinderWt || '-',
      ins.raUp || '-', ins.raLo || '-', ins.binderPercent || '-', ins.amountOfBinder || '-',
      `"${ins.rtUp || '-'}"`, `"${ins.rtLo || '-'}"`,
      `"${ins.scothMagicTapeUp || ins.scothMagicTape || '-'}"`, `"${ins.scothMagicTapeLo || '-'}"`,
      `"${ins.status}"`
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Coating_Inspection_${new Date().toISOString().split('T')[0]}.csv`);
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
      i.inspectorName.toLowerCase().includes(term) ||
      (i.mixingLot && i.mixingLot.toLowerCase().includes(term))
    );
  }, [inspections, historySearchTerm]);

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>

      {/* Admin Verification Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Admin Verification</h3>
              <p className="text-xs text-slate-400">
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
                    if (deleteConfirm.type === 'profile') handleDeleteProfile(deleteConfirm.id);
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
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  IPQA-04
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isTh ? 'การตรวจวัดการเคลือบผิว (Coating Measurement)' : 'Coating Measurement System'}
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isTh 
                  ? 'คำนวณ Coating Area, Total Wt, Dryer Wt, Coating Wt Up/Lo, Binder % และ Amount of Binder' 
                  : 'Coating thickness, area, binder weight, coating weight & hardness measurement system'}
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
          <span>{isTh ? '⚙️ Profile Spec' : 'Profile Spec'}</span>
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
                <Layers className="w-4 h-4 text-indigo-400" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name *
                </label>
                <select
                  value={headerInfo.profileName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      handleResetForm();
                      return;
                    }
                    const selected = effectiveProfiles.find(p => p.name === val);
                    if (selected) selectProfile(selected);
                  }}
                  className="w-full bg-slate-950 border border-indigo-900/80 text-indigo-300 font-bold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-400 uppercase"
                >
                  <option value="">-- {isTh ? 'เลือก Profile' : 'Select Profile'} --</option>
                  {effectiveProfiles.map(p => {
                    const isMan = p.calcMode === 'manual' || (Boolean(p.name) && p.name.toLowerCase().includes('manual'));
                    return (
                      <option key={p.name} value={p.name}>
                        {p.name} {isMan ? (isTh ? '(Coating Manual - กรอกเอง)' : '(Manual)') : (isTh ? '(คำนวณอัตโนมัติ)' : '(Calculated)')}
                      </option>
                    );
                  })}
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
                  placeholder={isTh ? 'ชื่อผู้ตรวจสอบ' : 'Inspector name'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Shift (กะ)
                </label>
                <input
                  list="coating-shift-options"
                  type="text"
                  name="shift"
                  value={headerInfo.shift}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Shift A, Shift B, Shift C..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <datalist id="coating-shift-options">
                  <option value="Shift A" />
                  <option value="Shift B" />
                  <option value="Shift C" />
                </datalist>
              </div>

              <ProcessSelector
                id="coating-header-process"
                label="Process"
                value={headerInfo.process || 'COT'}
                onChange={(proc) => setHeaderInfo(prev => ({ ...prev, process: proc }))}
              />

              <MachineSelector
                id="coating-header-machine"
                label="Machine No."
                value={headerInfo.machine}
                onChange={(mac) => setHeaderInfo(prev => ({ ...prev, machine: mac }))}
              />

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Mixing Lot
                </label>
                <input
                  type="text"
                  name="mixingLot"
                  value={headerInfo.mixingLot}
                  onChange={handleHeaderChange}
                  placeholder={isTh ? 'เช่น MIX-2026-B08' : 'Mixing Lot'}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 font-semibold rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
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

            {/* Spec summary row */}
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs grid grid-cols-1 sm:grid-cols-6 gap-2 text-slate-300">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-slate-500">Mode:</span>
                {headerInfo.calcMode === 'manual' ? (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                    Coating Manual
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                    Calculated Metrics
                  </span>
                )}
              </div>
              <div><span className="text-slate-500">Width Spec:</span> <strong className="text-indigo-300">{headerInfo.reqWidthMin ? `${headerInfo.reqWidthMin} - ${headerInfo.reqWidthMax} mm` : '-'}</strong></div>
              <div><span className="text-slate-500">Coating Wt:</span> <strong className="text-emerald-300">{headerInfo.reqCoatingWtMinUp ? `${headerInfo.reqCoatingWtMinUp} - ${headerInfo.reqCoatingWtMaxUp} g/m²` : '-'}</strong></div>
              <div><span className="text-slate-500">Binder %:</span> <strong className="text-amber-300">{headerInfo.reqBinderMin ? `${headerInfo.reqBinderMin} - ${headerInfo.reqBinderMax} %` : '-'}</strong></div>
              <div>
                <span className="text-slate-500">Amt Binder:</span>{' '}
                <strong className={headerInfo.calcMode === 'manual' ? 'text-slate-500 line-through' : 'text-purple-300'}>
                  {headerInfo.calcMode === 'manual' ? 'N/A (Manual)' : (headerInfo.reqAmtBinderMin ? `${headerInfo.reqAmtBinderMin} - ${headerInfo.reqAmtBinderMax} g/m²` : '-')}
                </strong>
              </div>
              <div>
                <span className="text-slate-500">Scoth Tape Limit:</span>{' '}
                <strong className="text-pink-300 font-mono">
                  ≤ {headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50'} g/m²
                </strong>
              </div>
            </div>
          </div>

          {/* Measurement Table */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md overflow-hidden" ref={tableRef}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  {isTh ? '2. ตารางบันทึกค่าการเคลือบผิว (Coating Measurement Entry)' : '2. Coating Entry Table'}
                </h3>
                {headerInfo.calcMode === 'manual' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1">
                    <span>⚡ Coating Manual (ซ่อน Empty Up/Lo อัตโนมัติ)</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  title={isTh ? 'ล้างฟอร์มทั้งหมด' : 'Reset Form'}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isTh ? 'ล้างฟอร์ม' : 'Reset'}</span>
                </button>

                <button
                  onClick={addRow}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4 text-indigo-400" />
                  <span>{isTh ? '+ เพิ่มรายการ' : 'Add Row'}</span>
                </button>

                <button
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
                      <th className="px-3 py-3 w-56">Coil Info (Side / Dimension)</th>
                      <th className="px-3 py-3 text-center bg-indigo-950/30 text-indigo-300 border-l border-slate-800" colSpan={4}>
                        {headerInfo.calcMode === 'manual' ? (
                          <div className="flex flex-col items-center justify-center">
                            <span>Weight Inputs (Total / Dryer Wt)</span>
                            <span className="text-[9px] text-amber-300 font-semibold tracking-normal normal-case">
                              {isTh ? '⚡ ซ่อน Empty Up & Lo อัตโนมัติ (Coating Manual)' : '⚡ Empty Up & Lo hidden (Manual)'}
                            </span>
                          </div>
                        ) : (
                          <span>Weight Inputs (Total / Dryer / Empty Up / Lo)</span>
                        )}
                      </th>
                      {headerInfo.calcMode === 'manual' ? (
                        <th className="px-3 py-3 text-center bg-amber-950/30 text-amber-300 border-l border-slate-800" colSpan={3}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Coating + Binder (M)</span>
                            <button
                              type="button"
                              onClick={() => setShowFormulaModal(true)}
                              className="text-amber-400 hover:text-amber-200 bg-amber-900/50 hover:bg-amber-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-0.5 border border-amber-500/30 transition cursor-pointer"
                              title="View Calculation Formulas & Manual Mode"
                            >
                              <Calculator className="w-3 h-3" />
                              <span>Manual fx</span>
                            </button>
                          </div>
                        </th>
                      ) : (
                        <th className="px-3 py-3 text-center bg-emerald-950/30 text-emerald-300 border-l border-slate-800" colSpan={4}>
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Calculated Coating & Binder Metrics</span>
                            <button
                              type="button"
                              onClick={() => setShowFormulaModal(true)}
                              className="text-emerald-400 hover:text-emerald-200 bg-emerald-900/50 hover:bg-emerald-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold inline-flex items-center gap-0.5 border border-emerald-500/30 transition cursor-pointer"
                              title="View Calculation Formulas"
                            >
                              <Calculator className="w-3 h-3" />
                              <span>Formula fx</span>
                            </button>
                          </div>
                        </th>
                      )}
                      <th className="px-3 py-3 text-center bg-purple-950/30 text-purple-300 border-l border-slate-800" colSpan={2}>
                        Hardness
                      </th>
                      <th className="px-3 py-3 text-center bg-pink-950/30 text-pink-300 border-l border-slate-800" colSpan={2}>
                        <div className="flex flex-col items-center justify-center">
                          <span>Scoth Magic Tape</span>
                          <span className="text-[9px] text-pink-400 font-mono font-normal">
                            ≤ {headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50'} g/m²
                          </span>
                        </div>
                      </th>
                      <th className="px-3 py-3 text-center border-l border-slate-800">Status</th>
                      <th className="px-3 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {batchItems.map((item) => {
                      const currentStatus = judgeStatus(item);

                      const isWidthFail = isOutOfSpec(item.width, headerInfo.reqWidthMin, headerInfo.reqWidthMax);
                      const isHLeftFail = isOutOfSpec(item.heightLeft, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
                      const isHRightFail = isOutOfSpec(item.heightRight, headerInfo.reqHeightMin, headerInfo.reqHeightMax);
                      const isCoatUpFail = isOutOfSpec(item.raUp, headerInfo.reqCoatingWtMinUp, headerInfo.reqCoatingWtMaxUp);
                      const isCoatLoFail = isOutOfSpec(item.raLo, headerInfo.reqCoatingWtMinLo, headerInfo.reqCoatingWtMaxLo);
                      const isBinderPctFail = isOutOfSpec(item.binderPercent, headerInfo.reqBinderMin, headerInfo.reqBinderMax);
                      const isAmtBinderFail = isOutOfSpec(item.amountOfBinder, headerInfo.reqAmtBinderMin, headerInfo.reqAmtBinderMax);

                      const tapeLimitUp = headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || headerInfo.reqScothMagicTapeMax || '0.50';
                      const tapeLimitLo = headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || headerInfo.reqScothMagicTapeMax || '0.50';
                      const isTapeUpFail = isScothTapeFail(item.scothMagicTapeUp, tapeLimitUp);
                      const isTapeLoFail = isScothTapeFail(item.scothMagicTapeLo, tapeLimitLo);

                      return (
                        <tr key={item.id} className="hover:bg-slate-950/50 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex gap-1.5 items-center">
                                <input 
                                  type="text" 
                                  placeholder="Coil No." 
                                  value={item.lotNumber} 
                                  onChange={(e) => handleItemChange(item.id, 'lotNumber', e.target.value)} 
                                  className="w-28 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                                />
                                <div className="relative w-28 flex items-center">
                                  <input 
                                    type="text" 
                                    list="coating-side-options"
                                    placeholder="Side (H/T)" 
                                    value={item.partId} 
                                    onChange={(e) => handleItemChange(item.id, 'partId', e.target.value.toUpperCase())} 
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 pr-12 text-xs font-semibold text-slate-200 uppercase focus:outline-none focus:border-indigo-500" 
                                  />
                                  <div className="absolute right-1 flex items-center gap-0.5">
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
                                <datalist id="coating-side-options">
                                  <option value="H">H (Head / หัวคอยล์)</option>
                                  <option value="T">T (Tail / ท้ายคอยล์)</option>
                                  <option value="UP">UP (Upper Side)</option>
                                  <option value="LO">LO (Lower Side)</option>
                                </datalist>
                              </div>
                              <div className="flex gap-1 items-center">
                                <input 
                                  type="number" 
                                  placeholder="Width" 
                                  value={item.width} 
                                  onChange={(e) => handleItemChange(item.id, 'width', e.target.value)} 
                                  className={`w-16 border rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none ${
                                    isWidthFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`} 
                                />
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="H-L" 
                                  value={item.heightLeft} 
                                  onChange={(e) => handleItemChange(item.id, 'heightLeft', e.target.value)} 
                                  className={`w-14 border rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none ${
                                    isHLeftFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`} 
                                />
                                <input 
                                  type="number" step="0.01" 
                                  placeholder="H-R" 
                                  value={item.heightRight} 
                                  onChange={(e) => handleItemChange(item.id, 'heightRight', e.target.value)} 
                                  className={`w-14 border rounded-lg px-1.5 py-1 text-[11px] font-bold outline-none ${
                                    isHRightFail ? 'border-rose-500 bg-rose-950/80 text-rose-300' : 'bg-slate-950 border-slate-800 text-slate-300'
                                  }`} 
                                />
                              </div>
                            </div>
                          </td>

                          {/* Weight Inputs */}
                          <td className="px-2 py-2.5 text-center bg-indigo-950/10 border-l border-slate-800" colSpan={4}>
                            <div className={`grid ${headerInfo.calcMode === 'manual' ? 'grid-cols-2 max-w-[280px] mx-auto' : 'grid-cols-2'} gap-1.5`}>
                              <input 
                                type="number" step="0.0001" 
                                placeholder="Total Wt (g)" 
                                value={item.totalWeight} 
                                onChange={(e) => handleItemChange(item.id, 'totalWeight', e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                              />
                              <input 
                                type="number" step="0.0001" 
                                placeholder="Dryer Wt (g)" 
                                value={item.weightAfterDryer} 
                                onChange={(e) => handleItemChange(item.id, 'weightAfterDryer', e.target.value)} 
                                className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                              />
                              {headerInfo.calcMode !== 'manual' && (
                                <>
                                  <input 
                                    type="number" step="0.0001" 
                                    placeholder="Empty Up (g)" 
                                    value={item.wtWithoutCoatUp} 
                                    onChange={(e) => handleItemChange(item.id, 'wtWithoutCoatUp', e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                                  />
                                  <input 
                                    type="number" step="0.0001" 
                                    placeholder="Empty Lo (g)" 
                                    value={item.wtWithoutCoatLo} 
                                    onChange={(e) => handleItemChange(item.id, 'wtWithoutCoatLo', e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-800 text-indigo-300 rounded-lg px-1.5 py-1 text-xs text-center font-bold"
                                  />
                                </>
                              )}
                            </div>
                          </td>

                          {/* Calculated Metrics / Coating Manual (M) */}
                          {headerInfo.calcMode === 'manual' ? (
                            <td className="px-2 py-2.5 text-center bg-amber-950/10 border-l border-slate-800" colSpan={3}>
                              <div className="grid grid-cols-3 gap-1.5">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-amber-400 font-bold flex items-center justify-center gap-0.5">
                                    <span>Coat Wt Up</span>
                                    <span className="text-[8px] text-slate-500 font-normal">(Key)</span>
                                  </span>
                                  <input 
                                    type="number" step="0.01" 
                                    placeholder="Key In" 
                                    value={item.raUp || ''} 
                                    onChange={(e) => handleItemChange(item.id, 'raUp', e.target.value)} 
                                    className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                      isCoatUpFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-amber-500/40 text-amber-300 focus:border-amber-400'
                                    }`} 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-amber-400 font-bold flex items-center justify-center gap-0.5">
                                    <span>Coat Wt Lo</span>
                                    <span className="text-[8px] text-slate-500 font-normal">(Key)</span>
                                  </span>
                                  <input 
                                    type="number" step="0.01" 
                                    placeholder="Key In" 
                                    value={item.raLo || ''} 
                                    onChange={(e) => handleItemChange(item.id, 'raLo', e.target.value)} 
                                    className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                      isCoatLoFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-amber-500/40 text-amber-300 focus:border-amber-400'
                                    }`} 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-amber-300 font-bold flex items-center justify-center gap-0.5">
                                    <span>Binder %</span>
                                    <span className="text-[8px] text-amber-500/80 font-mono">(T-D)</span>
                                  </span>
                                  <input 
                                    type="text" readOnly 
                                    placeholder="Total-Dryer"
                                    value={item.binderPercent ? `${item.binderPercent}` : '-'} 
                                    className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                      isBinderPctFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-amber-400'
                                    }`} 
                                  />
                                </div>
                              </div>
                            </td>
                          ) : (
                            <td className="px-2 py-2.5 text-center bg-emerald-950/10 border-l border-slate-800" colSpan={4}>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-500 font-bold">Coat Wt Up</span>
                                  <input 
                                    type="text" readOnly value={item.raUp || '-'} 
                                    className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                      isCoatUpFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-400'
                                    }`} 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-500 font-bold">Coat Wt Lo</span>
                                  <input 
                                    type="text" readOnly value={item.raLo || '-'} 
                                    className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                      isCoatLoFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-emerald-400'
                                    }`} 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-500 font-bold">Binder %</span>
                                  <input 
                                    type="text" readOnly value={item.binderPercent ? `${item.binderPercent}%` : '-'} 
                                    className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                      isBinderPctFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-amber-400'
                                    }`} 
                                  />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] text-slate-500 font-bold">Amt Binder</span>
                                  <input 
                                    type="text" readOnly value={item.amountOfBinder || '-'} 
                                    className={`w-full text-center border rounded-lg px-1 py-1 font-bold text-xs ${
                                      isAmtBinderFail ? 'border-rose-500 bg-rose-950 text-rose-300' : 'bg-slate-950 border-slate-800 text-purple-400'
                                    }`} 
                                  />
                                </div>
                              </div>
                            </td>
                          )}

                          {/* Hardness */}
                          <td className="px-2 py-2.5 text-center bg-purple-950/10 border-l border-slate-800" colSpan={2}>
                            <div className="flex gap-1.5 justify-center">
                              <input 
                                type="text" placeholder="Up" value={item.rtUp} 
                                onChange={(e) => handleItemChange(item.id, 'rtUp', e.target.value)} 
                                className="w-14 bg-slate-950 border border-slate-800 text-purple-300 rounded-lg px-1 py-1 text-center font-bold text-xs" 
                              />
                              <input 
                                type="text" placeholder="Lo" value={item.rtLo} 
                                onChange={(e) => handleItemChange(item.id, 'rtLo', e.target.value)} 
                                className="w-14 bg-slate-950 border border-slate-800 text-purple-300 rounded-lg px-1 py-1 text-center font-bold text-xs" 
                              />
                            </div>
                          </td>

                          {/* Scoth Magic Tape Weight Inputs */}
                          <td className="px-2 py-2.5 text-center bg-pink-950/10 border-l border-slate-800" colSpan={2}>
                            <div className="flex gap-1.5 justify-center items-center">
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] text-slate-500 font-bold">Up (g/m²)</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={`≤ ${tapeLimitUp}`}
                                  value={item.scothMagicTapeUp || ''}
                                  onChange={(e) => handleItemChange(item.id, 'scothMagicTapeUp', e.target.value)}
                                  className={`w-16 text-center text-[11px] font-bold rounded-lg px-1 py-1 border outline-none font-mono ${
                                    isTapeUpFail
                                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                                      : item.scothMagicTapeUp && item.scothMagicTapeUp !== ''
                                      ? 'bg-slate-950 border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-pink-300 focus:border-pink-500'
                                  }`}
                                />
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-[9px] text-slate-500 font-bold">Lo (g/m²)</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={`≤ ${tapeLimitLo}`}
                                  value={item.scothMagicTapeLo || ''}
                                  onChange={(e) => handleItemChange(item.id, 'scothMagicTapeLo', e.target.value)}
                                  className={`w-16 text-center text-[11px] font-bold rounded-lg px-1 py-1 border outline-none font-mono ${
                                    isTapeLoFail
                                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                                      : item.scothMagicTapeLo && item.scothMagicTapeLo !== ''
                                      ? 'bg-slate-950 border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-950 border-slate-800 text-pink-300 focus:border-pink-500'
                                  }`}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center border-l border-slate-800">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              currentStatus === 'Pass' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                                : currentStatus === 'Fail' 
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {currentStatus}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
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
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE SPEC SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-400" />
                <span>{isTh ? 'การตั้งค่า Profile Specification (Admin Only)' : 'Profile Specification Management'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isTh ? 'กำหนดเกณฑ์มาตรฐาน (Min / Max) สำหรับประเมินผล Coating' : 'Define Min/Max specification limits for Coating parameters'}
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
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isTh ? 'รายการ Profile ที่บันทึกไว้' : 'Saved Profiles'}
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {effectiveProfiles.map((p, idx) => (
                  <div
                    key={p.id || `${p.name}-${idx}`}
                    onClick={() => selectProfile(p)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      headerInfo.profileName === p.name
                        ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{p.name}</span>
                        {p.calcMode === 'manual' ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                            Manual
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                            Calculated
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Coat: {p.coatingWtMinUp}-{p.coatingWtMaxUp} | Binder: {p.binderMin}-{p.binderMax}% | Tape Max: ≤{p.scothMagicTapeMaxUp || p.scothMagicTapeMax || p.scothMagicTapeUp || p.scothMagicTape || '0.50'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm({ type: 'profile', id: p.name, label: p.name });
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Spec Editor */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Profile Name *
                </label>
                <input
                  type="text"
                  name="profileName"
                  value={headerInfo.profileName}
                  onChange={handleHeaderChange}
                  placeholder="e.g. Standard_Coating_01"
                  className="w-full bg-slate-950 border border-slate-800 text-indigo-300 font-bold rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              {/* Calculation & Entry Mode Selector (Calculated vs Manual) */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase block">
                  {isTh ? 'โหมดการคำนวณและบันทึกค่า (Calculation & Entry Mode) *' : 'Calculation & Entry Mode *'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const newHeader = { ...headerInfo, calcMode: 'calculated' as const };
                      setHeaderInfo(newHeader);
                      setBatchItems(prev => prev.map(item => ({ ...item, ...calculateAutoFields(item, newHeader) })));
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                      (headerInfo.calcMode || 'calculated') === 'calculated'
                        ? 'bg-emerald-950/70 border-emerald-500 ring-1 ring-emerald-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      (headerInfo.calcMode || 'calculated') === 'calculated'
                        ? 'border-emerald-400 bg-emerald-500'
                        : 'border-slate-600 bg-slate-950'
                    }`}>
                      {(headerInfo.calcMode || 'calculated') === 'calculated' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${
                        (headerInfo.calcMode || 'calculated') === 'calculated' ? 'text-emerald-300' : 'text-slate-300'
                      }`}>
                        Calculated Coating & Binder Metrics
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        {isTh 
                          ? 'คำนวณค่า Coat Wt Up/Lo, Binder % และ Amt Binder อัตโนมัติตามสูตรมาตรฐาน' 
                          : 'Auto-calculate Coat Wt Up/Lo, Binder % and Amt Binder using standard formulas'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newHeader = { ...headerInfo, calcMode: 'manual' as const };
                      setHeaderInfo(newHeader);
                      setBatchItems(prev => prev.map(item => ({ ...item, ...calculateAutoFields(item, newHeader) })));
                    }}
                    className={`p-3 rounded-xl border text-left transition flex items-start gap-3 ${
                      headerInfo.calcMode === 'manual'
                        ? 'bg-amber-950/70 border-amber-500 ring-1 ring-amber-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      headerInfo.calcMode === 'manual'
                        ? 'border-amber-400 bg-amber-500'
                        : 'border-slate-600 bg-slate-950'
                    }`}>
                      {headerInfo.calcMode === 'manual' && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${
                        headerInfo.calcMode === 'manual' ? 'text-amber-300' : 'text-slate-300'
                      }`}>
                        Coating Manual
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        {isTh 
                          ? 'แสดง Coating + Binder (M): Binder% = (Total Wt - Dryer Wt) และผู้ตรวจกรอก Coating wt up/lo เอง' 
                          : 'Show Coating + Binder (M): Binder% = (Total Wt - Dryer Wt) and manual key-in for Coating wt up/lo'}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-400">Width Specification (mm)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Width</label>
                      <input type="number" name="reqWidthMin" value={headerInfo.reqWidthMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Width</label>
                      <input type="number" name="reqWidthMax" value={headerInfo.reqWidthMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-indigo-400">Height Specification (mm)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Height</label>
                      <input type="number" step="0.01" name="reqHeightMin" value={headerInfo.reqHeightMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Height</label>
                      <input type="number" step="0.01" name="reqHeightMax" value={headerInfo.reqHeightMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-emerald-400">Coating Wt Up Specification (g/m²)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Coating Wt</label>
                      <input type="number" step="0.1" name="reqCoatingWtMinUp" value={headerInfo.reqCoatingWtMinUp} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Coating Wt</label>
                      <input type="number" step="0.1" name="reqCoatingWtMaxUp" value={headerInfo.reqCoatingWtMaxUp} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-amber-400">Binder % Specification (%)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Binder %</label>
                      <input type="number" step="0.1" name="reqBinderMin" value={headerInfo.reqBinderMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Binder %</label>
                      <input type="number" step="0.1" name="reqBinderMax" value={headerInfo.reqBinderMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-purple-400">Amount of Binder Spec (g/m²)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Min Amt Binder</label>
                      <input type="number" step="0.1" name="reqAmtBinderMin" value={headerInfo.reqAmtBinderMin} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Amt Binder</label>
                      <input type="number" step="0.1" name="reqAmtBinderMax" value={headerInfo.reqAmtBinderMax} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200" />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-pink-400">Scoth Magic Tape (Max Weight Limit)</h5>
                    <span className="text-[10px] text-pink-400 font-mono font-bold">≤ มาตรฐาน</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Limit Up (g/m²)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="reqScothMagicTapeMaxUp"
                        value={headerInfo.reqScothMagicTapeMaxUp || headerInfo.reqScothMagicTapeUp || ''}
                        onChange={handleHeaderChange}
                        placeholder="e.g. 0.50"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-pink-300 font-mono font-bold focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Max Limit Lo (g/m²)</label>
                      <input
                        type="number"
                        step="0.01"
                        name="reqScothMagicTapeMaxLo"
                        value={headerInfo.reqScothMagicTapeMaxLo || headerInfo.reqScothMagicTapeLo || ''}
                        onChange={handleHeaderChange}
                        placeholder="e.g. 0.50"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-pink-300 font-mono font-bold focus:border-pink-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isTh ? '* ตรวจสอบน้ำหนักสารเคลือบ ต้องมีค่าน้อยกว่าหรือเท่ากับเกณฑ์ที่กำหนด (≤ Max)' : '* Measured coating weight must be less than or equal to standard limit.'}
                  </p>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-300">Standard Test Dimensions (mm)</h5>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">ใช้ในสูตรคำนวณพื้นที่ (Area)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Std Length (mm)</label>
                      <input type="number" name="stdLength" value={headerInfo.stdLength} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">Std Coating Width (mm)</label>
                      <input type="number" name="stdCoatingWidth" value={headerInfo.stdCoatingWidth} onChange={handleHeaderChange} className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isTh 
                      ? '* ค่า Std Coating Width และ Std Length จะถูกนำไปใช้เป็นตัวหารในสูตรคำนวณ Coating Wt Up, Coating Wt Lo และ Amt Binder โดยอัตโนมัติ' 
                      : '* Std Coating Width and Std Length are automatically used in the calculation denominators for Coating Wt Up, Coating Wt Lo, and Amt Binder.'}
                  </p>
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
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isTh ? 'จำนวนการตรวจทั้งหมด' : 'Total Inspected'}
                    </div>
                    <div className={`text-2xl font-black mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {dashboardStats.total} <span className="text-xs font-normal text-slate-500">Coils</span>
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isTh ? 'ผ่านเกณฑ์ (Pass)' : 'Passed'}
                    </div>
                    <div className="text-2xl font-black text-emerald-500 dark:text-emerald-400 mt-1">
                      {dashboardStats.passCount} <span className="text-xs font-normal text-slate-500">Coils</span>
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className={`p-5 rounded-2xl border flex items-center justify-between transition-colors ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {isTh ? 'ไม่ผ่านเกณฑ์ (Fail)' : 'Failed'}
                    </div>
                    <div className="text-2xl font-black text-rose-500 dark:text-rose-400 mt-1">
                      {dashboardStats.failCount} <span className="text-xs font-normal text-slate-500">Coils</span>
                    </div>
                  </div>
                  <div className="p-3 bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-xl border border-rose-500/20">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-purple-950 p-5 rounded-2xl border border-indigo-800 flex items-center justify-between text-white shadow-sm">
                  <div>
                    <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                      {isTh ? 'อัตราผ่านเกณฑ์ (Pass Rate)' : 'Pass Rate'}
                    </div>
                    <div className="text-2xl font-black text-white mt-1">{dashboardStats.passRatio}%</div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Target className="w-6 h-6 text-indigo-300" />
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
                    <span>{isTh ? 'สถิติภาพรวมแยกตาม Profile (คลิกแถวเพื่อกรองดูกราฟ)' : 'Summary Statistics by Profile (Click row to filter graph)'}</span>
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
                        <th className="px-4 py-3 text-center">Avg Coating Up (g/m²)</th>
                        <th className="px-4 py-3 text-center">Avg Binder % (%)</th>
                        <th className="px-4 py-3 text-center">Avg Amt Binder</th>
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
                            <td className="px-4 py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">{p.avgCoatingUp}</td>
                            <td className="px-4 py-3 text-center text-amber-600 dark:text-amber-400 font-bold">{p.avgBinderPct}%</td>
                            <td className="px-4 py-3 text-center text-purple-600 dark:text-purple-400 font-bold">{p.avgAmtBinder}</td>
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

              {/* UNIFIED TREND ANALYSIS SECTION: Full-width rows for Coating WT, Binder % */}
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
                      <span>{isTh ? 'การวิเคราะห์แนวโน้มการเคลือบผิว (Coating Measurement Trend Analysis)' : 'Coating Measurement Trend Analysis'}</span>
                    </h3>
                    <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {trendFilterProfile === 'All'
                        ? (isTh ? '📊 กำลังแสดงภาพรวมทุก Profile รวมกัน (แยกตามแถว Coating WT และ Binder % ด้านล่าง)' : '📊 Showing unified overview of all profiles across dedicated parameter rows')
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
                      {/* Coating WT Spec */}
                      <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                        isLight ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-slate-900 border-emerald-800 text-emerald-300'
                      }`}>
                        Coating WT: {activeTrendSpec.coatingWtMinUp || activeTrendSpec.coatingWtMinLo || '-'} ~ {activeTrendSpec.coatingWtMaxUp || activeTrendSpec.coatingWtMaxLo || '-'} g/m²
                      </span>
                      {/* Binder % Spec */}
                      <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                        isLight ? 'bg-white border-amber-200 text-amber-700' : 'bg-slate-900 border-amber-800 text-amber-300'
                      }`}>
                        Binder %: {activeTrendSpec.binderMin || '-'}% ~ {activeTrendSpec.binderMax || '-'}%
                      </span>
                      {/* Amt Binder Spec */}
                      {(activeTrendSpec.amtBinderMin || activeTrendSpec.amtBinderMax) && (
                        <span className={`px-2.5 py-1 rounded-lg border font-bold ${
                          isLight ? 'bg-white border-purple-200 text-purple-700' : 'bg-slate-900 border-purple-800 text-purple-300'
                        }`}>
                          Amt Binder: {activeTrendSpec.amtBinderMin || '-'} ~ {activeTrendSpec.amtBinderMax || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2 DEDICATED FULL-WIDTH PARAMETER ROWS */}
                <div className="space-y-5">
                  {/* Row 1: Coating WT Trend (g/m²) */}
                  <CoatingParameterRowCard
                    paramKey="coatingWt"
                    title="Coating WT"
                    thaiTitle="น้ำหนักการเคลือบผิว (Coating Weight - Up/Lo Avg)"
                    descriptionTh="น้ำหนักการเคลือบผิวเฉลี่ยทั้งด้านบนและด้านล่าง (Coating Weight Average)"
                    descriptionEn="Average coating weight on upper and lower surfaces"
                    color="#10b981"
                    data={filteredTrendData}
                    unit="g/m²"
                    specMin={activeTrendSpec ? (parseFloat(activeTrendSpec.coatingWtMinUp || activeTrendSpec.coatingWtMinLo || '0') || null) : null}
                    specMax={activeTrendSpec ? (parseFloat(activeTrendSpec.coatingWtMaxUp || activeTrendSpec.coatingWtMaxLo || '0') || null) : null}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* Row 2: Binder % Trend (%) */}
                  <CoatingParameterRowCard
                    paramKey="binderPercent"
                    title="Binder %"
                    thaiTitle="เปอร์เซ็นต์ไบน์เดอร์ (Binder Percentage)"
                    descriptionTh="สัดส่วนเปอร์เซ็นต์สารยึดเกาะไบน์เดอร์ต่อน้ำหนักการเคลือบทั้งหมด"
                    descriptionEn="Binder percentage relative to total coating film weight"
                    color="#f59e0b"
                    data={filteredTrendData}
                    unit="%"
                    specMin={activeTrendSpec ? (parseFloat(activeTrendSpec.binderMin || '0') || null) : null}
                    specMax={activeTrendSpec ? (parseFloat(activeTrendSpec.binderMax || '0') || null) : null}
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
              <p className="text-xs font-semibold">{isTh ? 'ยังไม่มีข้อมูลการตรวจวัด' : 'No inspection records yet'}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: HISTORY TABLE */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder={isTh ? 'ค้นหาตาม Coil No, Profile, Inspector...' : 'Search coil no, profile, inspector...'}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={exportToExcel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2 rounded-xl border border-slate-700 flex items-center gap-2 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isTh ? 'ส่งออก CSV / Excel' : 'Export CSV / Excel'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                <tr>
                  <th className="px-3 py-3">Timestamp</th>
                  <th className="px-3 py-3">Coil No.</th>
                  <th className="px-3 py-3">Profile</th>
                  <th className="px-3 py-3">Inspector</th>
                  <th className="px-3 py-3 text-center">Coat Wt (Up/Lo)</th>
                  <th className="px-3 py-3 text-center">Binder %</th>
                  <th className="px-3 py-3 text-center">Amt Binder</th>
                  <th className="px-3 py-3 text-center">Hardness</th>
                  <th className="px-3 py-3 text-center">Scoth Tape</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredInspections.map((ins) => (
                  <tr key={ins.id} className="hover:bg-slate-950/50 transition">
                    <td className="px-3 py-2.5 text-slate-400 text-[11px]">{ins.timestamp}</td>
                    <td className="px-3 py-2.5 font-bold text-slate-200">{ins.lotNumber}</td>
                    <td className="px-3 py-2.5 text-indigo-300 font-semibold">{ins.profileName}</td>
                    <td className="px-3 py-2.5 text-slate-400">
                      <div>{ins.inspectorName}</div>
                      {ins.shift && <div className="text-[10px] text-slate-500">Shift: {ins.shift}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-center text-emerald-400 font-bold">
                      {ins.raUp || '-'}/{ins.raLo || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-amber-400 font-bold">
                      {ins.binderPercent ? `${ins.binderPercent}%` : '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-purple-400 font-bold">
                      {ins.amountOfBinder || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-300">
                      {ins.rtUp || '-'}/{ins.rtLo || '-'}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="inline-flex items-center gap-1 font-mono text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          isScothTapeFail(ins.scothMagicTapeUp || ins.scothMagicTape, ins.scothMagicTapeMaxUp || ins.scothMagicTapeMax || '0.50')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                        }`}>
                          U:{ins.scothMagicTapeUp || ins.scothMagicTape || '-'}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          isScothTapeFail(ins.scothMagicTapeLo, ins.scothMagicTapeMaxLo || ins.scothMagicTapeMax || '0.50')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-pink-500/10 text-pink-300 border border-pink-500/20'
                        }`}>
                          L:{ins.scothMagicTapeLo || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        ins.status === 'Pass' 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        {ins.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
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
                          className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded transition"
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
                  ? 'กรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไขรายการตรวจวัด IPQA-04' 
                  : 'Enter admin password to edit IPQA-04 record'}
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
                    {isTh ? 'แก้ไขข้อมูลการตรวจวัดสารเคลือบผิว (IPQA-04)' : 'Edit Coating Measurement Record'}
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
                    list="coating-side-options"
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

                <MachineSelector
                  id="edit-coating-machine"
                  label="Machine No."
                  value={editingHistoryItem.machine || ''}
                  onChange={(mac) => setEditingHistoryItem({ ...editingHistoryItem, machine: mac })}
                />

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Shift (กะ)</label>
                  <input
                    list="edit-coating-shift-options"
                    type="text"
                    placeholder="e.g. Shift A, Shift B, Shift C..."
                    value={editingHistoryItem.shift || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, shift: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="edit-coating-shift-options">
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
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Coating Measured Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coat Wt Up (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.raUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, raUp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Coat Wt Lo (g/m²)</label>
                    <input
                      type="text"
                      value={editingHistoryItem.raLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, raLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Binder %</label>
                    <input
                      type="text"
                      value={editingHistoryItem.binderPercent || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, binderPercent: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount of Binder</label>
                    <input
                      type="text"
                      value={editingHistoryItem.amountOfBinder || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, amountOfBinder: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-purple-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hardness Up</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rtUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rtUp: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Hardness Lo</label>
                    <input
                      type="text"
                      value={editingHistoryItem.rtLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, rtLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-pink-400 uppercase block mb-1">Tape Up (g/m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="≤ Max"
                      value={editingHistoryItem.scothMagicTapeUp || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, scothMagicTapeUp: e.target.value, scothMagicTape: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-pink-300 font-bold focus:outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-pink-400 uppercase block mb-1">Tape Lo (g/m²)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="≤ Max"
                      value={editingHistoryItem.scothMagicTapeLo || ''}
                      onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, scothMagicTapeLo: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-pink-300 font-bold focus:outline-none focus:border-pink-500"
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

      {/* FORMULA REFERENCE & VERIFICATION MODAL */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isTh ? 'สูตรการคำนวณการตรวจวัด IPQA-04' : 'IPQA-04 Calculation Formulas'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isTh ? 'การตรวจวัดการเคลือบผิว (Calculated Coating & Binder Metrics)' : 'Coating & Binder Metrics Calculation Specs'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Formula 1 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                    1. Coating wt Up (g/m²)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-emerald-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Coating wt Up = (Dryer Wt - Empty Up) / (Std Coating Width × Std Length / 1,000,000)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh 
                    ? 'น้ำหนักเคลือบผิวแถบบน = (น้ำหนักหลังอบแห้ง - น้ำหนักแผ่นบนเปล่า) ÷ (Std Coating Width × Std Length ÷ 1,000,000 ม.²)' 
                    : 'Upper coating weight in g/m² = (Dryer Wt - Empty Up) ÷ (Std Coating Width × Std Length / 1,000,000 m²)'}
                </p>
              </div>

              {/* Formula 2 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 uppercase tracking-wider text-[11px]">
                    2. Coating wt Lo (g/m²)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-emerald-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Coating wt Lo = (Empty Up - Empty Lo) / (Std Coating Width × Std Length / 1,000,000)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh 
                    ? 'น้ำหนักเคลือบผิวแถบล่าง = (น้ำหนักแผ่นบนเปล่า - น้ำหนักแผ่นล่างเปล่า) ÷ (Std Coating Width × Std Length ÷ 1,000,000 ม.²)' 
                    : 'Lower coating weight in g/m² = (Empty Up - Empty Lo) ÷ (Std Coating Width × Std Length / 1,000,000 m²)'}
                </p>
              </div>

              {/* Formula 3 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                    3. Binder % (%)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-amber-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Binder% = (Total Wt - Dryer Wt) / (Total Wt - min(Empty Up, Empty Lo)) × 100
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh ? 'เปอร์เซ็นต์ไบน์เดอร์ = (น้ำหนักรวม - น้ำหนักหลังอบแห้ง) ÷ (น้ำหนักรวม - ค่าต่ำสุดของ Empty Up/Lo) × 100%' : 'Percentage of binder relative to the total active coating and binder mass.'}
                </p>
              </div>

              {/* Formula 4 */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px]">
                    4. Amount of Binder (Amt Binder)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px] font-bold">
                    Formula Verified ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-purple-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Amt Binder = (Total Wt - Dryer Wt) / ((Std Coating Width × Std Length / 1,000,000) / 2)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh 
                    ? 'ปริมาณไบน์เดอร์ = (น้ำหนักรวม - น้ำหนักหลังอบแห้ง) ÷ ((Std Coating Width × Std Length ÷ 1,000,000) ÷ 2)' 
                    : 'Amount of binder = (Total Wt - Dryer Wt) ÷ ((Std Coating Width × Std Length / 1,000,000) / 2)'}
                </p>
              </div>

              {/* Mode 2: Coating Manual (M) Explanation */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">
                    ★ Coating Manual Mode [Coating + Binder (M)]
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                    Manual Mode Rules ✓
                  </span>
                </div>
                <div className="space-y-2 p-3 bg-slate-900 rounded-xl font-mono border border-slate-800 text-xs">
                  <div className="text-amber-300">
                    <strong>1. Binder %</strong> = (Total Wt - Dryer Wt)
                  </div>
                  <div className="text-emerald-300">
                    <strong>2. Coating wt up</strong> = Inspector Key Data (กรอกค่าเอง)
                  </div>
                  <div className="text-emerald-300">
                    <strong>3. Coating wt lo</strong> = Inspector Key Data (กรอกค่าเอง)
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh 
                    ? 'ในโหมด Coating Manual ระบบจะซ่อนฟิลด์ Empty Up และ Empty Lo โดยอัตโนมัติเพื่อไม่ให้สับสน และแสดงคอลัมน์ Coating + Binder (M) โดยคำนวณ Binder% = Total Wt - Dryer Wt ส่วนค่า Coat Wt Up และ Lo ผู้ตรวจสอบเป็นผู้กรอกข้อมูลโดยตรง' 
                    : 'In Coating Manual mode, Empty Up and Empty Lo fields are automatically hidden to prevent confusion. Standard auto metrics are replaced by Coating + Binder (M): Binder% = Total Wt - Dryer Wt, and Coating Wt Up/Lo are manually entered.'}
                </p>
              </div>

              {/* Formula 5: Scoth Magic Tape */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-pink-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-pink-400 uppercase tracking-wider text-[11px]">
                    5. Scoth Magic Tape (Weight ≤ Max Limit)
                  </span>
                  <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono text-[10px] font-bold">
                    Quality Standard ✓
                  </span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl font-mono text-pink-300 border border-slate-800 text-xs sm:text-sm text-center">
                  Scoth Magic Tape Weight: Measured Value ≤ Max Limit Spec (g/m²)
                </div>
                <p className="text-[11px] text-slate-400">
                  {isTh ? 'การตรวจวัดน้ำหนักสารเคลือบด้วยเทป Scotch Magic Tape ตรวจสอบทั้งแถบบน (Up) และแถบล่าง (Lo) โดยค่าน้ำหนักสารเคลือบที่ติดเทปต้องมีค่าน้อยกว่าหรือเท่ากับเกณฑ์มาตรฐานที่กำหนด (≤ Max Limit)' : 'Measured coating weight removed by Scotch Magic Tape must be less than or equal to the specified maximum limit (≤ Max Limit).'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFormulaModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-5 py-2.5 rounded-xl transition"
              >
                {isTh ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
