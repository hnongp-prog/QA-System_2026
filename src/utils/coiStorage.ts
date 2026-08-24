import {
  CoiProfileDesign,
  CoiIssueRecord,
  CoiCustomerTemplate,
  DetailedCoiMeasuredData,
  CoiDataSourceModule
} from '../types';
import { saveCloudData, subscribeToCloudData } from '../services/firestoreSync';

const STORAGE_PROFILES_KEY = 'coi_profiles_master_v1';
const STORAGE_RECORDS_KEY = 'coi_issued_records_v1';
const STORAGE_CUSTOMER_TEMPLATES_KEY = 'coi_customer_templates_v2';

// ----------------------------------------------------
// DEFAULT CUSTOMER TEMPLATES (Matching Attached Spec)
// ----------------------------------------------------
export const DEFAULT_CUSTOMER_TEMPLATES: CoiCustomerTemplate[] = [
  {
    id: 'cust-denso',
    customerId: 'CUST-DENSO-JP',
    customerName: 'DENSO JAPAN',
    customerAddress: '1-1, Showa-cho, Kariya, Aichi 448-8661, Japan',
    partNumber: '250428002JP-DS-01',
    productName: 'Aluminum Alloy Multi Port Extrusion Tube',
    standardRef: '250428002JP / Version 2 / Date 2025/06/23',
    heatNoMaterialCode: 'CA105-H112',
    drawingNoRevision: 'DWG-250428 / Rev.2',
    defaultLength: '650.0 mm',
    coatingType: 'Zn Spray + Flux Coat',
    cutEndType: 'No End Forming',
    companyNameHeader: 'UACJ Extrusion (Thailand)Co.,Ltd',
    sectionNameHeader: 'Quality Assurance section',
    documentControlNo: 'M-QA-(DS)-01/06 ED:15-Jan-2025 Rev.0',
    updatedAt: '2026-08-20T10:00:00.000Z',

    // 1. Chemical Specs (wt%) [Linked to IQA-01]
    chemicalSpecs: {
      si: { max: 0.15, linkSource: 'IQA-01' },
      fe: { max: 0.20, linkSource: 'IQA-01' },
      cu: { min: 0.40, max: 0.55, linkSource: 'IQA-01' },
      mn: { min: 0.10, max: 0.20, linkSource: 'IQA-01' },
      mg: { max: 0.03, linkSource: 'IQA-01' },
      cr: { max: 0.05, linkSource: 'IQA-01' },
      zn: { max: 0.04, linkSource: 'IQA-01' },
      ti: { max: 0.03, linkSource: 'IQA-01' },
      otherEach: { max: 0.05, linkSource: 'IQA-01' },
      otherTotal: { max: 0.15, linkSource: 'IQA-01' },
      alRemain: { text: 'Al remain', linkSource: 'IQA-01' }
    },

    // 2. Mechanical & Roughness Specs [Linked to IPQA-01, IPQA-02]
    mechanicalSpecs: {
      tensileMin: 78.0,
      yieldMin: 20.0,
      elongationMin: 10.0,
      eddyCurrentTest: 'OK',
      roughnessRzTopMax: 14.0,
      roughnessRzBottomMax: 14.0,
      linkSourceMech: 'IPQA-01',
      linkSourceRoughness: 'IPQA-02'
    },

    // 3. Zn Spray & Flux Coating Specs [Linked to IPQA-03, IPQA-04]
    coatingSpecs: {
      znAdhesionWeightSpec: '11.5 ± 2 g/m² (9.5- 13.5 g/m²)',
      znAdhesionWeightMin: 9.5,
      znAdhesionWeightMax: 13.5,
      znAreaRatioSpec: '≥ 58%',
      znAreaRatioMin: 58.0,
      fluxLotMaterial: 'Material: Flux',
      fluxAdhesionWeightSpec: '5 ± 2 g/m² (3 - 7 g/m²)',
      fluxAdhesionWeightMin: 3.0,
      fluxAdhesionWeightMax: 7.0,
      coatingAdhesionSpec: 'Pencil hardness test: 3B',
      linkSourceZn: 'IPQA-03',
      linkSourceFlux: 'IPQA-04'
    },

    // 4. Web Thickness Specs (mm) [Linked to IPQA-07]
    webThicknessSpecs: {
      outerWebT1Spec: '0.225 ± 0.05 (0.175 - 0.275)',
      outerWebT1Min: 0.175,
      outerWebT1Max: 0.275,
      outerWebT2Spec: '0.225 ± 0.05 (0.175 - 0.275)',
      outerWebT2Min: 0.175,
      outerWebT2Max: 0.275,
      sideWebT3Spec: '0.62 ± 0.05 (0.57 - 0.67)',
      sideWebT3Min: 0.57,
      sideWebT3Max: 0.67,
      sideWebT4Spec: '0.62 ± 0.05 (0.57 - 0.67)',
      sideWebT4Min: 0.57,
      sideWebT4Max: 0.67,
      innerWebSpec: '0.25 +0.07/-0.03 (0.22 - 0.32)',
      innerWebMin: 0.22,
      innerWebMax: 0.32,
      innerWebSlotsCount: 12,
      linkSource: 'IPQA-07'
    },

    // 5. Hole Geometry Specs [Linked to IPQA-05 / IPQA-07]
    holeSpecs: {
      innerHoleWidthSpec: '11 x (1.06 mm)',
      innerHoleWidthMin: 1.02,
      innerHoleWidthMax: 1.10,
      outerHoleWidthSpec: '2 x (0.815 mm)',
      outerHoleWidthMin: 0.78,
      outerHoleWidthMax: 0.85,
      innerHoleRadiusSpec: '48 x (R 0.10 Min)',
      innerHoleRadiusMin: 0.10,
      innerHoleRadiusMax: 0.20,
      linkSource: 'IPQA-05'
    },

    // 6. Geometry & Form Deviation Specs [Linked to IPQA-05 & OQA-01]
    geometrySpecs: {
      lengthToleranceMm: 1.0,
      portOpenAreaSpec: 'Port open area (over 50%) [After cutting cross section ≥6.45 mm²]',
      portOpenAreaMin: 6.45,
      widthAt5mmSpec: '14.8 ± 0.05 mm (14.75 - 14.85 mm)',
      widthMin: 14.75,
      widthMax: 14.85,
      heightAt5mmSpec: '1.74 ± 0.015 mm (1.725 - 1.755 mm)',
      heightMin: 1.725,
      heightMax: 1.755,
      warpMaxMm: 1.0,
      curvedMinMm: -0.7,
      curvedMaxMm: 0.3,
      twistMaxMm: 1.7,
      undulationMaxMm: 0.2,
      burrFreeRequirement: 'Cut End Tube Burr Free: OK',
      linkSource: 'IPQA-05'
    }
  },
  {
    id: 'cust-toyota',
    customerId: 'CUST-TOYOTA-TH',
    customerName: 'TOYOTA AUTO BODY THAILAND',
    customerAddress: 'Gateway City Industrial Estate, Chachoengsao 24140, Thailand',
    partNumber: 'TOY-HX-88210-A',
    productName: 'Aluminum Multi-Port Condenser Tube 16-Port',
    standardRef: 'TS-STD-2025-04 / Rev. 3 / Date 2025/11/15',
    heatNoMaterialCode: 'CA105-H112',
    drawingNoRevision: 'DWG-TOY-88210 / Rev.3',
    defaultLength: '580.0 mm',
    coatingType: 'Zn Thermal Spray + Flux Coated',
    cutEndType: 'Precision Saw Cut Burr Free',
    companyNameHeader: 'UACJ Extrusion (Thailand)Co.,Ltd',
    sectionNameHeader: 'Quality Assurance section',
    documentControlNo: 'M-QA-(TOY)-02/04 ED:01-Feb-2025 Rev.1',
    updatedAt: '2026-08-19T14:00:00.000Z',
    chemicalSpecs: {
      si: { max: 0.15, linkSource: 'IQA-01' },
      fe: { max: 0.20, linkSource: 'IQA-01' },
      cu: { min: 0.40, max: 0.55, linkSource: 'IQA-01' },
      mn: { min: 0.10, max: 0.20, linkSource: 'IQA-01' },
      mg: { max: 0.03, linkSource: 'IQA-01' },
      cr: { max: 0.05, linkSource: 'IQA-01' },
      zn: { max: 0.04, linkSource: 'IQA-01' },
      ti: { max: 0.03, linkSource: 'IQA-01' },
      otherEach: { max: 0.05, linkSource: 'IQA-01' },
      otherTotal: { max: 0.15, linkSource: 'IQA-01' },
      alRemain: { text: 'Al remain', linkSource: 'IQA-01' }
    },
    mechanicalSpecs: {
      tensileMin: 80.0,
      yieldMin: 22.0,
      elongationMin: 12.0,
      eddyCurrentTest: 'OK',
      roughnessRzTopMax: 12.0,
      roughnessRzBottomMax: 12.0,
      linkSourceMech: 'IPQA-01',
      linkSourceRoughness: 'IPQA-02'
    },
    coatingSpecs: {
      znAdhesionWeightSpec: '12.0 ± 2 g/m² (10.0 - 14.0 g/m²)',
      znAdhesionWeightMin: 10.0,
      znAdhesionWeightMax: 14.0,
      znAreaRatioSpec: '≥ 60%',
      znAreaRatioMin: 60.0,
      fluxLotMaterial: 'Material: Nocolok Flux',
      fluxAdhesionWeightSpec: '5.5 ± 1.5 g/m² (4.0 - 7.0 g/m²)',
      fluxAdhesionWeightMin: 4.0,
      fluxAdhesionWeightMax: 7.0,
      coatingAdhesionSpec: 'Pencil hardness test: 3B',
      linkSourceZn: 'IPQA-03',
      linkSourceFlux: 'IPQA-04'
    },
    webThicknessSpecs: {
      outerWebT1Spec: '0.24 ± 0.04 (0.20 - 0.28)',
      outerWebT1Min: 0.20,
      outerWebT1Max: 0.28,
      outerWebT2Spec: '0.24 ± 0.04 (0.20 - 0.28)',
      outerWebT2Min: 0.20,
      outerWebT2Max: 0.28,
      sideWebT3Spec: '0.65 ± 0.05 (0.60 - 0.70)',
      sideWebT3Min: 0.60,
      sideWebT3Max: 0.70,
      sideWebT4Spec: '0.65 ± 0.05 (0.60 - 0.70)',
      sideWebT4Min: 0.60,
      sideWebT4Max: 0.70,
      innerWebSpec: '0.26 +0.06/-0.03 (0.23 - 0.32)',
      innerWebMin: 0.23,
      innerWebMax: 0.32,
      innerWebSlotsCount: 12,
      linkSource: 'IPQA-07'
    },
    holeSpecs: {
      innerHoleWidthSpec: '11 x (1.10 mm)',
      innerHoleWidthMin: 1.05,
      innerHoleWidthMax: 1.15,
      outerHoleWidthSpec: '2 x (0.85 mm)',
      outerHoleWidthMin: 0.80,
      outerHoleWidthMax: 0.90,
      innerHoleRadiusSpec: '48 x (R 0.10 Min)',
      innerHoleRadiusMin: 0.10,
      innerHoleRadiusMax: 0.22,
      linkSource: 'IPQA-05'
    },
    geometrySpecs: {
      lengthToleranceMm: 1.0,
      portOpenAreaSpec: 'Port open area (over 50%) [≥ 6.80 mm²]',
      portOpenAreaMin: 6.80,
      widthAt5mmSpec: '16.0 ± 0.05 mm (15.95 - 16.05 mm)',
      widthMin: 15.95,
      widthMax: 16.05,
      heightAt5mmSpec: '1.80 ± 0.015 mm (1.785 - 1.815 mm)',
      heightMin: 1.785,
      heightMax: 1.815,
      warpMaxMm: 0.8,
      curvedMinMm: -0.5,
      curvedMaxMm: 0.3,
      twistMaxMm: 1.5,
      undulationMaxMm: 0.15,
      burrFreeRequirement: 'Cut End Tube Burr Free: OK',
      linkSource: 'IPQA-05'
    }
  },
  {
    id: 'cust-valeo',
    customerId: 'CUST-VALEO-TH',
    customerName: 'VALEO THERMAL SYSTEMS',
    customerAddress: 'Amata City Rayong Industrial Estate, Rayong 21140, Thailand',
    partNumber: 'VAL-MP-18X1.75',
    productName: 'Aluminum Multi-Port Microchannel Radiator Tube',
    standardRef: 'VAL-ENG-SPEC-4402 / Rev. 4 / Date 2025/08/10',
    heatNoMaterialCode: 'CA105-H112',
    drawingNoRevision: 'DWG-VAL-4402 / Rev.4',
    defaultLength: '720.0 mm',
    coatingType: 'Zn Thermal Spray + Flux Coated',
    cutEndType: 'No End Forming',
    companyNameHeader: 'UACJ Extrusion (Thailand)Co.,Ltd',
    sectionNameHeader: 'Quality Assurance section',
    documentControlNo: 'M-QA-(VAL)-03/01 ED:10-Aug-2025 Rev.0',
    updatedAt: '2026-08-18T11:00:00.000Z',
    chemicalSpecs: {
      si: { max: 0.15, linkSource: 'IQA-01' },
      fe: { max: 0.20, linkSource: 'IQA-01' },
      cu: { min: 0.40, max: 0.55, linkSource: 'IQA-01' },
      mn: { min: 0.10, max: 0.20, linkSource: 'IQA-01' },
      mg: { max: 0.03, linkSource: 'IQA-01' },
      cr: { max: 0.05, linkSource: 'IQA-01' },
      zn: { max: 0.04, linkSource: 'IQA-01' },
      ti: { max: 0.03, linkSource: 'IQA-01' },
      otherEach: { max: 0.05, linkSource: 'IQA-01' },
      otherTotal: { max: 0.15, linkSource: 'IQA-01' },
      alRemain: { text: 'Al remain', linkSource: 'IQA-01' }
    },
    mechanicalSpecs: {
      tensileMin: 78.0,
      yieldMin: 20.0,
      elongationMin: 10.0,
      eddyCurrentTest: 'OK',
      roughnessRzTopMax: 14.0,
      roughnessRzBottomMax: 14.0,
      linkSourceMech: 'IPQA-01',
      linkSourceRoughness: 'IPQA-02'
    },
    coatingSpecs: {
      znAdhesionWeightSpec: '11.5 ± 2 g/m² (9.5 - 13.5 g/m²)',
      znAdhesionWeightMin: 9.5,
      znAdhesionWeightMax: 13.5,
      znAreaRatioSpec: '≥ 58%',
      znAreaRatioMin: 58.0,
      fluxLotMaterial: 'Material: Flux',
      fluxAdhesionWeightSpec: '5 ± 2 g/m² (3 - 7 g/m²)',
      fluxAdhesionWeightMin: 3.0,
      fluxAdhesionWeightMax: 7.0,
      coatingAdhesionSpec: 'Pencil hardness test: 3B',
      linkSourceZn: 'IPQA-03',
      linkSourceFlux: 'IPQA-04'
    },
    webThicknessSpecs: {
      outerWebT1Spec: '0.225 ± 0.05 (0.175 - 0.275)',
      outerWebT1Min: 0.175,
      outerWebT1Max: 0.275,
      outerWebT2Spec: '0.225 ± 0.05 (0.175 - 0.275)',
      outerWebT2Min: 0.175,
      outerWebT2Max: 0.275,
      sideWebT3Spec: '0.62 ± 0.05 (0.57 - 0.67)',
      sideWebT3Min: 0.57,
      sideWebT3Max: 0.67,
      sideWebT4Spec: '0.62 ± 0.05 (0.57 - 0.67)',
      sideWebT4Min: 0.57,
      sideWebT4Max: 0.67,
      innerWebSpec: '0.25 +0.07/-0.03 (0.22 - 0.32)',
      innerWebMin: 0.22,
      innerWebMax: 0.32,
      innerWebSlotsCount: 12,
      linkSource: 'IPQA-07'
    },
    holeSpecs: {
      innerHoleWidthSpec: '11 x (1.06 mm)',
      innerHoleWidthMin: 1.02,
      innerHoleWidthMax: 1.10,
      outerHoleWidthSpec: '2 x (0.815 mm)',
      outerHoleWidthMin: 0.78,
      outerHoleWidthMax: 0.85,
      innerHoleRadiusSpec: '48 x (R 0.10 Min)',
      innerHoleRadiusMin: 0.10,
      innerHoleRadiusMax: 0.20,
      linkSource: 'IPQA-05'
    },
    geometrySpecs: {
      lengthToleranceMm: 1.0,
      portOpenAreaSpec: 'Port open area (over 50%) [≥ 6.45 mm²]',
      portOpenAreaMin: 6.45,
      widthAt5mmSpec: '14.8 ± 0.05 mm (14.75 - 14.85 mm)',
      widthMin: 14.75,
      widthMax: 14.85,
      heightAt5mmSpec: '1.74 ± 0.015 mm (1.725 - 1.755 mm)',
      heightMin: 1.725,
      heightMax: 1.755,
      warpMaxMm: 1.0,
      curvedMinMm: -0.7,
      curvedMaxMm: 0.3,
      twistMaxMm: 1.7,
      undulationMaxMm: 0.2,
      burrFreeRequirement: 'Cut End Tube Burr Free: OK',
      linkSource: 'IPQA-05'
    }
  }
];

// ----------------------------------------------------
// STORAGE OPERATIONS FOR CUSTOMER TEMPLATES
// ----------------------------------------------------
export function getCustomerTemplates(): CoiCustomerTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOMER_TEMPLATES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_CUSTOMER_TEMPLATES_KEY, JSON.stringify(DEFAULT_CUSTOMER_TEMPLATES));
      return DEFAULT_CUSTOMER_TEMPLATES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CUSTOMER_TEMPLATES;
  } catch {
    return DEFAULT_CUSTOMER_TEMPLATES;
  }
}

export function saveCustomerTemplate(template: CoiCustomerTemplate): CoiCustomerTemplate[] {
  const current = getCustomerTemplates();
  const index = current.findIndex(t => t.id === template.id || t.customerId === template.customerId);
  let updated: CoiCustomerTemplate[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...template, updatedAt: new Date().toISOString() };
  } else {
    updated = [template, ...current];
  }
  try {
    localStorage.setItem(STORAGE_CUSTOMER_TEMPLATES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save customer template', e);
  }
  saveCloudData(STORAGE_CUSTOMER_TEMPLATES_KEY, updated).catch(err => console.warn(err));
  return updated;
}

export function deleteCustomerTemplate(id: string): CoiCustomerTemplate[] {
  const current = getCustomerTemplates();
  const updated = current.filter(t => t.id !== id);
  try {
    localStorage.setItem(STORAGE_CUSTOMER_TEMPLATES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete customer template', e);
  }
  saveCloudData(STORAGE_CUSTOMER_TEMPLATES_KEY, updated).catch(err => console.warn(err));
  return updated;
}

export function resetCustomerTemplates(): CoiCustomerTemplate[] {
  try {
    localStorage.setItem(STORAGE_CUSTOMER_TEMPLATES_KEY, JSON.stringify(DEFAULT_CUSTOMER_TEMPLATES));
  } catch (e) {
    console.error(e);
  }
  saveCloudData(STORAGE_CUSTOMER_TEMPLATES_KEY, DEFAULT_CUSTOMER_TEMPLATES).catch(err => console.warn(err));
  return DEFAULT_CUSTOMER_TEMPLATES;
}

export function subscribeToCustomerTemplates(callback: (templates: CoiCustomerTemplate[]) => void) {
  return subscribeToCloudData<CoiCustomerTemplate[]>(
    STORAGE_CUSTOMER_TEMPLATES_KEY,
    (data) => {
      if (Array.isArray(data)) callback(data);
    },
    DEFAULT_CUSTOMER_TEMPLATES
  );
}

// ----------------------------------------------------
// GENERATOR & LIVE LINK FOR MEASURED DATA
// ----------------------------------------------------
export function generateDetailedMeasuredDataForCustomer(
  template: CoiCustomerTemplate,
  customInputs?: {
    workNo?: string;
    coilNo?: string;
    lengthMm?: string | number;
    heatNo?: string;
    invoiceNo?: string;
  }
): DetailedCoiMeasuredData {
  const workNo = customInputs?.workNo || 'W-2026-8831';
  const coilNo = customInputs?.coilNo || 'COIL-2026-A109';
  const heatNo = customInputs?.heatNo || 'HEAT-CA105-09';
  const lengthVal = customInputs?.lengthMm ? parseFloat(String(customInputs.lengthMm)) || 650.0 : 650.0;

  // 1. Chemical (from IQA-01 spectrometry)
  const chemActual = {
    si: 0.08,
    fe: 0.12,
    cu: 0.48,
    mn: 0.14,
    mg: 0.01,
    cr: 0.01,
    zn: 0.02,
    ti: 0.01,
    otherEach: 0.02,
    otherTotal: 0.06,
    alRemain: 'Rem.'
  };

  // 2. Mechanical (from IPQA-01)
  const mechActual = {
    tensileStrength: 104.5,
    yieldStress: 34.2,
    elongation: 15.8,
    eddyCurrent: 'OK',
    roughnessRzTop: 8.4,
    roughnessRzBottom: 7.9
  };

  // 3. Coating (from IPQA-03 & IPQA-04)
  const coatingActual = {
    znSprayDate: new Date().toISOString().slice(0, 10),
    head: {
      znAdhesionWeightTop: 11.8,
      znAdhesionWeightBottom: 11.4,
      znAdhesionAreaTop: 68.5,
      znAdhesionAreaBottom: 66.2,
      fluxAdhesionWeightTop: 5.2,
      fluxAdhesionWeightBottom: 4.9,
      coatingAdhesionTop: 'OK',
      coatingAdhesionBottom: 'OK'
    },
    tail: {
      znAdhesionWeightTop: 11.6,
      znAdhesionWeightBottom: 11.2,
      znAdhesionAreaTop: 67.8,
      znAdhesionAreaBottom: 65.4,
      fluxAdhesionWeightTop: 5.1,
      fluxAdhesionWeightBottom: 4.8,
      coatingAdhesionTop: 'OK',
      coatingAdhesionBottom: 'OK'
    },
    paintLotNo: 'LOT-FLX-2608',
    coatingDate: new Date().toISOString().slice(0, 10),
    materialFlux: 'Material: Flux'
  };

  // 4. Web Thickness (from IPQA-07)
  const webActual = {
    head: {
      t1: 0.228,
      t2: 0.231,
      t3: 0.622,
      t4: 0.618,
      innerWebs: [0.252, 0.248, 0.255, 0.251, 0.249, 0.253, 0.256, 0.250, 0.247, 0.254, 0.251, 0.249]
    },
    tail: {
      t1: 0.226,
      t2: 0.229,
      t3: 0.620,
      t4: 0.615,
      innerWebs: [0.250, 0.247, 0.253, 0.250, 0.248, 0.252, 0.254, 0.249, 0.246, 0.252, 0.250, 0.248]
    }
  };

  // 5. Hole Geometry (from IPQA-05 / IPQA-07)
  const holeActual = {
    head: {
      innerHoleWidthMin: 1.04,
      innerHoleWidthMax: 1.08,
      outerHoleWidthMin: 0.80,
      outerHoleWidthMax: 0.83,
      innerHoleRadiusMin: 0.12,
      innerHoleRadiusMax: 0.16
    },
    tail: {
      innerHoleWidthMin: 1.05,
      innerHoleWidthMax: 1.07,
      outerHoleWidthMin: 0.81,
      outerHoleWidthMax: 0.84,
      innerHoleRadiusMin: 0.11,
      innerHoleRadiusMax: 0.15
    }
  };

  // 6. Geometry & Form Deviations (from IPQA-05 & OQA-01)
  const geometryActual = {
    head: {
      lengthMm: lengthVal,
      portOpenAreaLeft: 7.24,
      portOpenAreaRight: 7.18,
      widthLeft: 14.81,
      widthRight: 14.79,
      heightLeft: 1.738,
      heightRight: 1.742,
      warpMm: 0.42,
      curvedMm: -0.15,
      twistMm: 0.65,
      undulationMm: 0.08,
      burrFreeLeft: 'OK',
      burrFreeRight: 'OK'
    },
    tail: {
      lengthMm: lengthVal,
      portOpenAreaLeft: 7.21,
      portOpenAreaRight: 7.15,
      widthLeft: 14.80,
      widthRight: 14.82,
      heightLeft: 1.740,
      heightRight: 1.739,
      warpMm: 0.38,
      curvedMm: -0.12,
      twistMm: 0.58,
      undulationMm: 0.07,
      burrFreeLeft: 'OK',
      burrFreeRight: 'OK'
    }
  };

  return {
    workNo,
    coilNo,
    drawingNoRevision: template.drawingNoRevision,
    lengthMm: lengthVal,
    coatingType: template.coatingType,
    cutEnd: template.cutEndType,
    inspectionDimension: 'OK',
    inspectionCoating: 'OK',
    inspectionAppearance: 'OK',
    heatNo,
    materialCode: template.heatNoMaterialCode,
    chemActual,
    mechActual,
    coatingActual,
    webActual,
    holeActual,
    geometryActual
  };
}

// ----------------------------------------------------
// DEFAULT PROFILES (LEGACY & EXTENDED COMPATIBILITY)
// ----------------------------------------------------
export const DEFAULT_COI_PROFILES: CoiProfileDesign[] = [
  {
    id: 'prof-001',
    profileCode: 'PROFILE-A-001',
    profileName: 'Profile A-001 (Multi Port Extrusion Tube CA105-H112)',
    alloyGrade: 'CA105',
    temper: 'H112',
    standardRef: '250428002JP / Version 2 / JIS H4100',
    customerDefault: 'DENSO JAPAN',
    defaultLength: '650.0 mm',
    descriptionTh: 'ท่อ Multi Port Tube เคลือบสาร Zn Spray และ Flux Coat ตามสเปก Denso Japan',
    updatedAt: '2026-08-20T10:00:00.000Z',
    testItems: [
      { id: 'item-c1', category: 'CHEMICAL', parameterKey: 'Si', nameTh: 'ซิลิคอน (Si)', nameEn: 'Silicon (Si)', unit: '%', maxVal: 0.15, testMethod: 'OES / ASTM E1251', isRequired: true, sortOrder: 1, linkSource: 'IQA-01' },
      { id: 'item-c2', category: 'CHEMICAL', parameterKey: 'Fe', nameTh: 'เหล็ก (Fe)', nameEn: 'Iron (Fe)', unit: '%', maxVal: 0.20, testMethod: 'OES / ASTM E1251', isRequired: true, sortOrder: 2, linkSource: 'IQA-01' },
      { id: 'item-c3', category: 'CHEMICAL', parameterKey: 'Cu', nameTh: 'ทองแดง (Cu)', nameEn: 'Copper (Cu)', unit: '%', minVal: 0.40, maxVal: 0.55, testMethod: 'OES / ASTM E1251', isRequired: true, sortOrder: 3, linkSource: 'IQA-01' },
      { id: 'item-c4', category: 'CHEMICAL', parameterKey: 'Mn', nameTh: 'แมงกานีส (Mn)', nameEn: 'Manganese (Mn)', unit: '%', minVal: 0.10, maxVal: 0.20, testMethod: 'OES / ASTM E1251', isRequired: true, sortOrder: 4, linkSource: 'IQA-01' },
      { id: 'item-c5', category: 'CHEMICAL', parameterKey: 'Mg', nameTh: 'แมกนีเซียม (Mg)', nameEn: 'Magnesium (Mg)', unit: '%', maxVal: 0.03, testMethod: 'OES / ASTM E1251', isRequired: true, sortOrder: 5, linkSource: 'IQA-01' },
      { id: 'item-m1', category: 'MECHANICAL', parameterKey: 'Tensile_Strength', nameTh: 'แรงดึง (Tensile strength)', nameEn: 'Tensile Strength', unit: 'N/mm²', minVal: 78.0, testMethod: 'JIS Z2241', isRequired: true, sortOrder: 6, linkSource: 'IPQA-01' },
      { id: 'item-m2', category: 'MECHANICAL', parameterKey: 'Yield_Stress', nameTh: 'แรงคราก (Yield stress)', nameEn: 'Yield Stress', unit: 'N/mm²', minVal: 20.0, testMethod: 'JIS Z2241', isRequired: true, sortOrder: 7, linkSource: 'IPQA-01' },
      { id: 'item-m3', category: 'MECHANICAL', parameterKey: 'Elongation', nameTh: 'การยืดตัว (Elongation)', nameEn: 'Elongation', unit: '%', minVal: 10.0, testMethod: 'JIS Z2241', isRequired: true, sortOrder: 8, linkSource: 'IPQA-01' },
      { id: 'item-s1', category: 'SURFACE_COATING', parameterKey: 'Roughness_Rz_Top', nameTh: 'ความหยาบผิว Rz บน', nameEn: 'Surface Roughness Rz (Top)', unit: 'µm', maxVal: 14.0, testMethod: 'ISO 4287', isRequired: true, sortOrder: 9, linkSource: 'IPQA-02' },
      { id: 'item-s2', category: 'SURFACE_COATING', parameterKey: 'Zn_Adhesion_Weight', nameTh: 'น้ำหนักการยึดเกาะ Zn', nameEn: 'Zn adhesion weight', unit: 'g/m²', minVal: 9.5, maxVal: 13.5, testMethod: 'XRF / ISO 3497', isRequired: true, sortOrder: 10, linkSource: 'IPQA-03' },
      { id: 'item-d1', category: 'DIMENSION', parameterKey: 'Outer_Web_T1', nameTh: 'ความหนาผนังนอก T1', nameEn: 'Outer web thickness T1', unit: 'mm', minVal: 0.175, maxVal: 0.275, testMethod: 'Micrometer', isRequired: true, sortOrder: 11, linkSource: 'IPQA-07' },
      { id: 'item-d2', category: 'DIMENSION', parameterKey: 'Width_At_5mm', nameTh: 'ความกว้าง (5mm from cut end)', nameEn: 'Width at 5mm', unit: 'mm', minVal: 14.75, maxVal: 14.85, testMethod: 'Vernier Caliper', isRequired: true, sortOrder: 12, linkSource: 'IPQA-05' },
      { id: 'item-d3', category: 'DIMENSION', parameterKey: 'Height_At_5mm', nameTh: 'ความสูง (5mm from cut end)', nameEn: 'Height at 5mm', unit: 'mm', minVal: 1.725, maxVal: 1.755, testMethod: 'Vernier Caliper', isRequired: true, sortOrder: 13, linkSource: 'IPQA-05' }
    ]
  }
];

export const INITIAL_COI_RECORDS: CoiIssueRecord[] = [
  {
    id: 'coi-rec-20260820-001',
    coiNo: 'COI-20260820-001',
    issueDate: '2026-08-20',
    productionDate: '2026-08-19',
    customerName: 'DENSO JAPAN',
    customerAddress: '1-1, Showa-cho, Kariya, Aichi 448-8661, Japan',
    poNo: 'PO-2026-DENSO-7789',
    invoiceDoNo: 'INV-2026-08-0442',
    profileCode: '250428002JP-DS-01',
    profileName: 'Aluminum Alloy Multi Port Extrusion Tube',
    alloyGrade: 'CA105',
    temper: 'H112',
    standardRef: '250428002JP / Version 2 / Date 2025/06/23',
    coilNo: 'COIL-2026-A109',
    heatNo: 'HEAT-CA105-09',
    length: '650.0 mm',
    quantityPcs: '2,400 Pcs',
    totalWeightKg: '1,820.00 kg',
    inspectorName: 'Kittisak N. (Senior QA Inspector)',
    approverName: 'Dr. Wirote Charoensuk (QA Manager)',
    overallResult: 'PASS',
    remarks: 'Material conforms to 250428002JP Version 2 in all chemical, mechanical, coating and dimensional inspection.',
    qrVerificationCode: 'VERIFY-COI-20260820-001-A109-ALPHA-PASSED',
    createdAt: '2026-08-20T10:15:00.000Z',
    customerTemplateId: 'cust-denso',
    partNumber: '250428002JP-DS-01',
    productName: 'Aluminum Alloy Multi Port Extrusion Tube',
    workNo: 'W-2026-8831',
    coatingType: 'Zn Spray + Flux Coat',
    cutEndType: 'No End Forming',
    drawingNoRevision: 'DWG-250428 / Rev.2',
    companyHeader: 'UACJ Extrusion (Thailand)Co.,Ltd',
    qaSectionHeader: 'Quality Assurance section',
    docControlNo: 'M-QA-(DS)-01/06 ED:15-Jan-2025 Rev.0',
    detailedData: generateDetailedMeasuredDataForCustomer(DEFAULT_CUSTOMER_TEMPLATES[0], {
      workNo: 'W-2026-8831',
      coilNo: 'COIL-2026-A109',
      lengthMm: '650.0 mm',
      heatNo: 'HEAT-CA105-09',
      invoiceNo: 'INV-2026-08-0442'
    }),
    items: [
      { id: 'r1', category: 'CHEMICAL', parameterKey: 'Si', nameTh: 'ซิลิคอน (Si)', nameEn: 'Silicon (Si)', unit: '%', specText: 'Max 0.15', actualValue: 0.08, testMethod: 'OES', isPass: true, linkSource: 'IQA-01' },
      { id: 'r2', category: 'CHEMICAL', parameterKey: 'Fe', nameTh: 'เหล็ก (Fe)', nameEn: 'Iron (Fe)', unit: '%', specText: 'Max 0.20', actualValue: 0.12, testMethod: 'OES', isPass: true, linkSource: 'IQA-01' },
      { id: 'r3', category: 'CHEMICAL', parameterKey: 'Cu', nameTh: 'ทองแดง (Cu)', nameEn: 'Copper (Cu)', unit: '%', specText: '0.40 - 0.55', actualValue: 0.48, testMethod: 'OES', isPass: true, linkSource: 'IQA-01' },
      { id: 'r4', category: 'CHEMICAL', parameterKey: 'Mn', nameTh: 'แมงกานีส (Mn)', nameEn: 'Manganese (Mn)', unit: '%', specText: '0.10 - 0.20', actualValue: 0.14, testMethod: 'OES', isPass: true, linkSource: 'IQA-01' },
      { id: 'r5', category: 'MECHANICAL', parameterKey: 'Tensile_Strength', nameTh: 'แรงดึง (Tensile strength)', nameEn: 'Tensile Strength', unit: 'N/mm²', specText: 'Min 78.0', actualValue: 104.5, testMethod: 'JIS Z2241', isPass: true, linkSource: 'IPQA-01' },
      { id: 'r6', category: 'SURFACE_COATING', parameterKey: 'Roughness_Rz_Top', nameTh: 'ความหยาบผิว Rz บน', nameEn: 'Roughness Rz (Top)', unit: 'µm', specText: '≤ 14 µm', actualValue: 8.4, testMethod: 'ISO 4287', isPass: true, linkSource: 'IPQA-02' },
      { id: 'r7', category: 'SURFACE_COATING', parameterKey: 'Zn_Adhesion_Weight', nameTh: 'น้ำหนักชั้นเคลือบ Zn', nameEn: 'Zn adhesion weight', unit: 'g/m²', specText: '9.5 - 13.5', actualValue: 11.8, testMethod: 'XRF', isPass: true, linkSource: 'IPQA-03' },
      { id: 'r8', category: 'DIMENSION', parameterKey: 'Outer_Web_T1', nameTh: 'ความหนาผนังนอก T1', nameEn: 'Outer web T1', unit: 'mm', specText: '0.175 - 0.275', actualValue: 0.228, testMethod: 'Micrometer', isPass: true, linkSource: 'IPQA-07' },
      { id: 'r9', category: 'DIMENSION', parameterKey: 'Width_At_5mm', nameTh: 'ความกว้างที่ 5mm', nameEn: 'Width at 5mm', unit: 'mm', specText: '14.75 - 14.85', actualValue: 14.81, testMethod: 'Caliper', isPass: true, linkSource: 'IPQA-05' }
    ]
  }
];

export function getCoiProfiles(): CoiProfileDesign[] {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(DEFAULT_COI_PROFILES));
      return DEFAULT_COI_PROFILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COI_PROFILES;
  } catch {
    return DEFAULT_COI_PROFILES;
  }
}

export function saveCoiProfile(profile: CoiProfileDesign): CoiProfileDesign[] {
  const current = getCoiProfiles();
  const index = current.findIndex(p => p.id === profile.id || p.profileCode === profile.profileCode);
  let updated: CoiProfileDesign[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...profile, updatedAt: new Date().toISOString() };
  } else {
    updated = [profile, ...current];
  }
  try {
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save COI profile', e);
  }
  saveCloudData(STORAGE_PROFILES_KEY, updated).catch(err => console.warn(err));
  return updated;
}

export function deleteCoiProfile(profileId: string): CoiProfileDesign[] {
  const current = getCoiProfiles();
  const updated = current.filter(p => p.id !== profileId);
  try {
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete COI profile', e);
  }
  saveCloudData(STORAGE_PROFILES_KEY, updated).catch(err => console.warn(err));
  return updated;
}

export function resetCoiProfilesToDefault(): CoiProfileDesign[] {
  try {
    localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(DEFAULT_COI_PROFILES));
  } catch (e) {
    console.error(e);
  }
  saveCloudData(STORAGE_PROFILES_KEY, DEFAULT_COI_PROFILES).catch(err => console.warn(err));
  return DEFAULT_COI_PROFILES;
}

export function subscribeToCoiProfiles(callback: (profiles: CoiProfileDesign[]) => void) {
  return subscribeToCloudData<CoiProfileDesign[]>(
    STORAGE_PROFILES_KEY,
    (data) => {
      if (Array.isArray(data)) callback(data);
    },
    DEFAULT_COI_PROFILES
  );
}

export function getCoiRecords(): CoiIssueRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECORDS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(INITIAL_COI_RECORDS));
      return INITIAL_COI_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_COI_RECORDS;
  } catch {
    return INITIAL_COI_RECORDS;
  }
}

export function saveCoiRecord(record: CoiIssueRecord): CoiIssueRecord[] {
  const current = getCoiRecords();
  const index = current.findIndex(r => r.id === record.id || r.coiNo === record.coiNo);
  let updated: CoiIssueRecord[];
  if (index >= 0) {
    updated = [...current];
    updated[index] = record;
  } else {
    updated = [record, ...current];
  }
  try {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save COI record', e);
  }
  saveCloudData(STORAGE_RECORDS_KEY, updated).catch(err => console.warn(err));
  return updated;
}

export function deleteCoiRecord(recordId: string): CoiIssueRecord[] {
  const current = getCoiRecords();
  const updated = current.filter(r => r.id !== recordId);
  try {
    localStorage.setItem(STORAGE_RECORDS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete COI record', e);
  }
  saveCloudData(STORAGE_RECORDS_KEY, updated).catch(err => console.warn(err));
  return updated;
}

export function subscribeToCoiRecords(callback: (records: CoiIssueRecord[]) => void) {
  return subscribeToCloudData<CoiIssueRecord[]>(
    STORAGE_RECORDS_KEY,
    (data) => {
      if (Array.isArray(data)) callback(data);
    },
    INITIAL_COI_RECORDS
  );
}

export function generateNextCoiNumber(): string {
  const records = getCoiRecords();
  const today = new Date();
  const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `COI-${yyyymmdd}-`;
  const matchingToday = records.filter(r => r.coiNo.startsWith(prefix));
  const nextSeq = (matchingToday.length + 1).toString().padStart(3, '0');
  return `${prefix}${nextSeq}`;
}
