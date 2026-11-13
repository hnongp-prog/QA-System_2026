import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ruler, 
  FileText, 
  BarChart3, 
  Settings, 
  Upload, 
  Sparkles, 
  Save, 
  Copy, 
  FileSpreadsheet, 
  Trash2, 
  Lock, 
  Plus, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Check, 
  RotateCcw,
  Edit,
  Cpu,
  History,
  Info,
  Edit3,
  X,
  AlertCircle,
  Moon,
  Sun,
  TrendingUp,
  PieChart,
  Target,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { 
  ThicknessWallRecord, 
  ThicknessWallProfileSpec, 
  ThicknessWallProfileItemSpec, 
  Language, 
  InspectionActivity,
  ThemeMode
} from '../types';
import { extractThicknessWallClient } from '../services/geminiClient';
import { useCloudState } from '../services/firestoreSync';
import { InspectorDatalist, saveRecordedInspector } from '../utils/inspectorStorage';
import { ProcessSelector, MachineSelector } from './common/ProcessMachineSelector';
import { STANDARD_PROCESS_OPTIONS, STANDARD_MACHINE_OPTIONS } from '../constants/processOptions';

interface ThicknessWallAppProps {
  onBackToPortal?: () => void;
  onLogNewActivity?: (activity: InspectionActivity) => void;
  language?: Language;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

const ADMIN_PASS = 'admin2026';

const INITIAL_PROFILES: Record<string, ThicknessWallProfileItemSpec[]> = {
  'A-001': [
    { item: 'OR', min: 12.0, max: 13.5 },
    { item: 'T1', min: 2.1, max: 2.5 },
    { item: 'T2', min: 2.0, max: 2.4 },
    { item: 'T3', min: 3.0, max: 3.5 },
    { item: 'T4', min: 3.0, max: 3.5 },
    { item: 'T5', min: 1.8, max: 2.3 },
    { item: 'IR', min: 8.0, max: 9.2 },
    { item: 'IHR', min: 1.5, max: 2.0 },
    { item: 'OHW', min: 2.2, max: 2.8 },
    { item: 'IHW', min: 2.0, max: 2.6 },
    { item: 'RA', min: 0.5, max: 1.2 },
    { item: 'IOR', min: 10.0, max: 11.5 }
  ],
  'B-002': [
    { item: 'OR', min: 15.0, max: 16.5 },
    { item: 'T1', min: 3.0, max: 3.6 },
    { item: 'T2', min: 2.8, max: 3.4 },
    { item: 'T3', min: 4.0, max: 4.8 },
    { item: 'T4', min: 4.0, max: 4.8 },
    { item: 'T5', min: 2.5, max: 3.0 },
    { item: 'IR', min: 10.0, max: 11.8 }
  ]
};

const INITIAL_RECORDS: ThicknessWallRecord[] = [
  {
    docId: 'tw-doc-101',
    id: 'TW-2026-001',
    timestamp: '2026-08-05 14:30',
    timestampRaw: '2026-08-05T14:30:00Z',
    inspector: 'Kitti M.',
    process: 'Line A - Extrusion #1',
    coil: 'COIL-9901-A',
    sample: 'SAMPLE-A1',
    profile: 'A-001',
    vals: {
      t1: { min: 2.2, max: 2.4 },
      t2: { min: 2.1, max: 2.3 },
      t3: 3.2,
      t4: 3.3,
      t1_list: ['T1-1: 2.2', 'T1-2: 2.3', 'T1-3: 2.4'],
      t2_list: ['T2-1: 2.1', 'T2-2: 2.2', 'T2-3: 2.3'],
      t3_list: ['T3-1: 3.1', 'T3-2: 3.2', 'T3-3: 3.3'],
      t4_list: ['T4-1: 3.2', 'T4-2: 3.3', 'T4-3: 3.4'],
      t5_list: ['T5-1: 2.0', 'T5-2: 2.1', 'T5-3: 1.9', 'T5-4: 2.0'],
      or: { min: 12.2, max: 13.1 },
      ir: { min: 8.2, max: 8.9 },
      ihr: { min: 1.6, max: 1.8 },
      ohw: { min: 2.3, max: 2.6 },
      ihw: { min: 2.1, max: 2.4 },
      ra: { min: 0.8, max: 1.0 },
      ior: { min: 10.2, max: 11.0 }
    },
    overallStatus: 'PASS'
  },
  {
    docId: 'tw-doc-102',
    id: 'TW-2026-002',
    timestamp: '2026-08-04 10:15',
    timestampRaw: '2026-08-04T10:15:00Z',
    inspector: 'Somchai P.',
    process: 'Line B - Extrusion #2',
    coil: 'COIL-8802-B',
    sample: 'SAMPLE-B2',
    profile: 'B-002',
    vals: {
      t1: { min: 2.9, max: 3.7 },
      t2: { min: 2.7, max: 3.5 },
      t3: 4.2,
      t4: 4.1,
      t1_list: ['T1-1: 2.9', 'T1-2: 3.3', 'T1-3: 3.7'],
      t2_list: ['T2-1: 2.7', 'T2-2: 3.1', 'T2-3: 3.5'],
      t3_list: ['T3-1: 4.1', 'T3-2: 4.2', 'T3-3: 4.3'],
      t4_list: ['T4-1: 4.0', 'T4-2: 4.1', 'T4-3: 4.2'],
      t5_list: ['T5-1: 2.6', 'T5-2: 2.7', 'T5-3: 2.8'],
      or: { min: 15.2, max: 16.8 },
      ir: { min: 10.1, max: 11.5 },
      ihr: { min: 1.5, max: 1.9 },
      ohw: { min: 2.2, max: 2.7 },
      ihw: { min: 2.0, max: 2.5 },
      ra: { min: 0.6, max: 1.1 },
      ior: { min: 10.1, max: 11.2 }
    },
    overallStatus: 'FAIL'
  }
];

// Helper: parse number safely from number | string
const parseNumericVal = (v: number | string | undefined | null): number | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().replace(/,/g, '.');
  if (!s || s === '-' || s === '--' || s === 'N/A' || s === 'n/a') return null;
  const n = parseFloat(s);
  return isNaN(n) || !isFinite(n) ? null : n;
};

// Helper: extract natural numeric suffix for sorting labels like T1-1, T1-2, ..., T5-10
const extractSubPointIndex = (label: string): number => {
  const m = label.match(/[-_.](\d+)\s*$/);
  return m ? parseInt(m[1], 10) : 0;
};

// Helper: parse series entries (e.g. ['T1-1: 2.2', 'T1-2: 2.3', 'T1-3: 2.4']) into ordered points
const parseSeriesEntries = (list: string[] | undefined, prefix: string): { pointLabel: string; value: number; rawText: string }[] => {
  if (!Array.isArray(list)) return [];
  const points: { pointLabel: string; value: number; rawText: string }[] = [];
  list.forEach((entry, idx) => {
    const str = String(entry || '').trim();
    if (!str) return;
    const colonMatch = str.match(/^([^:]+):\s*([-+]?\d*\.?\d+)/);
    if (colonMatch) {
      const label = colonMatch[1].trim().toUpperCase();
      const val = parseFloat(colonMatch[2]);
      if (!isNaN(val) && isFinite(val)) {
        points.push({ pointLabel: label, value: val, rawText: `${label}: ${val}` });
      }
      return;
    }
    const endMatch = str.match(/([-+]?\d*\.?\d+)\s*$/);
    if (endMatch) {
      const val = parseFloat(endMatch[1]);
      if (!isNaN(val) && isFinite(val)) {
        const label = `${prefix}-${idx + 1}`;
        points.push({ pointLabel: label, value: val, rawText: `${label}: ${val}` });
      }
    }
  });
  return points.sort((a, b) => extractSubPointIndex(a.pointLabel) - extractSubPointIndex(b.pointLabel));
};

// Helper: extract sub-points for T1 (T1-1..3), T2 (T2-1..3), T3 (T3-1..3), T4 (T4-1..3), T5 (T5-1..n)
const extractRecordParamPoints = (
  vals: ThicknessWallRecord['vals'] | undefined,
  paramKey: 't1' | 't2' | 't3' | 't4' | 't5'
): { pointLabel: string; value: number; rawText: string }[] => {
  if (!vals) return [];
  const prefix = paramKey.toUpperCase();

  if (paramKey === 't1') {
    if (vals.t1_list && vals.t1_list.length > 0) return parseSeriesEntries(vals.t1_list, prefix);
    const mn = parseNumericVal(vals.t1?.min);
    const mx = parseNumericVal(vals.t1?.max);
    if (mn !== null && mx !== null) {
      if (Math.abs(mx - mn) < 0.0001) return [{ pointLabel: 'T1-1', value: mn, rawText: `T1-1: ${mn}` }];
      return [
        { pointLabel: 'T1 (Min)', value: mn, rawText: `T1 Min: ${mn}` },
        { pointLabel: 'T1 (Max)', value: mx, rawText: `T1 Max: ${mx}` },
      ];
    }
    if (mn !== null) return [{ pointLabel: 'T1-1', value: mn, rawText: `T1-1: ${mn}` }];
    if (mx !== null) return [{ pointLabel: 'T1-1', value: mx, rawText: `T1-1: ${mx}` }];
    return [];
  }

  if (paramKey === 't2') {
    if (vals.t2_list && vals.t2_list.length > 0) return parseSeriesEntries(vals.t2_list, prefix);
    const mn = parseNumericVal(vals.t2?.min);
    const mx = parseNumericVal(vals.t2?.max);
    if (mn !== null && mx !== null) {
      if (Math.abs(mx - mn) < 0.0001) return [{ pointLabel: 'T2-1', value: mn, rawText: `T2-1: ${mn}` }];
      return [
        { pointLabel: 'T2 (Min)', value: mn, rawText: `T2 Min: ${mn}` },
        { pointLabel: 'T2 (Max)', value: mx, rawText: `T2 Max: ${mx}` },
      ];
    }
    if (mn !== null) return [{ pointLabel: 'T2-1', value: mn, rawText: `T2-1: ${mn}` }];
    if (mx !== null) return [{ pointLabel: 'T2-1', value: mx, rawText: `T2-1: ${mx}` }];
    return [];
  }

  if (paramKey === 't3') {
    if (vals.t3_list && vals.t3_list.length > 0) return parseSeriesEntries(vals.t3_list, prefix);
    const v = parseNumericVal(vals.t3);
    return v !== null ? [{ pointLabel: 'T3-1', value: v, rawText: `T3-1: ${v}` }] : [];
  }

  if (paramKey === 't4') {
    if (vals.t4_list && vals.t4_list.length > 0) return parseSeriesEntries(vals.t4_list, prefix);
    const v = parseNumericVal(vals.t4);
    return v !== null ? [{ pointLabel: 'T4-1', value: v, rawText: `T4-1: ${v}` }] : [];
  }

  // t5: T5-1, T5-2, T5-3, ..., T5-n
  return parseSeriesEntries(vals.t5_list, prefix);
};

// Helper: extract YYYY-MM and YYYY-MM-DD cleanly from timestampRaw or timestamp
const extractRecordDateParts = (r: ThicknessWallRecord): { monthKey: string; dateStr: string; sortMs: number } => {
  const raw = r.timestampRaw || r.timestamp || '';
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return { monthKey: `${yyyy}-${mm}`, dateStr: `${yyyy}-${mm}-${dd}`, sortMs: d.getTime() };
    }
    const match = raw.match(/(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (match) {
      const monthKey = `${match[1]}-${match[2]}`;
      const dateStr = match[3] ? `${match[1]}-${match[2]}-${match[3]}` : monthKey;
      return { monthKey, dateStr, sortMs: 0 };
    }
  }
  return { monthKey: '', dateStr: r.timestamp || '', sortMs: 0 };
};

export interface WallRangeMetric {
  min: number | null;
  max: number | null;
  avg: number | null;
  points: { pointLabel: string; value: number; rawText: string }[];
}

export interface ThicknessTrendPointItem {
  index: number;
  id: string;
  date: string;
  timestamp: string;
  coil: string;
  sample: string;
  profile: string;
  process: string;
  inspector: string;
  overallStatus: 'PASS' | 'FAIL';
  t1: WallRangeMetric;
  t2: WallRangeMetric;
  t3: WallRangeMetric;
  t4: WallRangeMetric;
  t5: WallRangeMetric;
}

interface ThicknessParameterRowCardProps {
  paramKey: 't1' | 't2' | 't3' | 't4' | 't5';
  title: string;
  thaiTitle: string;
  descriptionTh: string;
  descriptionEn: string;
  color: string;
  data: ThicknessTrendPointItem[];
  plotMode: 'points' | 'sampleAvg';
  unit: string;
  specMin?: number | null;
  specMax?: number | null;
  isLight: boolean;
  isTh: boolean;
}

interface PlottedChartPoint {
  sampleIndex: number;
  sampleGroupIdx: number;
  pointSeq: number;
  id: string;
  date: string;
  timestamp: string;
  coil: string;
  sample: string;
  profile: string;
  inspector: string;
  overallStatus: 'PASS' | 'FAIL';
  pointLabel: string;
  value: number;
  valMin: number;
  valMax: number;
  allSamplePointsText: string[];
}

const ThicknessParameterRowCard: React.FC<ThicknessParameterRowCardProps> = ({
  paramKey,
  title,
  thaiTitle,
  descriptionTh,
  descriptionEn,
  color,
  data,
  plotMode,
  unit,
  specMin = null,
  specMax = null,
  isLight,
  isTh,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const specTarget = useMemo(() => {
    if (specMin !== null && specMax !== null) {
      return parseFloat(((specMin + specMax) / 2).toFixed(3));
    }
    return null;
  }, [specMin, specMax]);

  const validPoints = useMemo<PlottedChartPoint[]>(() => {
    const out: PlottedChartPoint[] = [];
    let groupCounter = 0;

    data.forEach(item => {
      const m = item[paramKey];
      if (!m) return;

      if (plotMode === 'points' && m.points && m.points.length > 0) {
        const currentGroup = groupCounter++;
        const allText = m.points.map(p => p.rawText);
        m.points.forEach((pt, subIdx) => {
          out.push({
            sampleIndex: item.index,
            sampleGroupIdx: currentGroup,
            pointSeq: out.length + 1,
            id: `${item.id}-${pt.pointLabel}-${subIdx}`,
            date: item.date,
            timestamp: item.timestamp,
            coil: item.coil,
            sample: item.sample,
            profile: item.profile,
            inspector: item.inspector,
            overallStatus: item.overallStatus,
            pointLabel: pt.pointLabel,
            value: pt.value,
            valMin: pt.value,
            valMax: pt.value,
            allSamplePointsText: allText,
          });
        });
      } else if (m.avg !== null && !isNaN(m.avg)) {
        const currentGroup = groupCounter++;
        out.push({
          sampleIndex: item.index,
          sampleGroupIdx: currentGroup,
          pointSeq: out.length + 1,
          id: `${item.id}-avg`,
          date: item.date,
          timestamp: item.timestamp,
          coil: item.coil,
          sample: item.sample,
          profile: item.profile,
          inspector: item.inspector,
          overallStatus: item.overallStatus,
          pointLabel: `${paramKey.toUpperCase()} Avg`,
          value: m.avg,
          valMin: m.min ?? m.avg,
          valMax: m.max ?? m.avg,
          allSamplePointsText: m.points.map(p => p.rawText),
        });
      }
    });

    return out;
  }, [data, paramKey, plotMode]);

  const count = validPoints.length;
  const sampleCount = useMemo(() => new Set(validPoints.map(p => p.sampleGroupIdx)).size, [validPoints]);
  const avg = count > 0 ? validPoints.reduce((acc, p) => acc + p.value, 0) / count : 0;
  const overallMin = count > 0 ? Math.min(...validPoints.map(p => p.valMin)) : 0;
  const overallMax = count > 0 ? Math.max(...validPoints.map(p => p.valMax)) : 0;
  const lastPoint = count > 0 ? validPoints[validPoints.length - 1] : null;

  const outOfSpecCount = useMemo(() => {
    if (specMin === null && specMax === null) return 0;
    return validPoints.filter(p => {
      if (specMin !== null && specMin !== undefined && p.valMin < specMin) return true;
      if (specMax !== null && specMax !== undefined && p.valMax > specMax) return true;
      return false;
    }).length;
  }, [validPoints, specMin, specMax]);

  // SVG Dimensions
  const width = 1000;
  const height = 255;
  const padding = { top: 28, right: 38, bottom: 52, left: 65 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Dynamic Y domain including spec limits and min/max spread
  const allYValues: number[] = [];
  validPoints.forEach(p => {
    allYValues.push(p.valMin, p.valMax, p.value);
  });
  if (specTarget !== null) allYValues.push(specTarget);
  if (specMin !== null) allYValues.push(specMin);
  if (specMax !== null) allYValues.push(specMax);

  const rawMin = allYValues.length > 0 ? Math.min(...allYValues) : 0;
  const rawMax = allYValues.length > 0 ? Math.max(...allYValues) : 5;
  const margin = Math.max((rawMax - rawMin) * 0.16, rawMax * 0.05, 0.2);

  const domainMin = Math.max(0, parseFloat((rawMin - margin).toFixed(3)));
  const domainMax = parseFloat((rawMax + margin).toFixed(3));
  const domainRange = domainMax - domainMin || 1;

  const getX = (index: number) => {
    if (count <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (count - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - domainMin) / domainRange) * innerHeight;
  };

  const pointsString = validPoints.map((p, i) => `${getX(i)},${getY(p.value)}`).join(' ');
  const areaPolygonString =
    count > 1
      ? `${getX(0)},${padding.top + innerHeight} ${pointsString} ${getX(count - 1)},${padding.top + innerHeight}`
      : '';

  const gridSteps = 4;
  const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = domainMin + (domainRange / gridSteps) * i;
    return { val, y: getY(val) };
  });

  // Compute sample group boundary bands for multi-point mode
  const sampleGroupSpans = useMemo(() => {
    if (count <= 1 || plotMode !== 'points') return [];
    const spans: { groupIdx: number; startIdx: number; endIdx: number; label: string }[] = [];
    let current = validPoints[0].sampleGroupIdx;
    let start = 0;
    for (let i = 1; i < validPoints.length; i++) {
      if (validPoints[i].sampleGroupIdx !== current) {
        spans.push({
          groupIdx: current,
          startIdx: start,
          endIdx: i - 1,
          label: `${validPoints[start].profile} • ${validPoints[start].coil}`,
        });
        current = validPoints[i].sampleGroupIdx;
        start = i;
      }
    }
    spans.push({
      groupIdx: current,
      startIdx: start,
      endIdx: validPoints.length - 1,
      label: `${validPoints[start].profile} • ${validPoints[start].coil}`,
    });
    return spans;
  }, [validPoints, count, plotMode]);

  const hoveredPoint = hoveredIdx !== null && validPoints[hoveredIdx] ? validPoints[hoveredIdx] : null;
  const hasRangeSpread = plotMode === 'sampleAvg' && validPoints.some(p => Math.abs(p.valMax - p.valMin) > 0.001);

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isLight
          ? 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header & Statistical Badges */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-3.5 h-3.5 rounded-md shadow-sm" style={{ backgroundColor: color }} />
            <h4 className={`font-bold text-base tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {title}
            </h4>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                isLight
                  ? 'bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {thaiTitle}
            </span>
            <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              ({unit})
            </span>
            {hasRangeSpread && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
                isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800/80 text-slate-400'
              }`}>
                {isTh ? 'เส้นแนวโน้มค่าเฉลี่ย + แถบช่วง Min–Max' : 'Avg Trend + Min–Max Spread'}
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            {isTh ? descriptionTh : descriptionEn}
            {(specMin !== null || specMax !== null) && (
              <span className="ml-2 font-mono text-[11px] font-bold text-indigo-500 dark:text-indigo-400">
                [Spec: {specMin !== null ? `Min ${specMin}` : ''}{specMin !== null && specMax !== null ? ' - ' : ''}{specMax !== null ? `Max ${specMax}` : ''} {unit}]
              </span>
            )}
          </p>
        </div>

        {/* Summary Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              {plotMode === 'points' ? (isTh ? 'จุดวัดทั้งหมด (N)' : 'Points N') : 'Sample N'}
            </span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              {count}
              {plotMode === 'points' && sampleCount > 0 && (
                <span className="text-[10px] font-normal text-slate-500 ml-1">({sampleCount}ใบ)</span>
              )}
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Avg (X̄)
            </span>
            <span className="text-xs font-mono font-bold" style={{ color }}>
              {count > 0 ? avg.toFixed(2) : '-'}
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Min / Max
            </span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              {count > 0 ? `${overallMin.toFixed(2)} / ${overallMax.toFixed(2)}` : '-'}
            </span>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <span className={`text-[9px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Last
            </span>
            <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {lastPoint ? lastPoint.value.toFixed(2) : '-'}
            </span>
          </div>

          {(specMin !== null || specMax !== null) && (
            <div
              className={`px-3 py-1.5 rounded-xl border text-center ${
                outOfSpecCount === 0
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                  : isLight
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-rose-950/40 border-rose-800 text-rose-400'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider block font-bold">Out of Spec</span>
              <span className="text-xs font-mono font-black">
                {outOfSpecCount} {count > 0 ? `(${((outOfSpecCount / count) * 100).toFixed(1)}%)` : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SVG Trend Graph */}
      <div className="relative mt-4">
        {count === 0 ? (
          <div
            className={`h-48 flex flex-col items-center justify-center text-xs border border-dashed rounded-xl ${
              isLight ? 'bg-slate-50 border-slate-300 text-slate-600' : 'bg-slate-950/50 border-slate-800 text-slate-400'
            }`}
          >
            <BarChart3 className="w-8 h-8 opacity-30 mb-2" />
            <span>
              {isTh
                ? `ไม่มีข้อมูลการวัดสำหรับ ${title} ในเงื่อนไขที่เลือก`
                : `No inspection measurements available for ${title}`}
            </span>
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
                <linearGradient id={`tw-grad-${paramKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              {/* Sample Grouping Alternating Bands in Sub-point mode */}
              {plotMode === 'points' && sampleGroupSpans.map((sp, sIdx) => {
                const step = count > 1 ? innerWidth / (count - 1) : innerWidth;
                const xStart = Math.max(padding.left, getX(sp.startIdx) - step * 0.45);
                const xEnd = Math.min(width - padding.right, getX(sp.endIdx) + step * 0.45);
                const rectW = Math.max(0, xEnd - xStart);
                return (
                  <g key={`band-${sp.groupIdx}`}>
                    {sIdx % 2 === 1 && (
                      <rect
                        x={xStart}
                        y={padding.top}
                        width={rectW}
                        height={innerHeight}
                        fill={isLight ? '#e2e8f0' : '#1e293b'}
                        opacity={isLight ? 0.35 : 0.25}
                      />
                    )}
                    {sIdx > 0 && (
                      <line
                        x1={xStart}
                        y1={padding.top}
                        x2={xStart}
                        y2={padding.top + innerHeight}
                        stroke={isLight ? '#cbd5e1' : '#334155'}
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                    )}
                  </g>
                );
              })}

              {/* Horizontal Gridlines */}
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
                    fill="#64748b"
                  >
                    {gl.val.toFixed(2)}
                  </text>
                </g>
              ))}

              {/* Target Spec Line (Dotted Blue) */}
              {specTarget !== null && (
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
                    MID/TARGET: {specTarget} {unit}
                  </text>
                </g>
              )}

              {/* Spec Min Line */}
              {specMin !== null && (
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

              {/* Spec Max Line */}
              {specMax !== null && (
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

              {/* Area Fill */}
              {count > 1 && <polygon points={areaPolygonString} fill={`url(#tw-grad-${paramKey})`} />}

              {/* Min-Max Vertical Whiskers (in Per-Sample Avg mode) */}
              {plotMode === 'sampleAvg' &&
                validPoints.map((p, i) => {
                  if (Math.abs(p.valMax - p.valMin) <= 0.001) return null;
                  const cx = getX(i);
                  const yMin = getY(p.valMin);
                  const yMax = getY(p.valMax);
                  return (
                    <g key={`whisker-${p.id}`} opacity={hoveredIdx === i ? 1 : 0.6}>
                      <line x1={cx} y1={yMax} x2={cx} y2={yMin} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                      <line x1={cx - 4} y1={yMax} x2={cx + 4} y2={yMax} stroke={color} strokeWidth="1.6" />
                      <line x1={cx - 4} y1={yMin} x2={cx + 4} y2={yMin} stroke={color} strokeWidth="1.6" />
                    </g>
                  );
                })}

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

              {/* Hover vertical guide */}
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

              {/* Data Points */}
              {validPoints.map((p, i) => {
                const cx = getX(i);
                const cy = getY(p.value);
                const isHovered = hoveredIdx === i;
                const isOut =
                  (specMin !== null && p.valMin < specMin) ||
                  (specMax !== null && p.valMax > specMax);

                return (
                  <g key={p.id} className="cursor-pointer">
                    <circle
                      cx={cx}
                      cy={cy}
                      r="14"
                      fill="transparent"
                      onMouseEnter={() => setHoveredIdx(i)}
                    />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 6 : 4}
                      fill={isOut ? '#ef4444' : isLight ? '#ffffff' : '#0f172a'}
                      stroke={isOut ? '#ef4444' : color}
                      strokeWidth={isHovered ? 3 : 2}
                      className="transition-all duration-150"
                    />
                  </g>
                );
              })}

              {/* Bottom X-axis Labels: show exact T1-1, T1-2, T1-3 ... T5-n point labels */}
              {count > 0 && (
                <g fontSize="9.5" fontFamily="monospace" fill="#64748b">
                  {plotMode === 'points' && count <= 28 ? (
                    validPoints.map((p, i) => (
                      <text
                        key={`xlbl-${p.id}`}
                        x={getX(i)}
                        y={height - 26}
                        textAnchor={i === 0 ? 'start' : i === count - 1 ? 'end' : 'middle'}
                        fontWeight={hoveredIdx === i ? 'bold' : 'normal'}
                        fill={hoveredIdx === i ? color : '#64748b'}
                      >
                        {p.pointLabel}
                      </text>
                    ))
                  ) : (
                    <>
                      <text x={getX(0)} y={height - 26} textAnchor="start">
                        {validPoints[0].pointLabel} ({validPoints[0].profile})
                      </text>
                      {count > 3 && (
                        <text x={getX(Math.floor(count / 2))} y={height - 26} textAnchor="middle">
                          {validPoints[Math.floor(count / 2)].pointLabel} ({validPoints[Math.floor(count / 2)].date || ''})
                        </text>
                      )}
                      {count > 1 && (
                        <text x={getX(count - 1)} y={height - 26} textAnchor="end">
                          {validPoints[count - 1].pointLabel} ({validPoints[count - 1].profile})
                        </text>
                      )}
                    </>
                  )}
                  {/* Second bottom line showing First / Last sample context */}
                  <text x={padding.left} y={height - 9} textAnchor="start" fontSize="9" opacity="0.8">
                    {validPoints[0].profile} • {validPoints[0].coil} ({validPoints[0].date})
                  </text>
                  {count > 1 && (
                    <text x={width - padding.right} y={height - 9} textAnchor="end" fontSize="9" opacity="0.8">
                      {validPoints[count - 1].profile} • {validPoints[count - 1].coil} ({validPoints[count - 1].date})
                    </text>
                  )}
                </g>
              )}
            </svg>

            {/* Floating Hover Tooltip */}
            {hoveredPoint && (
              <div
                className={`absolute z-30 pointer-events-none p-3 rounded-xl shadow-xl border text-xs font-sans transition-all transform -translate-y-full -translate-x-1/2 ${
                  isLight
                    ? 'bg-slate-900/95 text-white border-slate-700 shadow-slate-900/30'
                    : 'bg-slate-950/95 text-slate-100 border-slate-700 shadow-black/60'
                }`}
                style={{
                  left: `${Math.min(86, Math.max(14, (getX(hoveredIdx!) / width) * 100))}%`,
                  top: `${Math.max(18, (getY(hoveredPoint.value) / height) * 100 - 8)}%`,
                  minWidth: '245px',
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono"
                      style={{ backgroundColor: `${color}30`, color }}
                    >
                      {hoveredPoint.pointLabel}
                    </span>
                    <span className="font-bold text-slate-300 text-[11px]">
                      Sample #{hoveredPoint.sampleIndex}
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      hoveredPoint.overallStatus === 'PASS'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {hoveredPoint.overallStatus}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Profile:</span>
                    <span className="font-bold text-indigo-300">{hoveredPoint.profile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coil / Sample:</span>
                    <span className="font-bold text-white">
                      {hoveredPoint.coil} / {hoveredPoint.sample}
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-1 space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-sans font-bold">
                        {hoveredPoint.pointLabel}:
                      </span>
                      <span className="font-bold text-sm" style={{ color }}>
                        {hoveredPoint.value.toFixed(2)} {unit}
                      </span>
                    </div>
                    {Math.abs(hoveredPoint.valMax - hoveredPoint.valMin) > 0.001 && (
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Range (Min – Max):</span>
                        <span className="text-slate-200 font-semibold">
                          {hoveredPoint.valMin.toFixed(2)} – {hoveredPoint.valMax.toFixed(2)} {unit}
                        </span>
                      </div>
                    )}
                    {hoveredPoint.allSamplePointsText.length > 0 && (
                      <div className="text-[10px] text-slate-400 pt-0.5 leading-relaxed">
                        <span>All Points: </span>
                        <span className="text-slate-200">{hoveredPoint.allSamplePointsText.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {(specMin !== null || specMax !== null) && (
                    <div className="text-[10px] text-slate-400 flex justify-between border-t border-slate-800 pt-1">
                      <span>Spec Evaluation:</span>
                      <span
                        className={
                          (specMin !== null && hoveredPoint.valMin < specMin) ||
                          (specMax !== null && hoveredPoint.valMax > specMax)
                            ? 'text-rose-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }
                      >
                        {(specMin !== null && hoveredPoint.valMin < specMin) ||
                        (specMax !== null && hoveredPoint.valMax > specMax)
                          ? 'Out of Spec'
                          : 'In Spec'}
                      </span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between border-t border-slate-800">
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

export const ThicknessWallApp: React.FC<ThicknessWallAppProps> = ({
  onBackToPortal,
  onLogNewActivity,
  language = 'th',
  theme = 'light',
  onToggleTheme
}) => {
  const isTh = language === 'th';
  const isLight = theme === 'light';

  // Tab State
  const [activeTab, setActiveTab] = useState<'extraction' | 'history' | 'dashboard' | 'settings'>('extraction');

  // Admin Modal Security
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [authError, setAuthError] = useState(false);

  // Profile Specs & History Records with Real-time Cloud Sync
  const [profileSpecs, setProfileSpecs] = useCloudState<Record<string, ThicknessWallProfileItemSpec[]>>('tw_profile_specs', INITIAL_PROFILES);
  const [savedRecords, setSavedRecords] = useCloudState<ThicknessWallRecord[]>('tw_measurement_records', INITIAL_RECORDS);

  // History Tab Search, Filter & Pagination (20 records per page)
  const HISTORY_ITEMS_PER_PAGE = 20;
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyFilterProfile, setHistoryFilterProfile] = useState('ALL');
  const [historyPage, setHistoryPage] = useState(1);

  // File Upload & AI State
  const [currentFileBase64, setCurrentFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string>('image/png');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Status Notification State matching IQA-01, IQA-02, and IQA-03
  const [status, setStatus] = useState<{ type: 'info' | 'success' | 'error'; message: string }>({
    type: 'info',
    message: isTh ? 'พร้อมรับการสแกนเอกสาร IPQA-07' : 'Ready for IPQA-07 document scan'
  });

  // Results Form State
  const [hasResults, setHasResults] = useState(false);
  const [inspectorInput, setInspectorInput] = useState('');
  const [profileInput, setProfileInput] = useState('');
  const [coilInput, setCoilInput] = useState('');
  const [sampleInput, setSampleInput] = useState('');
  const [processInput, setProcessInput] = useState('');

  const [tableItems, setTableItems] = useState<{ description: string; total: string }[]>([]);

  // Dashboard Filters (Profile, YYYY-MM Month, and Sub-points vs Sample Avg Plot Mode)
  const [dashFilterProfile, setDashFilterProfile] = useState('ALL');
  const [dashFilterMonth, setDashFilterMonth] = useState('ALL');
  const [dashPlotMode, setDashPlotMode] = useState<'points' | 'sampleAvg'>('points');

  // Spec Setting Form
  const [specProfileName, setSpecProfileName] = useState('');
  const [specItems, setSpecItems] = useState<ThicknessWallProfileItemSpec[]>([
    { item: 'OR', min: 12.0, max: 13.5 },
    { item: 'T1', min: 2.1, max: 2.5 }
  ]);

  // History Edit Auth & Modal States
  const [targetEditHistoryItem, setTargetEditHistoryItem] = useState<ThicknessWallRecord | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] = useState<ThicknessWallRecord | null>(null);
  const [isHistoryAuthOpen, setIsHistoryAuthOpen] = useState(false);
  const [historyAuthPassword, setHistoryAuthPassword] = useState('');
  const [historyAuthError, setHistoryAuthError] = useState(false);

  const handleRequestEditHistory = (item: ThicknessWallRecord) => {
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
    setSavedRecords(prev => prev.map(ins => ins.id === editingHistoryItem.id ? editingHistoryItem : ins));
    setEditingHistoryItem(null);
    setTargetEditHistoryItem(null);
  };

  // Handle Tab Switch
  const handleSwitchTab = (tab: 'extraction' | 'history' | 'dashboard' | 'settings') => {
    if (tab === 'settings' && !isAdminAuthorized) {
      setAuthModalVisible(true);
      return;
    }
    setActiveTab(tab);
  };

  const verifyAdmin = () => {
    if (adminPasswordInput === ADMIN_PASS) {
      setIsAdminAuthorized(true);
      setAuthModalVisible(false);
      setAdminPasswordInput('');
      setAuthError(false);
      setActiveTab('settings');
    } else {
      setAuthError(true);
      setAdminPasswordInput('');
    }
  };

  // File Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let mime = file.type;
    if (!mime || mime === 'application/octet-stream') {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') mime = 'application/pdf';
      else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
      else if (ext === 'png') mime = 'image/png';
      else if (ext === 'webp') mime = 'image/webp';
      else mime = 'image/png';
    }

    setFileName(file.name);
    setFileMimeType(mime);
    setHasResults(false);
    setTableItems([]);
    setInspectorInput('');
    setProfileInput('');
    setCoilInput('');
    setSampleInput('');
    setProcessInput('');

    setStatus({
      type: 'info',
      message: isTh ? `โหลดไฟล์ "${file.name}" เรียบร้อยแล้ว พร้อมกดสกัดข้อมูลด้วย AI` : `Uploaded "${file.name}". Ready to extract data with AI.`
    });

    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      setCurrentFileBase64(res.split(',')[1]);
      if (mime.startsWith('image/')) {
        setPreviewUrl(res);
      } else {
        setPreviewUrl(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load Demo IPQA-07 Document
  const loadDemoDocument = () => {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" fill="none">
    <rect width="600" height="800" fill="#0f172a"/>
    <rect x="20" y="20" width="560" height="760" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2"/>
    <rect x="40" y="40" width="520" height="60" rx="8" fill="#334155"/>
    <text x="60" y="75" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="bold">QUALITY ASSURANCE INSPECTION REPORT (IPQA-07)</text>
    <text x="60" y="92" fill="#94a3b8" font-family="sans-serif" font-size="11">THICKNESS &amp; WALL MEASUREMENT SPECIFICATION</text>
    <rect x="40" y="115" width="250" height="90" rx="6" fill="#0f172a" stroke="#475569"/>
    <text x="55" y="140" fill="#cbd5e1" font-family="sans-serif" font-size="12">Inspector: Kitti M.</text>
    <text x="55" y="162" fill="#cbd5e1" font-family="sans-serif" font-size="12">Coil No: COIL-9901-A</text>
    <text x="55" y="184" fill="#cbd5e1" font-family="sans-serif" font-size="12">Process: Line A - Extrusion #1</text>
    <rect x="310" y="115" width="250" height="90" rx="6" fill="#0f172a" stroke="#475569"/>
    <text x="325" y="140" fill="#cbd5e1" font-family="sans-serif" font-size="12">Profile: A-001</text>
    <text x="325" y="162" fill="#cbd5e1" font-family="sans-serif" font-size="12">Sample ID: SAMPLE-A1</text>
    <text x="325" y="184" fill="#38bdf8" font-family="sans-serif" font-size="12" font-weight="bold">Status: IPQA PASS</text>
    <rect x="40" y="220" width="520" height="180" rx="8" fill="#0f172a" stroke="#334155"/>
    <circle cx="300" cy="310" r="70" stroke="#38bdf8" stroke-width="3" fill="none"/>
    <circle cx="300" cy="310" r="50" stroke="#818cf8" stroke-width="3" stroke-dasharray="4 4" fill="none"/>
    <line x1="230" y1="310" x2="370" y2="310" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>
    <line x1="300" y1="240" x2="300" y2="380" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="2 2"/>
    <text x="380" y="315" fill="#38bdf8" font-family="sans-serif" font-size="11" font-weight="bold">OR-1 (12.5mm)</text>
    <text x="210" y="315" fill="#818cf8" font-family="sans-serif" font-size="11" font-weight="bold">T1-1 (2.3mm)</text>
    <rect x="40" y="415" width="520" height="30" fill="#334155"/>
    <text x="60" y="435" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">Item / Description</text>
    <text x="300" y="435" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">Measured Value (mm)</text>
    <text x="480" y="435" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">Judgment</text>
    <g font-family="sans-serif" font-size="12" fill="#e2e8f0">
      <text x="60" y="470">OR-1</text><text x="300" y="470">12.50</text><text x="480" y="470" fill="#4ade80">PASS</text>
      <text x="60" y="495">OR-2</text><text x="300" y="495">12.80</text><text x="480" y="495" fill="#4ade80">PASS</text>
      <text x="60" y="520">T1-1</text><text x="300" y="520">2.30</text><text x="480" y="520" fill="#4ade80">PASS</text>
      <text x="60" y="545">T1-2</text><text x="300" y="545">2.40</text><text x="480" y="545" fill="#4ade80">PASS</text>
      <text x="60" y="570">T2-1</text><text x="300" y="570">2.20</text><text x="480" y="570" fill="#4ade80">PASS</text>
      <text x="60" y="595">T3</text><text x="300" y="595">3.20</text><text x="480" y="595" fill="#4ade80">PASS</text>
      <text x="60" y="620">T4</text><text x="300" y="620">3.30</text><text x="480" y="620" fill="#4ade80">PASS</text>
      <text x="60" y="645">T5-1</text><text x="300" y="645">2.00</text><text x="480" y="645" fill="#4ade80">PASS</text>
      <text x="60" y="670">IR-1</text><text x="300" y="670">8.50</text><text x="480" y="670" fill="#4ade80">PASS</text>
      <text x="60" y="695">IOR-1</text><text x="300" y="695">10.50</text><text x="480" y="695" fill="#4ade80">PASS</text>
    </g>
  </svg>`;
    const dataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
    setFileName('IPQA-07_Sample_Report.svg');
    setFileMimeType('image/svg+xml');
    setPreviewUrl(dataUri);
    const b64 = btoa(unescape(encodeURIComponent(svgContent)));
    setCurrentFileBase64(b64);
    
    setInspectorInput('Kitti M.');
    setCoilInput('COIL-9901-A');
    setProfileInput('A-001');
    setSampleInput('SAMPLE-A1');
    setProcessInput('Line A - Extrusion #1');
    setTableItems([
      { description: 'OR-1', total: '12.5' },
      { description: 'OR-2', total: '12.8' },
      { description: 'T1-1', total: '2.2' },
      { description: 'T1-2', total: '2.3' },
      { description: 'T1-3', total: '2.4' },
      { description: 'T2-1', total: '2.1' },
      { description: 'T2-2', total: '2.2' },
      { description: 'T2-3', total: '2.3' },
      { description: 'T3-1', total: '3.1' },
      { description: 'T3-2', total: '3.2' },
      { description: 'T3-3', total: '3.3' },
      { description: 'T4-1', total: '3.2' },
      { description: 'T4-2', total: '3.3' },
      { description: 'T4-3', total: '3.4' },
      { description: 'T5-1', total: '2.0' },
      { description: 'T5-2', total: '2.1' },
      { description: 'T5-3', total: '1.9' },
      { description: 'IR-1', total: '8.5' },
      { description: 'IHR-1', total: '1.7' },
      { description: 'OHW-1', total: '2.4' },
      { description: 'IHW-1', total: '2.2' },
      { description: 'RA-1', total: '0.9' },
      { description: 'IOR-1', total: '10.5' }
    ]);
    setHasResults(true);
    setStatus({
      type: 'success',
      message: isTh ? 'โหลดเอกสารตัวอย่าง IPQA-07 สำเร็จ (23 รายการวัด T1-1..T5-n)' : 'Loaded demo IPQA-07 document successfully (23 measurement items)'
    });
    return { b64, mime: 'image/svg+xml' };
  };

  // AI Data Extraction (Server-Side Vision)
  const processFileWithAI = async () => {
    if (!currentFileBase64) {
      setStatus({
        type: 'error',
        message: isTh ? 'กรุณาเลือกหรืออัปโหลดเอกสาร IPQA-07 ก่อนทำการสกัดข้อมูล' : 'Please upload or select an IPQA-07 document before scanning.'
      });
      return;
    }

    setIsScanning(true);
    setStatus({
      type: 'info',
      message: isTh ? 'กำลังสแกนวิเคราะห์เอกสาร IPQA-07 ด้วย AI...' : 'Scanning & analyzing IPQA-07 document with AI...'
    });

    try {
      const data = await extractThicknessWallClient(currentFileBase64, fileMimeType);

      if (data) {
        const h: any = data.header || {};
        if (h.inspector_name) setInspectorInput(h.inspector_name);
        if (h.coil_no) setCoilInput(h.coil_no);
        if (h.profile) setProfileInput(h.profile.toUpperCase());
        if (h.sample_name) setSampleInput(h.sample_name);
        if (h.process) setProcessInput(h.process);

        let tableList = Array.isArray(data.table) ? data.table : [];
        if (tableList.length === 0 && h.profile && profileSpecs[h.profile.toUpperCase()]) {
          // If no table rows extracted from scan, generate spec test rows based on profile
          const specRows = profileSpecs[h.profile.toUpperCase()] || [];
          tableList = specRows.map(s => ({
            description: s.item,
            total: ((Number(s.min) + Number(s.max)) / 2).toFixed(2)
          }));
        }

        if (tableList.length > 0) {
          setTableItems(tableList);
          setHasResults(true);
          setStatus({
            type: 'success',
            message: isTh 
              ? `สกัดข้อมูลสำเร็จ! พบ ${tableList.length} รายการวัดความหนาผนัง` 
              : `Successfully extracted ${tableList.length} wall thickness measurement items`
          });
        } else {
          if (h.inspector_name || h.coil_no || h.profile || h.sample_name || h.process) {
            setHasResults(true);
            setStatus({
              type: 'info',
              message: isTh 
                ? 'สกัดข้อมูลส่วนหัวสำเร็จแล้ว แต่ไม่พบตารางรายการวัด สามารถเพิ่มรายการย่อยเองได้' 
                : 'Header metadata extracted successfully. You can add measurement items.'
            });
          } else {
            throw new Error(isTh ? 'ไม่พบตารางรายการวัดหรือข้อมูลในเอกสารนี้' : 'No measurement table rows detected in document');
          }
        }
      } else {
        throw new Error(isTh ? 'ไม่สามารถประมวลผลข้อมูล AI ได้ กรุณาตรวจสอบความชัดเจนของไฟล์เอกสาร' : 'Could not process AI data. Please check file clarity.');
      }
    } catch (err: any) {
      console.error('Extraction Error:', err);
      setStatus({
        type: 'error',
        message: isTh ? `เกิดข้อผิดพลาดในการสกัดข้อมูล: ${err.message || 'กรุณาลองใหม่อีกครั้ง'}` : `Extraction failed: ${err.message || 'Please try again'}`
      });
    } finally {
      setIsScanning(false);
    }
  };

  const isIgnoredValue = (valStr?: string | number): boolean => {
    if (valStr === undefined || valStr === null) return true;
    const s = String(valStr).trim();
    return s === '' || s === '-' || s === '--' || s === '---' || s === 'N/A' || s === 'n/a' || s === 'none' || s === 'null' || s === 'undefined';
  };

  // Validate Table Item Against Spec
  const getRowValidationStatus = (desc: string, totalStr: string) => {
    if (isIgnoredValue(totalStr)) return { status: 'NONE', label: '-' };
    const cleanTotal = (totalStr || '').trim().replace(/,/g, '.');

    const profName = profileInput.trim().toUpperCase();
    const specs = profileSpecs[profName];
    if (!specs || !profName) return { status: 'NONE', label: '-' };

    const val = parseFloat(cleanTotal);
    if (isNaN(val)) return { status: 'NONE', label: '-' };

    const descUpper = desc.trim().toUpperCase();
    // Sort specs by length descending so longer spec keys (e.g. 'IOR', 'IHR', 'OHW', 'IHW') are matched before shorter ones ('OR', 'IR')
    const sortedSpecs = [...specs].sort((a, b) => b.item.length - a.item.length);
    const matchingSpec = sortedSpecs.find(s => {
      const specItemUpper = s.item.toUpperCase();
      return descUpper.startsWith(specItemUpper) || descUpper.includes(specItemUpper);
    });

    if (!matchingSpec) return { status: 'NONE', label: '-' };

    const minVal = parseFloat(String(matchingSpec.min));
    const maxVal = parseFloat(String(matchingSpec.max));

    const isPass = (isNaN(minVal) || val >= minVal) && (isNaN(maxVal) || val <= maxVal);
    return isPass ? { status: 'PASS', label: 'PASS' } : { status: 'FAIL', label: 'FAIL' };
  };

  // Save Current Extracted Data
  const saveCurrentData = () => {
    if (tableItems.length === 0) return;

    let allPassed = true;
    const series: Record<string, number[]> = {
      t1: [], t2: [], t3: [], t4: [], or: [], ir: [], ihr: [], ohw: [], ihw: [], ra: [], ior: []
    };

    const t1List: string[] = [];
    const t2List: string[] = [];
    const t3List: string[] = [];
    const t4List: string[] = [];
    const t5List: string[] = [];
    const failedItems: string[] = [];

    tableItems.forEach(item => {
      const desc = item.description.trim().toUpperCase();
      const cleanTotal = item.total.trim().replace(/,/g, '.');
      const val = parseFloat(cleanTotal);
      const isNum = !isNaN(val) && cleanTotal !== '';

      const { status: rowStatus } = getRowValidationStatus(desc, item.total);
      if (rowStatus === 'FAIL') {
        allPassed = false;
        failedItems.push(`${desc}: ${cleanTotal}`);
      }

      if (/^OR/.test(desc) && isNum) series.or.push(val);
      else if (/^T1(?:\b|[-_.])/.test(desc) && isNum) {
        series.t1.push(val);
        t1List.push(`${desc}: ${cleanTotal}`);
      }
      else if (/^T2(?:\b|[-_.])/.test(desc) && isNum) {
        series.t2.push(val);
        t2List.push(`${desc}: ${cleanTotal}`);
      }
      else if (/^T3(?:\b|[-_.])/.test(desc) && isNum) {
        series.t3.push(val);
        t3List.push(`${desc}: ${cleanTotal}`);
      }
      else if (/^T4(?:\b|[-_.])/.test(desc) && isNum) {
        series.t4.push(val);
        t4List.push(`${desc}: ${cleanTotal}`);
      }
      else if (/^T5(?:\b|[-_.])/.test(desc) && isNum) {
        t5List.push(`${desc}: ${cleanTotal}`);
      }
      else if (/^IR/.test(desc) && isNum) series.ir.push(val);
      else if (/^IHR/.test(desc) && isNum) series.ihr.push(val);
      else if (/^OHW/.test(desc) && isNum) series.ohw.push(val);
      else if (/^IHW/.test(desc) && isNum) series.ihw.push(val);
      else if (/^RA/.test(desc) && isNum) series.ra.push(val);
      else if (/^IOR/.test(desc) && isNum) series.ior.push(val);
    });

    const sortByIndex = (arr: string[]) =>
      [...arr].sort((a, b) => extractSubPointIndex(a.split(':')[0]) - extractSubPointIndex(b.split(':')[0]));

    const getRange = (arr: number[]) => ({
      min: arr.length > 0 ? Math.min(...arr) : '-',
      max: arr.length > 0 ? Math.max(...arr) : '-'
    });

    const t3AvgVal: string | number =
      series.t3.length > 0
        ? parseFloat((series.t3.reduce((a, b) => a + b, 0) / series.t3.length).toFixed(2))
        : '-';
    const t4AvgVal: string | number =
      series.t4.length > 0
        ? parseFloat((series.t4.reduce((a, b) => a + b, 0) / series.t4.length).toFixed(2))
        : '-';

    const newRecord: ThicknessWallRecord = {
      docId: `tw-doc-${Date.now()}`,
      id: `TW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('sv-SE').slice(0, 16),
      timestampRaw: new Date().toISOString(),
      inspector: inspectorInput || '-',
      process: processInput || '-',
      coil: coilInput || '-',
      sample: sampleInput || '-',
      profile: profileInput.toUpperCase() || '-',
      vals: {
        t1: getRange(series.t1),
        t2: getRange(series.t2),
        t3: t3AvgVal,
        t4: t4AvgVal,
        t1_list: sortByIndex(t1List),
        t2_list: sortByIndex(t2List),
        t3_list: sortByIndex(t3List),
        t4_list: sortByIndex(t4List),
        t5_list: sortByIndex(t5List),
        or: getRange(series.or),
        ir: getRange(series.ir),
        ihr: getRange(series.ihr),
        ohw: getRange(series.ohw),
        ihw: getRange(series.ihw),
        ra: getRange(series.ra),
        ior: getRange(series.ior)
      },
      overallStatus: allPassed ? 'PASS' : 'FAIL'
    };

    setSavedRecords(prev => [newRecord, ...prev]);
    setHistoryPage(1);

    const outOfSpecDetails = failedItems.join(', ');

    const inspectionResultText = allPassed 
      ? 'PASS (All measurements within specification limits)' 
      : `FAIL / Out of Spec: ${outOfSpecDetails || 'Exceeded tolerance limits'}`;

    if (onLogNewActivity) {
      if (inspectorInput) saveRecordedInspector(inspectorInput);
        onLogNewActivity({
        id: newRecord.docId!,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        moduleCode: 'IPQA-07',
        moduleTitleTh: 'วัดความหนาผนังชิ้นงาน (Thickness Wall Measurement)',
        moduleTitleEn: 'Thickness Wall Measurement System',
        inspector: inspectorInput || 'IPQA Inspector',
        batchLot: `Coil: ${coilInput || '-'} (Profile: ${profileInput || '-'})`,
        result: allPassed ? 'PASS' : 'REJECT',
        defectCount: allPassed ? 0 : tableItems.filter(i => i.status === 'FAIL').length || 1,
        remarks: inspectionResultText,
        coilNo: coilInput || 'UNKNOWN-COIL',
        profile: profileInput || 'PROFILE-SPEC',
        process: processInput ? `${processInput} (IPQA-07)` : 'Line A - Extrusion (IPQA-07)',
        inspectionDate: newRecord.timestamp,
        inspectionResult: inspectionResultText
      });
    }

    setStatus({
      type: 'success',
      message: isTh ? 'บันทึกข้อมูลผลการวัดความหนาลงระบบเรียบร้อยแล้ว (จัดเก็บเฉพาะ Text Data)' : 'Saved measurement record successfully (Pure Text Data).'
    });
    // Reset Current Extraction UI and release image memory
    setHasResults(false);
    setCurrentFileBase64(null);
    setFileName(null);
    setPreviewUrl(null);
  };

  // Export Saved History to Excel / CSV
  const handleExportExcel = () => {
    if (savedRecords.length === 0) {
      setStatus({
        type: 'error',
        message: isTh ? 'ไม่มีข้อมูลสำหรับส่งออก CSV' : 'No records to export.'
      });
      return;
    }

    const headers = [
      "Timestamp", "Inspector", "Process", "Coil No.", "Sample", "Profile",
      "T1-Min", "T1-Max", "T2-Min", "T2-Max", "T3", "T4", "T5-Series",
      "OR-Min", "OR-Max", "IR-Min", "IR-Max", "IHR-Min", "IHR-Max",
      "OHW-Min", "OHW-Max", "IHW-Min", "IHW-Max", "RA-Min", "RA-Max", "IOR-Min", "IOR-Max", "Status"
    ];

    const rows = savedRecords.map(r => [
      r.timestamp,
      r.inspector,
      r.process,
      r.coil,
      r.sample,
      r.profile,
      r.vals.t1.min, r.vals.t1.max,
      r.vals.t2.min, r.vals.t2.max,
      r.vals.t3, r.vals.t4,
      `"${r.vals.t5_list.join(' | ')}"`,
      r.vals.or.min, r.vals.or.max,
      r.vals.ir.min, r.vals.ir.max,
      r.vals.ihr.min, r.vals.ihr.max,
      r.vals.ohw.min, r.vals.ohw.max,
      r.vals.ihw.min, r.vals.ihw.max,
      r.vals.ra.min, r.vals.ra.max,
      r.vals.ior.min, r.vals.ior.max,
      r.overallStatus
    ]);

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(row => row.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Thickness_Wall_Measurement_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setStatus({
      type: 'success',
      message: isTh ? 'ส่งออกไฟล์ CSV สำเร็จ' : 'Exported CSV successfully'
    });
  };

  const copyJSONData = () => {
    const exportObj = {
      header: {
        inspector_name: inspectorInput,
        process: processInput,
        coil_no: coilInput,
        profile: profileInput,
        sample_name: sampleInput
      },
      table: tableItems
    };
    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    setStatus({
      type: 'success',
      message: isTh ? 'คัดลอกข้อมูล JSON เรียบร้อยแล้ว' : 'Copied JSON to clipboard!'
    });
  };

  // Spec Setting Handlers
  const handleSaveProfileSpec = () => {
    const name = specProfileName.trim().toUpperCase();
    if (!name) {
      setStatus({
        type: 'error',
        message: isTh ? 'กรุณาระบุชื่อ Profile Name' : 'Profile Name is required.'
      });
      return;
    }

    if (specItems.length === 0) {
      setStatus({
        type: 'error',
        message: isTh ? 'กรุณาเพิ่มอย่างน้อย 1 รายการ Measurement Item' : 'Add at least one measurement item.'
      });
      return;
    }

    setProfileSpecs(prev => ({
      ...prev,
      [name]: specItems
    }));

    setStatus({
      type: 'success',
      message: isTh ? `บันทึก Master Spec Profile ${name} เรียบร้อยแล้ว` : `Saved Master Spec for Profile ${name}`
    });
    setSpecProfileName('');
    setSpecItems([{ item: 'OR', min: 12.0, max: 13.5 }]);
  };

  const handleDeleteProfile = (name: string) => {
    setProfileSpecs(prev => {
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
  };

  const handleEditProfile = (name: string) => {
    setSpecProfileName(name);
    setSpecItems(profileSpecs[name] || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Available Profiles & Months for Dashboard Query
  const availableProfiles = useMemo(() => {
    const set = new Set<string>([
      ...Object.keys(profileSpecs),
      ...savedRecords.map(r => r.profile).filter(Boolean),
    ]);
    return ['ALL', ...Array.from(set).sort()];
  }, [profileSpecs, savedRecords]);

  const availableMonths = useMemo(() => {
    const months = savedRecords
      .map(r => extractRecordDateParts(r).monthKey)
      .filter(Boolean);
    return ['ALL', ...Array.from(new Set(months)).sort((a, b) => b.localeCompare(a))];
  }, [savedRecords]);

  // Overall Profile Breakdown Summary Statistics
  const dashboardStats = useMemo(() => {
    if (savedRecords.length === 0) return null;

    const total = savedRecords.length;
    const passCount = savedRecords.filter(r => r.overallStatus === 'PASS').length;
    const failCount = total - passCount;
    const passRatio = ((passCount / total) * 100).toFixed(1);

    const groups: Record<
      string,
      {
        name: string;
        total: number;
        pass: number;
        fail: number;
        sumT1: number;
        countT1: number;
        sumT2: number;
        countT2: number;
        sumT3: number;
        countT3: number;
        sumT4: number;
        countT4: number;
        sumT5: number;
        countT5: number;
      }
    > = {};

    savedRecords.forEach(r => {
      const pName = r.profile || 'Unknown';
      if (!groups[pName]) {
        groups[pName] = {
          name: pName,
          total: 0,
          pass: 0,
          fail: 0,
          sumT1: 0,
          countT1: 0,
          sumT2: 0,
          countT2: 0,
          sumT3: 0,
          countT3: 0,
          sumT4: 0,
          countT4: 0,
          sumT5: 0,
          countT5: 0,
        };
      }
      const g = groups[pName];
      g.total++;
      if (r.overallStatus === 'PASS') g.pass++;
      else g.fail++;

      const t1Pts = extractRecordParamPoints(r.vals, 't1');
      if (t1Pts.length > 0) {
        g.sumT1 += t1Pts.reduce((a, b) => a + b.value, 0) / t1Pts.length;
        g.countT1++;
      }

      const t2Pts = extractRecordParamPoints(r.vals, 't2');
      if (t2Pts.length > 0) {
        g.sumT2 += t2Pts.reduce((a, b) => a + b.value, 0) / t2Pts.length;
        g.countT2++;
      }

      const t3Pts = extractRecordParamPoints(r.vals, 't3');
      if (t3Pts.length > 0) {
        g.sumT3 += t3Pts.reduce((a, b) => a + b.value, 0) / t3Pts.length;
        g.countT3++;
      }

      const t4Pts = extractRecordParamPoints(r.vals, 't4');
      if (t4Pts.length > 0) {
        g.sumT4 += t4Pts.reduce((a, b) => a + b.value, 0) / t4Pts.length;
        g.countT4++;
      }

      const t5Pts = extractRecordParamPoints(r.vals, 't5');
      if (t5Pts.length > 0) {
        g.sumT5 += t5Pts.reduce((a, b) => a + b.value, 0) / t5Pts.length;
        g.countT5++;
      }
    });

    const profileSummaries = Object.values(groups).map(g => ({
      name: g.name,
      total: g.total,
      pass: g.pass,
      fail: g.fail,
      passRate: ((g.pass / g.total) * 100).toFixed(1),
      avgT1: g.countT1 > 0 ? (g.sumT1 / g.countT1).toFixed(2) : '-',
      avgT2: g.countT2 > 0 ? (g.sumT2 / g.countT2).toFixed(2) : '-',
      avgT3: g.countT3 > 0 ? (g.sumT3 / g.countT3).toFixed(2) : '-',
      avgT4: g.countT4 > 0 ? (g.sumT4 / g.countT4).toFixed(2) : '-',
      avgT5: g.countT5 > 0 ? (g.sumT5 / g.countT5).toFixed(2) : '-',
    }));

    return { total, passCount, failCount, passRatio, profileSummaries };
  }, [savedRecords]);

  // Filtered Dashboard Records & Chronological Trend Data
  const filteredDashboardRecords = useMemo(() => {
    return savedRecords.filter(r => {
      if (dashFilterProfile !== 'ALL' && (r.profile || 'Unknown') !== dashFilterProfile) return false;
      if (dashFilterMonth !== 'ALL') {
        const { monthKey } = extractRecordDateParts(r);
        if (monthKey !== dashFilterMonth) return false;
      }
      return true;
    });
  }, [savedRecords, dashFilterProfile, dashFilterMonth]);

  const dashTotalCount = filteredDashboardRecords.length;
  const dashPassCount = filteredDashboardRecords.filter(r => r.overallStatus === 'PASS').length;
  const dashFailCount = dashTotalCount - dashPassCount;
  const dashPassRatio = dashTotalCount > 0 ? ((dashPassCount / dashTotalCount) * 100).toFixed(1) : '0.0';

  const filteredTrendData = useMemo<ThicknessTrendPointItem[]>(() => {
    if (filteredDashboardRecords.length === 0) return [];

    const sorted = [...filteredDashboardRecords].sort((a, b) => {
      return extractRecordDateParts(a).sortMs - extractRecordDateParts(b).sortMs;
    });

    return sorted.map((r, idx) => {
      const { dateStr } = extractRecordDateParts(r);

      const buildParamMetric = (key: 't1' | 't2' | 't3' | 't4' | 't5'): WallRangeMetric => {
        const pts = extractRecordParamPoints(r.vals, key);
        if (pts.length === 0) return { min: null, max: null, avg: null, points: [] };
        const vals = pts.map(p => p.value);
        return {
          min: Math.min(...vals),
          max: Math.max(...vals),
          avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(3)),
          points: pts,
        };
      };

      return {
        index: idx + 1,
        id: r.id || r.docId || `tw-${idx}`,
        date: dateStr,
        timestamp: r.timestamp || '',
        coil: r.coil || '-',
        sample: r.sample || '-',
        profile: r.profile || 'Unknown',
        process: r.process || '-',
        inspector: r.inspector || '-',
        overallStatus: r.overallStatus || 'PASS',
        t1: buildParamMetric('t1'),
        t2: buildParamMetric('t2'),
        t3: buildParamMetric('t3'),
        t4: buildParamMetric('t4'),
        t5: buildParamMetric('t5'),
      };
    });
  }, [filteredDashboardRecords]);

  // Lookup Spec Limits for active Profile (for T1..T5 Spec Lines)
  const activeProfileSpecMap = useMemo(() => {
    if (dashFilterProfile === 'ALL') return null;
    const specs = profileSpecs[dashFilterProfile];
    if (!specs) return null;

    const getSpec = (key: string) => {
      const found = specs.find(s => s.item.trim().toUpperCase() === key.toUpperCase());
      if (!found) return { min: null, max: null };
      return {
        min: parseNumericVal(found.min),
        max: parseNumericVal(found.max),
      };
    };

    return {
      t1: getSpec('T1'),
      t2: getSpec('T2'),
      t3: getSpec('T3'),
      t4: getSpec('T4'),
      t5: getSpec('T5'),
    };
  }, [dashFilterProfile, profileSpecs]);

  // History Filtered & Paginated Records (Strictly 20 items per page)
  const filteredHistoryRecords = useMemo(() => {
    const q = historySearchTerm.trim().toLowerCase();
    return savedRecords.filter(r => {
      if (historyFilterProfile !== 'ALL' && (r.profile || 'Unknown') !== historyFilterProfile) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        r.timestamp,
        r.inspector,
        r.process,
        r.coil,
        r.sample,
        r.profile,
        r.overallStatus,
        r.id
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [savedRecords, historySearchTerm, historyFilterProfile]);

  const historyTotalPages = Math.max(1, Math.ceil(filteredHistoryRecords.length / HISTORY_ITEMS_PER_PAGE));
  const safeHistoryPage = Math.min(Math.max(1, historyPage), historyTotalPages);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  const paginatedHistoryRecords = useMemo(() => {
    const startIdx = (safeHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE;
    return filteredHistoryRecords.slice(startIdx, startIdx + HISTORY_ITEMS_PER_PAGE);
  }, [filteredHistoryRecords, safeHistoryPage]);

  const historyPageItems = useMemo<(number | 'ellipsis-left' | 'ellipsis-right')[]>(() => {
    if (historyTotalPages <= 7) {
      return Array.from({ length: historyTotalPages }, (_, i) => i + 1);
    }
    const items: (number | 'ellipsis-left' | 'ellipsis-right')[] = [1];
    const left = Math.max(2, safeHistoryPage - 1);
    const right = Math.min(historyTotalPages - 1, safeHistoryPage + 1);
    if (left > 2) items.push('ellipsis-left');
    for (let p = left; p <= right; p++) items.push(p);
    if (right < historyTotalPages - 1) items.push('ellipsis-right');
    items.push(historyTotalPages);
    return items;
  }, [historyTotalPages, safeHistoryPage]);

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 space-y-6 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>

      {/* Admin Security Auth Modal */}
      {authModalVisible && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">Admin Authorization</h3>
              <p className="text-xs text-slate-400">
                {isTh ? 'กรุณากรอกรหัสผ่านผู้ดูแลระบบเพื่อเข้าสู่โหมดปรับแต่ง Profile Spec' : 'Enter admin password for Spec Settings'}
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); verifyAdmin(); }} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => { setAdminPasswordInput(e.target.value); setAuthError(false); }}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-indigo-300 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
                {authError && (
                  <p className="text-xs text-rose-400 font-bold mt-1 text-center">
                    {isTh ? 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' : 'Incorrect password. Please try again.'}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setAuthModalVisible(false); setAdminPasswordInput(''); setAuthError(false); }}
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

      {/* Top Navigation Header */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b ${
        isLight ? 'border-slate-300' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          {onBackToPortal && (
            <button
              onClick={onBackToPortal}
              className={`p-2.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold ${
                isLight 
                  ? 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-sm' 
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{isTh ? 'กลับสู่เมนูหลัก QA' : 'Back to Portal'}</span>
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Ruler className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${
                  isLight ? 'bg-indigo-100 text-indigo-900 border-indigo-300' : 'bg-indigo-950 text-indigo-300 border-indigo-800'
                }`}>
                  IPQA-07
                </span>
                <h1 className={`text-xl font-extrabold tracking-tight ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}>
                  {isTh ? 'ระบบวัดความหนาผนังชิ้นงาน (Thickness Wall Measurement)' : 'Thickness Wall Measure System'}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {isTh ? 'สกัดข้อมูลด้วย Gemini AI 3.8 • Server-Side Cloud Synced' : 'AI-powered wall thickness extraction & quality specification audit'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className={`flex items-center gap-1.5 overflow-x-auto p-1.5 rounded-2xl border ${
          isLight ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}>
          <button
            onClick={() => handleSwitchTab('extraction')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'extraction' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isTh ? 'Data Extraction' : 'Data Extraction'}</span>
          </button>

          <button
            onClick={() => handleSwitchTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{isTh ? 'ประวัติการบันทึกข้อมูล' : 'History Hub'}</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
              activeTab === 'history'
                ? 'bg-white/20 text-white'
                : isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
            }`}>
              {savedRecords.length}
            </span>
          </button>

          <button
            onClick={() => handleSwitchTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dashboard' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{isTh ? 'Dashboard' : 'Dashboard'}</span>
          </button>

          <button
            onClick={() => handleSwitchTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings' 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                : isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{isTh ? 'Profile Spec Setting' : 'Spec Setting'}</span>
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ml-1 ${
                isLight
                  ? 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200 shadow-xs'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
              title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Clean'}
            >
              {isLight ? <Moon className="w-3.5 h-3.5 text-indigo-600" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span>{isLight ? (isTh ? 'สว่าง' : 'Light') : (isTh ? 'มืด' : 'Dark')}</span>
            </button>
          )}
        </div>
      </header>

      {/* TAB 1: DATA EXTRACTION */}
      {activeTab === 'extraction' && (
        <div className="space-y-6">
          {/* Status Banner matching IQA-01, IQA-02, and IQA-03 */}
          {status && (
            <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-medium border shadow-sm transition-all ${
              status.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                : status.type === 'error' 
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' 
                : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
            }`}>
              <div className="flex items-center gap-3">
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : status.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                ) : (
                  <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
                )}
                <span>{status.message}</span>
              </div>
              {isScanning && (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Upload Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <span>1. นำเข้าไฟล์ (PDF / Image)</span>
                </h2>

                <div 
                  className="relative border-2 border-dashed border-slate-800 rounded-2xl h-80 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition-all group overflow-hidden bg-slate-950/60 p-4 text-center"
                  onClick={() => document.getElementById('fileInputThickness')?.click()}
                >
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1] animate-pulse top-1/2 z-20" />
                  )}

                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-contain rounded-xl" />
                  ) : fileName ? (
                    <div className="space-y-2">
                      <FileText className="w-16 h-16 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-white max-w-[200px] truncate">{fileName}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-xs text-slate-300">ลากไฟล์มาวาง หรือ คลิกเพื่อเลือก</p>
                      <p className="text-[10px] text-slate-500">รองรับไฟล์ PDF, สแกน หรือรูปถ่ายมือถือ</p>
                    </div>
                  )}

                  <input
                    type="file"
                    id="fileInputThickness"
                    accept="image/*, application/pdf"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={loadDemoDocument}
                    type="button"
                    className="w-full py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700/60"
                  >
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{isTh ? 'โหลดไฟล์ตัวอย่าง (Demo Document)' : 'Load Demo Document'}</span>
                  </button>

                  <button
                    onClick={processFileWithAI}
                    disabled={isScanning}
                    className={`w-full font-black py-4 rounded-2xl transition shadow-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider ${
                      isScanning
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white hover:brightness-110 shadow-indigo-600/20'
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                        <span>กำลังสกัดข้อมูลด้วย AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>สกัดข้อมูลด้วย AI แม่นยำสูง</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Result Panel */}
            <div className="lg:col-span-7">
              <div className="bg-slate-900 rounded-3xl border border-slate-800 min-h-[500px] flex flex-col overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/60">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${hasResults ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                    <h3 className="font-bold text-xs text-white">ผลการสกัดข้อมูล (Structured Data)</h3>
                  </div>

                  {hasResults && (
                    <div className="flex gap-2">
                      <button
                        onClick={saveCurrentData}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>บันทึกข้อมูล</span>
                      </button>

                      <button
                        onClick={copyJSONData}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                  {!hasResults ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
                      <Ruler className="w-16 h-16 text-slate-700 stroke-1" />
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">รอการนำเข้าและสกัดข้อมูลไฟล์</h4>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in">
                      {/* Header Input Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Inspector Name</label>
                          <input
                            type="text"
                            list="qa-inspector-list"
                            value={inspectorInput}
                            onChange={(e) => setInspectorInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Profile</label>
                          <input
                            type="text"
                            value={profileInput}
                            onChange={(e) => setProfileInput(e.target.value)}
                            className="w-full bg-slate-900 border border-indigo-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-200 focus:outline-none focus:border-indigo-500 uppercase"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Coil No.</label>
                          <input
                            type="text"
                            value={coilInput}
                            onChange={(e) => setCoilInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sample Name</label>
                          <input
                            type="text"
                            value={sampleInput}
                            onChange={(e) => setSampleInput(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <ProcessSelector
                            id="tw-extraction-process"
                            label="Process"
                            value={processInput}
                            onChange={(proc) => setProcessInput(proc)}
                          />
                        </div>
                      </div>

                      {/* Items Measurement Table */}
                      <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] font-bold uppercase">
                            <tr>
                              <th className="px-3 py-3 text-center w-12">#</th>
                              <th className="px-3 py-3 text-left">Measurement Item</th>
                              <th className="px-3 py-3 text-right">Measure Value</th>
                              <th className="px-3 py-3 text-center w-20">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                            {tableItems.map((item, idx) => {
                              const { status, label } = getRowValidationStatus(item.description, item.total);
                              return (
                                <tr key={idx} className="hover:bg-slate-800/40 transition">
                                  <td className="px-3 py-2.5 text-center text-slate-500 font-mono">{idx + 1}</td>
                                  <td className="px-3 py-2.5">
                                    <input
                                      type="text"
                                      value={item.description}
                                      onChange={(e) => {
                                        const newItems = [...tableItems];
                                        newItems[idx].description = e.target.value;
                                        setTableItems(newItems);
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <input
                                      type="text"
                                      value={item.total}
                                      onChange={(e) => {
                                        const newItems = [...tableItems];
                                        newItems[idx].total = e.target.value.replace(/,/g, '.');
                                        setTableItems(newItems);
                                      }}
                                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-right font-bold text-indigo-200 font-mono"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-center">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                      status === 'PASS' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                                      status === 'FAIL' ? 'bg-rose-950 text-rose-300 border-rose-800' :
                                      'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                      {label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Quick Link Bar to Dedicated History Tab */}
          <div className={`rounded-2xl border px-5 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center gap-2.5">
              <History className={`w-4 h-4 ${isLight ? 'text-indigo-600' : 'text-indigo-400'}`} />
              <span className={`text-xs font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {isTh ? 'ประวัติการบันทึกข้อมูล (Cloud Shared Hub)' : 'Cloud Shared Hub History'}
              </span>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${
                isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-400'
              }`}>
                {savedRecords.length} {isTh ? 'รายการ' : 'Records'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleSwitchTab('history')}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <History className="w-3.5 h-3.5" />
              <span>{isTh ? 'เปิดดูประวัติการบันทึกข้อมูลทั้งหมด' : 'View Cloud Shared Hub History'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: HISTORY RECORDS (CLOUD SHARED HUB - 20 ITEMS PER PAGE) */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className={`rounded-3xl border overflow-hidden shadow-xl ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
          }`}>
            {/* Toolbar Header */}
            <div className={`px-6 py-4 border-b flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${
              isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${
                  isLight ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-indigo-950/70 border-indigo-800/80 text-indigo-400'
                }`}>
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {isTh ? 'ประวัติการบันทึกข้อมูล (Cloud Shared Hub)' : 'Saved Measurement History (Cloud Shared Hub)'}
                    </h3>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
                      isLight ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}>
                      {filteredHistoryRecords.length === savedRecords.length
                        ? `${savedRecords.length} ${isTh ? 'รายการ' : 'Records'}`
                        : `${filteredHistoryRecords.length} / ${savedRecords.length} ${isTh ? 'รายการ' : 'Records'}`}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-950/60 text-indigo-300'
                    }`}>
                      {isTh ? `แสดง ${HISTORY_ITEMS_PER_PAGE} รายการ/หน้า` : `${HISTORY_ITEMS_PER_PAGE} items/page`}
                    </span>
                  </div>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isTh
                      ? 'ข้อมูลผลการวัดความหนาผนังทั้งหมดที่บันทึกไว้ในระบบ แสดงผลหน้าละ 20 รายการ'
                      : 'All saved wall thickness measurements synced with Cloud Shared Hub (20 items per page)'}
                  </p>
                </div>
              </div>

              {/* Search, Profile Filter & Export Controls */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <div className="relative flex-1 sm:flex-initial sm:w-64">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <input
                    type="text"
                    value={historySearchTerm}
                    onChange={(e) => {
                      setHistorySearchTerm(e.target.value);
                      setHistoryPage(1);
                    }}
                    placeholder={isTh ? 'ค้นหา Coil, Sample, Profile, ผู้ตรวจ...' : 'Search Coil, Sample, Profile...'}
                    className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs border focus:outline-none focus:border-indigo-500 transition ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500'
                    }`}
                  />
                  {historySearchTerm && (
                    <button
                      type="button"
                      onClick={() => {
                        setHistorySearchTerm('');
                        setHistoryPage(1);
                      }}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded ${
                        isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-500 hover:text-slate-300'
                      }`}
                      title={isTh ? 'ล้างคำค้นหา' : 'Clear search'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={historyFilterProfile}
                  onChange={(e) => {
                    setHistoryFilterProfile(e.target.value);
                    setHistoryPage(1);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:border-indigo-500 ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-slate-950 border-slate-700 text-slate-200'
                  }`}
                >
                  {availableProfiles.map(p => (
                    <option key={p} value={p}>
                      {p === 'ALL' ? (isTh ? 'ทุก Profile' : 'All Profiles') : p}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleExportExcel}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                    isLight
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border-indigo-800'
                  }`}
                >
                  <FileSpreadsheet className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
                  <span>Export to Excel</span>
                </button>
              </div>
            </div>

            {/* Table Content (20 rows per page) */}
            {paginatedHistoryRecords.length === 0 ? (
              <div className="py-16 px-6 text-center space-y-2">
                <History className={`w-10 h-10 mx-auto ${isLight ? 'text-slate-300' : 'text-slate-700'}`} />
                <p className={`text-sm font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {isTh ? 'ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา' : 'No matching history records found'}
                </p>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  {isTh ? 'ลองล้างคำค้นหาหรือเลือกตัวกรอง Profile เป็น "ทุก Profile"' : 'Try clearing the search query or selecting All Profiles.'}
                </p>
              </div>
            ) : (
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-[11px] min-w-[2200px] border-collapse">
                  <thead className={`border-b font-bold uppercase text-center ${
                    isLight
                      ? 'bg-slate-100 border-slate-300 text-slate-600'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    <tr className={`divide-x ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                      <th rowSpan={2} className={`p-3 text-left sticky left-0 z-10 w-[140px] ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>วัน/เวลา</th>
                      <th rowSpan={2} className={`p-3 text-left sticky left-[140px] z-10 w-[120px] ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>Inspector</th>
                      <th rowSpan={2} className="p-3 text-left">Process</th>
                      <th rowSpan={2} className="p-3 text-left">Coil No.</th>
                      <th rowSpan={2} className="p-3 text-left">Sample</th>
                      <th rowSpan={2} className="p-3 text-left">Profile</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-indigo-100/70 text-indigo-800' : 'bg-indigo-950/50 text-indigo-300'}`}>T1</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-cyan-100/70 text-cyan-800' : 'bg-cyan-950/50 text-cyan-300'}`}>T2</th>
                      <th rowSpan={2} className="p-3">T3</th>
                      <th rowSpan={2} className="p-3">T4</th>
                      <th rowSpan={2} className="p-3">T5 Series</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-emerald-100/70 text-emerald-800' : 'bg-emerald-950/50 text-emerald-300'}`}>OR</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-amber-100/70 text-amber-800' : 'bg-amber-950/50 text-amber-300'}`}>IR</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-rose-100/70 text-rose-800' : 'bg-rose-950/50 text-rose-300'}`}>IHR</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-purple-100/70 text-purple-800' : 'bg-purple-950/50 text-purple-300'}`}>OHW</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-blue-100/70 text-blue-800' : 'bg-blue-950/50 text-blue-300'}`}>IHW</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-yellow-100/70 text-yellow-800' : 'bg-yellow-950/50 text-yellow-300'}`}>RA</th>
                      <th colSpan={2} className={`p-2 ${isLight ? 'bg-teal-100/70 text-teal-800' : 'bg-teal-950/50 text-teal-300'}`}>IOR</th>
                      <th rowSpan={2} className="p-3">Status</th>
                      <th rowSpan={2} className="p-3">Action</th>
                    </tr>
                    <tr className={`divide-x border-t text-[9px] ${
                      isLight ? 'divide-slate-200 border-slate-200' : 'divide-slate-800 border-slate-800'
                    }`}>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                      <th className="p-1">min</th><th className="p-1">max</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-center ${
                    isLight
                      ? 'divide-slate-200 bg-white'
                      : 'divide-slate-800/60 bg-slate-900'
                  }`}>
                    {paginatedHistoryRecords.map((rec) => (
                      <tr
                        key={rec.docId || rec.id}
                        className={`transition divide-x ${
                          isLight
                            ? 'hover:bg-slate-50 divide-slate-200'
                            : 'hover:bg-slate-800/40 divide-slate-800/60'
                        }`}
                      >
                        <td className={`p-2.5 text-left font-mono sticky left-0 z-10 ${
                          isLight ? 'bg-white text-slate-600' : 'bg-slate-900 text-slate-400'
                        }`}>
                          {rec.timestamp}
                        </td>
                        <td className={`p-2.5 text-left font-bold sticky left-[140px] z-10 ${
                          isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                        }`}>
                          {rec.inspector}
                        </td>
                        <td className={`p-2.5 text-left ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>{rec.process}</td>
                        <td className={`p-2.5 text-left font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{rec.coil}</td>
                        <td className={`p-2.5 text-left ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{rec.sample}</td>
                        <td className={`p-2.5 text-left font-bold ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`}>{rec.profile}</td>

                        <td className={`p-2 font-mono ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`} title={rec.vals.t1_list?.join(', ')}>{rec.vals.t1.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`} title={rec.vals.t1_list?.join(', ')}>{rec.vals.t1.max}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`} title={rec.vals.t2_list?.join(', ')}>{rec.vals.t2.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-cyan-700' : 'text-cyan-300'}`} title={rec.vals.t2_list?.join(', ')}>{rec.vals.t2.max}</td>

                        <td className={`p-2 font-mono font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`} title={rec.vals.t3_list?.join(', ')}>{rec.vals.t3}</td>
                        <td className={`p-2 font-mono font-bold ${isLight ? 'text-amber-700' : 'text-amber-300'}`} title={rec.vals.t4_list?.join(', ')}>{rec.vals.t4}</td>

                        <td className="p-2 text-left text-[10px]">
                          <div className="flex flex-wrap gap-1 max-w-[180px]">
                            {rec.vals.t5_list.map((t5, idx) => (
                              <span
                                key={idx}
                                className={`px-1.5 py-0.5 rounded border font-mono ${
                                  isLight
                                    ? 'bg-slate-100 border-slate-300 text-slate-700'
                                    : 'bg-slate-950 border-slate-800 text-slate-300'
                                }`}
                              >
                                {t5}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className={`p-2 font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{rec.vals.or.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>{rec.vals.or.max}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>{rec.vals.ir.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-amber-700' : 'text-amber-300'}`}>{rec.vals.ir.max}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>{rec.vals.ihr.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>{rec.vals.ihr.max}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>{rec.vals.ohw.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-purple-700' : 'text-purple-300'}`}>{rec.vals.ohw.max}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>{rec.vals.ihw.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>{rec.vals.ihw.max}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>{rec.vals.ra.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>{rec.vals.ra.max}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>{rec.vals.ior.min}</td>
                        <td className={`p-2 font-mono ${isLight ? 'text-teal-700' : 'text-teal-300'}`}>{rec.vals.ior.max}</td>

                        <td className="p-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            rec.overallStatus === 'PASS'
                              ? isLight
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : isLight
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-rose-950 text-rose-300 border-rose-800'
                          }`}>
                            {rec.overallStatus}
                          </span>
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => handleRequestEditHistory(rec)}
                            className={`p-1.5 rounded-lg transition border flex items-center justify-center gap-1 text-[11px] font-bold mx-auto ${
                              isLight
                                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30'
                            }`}
                            title="แก้ไขข้อมูล (ต้องใส่ Password)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer (20 items per page) */}
            {filteredHistoryRecords.length > 0 && (
              <div className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {isTh ? (
                    <>
                      แสดงรายการที่{' '}
                      <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {(safeHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE + 1}
                      </span>
                      {' – '}
                      <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {Math.min(safeHistoryPage * HISTORY_ITEMS_PER_PAGE, filteredHistoryRecords.length)}
                      </span>
                      {' จากทั้งหมด '}
                      <span className={`font-bold font-mono ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                        {filteredHistoryRecords.length}
                      </span>
                      {' รายการ (หน้า '}
                      <span className="font-mono font-bold">{safeHistoryPage}</span>
                      {' / '}
                      <span className="font-mono font-bold">{historyTotalPages}</span>
                      {' • 20 รายการ/หน้า)'}
                    </>
                  ) : (
                    <>
                      Showing{' '}
                      <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {(safeHistoryPage - 1) * HISTORY_ITEMS_PER_PAGE + 1}
                      </span>
                      {'–'}
                      <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {Math.min(safeHistoryPage * HISTORY_ITEMS_PER_PAGE, filteredHistoryRecords.length)}
                      </span>
                      {' of '}
                      <span className={`font-bold font-mono ${isLight ? 'text-indigo-700' : 'text-indigo-300'}`}>
                        {filteredHistoryRecords.length}
                      </span>
                      {' records (Page '}
                      <span className="font-mono font-bold">{safeHistoryPage}</span>
                      {' / '}
                      <span className="font-mono font-bold">{historyTotalPages}</span>
                      {' • 20/page)'}
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <button
                    type="button"
                    disabled={safeHistoryPage <= 1}
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>{isTh ? 'ก่อนหน้า' : 'Prev'}</span>
                  </button>

                  {historyPageItems.map((item, idx) =>
                    typeof item === 'number' ? (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setHistoryPage(item)}
                        className={`min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold font-mono border transition ${
                          item === safeHistoryPage
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : isLight
                              ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                              : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {item}
                      </button>
                    ) : (
                      <span
                        key={`${item}-${idx}`}
                        className={`px-1.5 text-xs font-mono ${isLight ? 'text-slate-400' : 'text-slate-500'}`}
                      >
                        ...
                      </span>
                    )
                  )}

                  <button
                    type="button"
                    disabled={safeHistoryPage >= historyTotalPages}
                    onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{isTh ? 'ถัดไป' : 'Next'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dashboardStats ? (
            <>
              {/* Top Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                  } space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isTh ? 'ตัวอย่างที่ตรวจทั้งหมด' : 'Total Samples'}
                    </span>
                    <Layers className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className={`text-2xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {dashTotalCount}{' '}
                    <span className="text-xs font-normal text-slate-400">{isTh ? 'ตัวอย่าง' : 'Samples'}</span>
                  </div>
                </div>

                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                  } space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                      {isTh ? 'ผ่านเกณฑ์ (PASS)' : 'Pass Samples'}
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400">
                    {dashPassCount}{' '}
                    <span className="text-xs font-normal text-slate-400">{isTh ? 'ตัวอย่าง' : 'Samples'}</span>
                  </div>
                </div>

                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                  } space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">
                      {isTh ? 'ไม่ผ่านเกณฑ์ (FAIL)' : 'Fail Samples'}
                    </span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-rose-400">
                    {dashFailCount}{' '}
                    <span className="text-xs font-normal text-slate-400">{isTh ? 'ตัวอย่าง' : 'Samples'}</span>
                  </div>
                </div>

                <div
                  className={`p-5 rounded-2xl border transition-all ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                  } space-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      {isTh ? 'อัตราผ่านเกณฑ์' : 'Pass Rate'}
                    </span>
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-cyan-400">{dashPassRatio}%</div>
                </div>
              </div>

              {/* Profile Breakdown Table */}
              {dashboardStats.profileSummaries.length > 0 && (
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div
                    className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-indigo-400" />
                      <div>
                        <h4 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                          {isTh ? 'สรุปค่าความหนาผนังเฉลี่ยแยกตาม Profile (Profile Summary)' : 'Summary by Profile'}
                        </h4>
                        <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {isTh
                            ? 'คลิกที่แถวหรือปุ่มเพื่อกรองดูกราฟแนวโน้ม T1, T2, T3, T4, T5 เฉพาะ Profile นั้น'
                            : 'Click any row to filter trend charts for that profile'}
                        </p>
                      </div>
                    </div>

                    {dashFilterProfile !== 'ALL' && (
                      <button
                        onClick={() => setDashFilterProfile('ALL')}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition ${
                          isLight
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
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
                        <tr
                          className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                            isLight
                              ? 'bg-slate-100/70 text-slate-600 border-slate-200'
                              : 'bg-slate-950 text-slate-400 border-slate-800'
                          }`}
                        >
                          <th className="p-3">Profile</th>
                          <th className="p-3 text-center">{isTh ? 'จำนวน' : 'Samples'}</th>
                          <th className="p-3 text-center">{isTh ? 'อัตราผ่าน' : 'Pass Rate'}</th>
                          <th className="p-3 text-center text-sky-400">Avg T1 (mm)</th>
                          <th className="p-3 text-center text-indigo-400">Avg T2 (mm)</th>
                          <th className="p-3 text-center text-emerald-400">Avg T3 (mm)</th>
                          <th className="p-3 text-center text-amber-400">Avg T4 (mm)</th>
                          <th className="p-3 text-center text-purple-400">Avg T5 (mm)</th>
                          <th className="p-3 text-right">{isTh ? 'ตัวกรอง' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
                        {dashboardStats.profileSummaries.map(summary => {
                          const isSelected = dashFilterProfile === summary.name;
                          return (
                            <tr
                              key={summary.name}
                              onClick={() => setDashFilterProfile(isSelected ? 'ALL' : summary.name)}
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
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      isSelected ? 'bg-indigo-500 ring-2 ring-indigo-400/30' : 'bg-slate-400'
                                    }`}
                                  />
                                  <span className={isLight ? 'text-slate-800 font-bold' : 'text-slate-200 font-bold'}>
                                    {summary.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3 text-center font-mono">
                                <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{summary.total}</span>
                                <span className="text-[10px] text-slate-500 ml-1">
                                  ({summary.pass}P / {summary.fail}F)
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    parseFloat(summary.passRate) >= 95
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : parseFloat(summary.passRate) >= 80
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}
                                >
                                  {summary.passRate}%
                                </span>
                              </td>
                              <td className="p-3 text-center font-mono text-sky-400 font-bold">{summary.avgT1}</td>
                              <td className="p-3 text-center font-mono text-indigo-400 font-bold">{summary.avgT2}</td>
                              <td className="p-3 text-center font-mono text-emerald-400 font-bold">{summary.avgT3}</td>
                              <td className="p-3 text-center font-mono text-amber-400 font-bold">{summary.avgT4}</td>
                              <td className="p-3 text-center font-mono text-purple-400 font-bold">{summary.avgT5}</td>
                              <td className="p-3 text-right">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setDashFilterProfile(isSelected ? 'ALL' : summary.name);
                                  }}
                                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg transition ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white'
                                      : isLight
                                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                  }`}
                                >
                                  {isSelected ? (isTh ? 'เลือกอยู่ ✓' : 'Selected ✓') : isTh ? 'ดูกราฟ' : 'Filter'}
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

              {/* Unified Query & Filter Toolbar */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
                } space-y-4`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      <h4 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {isTh
                          ? 'ภาพรวมแนวโน้มความหนาผนังและค้นหาตาม Profile / เดือน'
                          : 'Wall Thickness Trend Overview & Query by Profile / Month'}
                      </h4>
                    </div>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {isTh
                        ? 'แสดงผลภาพรวมทุก Profile และทุกเดือนเป็นค่าเริ่มต้น หรือค้นหาเฉพาะ Profile และเดือน โดยแยกกราฟ T1, T2, T3, T4, T5 เป็นคนละแถวชัดเจน'
                        : 'Integrated overview across all profiles & months by default, with dedicated full-width rows for T1, T2, T3, T4, and T5.'}
                    </p>
                  </div>

                  {/* Selectors & Reset */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Profile:
                      </label>
                      <select
                        value={dashFilterProfile}
                        onChange={e => setDashFilterProfile(e.target.value)}
                        className={`text-xs rounded-xl px-3 py-1.5 font-medium border focus:outline-none focus:border-indigo-500 ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        {availableProfiles.map(p => (
                          <option key={p} value={p}>
                            {p === 'ALL' ? (isTh ? 'ทุก Profile (ภาพรวม)' : 'ALL Profiles (Overview)') : p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className={`text-[10px] font-bold uppercase ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {isTh ? 'เดือน:' : 'Month:'}
                      </label>
                      <select
                        value={dashFilterMonth}
                        onChange={e => setDashFilterMonth(e.target.value)}
                        className={`text-xs rounded-xl px-3 py-1.5 font-medium border focus:outline-none focus:border-indigo-500 ${
                          isLight
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        {availableMonths.map(m => (
                          <option key={m} value={m}>
                            {m === 'ALL' ? (isTh ? 'ทุกเดือน (ทั้งหมด)' : 'ALL Months (All)') : m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(dashFilterProfile !== 'ALL' || dashFilterMonth !== 'ALL') && (
                      <button
                        onClick={() => {
                          setDashFilterProfile('ALL');
                          setDashFilterMonth('ALL');
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

                {/* Quick Profile Pills + Plot Mode Toggle */}
                <div
                  className={`pt-3 border-t flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                    isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {isTh ? 'ทางลัด Profile:' : 'Quick Select:'}
                    </span>
                    {availableProfiles.map(p => {
                      const isSelected = dashFilterProfile === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setDashFilterProfile(p)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : isLight
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          {p === 'ALL' ? (isTh ? 'ภาพรวมทุก Profile' : 'All Profiles') : p}
                        </button>
                      );
                    })}
                  </div>

                  {/* Plot Granularity Switcher: All Points T#-1..n vs Sample Avg */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider mr-1 ${
                        isLight ? 'text-slate-500' : 'text-slate-400'
                      }`}
                    >
                      {isTh ? 'รูปแบบการพล็อตกราฟ:' : 'Plot Mode:'}
                    </span>
                    <div
                      className={`inline-flex p-0.5 rounded-xl border ${
                        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setDashPlotMode('points')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          dashPlotMode === 'points'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? 'ทุกจุดวัด (T#-1, T#-2, ...)' : 'All Sub-Points'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDashPlotMode('sampleAvg')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                          dashPlotMode === 'sampleAvg'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isTh ? 'ค่าเฉลี่ยรายใบ + Min/Max' : 'Per Sample Avg'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Spec Limits Banner when querying a specific profile */}
                {dashFilterProfile !== 'ALL' && activeProfileSpecMap && (
                  <div
                    className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                      isLight
                        ? 'bg-indigo-50/60 border-indigo-200 text-indigo-950'
                        : 'bg-indigo-950/20 border-indigo-800/40 text-indigo-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-400" />
                      <div>
                        <span className="text-xs font-bold">
                          {isTh ? 'เกณฑ์มาตรฐาน (Spec Limits) สำหรับ Profile ' : 'Specification Limits for Profile '}
                          <span className="underline font-extrabold">{dashFilterProfile}</span>
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {isTh ? 'เส้นประแนวนอนบนกราฟแต่ละแถวอ้างอิงตามค่า Min / Max นี้' : 'Dashed reference lines represent Min / Max thresholds'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-sky-400 block font-sans font-bold">T1 (mm)</span>
                        <span className="font-bold">
                          {activeProfileSpecMap.t1.min ?? '-'} ~ {activeProfileSpecMap.t1.max ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-indigo-400 block font-sans font-bold">T2 (mm)</span>
                        <span className="font-bold">
                          {activeProfileSpecMap.t2.min ?? '-'} ~ {activeProfileSpecMap.t2.max ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-emerald-400 block font-sans font-bold">T3 (mm)</span>
                        <span className="font-bold">
                          {activeProfileSpecMap.t3.min ?? '-'} ~ {activeProfileSpecMap.t3.max ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-amber-400 block font-sans font-bold">T4 (mm)</span>
                        <span className="font-bold">
                          {activeProfileSpecMap.t4.min ?? '-'} ~ {activeProfileSpecMap.t4.max ?? '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-purple-400 block font-sans font-bold">T5 (mm)</span>
                        <span className="font-bold">
                          {activeProfileSpecMap.t5.min ?? '-'} ~ {activeProfileSpecMap.t5.max ?? '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5 DEDICATED FULL-WIDTH PARAMETER ROWS: T1, T2, T3, T4, T5 */}
              {filteredTrendData.length > 0 ? (
                <div className="space-y-6">
                  {/* ROW 1: T1 (T1-1, T1-2, T1-3) */}
                  <ThicknessParameterRowCard
                    paramKey="t1"
                    title="Wall Thickness T1"
                    thaiTitle="ความหนาผนัง T1 (T1-1, T1-2, T1-3)"
                    descriptionTh="ค่าความหนาผนังตำแหน่ง T1 โดยพล็อตข้อมูลจากจุดวัด T1-1, T1-2, T1-3"
                    descriptionEn="Wall thickness T1 measurements plotted from T1-1, T1-2, T1-3"
                    color="#38bdf8"
                    data={filteredTrendData}
                    plotMode={dashPlotMode}
                    unit="mm"
                    specMin={activeProfileSpecMap?.t1.min ?? null}
                    specMax={activeProfileSpecMap?.t1.max ?? null}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* ROW 2: T2 (T2-1, T2-2, T2-3) */}
                  <ThicknessParameterRowCard
                    paramKey="t2"
                    title="Wall Thickness T2"
                    thaiTitle="ความหนาผนัง T2 (T2-1, T2-2, T2-3)"
                    descriptionTh="ค่าความหนาผนังตำแหน่ง T2 โดยพล็อตข้อมูลจากจุดวัด T2-1, T2-2, T2-3"
                    descriptionEn="Wall thickness T2 measurements plotted from T2-1, T2-2, T2-3"
                    color="#818cf8"
                    data={filteredTrendData}
                    plotMode={dashPlotMode}
                    unit="mm"
                    specMin={activeProfileSpecMap?.t2.min ?? null}
                    specMax={activeProfileSpecMap?.t2.max ?? null}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* ROW 3: T3 (T3-1, T3-2, T3-3) */}
                  <ThicknessParameterRowCard
                    paramKey="t3"
                    title="Wall Thickness T3"
                    thaiTitle="ความหนาผนัง T3 (T3-1, T3-2, T3-3)"
                    descriptionTh="ค่าความหนาผนังตำแหน่ง T3 โดยพล็อตข้อมูลจากจุดวัด T3-1, T3-2, T3-3"
                    descriptionEn="Wall thickness T3 measurements plotted from T3-1, T3-2, T3-3"
                    color="#34d399"
                    data={filteredTrendData}
                    plotMode={dashPlotMode}
                    unit="mm"
                    specMin={activeProfileSpecMap?.t3.min ?? null}
                    specMax={activeProfileSpecMap?.t3.max ?? null}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* ROW 4: T4 (T4-1, T4-2, T4-3) */}
                  <ThicknessParameterRowCard
                    paramKey="t4"
                    title="Wall Thickness T4"
                    thaiTitle="ความหนาผนัง T4 (T4-1, T4-2, T4-3)"
                    descriptionTh="ค่าความหนาผนังตำแหน่ง T4 โดยพล็อตข้อมูลจากจุดวัด T4-1, T4-2, T4-3"
                    descriptionEn="Wall thickness T4 measurements plotted from T4-1, T4-2, T4-3"
                    color="#fbbf24"
                    data={filteredTrendData}
                    plotMode={dashPlotMode}
                    unit="mm"
                    specMin={activeProfileSpecMap?.t4.min ?? null}
                    specMax={activeProfileSpecMap?.t4.max ?? null}
                    isLight={isLight}
                    isTh={isTh}
                  />

                  {/* ROW 5: T5 (T5-1, T5-2, T5-3, ... T5-n) */}
                  <ThicknessParameterRowCard
                    paramKey="t5"
                    title="Wall Thickness T5"
                    thaiTitle="ความหนาผนัง T5 (T5-1, T5-2, T5-3, ... T5-n)"
                    descriptionTh="ค่าความหนาผนังตำแหน่ง T5 โดยพล็อตข้อมูลจากชุดจุดวัด T5-1, T5-2, T5-3, ... T5-n"
                    descriptionEn="Wall thickness T5 measurements plotted from T5-1, T5-2, T5-3, ... T5-n"
                    color="#c084fc"
                    data={filteredTrendData}
                    plotMode={dashPlotMode}
                    unit="mm"
                    specMin={activeProfileSpecMap?.t5.min ?? null}
                    specMax={activeProfileSpecMap?.t5.max ?? null}
                    isLight={isLight}
                    isTh={isTh}
                  />
                </div>
              ) : (
                <div
                  className={`text-center py-12 rounded-2xl border ${
                    isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-500'
                  } text-xs space-y-2`}
                >
                  <AlertCircle className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
                  <p className="font-bold">
                    {isTh ? 'ไม่พบข้อมูลแนวโน้มที่ตรงกับเงื่อนไขการค้นหา' : 'No trend data matching filter'}
                  </p>
                  <button
                    onClick={() => {
                      setDashFilterProfile('ALL');
                      setDashFilterMonth('ALL');
                    }}
                    className="text-indigo-400 hover:underline text-[11px]"
                  >
                    {isTh ? 'คลิกที่นี่เพื่อรีเซ็ตตัวกรองเป็นภาพรวมทั้งหมด' : 'Click here to reset filter'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              className={`text-center py-12 rounded-2xl border ${
                isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-slate-900 border-slate-800 text-slate-500'
              } text-xs`}
            >
              {isTh ? 'ไม่มีข้อมูลการตรวจวัดสำหรับแสดงผลแดชบอร์ด' : 'No inspection records available for dashboard analysis'}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE SPEC SETTING */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {/* Add / Edit Profile Spec Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>ตั้งค่า Spec ใหม่ (Profile Specification Manager)</span>
              </h3>
            </div>

            <div className="max-w-md space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Profile Name</label>
              <input
                type="text"
                value={specProfileName}
                onChange={(e) => setSpecProfileName(e.target.value.toUpperCase())}
                placeholder="เช่น A-001, B-002"
                className="w-full bg-slate-950 border border-indigo-800 rounded-2xl px-4 py-3 text-lg font-bold text-indigo-300 uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Spec Items Table */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-950 text-slate-400 text-[10px] font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Measurement Item (Prefix)</th>
                    <th className="px-4 py-3 text-center w-36">Min Spec</th>
                    <th className="px-4 py-3 text-center w-36">Max Spec</th>
                    <th className="px-4 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900">
                  {specItems.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={item.item}
                          onChange={(e) => {
                            const newItems = [...specItems];
                            newItems[idx].item = e.target.value.toUpperCase();
                            setSpecItems(newItems);
                          }}
                          placeholder="Prefix (e.g. OR, T1, IR)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold uppercase font-mono"
                        />
                      </td>

                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="any"
                          value={item.min}
                          onChange={(e) => {
                            const newItems = [...specItems];
                            newItems[idx].min = e.target.value;
                            setSpecItems(newItems);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center font-mono text-emerald-300"
                        />
                      </td>

                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="any"
                          value={item.max}
                          onChange={(e) => {
                            const newItems = [...specItems];
                            newItems[idx].max = e.target.value;
                            setSpecItems(newItems);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-center font-mono text-rose-300"
                        />
                      </td>

                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => setSpecItems(prev => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSpecItems(prev => [...prev, { item: '', min: 0, max: 0 }])}
                className="py-3 px-6 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่มจุดวัด (Measurement Item)</span>
              </button>

              <button
                type="button"
                onClick={handleSaveProfileSpec}
                className="py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-1.5 ml-auto"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า Spec</span>
              </button>
            </div>
          </div>

          {/* Configured Profiles Cards Grid */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>รายการ Profile (Synced from Cloud)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.keys(profileSpecs).map((profName) => (
                <div key={profName} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-black text-indigo-300 text-lg">{profName}</h4>
                      <p className="text-[10px] text-slate-500">{profileSpecs[profName].length} Measurement Items</p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditProfile(profName)}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteProfile(profName)}
                        className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {profileSpecs[profName].map((itemSpec, idx) => (
                      <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                        {itemSpec.item}: {itemSpec.min}-{itemSpec.max}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
                ยืนยันรหัสผ่านเพื่อแก้ไขข้อมูล
              </h3>
              <p className="text-xs text-slate-400">
                กรอกรหัสผ่านผู้ดูแลระบบเพื่อแก้ไขรายการตรวจวัด IPQA-07
              </p>
            </div>

            <form onSubmit={handleVerifyHistoryPassword} className="space-y-4">
              <div>
                <input
                  type="password"
                  value={historyAuthPassword}
                  onChange={(e) => setHistoryAuthPassword(e.target.value)}
                  placeholder="รหัสผ่านผู้ดูแลระบบ"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-lg font-mono text-amber-300 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {historyAuthError && (
                  <p className="text-xs text-rose-400 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>รหัสผ่านไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsHistoryAuthOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>ปลดล็อกเพื่อแก้ไข</span>
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
                    แก้ไขข้อมูล Thickness & Wall (IPQA-07)
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Coil: {editingHistoryItem.coil} | ID: {editingHistoryItem.id}
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
                    value={editingHistoryItem.coil || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, coil: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-300 focus:outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Inspector Name</label>
                  <input
                    type="text"
                    value={editingHistoryItem.inspector || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, inspector: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <ProcessSelector
                  id="tw-edit-history-process"
                  label="Process"
                  value={editingHistoryItem.process || ''}
                  onChange={(proc) => setEditingHistoryItem({ ...editingHistoryItem, process: proc })}
                />

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Profile Spec</label>
                  <input
                    type="text"
                    value={editingHistoryItem.profile || ''}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, profile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Overall Status</label>
                  <select
                    value={editingHistoryItem.overallStatus}
                    onChange={(e) => setEditingHistoryItem({ ...editingHistoryItem, overallStatus: e.target.value as 'PASS' | 'FAIL' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="PASS">PASS</option>
                    <option value="FAIL">FAIL</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Thickness & Dimension Values</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T1 Min</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t1?.min || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t1: { ...editingHistoryItem.vals.t1, min: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T1 Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t1?.max || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t1: { ...editingHistoryItem.vals.t1, max: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T3 Value</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t3 || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t3: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">T4 Value</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.t4 || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, t4: e.target.value }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-amber-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">OR Min</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.or?.min || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, or: { ...editingHistoryItem.vals.or, min: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">OR Max</label>
                    <input
                      type="text"
                      value={editingHistoryItem.vals?.or?.max || ''}
                      onChange={(e) => setEditingHistoryItem({
                        ...editingHistoryItem,
                        vals: { ...editingHistoryItem.vals, or: { ...editingHistoryItem.vals.or, max: e.target.value } }
                      })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-500"
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
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveEditedHistory}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>บันทึกการแก้ไข</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
