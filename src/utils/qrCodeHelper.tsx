import React, { useMemo, useState } from 'react';
import QRCode, { QRCodeErrorCorrectionLevel } from 'qrcode';
import { X, Copy, Check, QrCode, Maximize2 } from 'lucide-react';
import { BilletInspectionItem, ZnWireInspectionRecord, ChemicalInspectionEntry } from '../types';

export type QrDataMode = 'full' | 'id' | 'code_only';

export interface QrSvgOptions {
  margin?: number;
  color?: string;
  bgColor?: string;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
}

/**
 * Helper to convert QR module data into standard continuous horizontal stroke runs.
 * This is the ISO/IEC compliant rendering algorithm from node-qrcode that eliminates
 * anti-aliasing gaps and micro-polygon seams, ensuring 100% optical readability on all scanners.
 */
function qrToSvgPath(data: Uint8Array | number[], size: number, margin: number): string {
  let path = '';
  let moveBy = 0;
  let newRow = false;
  let lineLength = 0;
  for (let i = 0; i < data.length; i++) {
    const col = Math.floor(i % size);
    const row = Math.floor(i / size);
    if (!col && !newRow) newRow = true;
    if (data[i]) {
      lineLength++;
      if (!(i > 0 && col > 0 && data[i - 1])) {
        path += newRow
          ? `M${col + margin} ${0.5 + row + margin}`
          : `m${moveBy} 0`;
        moveBy = 0;
        newRow = false;
      }
      if (!(col + 1 < size && data[i + 1])) {
        path += `h${lineLength}`;
        lineLength = 0;
      }
    } else {
      moveBy++;
    }
  }
  return path;
}

/**
 * Generate a synchronous, 100% compliant QR Code SVG string.
 * Uses crispEdges vector stroke path with standard 4-module quiet zone for maximum scanner legibility when printed or rendered.
 */
export function generateQrSvgString(text: string, options: QrSvgOptions = {}): string {
  const {
    margin = 4,
    color = '#000000',
    bgColor = '#ffffff',
    errorCorrectionLevel
  } = options;

  const cleanText = (text || '').trim() || 'NO-DATA';
  // Use 'L' for high-density payloads (>60 chars) to produce larger, far more scannable modules on screens
  const effectiveEcl = errorCorrectionLevel || (cleanText.length > 60 ? 'L' : 'M');
  const safeMargin = Math.max(margin, 4);

  try {
    const qr = QRCode.create(cleanText, { errorCorrectionLevel: effectiveEcl });
    const count = qr.modules.size;
    const sizeWithMargin = count + safeMargin * 2;
    const d = qrToSvgPath(qr.modules.data, count, safeMargin);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${sizeWithMargin} ${sizeWithMargin}" shape-rendering="crispEdges" style="width:100%;height:100%;display:block;background-color:${bgColor};"><path fill="${bgColor}" d="M0 0h${sizeWithMargin}v${sizeWithMargin}H0z"/><path stroke="${color}" stroke-width="1" fill="none" d="${d}"/></svg>`;
  } catch (err) {
    console.error('Failed to generate QR code SVG string:', err);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60"><rect width="100%" height="100%" fill="#fee2e2"/><text x="30" y="32" text-anchor="middle" font-size="8" fill="#991b1b">QR Error</text></svg>`;
  }
}

/**
 * React Component to render a vector QR Code directly in JSX.
 */
export interface QRCodeViewProps {
  value: string;
  size?: number | string;
  margin?: number;
  color?: string;
  bgColor?: string;
  className?: string;
  errorCorrectionLevel?: QRCodeErrorCorrectionLevel;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 72,
  margin = 4,
  color = '#000000',
  bgColor = '#ffffff',
  className = '',
  errorCorrectionLevel
}) => {
  const safeMargin = Math.max(margin, 4);
  const cleanText = (value || '').trim() || 'NO-DATA';
  // Use 'L' for high-density payloads to give larger modules for direct screen scanning
  const effectiveEcl = errorCorrectionLevel || (cleanText.length > 60 ? 'L' : 'M');

  const { viewBox, path, sizeWithMargin } = useMemo(() => {
    try {
      const qr = QRCode.create(cleanText, { errorCorrectionLevel: effectiveEcl as QRCodeErrorCorrectionLevel });
      const count = qr.modules.size;
      const total = count + safeMargin * 2;
      const d = qrToSvgPath(qr.modules.data, count, safeMargin);
      return {
        viewBox: `0 0 ${total} ${total}`,
        path: d,
        sizeWithMargin: total
      };
    } catch (err) {
      console.error('Failed to render QRCodeView:', err);
      return { viewBox: '0 0 60 60', path: '', sizeWithMargin: 60 };
    }
  }, [cleanText, safeMargin, effectiveEcl]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={size}
      height={size}
      className={className}
      shapeRendering="crispEdges"
      style={{ display: 'block', maxWidth: '100%', height: 'auto', aspectRatio: '1/1', backgroundColor: bgColor }}
    >
      <path fill={bgColor} d={`M0 0h${sizeWithMargin}v${sizeWithMargin}H0z`} />
      {path ? (
        <path stroke={color} strokeWidth="1" fill="none" d={path} />
      ) : (
        <text x="30" y="32" textAnchor="middle" fontSize="7" fill="#dc2626">
          ERR
        </text>
      )}
    </svg>
  );
};

// ============================================================================
// IQA QR Code Payload Builders
// ============================================================================

/**
 * Builds the QR string payload for IQA-01 Billet Incoming Inspection tags.
 */
export function getBilletQrPayload(item: BilletInspectionItem, mode: QrDataMode = 'full'): string {
  if (mode === 'id' || (mode as string) === 'code_only') {
    return (item.heat_number || '').trim() || 'BILLET-PASS';
  }
  const dateStr = item.timestamp || (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const lines = [
    `QA: IQA-01 PASS`,
    `HEAT: ${item.heat_number || '-'}`,
    `GRADE: ${item.grade || '-'}`,
    `SIZE: ${item.billet_size || '-'}`,
    `SUPP: ${item.supplier_name || '-'}`,
    `QTY: ${item.quantity_pcs || '0'} PCS`,
    `WT: ${item.weight_kg || '0'} KG`,
    `DATE: ${dateStr}`
  ];
  return lines.join('\n');
}

/**
 * Builds the QR string payload for IQA-02 Zinc Wire Incoming Inspection tags.
 */
export function getZnWireQrPayload(item: ZnWireInspectionRecord, mode: QrDataMode = 'full'): string {
  if (mode === 'id' || (mode as string) === 'code_only') {
    return (item.heat_number || item.po_no || '').trim() || 'ZN-WIRE-PASS';
  }
  const dateStr = item.timestamp || item.date || new Date().toISOString().split('T')[0];
  const lines = [
    `QA: IQA-02 PASS`,
    `HEAT: ${item.heat_number || '-'}`,
    `GRADE: ${item.grade || '-'}`,
    `SUPP: ${item.supplier || '-'}`,
    `PO: ${item.po_no || '-'}`,
    `DRUM: ${item.drum || '-'}`,
    `QTY: ${item.quantity_pcs || '0'} PCS`,
    `WT: ${item.weight_kg || '0'} KG`,
    `DATE: ${dateStr}`
  ];
  return lines.join('\n');
}

/**
 * Builds the QR string payload for IQA-03 Chemical Incoming Inspection tags.
 */
export function getChemQrPayload(item: ChemicalInspectionEntry, mode: QrDataMode = 'full'): string {
  if (mode === 'id' || (mode as string) === 'code_only') {
    return (item.batch_lot || '').trim() || 'CHEM-PASS';
  }
  const dateStr = item.date || (item.timestamp ? item.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]);
  const lines = [
    `QA: IQA-03 PASS`,
    `LOT: ${item.batch_lot || '-'}`,
    `CHEM: ${item.chemical || '-'}`,
    `SUPP: ${item.supplier || '-'}`,
    `QTY: ${item.qty || '0'} ${item.packaging || 'drum'}`,
    `WT: ${item.weight || '0'} KG`,
    `EXP: ${item.expiration || '-'}`,
    `DATE: ${dateStr}`
  ];
  return lines.join('\n');
}

/**
 * Interactive High-Definition QR Zoom Modal.
 * Renders a large (240px) vector QR code with generous quiet zone padding,
 * allowing instant scanning from computer monitors with any smartphone camera or optical scanner.
 */
export interface QrZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  payload: string;
  isLight?: boolean;
  language?: 'th' | 'en';
}

export const QrZoomModal: React.FC<QrZoomModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  payload,
  isLight = true,
  language = 'th'
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isTh = language === 'th';

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Large QR Display Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950/50">
          <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col items-center">
            <QRCodeView
              value={payload}
              size={240}
              margin={4}
              color="#000000"
              bgColor="#ffffff"
            />
            <span className="text-[10px] font-semibold text-slate-600 mt-2 tracking-wide uppercase">
              {isTh ? 'สแกนได้ทันทีผ่านหน้าจอ (Screen Scannable)' : 'Direct Screen Scannable QR'}
            </span>
          </div>
        </div>

        {/* Text Payload Preview & Copy */}
        <div className="p-4 space-y-2 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[11px] text-slate-500 uppercase">
              {isTh ? 'ข้อมูลใน QR Code (Decoded Text):' : 'QR Payload Text:'}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">{isTh ? 'คัดลอกแล้ว' : 'Copied'}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{isTh ? 'คัดลอกข้อความ' : 'Copy Text'}</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl font-mono text-[11px] text-slate-800 dark:text-slate-200 max-h-36 overflow-y-auto whitespace-pre-wrap leading-relaxed border border-slate-200/60 dark:border-slate-800">
            {payload}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100/70 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            {isTh ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
