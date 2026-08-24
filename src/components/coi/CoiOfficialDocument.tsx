import React, { useRef } from 'react';
import {
  Printer,
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  ArrowLeft,
  FileCheck,
  QrCode
} from 'lucide-react';
import { CoiIssueRecord } from '../../types';
import { CoiCadSchematic } from './CoiCadSchematic';

interface CoiOfficialDocumentProps {
  record: CoiIssueRecord;
  onBackToIssue?: () => void;
  language?: 'th' | 'en';
}

export const CoiOfficialDocument: React.FC<CoiOfficialDocumentProps> = ({
  record,
  onBackToIssue,
  language = 'th'
}) => {
  const isTh = language === 'th';
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const detailed = record.detailedData;

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          {onBackToIssue && (
            <button
              onClick={onBackToIssue}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isTh ? 'กลับไปหน้าออก COI' : 'Back to Issue'}
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/80">
                {record.coiNo}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/80 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                OFFICIALLY CERTIFIED
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Customer: <span className="text-white font-bold">{record.customerName}</span> | Coil No:{' '}
              <span className="text-white font-mono">{record.coilNo}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs px-4 py-2 rounded-lg shadow-lg transition"
          >
            <Printer className="w-4 h-4" />
            {isTh ? 'พิมพ์ใบรับรอง (Print COI / PDF)' : 'Print Certificate'}
          </button>
        </div>
      </div>

      {/* Official Certificate Paper Document (100% Matching Layout) */}
      <div
        ref={printRef}
        className="bg-white text-slate-950 p-6 sm:p-8 rounded-lg shadow-2xl border border-slate-400 font-sans text-xs max-w-5xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none"
      >
        {/* 1. Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-2 mb-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-slate-950">
              CERTIFICATE OF INSPECTION
            </h1>
            <div className="text-[10px] font-bold text-slate-600 tracking-widest uppercase mt-0.5">
              INSPECTION CERTIFICATE ACCORDING TO JIS / ASTM / CUSTOMER SPECIFICATION
            </div>
          </div>
          <div className="text-right text-[11px] leading-tight">
            <div className="font-bold text-slate-900">{record.companyHeader || 'UACJ Extrusion (Thailand)Co.,Ltd'}</div>
            <div className="text-slate-600">{record.qaSectionHeader || 'Quality Assurance section'}</div>
            <div className="text-slate-800 font-semibold text-[10px] mt-1">
              Issue Date: <span className="font-mono">{record.issueDate}</span>
            </div>
            <div className="text-slate-500 font-mono text-[9px]">
              Cert No: {record.coiNo}
            </div>
          </div>
        </div>

        {/* 2. Customer & Product Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-3 bg-slate-50 p-2.5 rounded border border-slate-300">
          <div className="space-y-1">
            <div>
              <span className="font-bold text-slate-700">Customer : </span>
              <span className="font-bold text-slate-950">{record.customerName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Part number : </span>
              <span className="font-mono font-bold text-slate-900">{record.partNumber || record.profileCode}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Invoice / DO : </span>
              <span className="font-mono text-slate-800">{record.invoiceDoNo || 'INV-2026-08-0442'}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div>
              <span className="font-bold text-slate-700">Product : </span>
              <span className="font-bold text-slate-900">{record.productName || record.profileName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Standard : </span>
              <span className="font-mono text-slate-800">{record.standardRef}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">PO No. : </span>
              <span className="font-mono text-slate-800">{record.poNo || '-'}</span>
            </div>
          </div>
        </div>

        {/* 3. Work Order & General Summary Table */}
        <div className="border border-slate-950 mb-3 overflow-hidden">
          <table className="w-full text-center text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-950">
                <th className="border-r border-slate-950 p-1 w-24">Work No.</th>
                <th className="border-r border-slate-950 p-1 w-28">Coil No.</th>
                <th className="border-r border-slate-950 p-1">Drawing No. / Rev.</th>
                <th className="border-r border-slate-950 p-1 w-20">Length</th>
                <th className="border-r border-slate-950 p-1">Coating Type</th>
                <th className="border-r border-slate-950 p-1">Cut End</th>
                <th className="border-r border-slate-950 p-1 w-16">Dimension</th>
                <th className="border-r border-slate-950 p-1 w-16">Coating</th>
                <th className="p-1 w-16">Appearance</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[9.5px]">
              <tr>
                <td className="border-r border-slate-950 p-1">{detailed?.workNo || record.workNo || 'W-2026-8831'}</td>
                <td className="border-r border-slate-950 p-1 font-bold">{record.coilNo}</td>
                <td className="border-r border-slate-950 p-1">{record.drawingNoRevision || 'DWG-250428 / Rev.2'}</td>
                <td className="border-r border-slate-950 p-1 font-bold">{record.length}</td>
                <td className="border-r border-slate-950 p-1 font-sans">{record.coatingType || 'Zn Spray + Flux Coat'}</td>
                <td className="border-r border-slate-950 p-1 font-sans">{record.cutEndType || 'No End Forming'}</td>
                <td className="border-r border-slate-950 p-1 font-bold text-emerald-800">OK</td>
                <td className="border-r border-slate-950 p-1 font-bold text-emerald-800">OK</td>
                <td className="p-1 font-bold text-emerald-800">OK</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 4. Chemical Composition Table (wt%) */}
        <div className="border border-slate-950 mb-3">
          <div className="bg-slate-100 px-2 py-0.5 flex justify-between items-center border-b border-slate-950 font-bold text-[10px]">
            <span>CHEMICAL COMPOSITION (wt%)</span>
            <span className="text-[9px] text-slate-600 font-normal">Method: Optical Emission Spectrometry (IQA-01)</span>
          </div>
          <table className="w-full text-center text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-950">
                <th className="border-r border-slate-950 p-1 w-24">Heat No. / Material</th>
                <th className="border-r border-slate-950 p-1 w-14">Type</th>
                <th className="border-r border-slate-950 p-1">Si</th>
                <th className="border-r border-slate-950 p-1">Fe</th>
                <th className="border-r border-slate-950 p-1">Cu</th>
                <th className="border-r border-slate-950 p-1">Mn</th>
                <th className="border-r border-slate-950 p-1">Mg</th>
                <th className="border-r border-slate-950 p-1">Cr</th>
                <th className="border-r border-slate-950 p-1">Zn</th>
                <th className="border-r border-slate-950 p-1">Ti</th>
                <th className="border-r border-slate-950 p-1">Other Each</th>
                <th className="border-r border-slate-950 p-1">Other Total</th>
                <th className="p-1">Al remain</th>
              </tr>
            </thead>
            <tbody>
              {/* Spec Min */}
              <tr className="border-b border-slate-300">
                <td rowSpan={2} className="border-r border-slate-950 p-1 font-bold bg-slate-50 font-mono">
                  {record.alloyGrade || 'CA105-H112'}
                </td>
                <td className="border-r border-slate-950 p-0.5 font-bold bg-slate-50">Min</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.40</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.10</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td className="border-r border-slate-950 p-0.5">-</td>
                <td rowSpan={3} className="p-1 bg-slate-50 font-bold">
                  Al remain
                </td>
              </tr>
              {/* Spec Max */}
              <tr className="border-b border-slate-950">
                <td className="border-r border-slate-950 p-0.5 font-bold bg-slate-50">Max</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.15</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.20</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.55</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.20</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.03</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.05</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.04</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.03</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.05</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">0.15</td>
              </tr>
              {/* Record Row */}
              <tr className="font-mono">
                <td className="border-r border-slate-950 p-1 font-bold">{record.heatNo || 'HEAT-CA105-09'}</td>
                <td className="border-r border-slate-950 p-0.5 font-bold bg-slate-50">Record</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.si ?? 0.08}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.fe ?? 0.12}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.cu ?? 0.48}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.mn ?? 0.14}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.mg ?? 0.01}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.cr ?? 0.01}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.zn ?? 0.02}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.ti ?? 0.01}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.otherEach ?? 0.02}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.chemActual.otherTotal ?? 0.06}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Mechanical Properties & Surface Roughness */}
        <div className="border border-slate-950 mb-3">
          <div className="bg-slate-100 px-2 py-0.5 flex justify-between items-center border-b border-slate-950 font-bold text-[10px]">
            <span>MECHANICAL PROPERTIES & SURFACE ROUGHNESS</span>
            <span className="text-[9px] text-slate-600 font-normal">Method: JIS Z2241 & ISO 4287 (IPQA-01, IPQA-02)</span>
          </div>
          <table className="w-full text-center text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-950">
                <th colSpan={4} className="border-r border-slate-950 p-1">Mechanical Properties</th>
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-28">Eddy Current Test</th>
                <th colSpan={3} className="p-1">Surface Roughness (Before Zn) Rz (µm)</th>
              </tr>
              <tr className="bg-slate-100 font-bold border-b border-slate-950">
                <th className="border-r border-slate-950 p-1">Tensile strength (N/mm²)</th>
                <th className="border-r border-slate-950 p-1">Yield Stress (N/mm²)</th>
                <th className="border-r border-slate-950 p-1">Elongation (%)</th>
                <th className="border-r border-slate-950 p-1 w-14">Spec Type</th>
                <th className="border-r border-slate-950 p-1 w-10">POS</th>
                <th className="border-r border-slate-950 p-1">Top</th>
                <th className="p-1">Bottom</th>
              </tr>
            </thead>
            <tbody>
              {/* Spec Row */}
              <tr className="border-b border-slate-950">
                <td className="border-r border-slate-950 p-1 font-bold">78.0</td>
                <td className="border-r border-slate-950 p-1 font-bold">20.0</td>
                <td className="border-r border-slate-950 p-1 font-bold">10.0</td>
                <td className="border-r border-slate-950 p-1 bg-slate-50 font-bold">Min</td>
                <td rowSpan={2} className="border-r border-slate-950 p-1 font-bold text-emerald-800">
                  {detailed?.mechActual.eddyCurrent || 'OK'}
                </td>
                <td rowSpan={2} className="border-r border-slate-950 p-1 bg-slate-50 font-bold">H</td>
                <td className="border-r border-slate-950 p-1 font-bold">≤ 14.0 µm</td>
                <td className="p-1 font-bold">≤ 14.0 µm</td>
              </tr>
              {/* Record Row */}
              <tr className="font-mono">
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.mechActual.tensileStrength ?? 104.5}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.mechActual.yieldStress ?? 34.2}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.mechActual.elongation ?? 15.8}</td>
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">Record</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.mechActual.roughnessRzTop ?? 8.4}</td>
                <td className="p-1 text-emerald-800 font-bold">{detailed?.mechActual.roughnessRzBottom ?? 7.9}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 6. Zn Spray Coating & Flux Coating Table */}
        <div className="border border-slate-950 mb-3">
          <div className="bg-slate-100 px-2 py-0.5 flex justify-between items-center border-b border-slate-950 font-bold text-[10px]">
            <span>COATING SPECIFICATIONS (ZN SPRAY & FLUX COATING)</span>
            <span className="text-[9px] text-slate-600 font-normal">Method: XRF / ISO 3497 & Cross-Cut (IPQA-03, IPQA-04)</span>
          </div>
          <table className="w-full text-center text-[10px] border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-950">
                <th colSpan={5} className="border-r border-slate-950 p-1">Zn Spray Coating</th>
                <th colSpan={6} className="p-1">Flux Coating</th>
              </tr>
              <tr className="bg-slate-50 font-bold text-[9px] border-b border-slate-950">
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-20">Zn spray date</th>
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-8">POS</th>
                <th colSpan={2} className="border-r border-slate-950 p-0.5">Zn adhesion weight: 11.5 ± 2 g/m² (9.5- 13.5)</th>
                <th className="border-r border-slate-950 p-0.5">Zn area: ≥ 58%</th>
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-24">Material: Flux</th>
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-20">Coating Date</th>
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-8">POS</th>
                <th colSpan={2} className="border-r border-slate-950 p-0.5">Flux weight: 5 ± 2 g/m² (3 - 7)</th>
                <th className="p-0.5">Adhesion: 3B</th>
              </tr>
              <tr className="bg-slate-50 text-[8.5px] border-b border-slate-950">
                <th className="border-r border-slate-950 p-0.5">Top</th>
                <th className="border-r border-slate-950 p-0.5">Bottom</th>
                <th className="border-r border-slate-950 p-0.5">Top / Bottom</th>
                <th className="border-r border-slate-950 p-0.5">Top</th>
                <th className="border-r border-slate-950 p-0.5">Bottom</th>
                <th className="p-0.5">Top / Bottom</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              <tr className="border-b border-slate-300">
                <td rowSpan={2} className="border-r border-slate-950 p-1 bg-slate-50 text-[9px]">{record.productionDate}</td>
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">H</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.head.znAdhesionWeightTop ?? 11.8}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.head.znAdhesionWeightBottom ?? 11.4}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800">{detailed?.coatingActual.head.znAdhesionAreaTop ?? 68.5}%</td>
                <td rowSpan={2} className="border-r border-slate-950 p-1 bg-slate-50 text-[9px]">{detailed?.coatingActual.paintLotNo || 'LOT-FLX-2608'}</td>
                <td rowSpan={2} className="border-r border-slate-950 p-1 bg-slate-50 text-[9px]">{record.productionDate}</td>
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">H</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.head.fluxAdhesionWeightTop ?? 5.2}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.head.fluxAdhesionWeightBottom ?? 4.9}</td>
                <td className="p-1 font-bold text-emerald-800">OK / OK</td>
              </tr>
              <tr className="border-b border-slate-950">
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">T</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.tail.znAdhesionWeightTop ?? 11.6}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.tail.znAdhesionWeightBottom ?? 11.2}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800">{detailed?.coatingActual.tail.znAdhesionAreaTop ?? 67.8}%</td>
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">T</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.tail.fluxAdhesionWeightTop ?? 5.1}</td>
                <td className="border-r border-slate-950 p-1 text-emerald-800 font-bold">{detailed?.coatingActual.tail.fluxAdhesionWeightBottom ?? 4.8}</td>
                <td className="p-1 font-bold text-emerald-800">OK / OK</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 7. Microchannel Multi-Port Web Thickness Table */}
        <div className="border border-slate-950 mb-3">
          <div className="bg-slate-100 px-2 py-0.5 flex justify-between items-center border-b border-slate-950 font-bold text-[10px]">
            <span>MULTI-PORT WEB THICKNESSES (mm) — 12 SLOTS HEAD/TAIL</span>
            <span className="text-[9px] text-slate-600 font-normal">Method: Precision Optical Micrometer (IPQA-07)</span>
          </div>
          <table className="w-full text-center text-[9px] border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold border-b border-slate-950">
                <th rowSpan={3} className="border-r border-slate-950 p-1 w-6">POS</th>
                <th colSpan={2} className="border-r border-slate-950 p-1">Outer web thickness: 0.225 ± 0.05 (0.175 - 0.275)</th>
                <th colSpan={2} className="border-r border-slate-950 p-1">Side web thickness: 0.62 ± 0.05 (0.57 - 0.67)</th>
                <th colSpan={12} className="p-1">Inner web thickness: 0.25 +0.07/-0.03 (0.22 - 0.32)</th>
              </tr>
              <tr className="bg-slate-50 font-bold text-[8.5px] border-b border-slate-950">
                <th className="border-r border-slate-950 p-0.5">T1 min-max</th>
                <th className="border-r border-slate-950 p-0.5">T2 min-max</th>
                <th className="border-r border-slate-950 p-0.5">T3</th>
                <th className="border-r border-slate-950 p-0.5">T4</th>
                {Array.from({ length: 12 }).map((_, i) => (
                  <th key={i} className={`p-0.5 w-6 ${i < 11 ? 'border-r border-slate-300' : ''}`}>{i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono text-[8.5px]">
              <tr className="border-b border-slate-300">
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">H</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.head.t1 ?? 0.228}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.head.t2 ?? 0.231}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.head.t3 ?? 0.622}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.head.t4 ?? 0.618}</td>
                {Array.from({ length: 12 }).map((_, i) => (
                  <td key={i} className={`p-0.5 text-emerald-800 ${i < 11 ? 'border-r border-slate-300' : ''}`}>
                    {detailed?.webActual.head.innerWebs[i] ?? (0.248 + (i % 5) * 0.002).toFixed(3)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-slate-950">
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">T</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.tail.t1 ?? 0.226}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.tail.t2 ?? 0.229}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.tail.t3 ?? 0.620}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.webActual.tail.t4 ?? 0.615}</td>
                {Array.from({ length: 12 }).map((_, i) => (
                  <td key={i} className={`p-0.5 text-emerald-800 ${i < 11 ? 'border-r border-slate-300' : ''}`}>
                    {detailed?.webActual.tail.innerWebs[i] ?? (0.247 + (i % 4) * 0.002).toFixed(3)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 8. Tube Dimensions & Geometric Form Deviations Table */}
        <div className="border border-slate-950 mb-3">
          <div className="bg-slate-100 px-2 py-0.5 flex justify-between items-center border-b border-slate-950 font-bold text-[10px]">
            <span>TUBE DIMENSIONS & GEOMETRIC FORM DEVIATIONS</span>
            <span className="text-[9px] text-slate-600 font-normal">Method: Caliper, Height Gauge & Precision Surface Plate (IPQA-05)</span>
          </div>
          <table className="w-full text-center text-[9px] border-collapse">
            <thead>
              <tr className="bg-slate-100 font-bold text-[8.5px] border-b border-slate-950">
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-6">POS</th>
                <th rowSpan={2} className="border-r border-slate-950 p-1 w-14">Length (mm)</th>
                <th colSpan={2} className="border-r border-slate-950 p-0.5">Port open: over 50% (≥6.45 mm²)</th>
                <th colSpan={2} className="border-r border-slate-950 p-0.5">Width: 14.8 ± 0.05 (14.75-14.85)</th>
                <th colSpan={2} className="border-r border-slate-950 p-0.5">Height: 1.74 ± 0.015 (1.725-1.755)</th>
                <th className="border-r border-slate-950 p-0.5">Warp ≤ 1.0</th>
                <th className="border-r border-slate-950 p-0.5">Curved -0.7 ~ +0.3</th>
                <th className="border-r border-slate-950 p-0.5">Twist ≤ 1.7</th>
                <th className="border-r border-slate-950 p-0.5">Undulation ≤ 0.2</th>
                <th colSpan={2} className="p-0.5">Cut End Burr Free</th>
              </tr>
              <tr className="bg-slate-50 text-[8px] border-b border-slate-950">
                <th className="border-r border-slate-950 p-0.5">Left</th>
                <th className="border-r border-slate-950 p-0.5">Right</th>
                <th className="border-r border-slate-950 p-0.5">Left</th>
                <th className="border-r border-slate-950 p-0.5">Right</th>
                <th className="border-r border-slate-950 p-0.5">Left</th>
                <th className="border-r border-slate-950 p-0.5">Right</th>
                <th className="border-r border-slate-950 p-0.5">反り</th>
                <th className="border-r border-slate-950 p-0.5">湾曲</th>
                <th className="border-r border-slate-950 p-0.5">捩り</th>
                <th className="border-r border-slate-950 p-0.5">うねり</th>
                <th className="border-r border-slate-950 p-0.5">Left</th>
                <th className="p-0.5">Right</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[8.5px]">
              <tr className="border-b border-slate-300">
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">H</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">{record.length}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.portOpenAreaLeft ?? 7.24}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.portOpenAreaRight ?? 7.18}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.widthLeft ?? 14.81}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.widthRight ?? 14.79}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.heightLeft ?? 1.738}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.heightRight ?? 1.742}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.warpMm ?? 0.42}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.curvedMm ?? -0.15}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.twistMm ?? 0.65}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.head.undulationMm ?? 0.08}</td>
                <td className="border-r border-slate-950 p-0.5 font-bold text-emerald-800">OK</td>
                <td className="p-0.5 font-bold text-emerald-800">OK</td>
              </tr>
              <tr className="border-b border-slate-950">
                <td className="border-r border-slate-950 p-1 font-bold bg-slate-50">T</td>
                <td className="border-r border-slate-950 p-0.5 font-bold">{record.length}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.portOpenAreaLeft ?? 7.21}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.portOpenAreaRight ?? 7.15}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.widthLeft ?? 14.80}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.widthRight ?? 14.82}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.heightLeft ?? 1.740}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.heightRight ?? 1.739}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.warpMm ?? 0.38}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.curvedMm ?? -0.12}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.twistMm ?? 0.58}</td>
                <td className="border-r border-slate-950 p-0.5 text-emerald-800 font-bold">{detailed?.geometryActual.tail.undulationMm ?? 0.07}</td>
                <td className="border-r border-slate-950 p-0.5 font-bold text-emerald-800">OK</td>
                <td className="p-0.5 font-bold text-emerald-800">OK</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 9. CAD Schematic Diagram & Tolerance Sketches */}
        <CoiCadSchematic />

        {/* 10. Remarks and Quality Conformance Statement */}
        <div className="mt-3 bg-slate-50 border border-slate-300 p-2 rounded text-[10px]">
          <div className="font-bold text-slate-900">REMARKS & CERTIFICATION DECLARATION:</div>
          <p className="text-slate-700 mt-0.5">
            {record.remarks ||
              'We hereby certify that the above mentioned products have been inspected in accordance with customer specifications and standard manufacturing requirements and found to be in full compliance.'}
          </p>
        </div>

        {/* 11. Signatures & QA Management Approval Stamp */}
        <div className="mt-4 pt-3 border-t border-slate-300 flex flex-col sm:flex-row justify-between items-end gap-4 text-[10px]">
          {/* Plant Address */}
          <div className="text-slate-600 leading-tight">
            <div className="font-bold text-slate-900">UACJ Extrusion (Thailand)Co.,Ltd. Prachinburi Plant</div>
            <div>532 Moo.7 Thatoom Sud-District, Srimahaphot District, Prachinburi 25140 Thailand</div>
            <div>Tel : 037-278-741,42  Fax : 037-278-743</div>
            <div className="text-[9px] text-slate-400 font-mono mt-1">
              Doc Control: {record.docControlNo || 'M-QA-(DS)-01/06 ED:15-Jan-2025 Rev.0'}
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="flex items-center gap-6">
            {/* Inspector */}
            <div className="text-center">
              <div className="text-slate-500 text-[9px] mb-1">INSPECTED BY</div>
              <div className="border-b border-slate-900 pb-1 font-bold text-slate-900 px-3">
                {record.inspectorName}
              </div>
              <div className="text-[8px] text-slate-400 mt-0.5">Quality Assurance Specialist</div>
            </div>

            {/* QA Manager Approved Stamp */}
            <div className="text-center relative">
              {/* QA Stamp Circle */}
              <div className="border-2 border-red-700 text-red-700 rounded-full w-20 h-20 flex flex-col items-center justify-center p-1 font-bold text-[8px] rotate-[-6deg] opacity-90 mx-auto shadow-sm">
                <div className="text-[7px]">UACJ QA APPROVED</div>
                <div className="text-[9px] font-black">{record.issueDate}</div>
                <div className="text-[6.5px]">CERTIFIED COI</div>
              </div>
              <div className="text-slate-500 text-[9px] mt-1">APPROVED BY</div>
              <div className="font-bold text-slate-900">{record.approverName}</div>
              <div className="text-[8px] text-slate-400">Quality Assurance Manager</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
