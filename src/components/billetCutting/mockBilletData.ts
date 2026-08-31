import { BilletCuttingSpec, BilletCuttingRecord } from '../../types';

export const ADMIN_PASSWORD = 'admin2026';

export const INITIAL_BILLET_SPECS: Record<string, BilletCuttingSpec> = {
  '6063-STD-500': {
    id: 'spec-6063-500',
    name: '6063-STD-500',
    billetGrade: '6063',
    lengthNominal: '500',
    lengthMin: '498.0',
    lengthMax: '502.0',
    diameterNominal: '127.0',
    diameterMin: '125.5',
    diameterMax: '128.5',
    bendingMax: '0.75', // 500 * 0.15% = 0.75 mm
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Standard 6063 billet for architectural profiles (Ø5" / 127mm)'
  },
  '6063-STD-600': {
    id: 'spec-6063-600',
    name: '6063-STD-600',
    billetGrade: '6063',
    lengthNominal: '600',
    lengthMin: '598.0',
    lengthMax: '602.0',
    diameterNominal: '127.0',
    diameterMin: '125.5',
    diameterMax: '128.5',
    bendingMax: '0.90', // 600 * 0.15% = 0.90 mm
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Standard 6063 billet (Ø5" / 127mm) length 600mm'
  },
  '6061-HVY-600': {
    id: 'spec-6061-600',
    name: '6061-HVY-600',
    billetGrade: '6061',
    lengthNominal: '600',
    lengthMin: '597.5',
    lengthMax: '602.5',
    diameterNominal: '178.0',
    diameterMin: '176.0',
    diameterMax: '180.0',
    bendingMax: '0.90', // 600 * 0.15% = 0.90 mm
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'High strength 6061 structural billet (Ø7" / 178mm)'
  },
  '6082-PRO-650': {
    id: 'spec-6082-650',
    name: '6082-PRO-650',
    billetGrade: '6082',
    lengthNominal: '650',
    lengthMin: '648.0',
    lengthMax: '652.0',
    diameterNominal: '203.0',
    diameterMin: '201.0',
    diameterMax: '205.0',
    bendingMax: '0.98', // 650 * 0.15% = 0.975 -> 0.98 mm
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Automotive grade 6082 billet (Ø8" / 203mm)'
  },
  '1050-PURE-500': {
    id: 'spec-1050-500',
    name: '1050-PURE-500',
    billetGrade: '1050',
    lengthNominal: '500',
    lengthMin: '498.0',
    lengthMax: '502.0',
    diameterNominal: '127.0',
    diameterMin: '125.5',
    diameterMax: '128.5',
    bendingMax: '0.75', // 500 * 0.15% = 0.75 mm
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Commercial pure aluminum billet'
  }
};

export const INITIAL_BILLET_RECORDS: BilletCuttingRecord[] = [
  {
    id: 'BC-2026-0801',
    docId: 'bc-doc-0801',
    timestamp: '2026-08-31 09:30',
    timestampRaw: '2026-08-31T09:30:00Z',
    header: {
      inspectorName: 'Somchai Prasert',
      shift: 'Shift A (เช้า)',
      cuttingLength: '500',
      lotNo: 'LOT-BC-260831-01',
      date: '2026-08-31',
      machine: 'Billet Saw #1',
      specProfileId: '6063-STD-500'
    },
    items: [
      {
        id: 'item-1',
        billetGrade: '6063',
        heatNo: 'HT-99201',
        supplier: 'Supplier A (Taiwan)',
        qty: 24,
        length: '500.2',
        diameter: '127.1',
        bending: '0.45',
        bendingLimit: '0.75',
        cuttingSurface: '1.2',
        surfaceDefect: 'None / Normal',
        heatIdentify: 'OK',
        appearance: 'OK',
        judgement: 'PASS',
        remarks: 'Normal cut quality'
      },
      {
        id: 'item-2',
        billetGrade: '6063',
        heatNo: 'HT-99202',
        supplier: 'Supplier A (Taiwan)',
        qty: 26,
        length: '499.8',
        diameter: '126.9',
        bending: '0.50',
        bendingLimit: '0.75',
        cuttingSurface: '1.4',
        surfaceDefect: '1.0x20x30 mm (OK)',
        heatIdentify: 'OK',
        appearance: 'OK',
        judgement: 'PASS',
        remarks: 'Small scratch within spec'
      }
    ],
    totalQty: 50,
    passedQty: 50,
    defectQty: 0,
    overallJudgement: 'PASS',
    createdAt: '2026-08-31T09:30:00Z'
  },
  {
    id: 'BC-2026-0802',
    docId: 'bc-doc-0802',
    timestamp: '2026-08-25 14:15',
    timestampRaw: '2026-08-25T14:15:00Z',
    header: {
      inspectorName: 'Kitti Mongkol',
      shift: 'Shift B (บ่าย)',
      cuttingLength: '600',
      lotNo: 'LOT-BC-260825-02',
      date: '2026-08-25',
      machine: 'Billet Saw #2',
      specProfileId: '6061-HVY-600'
    },
    items: [
      {
        id: 'item-3',
        billetGrade: '6061',
        heatNo: 'HT-88410',
        supplier: 'Supplier B (Domestic)',
        qty: 30,
        length: '600.5',
        diameter: '177.8',
        bending: '0.62',
        bendingLimit: '0.90',
        cuttingSurface: '1.6',
        surfaceDefect: 'None / Smooth',
        heatIdentify: 'OK',
        appearance: 'OK',
        judgement: 'PASS'
      },
      {
        id: 'item-4',
        billetGrade: '6061',
        heatNo: 'HT-88412',
        supplier: 'Supplier B (Domestic)',
        qty: 20,
        length: '601.2',
        diameter: '178.2',
        bending: '0.55',
        bendingLimit: '0.90',
        cuttingSurface: '1.5',
        surfaceDefect: 'None',
        heatIdentify: 'OK',
        appearance: 'OK',
        judgement: 'PASS'
      }
    ],
    totalQty: 50,
    passedQty: 50,
    defectQty: 0,
    overallJudgement: 'PASS',
    createdAt: '2026-08-25T14:15:00Z'
  },
  {
    id: 'BC-2026-0701',
    docId: 'bc-doc-0701',
    timestamp: '2026-07-18 11:00',
    timestampRaw: '2026-07-18T11:00:00Z',
    header: {
      inspectorName: 'Anan Charoen',
      shift: 'Shift A (เช้า)',
      cuttingLength: '650',
      lotNo: 'LOT-BC-260718-01',
      date: '2026-07-18',
      machine: 'Billet Saw #1',
      specProfileId: '6082-PRO-650'
    },
    items: [
      {
        id: 'item-5',
        billetGrade: '6082',
        heatNo: 'HT-77501',
        supplier: 'Supplier C (China)',
        qty: 40,
        length: '649.5',
        diameter: '202.8',
        bending: '0.70',
        bendingLimit: '0.98',
        cuttingSurface: '1.8',
        surfaceDefect: 'None',
        heatIdentify: 'OK',
        appearance: 'OK',
        judgement: 'PASS'
      }
    ],
    totalQty: 40,
    passedQty: 40,
    defectQty: 0,
    overallJudgement: 'PASS',
    createdAt: '2026-07-18T11:00:00Z'
  }
];
