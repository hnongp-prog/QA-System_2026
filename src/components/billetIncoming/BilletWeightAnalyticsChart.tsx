import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  BarChart3,
  Layers,
  Truck,
  PieChart as PieIcon,
  Scale,
  TableProperties,
  ArrowUpDown,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { BilletInspectionItem, GradeSpecMap } from '../../types';

interface BilletWeightAnalyticsChartProps {
  items: BilletInspectionItem[];
  gradeSpecs?: GradeSpecMap;
  isLight?: boolean;
  isTh?: boolean;
}

type ViewMode = 'byGrade' | 'bySupplier' | 'dualShare' | 'matrix';
type BarLayout = 'stacked' | 'grouped';

const DEFAULT_GRADE_COLORS: Record<string, string> = {
  '6063': '#4f46e5', // Indigo
  '6061': '#0284c7', // Sky blue
  '6005': '#10b981', // Emerald
  '6082': '#f59e0b', // Amber
  '1050': '#8b5cf6', // Violet
  '3003': '#ec4899', // Pink
  '5052': '#06b6d4', // Cyan
  '7075': '#ea580c', // Orange
};

const SUPPLIER_PALETTE = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#0d9488', // Teal
  '#9333ea', // Violet
  '#64748b'  // Slate
];

const parseWeight = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
};

const parsePcs = (val: any): number => {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const clean = String(val).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
};

export const BilletWeightAnalyticsChart: React.FC<BilletWeightAnalyticsChartProps> = ({
  items,
  gradeSpecs = {},
  isLight = true,
  isTh = true
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('byGrade');
  const [barLayout, setBarLayout] = useState<BarLayout>('stacked');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('ALL');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');

  // Helper for grade colors
  const getGradeColor = (grade: string, idx: number): string => {
    if (gradeSpecs[grade]?.color) return gradeSpecs[grade].color;
    if (DEFAULT_GRADE_COLORS[grade]) return DEFAULT_GRADE_COLORS[grade];
    const fallback = ['#4f46e5', '#0284c7', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    return fallback[idx % fallback.length];
  };

  // Helper for supplier colors
  const getSupplierColor = (supplier: string, idx: number): string => {
    return SUPPLIER_PALETTE[idx % SUPPLIER_PALETTE.length];
  };

  // Process data
  const {
    totalWeight,
    totalPcs,
    distinctGrades,
    distinctSuppliers,
    dataByGrade,
    dataBySupplier,
    pieDataGrades,
    pieDataSuppliers,
    matrixData,
    topGrade,
    topSupplier
  } = useMemo(() => {
    let totWeight = 0;
    let totPcs = 0;

    const gradeMap: Record<string, { totalKg: number; totalPcs: number; heats: Set<string>; suppliers: Record<string, number> }> = {};
    const supplierMap: Record<string, { totalKg: number; totalPcs: number; heats: Set<string>; grades: Record<string, number> }> = {};

    items.forEach(item => {
      const g = (item.grade || 'Unspecified').trim() || 'Unspecified';
      const s = (item.supplier_name || 'Unspecified').trim() || 'Unspecified';
      const w = parseWeight(item.weight_kg);
      const p = parsePcs(item.quantity_pcs);
      const heat = item.heat_number || '';

      totWeight += w;
      totPcs += p;

      // By Grade
      if (!gradeMap[g]) {
        gradeMap[g] = { totalKg: 0, totalPcs: 0, heats: new Set(), suppliers: {} };
      }
      gradeMap[g].totalKg += w;
      gradeMap[g].totalPcs += p;
      if (heat) gradeMap[g].heats.add(heat);
      gradeMap[g].suppliers[s] = (gradeMap[g].suppliers[s] || 0) + w;

      // By Supplier
      if (!supplierMap[s]) {
        supplierMap[s] = { totalKg: 0, totalPcs: 0, heats: new Set(), grades: {} };
      }
      supplierMap[s].totalKg += w;
      supplierMap[s].totalPcs += p;
      if (heat) supplierMap[s].heats.add(heat);
      supplierMap[s].grades[g] = (supplierMap[s].grades[g] || 0) + w;
    });

    const gradesList = Object.keys(gradeMap).sort((a, b) => gradeMap[b].totalKg - gradeMap[a].totalKg);
    const suppliersList = Object.keys(supplierMap).sort((a, b) => supplierMap[b].totalKg - supplierMap[a].totalKg);

    // Chart dataset for view "byGrade":
    // Filter items if specific supplier is filtered
    const chartByGrade = gradesList
      .filter(g => selectedGradeFilter === 'ALL' || g === selectedGradeFilter)
      .map(g => {
        const entry: any = {
          grade: g,
          totalKg: Math.round(gradeMap[g].totalKg * 100) / 100,
          totalPcs: gradeMap[g].totalPcs,
          heatsCount: gradeMap[g].heats.size
        };
        suppliersList.forEach(s => {
          if (selectedSupplierFilter === 'ALL' || s === selectedSupplierFilter) {
            entry[s] = Math.round((gradeMap[g].suppliers[s] || 0) * 100) / 100;
          }
        });
        return entry;
      });

    // Chart dataset for view "bySupplier":
    const chartBySupplier = suppliersList
      .filter(s => selectedSupplierFilter === 'ALL' || s === selectedSupplierFilter)
      .map(s => {
        const entry: any = {
          supplier: s,
          totalKg: Math.round(supplierMap[s].totalKg * 100) / 100,
          totalPcs: supplierMap[s].totalPcs,
          heatsCount: supplierMap[s].heats.size
        };
        gradesList.forEach(g => {
          if (selectedGradeFilter === 'ALL' || g === selectedGradeFilter) {
            entry[g] = Math.round((supplierMap[s].grades[g] || 0) * 100) / 100;
          }
        });
        return entry;
      });

    // Pie datasets
    const pieGrades = gradesList.map((g, idx) => ({
      name: g,
      value: Math.round(gradeMap[g].totalKg * 100) / 100,
      color: getGradeColor(g, idx),
      pcs: gradeMap[g].totalPcs,
      heats: gradeMap[g].heats.size
    }));

    const pieSuppliers = suppliersList.map((s, idx) => ({
      name: s,
      value: Math.round(supplierMap[s].totalKg * 100) / 100,
      color: getSupplierColor(s, idx),
      pcs: supplierMap[s].totalPcs,
      heats: supplierMap[s].heats.size
    }));

    // Top metrics
    const topG = gradesList[0] ? { name: gradesList[0], weight: gradeMap[gradesList[0]].totalKg } : null;
    const topS = suppliersList[0] ? { name: suppliersList[0], weight: supplierMap[suppliersList[0]].totalKg } : null;

    // Matrix table data
    const matrix = gradesList.map(g => {
      const row: any = {
        grade: g,
        totalKg: gradeMap[g].totalKg,
        totalPcs: gradeMap[g].totalPcs,
        heatsCount: gradeMap[g].heats.size,
        suppliers: {} as Record<string, number>
      };
      suppliersList.forEach(s => {
        row.suppliers[s] = gradeMap[g].suppliers[s] || 0;
      });
      return row;
    });

    return {
      totalWeight: totWeight,
      totalPcs: totPcs,
      distinctGrades: gradesList,
      distinctSuppliers: suppliersList,
      dataByGrade: chartByGrade,
      dataBySupplier: chartBySupplier,
      pieDataGrades: pieGrades,
      pieDataSuppliers: pieSuppliers,
      matrixData: matrix,
      topGrade: topG,
      topSupplier: topS
    };
  }, [items, gradeSpecs, selectedGradeFilter, selectedSupplierFilter]);

  // Color mapping caches
  const supplierColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    distinctSuppliers.forEach((s, idx) => {
      map[s] = getSupplierColor(s, idx);
    });
    return map;
  }, [distinctSuppliers]);

  const gradeColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    distinctGrades.forEach((g, idx) => {
      map[g] = getGradeColor(g, idx);
    });
    return map;
  }, [distinctGrades, gradeSpecs]);

  // Custom Tooltip for Bar Charts
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    // Calculate sum of visible payload
    let currentTotal = 0;
    payload.forEach((p: any) => {
      if (typeof p.value === 'number') currentTotal += p.value;
    });

    const isByGrade = viewMode === 'byGrade';

    return (
      <div className={`p-3 rounded-xl shadow-lg border font-sans text-xs min-w-56 z-50 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        <div className="font-bold border-b pb-1.5 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {isByGrade ? <Layers className="w-3.5 h-3.5 text-blue-500" /> : <Truck className="w-3.5 h-3.5 text-emerald-500" />}
            <span>{isByGrade ? `${isTh ? 'เกรด' : 'Grade'}: ${label}` : `${isTh ? 'ผู้จัดส่ง' : 'Supplier'}: ${label}`}</span>
          </span>
          <span className={`font-mono text-[11px] font-bold ${isLight ? 'text-blue-600' : 'text-cyan-400'}`}>
            {currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} kg
          </span>
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {payload
            .filter((p: any) => p.value > 0)
            .sort((a: any, b: any) => b.value - a.value)
            .map((p: any, idx: number) => {
              const pct = currentTotal > 0 ? ((p.value / currentTotal) * 100).toFixed(1) : '0';
              return (
                <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={p.name}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || p.fill }} />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="font-mono text-right shrink-0">
                    <span className="font-semibold">{Number(p.value).toLocaleString(undefined, { minimumFractionDigits: 2 })} kg</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                  </div>
                </div>
              );
            })}
        </div>

        {totalWeight > 0 && (
          <div className={`mt-2 pt-1.5 border-t text-[10px] flex justify-between ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>{isTh ? 'สัดส่วนจากน้ำหนักรวมทั้งหมด' : 'Share of Total Weight'}:</span>
            <span className="font-semibold font-mono">{((currentTotal / totalWeight) * 100).toFixed(1)}%</span>
          </div>
        )}
      </div>
    );
  };

  // Custom Tooltip for Pie Charts
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0];
    const pct = totalWeight > 0 ? ((data.value / totalWeight) * 100).toFixed(1) : '0';

    return (
      <div className={`p-3 rounded-xl shadow-lg border font-sans text-xs min-w-48 ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}>
        <div className="flex items-center gap-2 font-bold mb-1">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="truncate">{data.name}</span>
        </div>
        <div className="font-mono text-sm font-bold text-blue-600 dark:text-cyan-400">
          {Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2 })} kg
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex justify-between">
          <span>{isTh ? 'สัดส่วน' : 'Share'}:</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        {data.payload.pcs > 0 && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
            <span>{isTh ? 'จำนวนท่อน' : 'Pieces'}:</span>
            <span className="font-semibold">{data.payload.pcs.toLocaleString()} pcs</span>
          </div>
        )}
        {data.payload.heats > 0 && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
            <span>{isTh ? 'จำนวน Heat' : 'Heats'}:</span>
            <span className="font-semibold">{data.payload.heats} heats</span>
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className={`border rounded-2xl p-6 text-center shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
        <p className="text-xs font-semibold text-slate-500">
          {isTh ? 'ไม่มีข้อมูลการตรวจรับสำหรับสร้างกราฟน้ำหนัก' : 'No inspection data available for weight analytics'}
        </p>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 space-y-4 shadow-xs transition-all ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
            isLight ? 'text-slate-900' : 'text-slate-100'
          }`}>
            <BarChart3 className={`w-4 h-4 ${isLight ? 'text-blue-600' : 'text-cyan-400'}`} />
            <span>{isTh ? 'กราฟแสดงจำนวน kg แยกตาม Grade & Supplier' : 'Billet Weight (kg) by Grade & Supplier'}</span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isTh 
              ? 'วิเคราะห์ปริมาณน้ำหนักการตรวจรับ Billet เข้าคลัง แยกตามชนิดเกรดและรายชื่อผู้ผลิต' 
              : 'Analyze incoming billet weight distribution across alloy grades and suppliers'}
          </p>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className={`p-1 rounded-xl flex items-center gap-1 border ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
          }`}>
            <button
              type="button"
              onClick={() => setViewMode('byGrade')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === 'byGrade'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isTh ? "แกนนอนเป็นเกรดอลูมิเนียม แยกสีตามซัพพลายเออร์" : "X-Axis: Grade, Bars: Suppliers"}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isTh ? 'แยกตาม Grade' : 'By Grade'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('bySupplier')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === 'bySupplier'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isTh ? "แกนนอนเป็นรายชื่อผู้จัดส่ง แยกสีตามเกรด" : "X-Axis: Supplier, Bars: Grades"}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>{isTh ? 'แยกตาม Supplier' : 'By Supplier'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('dualShare')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === 'dualShare'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isTh ? "กราฟวงกลมเปรียบเทียบสัดส่วน % ของ Grade และ Supplier" : "Pie / Donut charts"}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>{isTh ? 'สัดส่วน %' : 'Share (%)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('matrix')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === 'matrix'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isTh ? "ตารางไขว้แสดงน้ำหนักทุก Grade และ Supplier" : "Cross-tab matrix table"}
            >
              <TableProperties className="w-3.5 h-3.5" />
              <span>{isTh ? 'ตาราง Matrix' : 'Matrix'}</span>
            </button>
          </div>

          {(viewMode === 'byGrade' || viewMode === 'bySupplier') && (
            <button
              type="button"
              onClick={() => setBarLayout(prev => prev === 'stacked' ? 'grouped' : 'stacked')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition ${
                isLight
                  ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title={isTh ? "สลับรูปแบบกราฟแท่งแบบสะสม หรือแยกเดี่ยว" : "Toggle stacked vs grouped bars"}
            >
              <ArrowUpDown className="w-3 h-3 text-blue-500" />
              <span>{barLayout === 'stacked' ? (isTh ? 'แท่งสะสม (Stacked)' : 'Stacked') : (isTh ? 'แท่งแยก (Grouped)' : 'Grouped')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-blue-50/60 border-blue-200' : 'bg-blue-950/20 border-blue-900/50'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${
            isLight ? 'text-blue-700' : 'text-blue-400'
          }`}>
            {isTh ? 'น้ำหนักรวมทั้งหมด (Total kg)' : 'Total Received Weight'}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-lg font-bold ${isLight ? 'text-blue-900' : 'text-blue-200'}`}>
              {totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-blue-600 font-normal">kg</span>
          </div>
          <span className="text-[10px] text-blue-600/80 font-sans block mt-0.5">
            ≈ {(totalWeight / 1000).toFixed(2)} {isTh ? 'ตัน (Tons)' : 'Tons'}
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-950/20 border-emerald-900/50'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${
            isLight ? 'text-emerald-700' : 'text-emerald-400'
          }`}>
            {isTh ? 'เกรดสูงสุด (Top Grade)' : 'Top Grade by Weight'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 truncate">
            <span className={`text-base font-bold truncate ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>
              {topGrade?.name || '-'}
            </span>
            {topGrade && totalWeight > 0 && (
              <span className="text-[11px] font-bold text-emerald-600">
                {((topGrade.weight / totalWeight) * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-[10px] text-emerald-700/80 font-sans block mt-0.5">
            {topGrade ? `${topGrade.weight.toLocaleString()} kg` : '-'}
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-amber-50/60 border-amber-200' : 'bg-amber-950/20 border-amber-900/50'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${
            isLight ? 'text-amber-700' : 'text-amber-400'
          }`}>
            {isTh ? 'ผู้จัดส่งสูงสุด (Top Supplier)' : 'Top Supplier'}
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 truncate">
            <span className={`text-base font-bold truncate ${isLight ? 'text-amber-900' : 'text-amber-200'}`} title={topSupplier?.name}>
              {topSupplier?.name || '-'}
            </span>
            {topSupplier && totalWeight > 0 && (
              <span className="text-[11px] font-bold text-amber-600">
                {((topSupplier.weight / totalWeight) * 100).toFixed(1)}%
              </span>
            )}
          </div>
          <span className="text-[10px] text-amber-700/80 font-sans block mt-0.5 truncate">
            {topSupplier ? `${topSupplier.weight.toLocaleString()} kg` : '-'}
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
        }`}>
          <span className={`text-[10px] uppercase font-bold block ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {isTh ? 'จำนวนท่อน & Heat' : 'Pcs & Heats Count'}
          </span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              {totalPcs.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">pcs</span>
          </div>
          <span className="text-[10px] text-slate-500 font-sans block mt-0.5">
            {items.length} {isTh ? 'รายการตรวจรับ' : 'Inspection items'}
          </span>
        </div>
      </div>

      {/* Filter Chips Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className={`text-[11px] font-semibold flex items-center gap-1 ${
          isLight ? 'text-slate-500' : 'text-slate-400'
        }`}>
          <Filter className="w-3 h-3 text-blue-500" />
          <span>{isTh ? 'ตัวกรองกราฟ:' : 'Filter Chart:'}</span>
        </span>

        {/* Grade Filter Select */}
        <div className="flex items-center gap-1">
          <select
            value={selectedGradeFilter}
            onChange={(e) => setSelectedGradeFilter(e.target.value)}
            className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border focus:outline-none ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 focus:border-blue-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 focus:border-cyan-500'
            }`}
          >
            <option value="ALL">{isTh ? 'ทุกลำดับ Grade (All Grades)' : 'All Grades'}</option>
            {distinctGrades.map(g => (
              <option key={g} value={g}>Grade: {g}</option>
            ))}
          </select>
        </div>

        {/* Supplier Filter Select */}
        <div className="flex items-center gap-1">
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className={`text-[11px] font-bold rounded-lg px-2.5 py-1 border focus:outline-none ${
              isLight
                ? 'bg-white border-slate-200 text-slate-700 focus:border-blue-500'
                : 'bg-slate-950 border-slate-800 text-slate-300 focus:border-cyan-500'
            }`}
          >
            <option value="ALL">{isTh ? 'ทุก Supplier (All Suppliers)' : 'All Suppliers'}</option>
            {distinctSuppliers.map(s => (
              <option key={s} value={s}>Supplier: {s}</option>
            ))}
          </select>
        </div>

        {(selectedGradeFilter !== 'ALL' || selectedSupplierFilter !== 'ALL') && (
          <button
            type="button"
            onClick={() => {
              setSelectedGradeFilter('ALL');
              setSelectedSupplierFilter('ALL');
            }}
            className="text-[11px] font-bold text-blue-600 dark:text-cyan-400 hover:underline px-1.5 py-0.5"
          >
            {isTh ? 'รีเซ็ตตัวกรอง' : 'Reset Filter'}
          </button>
        )}
      </div>

      {/* CHART CONTENT AREA */}
      <div className="mt-3">
        {/* VIEW 1: BY GRADE (X = Grade, Bars = Suppliers) */}
        {viewMode === 'byGrade' && (
          <div className="space-y-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataByGrade}
                  margin={{ top: 20, right: 30, left: 15, bottom: 25 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isLight ? '#e2e8f0' : '#334155'}
                  />
                  <XAxis
                    dataKey="grade"
                    stroke={isLight ? '#64748b' : '#94a3b8'}
                    fontSize={12}
                    fontWeight="bold"
                    tickLine={false}
                  />
                  <YAxis
                    stroke={isLight ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}t`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                    iconType="circle"
                  />
                  {distinctSuppliers
                    .filter(s => selectedSupplierFilter === 'ALL' || s === selectedSupplierFilter)
                    .map((s, idx) => (
                      <Bar
                        key={s}
                        dataKey={s}
                        name={s}
                        stackId={barLayout === 'stacked' ? 'weightStack' : undefined}
                        fill={supplierColorMap[s] || SUPPLIER_PALETTE[idx % SUPPLIER_PALETTE.length]}
                        radius={barLayout === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-center text-slate-400 font-sans">
              {isTh 
                ? 'แกน X: เกรดอลูมิเนียม | แต่ละสีแสดงน้ำหนัก (kg) ตามซัพพลายเออร์ที่ส่งมอบ' 
                : 'X-Axis: Aluminum Grade | Colors represent weight (kg) from each supplier'}
            </p>
          </div>
        )}

        {/* VIEW 2: BY SUPPLIER (X = Supplier, Bars = Grades) */}
        {viewMode === 'bySupplier' && (
          <div className="space-y-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataBySupplier}
                  margin={{ top: 20, right: 30, left: 15, bottom: 40 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={isLight ? '#e2e8f0' : '#334155'}
                  />
                  <XAxis
                    dataKey="supplier"
                    stroke={isLight ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    fontWeight="bold"
                    tickLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke={isLight ? '#64748b' : '#94a3b8'}
                    fontSize={11}
                    tickFormatter={(val) => `${(val / 1000).toFixed(0)}t`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    verticalAlign="top"
                    wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                    iconType="circle"
                  />
                  {distinctGrades
                    .filter(g => selectedGradeFilter === 'ALL' || g === selectedGradeFilter)
                    .map((g, idx) => (
                      <Bar
                        key={g}
                        dataKey={g}
                        name={`Grade ${g}`}
                        stackId={barLayout === 'stacked' ? 'gradeStack' : undefined}
                        fill={gradeColorMap[g] || getGradeColor(g, idx)}
                        radius={barLayout === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[11px] text-center text-slate-400 font-sans">
              {isTh 
                ? 'แกน X: รายชื่อผู้จัดส่ง (Supplier) | แต่ละสีแสดงน้ำหนัก (kg) ตามเกรดอลูมิเนียม' 
                : 'X-Axis: Supplier Name | Colors represent weight (kg) by aluminum grade'}
            </p>
          </div>
        )}

        {/* VIEW 3: DUAL SHARE (PIE CHARTS) */}
        {viewMode === 'dualShare' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart 1: Weight by Grade */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-950/40 border-slate-800'
            }`}>
              <h4 className="text-xs font-bold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isTh ? 'สัดส่วนตาม Grade (kg)' : 'Weight Share by Grade'}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {distinctGrades.length} {isTh ? 'เกรด' : 'grades'}
                </span>
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataGrades}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {pieDataGrades.map((entry, idx) => (
                        <Cell key={`cell-g-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {pieDataGrades.map(item => {
                  const pct = totalWeight > 0 ? ((item.value / totalWeight) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold">{item.name}</span>
                      </div>
                      <div className="font-mono text-right">
                        <span className="font-bold">{item.value.toLocaleString()} kg</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pie Chart 2: Weight by Supplier */}
            <div className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50/60 border-slate-200' : 'bg-slate-950/40 border-slate-800'
            }`}>
              <h4 className="text-xs font-bold mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isTh ? 'สัดส่วนตาม Supplier (kg)' : 'Weight Share by Supplier'}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {distinctSuppliers.length} {isTh ? 'ราย' : 'suppliers'}
                </span>
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieDataSuppliers}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {pieDataSuppliers.map((entry, idx) => (
                        <Cell key={`cell-s-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend List */}
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {pieDataSuppliers.map(item => {
                  const pct = totalWeight > 0 ? ((item.value / totalWeight) * 100).toFixed(1) : '0';
                  return (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={item.name}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="font-semibold truncate">{item.name}</span>
                      </div>
                      <div className="font-mono text-right shrink-0">
                        <span className="font-bold">{item.value.toLocaleString()} kg</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({pct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: MATRIX TABLE */}
        {viewMode === 'matrix' && (
          <div className="space-y-2">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className={`border-b text-[11px] ${
                    isLight ? 'border-slate-200 text-slate-500 bg-slate-50' : 'border-slate-800 text-slate-400 bg-slate-950'
                  }`}>
                    <th className="p-2.5 font-bold">{isTh ? 'เกรด (Grade)' : 'Grade'}</th>
                    {distinctSuppliers.map(s => (
                      <th key={s} className="p-2.5 text-right font-semibold truncate max-w-[150px]" title={s}>
                        {s}
                      </th>
                    ))}
                    <th className="p-2.5 text-right font-bold text-blue-600 dark:text-cyan-400">
                      {isTh ? 'รวมตามเกรด (kg)' : 'Total (kg)'}
                    </th>
                    <th className="p-2.5 text-right font-bold">
                      {isTh ? 'สัดส่วน %' : 'Share %'}
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y font-mono ${isLight ? 'divide-slate-100' : 'divide-slate-800/60'}`}>
                  {matrixData.map(row => {
                    const pct = totalWeight > 0 ? ((row.totalKg / totalWeight) * 100).toFixed(1) : '0';
                    return (
                      <tr key={row.grade} className={isLight ? 'hover:bg-slate-50/80' : 'hover:bg-slate-950/40'}>
                        <td className="p-2.5 font-bold" style={{ color: gradeColorMap[row.grade] }}>
                          {row.grade}
                        </td>
                        {distinctSuppliers.map(s => {
                          const w = row.suppliers[s] || 0;
                          return (
                            <td key={s} className={`p-2.5 text-right ${w > 0 ? 'text-slate-800 dark:text-slate-200 font-semibold' : 'text-slate-300 dark:text-slate-700'}`}>
                              {w > 0 ? w.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                            </td>
                          );
                        })}
                        <td className="p-2.5 text-right font-bold text-blue-700 dark:text-cyan-300 bg-blue-50/30 dark:bg-blue-950/10">
                          {row.totalKg.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-2.5 text-right font-semibold text-slate-600 dark:text-slate-400">
                          {pct}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`border-t-2 font-mono font-bold text-xs ${
                    isLight ? 'border-slate-300 bg-slate-100/70 text-slate-900' : 'border-slate-700 bg-slate-950 text-slate-100'
                  }`}>
                    <td className="p-2.5 uppercase font-sans">
                      {isTh ? 'รวมทั้งหมด (Grand Total)' : 'Grand Total'}
                    </td>
                    {distinctSuppliers.map(s => {
                      const colSum = matrixData.reduce((acc, row) => acc + (row.suppliers[s] || 0), 0);
                      return (
                        <td key={s} className="p-2.5 text-right text-emerald-600 dark:text-emerald-400">
                          {colSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                    <td className="p-2.5 text-right text-blue-700 dark:text-cyan-300 text-sm">
                      {totalWeight.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2.5 text-right">
                      100.0%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
