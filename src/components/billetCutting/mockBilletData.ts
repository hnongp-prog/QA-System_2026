import { BilletCuttingSpec, BilletCuttingRecord } from '../../types';

export const ADMIN_PASSWORD = 'admin2026';
export const VALID_ADMIN_PASSWORDS = [
  'admin2026',
  'admin',
  'admin123',
  '1234',
  '123456',
  'ipqa08',
  'ipqa',
  'qa',
  '0000'
];

export const checkAdminPassword = (input: string): boolean => {
  const clean = (input || '').trim().toLowerCase();
  return VALID_ADMIN_PASSWORDS.includes(clean);
};

export const INITIAL_BILLET_SPECS: Record<string, BilletCuttingSpec> = {
  'CAPCO': {
    id: 'spec-capco',
    name: 'CAPCO',
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
    remarks: 'CAPCO Supplier Spec - Standard 6063 billet for architectural profiles (Ø5" / 127mm)'
  },
  'ALCOA': {
    id: 'spec-alcoa',
    name: 'ALCOA',
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
    remarks: 'ALCOA Supplier Spec - Premium 6063 billet (Ø5" / 127mm) length 600mm'
  },
  'THAI HONG': {
    id: 'spec-thaihong',
    name: 'THAI HONG',
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
    remarks: 'THAI HONG Supplier Spec - High strength 6061 structural billet (Ø7" / 178mm)'
  },
  'HONG HO': {
    id: 'spec-hongho',
    name: 'HONG HO',
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
    remarks: 'HONG HO Supplier Spec - Automotive grade 6082 billet (Ø8" / 203mm)'
  },
  'CHALCO': {
    id: 'spec-chalco',
    name: 'CHALCO',
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
    remarks: 'CHALCO Supplier Spec - Commercial pure 1050 aluminum billet'
  },
  'Siam Aluminum Industry (6063)': {
    id: 'spec-iqa-siam-aluminum-industry-6063',
    name: 'Siam Aluminum Industry',
    billetGrade: '6063',
    lengthNominal: '500',
    lengthMin: '498.0',
    lengthMax: '502.0',
    diameterNominal: '127.0',
    diameterMin: '125.5',
    diameterMax: '128.5',
    bendingMax: '0.75',
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Auto-synced from IQA-01 Billet Incoming • Supplier: Siam Aluminum Industry • Grade: 6063'
  },
  'Metal Tech Extrusions (6061)': {
    id: 'spec-iqa-metal-tech-extrusions-6061',
    name: 'Metal Tech Extrusions',
    billetGrade: '6061',
    lengthNominal: '600',
    lengthMin: '598.0',
    lengthMax: '602.0',
    diameterNominal: '152.0',
    diameterMin: '150.5',
    diameterMax: '153.5',
    bendingMax: '0.90',
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Auto-synced from IQA-01 Billet Incoming • Supplier: Metal Tech Extrusions • Grade: 6061'
  },
  'Global Alloy Supply (6063)': {
    id: 'spec-iqa-global-alloy-supply-6063',
    name: 'Global Alloy Supply',
    billetGrade: '6063',
    lengthNominal: '500',
    lengthMin: '498.0',
    lengthMax: '502.0',
    diameterNominal: '127.0',
    diameterMin: '125.5',
    diameterMax: '128.5',
    bendingMax: '0.75',
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Auto-synced from IQA-01 Billet Incoming • Supplier: Global Alloy Supply • Grade: 6063'
  },
  'Thai Metal Aluminium Co., Ltd. (6063)': {
    id: 'spec-iqa-thai-metal-aluminium-6063',
    name: 'Thai Metal Aluminium Co., Ltd.',
    billetGrade: '6063',
    lengthNominal: '500',
    lengthMin: '498.0',
    lengthMax: '502.0',
    diameterNominal: '127.0',
    diameterMin: '125.5',
    diameterMax: '128.5',
    bendingMax: '0.75',
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Auto-synced from IQA-01 Billet Incoming • Supplier: Thai Metal Aluminium • Grade: 6063'
  },
  'Capral Aluminium (6082)': {
    id: 'spec-iqa-capral-aluminium-6082',
    name: 'Capral Aluminium',
    billetGrade: '6082',
    lengthNominal: '600',
    lengthMin: '598.0',
    lengthMax: '602.0',
    diameterNominal: '178.0',
    diameterMin: '176.0',
    diameterMax: '180.0',
    bendingMax: '0.90',
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Auto-synced from IQA-01 Billet Incoming • Supplier: Capral Aluminium • Grade: 6082'
  },
  'Press Metal Berhad (6005)': {
    id: 'spec-iqa-press-metal-berhad-6005',
    name: 'Press Metal Berhad',
    billetGrade: '6005',
    lengthNominal: '500',
    lengthMin: '498.0',
    lengthMax: '502.0',
    diameterNominal: '127.0',
    diameterMin: '125.5',
    diameterMax: '128.5',
    bendingMax: '0.75',
    cuttingSurfaceMax: '2.0',
    surfaceDefectSpecText: '≤ 2x50x100 mm',
    surfaceDefectMaxDepth: '2.0',
    surfaceDefectMaxWidth: '50.0',
    surfaceDefectMaxLength: '100.0',
    remarks: 'Auto-synced from IQA-01 Billet Incoming • Supplier: Press Metal Berhad • Grade: 6005'
  }
};

export const DEFAULT_IQA_SUPPLIERS = [
  "Siam Aluminum Industry",
  "Siam Aluminum Co., Ltd.",
  "Metal Tech Extrusions",
  "Global Alloy Supply",
  "Thai Metal Aluminium Co., Ltd.",
  "Capral Aluminium",
  "Press Metal Berhad"
];

export const DEFAULT_IQA_GRADES = [
  "6063",
  "6061",
  "6005",
  "6082"
];

export const IQA_SUPPLIER_GRADE_MAP: Record<string, string> = {
  "Siam Aluminum Industry": "6063",
  "Siam Aluminum Co., Ltd.": "6063",
  "Metal Tech Extrusions": "6061",
  "Global Alloy Supply": "6063",
  "Thai Metal Aluminium Co., Ltd.": "6063",
  "Capral Aluminium": "6082",
  "Press Metal Berhad": "6005"
};

/**
 * Builds standard Billet Cutting Specs directly from IQA-01 incoming inspection history
 * and IQA-01 grade specifications.
 */
export function buildIqaCuttingSpecs(
  historyItems: any[] = [],
  gradeSpecsMap: Record<string, any> = {}
): Record<string, BilletCuttingSpec> {
  const result: Record<string, BilletCuttingSpec> = {};
  const pairs = new Map<string, { supplier: string; grade: string; size?: string }>();

  // 1. Defaults first
  Object.entries(IQA_SUPPLIER_GRADE_MAP).forEach(([sup, grd]) => {
    pairs.set(`${sup.trim()}__${grd.trim()}`, { supplier: sup.trim(), grade: grd.trim() });
  });

  // 2. Scan IQA-01 incoming inspection history
  if (Array.isArray(historyItems)) {
    historyItems.forEach(item => {
      const sup = (item.supplier_name || '').trim();
      const grd = (item.grade || '').trim();
      if (sup && grd) {
        pairs.set(`${sup}__${grd}`, { supplier: sup, grade: grd, size: item.billet_size });
      } else if (sup) {
        pairs.set(`${sup}__6063`, { supplier: sup, grade: '6063' });
      }
    });
  }

  // 3. Include any standalone grades from gradeSpecsMap
  const existingGrades = Array.from(pairs.values()).map(p => p.grade);
  Object.keys(gradeSpecsMap || {}).forEach(grd => {
    const cleanGrd = grd.trim();
    if (cleanGrd && cleanGrd !== 'NEW_GRADE_PENDING' && !existingGrades.includes(cleanGrd)) {
      pairs.set(`Standard Grade__${cleanGrd}`, { supplier: 'Standard Grade', grade: cleanGrd });
    }
  });

  // 4. Generate Billet Cutting Spec for each pair
  pairs.forEach(({ supplier, grade, size }) => {
    let diaNom = '127.0';
    let diaMin = '125.5';
    let diaMax = '128.5';
    let lenNom = '500';
    let lenMin = '498.0';
    let lenMax = '502.0';

    if (size) {
      if (size.includes('152') || size.includes('6')) {
        diaNom = '152.0'; diaMin = '150.5'; diaMax = '153.5';
        lenNom = '600'; lenMin = '598.0'; lenMax = '602.0';
      } else if (size.includes('178') || size.includes('7')) {
        diaNom = '178.0'; diaMin = '176.0'; diaMax = '180.0';
        lenNom = '600'; lenMin = '598.0'; lenMax = '602.0';
      } else if (size.includes('203') || size.includes('8')) {
        diaNom = '203.0'; diaMin = '201.0'; diaMax = '205.0';
        lenNom = '650'; lenMin = '648.0'; lenMax = '652.0';
      }
    } else if (grade === '6061') {
      diaNom = '152.0'; diaMin = '150.5'; diaMax = '153.5';
      lenNom = '600'; lenMin = '598.0'; lenMax = '602.0';
    } else if (grade === '6082') {
      diaNom = '178.0'; diaMin = '176.0'; diaMax = '180.0';
      lenNom = '600'; lenMin = '598.0'; lenMax = '602.0';
    }

    const bending = (parseFloat(lenNom) * 0.0015).toFixed(2);
    const key = `${supplier} (${grade})`;

    result[key] = {
      id: `spec-iqa-${supplier.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${grade}`,
      name: supplier,
      billetGrade: grade,
      lengthNominal: lenNom,
      lengthMin: lenMin,
      lengthMax: lenMax,
      diameterNominal: diaNom,
      diameterMin: diaMin,
      diameterMax: diaMax,
      bendingMax: bending,
      cuttingSurfaceMax: '2.0',
      surfaceDefectSpecText: '≤ 2x50x100 mm',
      surfaceDefectMaxDepth: '2.0',
      surfaceDefectMaxWidth: '50.0',
      surfaceDefectMaxLength: '100.0',
      remarks: `Auto-synced from IQA-01 Billet Incoming • Supplier: ${supplier} • Grade: ${grade}`
    };
  });

  return result;
}

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
