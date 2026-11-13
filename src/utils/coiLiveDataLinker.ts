import {
  BilletCuttingRecord,
  BilletInspectionItem,
  ChemicalInspectionEntry,
  CoatingInspectionRecord,
  CoiCustomerTemplate,
  CoiDataSourceModule,
  CuttingInspectionRecord,
  DetailedCoiMeasuredData,
  FgPreShipmentRecord,
  MixingInspectionRecord,
  RoughnessInspectionRecord,
  TensileRecord,
  ThicknessWallRecord,
  WallMeasurementValRange,
  XRayInspectionRecord,
  ZnWireInspectionRecord
} from '../types';
import { forceRefreshCloudData } from '../services/firestoreSync';
import { generateDetailedMeasuredDataForCustomer } from './coiStorage';

export const CLOUD_LINK_KEYS = {
  IQA_01: 'billet_qc_history',
  IQA_02: 'chem_qc_history',
  IQA_03: 'zn_wire_history',
  IPQA_01: 'tensile_qc_records',
  IPQA_02: 'roughness_qc_inspections',
  IPQA_03: 'xray_qc_inspections',
  IPQA_04: 'coating_qc_inspections',
  IPQA_05: 'cutting_qc_inspections',
  IPQA_06: 'mixing_qc_inspections',
  IPQA_07: 'tw_measurement_records',
  IPQA_08: 'ipqa08_billet_records',
  OQA_01: 'fg_inspection_history'
} as const;

export interface AllCloudInspectionDatasets {
  iqa01: BilletInspectionItem[];
  iqa02: ChemicalInspectionEntry[];
  iqa03: ZnWireInspectionRecord[];
  ipqa01: TensileRecord[];
  ipqa02: RoughnessInspectionRecord[];
  ipqa03: XRayInspectionRecord[];
  ipqa04: CoatingInspectionRecord[];
  ipqa05: CuttingInspectionRecord[];
  ipqa06: MixingInspectionRecord[];
  ipqa07: ThicknessWallRecord[];
  ipqa08: BilletCuttingRecord[];
  oqa01: FgPreShipmentRecord[];
}

export interface ModuleLinkStatus {
  moduleCode: CoiDataSourceModule | 'IPQA-08' | 'IPQA-06' | 'IQA-03';
  moduleNameTh: string;
  moduleNameEn: string;
  linkKeyType: 'HEAT_NO' | 'COIL_NO' | 'HEAT_AND_COIL' | 'COIL_AND_LENGTH';
  matched: boolean;
  matchedKeyDisplay: string;
  recordCount: number;
  summary: string;
  status: 'PASS' | 'FAIL' | 'NOT_FOUND';
}

export interface CoiLiveLinkResult {
  measuredData: DetailedCoiMeasuredData;
  moduleStatuses: ModuleLinkStatus[];
  matchedModulesCount: number;
  totalCheckedModules: number;
  detectedLengthMm?: string;
  detectedWorkNo?: string;
  detectedHeatNo?: string;
  hasAnyFail: boolean;
  lastSyncedAt: string;
}

function readLocalArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getCachedCloudInspectionDatasets(): AllCloudInspectionDatasets {
  return {
    iqa01: readLocalArray<BilletInspectionItem>(CLOUD_LINK_KEYS.IQA_01),
    iqa02: readLocalArray<ChemicalInspectionEntry>(CLOUD_LINK_KEYS.IQA_02),
    iqa03: readLocalArray<ZnWireInspectionRecord>(CLOUD_LINK_KEYS.IQA_03),
    ipqa01: readLocalArray<TensileRecord>(CLOUD_LINK_KEYS.IPQA_01),
    ipqa02: readLocalArray<RoughnessInspectionRecord>(CLOUD_LINK_KEYS.IPQA_02),
    ipqa03: readLocalArray<XRayInspectionRecord>(CLOUD_LINK_KEYS.IPQA_03),
    ipqa04: readLocalArray<CoatingInspectionRecord>(CLOUD_LINK_KEYS.IPQA_04),
    ipqa05: readLocalArray<CuttingInspectionRecord>(CLOUD_LINK_KEYS.IPQA_05),
    ipqa06: readLocalArray<MixingInspectionRecord>(CLOUD_LINK_KEYS.IPQA_06),
    ipqa07: readLocalArray<ThicknessWallRecord>(CLOUD_LINK_KEYS.IPQA_07),
    ipqa08: readLocalArray<BilletCuttingRecord>(CLOUD_LINK_KEYS.IPQA_08),
    oqa01: readLocalArray<FgPreShipmentRecord>(CLOUD_LINK_KEYS.OQA_01)
  };
}

export async function fetchFreshCloudInspectionDatasets(): Promise<AllCloudInspectionDatasets> {
  await Promise.allSettled([
    forceRefreshCloudData<BilletInspectionItem[]>(CLOUD_LINK_KEYS.IQA_01),
    forceRefreshCloudData<ChemicalInspectionEntry[]>(CLOUD_LINK_KEYS.IQA_02),
    forceRefreshCloudData<ZnWireInspectionRecord[]>(CLOUD_LINK_KEYS.IQA_03),
    forceRefreshCloudData<TensileRecord[]>(CLOUD_LINK_KEYS.IPQA_01),
    forceRefreshCloudData<RoughnessInspectionRecord[]>(CLOUD_LINK_KEYS.IPQA_02),
    forceRefreshCloudData<XRayInspectionRecord[]>(CLOUD_LINK_KEYS.IPQA_03),
    forceRefreshCloudData<CoatingInspectionRecord[]>(CLOUD_LINK_KEYS.IPQA_04),
    forceRefreshCloudData<CuttingInspectionRecord[]>(CLOUD_LINK_KEYS.IPQA_05),
    forceRefreshCloudData<MixingInspectionRecord[]>(CLOUD_LINK_KEYS.IPQA_06),
    forceRefreshCloudData<ThicknessWallRecord[]>(CLOUD_LINK_KEYS.IPQA_07),
    forceRefreshCloudData<BilletCuttingRecord[]>(CLOUD_LINK_KEYS.IPQA_08),
    forceRefreshCloudData<FgPreShipmentRecord[]>(CLOUD_LINK_KEYS.OQA_01)
  ]);

  return getCachedCloudInspectionDatasets();
}

function normalizeId(val?: string | number | null): string {
  if (val === undefined || val === null) return '';
  return String(val).trim().toUpperCase().replace(/\s+/g, '');
}

function isKeyMatch(candidate?: string | number | null, query?: string | number | null): boolean {
  const c = normalizeId(candidate);
  const q = normalizeId(query);
  if (!c || !q) return false;
  if (c === q) return true;
  // Allow flexible prefix/substring match for slight formatting differences (e.g. "HEAT-2026-9011" vs "2026-9011")
  if (q.length >= 4 && c.length >= 4) {
    return c.includes(q) || q.includes(c);
  }
  return false;
}

function toNum(val: unknown): number | null {
  if (val === undefined || val === null || val === '' || val === '-') return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const cleaned = String(val).replace(/,/g, '.').replace(/[^\d.-]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function avgNums(vals: Array<number | null | undefined>, decimals = 2): number | null {
  const valid = vals.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return parseFloat((sum / valid.length).toFixed(decimals));
}

function numsFromArrayOrString(val?: string | string[]): number[] {
  if (!val) return [];
  const arr = Array.isArray(val) ? val : [val];
  return arr.map(v => toNum(v)).filter((v): v is number => v !== null);
}

function isHeadTag(label?: string): boolean {
  const s = (label || '').trim().toUpperCase();
  return s === 'H' || s.includes('HEAD') || s.includes('หัว') || /\bH\d*\b/.test(s);
}

function isTailTag(label?: string): boolean {
  const s = (label || '').trim().toUpperCase();
  return s === 'T' || s.includes('TAIL') || s.includes('ท้าย') || /\bT\d*\b/.test(s);
}

function pickHeadTail<T>(records: T[], getLabel: (r: T) => string | undefined): { head?: T; tail?: T } {
  if (records.length === 0) return {};
  const head = records.find(r => isHeadTag(getLabel(r))) || records[0];
  const tail = records.find(r => isTailTag(getLabel(r))) || (records.length > 1 ? records[records.length - 1] : head);
  return { head, tail };
}

function parseWallListNumbers(list?: string[]): number[] {
  if (!Array.isArray(list)) return [];
  return list
    .map(entry => {
      const parts = String(entry).split(':');
      return toNum(parts.length > 1 ? parts.slice(1).join(':') : entry);
    })
    .filter((v): v is number => v !== null);
}

function wallRangeAvg(range?: WallMeasurementValRange): number | null {
  if (!range) return null;
  return avgNums([toNum(range.min), toNum(range.max)], 3);
}

function isStatusPass(raw?: string | null): boolean {
  const s = (raw || '').trim().toUpperCase();
  return s === 'PASS' || s === 'OK' || s === 'MATCH' || s === 'ถูกต้อง' || s === 'CONFORMS';
}

function isStatusFail(raw?: string | null): boolean {
  const s = (raw || '').trim().toUpperCase();
  return s === 'FAIL' || s === 'NG' || s === 'MISMATCH' || s === 'REJECT' || s === 'ไม่ถูกต้อง';
}

export interface AvailableLinkSuggestions {
  heatNumbers: string[];
  coilNumbers: string[];
  lengths: string[];
  coilToHeat: Record<string, string>;
  coilToLengths: Record<string, string[]>;
}

export function extractLinkSuggestions(datasets: AllCloudInspectionDatasets): AvailableLinkSuggestions {
  const heatSet = new Set<string>();
  const coilSet = new Set<string>();
  const lengthSet = new Set<string>();
  const coilToHeat: Record<string, string> = {};
  const coilToLengths: Record<string, Set<string>> = {};

  const addCoilLength = (coil: string, len?: string) => {
    const c = normalizeId(coil);
    const l = (len || '').trim();
    if (!l || l === '-') return;
    const formatted = /mm$/i.test(l) ? l : `${l} mm`;
    lengthSet.add(formatted);
    if (c) {
      if (!coilToLengths[c]) coilToLengths[c] = new Set();
      coilToLengths[c].add(formatted);
    }
  };

  datasets.iqa01.forEach(r => {
    if (r.heat_number && r.heat_number !== '-') heatSet.add(r.heat_number.trim());
  });

  datasets.ipqa08.forEach(r => {
    r.items?.forEach(it => {
      if (it.heatNo && it.heatNo !== '-') heatSet.add(it.heatNo.trim());
    });
  });

  datasets.ipqa01.forEach(r => {
    if (r.heat_no && r.heat_no !== '-') heatSet.add(r.heat_no.trim());
    if (r.coil_no && r.coil_no !== '-') {
      coilSet.add(r.coil_no.trim());
      if (r.heat_no && r.heat_no !== '-') {
        coilToHeat[normalizeId(r.coil_no)] = r.heat_no.trim();
      }
    }
  });

  datasets.ipqa02.forEach(r => {
    if (r.lotNumber && r.lotNumber !== '-') coilSet.add(r.lotNumber.trim());
  });

  datasets.ipqa03.forEach(r => {
    if (r.lotNumber && r.lotNumber !== '-') coilSet.add(r.lotNumber.trim());
  });

  datasets.ipqa04.forEach(r => {
    if (r.lotNumber && r.lotNumber !== '-') coilSet.add(r.lotNumber.trim());
    if (r.lotNumber && r.length) addCoilLength(r.lotNumber, r.length);
  });

  datasets.ipqa05.forEach(r => {
    if (r.lotNumber && r.lotNumber !== '-') coilSet.add(r.lotNumber.trim());
    if (r.lotNumber && r.length) addCoilLength(r.lotNumber, r.length);
  });

  datasets.ipqa07.forEach(r => {
    if (r.coil && r.coil !== '-') coilSet.add(r.coil.trim());
  });

  datasets.oqa01.forEach(r => {
    r.coils?.forEach(c => {
      if (c.no && c.no !== '-') {
        coilSet.add(c.no.trim());
        if (r.dimL) addCoilLength(c.no, r.dimL);
      }
    });
  });

  const coilToLengthsPlain: Record<string, string[]> = {};
  Object.entries(coilToLengths).forEach(([k, set]) => {
    coilToLengthsPlain[k] = Array.from(set);
  });

  return {
    heatNumbers: Array.from(heatSet).sort(),
    coilNumbers: Array.from(coilSet).sort(),
    lengths: Array.from(lengthSet).sort(),
    coilToHeat,
    coilToLengths: coilToLengthsPlain
  };
}

export function linkLiveCoiData(params: {
  template: CoiCustomerTemplate;
  heatNo: string;
  coilNo: string;
  lengthMm: string;
  workNo?: string;
  invoiceNo?: string;
  datasets: AllCloudInspectionDatasets;
}): CoiLiveLinkResult {
  const { template, heatNo, coilNo, lengthMm, workNo, invoiceNo, datasets } = params;

  // Baseline structure from template defaults
  const baseData = generateDetailedMeasuredDataForCustomer(template, {
    workNo,
    coilNo,
    lengthMm,
    heatNo,
    invoiceNo
  });

  const targetLengthNum = toNum(lengthMm);
  const statuses: ModuleLinkStatus[] = [];
  let detectedLengthMm: string | undefined;
  let detectedWorkNo: string | undefined;
  let detectedHeatNo: string | undefined;

  // ------------------------------------------------------------------
  // 1. IQA-01 (Billet Chemical Composition) -> Key: Heat No.
  // ------------------------------------------------------------------
  const matchedBillets = datasets.iqa01.filter(b => isKeyMatch(b.heat_number, heatNo));
  if (matchedBillets.length > 0) {
    const billet = matchedBillets[0];
    const comp = billet.chemical_composition || {};
    const si = toNum(comp.Si);
    const fe = toNum(comp.Fe);
    const cu = toNum(comp.Cu);
    const mn = toNum(comp.Mn);
    const mg = toNum(comp.Mg);
    const cr = toNum(comp.Cr);
    const zn = toNum(comp.Zn);
    const ti = toNum(comp.Ti);

    if (si !== null) baseData.chemActual.si = si;
    if (fe !== null) baseData.chemActual.fe = fe;
    if (cu !== null) baseData.chemActual.cu = cu;
    if (mn !== null) baseData.chemActual.mn = mn;
    if (mg !== null) baseData.chemActual.mg = mg;
    if (cr !== null) baseData.chemActual.cr = cr;
    if (zn !== null) baseData.chemActual.zn = zn;
    if (ti !== null) baseData.chemActual.ti = ti;

    // Estimate otherEach / otherTotal from minor elements if available
    const minorElems = [mg, cr, zn, ti].filter((v): v is number => v !== null);
    if (minorElems.length > 0) {
      baseData.chemActual.otherEach = parseFloat(Math.max(...minorElems).toFixed(3));
      baseData.chemActual.otherTotal = parseFloat(minorElems.reduce((a, b) => a + b, 0).toFixed(3));
    }
    if (comp.Al !== undefined && comp.Al !== '') {
      baseData.chemActual.alRemain = String(comp.Al);
    }

    statuses.push({
      moduleCode: 'IQA-01',
      moduleNameTh: 'ตรวจบิลเล็ต & ส่วนผสมเคมี (OES)',
      moduleNameEn: 'Billet Incoming Spectrometry',
      linkKeyType: 'HEAT_NO',
      matched: true,
      matchedKeyDisplay: billet.heat_number,
      recordCount: matchedBillets.length,
      summary: `Grade ${billet.grade || '-'} • Si ${baseData.chemActual.si}%, Fe ${baseData.chemActual.fe}%, Cu ${baseData.chemActual.cu}%, Mn ${baseData.chemActual.mn}%`,
      status: isStatusFail(billet.judgement) ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IQA-01',
      moduleNameTh: 'ตรวจบิลเล็ต & ส่วนผสมเคมี (OES)',
      moduleNameEn: 'Billet Incoming Spectrometry',
      linkKeyType: 'HEAT_NO',
      matched: false,
      matchedKeyDisplay: heatNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Heat No. นี้ใน IQA-01 (ใช้ค่ามาตรฐานชั่วคราว)',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 2. IPQA-08 (Billet Cutting) -> Key: Heat No.
  // ------------------------------------------------------------------
  const matchedBilletCutRecords = datasets.ipqa08.filter(rec =>
    rec.items?.some(it => isKeyMatch(it.heatNo, heatNo))
  );
  if (matchedBilletCutRecords.length > 0) {
    const rec = matchedBilletCutRecords[0];
    const item = rec.items.find(it => isKeyMatch(it.heatNo, heatNo))!;
    statuses.push({
      moduleCode: 'IPQA-08',
      moduleNameTh: 'ตัดท่อนบิลเล็ต (Billet Cutting)',
      moduleNameEn: 'Billet Cutting Measurement',
      linkKeyType: 'HEAT_NO',
      matched: true,
      matchedKeyDisplay: item.heatNo,
      recordCount: matchedBilletCutRecords.length,
      summary: `Grade ${item.billetGrade || '-'} • Cut L=${item.length || '-'} mm, Ø${item.diameter || '-'} mm`,
      status: isStatusFail(item.judgement || rec.overallJudgement) ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IPQA-08',
      moduleNameTh: 'ตัดท่อนบิลเล็ต (Billet Cutting)',
      moduleNameEn: 'Billet Cutting Measurement',
      linkKeyType: 'HEAT_NO',
      matched: false,
      matchedKeyDisplay: heatNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Heat No. นี้ใน IPQA-08',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 3. IPQA-01 (Tensile & Mechanical) -> Key: Coil No. & Heat No.
  // ------------------------------------------------------------------
  const tensileByBoth = datasets.ipqa01.filter(
    r => isKeyMatch(r.coil_no, coilNo) && isKeyMatch(r.heat_no, heatNo)
  );
  const tensileByCoil = datasets.ipqa01.filter(r => isKeyMatch(r.coil_no, coilNo));
  const tensileByHeat = datasets.ipqa01.filter(r => isKeyMatch(r.heat_no, heatNo));
  const matchedTensile =
    tensileByBoth.length > 0 ? tensileByBoth : tensileByCoil.length > 0 ? tensileByCoil : tensileByHeat;

  if (matchedTensile.length > 0) {
    const tAvg = avgNums(matchedTensile.map(r => toNum(r.tensile)), 1);
    const yAvg = avgNums(matchedTensile.map(r => toNum(r.yield)), 1);
    const eAvg = avgNums(matchedTensile.map(r => toNum(r.elong)), 1);

    if (tAvg !== null) baseData.mechActual.tensileStrength = tAvg;
    if (yAvg !== null) baseData.mechActual.yieldStress = yAvg;
    if (eAvg !== null) baseData.mechActual.elongation = eAvg;

    const firstTensile = matchedTensile[0];
    if (firstTensile.work_order && firstTensile.work_order !== '-') {
      detectedWorkNo = firstTensile.work_order;
    }
    if (firstTensile.heat_no && firstTensile.heat_no !== '-') {
      detectedHeatNo = firstTensile.heat_no;
    }

    const anyTensileFail = matchedTensile.some(r => isStatusFail(r.decision));
    statuses.push({
      moduleCode: 'IPQA-01',
      moduleNameTh: 'ทดสอบแรงดึง (Tensile & Yield)',
      moduleNameEn: 'Tensile & Mechanical',
      linkKeyType: 'HEAT_AND_COIL',
      matched: true,
      matchedKeyDisplay:
        tensileByBoth.length > 0
          ? `${firstTensile.coil_no} / ${firstTensile.heat_no}`
          : tensileByCoil.length > 0
            ? `Coil: ${firstTensile.coil_no}`
            : `Heat: ${firstTensile.heat_no}`,
      recordCount: matchedTensile.length,
      summary: `Tensile ${baseData.mechActual.tensileStrength} MPa, Yield ${baseData.mechActual.yieldStress} MPa, Elong ${baseData.mechActual.elongation}%`,
      status: anyTensileFail ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IPQA-01',
      moduleNameTh: 'ทดสอบแรงดึง (Tensile & Yield)',
      moduleNameEn: 'Tensile & Mechanical',
      linkKeyType: 'HEAT_AND_COIL',
      matched: false,
      matchedKeyDisplay: coilNo || heatNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Coil No. / Heat No. นี้ใน IPQA-01 (ใช้ค่ามาตรฐานชั่วคราว)',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 4. IPQA-02 (Surface Roughness) -> Key: Coil No.
  // ------------------------------------------------------------------
  const matchedRoughness = datasets.ipqa02.filter(r => isKeyMatch(r.lotNumber, coilNo));
  if (matchedRoughness.length > 0) {
    const allRzUp = matchedRoughness.flatMap(r => numsFromArrayOrString(r.rzUp));
    const allRzLo = matchedRoughness.flatMap(r => numsFromArrayOrString(r.rzLo));
    const maxRzFallback = avgNums(matchedRoughness.map(r => toNum(r.rzMax)), 2);

    const rzTopVal = allRzUp.length > 0 ? parseFloat(Math.max(...allRzUp).toFixed(2)) : maxRzFallback;
    const rzBotVal = allRzLo.length > 0 ? parseFloat(Math.max(...allRzLo).toFixed(2)) : maxRzFallback;

    if (rzTopVal !== null) baseData.mechActual.roughnessRzTop = rzTopVal;
    if (rzBotVal !== null) baseData.mechActual.roughnessRzBottom = rzBotVal;

    const anyFail = matchedRoughness.some(r => isStatusFail(r.status));
    statuses.push({
      moduleCode: 'IPQA-02',
      moduleNameTh: 'ความหยาบผิว (Roughness Rz)',
      moduleNameEn: 'Surface Roughness',
      linkKeyType: 'COIL_NO',
      matched: true,
      matchedKeyDisplay: matchedRoughness[0].lotNumber,
      recordCount: matchedRoughness.length,
      summary: `Rz Top ${baseData.mechActual.roughnessRzTop} µm, Rz Bottom ${baseData.mechActual.roughnessRzBottom} µm`,
      status: anyFail ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IPQA-02',
      moduleNameTh: 'ความหยาบผิว (Roughness Rz)',
      moduleNameEn: 'Surface Roughness',
      linkKeyType: 'COIL_NO',
      matched: false,
      matchedKeyDisplay: coilNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Coil No. นี้ใน IPQA-02 (ใช้ค่ามาตรฐานชั่วคราว)',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 5. IPQA-03 (X-Ray Zn & Flux Coating) -> Key: Coil No.
  // ------------------------------------------------------------------
  const matchedXray = datasets.ipqa03.filter(r => isKeyMatch(r.lotNumber, coilNo));
  if (matchedXray.length > 0) {
    const { head, tail } = pickHeadTail(matchedXray, r => r.partId);

    const applyXraySide = (rec: XRayInspectionRecord | undefined, target: typeof baseData.coatingActual.head) => {
      if (!rec) return;
      const znUp = toNum(rec.znAvgUp) ?? avgNums(numsFromArrayOrString(rec.raUp), 2);
      const znLo = toNum(rec.znAvgLo) ?? avgNums(numsFromArrayOrString(rec.raLo), 2);
      const flxUp = toNum(rec.fluxAvgUp) ?? avgNums(numsFromArrayOrString(rec.rzUp), 2);
      const flxLo = toNum(rec.fluxAvgLo) ?? avgNums(numsFromArrayOrString(rec.rzLo), 2);
      const covUp = toNum(rec.coverageAvgUp) ?? avgNums(numsFromArrayOrString(rec.rtUp), 1);
      const covLo = toNum(rec.coverageAvgLo) ?? avgNums(numsFromArrayOrString(rec.rtLo), 1);

      if (znUp !== null) target.znAdhesionWeightTop = znUp;
      if (znLo !== null) target.znAdhesionWeightBottom = znLo;
      if (flxUp !== null) target.fluxAdhesionWeightTop = flxUp;
      if (flxLo !== null) target.fluxAdhesionWeightBottom = flxLo;
      if (covUp !== null) target.znAdhesionAreaTop = covUp;
      if (covLo !== null) target.znAdhesionAreaBottom = covLo;
    };

    applyXraySide(head, baseData.coatingActual.head);
    applyXraySide(tail, baseData.coatingActual.tail);
    if (head?.date) baseData.coatingActual.znSprayDate = head.date;

    const anyFail = matchedXray.some(r => isStatusFail(r.status));
    statuses.push({
      moduleCode: 'IPQA-03',
      moduleNameTh: 'เคลือบ Zn & Flux ด้วย X-Ray',
      moduleNameEn: 'X-Ray Zn & Flux Weight',
      linkKeyType: 'COIL_NO',
      matched: true,
      matchedKeyDisplay: matchedXray[0].lotNumber,
      recordCount: matchedXray.length,
      summary: `Zn (H): ${baseData.coatingActual.head.znAdhesionWeightTop}/${baseData.coatingActual.head.znAdhesionWeightBottom} g/m² • Area ${baseData.coatingActual.head.znAdhesionAreaTop}%`,
      status: anyFail ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IPQA-03',
      moduleNameTh: 'เคลือบ Zn & Flux ด้วย X-Ray',
      moduleNameEn: 'X-Ray Zn & Flux Weight',
      linkKeyType: 'COIL_NO',
      matched: false,
      matchedKeyDisplay: coilNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Coil No. นี้ใน IPQA-03 (ใช้ค่ามาตรฐานชั่วคราว)',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 6. IPQA-04 (Coating Weight & Adhesion) -> Key: Coil No.
  // ------------------------------------------------------------------
  const matchedCoating = datasets.ipqa04.filter(r => isKeyMatch(r.lotNumber, coilNo));
  if (matchedCoating.length > 0) {
    const { head, tail } = pickHeadTail(matchedCoating, r => r.partId);

    const applyCoatingSide = (rec: CoatingInspectionRecord | undefined, target: typeof baseData.coatingActual.head) => {
      if (!rec) return;
      // If X-Ray didn't supply flux weights, take from Coating measurement
      if (matchedXray.length === 0) {
        const coatUp = toNum(rec.raUp);
        const coatLo = toNum(rec.raLo);
        if (coatUp !== null) target.fluxAdhesionWeightTop = coatUp;
        if (coatLo !== null) target.fluxAdhesionWeightBottom = coatLo;
      }
      if (rec.rtUp) target.coatingAdhesionTop = rec.rtUp;
      else if (rec.status) target.coatingAdhesionTop = isStatusFail(rec.status) ? 'NG' : 'OK';

      if (rec.rtLo) target.coatingAdhesionBottom = rec.rtLo;
      else if (rec.status) target.coatingAdhesionBottom = isStatusFail(rec.status) ? 'NG' : 'OK';
    };

    applyCoatingSide(head, baseData.coatingActual.head);
    applyCoatingSide(tail, baseData.coatingActual.tail);
    if (head?.mixingLot) baseData.coatingActual.paintLotNo = head.mixingLot;
    if (head?.date) baseData.coatingActual.coatingDate = head.date;
    if (!detectedLengthMm && head?.length) detectedLengthMm = `${head.length} mm`;

    const anyFail = matchedCoating.some(r => isStatusFail(r.status));
    baseData.inspectionCoating = anyFail ? 'NG' : 'OK';

    statuses.push({
      moduleCode: 'IPQA-04',
      moduleNameTh: 'ตรวจสอบการเคลือบ & การยึดเกาะ',
      moduleNameEn: 'Coating & Adhesion',
      linkKeyType: 'COIL_NO',
      matched: true,
      matchedKeyDisplay: matchedCoating[0].lotNumber,
      recordCount: matchedCoating.length,
      summary: `Lot ${baseData.coatingActual.paintLotNo} • Adhesion ${baseData.coatingActual.head.coatingAdhesionTop}/${baseData.coatingActual.head.coatingAdhesionBottom}`,
      status: anyFail ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IPQA-04',
      moduleNameTh: 'ตรวจสอบการเคลือบ & การยึดเกาะ',
      moduleNameEn: 'Coating & Adhesion',
      linkKeyType: 'COIL_NO',
      matched: false,
      matchedKeyDisplay: coilNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Coil No. นี้ใน IPQA-04 (ใช้ค่ามาตรฐานชั่วคราว)',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 7. IPQA-05 (Cutting Dimension) -> Key: Coil No. (+ Length refinement)
  // ------------------------------------------------------------------
  const cuttingByCoil = datasets.ipqa05.filter(r => isKeyMatch(r.lotNumber, coilNo));
  const cuttingByCoilAndLength =
    targetLengthNum !== null
      ? cuttingByCoil.filter(r => {
          const recLen = toNum(r.length);
          return recLen !== null && Math.abs(recLen - targetLengthNum) <= 5.0;
        })
      : [];
  const matchedCutting = cuttingByCoilAndLength.length > 0 ? cuttingByCoilAndLength : cuttingByCoil;

  if (matchedCutting.length > 0) {
    const { head, tail } = pickHeadTail(matchedCutting, r => `${r.partId || ''} ${r.sampleName || ''}`);

    const applyCuttingSide = (rec: CuttingInspectionRecord | undefined, target: typeof baseData.geometryActual.head) => {
      if (!rec) return;
      const len = toNum(rec.length);
      const w = toNum(rec.width);
      const hL = toNum(rec.heightLeft) ?? toNum(rec.height);
      const hR = toNum(rec.heightRight) ?? toNum(rec.height);
      const bend = toNum(rec.bending);
      const camb = toNum(rec.camber);
      const tw = toNum(rec.twist);

      if (len !== null) target.lengthMm = len;
      if (w !== null) {
        target.widthLeft = w;
        target.widthRight = w;
      }
      if (hL !== null) target.heightLeft = hL;
      if (hR !== null) target.heightRight = hR;
      if (bend !== null) target.warpMm = bend;
      if (camb !== null) target.curvedMm = camb;
      if (tw !== null) target.twistMm = tw;

      if (rec.customPointValues) {
        Object.entries(rec.customPointValues).forEach(([k, v]) => {
          const keyLower = k.toLowerCase();
          const numVal = toNum(v);
          if (keyLower.includes('undulation') && numVal !== null) target.undulationMm = numVal;
          if ((keyLower.includes('port open') || keyLower.includes('open area')) && numVal !== null) {
            target.portOpenAreaLeft = numVal;
            target.portOpenAreaRight = numVal;
          }
          if (keyLower.includes('burr')) {
            const s = String(v).trim().toUpperCase();
            if (s) {
              target.burrFreeLeft = s;
              target.burrFreeRight = s;
            }
          }
        });
      }
    };

    applyCuttingSide(head, baseData.geometryActual.head);
    applyCuttingSide(tail, baseData.geometryActual.tail);
    if (head?.length) {
      detectedLengthMm = /mm$/i.test(head.length) ? head.length : `${head.length} mm`;
      baseData.lengthMm = head.length;
    }
    if (!detectedWorkNo && head?.workOrder && head.workOrder !== '-') {
      detectedWorkNo = head.workOrder;
    }

    const anyFail = matchedCutting.some(r => isStatusFail(r.status));
    statuses.push({
      moduleCode: 'IPQA-05',
      moduleNameTh: 'ขนาดจากการตัด & รูปทรง (Cutting)',
      moduleNameEn: 'Cutting Dimension & Form',
      linkKeyType: 'COIL_AND_LENGTH',
      matched: true,
      matchedKeyDisplay: `${matchedCutting[0].lotNumber}${head?.length ? ` • L=${head.length}mm` : ''}`,
      recordCount: matchedCutting.length,
      summary: `L=${baseData.geometryActual.head.lengthMm}mm, W=${baseData.geometryActual.head.widthLeft}mm, H=${baseData.geometryActual.head.heightLeft}mm, Twist=${baseData.geometryActual.head.twistMm}`,
      status: anyFail ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IPQA-05',
      moduleNameTh: 'ขนาดจากการตัด & รูปทรง (Cutting)',
      moduleNameEn: 'Cutting Dimension & Form',
      linkKeyType: 'COIL_AND_LENGTH',
      matched: false,
      matchedKeyDisplay: `${coilNo || '-'}${lengthMm ? ` / ${lengthMm}` : ''}`,
      recordCount: 0,
      summary: 'ไม่พบ Coil No. นี้ใน IPQA-05 (ใช้ค่ามาตรฐานชั่วคราว)',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 8. IPQA-07 (Thickness Wall Measurement) -> Key: Coil No.
  // ------------------------------------------------------------------
  const matchedWall = datasets.ipqa07.filter(r => isKeyMatch(r.coil, coilNo));
  if (matchedWall.length > 0) {
    const { head, tail } = pickHeadTail(matchedWall, r => r.sample);

    const applyWallSide = (
      rec: ThicknessWallRecord | undefined,
      targetWeb: typeof baseData.webActual.head,
      targetHole: typeof baseData.holeActual.head
    ) => {
      if (!rec?.vals) return;
      const v = rec.vals;

      const t1Pts = parseWallListNumbers(v.t1_list);
      const t2Pts = parseWallListNumbers(v.t2_list);
      const t3Pts = parseWallListNumbers(v.t3_list);
      const t4Pts = parseWallListNumbers(v.t4_list);
      const t5Pts = parseWallListNumbers(v.t5_list);

      const t1Val = (t1Pts.length > 0 ? avgNums(t1Pts, 3) : null) ?? wallRangeAvg(v.t1);
      const t2Val = (t2Pts.length > 0 ? avgNums(t2Pts, 3) : null) ?? wallRangeAvg(v.t2);
      const t3Val = (t3Pts.length > 0 ? avgNums(t3Pts, 3) : null) ?? toNum(v.t3);
      const t4Val = (t4Pts.length > 0 ? avgNums(t4Pts, 3) : null) ?? toNum(v.t4);

      if (t1Val !== null) targetWeb.t1 = t1Val;
      if (t2Val !== null) targetWeb.t2 = t2Val;
      if (t3Val !== null) targetWeb.t3 = t3Val;
      if (t4Val !== null) targetWeb.t4 = t4Val;

      if (t5Pts.length > 0) {
        const padded = [...t5Pts.slice(0, 12)];
        while (padded.length < 12) {
          padded.push(targetWeb.innerWebs[padded.length] ?? t5Pts[t5Pts.length - 1]);
        }
        targetWeb.innerWebs = padded;
      }

      const ihwMin = toNum(v.ihw?.min);
      const ihwMax = toNum(v.ihw?.max);
      if (ihwMin !== null) targetHole.innerHoleWidthMin = ihwMin;
      if (ihwMax !== null) targetHole.innerHoleWidthMax = ihwMax;

      const ohwMin = toNum(v.ohw?.min);
      const ohwMax = toNum(v.ohw?.max);
      if (ohwMin !== null) targetHole.outerHoleWidthMin = ohwMin;
      if (ohwMax !== null) targetHole.outerHoleWidthMax = ohwMax;

      const ihrMin = toNum(v.ihr?.min) ?? toNum(v.ir?.min);
      const ihrMax = toNum(v.ihr?.max) ?? toNum(v.ir?.max);
      if (ihrMin !== null) targetHole.innerHoleRadiusMin = ihrMin;
      if (ihrMax !== null) targetHole.innerHoleRadiusMax = ihrMax;
    };

    applyWallSide(head, baseData.webActual.head, baseData.holeActual.head);
    applyWallSide(tail, baseData.webActual.tail, baseData.holeActual.tail);

    const anyFail = matchedWall.some(r => isStatusFail(r.overallStatus));
    baseData.inspectionDimension = anyFail ? 'NG' : 'OK';

    statuses.push({
      moduleCode: 'IPQA-07',
      moduleNameTh: 'ความหนาผนัง & รูท่อ (Wall T1-T5)',
      moduleNameEn: 'Wall Thickness (T1-T5 & Holes)',
      linkKeyType: 'COIL_NO',
      matched: true,
      matchedKeyDisplay: matchedWall[0].coil,
      recordCount: matchedWall.length,
      summary: `T1=${baseData.webActual.head.t1}, T2=${baseData.webActual.head.t2}, T3=${baseData.webActual.head.t3}, T4=${baseData.webActual.head.t4} mm (${head?.vals?.t5_list?.length || 0} T5 pts)`,
      status: anyFail ? 'FAIL' : 'PASS'
    });
  } else {
    statuses.push({
      moduleCode: 'IPQA-07',
      moduleNameTh: 'ความหนาผนัง & รูท่อ (Wall T1-T5)',
      moduleNameEn: 'Wall Thickness (T1-T5 & Holes)',
      linkKeyType: 'COIL_NO',
      matched: false,
      matchedKeyDisplay: coilNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Coil No. นี้ใน IPQA-07 (ใช้ค่ามาตรฐานชั่วคราว)',
      status: 'NOT_FOUND'
    });
  }

  // ------------------------------------------------------------------
  // 9. OQA-01 (FG Pre-Shipment) -> Key: Coil No.
  // ------------------------------------------------------------------
  const matchedOqa = datasets.oqa01.filter(r =>
    r.coils?.some(c => isKeyMatch(c.no, coilNo))
  );
  if (matchedOqa.length > 0) {
    const rec = matchedOqa[0];
    const ok = isStatusPass(rec.result);
    baseData.inspectionAppearance = ok ? 'OK' : 'NG';
    if (!detectedLengthMm && rec.dimL) {
      detectedLengthMm = /mm$/i.test(rec.dimL) ? rec.dimL : `${rec.dimL} mm`;
    }

    statuses.push({
      moduleCode: 'OQA-01',
      moduleNameTh: 'ตรวจสอบก่อนส่งมอบ FG (OQA-01)',
      moduleNameEn: 'FG Pre-Shipment Verification',
      linkKeyType: 'COIL_NO',
      matched: true,
      matchedKeyDisplay: coilNo,
      recordCount: matchedOqa.length,
      summary: `Box ${rec.boxNo || '-'} • Part ${rec.partNo || '-'} • Result ${rec.result}`,
      status: ok ? 'PASS' : 'FAIL'
    });
  } else {
    statuses.push({
      moduleCode: 'OQA-01',
      moduleNameTh: 'ตรวจสอบก่อนส่งมอบ FG (OQA-01)',
      moduleNameEn: 'FG Pre-Shipment Verification',
      linkKeyType: 'COIL_NO',
      matched: false,
      matchedKeyDisplay: coilNo || '-',
      recordCount: 0,
      summary: 'ไม่พบ Coil No. นี้ใน OQA-01',
      status: 'NOT_FOUND'
    });
  }

  const matchedModulesCount = statuses.filter(s => s.matched).length;
  const hasAnyFail = statuses.some(s => s.status === 'FAIL');

  return {
    measuredData: baseData,
    moduleStatuses: statuses,
    matchedModulesCount,
    totalCheckedModules: statuses.length,
    detectedLengthMm,
    detectedWorkNo,
    detectedHeatNo,
    hasAnyFail,
    lastSyncedAt: new Date().toLocaleTimeString('sv-SE')
  };
}
